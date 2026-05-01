import React, { useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2, ArrowLeft, ArrowRight, FileSpreadsheet, X } from 'lucide-react';

interface VariantImportWizardProps {
  geneId: string;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const STEPS = [
  { id: 1, label: 'Upload' },
  { id: 2, label: 'Preview' },
  { id: 3, label: 'Validate' },
  { id: 4, label: 'Import' },
];

const VariantImportWizard: React.FC<VariantImportWizardProps> = ({
  geneId,
  open,
  onClose,
  onSuccess,
}) => {
  const [step, setStep] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [importResult, setImportResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const reset = () => {
    setStep(1);
    setFile(null);
    setParsedData([]);
    setValidationResult(null);
    setImportResult(null);
    setError('');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setError('');

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').filter(l => l.trim());
      if (lines.length < 2) {
        setError('File must contain a header row and at least one data row');
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim());
      const rows = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim());
        const row: any = {};
        headers.forEach((h, i) => {
          row[h] = values[i] || '';
        });
        return row;
      });

      setParsedData(rows);
      setStep(2);
    };
    reader.readAsText(f);
  }, []);

  const handleValidate = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/imports/variants/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ geneId, variants: parsedData }),
      });
      const data = await res.json();
      setValidationResult(data);
      setStep(3);
    } catch (err) {
      setError('Validation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/imports/variants/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ geneId, variants: parsedData, skip_invalid: true }),
      });
      const data = await res.json();
      if (res.ok) {
        setImportResult(data);
        setStep(4);
        onSuccess();
      } else {
        setError(data.detail?.message || 'Import failed');
      }
    } catch (err) {
      setError('Import failed. Please try again.');
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
            <DialogTitle className="text-white text-xl font-bold">Import Variants</DialogTitle>
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
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors
                  ${step > s.id ? 'bg-emerald-500 text-white' : ''}
                  ${step === s.id ? 'bg-teal-600 text-white' : ''}
                  ${step < s.id ? 'bg-slate-200 text-slate-500' : ''}
                `}>
                  {step > s.id ? <CheckCircle2 className="h-4 w-4" /> : s.id}
                </div>
                <span className={`
                  ml-2 text-sm font-medium hidden sm:inline
                  ${step >= s.id ? 'text-slate-900' : 'text-slate-400'}
                `}>
                  {s.label}
                </span>
                {i < STEPS.length - 1 && (
                  <div className={`
                    w-12 h-0.5 mx-2 sm:w-16
                    ${step > s.id ? 'bg-emerald-500' : 'bg-slate-200'}
                  `} />
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
              <div className="border-2 border-dashed border-slate-300 rounded-2xl p-12 text-center hover:border-teal-500 hover:bg-teal-50/30 transition-all cursor-pointer"
                onClick={() => document.getElementById('variant-file')?.click()}
              >
                <div className="p-4 bg-teal-50 rounded-2xl w-fit mx-auto mb-4">
                  <FileSpreadsheet className="h-8 w-8 text-teal-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Upload CSV File</h3>
                <p className="text-sm text-slate-500 mb-4 max-w-sm mx-auto">
                  Drag and drop or click to select a CSV file with columns: position, ref, alt, hgvs, clinical_significance, zygosity
                </p>
                <div className="flex items-center justify-center gap-2">
                  <span className="px-3 py-1 bg-slate-100 rounded-full text-xs text-slate-600">.csv</span>
                  <span className="px-3 py-1 bg-slate-100 rounded-full text-xs text-slate-600">.tsv</span>
                  <span className="px-3 py-1 bg-slate-100 rounded-full text-xs text-slate-600">.txt</span>
                </div>
                <input
                  type="file"
                  accept=".csv,.tsv,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="variant-file"
                />
              </div>

              {file && (
                <div className="flex items-center gap-3 p-4 bg-teal-50 rounded-xl border border-teal-200">
                  <FileText className="h-5 w-5 text-teal-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900">{file.name}</p>
                    <p className="text-xs text-slate-500">{parsedData.length} rows detected</p>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => setFile(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {error && (
                <div className="flex items-start gap-3 p-4 bg-red-50 rounded-xl border border-red-200">
                  <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Preview */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Preview Data</h3>
                  <p className="text-sm text-slate-500">Found {parsedData.length} rows in {file?.name}</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setStep(1)}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Change File
                </Button>
              </div>

              <div className="border-2 border-slate-200 rounded-xl overflow-hidden">
                <div className="overflow-x-auto max-h-64">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">#</th>
                        {Object.keys(parsedData[0] || {}).map(h => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {parsedData.slice(0, 10).map((row, i) => (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="px-4 py-2 text-slate-400 text-xs">{i + 1}</td>
                          {Object.values(row).map((v: any, j) => (
                            <td key={j} className="px-4 py-2 text-slate-700">{v}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {parsedData.length > 10 && (
                  <div className="px-4 py-2 bg-slate-50 text-center text-xs text-slate-500 border-t">
                    Showing 10 of {parsedData.length} rows
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
                <Button
                  onClick={handleValidate}
                  disabled={loading}
                  className="bg-teal-600 hover:bg-teal-700 text-white"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ArrowRight className="h-4 w-4 mr-2" />}
                  Validate Data
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
                    {validationResult.valid ? 'Validation Passed' : 'Validation Issues Found'}
                  </h3>
                  <p className="text-sm text-slate-500">
                    {validationResult.valid_count} of {validationResult.total_count} rows valid
                    {validationResult.errors.length > 0 && ` • ${validationResult.errors.length} errors`}
                    {validationResult.warnings.length > 0 && ` • ${validationResult.warnings.length} warnings`}
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
                  <div className="max-h-48 overflow-y-auto divide-y divide-red-100">
                    {validationResult.errors.map((e: any, i: number) => (
                      <div key={i} className="px-4 py-3 flex items-start gap-3">
                        <span className="text-xs font-mono text-red-400 shrink-0 mt-0.5">Row {e.row}</span>
                        <p className="text-sm text-red-700">{e.message}</p>
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
                  <div className="max-h-32 overflow-y-auto divide-y divide-amber-100">
                    {validationResult.warnings.map((w: any, i: number) => (
                      <div key={i} className="px-4 py-3 flex items-start gap-3">
                        <span className="text-xs font-mono text-amber-400 shrink-0 mt-0.5">Row {w.row}</span>
                        <p className="text-sm text-amber-700">{w.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
                <Button
                  onClick={handleImport}
                  disabled={loading || validationResult.valid_count === 0}
                  className="bg-teal-600 hover:bg-teal-700 text-white"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                  Import {validationResult.valid_count} Variants
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Success */}
          {step === 4 && importResult && (
            <div className="text-center py-8">
              <div className="p-4 bg-emerald-100 rounded-full w-fit mx-auto mb-6">
                <CheckCircle2 className="h-12 w-12 text-emerald-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Import Complete!</h3>
              <p className="text-slate-500 mb-8 max-w-sm mx-auto">
                Successfully imported {importResult.imported_count} variants into {geneId}
                {importResult.skipped_count > 0 && (
                  <span>. Skipped {importResult.skipped_count} invalid rows.</span>
                )}
              </p>
              
              <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto mb-8">
                <div className="p-4 bg-slate-50 rounded-xl">
                  <div className="text-2xl font-bold text-emerald-600">{importResult.imported_count}</div>
                  <div className="text-xs text-slate-500 uppercase tracking-wider">Imported</div>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl">
                  <div className="text-2xl font-bold text-amber-600">{importResult.skipped_count}</div>
                  <div className="text-xs text-slate-500 uppercase tracking-wider">Skipped</div>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl">
                  <div className="text-2xl font-bold text-slate-700">{importResult.warnings.length}</div>
                  <div className="text-xs text-slate-500 uppercase tracking-wider">Warnings</div>
                </div>
              </div>

              <Button onClick={handleClose} className="bg-teal-600 hover:bg-teal-700 text-white px-8">
                Done
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VariantImportWizard;
