import {
  Upload,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowLeft,
  ArrowRight,
  Braces,
} from "lucide-react";
import React, { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";

interface StructureImportWizardProps {
  geneId: string;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const STEPS = [
  { id: 1, label: "Upload" },
  { id: 2, label: "Preview" },
  { id: 3, label: "Validate" },
  { id: 4, label: "Import" },
];

const StructureImportWizard: React.FC<StructureImportWizardProps> = ({
  geneId,
  open,
  onClose,
  onSuccess,
}) => {
  const [step, setStep] = useState(1);
  const [parsedStructure, setParsedStructure] = useState<any>(null);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const reset = () => {
    setStep(1);
    setParsedStructure(null);
    setValidationResult(null);
    setError("");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (!f) return;
      setError("");

      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        try {
          const data = JSON.parse(text);
          setParsedStructure(data);
          setStep(2);
        } catch {
          setError("Invalid JSON file. Please upload a valid structure file.");
        }
      };
      reader.readAsText(f);
    },
    [],
  );

  const handleValidate = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/imports/structures/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ geneId, structure: parsedStructure }),
      });
      const data = await res.json();
      setValidationResult(data);
      setStep(3);
    } catch {
      setError("Validation failed");
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/imports/structures", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ geneId, structure: parsedStructure }),
      });
      if (res.ok) {
        setStep(4);
        onSuccess();
      } else {
        const data = await res.json();
        setError(data.detail?.message || "Import failed");
      }
    } catch {
      setError("Import failed");
    } finally {
      setLoading(false);
    }
  };

  const progress = ((step - 1) / (STEPS.length - 1)) * 100;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden bg-white border-2 border-slate-200 shadow-2xl">
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-teal-600 to-teal-700 px-8 py-6">
          <DialogHeader className="p-0">
            <DialogTitle className="text-white text-xl font-bold">
              Import RNA Structure
            </DialogTitle>
            <p className="text-teal-100 text-sm mt-1">
              {geneId} • Step {step} of {STEPS.length}
            </p>
          </DialogHeader>
        </div>

        {/* Step Progress */}
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

        {/* Content */}
        <div className="px-8 py-6 max-h-[60vh] overflow-y-auto">
          {/* Step 1: Upload */}
          {step === 1 && (
            <div className="space-y-6">
              <div
                className="border-2 border-dashed border-slate-300 rounded-2xl p-12 text-center hover:border-teal-500 hover:bg-teal-50/30 transition-all cursor-pointer"
                onClick={() =>
                  document.getElementById("structure-file")?.click()
                }
              >
                <div className="p-4 bg-teal-50 rounded-2xl w-fit mx-auto mb-4">
                  <Braces className="h-8 w-8 text-teal-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  Upload JSON File
                </h3>
                <p className="text-sm text-slate-500 mb-4 max-w-sm mx-auto">
                  Upload a JSON structure file exported from the RNA Editor
                </p>
                <span className="px-3 py-1 bg-slate-100 rounded-full text-xs text-slate-600">
                  .json
                </span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="structure-file"
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

          {/* Step 2: Preview */}
          {step === 2 && parsedStructure && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    Structure Preview
                  </h3>
                  <p className="text-sm text-slate-500">
                    Review the structure details before validation
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setStep(1)}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Change File
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-5 bg-slate-50 rounded-xl border-2 border-slate-100">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Structure ID
                  </p>
                  <p className="text-lg font-semibold text-slate-900">
                    {parsedStructure.id}
                  </p>
                </div>
                <div className="p-5 bg-slate-50 rounded-xl border-2 border-slate-100">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Name
                  </p>
                  <p className="text-lg font-semibold text-slate-900">
                    {parsedStructure.name}
                  </p>
                </div>
                <div className="p-5 bg-teal-50 rounded-xl border-2 border-teal-100">
                  <p className="text-xs font-semibold text-teal-600 uppercase tracking-wider mb-1">
                    Nucleotides
                  </p>
                  <p className="text-3xl font-bold text-teal-700">
                    {parsedStructure.nucleotides?.length || 0}
                  </p>
                </div>
                <div className="p-5 bg-teal-50 rounded-xl border-2 border-teal-100">
                  <p className="text-xs font-semibold text-teal-600 uppercase tracking-wider mb-1">
                    Base Pairs
                  </p>
                  <p className="text-3xl font-bold text-teal-700">
                    {parsedStructure.basePairs?.length || 0}
                  </p>
                </div>
              </div>

              {parsedStructure.annotations?.length > 0 && (
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                  <p className="text-sm text-amber-800">
                    <span className="font-semibold">
                      {parsedStructure.annotations.length}
                    </span>{" "}
                    annotations included
                  </p>
                </div>
              )}

              {parsedStructure.structuralFeatures?.length > 0 && (
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                  <p className="text-sm text-amber-800">
                    <span className="font-semibold">
                      {parsedStructure.structuralFeatures.length}
                    </span>{" "}
                    structural features included
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button
                  onClick={handleValidate}
                  disabled={loading}
                  className="bg-teal-600 hover:bg-teal-700 text-white"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <ArrowRight className="h-4 w-4 mr-2" />
                  )}
                  Validate Structure
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Validation Results */}
          {step === 3 && validationResult && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                {validationResult.valid ? (
                  <div className="p-2 bg-emerald-100 rounded-full">
                    <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                  </div>
                ) : (
                  <div className="p-2 bg-amber-100 rounded-full">
                    <AlertCircle className="h-6 w-6 text-amber-600" />
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    {validationResult.valid
                      ? "Validation Passed"
                      : "Validation Failed"}
                  </h3>
                  <p className="text-sm text-slate-500">
                    {validationResult.errors.length} errors •{" "}
                    {validationResult.warnings.length} warnings
                  </p>
                </div>
              </div>

              {validationResult.errors.length > 0 && (
                <div className="border-2 border-red-200 rounded-xl overflow-hidden">
                  <div className="bg-red-50 px-4 py-3 border-b border-red-200">
                    <h4 className="text-sm font-semibold text-red-800 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      Errors ({validationResult.errors.length})
                    </h4>
                  </div>
                  <div className="divide-y divide-red-100 max-h-48 overflow-y-auto">
                    {validationResult.errors.map((e: any, i: number) => (
                      <div key={i} className="px-4 py-3">
                        <p className="text-sm text-red-700">
                          <span className="font-semibold">{e.field}:</span>{" "}
                          {e.message}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {validationResult.warnings.length > 0 && (
                <div className="border-2 border-amber-200 rounded-xl overflow-hidden">
                  <div className="bg-amber-50 px-4 py-3 border-b border-amber-200">
                    <h4 className="text-sm font-semibold text-amber-800 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      Warnings ({validationResult.warnings.length})
                    </h4>
                  </div>
                  <div className="divide-y divide-amber-100 max-h-32 overflow-y-auto">
                    {validationResult.warnings.map((w: any, i: number) => (
                      <div key={i} className="px-4 py-3">
                        <p className="text-sm text-amber-700">
                          <span className="font-semibold">{w.field}:</span>{" "}
                          {w.message}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setStep(2)}>
                  Back
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={loading || !validationResult.valid}
                  className="bg-teal-600 hover:bg-teal-700 text-white"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Upload className="h-4 w-4 mr-2" />
                  )}
                  Import Structure
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Success */}
          {step === 4 && (
            <div className="text-center py-8">
              <div className="p-4 bg-emerald-100 rounded-full w-fit mx-auto mb-6">
                <CheckCircle2 className="h-12 w-12 text-emerald-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">
                Import Complete!
              </h3>
              <p className="text-slate-500 mb-8 max-w-sm mx-auto">
                Successfully imported the RNA structure into {geneId}
              </p>
              <Button
                onClick={handleClose}
                className="bg-teal-600 hover:bg-teal-700 text-white px-8"
              >
                Done
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StructureImportWizard;
