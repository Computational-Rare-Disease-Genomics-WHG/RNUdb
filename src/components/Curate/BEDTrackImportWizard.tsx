import React, { useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

interface BEDTrackImportWizardProps {
  geneId: string;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const BEDTrackImportWizard: React.FC<BEDTrackImportWizardProps> = ({
  geneId,
  open,
  onClose,
  onSuccess,
}) => {
  const [step, setStep] = useState(1);
  const [trackName, setTrackName] = useState('');
  const [trackColor, setTrackColor] = useState('#3B82F6');
  const [parsedIntervals, setParsedIntervals] = useState<any[]>([]);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const reset = () => {
    setStep(1);
    setTrackName('');
    setTrackColor('#3B82F6');
    setParsedIntervals([]);
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
    setTrackName(f.name.replace(/\.bed$/i, ''));

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').filter(l => l.trim() && !l.startsWith('#'));
      
      const intervals = lines.map(line => {
        const cols = line.split('\t');
        return {
          chrom: cols[0],
          chromStart: cols[1],
          chromEnd: cols[2],
          name: cols[3] || null,
          score: cols[4] || null,
        };
      });

      setParsedIntervals(intervals);
      setStep(2);
    };
    reader.readAsText(f);
  }, []);

  const handleValidate = async () => {
    if (!trackName.trim()) {
      setError('Track name is required');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/imports/bed-tracks/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ geneId, track_name: trackName, intervals: parsedIntervals }),
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
      const res = await fetch('/api/imports/bed-tracks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          geneId,
          track_name: trackName,
          intervals: parsedIntervals,
          color: trackColor,
        }),
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
          <DialogTitle>Import BED Track — {geneId}</DialogTitle>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="track-name">Track Name</Label>
              <Input
                id="track-name"
                value={trackName}
                onChange={(e) => setTrackName(e.target.value)}
                placeholder="e.g., Conservation Score"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="track-color">Track Color</Label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={trackColor}
                  onChange={(e) => setTrackColor(e.target.value)}
                  className="w-10 h-10 rounded cursor-pointer"
                />
                <span className="text-sm text-muted-foreground">{trackColor}</span>
              </div>
            </div>
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-teal-500 transition-colors">
              <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground mb-3">
                Upload a BED file (tab-delimited: chrom, start, end, name, score)
              </p>
              <input
                type="file"
                accept=".bed"
                onChange={handleFileUpload}
                className="hidden"
                id="bed-file"
              />
              <Button
                onClick={() => document.getElementById('bed-file')?.click()}
                variant="outline"
              >
                <Upload className="h-4 w-4 mr-2" />
                Select BED File
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

        {step === 2 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Found {parsedIntervals.length} intervals. Preview:
            </p>
            <div className="border rounded-lg overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-3 py-2 text-left">Chrom</th>
                    <th className="px-3 py-2 text-left">Start</th>
                    <th className="px-3 py-2 text-left">End</th>
                    <th className="px-3 py-2 text-left">Name</th>
                    <th className="px-3 py-2 text-left">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedIntervals.slice(0, 5).map((row, i) => (
                    <tr key={i} className="border-t">
                      <td className="px-3 py-2">{row.chrom}</td>
                      <td className="px-3 py-2">{row.chromStart}</td>
                      <td className="px-3 py-2">{row.chromEnd}</td>
                      <td className="px-3 py-2">{row.name || '-'}</td>
                      <td className="px-3 py-2">{row.score || '-'}</td>
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

        {step === 3 && validationResult && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              {validationResult.valid ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-amber-600" />
              )}
              <span className="font-medium">
                {validationResult.valid_count} of {validationResult.total_count} intervals valid
              </span>
            </div>

            {validationResult.errors.length > 0 && (
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-red-50 px-4 py-2 text-sm font-medium text-red-800">
                  Errors ({validationResult.errors.length})
                </div>
                {validationResult.errors.map((e: any, i: number) => (
                  <div key={i} className="px-4 py-2 text-sm border-t text-red-700">
                    Row {e.row}: {e.message}
                  </div>
                ))}
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
                Import {validationResult.valid_count} Intervals
              </Button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="text-center py-8">
            <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Import Complete</h3>
            <p className="text-muted-foreground">BED track imported successfully.</p>
            <Button onClick={handleClose} className="mt-6 bg-teal-600 hover:bg-teal-700 text-white">
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default BEDTrackImportWizard;
