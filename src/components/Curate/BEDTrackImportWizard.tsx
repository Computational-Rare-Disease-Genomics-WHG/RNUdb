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
import { Progress } from '@/components/ui/progress';
import { Upload, CheckCircle2, AlertCircle, Loader2, ArrowLeft, ArrowRight, FileBarChart } from 'lucide-react';

interface BEDTrackImportWizardProps {
  geneId: string;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const STEPS = [
  { id: 1, label: 'Configure' },
  { id: 2, label: 'Preview' },
  { id: 3, label: 'Validate' },
  { id: 4, label: 'Import' },
];

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

  const progress = ((step - 1) / (STEPS.length - 1)) * 100;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden bg-white border-2 border-slate-200 shadow-2xl">
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-teal-600 to-teal-700 px-8 py-6">
          <DialogHeader className="p-0">
            <DialogTitle className="text-white text-xl font-bold">Import BED Track</DialogTitle>
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
          {/* Step 1: Configure */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="track-name" className="text-sm font-semibold text-slate-700">Track Name</Label>
                <Input
                  id="track-name"
                  value={trackName}
                  onChange={(e) => setTrackName(e.target.value)}
                  placeholder="e.g., Conservation Score"
                  className="h-12"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-700">Track Color</Label>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <input
                      type="color"
                      value={trackColor}
                      onChange={(e) => setTrackColor(e.target.value)}
                      className="w-16 h-12 rounded-xl cursor-pointer border-2 border-slate-200"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-mono text-slate-600">{trackColor}</p>
                    <p className="text-xs text-slate-400">Click to change color</p>
                  </div>
                </div>
              </div>

              <div className="border-2 border-dashed border-slate-300 rounded-2xl p-12 text-center hover:border-teal-500 hover:bg-teal-50/30 transition-all cursor-pointer"
                onClick={() => document.getElementById('bed-file')?.click()}
              >
                <div className="p-4 bg-teal-50 rounded-2xl w-fit mx-auto mb-4">
                  <FileBarChart className="h-8 w-8 text-teal-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Upload BED File</h3>
                <p className="text-sm text-slate-500 mb-4 max-w-sm mx-auto">
                  Tab-delimited format: chrom, start, end, name, score
                </p>
                <span className="px-3 py-1 bg-slate-100 rounded-full text-xs text-slate-600">.bed</span>
                <input
                  type="file"
                  accept=".bed"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="bed-file"
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
          {step === 2 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Preview Intervals</h3>
                  <p className="text-sm text-slate-500">Found {parsedIntervals.length} intervals in {trackName}</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setStep(1)}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Change
                </Button>
              </div>

              <div className="border-2 border-slate-200 rounded-xl overflow-hidden">
                <div className="overflow-x-auto max-h-64">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Chrom</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Start</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">End</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Score</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {parsedIntervals.slice(0, 10).map((row, i) => (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="px-4 py-2 text-slate-700 font-mono">{row.chrom}</td>
                          <td className="px-4 py-2 text-slate-700">{parseInt(row.chromStart).toLocaleString()}</td>
                          <td className="px-4 py-2 text-slate-700">{parseInt(row.chromEnd).toLocaleString()}</td>
                          <td className="px-4 py-2 text-slate-600">{row.name || '-'}</td>
                          <td className="px-4 py-2 text-slate-600">{row.score || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {parsedIntervals.length > 10 && (
                  <div className="px-4 py-2 bg-slate-50 text-center text-xs text-slate-500 border-t">
                    Showing 10 of {parsedIntervals.length} intervals
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
                  Validate Intervals
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
                    {validationResult.valid_count} of {validationResult.total_count} intervals valid
                    {validationResult.errors.length > 0 && ` • ${validationResult.errors.length} errors`}
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

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
                <Button
                  onClick={handleImport}
                  disabled={loading || validationResult.valid_count === 0}
                  className="bg-teal-600 hover:bg-teal-700 text-white"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                  Import {validationResult.valid_count} Intervals
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
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Import Complete!</h3>
              <p className="text-slate-500 mb-8 max-w-sm mx-auto">
                Successfully imported the BED track "{trackName}" into {geneId}
              </p>
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

export default BEDTrackImportWizard;
