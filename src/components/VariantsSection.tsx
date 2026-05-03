import { Database, ExternalLink, Link as LinkIcon } from "lucide-react";
import React from "react";
import { COLORBLIND_FRIENDLY_PALETTE } from "../lib/colors";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Variant } from "@/types";

interface VariantsSectionProps {
  variantData: Variant[];
  currentGene: string;
}

const VariantsSection: React.FC<VariantsSectionProps> = ({
  variantData,
  currentGene,
}) => {
  const clinicalVariants = variantData.filter(
    (variant) => variant.clinical_significance || variant.cohort,
  );

  const clinicalVariantStats = {
    pathogenic: clinicalVariants.filter(
      (v) =>
        v.clinical_significance?.toLowerCase().includes("path") ||
        v.clinical_significance?.toLowerCase() === "lp" ||
        v.clinical_significance?.toLowerCase() === "p",
    ).length,
    benign: clinicalVariants.filter(
      (v) =>
        v.clinical_significance?.toLowerCase().includes("benign") ||
        v.clinical_significance?.toLowerCase() === "lb" ||
        v.clinical_significance?.toLowerCase() === "b",
    ).length,
    vus: clinicalVariants.filter(
      (v) =>
        v.clinical_significance?.toLowerCase().includes("vus") ||
        v.clinical_significance?.toLowerCase().includes("uncertain") ||
        v.clinical_significance?.toLowerCase() === "vus",
    ).length,
    total: clinicalVariants.length,
  };

  const getClinicalBadge = (clinical: string) => {
    const colorMap: { [key: string]: string } = {
      Benign: "bg-emerald-100 text-emerald-800 border-emerald-200",
      Pathogenic: "bg-red-100 text-red-800 border-red-200",
      "Likely Pathogenic": "bg-red-100 text-red-700 border-red-200",
      "Likely Benign": "bg-emerald-100 text-emerald-700 border-emerald-200",
      VUS: "bg-amber-100 text-amber-800 border-amber-200",
      B: "bg-emerald-100 text-emerald-800 border-emerald-200",
      LB: "bg-emerald-100 text-emerald-700 border-emerald-200",
      P: "bg-red-100 text-red-800 border-red-200",
      LP: "bg-red-100 text-red-700 border-red-200",
      PATH: "bg-red-100 text-red-800 border-red-200",
    };
    return (
      colorMap[clinical as keyof typeof colorMap] ||
      "bg-gray-100 text-gray-800 border-gray-200"
    );
  };

  return (
    <Card
      className="bg-white/95 backdrop-blur-sm border border-slate-200 shadow-xl shadow-slate-200/30 rounded-2xl h-full"
      id="variants"
    >
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-6 w-6 text-teal-600" />
              Clinical Variants ({clinicalVariants.length} variants)
            </CardTitle>
            <CardDescription>
              Curated clinical variants in {currentGene} with ACMG
              classifications
            </CardDescription>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{
                  backgroundColor:
                    COLORBLIND_FRIENDLY_PALETTE.CLINVAR.PATHOGENIC,
                }}
              ></div>
              <span>{clinicalVariantStats.pathogenic} Pathogenic</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{
                  backgroundColor: COLORBLIND_FRIENDLY_PALETTE.CLINVAR.BENIGN,
                }}
              ></div>
              <span>{clinicalVariantStats.benign} Benign</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{
                  backgroundColor: COLORBLIND_FRIENDLY_PALETTE.CLINVAR.VUS,
                }}
              ></div>
              <span>{clinicalVariantStats.vus} VUS</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="grid gap-3 max-h-96 overflow-y-auto">
            {clinicalVariants.map((variant) => (
              <div
                key={variant.id}
                className="bg-slate-50 p-4 rounded-xl border border-slate-200 hover:shadow-md transition-all duration-300"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 flex-wrap mb-2">
                      <Badge
                        variant="outline"
                        className="font-mono text-xs bg-white border-slate-300 text-slate-700"
                      >
                        {variant.id}
                      </Badge>
                      <span className="text-xs text-gray-600 font-mono">
                        {variant.position}
                      </span>
                      <Badge className="font-mono text-xs bg-slate-200 text-slate-800 border-slate-300">
                        {variant.ref}→{variant.alt}
                      </Badge>
                      {variant.linkedVariantIds &&
                        variant.linkedVariantIds.length > 0 && (
                          <Badge
                            variant="outline"
                            className="text-xs bg-indigo-50 text-indigo-700 border-indigo-200"
                          >
                            <LinkIcon className="h-3 w-3 mr-1" />
                            Linked ({variant.linkedVariantIds.length})
                          </Badge>
                        )}
                      {variant.zygosity && (
                        <Badge
                          variant="outline"
                          className="text-xs bg-purple-50 text-purple-700 border-purple-200"
                        >
                          {variant.zygosity}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge
                        className={`text-xs ${getClinicalBadge(variant.clinical_significance ?? "")}`}
                      >
                        {variant.clinical_significance}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-right">
                    <div className="text-xs text-gray-600">
                      <div>
                        <span className="font-medium">Position:</span>{" "}
                        {variant.nucleotidePosition ?? "N/A"}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-2 hover:bg-blue-50 hover:border-blue-300 transition-colors duration-200"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default VariantsSection;
