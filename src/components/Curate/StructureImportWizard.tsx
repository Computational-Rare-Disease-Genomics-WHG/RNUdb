import React, { useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, FileJson, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

interface StructureImportWizardProps {
  geneId: string;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

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
  const [error, setError] = useState('');

  const reset = () => {
    setStep(1);
    setParsedStructure(null);
    setValidationResult(null);
    setError('');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setError('');

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      try {
        const data = JSON.parse(text);
        setParsedStructure(data);
        setStep(2);
      } catch (err) {
        setError('Invalid JSON file');
      }
    };
    reader.readAsText(f);
  }, []);

  const handleValidate = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/imports/structures/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ geneId, structure: parsedStructure }),
      });
      const data = await res.json();
      setValidationResult(data);
      setStep(3);
    } catch (err) {
      setError('Validation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/imports/structures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ geneId, structure: parsedStructure }),
      });
      if (res.ok) {
        setStep(4);
        onSuccess();
      } else {
        const data = await res.json();
        setError(data.detail?.message || 'Import failed');
      }
    } catch (err) {
      setError('Import failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import RNA Structure — {geneId}</DialogTitle>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-4">
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-teal-500 transition-colors">
              <FileJson className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground mb-3">
                Upload a JSON file exported from the RNA Editor
              </p>
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
                id="structure-file"
              />
              <Button
                onClick={() => document.getElementById('structure-file')?.click()}
                variant="outline"
              >
                <Upload className="h-4 w-4 mr-2" />
                Select JSON File
              </Button>
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {step === 2 && parsedStructure && (
          <div className="space-y-4">
            <div className="bg-slate-50 p-4 rounded-lg">
              <h3 className="font-medium mb-2">Structure Preview</h3>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>ID: {parsedStructure.id}</p>
                <p>Name: {parsedStructure.name}</p>
                <p>Nucleotides: {parsedStructure.nucleotides?.length || 0}</p>
                <p>Base Pairs: {parsedStructure.basePairs?.length || 0}</p>
              </div>
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

        {step === 3 && validationResult && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              {validationResult.valid ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600" />
              )}
              <span className="font-medium">
                {validationResult.valid ? 'Validation Passed' : 'Validation Failed'}
              </span>
            </div>

            {validationResult.errors.length > 0 && (
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-red-50 px-4 py-2 text-sm font-medium text-red-800">
                  Errors ({validationResult.errors.length})
                </div>
                {validationResult.errors.map((e: any, i: number) => (
                  <div key={i} className="px-4 py-2 text-sm border-t text-red-700">
                    {e.field}: {e.message}
                  </div>
                ))}
              </div>
            )}

            {validationResult.warnings.length > 0 && (
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-amber-50 px-4 py-2 text-sm font-medium text-amber-800">
                  Warnings ({validationResult.warnings.length})
                </div>
                {validationResult.warnings.map((w: any, i: number) => (
                  <div key={i} className="px-4 py-2 text-sm border-t text-amber-700">
                    {w.field}: {w.message}
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
              <Button
                onClick={handleImport}
                disabled={loading || !validationResult.valid}
                className="bg-teal-600 hover:bg-teal-700 text-white"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Import Structure
              </Button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="text-center py-8">
            <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Import Complete</h3>
            <p className="text-muted-foreground">Structure imported successfully.</p>
            <Button onClick={handleClose} className="mt-6 bg-teal-600 hover:bg-teal-700 text-white">
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default StructureImportWizard;
