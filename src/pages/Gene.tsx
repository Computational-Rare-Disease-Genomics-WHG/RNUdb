import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Footer from "../components/Footer";
import Header from "../components/Header";
import MainContent from "../components/MainContent";
import { useAuth } from "../context/AuthContext";
import { getGeneData } from "../data/genes";
import { getLiterature } from "../data/literature";
import { getRNAStructure } from "../data/structures";
import { getPDBStructure } from "../data/structures";
import { getVariants } from "../data/variants";
import { COLORBLIND_FRIENDLY_PALETTE } from "../lib/colors";
import { getLiteratureCounts } from "../services/api";
import type {
  OverlayData,
  SnRNAGene,
  Variant,
  Literature,
  LiteratureCounts,
  RNAStructure,
  PDBStructure,
} from "../types";
import { Button } from "@/components/ui/button";

const Gene: React.FC = () => {
  const { geneId } = useParams<{ geneId: string }>();
  const navigate = useNavigate();
  useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSnRNA, setSelectedSnRNA] = useState(geneId || "RNU4-2");
  const [searchResults, setSearchResults] = useState<null | SnRNAGene[]>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [overlayMode, setOverlayMode] = useState<
    "none" | "clinvar" | "gnomad" | "depletion_group"
  >("clinvar");
  const [functionScoreTrackData, setFunctionScoreTrackData] = useState({});
  const [depletionGroupTrackData, setDepletionGroupTrackData] = useState({});
  const [caddScoreTrackData, setCaddScoreTrackData] = useState({});
  const [clinvarOverlayData, setClinvarOverlayData] = useState({});
  const [gnomadOverlayData, setGnomadOverlayData] = useState({});

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for API data
  const [currentData, setCurrentData] = useState<SnRNAGene | null>(null);
  const [variantData, setVariantData] = useState<Variant[]>([]);
  const [paperData, setPaperData] = useState<Literature[]>([]);
  const [literatureCounts, setLiteratureCounts] = useState<LiteratureCounts[]>(
    [],
  );
  const [rnaStructureData, setRnaStructureData] = useState<RNAStructure | null>(
    null,
  );
  const [pdbData, setPdbData] = useState<PDBStructure | null>(null);

  // Load data when selectedSnRNA changes
  useEffect(() => {
    const loadGeneData = async () => {
      if (!selectedSnRNA) return;

      setLoading(true);
      setError(null);

      try {
        const [
          gene,
          variants,
          literature,
          literatureCountsData,
          rnaStructure,
          pdbStructure,
        ] = await Promise.all([
          getGeneData(selectedSnRNA),
          getVariants(selectedSnRNA),
          getLiterature(selectedSnRNA),
          getLiteratureCounts(),
          getRNAStructure(selectedSnRNA),
          getPDBStructure(selectedSnRNA),
        ]);

        if (!gene) {
          throw new Error(`Gene ${selectedSnRNA} not found`);
        }

        setCurrentData(gene);
        setVariantData(variants);
        setPaperData(literature);
        setLiteratureCounts(literatureCountsData);
        setRnaStructureData(rnaStructure);
        setPdbData(pdbStructure);
      } catch (err) {
        console.error("Error loading gene data:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load gene data",
        );
      } finally {
        setLoading(false);
      }
    };

    loadGeneData();
  }, [selectedSnRNA]);

  useEffect(() => {
    if (geneId && geneId !== selectedSnRNA) {
      setSelectedSnRNA(geneId);
    }
  }, [geneId, selectedSnRNA]);

  useEffect(() => {
    const createDepletionGroupTrackData = (variants: Variant[]) => {
      return Object.fromEntries(
        variants
          .filter(
            (v) =>
              v.depletion_group !== undefined &&
              v.nucleotidePosition !== undefined,
          )
          .map((v) => [
            v.nucleotidePosition!,
            {
              value:
                v.depletion_group === "strong"
                  ? 3
                  : v.depletion_group === "moderate"
                    ? 2
                    : 1,
              label: `Depletion: ${v.depletion_group}`,
              color:
                v.depletion_group === "strong"
                  ? COLORBLIND_FRIENDLY_PALETTE.DEPLETION.STRONG
                  : v.depletion_group === "moderate"
                    ? COLORBLIND_FRIENDLY_PALETTE.DEPLETION.MODERATE
                    : COLORBLIND_FRIENDLY_PALETTE.DEPLETION.NORMAL,
            },
          ]),
      );
    };

    const createClinvarOverlayData = (
      variants: Variant[],
      geneData: SnRNAGene,
    ) => {
      return Object.fromEntries(
        variants
          .filter(
            (v) =>
              v.clinical_significance &&
              (v.nucleotidePosition !== undefined || v.position !== undefined),
          )
          .map((v) => {
            // Get nucleotide position - either directly or convert from genomic position
            let nucleotidePos = v.nucleotidePosition;
            if (nucleotidePos === undefined && v.position !== undefined) {
              // Convert genomic position to nucleotide position (strand-aware)
              if (geneData.strand === "-") {
                nucleotidePos = geneData.end - v.position + 1;
              } else {
                nucleotidePos = v.position - geneData.start + 1;
              }
            }
            return [
              nucleotidePos!,
              {
                value:
                  // Pathogenic variants
                  v.clinical_significance === "Pathogenic"
                    ? 1
                    : v.clinical_significance === "Likely Pathogenic"
                      ? 0.75
                      : v.clinical_significance === "VUS"
                        ? 0.25
                        : 0,
                label: v.clinical_significance,
                variantId: v.id,
              },
            ];
          }),
      );
    };

    const createFunctionScoreTrackData = (variants: Variant[]) => {
      return Object.fromEntries(
        variants
          .filter(
            (v) =>
              v.function_score !== undefined &&
              v.function_score !== null &&
              v.nucleotidePosition !== undefined,
          )
          .map((v) => [
            v.nucleotidePosition!,
            {
              value: v.function_score!,
              label: `Function Score: ${v.function_score!.toFixed(3)}`,
              color:
                v.function_score! > 0
                  ? COLORBLIND_FRIENDLY_PALETTE.DEPLETION.NORMAL
                  : v.function_score! < -1
                    ? COLORBLIND_FRIENDLY_PALETTE.DEPLETION.STRONG
                    : COLORBLIND_FRIENDLY_PALETTE.DEPLETION.MODERATE,
            },
          ]),
      );
    };

    const createGnomadOverlayData = (
      variants: Variant[],
      geneData: SnRNAGene,
    ) => {
      return Object.fromEntries(
        variants
          .filter(
            (v) =>
              v.gnomad_ac !== undefined &&
              v.gnomad_ac !== null &&
              (v.nucleotidePosition !== undefined || v.position !== undefined),
          )
          .map((v) => {
            // Get nucleotide position - either directly or convert from genomic position
            let nucleotidePos = v.nucleotidePosition;
            if (nucleotidePos === undefined && v.position !== undefined) {
              if (geneData.strand === "-") {
                nucleotidePos = geneData.end - v.position + 1;
              } else {
                nucleotidePos = v.position - geneData.start + 1;
              }
            }
            return [
              nucleotidePos!,
              {
                value: Math.log10((v.gnomad_ac || 0) + 1) / 10, // Normalize for color scale
                label: `gnomAD AC: ${v.gnomad_ac}`,
                variantId: v.id,
              },
            ];
          }),
      );
    };

    const createCaddScoreTrackData = (
      variants: Variant[],
      geneData: SnRNAGene,
    ) => {
      return Object.fromEntries(
        variants
          .filter(
            (v) =>
              v.cadd_score !== undefined &&
              v.cadd_score !== null &&
              (v.nucleotidePosition !== undefined || v.position !== undefined),
          )
          .map((v) => {
            // Get nucleotide position - either directly or convert from genomic position
            let nucleotidePos = v.nucleotidePosition;
            if (nucleotidePos === undefined && v.position !== undefined) {
              if (geneData.strand === "-") {
                nucleotidePos = geneData.end - v.position + 1;
              } else {
                nucleotidePos = v.position - geneData.start + 1;
              }
            }
            return [
              nucleotidePos!,
              {
                value: v.cadd_score!,
                label: `CADD Score: ${v.cadd_score!.toFixed(2)}`,
                color:
                  v.cadd_score! > 20
                    ? "#dc2626"
                    : v.cadd_score! > 15
                      ? "#f97316"
                      : "#10b981",
              },
            ];
          }),
      );
    };

    const funcScoreData = createFunctionScoreTrackData(variantData);
    const depletionData = createDepletionGroupTrackData(variantData);
    const caddData = currentData
      ? createCaddScoreTrackData(variantData, currentData)
      : {};
    const clinvarData = currentData
      ? createClinvarOverlayData(variantData, currentData)
      : {};
    const gnomadData = currentData
      ? createGnomadOverlayData(variantData, currentData)
      : {};
    setFunctionScoreTrackData(funcScoreData);
    setDepletionGroupTrackData(depletionData);
    setCaddScoreTrackData(caddData);
    setClinvarOverlayData(clinvarData);
    setGnomadOverlayData(gnomadData);
  }, [variantData, currentData]);

  const cycleOverlayMode = () => {
    setOverlayMode((prev) => {
      switch (prev) {
        case "none":
          return "clinvar";
        case "clinvar":
          return "gnomad";
        case "gnomad":
          return "depletion_group";
        case "depletion_group":
          return "none";
        default:
          return "clinvar";
      }
    });
  };

  const getCurrentOverlayData = (): OverlayData => {
    switch (overlayMode) {
      case "clinvar":
        return clinvarOverlayData;
      case "gnomad":
        return gnomadOverlayData;
      case "depletion_group":
        return depletionGroupTrackData;
      default:
        return {};
    }
  };

  // Separate gnomAD variants from clinical variants
  const getGnomadVariants = () => {
    return variantData.filter(
      (v) =>
        v.gnomad_ac !== undefined && v.gnomad_ac !== null && v.gnomad_ac > 0,
    );
  };

  // Get All of Us variants
  const getAllOfUsVariants = () => {
    return variantData.filter(
      (v) => v.aou_ac !== undefined && v.aou_ac !== null && v.aou_ac > 0,
    );
  };

  const gnomadVariants = getGnomadVariants();
  const aouVariants = getAllOfUsVariants();

  const handleGeneSelect = (geneName: string) => {
    navigate(`/gene/${geneName}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-stone-50 to-neutral-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <div className="text-lg text-muted-foreground">
            Loading gene data...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-stone-50 to-neutral-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-lg mb-4">
            Error loading gene data
          </div>
          <div className="text-muted-foreground mb-4">{error}</div>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  if (!currentData) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-stone-50 to-neutral-100 flex items-center justify-center">
        <div className="text-center text-muted-foreground">Gene not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-stone-50 to-neutral-100">
      <Header
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        searchResults={searchResults}
        setSearchResults={setSearchResults}
        setSelectedSnRNA={handleGeneSelect}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />

      <div className="flex-1">
        <div className="flex-1">
          <MainContent
            currentData={currentData}
            rnaStructureData={rnaStructureData}
            pdbStructureData={pdbData}
            paperData={paperData}
            literatureCounts={literatureCounts}
            variantData={variantData}
            gnomadVariants={gnomadVariants}
            overlayMode={overlayMode}
            getCurrentOverlayData={getCurrentOverlayData}
            cycleOverlayMode={cycleOverlayMode}
            functionScoreTrackData={functionScoreTrackData}
            depletionGroupTrackData={depletionGroupTrackData}
            caddScoreTrackData={caddScoreTrackData}
            aouVariants={aouVariants}
          />
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Gene;
