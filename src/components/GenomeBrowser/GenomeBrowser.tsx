// GenomeBrowser.tsx
import React, { useState, useRef } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Download, FileImage } from 'lucide-react';
import domtoimage from 'dom-to-image-more';
import { RegionViewer, PositionAxisTrack, Cursor } from '@gnomad/region-viewer';
import { Button } from '@/components/ui/button';
import SequenceTrack from './SequenceTrack';
import SnRNAVariantTrack from './SnRNAVariantTrack';
import GenericTrack from './GenericTrack';
import './GenomeBrowser.css';

interface GenomeBrowserProps {
  selectedGene: string;
  variants: any[];
  gnomadVariants: any[];
  aouVariants: any[];
  functionScoreTrackData: any;
  depletionGroupTrackData: any;
  caddScoreTrackData: any;
  geneData: {
    id: string;
    name: string;
    chromosome: string;
    start: number;
    end: number;
    sequence: string;
  };
}

const GenomeBrowser: React.FC<GenomeBrowserProps> = ({ selectedGene, variants, gnomadVariants, aouVariants, functionScoreTrackData, depletionGroupTrackData, caddScoreTrackData, geneData }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [, setIsZoomed] = useState(false);

  // Default region based on gene coordinates - wider view
  const defaultRegion = { start: geneData.start, stop: geneData.end  };
  const [regions, setRegions] = useState([defaultRegion]);

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
    const center = (currentRegion.start + currentRegion.stop) / 2;
    const newHalfRange = (currentRegion.stop - currentRegion.start) / 4;
    setRegions([{ start: center - newHalfRange, stop: center + newHalfRange }]);
    setIsZoomed(true);
  };

  const handleZoomOut = () => {
    const currentRegion = regions[0];
    const center = (currentRegion.start + currentRegion.stop) / 2;
    const newRange = (currentRegion.stop - currentRegion.start) * 2;
    setRegions([{ start: center - newRange, stop: center + newRange }]);
  };

  const handleReset = () => {
    setRegions([defaultRegion]);
    setIsZoomed(false);
  };

  const handleExportSVG = () => {
    if (containerRef.current) {
      domtoimage.toSvg(containerRef.current)
        .then((dataUrl: string) => {
          const link = document.createElement('a');
          link.download = `${selectedGene}_genome_browser.svg`;
          link.href = dataUrl;
          link.click();
        })
        .catch((error: Error) => console.error('Error capturing SVG:', error));
    }
  };

  const handleExportPNG = () => {
    if (containerRef.current) {
      domtoimage.toPng(containerRef.current as HTMLElement)
        .then((dataUrl: string) => {
          const link: HTMLAnchorElement = document.createElement('a');
          link.download = `${selectedGene}_genome_browser.png`;
          link.href = dataUrl;
          link.click();
        })
        .catch((error: Error) => console.error('Error capturing PNG:', error));
    }
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
          >
            <ZoomIn className="h-3 w-3" />
          </Button>
          <Button
            onClick={handleZoomOut}
            variant="outline"
            size="sm"
            className="h-8 px-3"
          >
            <ZoomOut className="h-3 w-3" />
          </Button>
          <Button
            onClick={handleReset}
            variant="outline"
            size="sm"
            className="h-8 px-3"
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
          >
            <Download className="h-3 w-3 mr-1" />
            <span className="text-xs">SVG</span>
          </Button>
          <Button
            onClick={handleExportPNG}
            variant="outline"
            size="sm"
            className="h-8 px-3"
          >
            <FileImage className="h-3 w-3 mr-1" />
            <span className="text-xs">PNG</span>
          </Button>
        </div>
      </div>
      
      <div ref={containerRef} className="genome-browser-viewer">
        <RegionViewer regions={regions} width={1080} leftPanelWidth={140} rightPanelWidth={0}>
          <PositionAxisTrack />
            <SequenceTrack regions={regions} geneSequence={geneData.sequence} geneStart={geneData.start} />
          <Cursor
            onClick={(cursorPosition) => {
              if (cursorPosition !== null) {
                setRegions([{ start: cursorPosition - 75, stop: cursorPosition + 75 }]);
                setIsZoomed(true);
              }
            }}
            onDrag={(start, end) => {
              setRegions([{ start, stop: end }]);
              setIsZoomed(true);
            }}
            renderCursor={renderCustomCursor}
          >
            {/* <GenesTrack
              title="Genes"
              genes={genes}
              renderGeneLabel={(gene) => (
                <g>
                  <text className="genes-track-label">
                    {gene.gene_name}
                  </text>
                  <text className="genes-track-type" dy={10}>
                    {gene.gene_type || 'gene'}
                  </text>
                </g>
              )}
              renderGene={(gene) => {
                const color = gene.gene_type === 'snRNA' ? COLORBLIND_FRIENDLY_PALETTE.GENES.SNRNA : 
                             gene.gene_type === 'protein_coding' ? COLORBLIND_FRIENDLY_PALETTE.GENES.PROTEIN_CODING : 
                             COLORBLIND_FRIENDLY_PALETTE.GENES.OTHER;
                return (
                  <rect
                    fill={color}
                    stroke={color}
                    strokeWidth={1}
                  />
                );
              }}
            /> */}
            <GenericTrack title="Function Score" height={80} data={functionScoreTrackData} regions={regions} displayType="bars" geneStart={geneData.start} />
            <GenericTrack title="CADD Score" height={80} data={caddScoreTrackData} regions={regions} displayType="bars" geneStart={geneData.start} />
            <GenericTrack title="Depletion Group" height={30} data={depletionGroupTrackData} regions={regions} displayType="bars" geneStart={geneData.start} />
            <SnRNAVariantTrack variants={variants} gnomadVariants={gnomadVariants} aouVariants={aouVariants} />
          </Cursor>
        </RegionViewer>
      </div>
    </div>
  );
};

export default GenomeBrowser;