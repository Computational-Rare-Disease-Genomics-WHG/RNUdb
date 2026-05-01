import React from 'react';
import { Dna } from 'lucide-react';

interface BEDTrack {
  id: string;
  geneId: string;
  name: string;
  intervals: Array<{
    chrom: string;
    start: number;
    end: number;
    name?: string;
    score?: number;
    strand?: string;
  }>;
}

interface BEDTrackViewerProps {
  tracks: BEDTrack[];
  geneStart: number;
  geneEnd: number;
}

export const BEDTrackViewer: React.FC<BEDTrackViewerProps> = ({
  tracks,
  geneStart,
  geneEnd,
}) => {
  if (!tracks.length) return null;

  const geneLength = geneEnd - geneStart;

  const getScale = (pos: number) => ((pos - geneStart) / geneLength) * 100;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Dna className="h-5 w-5 text-teal-600" />
          <h3 className="text-lg font-semibold text-slate-900">BED Track Visualization</h3>
        </div>
        <div className="text-sm text-slate-500">
          {tracks.length} track{tracks.length > 1 ? 's' : ''}
        </div>
      </div>

      <div className="relative overflow-x-auto">
        {tracks.map((track) => (
          <div key={track.id} className="mb-4">
            <div className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-teal-600"></span>
              {track.name}
              <span className="text-xs text-slate-400">({track.intervals.length} intervals)</span>
            </div>

            <div className="relative h-12 bg-slate-50 rounded-lg overflow-hidden">
              {/* Gene range markers */}
              <div className="absolute bottom-0 left-0 text-xs text-slate-400">
                {geneStart.toLocaleString()}
              </div>
              <div className="absolute bottom-0 right-0 text-xs text-slate-400">
                {geneEnd.toLocaleString()}
              </div>

              {/* Intervals */}
              {track.intervals.map((interval, i) => {
                const startPct = getScale(interval.start);
                const endPct = getScale(interval.end);
                const width = Math.max(endPct - startPct, 0.5);
                const opacity = interval.score ? Math.min(interval.score / 1000, 1) : 0.7;

                return (
                  <div
                    key={i}
                    className="absolute h-6 top-3 rounded transition-all hover:brightness-110 cursor-pointer"
                    style={{
                      left: `${startPct}%`,
                      width: `${width}%`,
                      backgroundColor: interval.strand === '-' ? '#ef4444' : '#0d9488',
                      opacity,
                    }}
                    title={`${interval.name || 'Interval'}: ${interval.chrom}:${interval.start.toLocaleString()}-${interval.end.toLocaleString()}${interval.score ? ` (score: ${interval.score})` : ''}`}
                  />
                );
              })}

              {/* Center line */}
              <div className="absolute top-1/2 left-0 right-0 h-px bg-slate-200 -translate-y-1/2" />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-4 text-xs text-slate-500">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-teal-600 opacity-70"></div>
          <span>Forward strand (+)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-red-500 opacity-70"></div>
          <span>Reverse strand (-)</span>
        </div>
      </div>
    </div>
  );
};
