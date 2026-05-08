import { Trash2, Tag, Palette, BarChart3, LineChart } from "lucide-react";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getScoreColor } from "@/lib/colors";

type DisplayMode = "bars" | "line";

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
  onAnnotateInterval?: (
    trackId: string,
    interval: BEDInterval,
    annotation: string,
  ) => void;
}

const TRACK_PALETTES = [
  { id: "teal", name: "Teal", color: "#0d9488" },
  { id: "blue", name: "Blue", color: "#2563eb" },
  { id: "purple", name: "Purple", color: "#7c3aed" },
  { id: "amber", name: "Amber", color: "#f59e0b" },
  { id: "rose", name: "Rose", color: "#e11d48" },
  { id: "emerald", name: "Emerald", color: "#059669" },
  { id: "slate", name: "Slate", color: "#64748b" },
  { id: "cyan", name: "Cyan", color: "#06b6d4" },
];

const BEDTrackViewer: React.FC<BEDTrackViewerProps> = ({
  tracks,
  geneStart,
  geneEnd,
  onDeleteTrack,
  onAnnotateInterval,
}) => {
  const [annotating, setAnnotating] = useState<{
    track: BEDTrack;
    interval: BEDInterval;
  } | null>(null);
  const [annotationText, setAnnotationText] = useState("");
  const [editingColor, setEditingColor] = useState<BEDTrack | null>(null);
  const [selectedPalette, setSelectedPalette] = useState("");
  const [displayMode, setDisplayMode] = useState<Record<string, DisplayMode>>(
    {},
  );

  const handleAnnotate = (track: BEDTrack, interval: BEDInterval) => {
    setAnnotating({ track, interval });
    setAnnotationText(interval.name || "");
  };

  const handleSaveAnnotation = () => {
    if (annotating && onAnnotateInterval) {
      onAnnotateInterval(
        annotating.track.id,
        annotating.interval,
        annotationText,
      );
    }
    setAnnotating(null);
    setAnnotationText("");
  };

  const handleEditColor = (track: BEDTrack) => {
    setEditingColor(track);
    setSelectedPalette(track.color || "teal");
  };

  const handleSaveColor = () => {
    if (editingColor) {
      const palette = TRACK_PALETTES.find((p) => p.id === selectedPalette);
      if (palette && onAnnotateInterval) {
        onAnnotateInterval(
          editingColor.id,
          { start: 0, end: 0, chrom: "" } as BEDInterval,
          `__color__:${palette.color}`,
        );
      }
    }
    setEditingColor(null);
  };

  if (!tracks.length) return null;

  const geneLength = geneEnd - geneStart;
  const getScale = (pos: number) => ((pos - geneStart) / geneLength) * 100;

  const hasScores = (intervals: BEDInterval[]) =>
    intervals.some((i) => i.score !== null && i.score !== undefined);

  const renderBars = (
    track: BEDTrack,
    intervals: BEDInterval[],
    trackColor: string,
  ) => (
    <div className="relative h-20 bg-slate-50 rounded-lg overflow-hidden border border-slate-100">
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
        const barColor =
          interval.score !== null && interval.score !== undefined
            ? getScoreColor(interval.score, trackColor)
            : trackColor;

        return (
          <div
            key={i}
            className="absolute h-10 top-5 rounded cursor-pointer hover:brightness-110 transition-all group"
            style={{
              left: `${startPct}%`,
              width: `${width}%`,
              backgroundColor: barColor,
            }}
            onClick={() => handleAnnotate(track, interval)}
            title={`${interval.chrom}:${interval.start.toLocaleString()}-${interval.end.toLocaleString()}${interval.score !== undefined ? ` (score: ${interval.score.toFixed(3)})` : ""}${interval.name ? ` - ${interval.name}` : ""}`}
          >
            {width > 5 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[9px] text-white font-medium truncate px-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  {interval.score?.toFixed(2)}
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  const renderLine = (
    track: BEDTrack,
    intervals: BEDInterval[],
    trackColor: string,
    scoreMin: number,
    scoreMax: number,
  ) => {
    const scoreRange = scoreMax - scoreMin || 1;
    const sortedIntervals = [...intervals].sort((a, b) => a.start - b.start);
    const points = sortedIntervals
      .map((interval) => {
        const x = getScale(
          interval.start + (interval.end - interval.start) / 2,
        );
        const y =
          interval.score !== null && interval.score !== undefined
            ? 100 - ((interval.score - scoreMin) / scoreRange) * 100
            : 50;
        return `${x},${y}`;
      })
      .join(" ");

    return (
      <div className="relative h-20 bg-slate-50 rounded-lg overflow-hidden border border-slate-100">
        <div className="absolute inset-0 flex items-center">
          <div className="absolute left-0 right-0 h-1 bg-slate-200" />
        </div>
        <div className="absolute bottom-0 left-0 text-[10px] text-slate-400 px-1">
          {geneStart.toLocaleString()}
        </div>
        <div className="absolute bottom-0 right-0 text-[10px] text-slate-400 px-1">
          {geneEnd.toLocaleString()}
        </div>
        <svg
          className="absolute inset-0 w-full h-full"
          preserveAspectRatio="none"
        >
          {points.length > 0 && (
            <>
              <polyline
                points={points}
                fill="none"
                stroke={trackColor}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {sortedIntervals.map((interval, i) => {
                const x = getScale(
                  interval.start + (interval.end - interval.start) / 2,
                );
                const y =
                  interval.score !== null && interval.score !== undefined
                    ? 100 - ((interval.score - scoreMin) / scoreRange) * 100
                    : 50;
                return (
                  <circle
                    key={i}
                    cx={x}
                    cy={y}
                    r={3}
                    fill={
                      interval.score !== null && interval.score !== undefined
                        ? getScoreColor(interval.score, trackColor)
                        : trackColor
                    }
                    className="cursor-pointer hover:r-[5px]"
                    onClick={() => handleAnnotate(track, interval)}
                  />
                );
              })}
            </>
          )}
        </svg>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {tracks.map((track) => {
        const intervals = track.intervals ?? [];
        if (!intervals.length) return null;
        const trackColor = track.color || "#0d9488";
        const hasScoreData = hasScores(intervals);
        const scoreMin = hasScoreData
          ? Math.min(
              ...intervals.filter((i) => i.score != null).map((i) => i.score!),
            )
          : 0;
        const scoreMax = hasScoreData
          ? Math.max(
              ...intervals.filter((i) => i.score != null).map((i) => i.score!),
            )
          : 1;
        const mode = displayMode[track.id] || "bars";

        return (
          <div
            key={track.id}
            className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6 shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span
                  className="w-4 h-4 rounded-full shadow-sm"
                  style={{ backgroundColor: trackColor }}
                />
                <span className="font-semibold text-slate-900 text-lg">
                  {track.name}
                </span>
                <span className="text-sm text-slate-400">
                  ({intervals.length} intervals)
                </span>
                {hasScoreData && (
                  <span className="px-2 py-0.5 bg-teal-50 text-teal-700 text-xs font-medium rounded-full">
                    Score track
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {hasScoreData && (
                  <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden mr-2">
                    <button
                      onClick={() =>
                        setDisplayMode((prev) => ({
                          ...prev,
                          [track.id]: "bars",
                        }))
                      }
                      className={`p-1.5 ${mode === "bars" ? "bg-teal-100 text-teal-700" : "text-slate-400 hover:bg-slate-50"}`}
                      title="Bar view"
                    >
                      <BarChart3 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() =>
                        setDisplayMode((prev) => ({
                          ...prev,
                          [track.id]: "line",
                        }))
                      }
                      className={`p-1.5 ${mode === "line" ? "bg-teal-100 text-teal-700" : "text-slate-400 hover:bg-slate-50"}`}
                      title="Line view"
                    >
                      <LineChart className="h-4 w-4" />
                    </button>
                  </div>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEditColor(track)}
                  className="h-8 w-8 p-0 text-slate-400 hover:text-purple-600 hover:bg-purple-50"
                  title="Change color"
                >
                  <Palette className="h-4 w-4" />
                </Button>
                {onDeleteTrack && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDeleteTrack(track.id)}
                    className="h-8 w-8 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50"
                    title="Delete track"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {hasScoreData && mode === "line"
              ? renderLine(track, intervals, trackColor, scoreMin, scoreMax)
              : renderBars(track, intervals, trackColor)}

            <div className="mt-3 flex items-center justify-between">
              {hasScoreData ? (
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">Score range:</span>
                    <span className="text-xs font-mono text-slate-700">
                      {scoreMin.toFixed(2)} – {scoreMax.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-slate-400">Low</span>
                    <div className="w-24 h-2 rounded-full overflow-hidden flex">
                      <div
                        className="w-1/4"
                        style={{ backgroundColor: trackColor, opacity: 0.3 }}
                      />
                      <div
                        className="w-1/4"
                        style={{ backgroundColor: trackColor, opacity: 0.5 }}
                      />
                      <div
                        className="w-1/4"
                        style={{ backgroundColor: trackColor, opacity: 0.75 }}
                      />
                      <div
                        className="w-1/4"
                        style={{ backgroundColor: trackColor, opacity: 1 }}
                      />
                    </div>
                    <span className="text-xs text-slate-400">High</span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-xs text-slate-400">
                  <div
                    className="w-3 h-3 rounded"
                    style={{ backgroundColor: trackColor }}
                  />
                  <span>Track color</span>
                </div>
              )}
              <span className="text-xs text-slate-400">
                Click bar to annotate
              </span>
            </div>
          </div>
        );
      })}

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
                <p>
                  <span className="font-medium">Location:</span>{" "}
                  {annotating.interval.chrom}:
                  {annotating.interval.start.toLocaleString()}-
                  {annotating.interval.end.toLocaleString()}
                </p>
                {annotating.interval.score !== undefined && (
                  <p>
                    <span className="font-medium">Score:</span>{" "}
                    {annotating.interval.score}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="annotation"
                  className="text-sm font-medium text-slate-700"
                >
                  Annotation / Label
                </Label>
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

      <Dialog open={!!editingColor} onOpenChange={() => setEditingColor(null)}>
        <DialogContent className="sm:max-w-[400px] bg-white">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <Palette className="h-5 w-5 text-purple-600" />
              Change Track Color
            </DialogTitle>
          </DialogHeader>
          {editingColor && (
            <div className="space-y-4 pt-2">
              <div className="text-sm text-slate-600 bg-slate-50 rounded-lg p-3">
                <p>
                  <span className="font-medium">Track:</span>{" "}
                  {editingColor.name}
                </p>
              </div>
              <div className="space-y-3">
                <Label className="text-sm font-medium text-slate-700">
                  Color Palette
                </Label>
                <div className="grid grid-cols-4 gap-2">
                  {TRACK_PALETTES.map((palette) => (
                    <button
                      key={palette.id}
                      onClick={() => setSelectedPalette(palette.id)}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        selectedPalette === palette.id
                          ? "border-teal-500 bg-teal-50"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div
                        className="w-full h-8 rounded"
                        style={{ backgroundColor: palette.color }}
                      />
                      <span className="text-xs text-slate-600 mt-1 block">
                        {palette.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setEditingColor(null)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveColor}
                  className="bg-teal-600 hover:bg-teal-700 text-white"
                >
                  Apply Color
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
