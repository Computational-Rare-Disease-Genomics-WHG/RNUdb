import React, { useState } from 'react';
import { Dna, Trash2, Tag } from 'lucide-react';
import { getScoreColor } from '@/lib/colors';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface BEDInterval {
  chrom: string;
  start: number;
  end: number;
  name?: string;
  score?: number;
  strand?: string;
}

interface BEDTrack {
  id: string;
  geneId: string;
  name: string;
  intervals: BEDInterval[];
  color?: string;
}

interface BEDTrackViewerProps {
  tracks: BEDTrack[];
  geneStart: number;
  geneEnd: number;
  onDeleteTrack?: (trackId: string) => void;
  onAnnotateInterval?: (trackId: string, interval: BEDInterval, annotation: string) => void;
}

export const BEDTrackViewer: React.FC<BEDTrackViewerProps> = ({
  tracks,
  geneStart,
  geneEnd,
  onDeleteTrack,
  onAnnotateInterval,
}) => {
  const [annotating, setAnnotating] = useState<{ track: BEDTrack; interval: BEDInterval } | null>(null);
  const [annotationText, setAnnotationText] = useState('');

  const handleAnnotate = (track: BEDTrack, interval: BEDInterval) => {
    setAnnotating({ track, interval });
    setAnnotationText(interval.name || '');
  };

  const handleSaveAnnotation = () => {
    if (annotating && onAnnotateInterval) {
      onAnnotateInterval(annotating.track.id, annotating.interval, annotationText);
    }
    setAnnotating(null);
    setAnnotationText('');
  };

  if (!tracks.length) return null;

  const geneLength = geneEnd - geneStart;
  const getScale = (pos: number) => ((pos - geneStart) / geneLength) * 100;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Dna className="h-5 w-5 text-teal-600" />
          <h3 className="text-lg font-semibold text-slate-900">BED Track Visualization</h3>
        </div>
        <div className="text-sm text-slate-500">
          {tracks.length} track{tracks.length > 1 ? 's' : ''}
        </div>
      </div>

      <div className="space-y-6">
        {tracks.map((track) => {
          const intervals = track.intervals ?? [];
          if (!intervals.length) return null;
          const trackColor = track.color || '#0d9488';

          return (
            <div key={track.id} className="border border-slate-200 rounded-lg p-4 bg-slate-50/50">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: trackColor }}
                  />
                  <span className="font-medium text-slate-900">{track.name}</span>
                  <span className="text-xs text-slate-400">({intervals.length} intervals)</span>
                </div>
                {onDeleteTrack && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDeleteTrack(track.id)}
                    className="h-8 w-8 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="relative h-16 bg-white rounded-lg overflow-hidden border border-slate-100">
                <div className="absolute inset-0 flex items-center">
                  <div className="absolute left-0 right-0 h-1 bg-slate-200" />
                </div>
                <div className="absolute bottom-0 left-0 text-[10px] text-slate-400 px-1">
                  {geneStart.toLocaleString()}
                </div>
                <div className="absolute bottom-0 right-0 text-[10px] text-slate-400 px-1">
                  {geneEnd.toLocaleString()}
                </div>

                {intervals.map((interval, i) => {
                  const startPct = getScale(interval.start);
                  const endPct = getScale(interval.end);
                  const width = Math.max(endPct - startPct, 0.5);
                  const barColor = interval.score !== null && interval.score !== undefined
                    ? getScoreColor(interval.score, trackColor)
                    : trackColor;

                  return (
                    <div
                      key={i}
                      className="absolute h-8 top-4 rounded cursor-pointer hover:brightness-110 transition-all group"
                      style={{
                        left: `${startPct}%`,
                        width: `${width}%`,
                        backgroundColor: barColor,
                      }}
                      onClick={() => handleAnnotate(track, interval)}
                      title={`${interval.chrom}:${interval.start.toLocaleString()}-${interval.end.toLocaleString()}${interval.score !== undefined ? ` (score: ${interval.score})` : ''}${interval.name ? ` - ${interval.name}` : ''}`}
                    >
                      {width > 5 && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-[9px] text-white font-medium truncate px-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            {interval.score}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="mt-2 flex items-center gap-4 text-xs text-slate-500">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: trackColor, opacity: 0.4 }} />
                  <span>Low score</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: trackColor, opacity: 0.7 }} />
                  <span>Med score</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: trackColor, opacity: 1 }} />
                  <span>High score</span>
                </div>
                <span className="ml-auto text-slate-400">Click bar to annotate</span>
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={!!annotating} onOpenChange={() => setAnnotating(null)}>
        <DialogContent className="sm:max-w-[400px] bg-white">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <Tag className="h-5 w-5 text-teal-600" />
              Annotate Interval
            </DialogTitle>
          </DialogHeader>
          {annotating && (
            <div className="space-y-4 pt-2">
              <div className="text-sm text-slate-600 bg-slate-50 rounded-lg p-3">
                <p><span className="font-medium">Location:</span> {annotating.interval.chrom}:{annotating.interval.start.toLocaleString()}-{annotating.interval.end.toLocaleString()}</p>
                {annotating.interval.score !== undefined && (
                  <p><span className="font-medium">Score:</span> {annotating.interval.score}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="annotation" className="text-sm font-medium text-slate-700">Annotation / Label</Label>
                <Input
                  id="annotation"
                  value={annotationText}
                  onChange={(e) => setAnnotationText(e.target.value)}
                  placeholder="e.g., Exon 3, Conservation peak"
                  className="h-10"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setAnnotating(null)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveAnnotation}
                  className="bg-teal-600 hover:bg-teal-700 text-white"
                >
                  Save Annotation
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BEDTrackViewer;