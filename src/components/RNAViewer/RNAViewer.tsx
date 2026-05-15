// src/components/RNAViewer/RNAViewer.tsx
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Download,
  FileImage,
  Layers,
  Ban,
  AlertTriangle,
  Activity,
  Users,
} from "lucide-react";
import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  COLORBLIND_FRIENDLY_PALETTE,
  generateGnomadColorWithAlpha,
} from "../../lib/colors";
import { findNucleotideById } from "../../lib/rnaUtils";
import type { RNAData, Nucleotide, OverlayData, Variant } from "../../types";
import BasePairBond from "./BasePairBond";
import NucleotideComponent from "./NucleotideComponent";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import "./RNAViewer.css";
import {
  getDistinctDiseaseTypes,
  getDistinctClinicalSignificances,
} from "@/services/api";

interface RNAViewerProps {
  rnaData: RNAData;
  pdbData?: any; // TODO: Define proper PDBStructure type
  overlayData?: OverlayData;
  onNucleotideClick?: (nucleotide: Nucleotide) => void;
  onNucleotideHover?: (nucleotide: Nucleotide | null) => void;
  overlayMode?: "none" | "clinvar" | "gnomad" | "depletion_group";
  onCycleOverlay?: () => void;
  variantData?: Variant[];
  gnomadVariants?: Variant[];
  selectedNucleotide?: Nucleotide | null;
  highlightedNucleotideIds?: number[];
  geneData: {
    id: string;
    name: string;
    chromosome: string;
    start: number;
    end: number;
    strand: string;
    sequence: string;
  };
}

const cyclesFromMode = (mode: string): number => {
  const modes = ["none", "clinvar", "gnomad", "depletion_group"];
  return modes.indexOf(mode);
};

const RNAViewer: React.FC<RNAViewerProps> = ({
  rnaData,
  pdbData: _pdbData,
  overlayData = {},
  onNucleotideClick,
  onNucleotideHover,
  overlayMode = "clinvar",
  onCycleOverlay,
  variantData = [],
  gnomadVariants = [],
  selectedNucleotide = null,
  highlightedNucleotideIds = [],
  geneData,
}) => {
  const [hoveredNucleotide, setHoveredNucleotide] = useState<Nucleotide | null>(
    null,
  );
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [showStructuralFeatures, setShowStructuralFeatures] = useState(true);

  const [diseaseTypes, setDiseaseTypes] = useState<string[]>([]);
  const [clinicalSignificances, setClinicalSignificances] = useState<string[]>(
    [],
  );
  const [selectedDiseaseType, setSelectedDiseaseType] = useState<string>("all");
  const [selectedClinicalSig, setSelectedClinicalSig] = useState<string>("all");
  const [selectedPopulationSource, setSelectedPopulationSource] =
    useState<string>("all");

  // Clinical Variants filters
  const [clinvarGroupBy, setClinvarGroupBy] = useState<string>("all");
  const [selectedZygosity, setSelectedZygosity] = useState<string>("all");

  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const [diseases, significances] = await Promise.all([
          getDistinctDiseaseTypes(),
          getDistinctClinicalSignificances(),
        ]);
        setDiseaseTypes(diseases);
        setClinicalSignificances(significances);
      } catch (error) {
        console.error("Error fetching filter options:", error);
      }
    };
    fetchFilterOptions();
  }, []);

  const getFilteredOverlayValue = useCallback(
    (nucleotideId: number): { value: number; variant?: Variant } => {
      if (overlayMode === "none") {
        return { value: 0 };
      }

      if (overlayMode === "clinvar") {
        const filteredVariants = variantData.filter((variant) => {
          if (!variant.position) return false;

          let nucleotidePos: number;
          if (
            variant.nucleotidePosition !== undefined &&
            variant.nucleotidePosition !== null
          ) {
            nucleotidePos = variant.nucleotidePosition;
          } else {
            if (geneData.strand === "-") {
              nucleotidePos = geneData.end - variant.position + 1;
            } else {
              nucleotidePos = variant.position - geneData.start + 1;
            }
          }

          if (nucleotidePos !== nucleotideId) return false;

          if (!variant.clinical_significance) return false;

          // Filter based on Group by selection
          if (clinvarGroupBy === "significance") {
            if (
              selectedClinicalSig !== "all" &&
              variant.clinical_significance !== selectedClinicalSig
            )
              return false;
          } else if (clinvarGroupBy === "disease") {
            if (
              selectedDiseaseType !== "all" &&
              variant.disease_type !== selectedDiseaseType
            )
              return false;
          }

          // Filter by zygosity
          if (selectedZygosity !== "all") {
            if (selectedZygosity === "het") {
              if (variant.zygosity !== "het") return false;
            } else if (selectedZygosity === "biallelic") {
              const isBiallelic =
                variant.zygosity === "hom" ||
                (variant.linkedVariantIds &&
                  variant.linkedVariantIds.length > 0);
              if (!isBiallelic) return false;
            }
          }

          return true;
        });

        if (filteredVariants.length === 0) return { value: 0 };

        const maxSignificance = filteredVariants.reduce((max, v) => {
          const significanceOrder: Record<string, number> = {
            Pathogenic: 4,
            "Likely Pathogenic": 3,
            VUS: 2,
            "Likely Benign": 1,
            Benign: 0,
          };
          const order = significanceOrder[v.clinical_significance!] ?? -1;
          const maxOrder = significanceOrder[max.clinical_significance!] ?? -1;
          return order > maxOrder ? v : max;
        }, filteredVariants[0]);

        const valueMap: Record<string, number> = {
          Pathogenic: 1,
          "Likely Pathogenic": 0.75,
          VUS: 0.25,
          "Likely Benign": 0.125,
          Benign: 0,
        };

        return {
          value: valueMap[maxSignificance.clinical_significance!] ?? 0,
          variant: maxSignificance,
        };
      }

      if (overlayMode === "gnomad") {
        const filteredVariants = variantData.filter((variant) => {
          if (!variant.position) return false;

          let nucleotidePos: number;
          if (
            variant.nucleotidePosition !== undefined &&
            variant.nucleotidePosition !== null
          ) {
            nucleotidePos = variant.nucleotidePosition;
          } else {
            if (geneData.strand === "-") {
              nucleotidePos = geneData.end - variant.position + 1;
            } else {
              nucleotidePos = variant.position - geneData.start + 1;
            }
          }

          if (nucleotidePos !== nucleotideId) return false;

          if (selectedPopulationSource === "gnomad") {
            return (variant.gnomad_ac ?? 0) > 0;
          } else if (selectedPopulationSource === "aou") {
            return (variant.aou_ac ?? 0) > 0;
          } else {
            return (variant.gnomad_ac ?? 0) > 0 || (variant.aou_ac ?? 0) > 0;
          }
        });

        if (filteredVariants.length === 0) return { value: 0 };

        const totalAc = filteredVariants.reduce((sum, v) => {
          if (selectedPopulationSource === "gnomad") {
            return sum + (v.gnomad_ac ?? 0);
          } else if (selectedPopulationSource === "aou") {
            return sum + (v.aou_ac ?? 0);
          } else {
            return sum + (v.gnomad_ac ?? 0) + (v.aou_ac ?? 0);
          }
        }, 0);

        return {
          value: Math.log10(totalAc + 1) / 10,
          variant: filteredVariants[0],
        };
      }

      if (overlayMode === "depletion_group") {
        const overlayValue = overlayData[nucleotideId];
        if (overlayValue) {
          const val =
            typeof overlayValue === "number"
              ? overlayValue
              : overlayValue.value;
          return { value: val || 0 };
        }
        return { value: 0 };
      }

      return { value: 0 };
    },
    [
      overlayMode,
      variantData,
      overlayData,
      geneData,
      selectedDiseaseType,
      selectedClinicalSig,
      selectedPopulationSource,
      clinvarGroupBy,
      selectedZygosity,
    ],
  );

  const handleNucleotideClick = useCallback(
    (nucleotide: Nucleotide) => {
      onNucleotideClick?.(nucleotide);
    },
    [onNucleotideClick],
  );

  const handleNucleotideHover = useCallback(
    (nucleotide: Nucleotide | null) => {
      setHoveredNucleotide(nucleotide);
      onNucleotideHover?.(nucleotide);
    },
    [onNucleotideHover],
  );

  const getVariantInfoForNucleotide = useCallback(
    (nucleotideId: number) => {
      const relevantVariants = variantData.filter((variant) => {
        if (
          variant.nucleotidePosition !== undefined &&
          variant.nucleotidePosition !== null
        ) {
          return variant.nucleotidePosition === nucleotideId;
        } else if (variant.position) {
          let nucleotidePos: number;
          if (geneData.strand === "-") {
            nucleotidePos = geneData.end - variant.position + 1;
          } else {
            nucleotidePos = variant.position - geneData.start + 1;
          }
          return nucleotidePos === nucleotideId;
        }
        return false;
      });

      const relevantGnomadVariants = gnomadVariants.filter((variant) => {
        let nucleotidePos: number;
        if (geneData.strand === "-") {
          nucleotidePos = geneData.end - variant.position + 1;
        } else {
          nucleotidePos = variant.position - geneData.start + 1;
        }
        return nucleotidePos === nucleotideId;
      });

      return {
        clinvarVariants: relevantVariants,
        gnomadVariants: relevantGnomadVariants,
      };
    },
    [variantData, gnomadVariants, geneData],
  );

  const getOverlayColor = (nucleotide: Nucleotide): string => {
    const { value } = getFilteredOverlayValue(nucleotide.id);
    if (!value) return COLORBLIND_FRIENDLY_PALETTE.NEUTRAL.BACKGROUND;

    if (overlayMode === "clinvar") {
      if (value === 1) return COLORBLIND_FRIENDLY_PALETTE.CLINVAR.PATHOGENIC;
      if (value === 0.75)
        return COLORBLIND_FRIENDLY_PALETTE.CLINVAR.LIKELY_PATHOGENIC;
      if (value === 0.125)
        return COLORBLIND_FRIENDLY_PALETTE.CLINVAR.LIKELY_BENIGN;
      if (value === 0.5) return COLORBLIND_FRIENDLY_PALETTE.CLINVAR.BENIGN;
      if (value === 0.25) return COLORBLIND_FRIENDLY_PALETTE.CLINVAR.VUS;
      return COLORBLIND_FRIENDLY_PALETTE.NEUTRAL.BACKGROUND;
    } else if (overlayMode === "gnomad") {
      return generateGnomadColorWithAlpha(value);
    } else if (overlayMode === "depletion_group") {
      if (value === 3) return COLORBLIND_FRIENDLY_PALETTE.DEPLETION.STRONG;
      if (value === 2) return COLORBLIND_FRIENDLY_PALETTE.DEPLETION.MODERATE;
      if (value === 1) return COLORBLIND_FRIENDLY_PALETTE.DEPLETION.NORMAL;
      return COLORBLIND_FRIENDLY_PALETTE.NEUTRAL.BACKGROUND;
    }

    return COLORBLIND_FRIENDLY_PALETTE.NEUTRAL.BACKGROUND;
  };

  const handleZoom = useCallback((delta: number) => {
    setZoomLevel((prev) => Math.max(0.1, Math.min(5, prev + delta)));
  }, []);

  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    setIsPanning(true);
    setLastPanPoint({ x: event.clientX, y: event.clientY });
  }, []);

  const handleMouseMove = useCallback(
    (event: React.MouseEvent) => {
      if (!isPanning) return;

      const deltaX = event.clientX - lastPanPoint.x;
      const deltaY = event.clientY - lastPanPoint.y;

      setPanOffset((prev) => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY,
      }));

      setLastPanPoint({ x: event.clientX, y: event.clientY });
    },
    [isPanning, lastPanPoint],
  );

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  const resetView = useCallback(() => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  }, []);

  const saveAsSVG = useCallback(() => {
    if (!svgRef.current) return;

    const svgElement = svgRef.current;
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svgElement);

    const blob = new Blob([svgString], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "rna-structure.svg";
    link.click();

    URL.revokeObjectURL(url);
  }, []);

  const saveAsPNG = useCallback(() => {
    if (!containerRef.current || !svgRef.current) return;

    const svgElement = svgRef.current;
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svgElement);

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    const svgBlob = new Blob([svgString], {
      type: "image/svg+xml;charset=utf-8",
    });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      const viewBox = svgElement.viewBox.baseVal;
      const svgWidth = viewBox.width || 1000;
      const svgHeight = viewBox.height || 1000;

      canvas.width = svgWidth * 2;
      canvas.height = svgHeight * 2;
      ctx.scale(2, 2);

      ctx.fillStyle = "#f8fafc";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, svgWidth, svgHeight);

      URL.revokeObjectURL(url);

      const pngUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = "rna-structure.png";
      link.href = pngUrl;
      link.click();
    };

    img.src = url;
  }, []);

  return (
    <div className="rna-viewer space-y-4">
      {/* Controls */}
      <div className="w-full p-3 bg-slate-50 rounded-lg border border-slate-200">
        {onCycleOverlay && (
          <div className="bg-white rounded-lg border border-slate-200 p-3">
            {/* Header row with title and mode buttons */}
            <div className="flex items-center justify-between gap-4 mb-2 min-w-0">
              <div className="flex items-center gap-2 shrink-0">
                <Layers className="h-4 w-4 text-teal-600" />
                <span className="text-sm font-semibold text-slate-700 whitespace-nowrap">
                  Data Overlay
                </span>
              </div>

              {/* Mode toggle buttons - fixed width container */}
              <div className="flex items-center gap-1 shrink-0">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => {
                        if (overlayMode !== "none") {
                          const cycles =
                            [
                              "none",
                              "clinvar",
                              "gnomad",
                              "depletion_group",
                            ].indexOf("none") - cyclesFromMode(overlayMode);
                          for (let i = 0; i < Math.abs(cycles || 1); i++)
                            onCycleOverlay();
                        }
                      }}
                      className={`px-2.5 py-1.5 rounded text-xs font-medium transition-colors flex items-center gap-1.5 ${overlayMode === "none" ? "bg-slate-200 text-slate-800" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}
                    >
                      <Ban className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">None</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Disable data overlay</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => {
                        const targetIndex = [
                          "none",
                          "clinvar",
                          "gnomad",
                          "depletion_group",
                        ].indexOf("clinvar");
                        const current = cyclesFromMode(overlayMode);
                        for (
                          let i = 0;
                          i < (targetIndex - current + 4) % 4;
                          i++
                        )
                          onCycleOverlay();
                      }}
                      className={`px-2.5 py-1.5 rounded text-xs font-medium transition-colors flex items-center gap-1.5 ${overlayMode === "clinvar" ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}
                    >
                      <AlertTriangle className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">
                        Clinical Variants
                      </span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      Show ClinVar clinical variants with pathogenicity
                      classifications
                    </p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => {
                        const targetIndex = [
                          "none",
                          "clinvar",
                          "gnomad",
                          "depletion_group",
                        ].indexOf("gnomad");
                        const current = cyclesFromMode(overlayMode);
                        for (
                          let i = 0;
                          i < (targetIndex - current + 4) % 4;
                          i++
                        )
                          onCycleOverlay();
                      }}
                      className={`px-2.5 py-1.5 rounded text-xs font-medium transition-colors flex items-center gap-1.5 ${overlayMode === "gnomad" ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}
                    >
                      <Users className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">
                        Population Variants
                      </span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      Show population frequency data from gnomAD and All of Us
                    </p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => {
                        const targetIndex = [
                          "none",
                          "clinvar",
                          "gnomad",
                          "depletion_group",
                        ].indexOf("depletion_group");
                        const current = cyclesFromMode(overlayMode);
                        for (
                          let i = 0;
                          i < (targetIndex - current + 4) % 4;
                          i++
                        )
                          onCycleOverlay();
                      }}
                      className={`px-2.5 py-1.5 rounded text-xs font-medium transition-colors flex items-center gap-1.5 ${overlayMode === "depletion_group" ? "bg-orange-100 text-orange-700" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}
                    >
                      <Activity className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Depletion</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      Show depletion group categories: Strong, Moderate, Normal
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>

              {/* Structural Features Toggle */}
              <div className="flex items-center gap-2 px-2 py-1 rounded border-dashed border-slate-300 bg-slate-100">
                <span className="text-xs font-medium text-slate-500">
                  Domains
                </span>
                <Switch
                  checked={showStructuralFeatures}
                  onCheckedChange={setShowStructuralFeatures}
                  className="data-[state=checked]:bg-purple-600"
                />
              </div>
            </div>

            {/* Current mode label and filters */}
            {overlayMode !== "none" && (
              <div className="flex items-center gap-2 pt-2 border-t border-slate-100 min-w-0">
                <span className="text-xs font-medium text-slate-500 shrink-0">
                  Filter:
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  {overlayMode === "clinvar" && (
                    <>
                      <span className="text-xs font-medium text-slate-500">
                        Group by
                      </span>
                      <Select
                        value={clinvarGroupBy}
                        onValueChange={setClinvarGroupBy}
                      >
                        <SelectTrigger className="h-7 w-28 text-xs bg-white">
                          <SelectValue placeholder="All" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          <SelectItem value="significance">
                            Significance
                          </SelectItem>
                          <SelectItem value="disease">Disease</SelectItem>
                        </SelectContent>
                      </Select>
                      {clinvarGroupBy !== "all" && (
                        <>
                          {clinvarGroupBy === "significance" && (
                            <>
                              <span className="text-xs font-medium text-slate-500">
                                Significance
                              </span>
                              <Select
                                value={selectedClinicalSig}
                                onValueChange={setSelectedClinicalSig}
                              >
                                <SelectTrigger className="h-7 w-28 text-xs bg-white">
                                  <SelectValue placeholder="All" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="all">All</SelectItem>
                                  {clinicalSignificances.map((sig) => (
                                    <SelectItem key={sig} value={sig}>
                                      {sig}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </>
                          )}
                          {clinvarGroupBy === "disease" && (
                            <>
                              <span className="text-xs font-medium text-slate-500">
                                Disease
                              </span>
                              <Select
                                value={selectedDiseaseType}
                                onValueChange={setSelectedDiseaseType}
                              >
                                <SelectTrigger className="h-7 w-28 text-xs bg-white">
                                  <SelectValue placeholder="All" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="all">All</SelectItem>
                                  {diseaseTypes.map((disease) => (
                                    <SelectItem key={disease} value={disease}>
                                      {disease}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </>
                          )}
                          <span className="text-xs font-medium text-slate-500">
                            Zygosity
                          </span>
                          <Select
                            value={selectedZygosity}
                            onValueChange={setSelectedZygosity}
                          >
                            <SelectTrigger className="h-7 w-28 text-xs bg-white">
                              <SelectValue placeholder="All" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All</SelectItem>
                              <SelectItem value="het">Dominant</SelectItem>
                              <SelectItem value="biallelic">
                                Biallelic
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </>
                      )}
                    </>
                  )}
                  {overlayMode === "gnomad" && (
                    <>
                      <span className="text-xs font-medium text-slate-500">
                        Source
                      </span>
                      <Select
                        value={selectedPopulationSource}
                        onValueChange={setSelectedPopulationSource}
                      >
                        <SelectTrigger className="h-7 w-28 text-xs bg-white">
                          <SelectValue placeholder="All" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          <SelectItem value="gnomad">gnomAD</SelectItem>
                          <SelectItem value="aou">All of Us</SelectItem>
                        </SelectContent>
                      </Select>
                    </>
                  )}
                  {overlayMode === "depletion_group" && (
                    <div className="flex items-center gap-3 text-xs">
                      <div className="flex items-center gap-1">
                        <div className="w-2.5 h-2.5 rounded bg-red-500" />
                        <span className="text-slate-600">Strong</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2.5 h-2.5 rounded bg-amber-500" />
                        <span className="text-slate-600">Moderate</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2.5 h-2.5 rounded bg-emerald-500" />
                        <span className="text-slate-600">Normal</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Divider */}
        <div className="h-4 w-px mx-2" />

        {/* 2D-specific controls (Zoom Controls) */}
        <div className="flex items-center gap-1">
          {/* Zoom Controls */}
          <div className="flex items-center gap-1">
            <Button
              onClick={() => handleZoom(0.1)}
              variant="outline"
              size="sm"
              className="h-8 px-3"
            >
              <ZoomIn className="h-3 w-3" />
            </Button>
            <Button
              onClick={() => handleZoom(-0.1)}
              variant="outline"
              size="sm"
              className="h-8 px-3"
            >
              <ZoomOut className="h-3 w-3" />
            </Button>
            <Button
              onClick={resetView}
              variant="outline"
              size="sm"
              className="h-8 px-3"
            >
              <RotateCcw className="h-3 w-3" />
            </Button>
            <span className="text-xs text-slate-600 ml-2">
              {Math.round(zoomLevel * 100)}%
            </span>
          </div>

          {/* Divider */}
          <div className="h-4 w-px mx-2" />

          {/* Export Controls */}
          <div className="flex items-center gap-1">
            <Button
              onClick={saveAsSVG}
              variant="outline"
              size="sm"
              className="h-8 px-3"
            >
              <Download className="h-3 w-3 mr-1" />
              <span className="text-xs">SVG</span>
            </Button>
            <Button
              onClick={saveAsPNG}
              variant="outline"
              size="sm"
              className="h-8 px-3"
            >
              <FileImage className="h-3 w-3 mr-1" />
              <span className="text-xs">PNG</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div
        ref={containerRef}
        className="rna-svg-container relative"
        style={{
          width: "100%",
          height: "500px",
          border: "1px solid #ccc",
          overflow: "hidden",
          cursor: isPanning ? "grabbing" : "grab",
          backgroundColor: "#f8fafc",
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <svg
          ref={svgRef}
          viewBox={(() => {
            if (rnaData.nucleotides.length === 0) return "0 0 2000 2000";
            const minX = Math.min(...rnaData.nucleotides.map((n) => n.x));
            const maxX = Math.max(...rnaData.nucleotides.map((n) => n.x));
            const minY = Math.min(...rnaData.nucleotides.map((n) => n.y));
            const maxY = Math.max(...rnaData.nucleotides.map((n) => n.y));
            const padding = 100;
            return `${minX - padding} ${minY - padding} ${maxX - minX + padding * 2} ${maxY - minY + padding * 2}`;
          })()}
          className="rna-svg"
          style={{
            width: "100%",
            height: "100%",
            transform: `scale(${zoomLevel}) translate(${panOffset.x}px, ${panOffset.y}px)`,
            transformOrigin: "center center",
          }}
        >
          <g className="bonds-layer">
            {rnaData.base_pairs.map(({ from_pos, to_pos }, index) => {
              const fromNuc = findNucleotideById(rnaData.nucleotides, from_pos);
              const toNuc = findNucleotideById(rnaData.nucleotides, to_pos);

              if (!fromNuc || !toNuc) return null;

              // Create unique key using index and sorted nucleotide IDs to avoid duplicates
              const sortedKey =
                from_pos < to_pos
                  ? `${from_pos}-${to_pos}`
                  : `${to_pos}-${from_pos}`;
              return (
                <BasePairBond
                  key={`bond-${index}-${sortedKey}`}
                  from={fromNuc}
                  to={toNuc}
                />
              );
            })}
          </g>

          <g className="nucleotides-layer">
            {rnaData.nucleotides.map((nucleotide) => {
              const variantInfo = getVariantInfoForNucleotide(nucleotide.id);
              const totalVariants =
                variantInfo.clinvarVariants.length +
                variantInfo.gnomadVariants.length;
              return (
                <NucleotideComponent
                  key={nucleotide.id}
                  nucleotide={nucleotide}
                  color={getOverlayColor(nucleotide)}
                  isHovered={hoveredNucleotide?.id === nucleotide.id}
                  isSelected={selectedNucleotide?.id === nucleotide.id}
                  isHighlighted={highlightedNucleotideIds.includes(
                    nucleotide.id,
                  )}
                  onHover={handleNucleotideHover}
                  onClick={handleNucleotideClick}
                  hasVariants={totalVariants > 0}
                  variantCount={totalVariants}
                />
              );
            })}
          </g>

          {/* Structural Features Layer */}
          {showStructuralFeatures &&
            rnaData.structural_features?.map((feature) => {
              const nucleotides = feature.nucleotide_ids
                .map((id) => rnaData.nucleotides.find((n) => n.id === id))
                .filter(Boolean);

              if (nucleotides.length === 0) return null;

              // Calculate bounding box
              const xs = nucleotides.map((n) => n!.x);
              const ys = nucleotides.map((n) => n!.y);
              const minX = Math.min(...xs);
              const maxX = Math.max(...xs);
              const minY = Math.min(...ys);
              const maxY = Math.max(...ys);
              const centerX = (minX + maxX) / 2;
              const centerY = (minY + maxY) / 2;

              return (
                <g key={feature.id} className="structural-feature">
                  {/* Highlight individual nucleotides */}
                  {nucleotides.map((nuc) => (
                    <circle
                      key={`feature-${feature.id}-nuc-${nuc!.id}`}
                      cx={nuc!.x}
                      cy={nuc!.y}
                      r={22}
                      fill={feature.color || "#8b5cf6"}
                      opacity={0.25}
                      className="pointer-events-none"
                    />
                  ))}

                  {/* Feature label with background */}
                  <g className="pointer-events-none">
                    <rect
                      x={
                        feature.label_x -
                        (feature.label_text.length * feature.label_font_size) /
                          3
                      }
                      y={feature.label_y - feature.label_font_size / 1.5}
                      width={
                        (feature.label_text.length * feature.label_font_size) /
                        1.5
                      }
                      height={feature.label_font_size + 8}
                      fill="rgba(255, 255, 255, 0.9)"
                      stroke={feature.label_color || "#6d28d9"}
                      strokeWidth="2"
                      rx="4"
                    />
                    <text
                      x={feature.label_x}
                      y={feature.label_y}
                      fontSize={feature.label_font_size}
                      fill={feature.label_color || "#6d28d9"}
                      fontWeight="600"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="select-none"
                    >
                      {feature.label_text}
                    </text>
                  </g>

                  {/* Connector line from label to feature center */}
                  <line
                    x1={feature.label_x}
                    y1={feature.label_y + feature.label_font_size / 2}
                    x2={centerX}
                    y2={centerY}
                    stroke={feature.label_color || "#6d28d9"}
                    strokeWidth="1"
                    strokeDasharray="2,2"
                    opacity="0.5"
                    className="pointer-events-none"
                  />
                </g>
              );
            })}

          <g className="annotations-layer">
            {rnaData.annotations?.map((annotation) => (
              <text
                key={annotation.id}
                x={annotation.x}
                y={annotation.y}
                fontSize={annotation.font_size}
                fill={annotation.color || "#374151"}
                textAnchor="middle"
                dominantBaseline="middle"
                className="pointer-events-none select-none font-medium"
              >
                {annotation.text}
              </text>
            ))}
          </g>
        </svg>
      </div>

      {/* Legend */}
      {overlayMode !== "none" && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="text-sm font-medium text-gray-700 mb-2">
            {overlayMode === "clinvar"
              ? "ClinVar Legend:"
              : overlayMode === "gnomad"
                ? "gnomAD Legend:"
                : overlayMode === "depletion_group"
                  ? "Depletion Group Legend:"
                  : "Legend:"}
          </div>
          <div className="flex flex-wrap gap-4 text-xs">
            {overlayMode === "clinvar" ? (
              <>
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-sm"
                    style={{
                      backgroundColor:
                        COLORBLIND_FRIENDLY_PALETTE.CLINVAR.PATHOGENIC,
                    }}
                  ></div>
                  <span>Pathogenic</span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-sm"
                    style={{
                      backgroundColor:
                        COLORBLIND_FRIENDLY_PALETTE.CLINVAR.LIKELY_PATHOGENIC,
                    }}
                  ></div>
                  <span>Likely Pathogenic</span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-sm"
                    style={{
                      backgroundColor: COLORBLIND_FRIENDLY_PALETTE.CLINVAR.VUS,
                    }}
                  ></div>
                  <span>Uncertain Significance</span>
                </div>
              </>
            ) : overlayMode === "gnomad" ? (
              <>
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-sm"
                    style={{
                      backgroundColor: COLORBLIND_FRIENDLY_PALETTE.GNOMAD.LOW,
                    }}
                  ></div>
                  <span>Low frequency</span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-sm"
                    style={{
                      backgroundColor:
                        COLORBLIND_FRIENDLY_PALETTE.GNOMAD.MEDIUM,
                    }}
                  ></div>
                  <span>Medium frequency</span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-sm"
                    style={{
                      backgroundColor: COLORBLIND_FRIENDLY_PALETTE.GNOMAD.HIGH,
                    }}
                  ></div>
                  <span>High frequency</span>
                </div>
              </>
            ) : overlayMode === "depletion_group" ? (
              <>
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-sm"
                    style={{
                      backgroundColor:
                        COLORBLIND_FRIENDLY_PALETTE.DEPLETION.STRONG,
                    }}
                  ></div>
                  <span>Strong</span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-sm"
                    style={{
                      backgroundColor:
                        COLORBLIND_FRIENDLY_PALETTE.DEPLETION.MODERATE,
                    }}
                  ></div>
                  <span>Moderate</span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-sm"
                    style={{
                      backgroundColor:
                        COLORBLIND_FRIENDLY_PALETTE.DEPLETION.NORMAL,
                    }}
                  ></div>
                  <span>Normal</span>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};

export default RNAViewer;
