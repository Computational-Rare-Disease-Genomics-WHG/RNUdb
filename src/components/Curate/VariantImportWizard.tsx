import {
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import React, { useState, useCallback, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface VariantImportWizardProps {
  geneId: string;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ImportResult {
  success: boolean;
  imported_count: number;
  skipped_count: number;
  errors: { row: number; field: string; message: string }[];
  warnings: { row: number; message: string }[];
}

interface FieldMapping {
  vcfField: string;
  targetColumn: string;
}

interface ParsedVariant {
  chrom: string;
  pos: number;
  ref: string;
  alt: string;
  [key: string]: string | number | null;
}

const STEPS = [
  { id: 1, label: "Upload" },
  { id: 2, label: "Map Fields" },
  { id: 3, label: "Preview" },
];

const TARGET_COLUMNS = [
  {
    value: "nucleotidePosition",
    label: "Nucleotide Position",
    description: "Position in RNA sequence",
  },
  { value: "hgvs", label: "HGVS", description: "HGVS nomenclature" },
  {
    value: "consequence",
    label: "Consequence",
    description: "Variant consequence type",
  },
  {
    value: "function_score",
    label: "Function Score",
    description: "Functional impact score",
  },
  { value: "pvalues", label: "P-Value", description: "Statistical p-value" },
  { value: "qvalues", label: "Q-Value", description: "Adjusted q-value" },
  {
    value: "depletion_group",
    label: "Depletion Group",
    description: "Depletion category",
  },
  {
    value: "gnomad_ac",
    label: "gnomAD AC",
    description: "gnomAD allele count",
  },
  {
    value: "gnomad_hom",
    label: "gnomAD Hom",
    description: "gnomAD homozygous count",
  },
  {
    value: "aou_ac",
    label: "All of Us AC",
    description: "All of Us allele count",
  },
  {
    value: "aou_hom",
    label: "All of Us Hom",
    description: "All of Us homozygous count",
  },
];

const COMMON_FIELD_PATTERNS: Record<string, string> = {
  HGVS: "hgvs",
  HGVS_NOMENCLATURE: "hgvs",
  FUNCTION_SCORE: "function_score",
  FUNCTIONSCORE: "function_score",
  FUNC_SCORE: "function_score",
  PVALUES: "pvalues",
  P_VALUE: "pvalues",
  PVALUE: "pvalues",
  P_VAL: "pvalues",
  QVALUES: "qvalues",
  Q_VALUE: "qvalues",
  QVALUE: "qvalues",
  Q_VAL: "qvalues",
  DEPLETION_GROUP: "depletion_group",
  DEPLETION: "depletion_group",
  DEPLETIONGROUP: "depletion_group",
  GNOMAD_AC: "gnomad_ac",
  GNOMADAC: "gnomad_ac",
  GnomAD_AC: "gnomad_ac",
  GNOMAD_HOM: "gnomad_hom",
  GNOMADHOM: "gnomad_hom",
  GnomAD_HOM: "gnomad_hom",
  AOU_AC: "aou_ac",
  AOUAC: "aou_ac",
  AoU_AC: "aou_ac",
  AOU_HOM: "aou_hom",
  AOUHOM: "aou_hom",
  AoU_HOM: "aou_hom",
  NUCLEOTIDE_POSITION: "nucleotidePosition",
  NUCLEOTIDEPOSITION: "nucleotidePosition",
  NUCLEOTIDE_POS: "nucleotidePosition",
  POSITION_RNA: "nucleotidePosition",
  CONSEQUENCE: "consequence",
  CONSEQUENCES: "consequence",
  VARIANT_TYPE: "consequence",
  VAR_TYPE: "consequence",
};

const VariantImportWizard = ({
  geneId,
  open,
  onClose,
  onSuccess,
}: VariantImportWizardProps) => {
  const [step, setStep] = useState(1);
  const [vcfFile, setVcfFile] = useState<File | null>(null);
  const [vcfContent, setVcfContent] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [detectedFields, setDetectedFields] = useState<string[]>([]);
  const [fieldMappings, setFieldMappings] = useState<FieldMapping[]>([]);
  const [parsedVariants, setParsedVariants] = useState<ParsedVariant[]>([]);

  const detectAndMapFields = useCallback((content: string) => {
    const lines = content.split("\n");
    const detected: string[] = [];
    const mappings: FieldMapping[] = [];

    for (const line of lines) {
      if (line.startsWith("##INFO")) {
        const match = line.match(/ID=([^,]+)/);
        if (match) {
          const vcfField = match[1];
          detected.push(vcfField);

          const upperField = vcfField.toUpperCase();
          const autoMapped = COMMON_FIELD_PATTERNS[upperField] || "";

          mappings.push({
            vcfField,
            targetColumn: autoMapped,
          });
        }
      }
      if (line.startsWith("#CHROM")) break;
    }

    setDetectedFields(detected);
    setFieldMappings(mappings);
  }, []);

  const parseVcfData = useCallback(
    (content: string) => {
      const lines = content.split("\n");
      const variants: ParsedVariant[] = [];

      for (const line of lines) {
        if (line.startsWith("#") || !line.trim()) continue;

        const parts = line.split("\t");
        if (parts.length < 5) continue;

        const variant: ParsedVariant = {
          chrom: parts[0],
          pos: parseInt(parts[1], 10),
          ref: parts[3],
          alt: parts[4],
        };

        if (parts.length >= 8 && parts[7]) {
          const infoFields = parts[7].split(";");
          for (const field of infoFields) {
            const [key, value] = field.split("=");
            if (key && value) {
              const mappedField = fieldMappings.find(
                (m) => m.vcfField.toUpperCase() === key.toUpperCase(),
              );
              const targetKey = mappedField?.targetColumn || key.toLowerCase();
              variant[targetKey] = isNaN(Number(value)) ? value : Number(value);
            }
          }
        }

        variants.push(variant);
      }

      setParsedVariants(variants);
    },
    [fieldMappings],
  );

  const handleVcfUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (!f) return;

      if (!f.name.toLowerCase().endsWith(".vcf")) {
        setError("Please upload a VCF file");
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setVcfContent(text);
        detectAndMapFields(text);
      };
      reader.readAsText(f);

      setVcfFile(f);
      setError("");
      setStep(2);
    },
    [detectAndMapFields],
  );

  const handleMappingChange = (vcfField: string, targetColumn: string) => {
    setFieldMappings((prev) =>
      prev.map((m) => (m.vcfField === vcfField ? { ...m, targetColumn } : m)),
    );
  };

  const handleContinueToPreview = () => {
    parseVcfData(vcfContent);
    setStep(3);
  };

  const handleImport = async () => {
    if (!vcfFile) return;
    setLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", vcfFile);

      const filteredMappings = fieldMappings.filter(
        (m) => m.targetColumn && m.targetColumn !== "skip",
      );
      const mappingJson = JSON.stringify(filteredMappings);
      formData.append("field_mappings", mappingJson);

      const res = await fetch(`/api/imports/variants/vcf?geneId=${geneId}`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail?.message || "VCF import failed");
      }

      const data = await res.json();
      setImportResult(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Import failed";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setStep(1);
    setVcfFile(null);
    setVcfContent("");
    setError("");
    setImportResult(null);
    setDetectedFields([]);
    setFieldMappings([]);
    setParsedVariants([]);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSuccessAndClose = () => {
    onSuccess();
    handleClose();
  };

  const mappedColumns = useMemo(() => {
    return fieldMappings
      .filter(
        (m) => m.targetColumn && m.targetColumn !== "" && m.targetColumn !== "skip",
      )
      .map((m) => m.targetColumn);
  }, [fieldMappings]);

  const progress = ((step - 1) / (STEPS.length - 1)) * 100;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden bg-white border-2 border-slate-200 shadow-2xl">
        <div className="bg-gradient-to-r from-teal-600 to-teal-700 px-8 py-6">
          <DialogHeader className="p-0">
            <DialogTitle className="text-white text-xl font-bold flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Import Variants from VCF
            </DialogTitle>
            <DialogDescription className="sr-only">
              Import variants from VCF file for gene {geneId}. Step {step} of{" "}
              {STEPS.length}
            </DialogDescription>
            <p className="text-teal-100 text-sm mt-1">
              Gene: {geneId} • Step {step} of {STEPS.length}
            </p>
          </DialogHeader>
        </div>

        <div className="px-8 py-4 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center justify-between mb-2">
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex items-center">
                <div
                  className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors
                  ${step > s.id ? "bg-emerald-500 text-white" : ""}
                  ${step === s.id ? "bg-teal-600 text-white" : ""}
                  ${step < s.id ? "bg-slate-200 text-slate-500" : ""}
                `}
                >
                  {step > s.id ? <CheckCircle2 className="h-4 w-4" /> : s.id}
                </div>
                <span
                  className={`
                  ml-2 text-sm font-medium hidden sm:inline
                  ${step >= s.id ? "text-slate-900" : "text-slate-400"}
                `}
                >
                  {s.label}
                </span>
                {i < STEPS.length - 1 && (
                  <div
                    className={`
                    w-12 h-0.5 mx-2 sm:w-16
                    ${step > s.id ? "bg-emerald-500" : "bg-slate-200"}
                  `}
                  />
                )}
              </div>
            ))}
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>

        <div className="px-8 py-6 max-h-[60vh] overflow-y-auto">
          {step === 1 && (
            <div className="space-y-6">
              <div
                className="border-2 border-dashed border-slate-300 rounded-2xl p-12 text-center hover:border-teal-500 hover:bg-teal-50/30 transition-all cursor-pointer"
                onClick={() => document.getElementById("vcf-file")?.click()}
              >
                <div className="p-4 bg-teal-50 rounded-2xl w-fit mx-auto mb-4">
                  <FileText className="h-8 w-8 text-teal-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  Upload VCF File
                </h3>
                <p className="text-sm text-slate-500 mb-4 max-w-sm mx-auto">
                  Select a VCF file to import variants. INFO fields will be
                  automatically detected in the next step.
                </p>
                <div className="flex items-center justify-center gap-2">
                  <span className="px-3 py-1 bg-slate-100 rounded-full text-xs text-slate-600">
                    .vcf
                  </span>
                </div>
                <input
                  type="file"
                  accept=".vcf"
                  onChange={handleVcfUpload}
                  className="hidden"
                  id="vcf-file"
                />
              </div>

              {error && (
                <div className="flex items-start gap-3 p-4 bg-red-50 rounded-xl border border-red-200">
                  <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    Map INFO Fields
                  </h3>
                  <p className="text-sm text-slate-500">
                    {detectedFields.length} field(s) detected in VCF
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setVcfFile(null);
                    setStep(1);
                  }}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Change File
                </Button>
              </div>

              {vcfFile && (
                <div className="flex items-center gap-3 p-4 bg-teal-50 rounded-xl border border-teal-200">
                  <FileText className="h-5 w-5 text-teal-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900">{vcfFile.name}</p>
                    <p className="text-xs text-slate-500">
                      {detectedFields.length} INFO field(s)
                    </p>
                  </div>
                </div>
              )}

              {fieldMappings.length > 0 ? (
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <div className="bg-slate-50 px-4 py-2 border-b border-slate-200">
                    <h4 className="text-sm font-medium text-slate-700">
                      Field Mapping
                    </h4>
                    <p className="text-xs text-slate-500">
                      Map each INFO field to the corresponding variant column
                    </p>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {fieldMappings.map((mapping) => (
                      <div
                        key={mapping.vcfField}
                        className="grid grid-cols-3 gap-3 px-4 py-3 items-center"
                      >
                        <div className="col-span-1">
                          <span className="text-sm font-mono text-slate-700 bg-slate-100 px-2 py-1 rounded">
                            {mapping.vcfField}
                          </span>
                        </div>
                        <div className="col-span-2">
                          <Select
                            value={mapping.targetColumn}
                            onValueChange={(value) =>
                              handleMappingChange(mapping.vcfField, value)
                            }
                          >
                            <SelectTrigger className="h-8 text-sm">
                              <SelectValue placeholder="Select target column" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="skip">-- Skip --</SelectItem>
                              {TARGET_COLUMNS.map((col) => (
                                <SelectItem key={col.value} value={col.value}>
                                  <div>
                                    <span className="font-medium">{col.label}</span>
                                    <span className="text-slate-500 text-xs ml-1">
                                      - {col.description}
                                    </span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-500">
                  No INFO fields detected in the VCF file.
                </p>
              )}

              {mappedColumns.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  <span className="text-sm text-slate-500 mr-2">Mapped fields:</span>
                  {mappedColumns.map((col) => {
                    const target = TARGET_COLUMNS.find((t) => t.value === col);
                    return (
                      <Badge
                        key={col}
                        variant="secondary"
                        className="bg-teal-100 text-teal-700"
                      >
                        {target?.label || col}
                      </Badge>
                    );
                  })}
                </div>
              )}

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button
                  onClick={handleContinueToPreview}
                  className="bg-teal-600 hover:bg-teal-700 text-white"
                >
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Continue to Preview
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    Preview Variants
                  </h3>
                  <p className="text-sm text-slate-500">
                    {parsedVariants.length} variant(s) ready to import
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setStep(2)}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Mapping
                </Button>
              </div>

              {parsedVariants.length > 0 ? (
                <div className="border-2 border-slate-200 rounded-xl overflow-hidden">
                  <div className="overflow-x-auto max-h-64">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 sticky top-0">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase">
                            Chrom
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase">
                            Position
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase">
                            Ref
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase">
                            Alt
                          </th>
                          {mappedColumns.slice(0, 3).map((col) => (
                            <th
                              key={col}
                              className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase"
                            >
                              {TARGET_COLUMNS.find((t) => t.value === col)?.label ||
                                col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {parsedVariants.slice(0, 10).map((variant, i) => (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="px-3 py-2 text-slate-700 font-mono text-xs">
                              {variant.chrom}
                            </td>
                            <td className="px-3 py-2 text-slate-700 font-mono text-xs">
                              {variant.pos}
                            </td>
                            <td className="px-3 py-2 text-slate-700 font-mono text-xs">
                              {variant.ref}
                            </td>
                            <td className="px-3 py-2 text-slate-700 font-mono text-xs">
                              {variant.alt}
                            </td>
                            {mappedColumns.slice(0, 3).map((col) => (
                              <td
                                key={col}
                                className="px-3 py-2 text-slate-700 text-xs"
                              >
                                {variant[col] !== undefined
                                  ? String(variant[col])
                                  : "-"}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {parsedVariants.length > 10 && (
                    <div className="px-4 py-2 bg-slate-50 text-center text-xs text-slate-500 border-t">
                      Showing 10 of {parsedVariants.length} variants
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-slate-500">
                  No variants found in the VCF file.
                </p>
              )}

              {error && (
                <div className="flex items-start gap-3 p-4 bg-red-50 rounded-xl border border-red-200">
                  <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setStep(2)}>
                  Back
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={loading || parsedVariants.length === 0}
                  className="bg-teal-600 hover:bg-teal-700 text-white"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Upload className="h-4 w-4 mr-2" />
                  )}
                  Import {parsedVariants.length} Variants
                </Button>
              </div>
            </div>
          )}

          {importResult && (
            <div className="space-y-5">
              <div
                className={`flex items-center gap-3 p-4 rounded-lg ${
                  importResult.success
                    ? "bg-emerald-50 border border-emerald-200"
                    : "bg-red-50 border border-red-200"
                }`}
              >
                {importResult.success ? (
                  <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                ) : (
                  <AlertCircle className="h-6 w-6 text-red-600" />
                )}
                <div>
                  <h3 className="text-base font-semibold text-slate-900">
                    Import {importResult.success ? "Successful" : "Failed"}
                  </h3>
                  <p className="text-sm text-slate-500">
                    {importResult.imported_count} variants imported,{" "}
                    {importResult.skipped_count} skipped
                    {importResult.errors.length > 0 &&
                      `, ${importResult.errors.length} errors`}
                  </p>
                </div>
              </div>

              {importResult.errors.length > 0 && (
                <div className="max-h-32 overflow-y-auto border border-slate-200 rounded-lg">
                  <div className="bg-slate-50 px-3 py-2 border-b border-slate-200">
                    <h4 className="text-sm font-medium text-slate-700">
                      Errors ({importResult.errors.length})
                    </h4>
                  </div>
                  <div className="px-3 py-2 space-y-1">
                    {importResult.errors.slice(0, 5).map((err, i) => (
                      <p
                        key={i}
                        className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded"
                      >
                        Row {err.row}: {err.message}
                      </p>
                    ))}
                    {importResult.errors.length > 5 && (
                      <p className="text-xs text-slate-500">
                        ...and {importResult.errors.length - 5} more
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <Button
                  onClick={handleSuccessAndClose}
                  className="bg-teal-600 hover:bg-teal-700 text-white"
                >
                  Done
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VariantImportWizard;
