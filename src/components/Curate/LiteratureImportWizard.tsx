import {
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import React, { useState, useCallback } from "react";
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

interface LiteratureImportWizardProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface LiteratureRow {
  doi: string;
  title: string;
  authors: string;
  journal: string;
  year: string;
  pmid?: string;
  url?: string;
}

interface ImportResult {
  success: boolean;
  imported_count: number;
  skipped_count: number;
  errors: { row: number; field: string; message: string }[];
}

interface FieldMapping {
  csvField: string;
  targetColumn: string;
}

const STEPS = [
  { id: 1, label: "Upload" },
  { id: 2, label: "Map Fields" },
  { id: 3, label: "Preview" },
  { id: 4, label: "Import" },
];

const TARGET_COLUMNS = [
  { value: "doi", label: "DOI", description: "Unique identifier (required)" },
  { value: "title", label: "Title", description: "Paper title (required)" },
  { value: "authors", label: "Authors", description: "Author list (required)" },
  {
    value: "journal",
    label: "Journal",
    description: "Journal name (required)",
  },
  { value: "year", label: "Year", description: "Publication year (required)" },
  { value: "pmid", label: "PMID", description: "PubMed ID (optional)" },
  { value: "url", label: "URL", description: "Link to paper (optional)" },
];

const COMMON_FIELD_PATTERNS: Record<string, string> = {
  DOI: "doi",
  ID: "doi",
  PAPER_ID: "doi",
  TITLE: "title",
  PAPER_TITLE: "title",
  AUTHORS: "authors",
  AUTHOR: "authors",
  AUTHOR_LIST: "authors",
  JOURNAL: "journal",
  PUBLICATION: "journal",
  YEAR: "year",
  PUBLICATION_YEAR: "year",
  PMID: "pmid",
  PUBMED_ID: "pmid",
  URL: "url",
  LINK: "url",
  LINK_URL: "url",
};

const LiteratureImportWizard = ({
  open,
  onClose,
  onSuccess,
}: LiteratureImportWizardProps) => {
  const [step, setStep] = useState(1);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [rawHeaders, setRawHeaders] = useState<string[]>([]);
  const [fieldMappings, setFieldMappings] = useState<FieldMapping[]>([]);
  const [parsedData, setParsedData] = useState<LiteratureRow[]>([]);
  const [validationErrors, setValidationErrors] = useState<
    { row: number; field: string; message: string }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const detectAndMapFields = useCallback((headers: string[]) => {
    const detected: string[] = [];
    const mappings: FieldMapping[] = [];

    headers.forEach((header) => {
      const normalizedHeader = header.trim().toUpperCase();
      const autoMapped = COMMON_FIELD_PATTERNS[normalizedHeader] || "";
      detected.push(header.trim());
      mappings.push({
        csvField: header.trim(),
        targetColumn: autoMapped,
      });
    });

    setRawHeaders(detected);
    setFieldMappings(mappings);
  }, []);

  const parseCSV = useCallback(
    (content: string, mappings: FieldMapping[]): LiteratureRow[] => {
      const lines = content.trim().split("\n");
      if (lines.length < 2) return [];

      const parseCSVLine = (line: string): string[] => {
        const result: string[] = [];
        let current = "";
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === "," && !inQuotes) {
            result.push(current.trim());
            current = "";
          } else {
            current += char;
          }
        }
        result.push(current.trim());
        return result;
      };

      parseCSVLine(lines[0]);
      const rows: LiteratureRow[] = [];

      for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        const row: Record<string, string> = {};

        mappings.forEach((mapping, idx) => {
          const value = values[idx] || "";
          row[mapping.targetColumn] = value.replace(/^"|"$/g, "");
        });

        if (row.doi) {
          rows.push({
            doi: row.doi || "",
            title: row.title || "",
            authors: row.authors || "",
            journal: row.journal || "",
            year: row.year || "",
            pmid: row.pmid || undefined,
            url: row.url || undefined,
          });
        }
      }

      return rows;
    },
    [],
  );

  const validateData = useCallback((data: LiteratureRow[]) => {
    const errors: { row: number; field: string; message: string }[] = [];

    data.forEach((row, idx) => {
      if (!row.doi || row.doi.trim() === "") {
        errors.push({ row: idx + 2, field: "doi", message: "DOI is required" });
      }
      if (!row.title || row.title.trim() === "") {
        errors.push({
          row: idx + 2,
          field: "title",
          message: "Title is required",
        });
      }
      if (!row.authors || row.authors.trim() === "") {
        errors.push({
          row: idx + 2,
          field: "authors",
          message: "Authors is required",
        });
      }
      if (!row.journal || row.journal.trim() === "") {
        errors.push({
          row: idx + 2,
          field: "journal",
          message: "Journal is required",
        });
      }
      if (!row.year || row.year.trim() === "") {
        errors.push({
          row: idx + 2,
          field: "year",
          message: "Year is required",
        });
      } else if (!/^\d{4}$/.test(row.year.trim())) {
        errors.push({
          row: idx + 2,
          field: "year",
          message: "Year must be a 4-digit number",
        });
      }
    });

    return errors;
  }, []);

  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (!f) return;

      if (!f.name.toLowerCase().endsWith(".csv")) {
        setError("Please upload a CSV file");
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        const lines = text.trim().split("\n");

        if (lines.length < 2) {
          setError("CSV file is empty or has no data rows");
          return;
        }

        const parseCSVLine = (line: string): string[] => {
          const result: string[] = [];
          let current = "";
          let inQuotes = false;
          for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') inQuotes = !inQuotes;
            else if (char === "," && !inQuotes) {
              result.push(current.trim());
              current = "";
            } else current += char;
          }
          result.push(current.trim());
          return result;
        };

        const headers = parseCSVLine(lines[0]);
        detectAndMapFields(headers);
        setCsvFile(f);
        setStep(2);
        setError("");
      };
      reader.readAsText(f);
    },
    [detectAndMapFields],
  );

  const handleMappingChange = (csvField: string, targetColumn: string) => {
    setFieldMappings((prev) =>
      prev.map((m) => (m.csvField === csvField ? { ...m, targetColumn } : m)),
    );
  };

  const mappedColumns = fieldMappings
    .filter((m) => m.targetColumn && m.targetColumn !== "skip")
    .map((m) => m.targetColumn);

  const handleContinueToPreview = () => {
    parseCSV("", fieldMappings);

    const parseFullCSV = (
      content: string,
      mappings: FieldMapping[],
    ): LiteratureRow[] => {
      const lines = content.trim().split("\n");
      if (lines.length < 2) return [];

      const parseCSVLine = (line: string): string[] => {
        const result: string[] = [];
        let current = "";
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') inQuotes = !inQuotes;
          else if (char === "," && !inQuotes) {
            result.push(current.trim());
            current = "";
          } else current += char;
        }
        result.push(current.trim());
        return result;
      };

      const rows: LiteratureRow[] = [];
      for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        const row: Record<string, string> = {};
        mappings.forEach((mapping, idx) => {
          const value = values[idx] || "";
          row[mapping.targetColumn] = value.replace(/^"|"$/g, "");
        });
        if (row.doi) {
          rows.push({
            doi: row.doi || "",
            title: row.title || "",
            authors: row.authors || "",
            journal: row.journal || "",
            year: row.year || "",
            pmid: row.pmid || undefined,
            url: row.url || undefined,
          });
        }
      }
      return rows;
    };

    const fileReader = new FileReader();
    fileReader.onload = (event) => {
      const text = event.target?.result as string;
      const data = parseFullCSV(text, fieldMappings);
      setParsedData(data);

      const errors = validateData(data);
      setValidationErrors(errors);

      setStep(3);
    };
    fileReader.readAsText(csvFile!);
  };

  const handleImport = async () => {
    if (parsedData.length === 0) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/literature/bulk", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsedData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Import failed");
      }

      const data = await res.json();
      setImportResult(data);
      setStep(4);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Import failed";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setStep(1);
    setCsvFile(null);
    setRawHeaders([]);
    setFieldMappings([]);
    setParsedData([]);
    setValidationErrors([]);
    setError("");
    setImportResult(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSuccessAndClose = () => {
    onSuccess();
    handleClose();
  };

  const progress = ((step - 1) / (STEPS.length - 1)) * 100;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden bg-white border-2 border-slate-200 shadow-2xl">
        <div className="bg-gradient-to-r from-amber-500 to-amber-600 px-8 py-6">
          <DialogHeader className="p-0">
            <DialogTitle className="text-white text-xl font-bold flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Import Literature
            </DialogTitle>
            <DialogDescription className="sr-only">
              Import literature from CSV file. Step {step} of {STEPS.length}
            </DialogDescription>
            <p className="text-amber-100 text-sm mt-1">
              Step {step} of {STEPS.length}
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
                  ${step === s.id ? "bg-amber-500 text-white" : ""}
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
                className="border-2 border-dashed border-slate-300 rounded-2xl p-12 text-center hover:border-amber-500 hover:bg-amber-50/30 transition-all cursor-pointer"
                onClick={() =>
                  document.getElementById("literature-csv")?.click()
                }
              >
                <div className="p-4 bg-amber-50 rounded-2xl w-fit mx-auto mb-4">
                  <FileText className="h-8 w-8 text-amber-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  Upload CSV File
                </h3>
                <p className="text-sm text-slate-500 mb-4 max-w-sm mx-auto">
                  Select a CSV file with literature data. You can map columns in
                  the next step.
                </p>
                <div className="flex items-center justify-center gap-2">
                  <span className="px-3 py-1 bg-slate-100 rounded-full text-xs text-slate-600">
                    .csv
                  </span>
                </div>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="literature-csv"
                />
              </div>

              <div className="bg-slate-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-slate-700 mb-2">
                  Expected Columns
                </h4>
                <div className="flex flex-wrap gap-2">
                  {TARGET_COLUMNS.map((col) => (
                    <Badge
                      key={col.value}
                      variant="secondary"
                      className={col.value ? "bg-amber-100 text-amber-700" : ""}
                    >
                      {col.label}
                    </Badge>
                  ))}
                </div>
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
                    Map CSV Columns
                  </h3>
                  <p className="text-sm text-slate-500">
                    {rawHeaders.length} column(s) detected in CSV
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCsvFile(null);
                    setStep(1);
                  }}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Change File
                </Button>
              </div>

              {csvFile && (
                <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-xl border border-amber-200">
                  <FileText className="h-5 w-5 text-amber-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900">
                      {csvFile.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {rawHeaders.length} column(s)
                    </p>
                  </div>
                </div>
              )}

              {fieldMappings.length > 0 ? (
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <div className="bg-slate-50 px-4 py-2 border-b border-slate-200">
                    <h4 className="text-sm font-medium text-slate-700">
                      Column Mapping
                    </h4>
                    <p className="text-xs text-slate-500">
                      Map each CSV column to the corresponding literature field
                    </p>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {fieldMappings.map((mapping) => (
                      <div
                        key={mapping.csvField}
                        className="grid grid-cols-3 gap-3 px-4 py-3 items-center"
                      >
                        <div className="col-span-1">
                          <span className="text-sm font-mono text-slate-700 bg-slate-100 px-2 py-1 rounded">
                            {mapping.csvField}
                          </span>
                        </div>
                        <div className="col-span-2">
                          <Select
                            value={mapping.targetColumn}
                            onValueChange={(value) =>
                              handleMappingChange(mapping.csvField, value)
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
                                    <span className="font-medium">
                                      {col.label}
                                    </span>
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
                  No columns detected in the CSV file.
                </p>
              )}

              {mappedColumns.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  <span className="text-sm text-slate-500 mr-2">Mapped:</span>
                  {mappedColumns.map((col) => {
                    const target = TARGET_COLUMNS.find((t) => t.value === col);
                    return (
                      <Badge
                        key={col}
                        variant="secondary"
                        className="bg-amber-100 text-amber-700"
                      >
                        {target?.label || col}
                      </Badge>
                    );
                  })}
                </div>
              )}

              {error && (
                <div className="flex items-start gap-3 p-4 bg-red-50 rounded-xl border border-red-200">
                  <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button
                  onClick={handleContinueToPreview}
                  className="bg-amber-600 hover:bg-amber-700 text-white"
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
                    Preview Literature
                  </h3>
                  <p className="text-sm text-slate-500">
                    {parsedData.length} row(s) ready to import
                    {validationErrors.length > 0 && (
                      <span className="text-red-600 ml-2">
                        ({validationErrors.length} validation error(s))
                      </span>
                    )}
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setStep(2)}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Mapping
                </Button>
              </div>

              {validationErrors.length > 0 && (
                <div className="max-h-32 overflow-y-auto border border-red-200 rounded-lg bg-red-50">
                  <div className="bg-red-100 px-3 py-2 border-b border-red-200">
                    <h4 className="text-sm font-medium text-red-700">
                      Validation Errors ({validationErrors.length})
                    </h4>
                  </div>
                  <div className="px-3 py-2 space-y-1">
                    {validationErrors.slice(0, 10).map((err, i) => (
                      <p
                        key={i}
                        className="text-xs text-red-600 bg-white px-2 py-1 rounded"
                      >
                        Row {err.row}, {err.field}: {err.message}
                      </p>
                    ))}
                    {validationErrors.length > 10 && (
                      <p className="text-xs text-slate-500">
                        ...and {validationErrors.length - 10} more
                      </p>
                    )}
                  </div>
                </div>
              )}

              {parsedData.length > 0 ? (
                <div className="border-2 border-slate-200 rounded-xl overflow-hidden">
                  <div className="overflow-x-auto max-h-64">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 sticky top-0">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase">
                            DOI
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase">
                            Title
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase">
                            Year
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {parsedData.slice(0, 10).map((row, i) => (
                          <tr
                            key={i}
                            className={`hover:bg-slate-50 ${
                              validationErrors.some((e) => e.row === i + 2)
                                ? "bg-red-50"
                                : ""
                            }`}
                          >
                            <td className="px-3 py-2 text-slate-700 text-xs font-mono max-w-[150px] truncate">
                              {row.doi}
                            </td>
                            <td className="px-3 py-2 text-slate-700 text-xs max-w-[250px] truncate">
                              {row.title}
                            </td>
                            <td className="px-3 py-2 text-slate-700 text-xs">
                              {row.year}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {parsedData.length > 10 && (
                    <div className="px-4 py-2 bg-slate-50 text-center text-xs text-slate-500 border-t">
                      Showing 10 of {parsedData.length} records
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-slate-500">
                  No data found with the current column mapping.
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
                  disabled={loading || parsedData.length === 0}
                  className="bg-amber-600 hover:bg-amber-700 text-white"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <ArrowRight className="h-4 w-4 mr-2" />
                  )}
                  Import {parsedData.length} Records
                </Button>
              </div>
            </div>
          )}

          {step === 4 && importResult && (
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
                    {importResult.imported_count} records imported,{" "}
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

export default LiteratureImportWizard;
