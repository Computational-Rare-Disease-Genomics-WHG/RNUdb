import {
  Database,
  Dna,
  Globe,
  Search,
  AlertTriangle,
  Users,
  ExternalLink,
  Link as LinkIcon,
} from "lucide-react";
import React from "react";
import { useNavigate } from "react-router";
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
  overlayMode:
    | "none"
    | "clinvar"
    | "gnomad"
    | "function_score"
    | "depletion_group";
  onCycleOverlay: () => void;
  hoveredNucleotide: Nucleotide | null;
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
        return variant.nucleotidePosition === nucleotideId;
      } else if (variant.position) {
        let nucleotidePos: number;
        if (currentData.strand === "-") {
          nucleotidePos = currentData.end - variant.position + 1;
        } else {
          nucleotidePos = variant.position - currentData.start + 1;
        }
        return nucleotidePos === nucleotideId;
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

    const clinicalVariants = filteredVariants.filter(
      (v) => v.clinical_significance,
    );
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

  const handleVariantClick = (variant: Variant) => {
    if (variant.position) {
      navigate(`/curate?gene=${currentData.name}&variant=${variant.id}`);
    }
  };

  const getClinicalBadgeClass = (significance?: string) => {
    const lower = significance?.toLowerCase() || "";
    if (lower.includes("pathogenic") && !lower.includes("likely"))
      return "bg-red-100 text-red-700 border-red-200";
    if (lower.includes("likely pathogenic") || lower === "lp")
      return "bg-orange-100 text-orange-700 border-orange-200";
    if (lower.includes("benign") && !lower.includes("likely"))
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    if (lower.includes("likely benign") || lower === "lb")
      return "bg-green-100 text-green-700 border-green-200";
    if (lower.includes("vus") || lower.includes("uncertain"))
      return "bg-amber-100 text-amber-700 border-amber-200";
    return "bg-slate-100 text-slate-700 border-slate-200";
  };

  const getLiteratureForVariant = (variantId: string) => {
    const counts = literatureCounts.filter((lc) => lc.variant_id === variantId);
    return counts
      .map((count) => {
        const literature = paperData.find((p) => p.id === count.literature_id);
        return literature ? { ...literature, count: count.counts } : null;
      })
      .filter((lit): lit is Literature & { count: number } => lit !== null);
  };

  return (
    <div className="space-y-4">
      <Card className="bg-gradient-to-br from-white to-teal-50/50 border-teal-200 shadow-md">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-teal-600 rounded-lg shadow-md">
              <Dna className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-xl font-bold text-slate-900">
                {currentData.name}
              </CardTitle>
              <CardDescription className="text-sm text-teal-600 font-medium">
                {currentData.fullName}
              </CardDescription>
            </div>
            <Badge className="bg-teal-100 text-teal-700 border-teal-300 px-2.5 py-1 text-xs font-semibold">
              snRNA
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-slate-600 leading-relaxed line-clamp-3">
            {currentData.description}
          </p>

          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 bg-white rounded-lg border border-slate-200 shadow-sm">
              <div className="text-xs text-teal-600 font-semibold mb-1">
                Chr
              </div>
              <div className="text-lg font-bold text-slate-900">
                {currentData.chromosome}
              </div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg border border-slate-200 shadow-sm">
              <div className="text-xs text-teal-600 font-semibold mb-1">
                Position
              </div>
              <div className="text-sm font-mono font-medium text-slate-900">
                {currentData.start.toLocaleString()}
              </div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg border border-slate-200 shadow-sm">
              <div className="text-xs text-teal-600 font-semibold mb-1">
                Length
              </div>
              <div className="text-lg font-bold text-slate-900">
                {geneLength} bp
              </div>
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
                variant="outline"
                className="w-full h-8 border-teal-200 text-teal-700 hover:bg-teal-50"
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
                variant="outline"
                className="w-full h-8 border-teal-200 text-teal-700 hover:bg-teal-50"
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
                variant="outline"
                className="w-full h-8 border-teal-200 text-teal-700 hover:bg-teal-50"
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
            <CardHeader className="pb-3 bg-gradient-to-r from-slate-50 to-teal-50/30 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl shadow-md">
                  <span className="text-xl font-bold text-white">
                    {hoveredNucleotide.base}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg font-bold text-slate-900">
                    Nucleotide {hoveredNucleotide.id}
                  </CardTitle>
                  <CardDescription className="text-sm text-slate-600">
                    Genomic:{" "}
                    {(currentData.strand === "-"
                      ? currentData.end - hoveredNucleotide.id + 1
                      : currentData.start + hoveredNucleotide.id - 1
                    ).toLocaleString()}
                  </CardDescription>
                </div>
                <Badge
                  variant="outline"
                  className="bg-white text-slate-700 border-slate-300 font-mono text-base px-3 py-1"
                >
                  {hoveredNucleotide.base}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              {(() => {
                const variantInfo = getVariantInfoForNucleotide(
                  hoveredNucleotide.id,
                );
                const totalVariants = variantInfo.allVariants.length;

                if (totalVariants === 0) {
                  return (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                      <svg
                        className="w-14 h-14 mb-4 text-teal-400"
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
                      <div className="text-base font-semibold text-slate-700 mb-1">
                        No known variants
                      </div>
                      <div className="text-sm text-slate-500">
                        This position appears conserved
                      </div>
                    </div>
                  );
                }

                return (
                  <div className="space-y-4">
                    {variantInfo.clinicalVariants.length > 0 && (
                      <div className="p-4 bg-gradient-to-br from-red-50/50 to-white rounded-xl border border-red-200 shadow-sm">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-2.5 h-2.5 bg-red-500 rounded-full shadow-sm"></div>
                          <span className="text-sm font-semibold text-red-900">
                            Clinical Variants (
                            {variantInfo.clinicalVariants.length})
                          </span>
                        </div>
                        <div className="space-y-3">
                          {variantInfo.clinicalVariants
                            .slice(0, 3)
                            .map((variant: Variant, index: number) => {
                              const variantLiterature = getLiteratureForVariant(
                                variant.id,
                              );
                              const linkedVariants = variant.linkedVariantIds
                                ? variantData.filter((v) =>
                                    variant.linkedVariantIds!.includes(v.id),
                                  )
                                : [];

                              return (
                                <div
                                  key={index}
                                  className="p-3 bg-white rounded-lg border border-red-100 shadow-sm"
                                >
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                      <AlertTriangle className="h-4 w-4 text-red-500" />
                                      <div className="flex flex-col">
                                        <button
                                          onClick={() =>
                                            handleVariantClick(variant)
                                          }
                                          className="font-mono text-xs text-teal-600 hover:text-teal-800 hover:underline text-left"
                                        >
                                          {normalizeVariantId(variant.id)}
                                        </button>
                                        <span className="font-mono text-sm font-semibold text-slate-900">
                                          {variant.ref}→{variant.alt}
                                        </span>
                                      </div>
                                    </div>
                                    <Badge
                                      className={`text-xs font-medium ${getClinicalBadgeClass(variant.clinical_significance)}`}
                                    >
                                      {variant.clinical_significance}
                                    </Badge>
                                  </div>

                                  {variant.zygosity && (
                                    <div className="flex items-center gap-2 mb-2">
                                      <Badge
                                        variant="outline"
                                        className="text-xs bg-purple-50 text-purple-700 border-purple-200"
                                      >
                                        {variant.zygosity}
                                      </Badge>
                                    </div>
                                  )}

                                  {linkedVariants.length > 0 && (
                                    <div className="mb-2 p-2 bg-purple-50/50 rounded-lg border border-purple-200">
                                      <div className="text-xs text-purple-700 font-semibold mb-1 flex items-center gap-1">
                                        <LinkIcon className="h-3 w-3" />
                                        Compound Heterozygous:
                                      </div>
                                      <div className="flex flex-wrap gap-1">
                                        {linkedVariants.map(
                                          (linked, linkedIndex) => (
                                            <span
                                              key={linkedIndex}
                                              className="text-xs bg-white px-2 py-0.5 rounded border border-purple-200 text-slate-700"
                                            >
                                              <span className="font-mono">
                                                {normalizeVariantId(linked.id)}
                                              </span>
                                              <span className="mx-1 text-purple-400">
                                                ·
                                              </span>
                                              <span>
                                                {linked.ref}→{linked.alt}
                                              </span>
                                            </span>
                                          ),
                                        )}
                                      </div>
                                    </div>
                                  )}

                                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 pt-2 border-t border-slate-100">
                                    {variant.gnomad_ac !== undefined &&
                                      variant.gnomad_ac > 0 && (
                                        <span className="text-xs text-slate-600">
                                          <span className="font-semibold text-slate-700">
                                            gnomAD:
                                          </span>{" "}
                                          {variant.gnomad_ac.toLocaleString()}
                                        </span>
                                      )}
                                    {variant.aou_ac !== undefined &&
                                      variant.aou_ac > 0 && (
                                        <span className="text-xs text-slate-600">
                                          <span className="font-semibold text-slate-700">
                                            AoU:
                                          </span>{" "}
                                          {variant.aou_ac.toLocaleString()}
                                        </span>
                                      )}
                                    {variant.ukbb_ac !== undefined &&
                                      variant.ukbb_ac > 0 && (
                                        <span className="text-xs text-slate-600">
                                          <span className="font-semibold text-slate-700">
                                            UKBB:
                                          </span>{" "}
                                          {variant.ukbb_ac.toLocaleString()}
                                        </span>
                                      )}
                                  </div>

                                  {variantLiterature.length > 0 && (
                                    <div className="mt-3 pt-2 border-t border-slate-100">
                                      <div className="text-xs text-slate-500 font-medium mb-2 flex items-center gap-1">
                                        <Users className="h-3 w-3" />
                                        Literature ({variantLiterature.length})
                                      </div>
                                      <div className="space-y-1.5">
                                        {variantLiterature.map(
                                          (lit, litIndex) => (
                                            <div
                                              key={litIndex}
                                              className="flex items-start justify-between gap-2 text-xs bg-slate-50 p-2 rounded border border-slate-100"
                                            >
                                              <div className="min-w-0 flex-1">
                                                <span className="text-slate-700 font-medium truncate block">
                                                  {lit.authors}
                                                </span>
                                                <span className="text-slate-500">
                                                  ({lit.year}) · {lit.count}{" "}
                                                  individual
                                                  {lit.count !== 1 ? "s" : ""}
                                                </span>
                                              </div>
                                              <a
                                                href={`https://doi.org/${lit.doi}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="shrink-0 text-teal-600 hover:text-teal-800"
                                              >
                                                <ExternalLink className="h-3.5 w-3.5" />
                                              </a>
                                            </div>
                                          ),
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    )}

                    {variantInfo.populationVariants.length > 0 && (
                      <div className="p-4 bg-gradient-to-br from-blue-50/50 to-white rounded-xl border border-blue-200 shadow-sm">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-2.5 h-2.5 bg-blue-500 rounded-sm shadow-sm"></div>
                          <span className="text-sm font-semibold text-blue-900">
                            Population Variants (
                            {variantInfo.populationVariants.length})
                          </span>
                        </div>
                        <div className="space-y-2">
                          {variantInfo.populationVariants
                            .slice(0, 3)
                            .map((variant: Variant, index: number) => {
                              return (
                                <div
                                  key={index}
                                  className="p-3 bg-white rounded-lg border border-blue-100 shadow-sm"
                                >
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                      <div className="flex flex-col">
                                        <button
                                          onClick={() =>
                                            handleVariantClick(variant)
                                          }
                                          className="font-mono text-xs text-teal-600 hover:text-teal-800 hover:underline text-left"
                                        >
                                          {normalizeVariantId(variant.id)}
                                        </button>
                                        <span className="font-mono text-sm font-semibold text-slate-900">
                                          {variant.ref}→{variant.alt}
                                        </span>
                                      </div>
                                    </div>
                                    <Badge className="text-xs bg-blue-100 text-blue-700 border-blue-200 font-medium">
                                      Population
                                    </Badge>
                                  </div>

                                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 pt-2 border-t border-slate-100">
                                    {variant.gnomad_ac !== undefined &&
                                      variant.gnomad_ac > 0 && (
                                        <span className="text-xs text-slate-600">
                                          <span className="font-semibold text-slate-700">
                                            gnomAD:
                                          </span>{" "}
                                          {variant.gnomad_ac.toLocaleString()}
                                        </span>
                                      )}
                                    {variant.aou_ac !== undefined &&
                                      variant.aou_ac > 0 && (
                                        <span className="text-xs text-slate-600">
                                          <span className="font-semibold text-slate-700">
                                            AoU:
                                          </span>{" "}
                                          {variant.aou_ac.toLocaleString()}
                                        </span>
                                      )}
                                    {variant.ukbb_ac !== undefined &&
                                      variant.ukbb_ac > 0 && (
                                        <span className="text-xs text-slate-600">
                                          <span className="font-semibold text-slate-700">
                                            UKBB:
                                          </span>{" "}
                                          {variant.ukbb_ac.toLocaleString()}
                                        </span>
                                      )}
                                  </div>
                                </div>
                              );
                            })}
                        </div>
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
              <CardTitle className="text-lg font-bold text-slate-900">
                Nucleotide Details
              </CardTitle>
              <CardDescription className="text-sm text-slate-600">
                Hover over a nucleotide in the RNA structure
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <svg
                  className="w-16 h-16 mb-4 text-slate-300"
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
                  <circle
                    cx="32"
                    cy="32"
                    r="8"
                    fill="currentColor"
                    opacity="0.3"
                  />
                  <circle
                    cx="32"
                    cy="32"
                    r="4"
                    fill="currentColor"
                    opacity="0.5"
                  />
                </svg>
                <div className="text-base font-semibold text-slate-700 mb-1">
                  No nucleotide selected
                </div>
                <div className="text-sm text-slate-500">
                  Hover over a nucleotide to view variant information
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
