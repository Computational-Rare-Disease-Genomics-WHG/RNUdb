// src/components/RNAViewer/RNAViewer.tsx
import React, { useState, useCallback, useRef } from 'react';
import type { RNAData, Nucleotide, OverlayData } from '../../types';
import { findNucleotideById } from '../../lib/rnaUtils';
import { COLORBLIND_FRIENDLY_PALETTE, generateGnomadColorWithAlpha, getFunctionScoreColor } from '../../lib/colors';
import NucleotideComponent from './NucleotideComponent';
import BasePairBond from './BasePairBond';
import domtoimage from 'dom-to-image-more';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { ZoomIn, ZoomOut, RotateCcw, Download, FileImage, Database, BarChart3 } from 'lucide-react';
import './RNAViewer.css';

interface RNAViewerProps {
  rnaData: RNAData;
  overlayData?: OverlayData;
  onNucleotideClick?: (nucleotide: Nucleotide, selectedSet: Set<number>) => void;
  onNucleotideHover?: (nucleotide: Nucleotide | null) => void;
  overlayMode?: 'none' | 'clinvar' | 'gnomad' | 'function_score' | 'depletion_group';
  onCycleOverlay?: () => void;
  variantStats?: {
    pathogenic: number;
    benign: number;
    vus: number;
    total: number;
  };
  variantData?: any[];
  gnomadVariants?: any[];
}

const RNAViewer: React.FC<RNAViewerProps> = ({ 
  rnaData, 
  overlayData = {}, 
  onNucleotideClick,
  onNucleotideHover,
  overlayMode = 'none',
  onCycleOverlay,
  variantData = [],
  gnomadVariants = []
}) => {
  const [hoveredNucleotide, setHoveredNucleotide] = useState<Nucleotide | null>(null);
  const [selectedNucleotides, setSelectedNucleotides] = useState<Set<number>>(new Set());
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleNucleotideClick = useCallback((nucleotide: Nucleotide) => {
    const newSelected = new Set(selectedNucleotides);
    if (newSelected.has(nucleotide.id)) {
      newSelected.delete(nucleotide.id);
    } else {
      newSelected.add(nucleotide.id);
    }
    setSelectedNucleotides(newSelected);
    onNucleotideClick?.(nucleotide, newSelected);
  }, [selectedNucleotides, onNucleotideClick]);

  const handleNucleotideHover = useCallback((nucleotide: Nucleotide | null) => {
    setHoveredNucleotide(nucleotide);
    onNucleotideHover?.(nucleotide);
  }, [onNucleotideHover]);

  const getVariantInfoForNucleotide = useCallback((nucleotideId: number) => {
    // Find variants that affect this nucleotide position
    const relevantVariants = variantData.filter(variant => {
      // Handle both clinical variants (with position) and SGE variants (with nucleotide)
      if (variant.nucleotide !== undefined && variant.nucleotide !== null) {
        // SGE variant - direct nucleotide mapping
        return variant.nucleotide === nucleotideId;
      } else if (variant.position) {
        // Clinical variant - convert genomic position to nucleotide
        const position = parseInt(variant.position.split(':')[1]);
        return Math.abs(position - (6648956 + nucleotideId)) < 5; // Within ~5bp
      }
      return false;
    });

    const relevantGnomadVariants = gnomadVariants.filter(variant => {
      return Math.abs(variant.pos - (6648956 + nucleotideId)) < 5;
    });

    return {
      clinvarVariants: relevantVariants,
      gnomadVariants: relevantGnomadVariants
    };
  }, [variantData, gnomadVariants]);

  const getOverlayColor = (nucleotide: Nucleotide): string => {
    const value = overlayData[nucleotide.id];
    if (!value) return COLORBLIND_FRIENDLY_PALETTE.NEUTRAL.BACKGROUND;
    
    if (overlayMode === 'clinvar') {
      // ClinVar coloring: colorblind-friendly palette
      if (value === 1) return COLORBLIND_FRIENDLY_PALETTE.CLINVAR.PATHOGENIC;      // red for pathogenic
      if (value === 0.5) return COLORBLIND_FRIENDLY_PALETTE.CLINVAR.BENIGN;        // green for benign
      if (value === 0.25) return COLORBLIND_FRIENDLY_PALETTE.CLINVAR.VUS;          // amber for VUS
      return COLORBLIND_FRIENDLY_PALETTE.NEUTRAL.BACKGROUND;
    } else if (overlayMode === 'gnomad') {
      // Continuous color scale for gnomAD (colorblind-friendly blue gradient)
      return generateGnomadColorWithAlpha(value);
    } else if (overlayMode === 'function_score') {
      // Function score coloring: continuous color scale
      return getFunctionScoreColor(value);
    } else if (overlayMode === 'depletion_group') {
      // Depletion group coloring: discrete categories
      if (value === 3) return COLORBLIND_FRIENDLY_PALETTE.DEPLETION.STRONG;       // strong = 3
      if (value === 2) return COLORBLIND_FRIENDLY_PALETTE.DEPLETION.MODERATE;     // moderate = 2
      if (value === 1) return COLORBLIND_FRIENDLY_PALETTE.DEPLETION.NORMAL;       // normal = 1
      return COLORBLIND_FRIENDLY_PALETTE.NEUTRAL.BACKGROUND;
    }
    
    return COLORBLIND_FRIENDLY_PALETTE.NEUTRAL.BACKGROUND;
  };

  const handleZoom = useCallback((delta: number) => {
    setZoomLevel(prev => Math.max(0.1, Math.min(5, prev + delta)));
  }, []);

  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    setIsPanning(true);
    setLastPanPoint({ x: event.clientX, y: event.clientY });
  }, []);

  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    if (!isPanning) return;
    
    const deltaX = event.clientX - lastPanPoint.x;
    const deltaY = event.clientY - lastPanPoint.y;
    
    setPanOffset(prev => ({
      x: prev.x + deltaX,
      y: prev.y + deltaY
    }));
    
    setLastPanPoint({ x: event.clientX, y: event.clientY });
  }, [isPanning, lastPanPoint]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  const resetView = useCallback(() => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  }, []);

  const saveAsSVG = useCallback(() => {
    if (!svgRef.current) return;
    
    const svgElement = svgRef.current;
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svgElement);
    
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = 'rna-structure.svg';
    link.click();
    
    URL.revokeObjectURL(url);
  }, []);

  const saveAsPNG = useCallback(() => {
    if (!containerRef.current) return;
    
    domtoimage.toPng(containerRef.current)
      .then((dataUrl) => {
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = 'rna-structure.png';
        link.click();
      })
      .catch((error) => {
        console.error('Error generating PNG:', error);
      });
  }, []);

  return (
    <div className="rna-viewer space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
        {/* Zoom Controls */}
        <div className="flex items-center gap-1">
          <Button 
            onClick={() => handleZoom(0.1)} 
            variant="outline" 
            size="sm" 
            className="h-8 px-3"
          >
            <ZoomIn className="h-3 w-3" />
          </Button>
          <Button 
            onClick={() => handleZoom(-0.1)} 
            variant="outline" 
            size="sm" 
            className="h-8 px-3"
          >
            <ZoomOut className="h-3 w-3" />
          </Button>
          <Button 
            onClick={resetView} 
            variant="outline" 
            size="sm" 
            className="h-8 px-3"
          >
            <RotateCcw className="h-3 w-3" />
          </Button>
          <span className="text-xs text-slate-600 ml-2">
            {Math.round(zoomLevel * 100)}%
          </span>
        </div>

        {/* Divider */}
        <div className="h-4 w-px bg-slate-300 mx-2" />

        {/* Export Controls */}
        <div className="flex items-center gap-1">
          <Button 
            onClick={saveAsSVG} 
            variant="outline" 
            size="sm" 
            className="h-8 px-3"
          >
            <Download className="h-3 w-3 mr-1" />
            <span className="text-xs">SVG</span>
          </Button>
          <Button 
            onClick={saveAsPNG} 
            variant="outline" 
            size="sm" 
            className="h-8 px-3"
          >
            <FileImage className="h-3 w-3 mr-1" />
            <span className="text-xs">PNG</span>
          </Button>
        </div>

        {/* Divider */}
        <div className="h-4 w-px bg-slate-300 mx-2" />

        {/* Overlay Controls */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-slate-500" />
            <span className="text-sm text-slate-700 font-medium">Data Overlay</span>
          </div>
          {onCycleOverlay && (
            <ToggleGroup 
              type="single" 
              value={overlayMode}
              onValueChange={(value) => {
                if (value && value !== overlayMode) {
                  // Calculate how many times to cycle to reach the target
                  const modes = ['none', 'clinvar', 'gnomad', 'function_score', 'depletion_group'];
                  const currentIndex = modes.indexOf(overlayMode);
                  const targetIndex = modes.indexOf(value);
                  const cycles = targetIndex > currentIndex ? targetIndex - currentIndex : (modes.length - currentIndex) + targetIndex;
                  
                  for (let i = 0; i < cycles; i++) {
                    onCycleOverlay();
                  }
                }
              }}
              className="flex gap-1"
            >
              <ToggleGroupItem 
                value="none" 
                className="h-9 px-3 text-xs font-medium rounded-md border border-slate-200 hover:bg-slate-50 data-[state=on]:bg-slate-100 data-[state=on]:border-slate-300"
              >
                None
              </ToggleGroupItem>
              <ToggleGroupItem 
                value="clinvar" 
                className="h-9 px-3 text-xs font-medium rounded-md border border-slate-200 hover:bg-slate-50 data-[state=on]:bg-blue-50 data-[state=on]:border-blue-200 data-[state=on]:text-blue-700"
              >
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-red-500"></div>
                  Variants
                </div>
              </ToggleGroupItem>
              <ToggleGroupItem 
                value="gnomad" 
                className="h-9 px-3 text-xs font-medium rounded-md border border-slate-200 hover:bg-slate-50 data-[state=on]:bg-indigo-50 data-[state=on]:border-indigo-200 data-[state=on]:text-indigo-700"
              >
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  gnomAD
                </div>
              </ToggleGroupItem>
              <ToggleGroupItem 
                value="function_score" 
                className="h-9 px-3 text-xs font-medium rounded-md border border-slate-200 hover:bg-slate-50 data-[state=on]:bg-emerald-50 data-[state=on]:border-emerald-200 data-[state=on]:text-emerald-700"
              >
                <div className="flex items-center gap-1.5">
                  <BarChart3 className="h-3 w-3" />
                  SGE Function Score
                </div>
              </ToggleGroupItem>
              <ToggleGroupItem 
                value="depletion_group" 
                className="h-9 px-3 text-xs font-medium rounded-md border border-slate-200 hover:bg-slate-50 data-[state=on]:bg-orange-50 data-[state=on]:border-orange-200 data-[state=on]:text-orange-700"
              >
                <div className="flex items-center gap-1.5">
                  <div className="flex gap-0.5">
                    <div className="w-1 h-3 bg-red-400 rounded-sm"></div>
                    <div className="w-1 h-2 bg-amber-400 rounded-sm"></div>
                    <div className="w-1 h-1 bg-green-400 rounded-sm"></div>
                  </div>
                  Depletion Group
                </div>
              </ToggleGroupItem>
            </ToggleGroup>
          )}
        </div>

      </div>
      
      <div 
        ref={containerRef}
        className="rna-svg-container relative"
        style={{ 
          width: '100%', 
          height: '500px', 
          border: '1px solid #ccc',
          overflow: 'hidden',
          cursor: isPanning ? 'grabbing' : 'grab',
          backgroundColor: '#f8fafc'
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <svg 
          ref={svgRef}
          viewBox={`${Math.min(...rnaData.nucleotides.map(n => n.x), 0) - 25} ${Math.min(...rnaData.nucleotides.map(n => n.y), 0) - 25} ${Math.max(...rnaData.nucleotides.map(n => n.x), 0) - Math.min(...rnaData.nucleotides.map(n => n.x), 0) + 50} ${Math.max(...rnaData.nucleotides.map(n => n.y), 0) - Math.min(...rnaData.nucleotides.map(n => n.y), 0) + 50}`} 
          className="rna-svg"
          style={{ 
            width: '100%', 
            height: '100%',
            transform: `scale(${zoomLevel}) translate(${panOffset.x}px, ${panOffset.y}px)`,
            transformOrigin: 'center center'
          }}
        >
        <g className="bonds-layer">
          {rnaData.basePairs.map(({ from, to }, index) => {
            const fromNuc = findNucleotideById(rnaData.nucleotides, from);
            const toNuc = findNucleotideById(rnaData.nucleotides, to);
            
            if (!fromNuc || !toNuc) return null;
            
            // Create unique key using index and sorted nucleotide IDs to avoid duplicates
            const sortedKey = from < to ? `${from}-${to}` : `${to}-${from}`;
            return (
              <BasePairBond
                key={`bond-${index}-${sortedKey}`}
                from={fromNuc}
                to={toNuc}
              />
            );
          })}
        </g>

        <g className="nucleotides-layer">
          {rnaData.nucleotides.map(nucleotide => {
            const variantInfo = getVariantInfoForNucleotide(nucleotide.id);
            const totalVariants = variantInfo.clinvarVariants.length + variantInfo.gnomadVariants.length;
            return (
              <NucleotideComponent
                key={nucleotide.id}
                nucleotide={nucleotide}
                color={getOverlayColor(nucleotide)}
                isHovered={hoveredNucleotide?.id === nucleotide.id}
                isSelected={selectedNucleotides.has(nucleotide.id)}
                onHover={handleNucleotideHover}
                onClick={handleNucleotideClick}
                hasVariants={totalVariants > 0}
                variantCount={totalVariants}
              />
            );
          })}
        </g>
        
        <g className="annotations-layer">
          {rnaData.annotations?.map(annotation => (
            <text
              key={annotation.id}
              x={annotation.x}
              y={annotation.y}
              fontSize={annotation.fontSize}
              fill={annotation.color || '#374151'}
              textAnchor="middle"
              dominantBaseline="middle"
              className="pointer-events-none select-none font-medium"
            >
              {annotation.text}
            </text>
          ))}
        </g>
        </svg>
        
        {hoveredNucleotide && (
          <div className="absolute top-4 right-4 z-10 bg-white p-3 rounded-lg shadow-lg border border-slate-200 text-sm max-w-72">
            <div className="font-semibold text-slate-800 mb-2">Nucleotide {hoveredNucleotide.id}</div>
            <div className="space-y-1">
              <div><strong>Base:</strong> {hoveredNucleotide.base}</div>
              
              {overlayData[hoveredNucleotide.id] && (
                <div>
                  <strong>
                    {overlayMode === 'clinvar' ? 'Variant:' : 
                     overlayMode === 'gnomad' ? 'Frequency:' : 
                     overlayMode === 'function_score' ? 'Function Score:' :
                     overlayMode === 'depletion_group' ? 'Depletion:' : 'Value:'}
                  </strong> 
                  {overlayMode === 'clinvar' ? 
                    (overlayData[hoveredNucleotide.id] === 1 ? 'Pathogenic' : 
                     overlayData[hoveredNucleotide.id] === 0.5 ? 'Benign' : 
                     overlayData[hoveredNucleotide.id] === 0.25 ? 'VUS' : 'Unknown') : 
                   overlayMode === 'depletion_group' ?
                    (overlayData[hoveredNucleotide.id] === 3 ? 'Strong' :
                     overlayData[hoveredNucleotide.id] === 2 ? 'Moderate' :
                     overlayData[hoveredNucleotide.id] === 1 ? 'Normal' : 'Unknown') :
                    overlayData[hoveredNucleotide.id].toFixed(3)}
                </div>
              )}
              
              {(() => {
                const variantInfo = getVariantInfoForNucleotide(hoveredNucleotide.id);
                return (
                  <>
                    {variantInfo.clinvarVariants.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-slate-200">
                        <div className="font-medium text-slate-700 mb-1">ClinVar Variants ({variantInfo.clinvarVariants.length})</div>
                        {variantInfo.clinvarVariants.slice(0, 3).map((variant, index) => (
                          <div key={index} className="text-xs text-slate-600 ml-2">
                            • {variant.ref}→{variant.alt}: {variant.clinical}
                          </div>
                        ))}
                        {variantInfo.clinvarVariants.length > 3 && (
                          <div className="text-xs text-slate-500 ml-2">...and {variantInfo.clinvarVariants.length - 3} more</div>
                        )}
                      </div>
                    )}
                    
                    {variantInfo.gnomadVariants.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-slate-200">
                        <div className="font-medium text-slate-700 mb-1">gnomAD Variants ({variantInfo.gnomadVariants.length})</div>
                        {variantInfo.gnomadVariants.slice(0, 2).map((variant, index) => (
                          <div key={index} className="text-xs text-slate-600 ml-2">
                            • AF: {variant.allele_freq.toFixed(4)}
                          </div>
                        ))}
                        {variantInfo.gnomadVariants.length > 2 && (
                          <div className="text-xs text-slate-500 ml-2">...and {variantInfo.gnomadVariants.length - 2} more</div>
                        )}
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      {overlayMode !== 'none' && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="text-sm font-medium text-gray-700 mb-2">
            {overlayMode === 'clinvar' ? 'ClinVar Legend:' : 
             overlayMode === 'gnomad' ? 'gnomAD Legend:' :
             overlayMode === 'function_score' ? 'Function Score Legend:' :
             overlayMode === 'depletion_group' ? 'Depletion Group Legend:' : 'Legend:'}
          </div>
          <div className="flex flex-wrap gap-4 text-xs">
            {overlayMode === 'clinvar' ? (
              <>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: COLORBLIND_FRIENDLY_PALETTE.CLINVAR.PATHOGENIC }}></div>
                  <span>Pathogenic</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: COLORBLIND_FRIENDLY_PALETTE.CLINVAR.BENIGN }}></div>
                  <span>Benign</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: COLORBLIND_FRIENDLY_PALETTE.CLINVAR.VUS }}></div>
                  <span>VUS</span>
                </div>
              </>
            ) : overlayMode === 'gnomad' ? (
              <>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: COLORBLIND_FRIENDLY_PALETTE.GNOMAD.LOW }}></div>
                  <span>Low frequency</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: COLORBLIND_FRIENDLY_PALETTE.GNOMAD.MEDIUM }}></div>
                  <span>Medium frequency</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: COLORBLIND_FRIENDLY_PALETTE.GNOMAD.HIGH }}></div>
                  <span>High frequency</span>
                </div>
              </>
            ) : overlayMode === 'function_score' ? (
              <>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: getFunctionScoreColor(-3) }}></div>
                  <span>Highly deleterious (-3)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: getFunctionScoreColor(0) }}></div>
                  <span>Neutral (0)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: getFunctionScoreColor(3) }}></div>
                  <span>Highly beneficial (+3)</span>
                </div>
              </>
            ) : overlayMode === 'depletion_group' ? (
              <>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: COLORBLIND_FRIENDLY_PALETTE.DEPLETION.STRONG }}></div>
                  <span>Strong</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: COLORBLIND_FRIENDLY_PALETTE.DEPLETION.MODERATE }}></div>
                  <span>Moderate</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: COLORBLIND_FRIENDLY_PALETTE.DEPLETION.NORMAL }}></div>
                  <span>Normal</span>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};

export default RNAViewer;