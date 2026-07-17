import {
  Database,
  Dna,
  Globe,
  Search,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  ExternalLink,
} from "lucide-react";
import React from "react";
import { useNavigate } from "react-router";
import { getAffectedNucleotideIds } from "../lib/rnaUtils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type {
  SnRNAGene,
  Literature,
  Variant,
  Nucleotide,
  LiteratureCounts,
} from "@/types";

interface InfoPanelProps {
  currentData: SnRNAGene;
  paperData: Literature[];
  literatureCounts: LiteratureCounts[];
  variantData: Variant[];
  overlayMode: "none" | "clinvar" | "gnomad" | "function_score" | "depletion_group";
  onCycleOverlay: () => void;
  hoveredNucleotide: Nucleotide | null;
  onNavigateToVariant?: (nucleotideId: number) => void;
}

const InfoPanel: React.FC<InfoPanelProps> = ({
  currentData,
  paperData,
  literatureCounts,
  hoveredNucleotide,
  variantData,
}) => {
  const navigate = useNavigate();
  const geneLength = currentData.end - currentData.start + 1;

  const getVariantInfoForNucleotide = (nucleotideId: number) => {
    const relevantVariants = variantData.filter((variant) => {
      if (
        variant.nucleotidePosition !== undefined &&
        variant.nucleotidePosition !== null
      ) {
        return getAffectedNucleotideIds(
          variant.hgvs,
          variant.nucleotidePosition,
        ).includes(nucleotideId);
      } else if (variant.position) {
        let nucleotidePos: number;
        if (currentData.strand === "-") {
          nucleotidePos = currentData.end - variant.position + 1;
        } else {
          nucleotidePos = variant.position - currentData.start + 1;
        }
        return getAffectedNucleotideIds(variant.hgvs, nucleotidePos).includes(
          nucleotideId,
        );
      }
      return false;
    });

    const filteredVariants = relevantVariants.filter(
      (variant) =>
        variant.clinical_significance ||
        variant.gnomad_ac ||
        variant.aou_ac ||
        variant.ukbb_ac,
    );

    const clinicalVariants = filteredVariants.filter((v) => v.clinical_significance);
    const populationVariants = filteredVariants.filter(
      (v) => !v.clinical_significance && (v.gnomad_ac || v.aou_ac || v.ukbb_ac),
    );

    return {
      clinicalVariants,
      populationVariants,
      allVariants: filteredVariants,
    };
  };

  const normalizeVariantId = (id: string) => id.replace(/^chr/, "");

  const getSignificanceIcon = (significance?: string) => {
    if (!significance) return <HelpCircle className="h-3 w-3" />;
    const lower = significance.toLowerCase();
    if (
      lower === "path" ||
      (lower.includes("pathogenic") && !lower.includes("likely"))
    ) {
      return <AlertTriangle className="h-3 w-3" />;
    } else if (lower === "lp" || lower.includes("likely pathogenic")) {
      return <AlertTriangle className="h-3 w-3" />;
    } else if (lower.includes("benign")) {
      return <CheckCircle className="h-3 w-3" />;
    }
    return <HelpCircle className="h-3 w-3" />;
  };

  const getSignificanceColor = (significance?: string) => {
    if (!significance) return "bg-gray-100 text-gray-700 border-gray-200";
    const lower = significance.toLowerCase();
    if (
      lower === "path" ||
      (lower.includes("pathogenic") && !lower.includes("likely"))
    ) {
      return "bg-red-50 text-red-700 border-red-200";
    } else if (lower === "lp" || lower.includes("likely pathogenic")) {
      return "bg-orange-50 text-orange-700 border-orange-200";
    } else if (lower.includes("benign")) {
      return "bg-green-50 text-green-700 border-green-200";
    } else if (lower === "vus" || lower.includes("uncertain")) {
      return "bg-blue-50 text-blue-700 border-blue-200";
    }
    return "bg-gray-50 text-gray-700 border-gray-200";
  };

  const handleVariantClick = (variant: Variant) => {
    if (variant.position) {
      navigate(`/curate?gene=${currentData.name}&variant=${variant.id}`);
    }
  };

  const getPaperGroupsForVariant = (variantId: string) => {
    const directCounts = literatureCounts.filter((lc) => lc.variant_id === variantId);
    const linkedCounts = literatureCounts.filter((lc) => {
      if (!lc.linked_variant_ids) return false;
      const linkedIds = lc.linked_variant_ids.split(",").map((id) => id.trim());
      return linkedIds.includes(variantId);
    });
    const allCounts = [...directCounts, ...linkedCounts];

    const paperMap = new Map<
      string,
      {
        literature: Literature;
        rows: {
          count: number;
          zygosity?: string;
          linkedHgvs: string[];
        }[];
      }
    >();

    for (const count of allCounts) {
      const literature = paperData.find((p) => p.id === count.literature_id);
      if (!literature) continue;

      const linkedIds = count.linked_variant_ids
        ? count.linked_variant_ids.split(",").map((id) => id.trim())
        : [];
      const linkedHgvs = linkedIds
        .map((id) => {
          const linkedVar = variantData.find(
            (v) => v.id === id || `chr${v.id}` === id || v.id === `chr${id}`,
          );
          return linkedVar ? linkedVar.hgvs || `${linkedVar.ref}>${linkedVar.alt}` : id;
        })
        .filter((h): h is string => h !== undefined);

      if (paperMap.has(literature.id)) {
        paperMap.get(literature.id)!.rows.push({
          count: count.counts,
          zygosity: count.zygosity,
          linkedHgvs,
        });
      } else {
        paperMap.set(literature.id, {
          literature,
          rows: [{ count: count.counts, zygosity: count.zygosity, linkedHgvs }],
        });
      }
    }

    return Array.from(paperMap.values()).sort((a, b) => {
      if (a.literature.year !== b.literature.year) {
        return parseInt(b.literature.year) - parseInt(a.literature.year);
      }
      return a.literature.authors.localeCompare(b.literature.authors);
    });
  };

  return (
    <div className="space-y-4">
      <Card className="bg-gradient-to-br from-teal-800 via-teal-700 to-teal-600 border-teal-900 shadow-md">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 rounded-lg shadow-md backdrop-blur-sm">
              <Dna className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-xl font-bold text-white">
                {currentData.name}
              </CardTitle>
              <CardDescription className="text-sm text-teal-200 font-medium">
                {currentData.fullName}
              </CardDescription>
            </div>
            <Badge className="bg-white/20 text-white border-white/30 px-2.5 py-1 text-xs font-semibold backdrop-blur-sm">
              snRNA
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-teal-100 leading-relaxed line-clamp-3">
            {currentData.description}
          </p>

          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2 text-center p-2 bg-white/10 rounded-lg border border-white/20 shadow-sm backdrop-blur-sm">
              <div className="text-[10px] text-teal-300 font-medium mb-1">
                Coordinate
              </div>
              <div className="text-xs font-mono text-white leading-tight">
                {currentData.chromosome}:{currentData.start}-{currentData.end}
              </div>
            </div>
            <div className="text-center p-2 bg-white/10 rounded-lg border border-white/20 shadow-sm backdrop-blur-sm">
              <div className="text-[10px] text-teal-300 font-medium mb-1">Length</div>
              <div className="text-xs font-bold text-white">{geneLength} bp</div>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <a
              href={`https://gnomad.broadinstitute.org/variant/${currentData.chromosome}-${currentData.start}-${currentData.end}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1"
            >
              <Button
                size="sm"
                className="w-full h-8 border border-white/30 bg-transparent text-white hover:bg-white/20 backdrop-blur-sm"
              >
                <Globe className="h-3.5 w-3.5 mr-1.5" />
                gnomAD
              </Button>
            </a>
            <a
              href={`https://genome.ucsc.edu/cgi-bin/dgDashRef?db=hg38&position=${currentData.chromosome}:${currentData.start}-${currentData.end}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1"
            >
              <Button
                size="sm"
                className="w-full h-8 border border-white/30 bg-transparent text-white hover:bg-white/20 backdrop-blur-sm"
              >
                <Search className="h-3.5 w-3.5 mr-1.5" />
                UCSC
              </Button>
            </a>
            <a
              href={`https://www.omim.org/search?search=${currentData.name}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1"
            >
              <Button
                size="sm"
                className="w-full h-8 border border-white/30 bg-transparent text-white hover:bg-white/20 backdrop-blur-sm"
              >
                <Database className="h-3.5 w-3.5 mr-1.5" />
                OMIM
              </Button>
            </a>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white border-slate-200 shadow-md overflow-hidden">
        {hoveredNucleotide ? (
          <>
            <CardHeader className="pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-slate-100 rounded-lg">
                  <span className="text-lg font-bold text-slate-700">
                    {hoveredNucleotide.base}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base font-bold text-slate-900">
                    Nucleotide {hoveredNucleotide.id}
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500">
                    Genomic:{" "}
                    {(currentData.strand === "-"
                      ? currentData.end - hoveredNucleotide.id + 1
                      : currentData.start + hoveredNucleotide.id - 1
                    ).toLocaleString()}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              {(() => {
                const variantInfo = getVariantInfoForNucleotide(hoveredNucleotide.id);
                const totalVariants = variantInfo.allVariants.length;

                if (totalVariants === 0) {
                  return (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <svg
                        className="w-12 h-12 mb-3 text-slate-300"
                        viewBox="0 0 56 56"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <circle
                          cx="28"
                          cy="28"
                          r="24"
                          stroke="currentColor"
                          strokeWidth="2"
                        />
                        <path
                          d="M20 28l4 4 12-12"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <div className="text-sm font-medium text-slate-600">
                        No known variants
                      </div>
                    </div>
                  );
                }

                return (
                  <div className="space-y-4">
                    {variantInfo.clinicalVariants.length > 0 && (
                      <div className="space-y-3">
                        {variantInfo.clinicalVariants
                          .slice(0, 3)
                          .map((variant: Variant, index: number) => {
                            const paperGroups = getPaperGroupsForVariant(variant.id);
                            const hasMeta =
                              (variant.gnomad_ac !== undefined &&
                                variant.gnomad_ac > 0) ||
                              (variant.aou_ac !== undefined && variant.aou_ac > 0) ||
                              (variant.ukbb_ac !== undefined && variant.ukbb_ac > 0) ||
                              (variant.function_score !== undefined &&
                                variant.function_score !== null) ||
                              variant.depletion_group != null ||
                              (variant.pvalues !== undefined &&
                                variant.pvalues !== null) ||
                              (variant.qvalues !== undefined &&
                                variant.qvalues !== null);

                            return (
                              <div
                                key={index}
                                className="p-3 bg-slate-50 rounded-lg border border-slate-200"
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <div className="flex items-center gap-1.5">
                                      {getSignificanceIcon(
                                        variant.clinical_significance,
                                      )}
                                      <span
                                        className={`text-xs font-semibold px-1.5 py-0.5 rounded ${getSignificanceColor(
                                          variant.clinical_significance,
                                        )}`}
                                      >
                                        {variant.clinical_significance}
                                      </span>
                                    </div>
                                    <span className="text-sm font-semibold text-slate-900">
                                      {variant.hgvs || `${variant.ref}>${variant.alt}`}
                                    </span>
                                    {variant.zygosity && (
                                      <span
                                        className={`text-[11px] font-medium ${
                                          variant.zygosity === "hom"
                                            ? "text-purple-600 bg-purple-50 border border-purple-200"
                                            : "text-blue-600 bg-blue-50 border border-blue-200"
                                        } px-1.5 py-0.5 rounded`}
                                      >
                                        {variant.zygosity === "hom" ? "Hom" : "Het"}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <button
                                  onClick={() => handleVariantClick(variant)}
                                  className="text-xs text-slate-400 hover:text-slate-600 hover:underline mb-2 block"
                                >
                                  {normalizeVariantId(variant.id)}
                                </button>

                                {hasMeta && (
                                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500 mb-2">
                                    {variant.gnomad_ac !== undefined &&
                                      variant.gnomad_ac > 0 && (
                                        <span>
                                          gnomAD AC:{" "}
                                          {variant.gnomad_ac.toLocaleString()}
                                        </span>
                                      )}
                                    {variant.aou_ac !== undefined &&
                                      variant.aou_ac > 0 && (
                                        <span>
                                          AoU AC: {variant.aou_ac.toLocaleString()}
                                        </span>
                                      )}
                                    {variant.ukbb_ac !== undefined &&
                                      variant.ukbb_ac > 0 && (
                                        <span>
                                          UKBB AC: {variant.ukbb_ac.toLocaleString()}
                                        </span>
                                      )}
                                    {variant.function_score !== undefined &&
                                      variant.function_score !== null && (
                                        <span>
                                          Func. {variant.function_score.toFixed(3)}
                                        </span>
                                      )}
                                    {variant.depletion_group != null && (
                                      <span>Depletion: {variant.depletion_group}</span>
                                    )}
                                    {variant.pvalues !== undefined &&
                                      variant.pvalues !== null && (
                                        <span>
                                          P:{" "}
                                          {variant.pvalues < 0.001
                                            ? "<0.001"
                                            : variant.pvalues.toFixed(3)}
                                        </span>
                                      )}
                                    {variant.qvalues !== undefined &&
                                      variant.qvalues !== null && (
                                        <span>
                                          Q:{" "}
                                          {variant.qvalues < 0.001
                                            ? "<0.001"
                                            : variant.qvalues.toFixed(3)}
                                        </span>
                                      )}
                                  </div>
                                )}

                                {paperGroups.length > 0 && (
                                  <div className="border-t border-slate-200 pt-2 mt-1">
                                    {paperGroups.map((paperGroup) => (
                                      <div
                                        key={paperGroup.literature.id}
                                        className="mb-2 last:mb-0"
                                      >
                                        <div className="flex items-center justify-between text-xs">
                                          <span className="font-semibold text-slate-700">
                                            {paperGroup.literature.authors} (
                                            {paperGroup.literature.year})
                                          </span>
                                          <a
                                            href={`https://doi.org/${paperGroup.literature.doi}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-slate-400 hover:text-slate-600 ml-2 shrink-0"
                                          >
                                            <ExternalLink className="h-3 w-3" />
                                          </a>
                                        </div>
                                        {paperGroup.rows.map((row, rowIndex) => (
                                          <div
                                            key={rowIndex}
                                            className="flex items-center gap-1.5 text-xs text-slate-500 pl-3 py-0.5"
                                          >
                                            <span className="font-medium text-slate-600">
                                              {row.count}
                                              {row.zygosity === "Heterozygous"
                                                ? " het"
                                                : row.zygosity === "Homozygous"
                                                  ? " hom"
                                                  : ""}
                                            </span>
                                            {row.linkedHgvs.length > 0 && (
                                              <span className="text-slate-400">
                                                + {row.linkedHgvs.join(", ")}
                                              </span>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                      </div>
                    )}

                    {variantInfo.populationVariants.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-xs font-medium text-slate-500">
                          Population ({variantInfo.populationVariants.length})
                        </div>
                        {variantInfo.populationVariants
                          .slice(0, 3)
                          .map((variant: Variant, index: number) => {
                            return (
                              <div
                                key={index}
                                className="p-2.5 bg-slate-50 rounded-lg border border-slate-100"
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <div className="text-sm text-slate-700">
                                      {variant.hgvs || `${variant.ref}>${variant.alt}`}
                                    </div>
                                    <button
                                      onClick={() => handleVariantClick(variant)}
                                      className="text-xs text-slate-400 hover:text-slate-600"
                                    >
                                      {normalizeVariantId(variant.id)}
                                    </button>
                                  </div>
                                  <div className="flex flex-wrap gap-x-2 text-xs text-slate-500">
                                    {variant.gnomad_ac !== undefined &&
                                      variant.gnomad_ac > 0 && (
                                        <span>gnomAD: {variant.gnomad_ac}</span>
                                      )}
                                    {variant.aou_ac !== undefined &&
                                      variant.aou_ac > 0 && (
                                        <span>AoU: {variant.aou_ac}</span>
                                      )}
                                    {variant.ukbb_ac !== undefined &&
                                      variant.ukbb_ac > 0 && (
                                        <span>UKBB: {variant.ukbb_ac}</span>
                                      )}
                                    {variant.function_score !== undefined &&
                                      variant.function_score !== null && (
                                        <span>
                                          Func. {variant.function_score.toFixed(2)}
                                        </span>
                                      )}
                                    {variant.depletion_group && (
                                      <span>Depletion: {variant.depletion_group}</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </div>
                );
              })()}
            </CardContent>
          </>
        ) : (
          <>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold text-slate-900">
                Nucleotide Details
              </CardTitle>
              <CardDescription className="text-sm text-slate-500">
                Hover over a nucleotide to view variant information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <svg
                  className="w-12 h-12 mb-3 text-slate-300"
                  viewBox="0 0 64 64"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeDasharray="4 2"
                  />
                  <path
                    d="M32 12v8M32 44v8M12 32h8M44 32h8"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <circle cx="32" cy="32" r="8" fill="currentColor" opacity="0.3" />
                  <circle cx="32" cy="32" r="4" fill="currentColor" opacity="0.5" />
                </svg>
                <div className="text-sm font-medium text-slate-600">
                  Hover over a nucleotide
                </div>
              </div>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
};

export default InfoPanel;
