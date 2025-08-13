// GenomeBrowser.tsx
import React, { useState, useRef } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Download, FileImage } from 'lucide-react';
import domtoimage from 'dom-to-image-more';
import { RegionViewer, PositionAxisTrack, Cursor } from '@gnomad/region-viewer';
import { GenesTrack } from '@gnomad/track-genes';
import { Button } from '@/components/ui/button';
import { COLORBLIND_FRIENDLY_PALETTE } from '../../lib/colors';
import SequenceTrack from './SequenceTrack';
import ConservationTrack from './ConservationTrack';
import RegulatoryTrack from './RegulatoryTrack';
import SnRNAVariantTrack from './SnRNAVariantTrack';
import FunctionScoreTrack from './FunctionScoreTrack';
import DepletionGroupTrack from './DepletionGroupTrack';
import './GenomeBrowser.css';

// Mock gene data for snRNA with additional genes in the region
const mockGenes = [
  {
    gene_id: 'RNU4-2',
    gene_name: 'RNU4-2',
    symbol: 'RNU4-2',
    start: 6648956,
    stop: 6649101,
    strand: '+',
    gene_type: 'snRNA',
    exons: [
      {
        feature_type: 'exon',
        start: 6648956,
        stop: 6649101
      }
    ]
  },
  {
    gene_id: 'ENSG00000123456',
    gene_name: 'HYPOTHETICAL_GENE',
    symbol: 'HYPOTHETICAL_GENE',
    start: 6648800,
    stop: 6648950,
    strand: '-',
    gene_type: 'protein_coding',
    exons: [
      {
        feature_type: 'exon',
        start: 6648800,
        stop: 6648900
      },
      {
        feature_type: 'exon',
        start: 6648920,
        stop: 6648950
      }
    ]
  }
];

interface GenomeBrowserProps {
  selectedGene: string;
  variants: any[];
  gnomadVariants: any[];
}

const GenomeBrowser: React.FC<GenomeBrowserProps> = ({ selectedGene, variants, gnomadVariants }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [, setIsZoomed] = useState(false);
  
  // Default region based on RNU4-2 - wider view
  const defaultRegion = { start: 6648960, stop: 6649101. };
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
        <RegionViewer regions={regions} width={900} leftPanelWidth={160} rightPanelWidth={160}>
          <PositionAxisTrack />
            <SequenceTrack regions={regions} />
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
            <GenesTrack
              title="Genes"
              genes={mockGenes}
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
            />
            <RegulatoryTrack regions={regions} />
            <ConservationTrack regions={regions} />
            <FunctionScoreTrack regions={regions} />
            <DepletionGroupTrack regions={regions} />
            <SnRNAVariantTrack variants={variants} gnomadVariants={gnomadVariants} />
          </Cursor>
        </RegionViewer>
      </div>
    </div>
  );
};

export default GenomeBrowser;