// GenomeBrowser.tsx
import { RegionViewer, PositionAxisTrack, Cursor } from "@gnomad/region-viewer";
import domtoimage from "dom-to-image-more";
import { ZoomIn, ZoomOut, RotateCcw, Download, FileImage } from "lucide-react";
import React, { useState, useRef, useEffect } from "react";
import DomainsTrack from "./DomainsTrack";
import FunctionScoreTrack from "./FunctionScoreTrack";
import SequenceTrack from "./SequenceTrack";
import SnRNAVariantTrack from "./SnRNAVariantTrack";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import "./GenomeBrowser.css";

interface GenomeBrowserProps {
  selectedGene: string;
  variants: any[];
  gnomadVariants: any[];
  aouVariants: any[];
  structuralFeatures: any[];
  geneData: {
    id: string;
    name: string;
    chromosome: string;
    start: number;
    end: number;
    strand: string;
    sequence: string;
  };
  selectedVariantPosition?: number | null;
  onVariantNavigate?: (genomicPosition: number) => void;
}

const GenomeBrowser: React.FC<GenomeBrowserProps> = ({
  selectedGene,
  variants,
  gnomadVariants,
  aouVariants,
  structuralFeatures,
  geneData,
  selectedVariantPosition,
  onVariantNavigate,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<HTMLDivElement>(null);
  const [, setIsZoomed] = useState(false);
  const [viewerWidth, setViewerWidth] = useState(800);
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [zygosityFilter, setZygosityFilter] = useState<string>("all");
  const defaultRegion = { start: geneData.start, stop: geneData.end };
  const [regions, setRegions] = useState([defaultRegion]);

  useEffect(() => {
    if (selectedVariantPosition != null) {
      setRegions([
        {
          start: Math.round(selectedVariantPosition) - 2,
          stop: Math.round(selectedVariantPosition) + 2,
        },
      ]);
      setIsZoomed(true);
    }
  }, [selectedVariantPosition]);

  useEffect(() => {
    const updateWidth = () => {
      if (viewerRef.current) {
        setViewerWidth(viewerRef.current.offsetWidth);
      }
    };

    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  const renderCustomCursor = (x: number) => {
    return (
      <rect
        x={x - 15}
        y={0}
        width={30}
        height="100%"
        className="genome-browser-cursor"
      />
    );
  };

  const handleZoomIn = () => {
    const currentRegion = regions[0];
    const center = Math.round((currentRegion.start + currentRegion.stop) / 2);
    const newHalfRange = Math.round((currentRegion.stop - currentRegion.start) / 4);
    setRegions([{ start: center - newHalfRange, stop: center + newHalfRange }]);
    setIsZoomed(true);
  };

  const handleZoomOut = () => {
    const currentRegion = regions[0];
    const currentRange = currentRegion.stop - currentRegion.start;
    const defaultRange = defaultRegion.stop - defaultRegion.start;

    if (currentRange >= defaultRange) {
      setRegions([defaultRegion]);
      return;
    }

    const center = Math.round((currentRegion.start + currentRegion.stop) / 2);
    const newRange = Math.round(currentRange * 2);

    if (newRange >= defaultRange) {
      setRegions([defaultRegion]);
    } else {
      setRegions([
        {
          start: Math.round(center - newRange / 2),
          stop: Math.round(center + newRange / 2),
        },
      ]);
    }
  };

  const handleReset = () => {
    setRegions([defaultRegion]);
    setIsZoomed(false);
  };

  const handleExportSVG = () => {
    if (!containerRef.current) return;

    domtoimage
      .toSvg(containerRef.current, {
        bgcolor: "#ffffff",
        style: {
          fontFamily: "Barlow, system-ui, sans-serif",
        },
      })
      .then((dataUrl: string) => {
        const link = document.createElement("a");
        link.download = `${selectedGene}_genome_browser.svg`;
        link.href = dataUrl;
        link.click();
      })
      .catch((error: Error) => console.error("Error capturing SVG:", error));
  };

  const handleExportPNG = () => {
    if (!containerRef.current) return;

    domtoimage
      .toPng(containerRef.current, {
        bgcolor: "#ffffff",
      })
      .then((dataUrl: string) => {
        const link: HTMLAnchorElement = document.createElement("a");
        link.download = `${selectedGene}_genome_browser.png`;
        link.href = dataUrl;
        link.click();
      })
      .catch((error: Error) => console.error("Error capturing PNG:", error));
  };

  return (
    <div className="genome-browser-container">
      {/* Toolbar */}
      <div className="genome-browser-toolbar">
        {/* Zoom Controls */}
        <div className="genome-browser-toolbar-group">
          <Button
            onClick={handleZoomIn}
            variant="outline"
            size="sm"
            className="h-8 px-3"
            type="button"
          >
            <ZoomIn className="h-3 w-3" />
          </Button>
          <Button
            onClick={handleZoomOut}
            variant="outline"
            size="sm"
            className="h-8 px-3"
            type="button"
          >
            <ZoomOut className="h-3 w-3" />
          </Button>
          <Button
            onClick={handleReset}
            variant="outline"
            size="sm"
            className="h-8 px-3"
            type="button"
          >
            <RotateCcw className="h-3 w-3" />
          </Button>
        </div>

        {/* Divider */}
        <div className="genome-browser-toolbar-divider" />

        {/* Export Controls */}
        <div className="genome-browser-toolbar-group">
          <Button
            onClick={handleExportSVG}
            variant="outline"
            size="sm"
            className="h-8 px-3"
            type="button"
          >
            <Download className="h-3 w-3 mr-1" />
            <span className="text-xs">SVG</span>
          </Button>
          <Button
            onClick={handleExportPNG}
            variant="outline"
            size="sm"
            className="h-8 px-3"
            type="button"
          >
            <FileImage className="h-3 w-3 mr-1" />
            <span className="text-xs">PNG</span>
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-3 px-1 py-2 flex-wrap">
        <span className="text-xs font-medium text-slate-500">Population Filters</span>
        <div className="flex items-center gap-1">
          <span className="text-xs text-slate-400">Source:</span>
          <Select value={sourceFilter} onValueChange={setSourceFilter}>
            <SelectTrigger className="h-6 w-20 text-xs">
              <SelectValue>
                {sourceFilter === "all"
                  ? "All"
                  : sourceFilter === "gnomad"
                    ? "gnomAD"
                    : "AoU"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="gnomad">gnomAD</SelectItem>
              <SelectItem value="aou">All of Us</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-xs text-slate-400">Zygosity:</span>
          <Select value={zygosityFilter} onValueChange={setZygosityFilter}>
            <SelectTrigger className="h-6 w-28 text-xs">
              <SelectValue>
                {zygosityFilter === "all"
                  ? "All"
                  : zygosityFilter === "het"
                    ? "Heterozygous"
                    : "Homozygous"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="het">Heterozygous</SelectItem>
              <SelectItem value="hom">Homozygous</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div ref={viewerRef} className="genome-browser-viewer">
        <RegionViewer
          regions={regions}
          width={viewerWidth}
          leftPanelWidth={140}
          rightPanelWidth={0}
        >
          <PositionAxisTrack />
          <SequenceTrack
            regions={regions}
            geneSequence={geneData.sequence}
            geneStart={geneData.start}
          />
          <Cursor
            onClick={(cursorPosition) => {
              if (cursorPosition !== null) {
                const currentRegion = regions[0];
                const halfRange = Math.round(
                  (currentRegion.stop - currentRegion.start) / 2,
                );
                const rounded = Math.round(cursorPosition);
                setRegions([
                  {
                    start: rounded - halfRange,
                    stop: rounded + halfRange,
                  },
                ]);
                setIsZoomed(true);
                onVariantNavigate?.(rounded);
              }
            }}
            onDrag={(start, end) => {
              setRegions([{ start: Math.round(start), stop: Math.round(end) }]);
              setIsZoomed(true);
            }}
            renderCursor={renderCustomCursor}
          >
            <DomainsTrack
              domains={structuralFeatures}
              regions={regions}
              geneStart={geneData.start}
              geneStrand={geneData.strand}
              geneEnd={geneData.end}
            />
            <FunctionScoreTrack
              variants={variants}
              regions={regions}
              geneStart={geneData.start}
              geneStrand={geneData.strand}
              geneEnd={geneData.end}
            />
            <SnRNAVariantTrack
              variants={variants}
              gnomadVariants={gnomadVariants}
              aouVariants={aouVariants}
              sourceFilter={sourceFilter}
              zygosityFilter={zygosityFilter}
              selectedVariantPosition={selectedVariantPosition}
            />
          </Cursor>
        </RegionViewer>
      </div>
    </div>
  );
};

export default GenomeBrowser;
