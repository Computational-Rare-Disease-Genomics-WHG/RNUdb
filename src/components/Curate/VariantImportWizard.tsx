import React, { useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

interface VariantImportWizardProps {
  geneId: string;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

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

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Variants — {geneId}</DialogTitle>
        </DialogHeader>

        {/* Step 1: Upload */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-teal-500 transition-colors">
              <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground mb-3">
                Upload a CSV file with columns: position, ref, alt, hgvs, clinical_significance, zygosity, etc.
              </p>
              <input
                type="file"
                accept=".csv,.tsv,.txt"
                onChange={handleFileUpload}
                className="hidden"
                id="variant-file"
              />
              <Button
                onClick={() => document.getElementById('variant-file')?.click()}
                variant="outline"
              >
                <FileText className="h-4 w-4 mr-2" />
                Select File
              </Button>
            </div>
            {file && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileText className="h-4 w-4" />
                {file.name} ({parsedData.length} rows)
              </div>
            )}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Step 2: Preview */}
        {step === 2 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Found {parsedData.length} rows. Preview the first 5:
            </p>
            <div className="border rounded-lg overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    {Object.keys(parsedData[0] || {}).map(h => (
                      <th key={h} className="px-3 py-2 text-left font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {parsedData.slice(0, 5).map((row, i) => (
                    <tr key={i} className="border-t">
                      {Object.values(row).map((v: any, j) => (
                        <td key={j} className="px-3 py-2">{v}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
              <Button
                onClick={handleValidate}
                disabled={loading}
                className="bg-teal-600 hover:bg-teal-700 text-white"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Validate
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Validation Results */}
        {step === 3 && validationResult && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              {validationResult.valid ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-amber-600" />
              )}
              <span className="font-medium">
                {validationResult.valid_count} of {validationResult.total_count} rows valid
              </span>
            </div>

            {validationResult.errors.length > 0 && (
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-red-50 px-4 py-2 text-sm font-medium text-red-800">
                  Errors ({validationResult.errors.length})
                </div>
                <div className="max-h-40 overflow-y-auto">
                  {validationResult.errors.map((e: any, i: number) => (
                    <div key={i} className="px-4 py-2 text-sm border-t text-red-700">
                      Row {e.row}: {e.message}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {validationResult.warnings.length > 0 && (
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-amber-50 px-4 py-2 text-sm font-medium text-amber-800">
                  Warnings ({validationResult.warnings.length})
                </div>
                <div className="max-h-40 overflow-y-auto">
                  {validationResult.warnings.map((w: any, i: number) => (
                    <div key={i} className="px-4 py-2 text-sm border-t text-amber-700">
                      Row {w.row}: {w.message}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
              <Button
                onClick={handleImport}
                disabled={loading || validationResult.valid_count === 0}
                className="bg-teal-600 hover:bg-teal-700 text-white"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Import {validationResult.valid_count} Variants
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Success */}
        {step === 4 && importResult && (
          <div className="text-center py-8">
            <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Import Complete</h3>
            <p className="text-muted-foreground">
              Imported {importResult.imported_count} variants. 
              {importResult.skipped_count > 0 && ` Skipped ${importResult.skipped_count} invalid rows.`}
            </p>
            <Button onClick={handleClose} className="mt-6 bg-teal-600 hover:bg-teal-700 text-white">
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default VariantImportWizard;
