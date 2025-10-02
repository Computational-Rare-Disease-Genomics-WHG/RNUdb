// src/components/RNAViewer/RNAViewer.tsx
import React, { useState, useCallback, useRef, useEffect } from 'react';
import PDBViewer from './PDBViewer';
import type { RNAData, Nucleotide, OverlayData, Variant } from '../../types';
import { findNucleotideById } from '../../lib/rnaUtils';
import { COLORBLIND_FRIENDLY_PALETTE, generateGnomadColorWithAlpha, getFunctionScoreColor } from '../../lib/colors';
import { getOverlayValue } from '../../lib/overlayUtils';
import NucleotideComponent from './NucleotideComponent';
import BasePairBond from './BasePairBond';
import domtoimage from 'dom-to-image-more';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Switch } from '@/components/ui/switch';
import { ZoomIn, ZoomOut, RotateCcw, Download, FileImage, Database, BarChart3 } from 'lucide-react';
import './RNAViewer.css';

interface RNAViewerProps {
  rnaData: RNAData;
  pdbData?: any; // TODO: Define proper PDBStructure type
  overlayData?: OverlayData;
  onNucleotideClick?: (nucleotide: Nucleotide) => void;
  onNucleotideHover?: (nucleotide: Nucleotide | null) => void;
  overlayMode?: 'none' | 'clinvar' | 'gnomad' | 'function_score' | 'depletion_group';
  onCycleOverlay?: () => void;
  variantStats?: {
    pathogenic: number;
    benign: number;
    vus: number;
    total: number;
  };
  variantData?: Variant[];
  gnomadVariants?: Variant[];
  selectedNucleotide?: Nucleotide | null;
}

const RNAViewer: React.FC<RNAViewerProps> = ({
  rnaData,
  pdbData,
  overlayData = {},
  onNucleotideClick,
  onNucleotideHover,
  overlayMode = 'none',
  onCycleOverlay,
  variantData = [],
  gnomadVariants = [],
  selectedNucleotide = null
}) => {
  const [hoveredNucleotide, setHoveredNucleotide] = useState<Nucleotide | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleNucleotideClick = useCallback((nucleotide: Nucleotide) => {
    onNucleotideClick?.(nucleotide);
  }, [onNucleotideClick]);

  const handleNucleotideHover = useCallback((nucleotide: Nucleotide | null) => {
    setHoveredNucleotide(nucleotide);
    onNucleotideHover?.(nucleotide);
  }, [onNucleotideHover]);

  const getVariantInfoForNucleotide = useCallback((nucleotideId: number) => {
    // Find variants that affect this nucleotide position
    const relevantVariants = variantData.filter(variant => {
      // Handle both clinical variants (with position) and SGE variants (with nucleotidePosition)
      if (variant.nucleotidePosition !== undefined && variant.nucleotidePosition !== null) {
        // SGE variant - direct nucleotide mapping
        return variant.nucleotidePosition === nucleotideId;
      } else if (variant.position) {
        // Clinical variant - convert genomic position to nucleotide
        return Math.abs(variant.position - (6648956 + nucleotideId)) < 5; // Within ~5bp
      }
      return false;
    });

    const relevantGnomadVariants = gnomadVariants.filter(variant => {
      return Math.abs(variant.position - (6648956 + nucleotideId)) < 5;
    });

    return {
      clinvarVariants: relevantVariants,
      gnomadVariants: relevantGnomadVariants
    };
  }, [variantData, gnomadVariants]);

  const getOverlayColor = (nucleotide: Nucleotide): string => {
    const value = getOverlayValue(overlayData, nucleotide.id);
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

  const [show3D, setShow3D] = useState(false);
  const [showStructuralFeatures, setShowStructuralFeatures] = useState(true);

  // Debug log
  console.log('[RNAViewer] Rendering with:', {
    hasStructuralFeatures: !!rnaData.structuralFeatures,
    count: rnaData.structuralFeatures?.length || 0,
    showStructuralFeatures,
    features: rnaData.structuralFeatures
  });

  return (
    <div className="rna-viewer space-y-4">
      {/* Toggle 2D/3D Button and Overlay Controls */}
      <div className="flex flex-wrap items-center gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
        {/* Toggle 2D/3D Switch */}
        <div className="flex items-center gap-3 bg-white px-3 py-2 rounded-md border border-slate-200">
          <span className={`text-sm font-medium transition-colors ${!show3D ? 'text-teal-600' : 'text-slate-500'}`}>
            2D Structure
          </span>
          <Switch
            checked={show3D}
            onCheckedChange={setShow3D}
            className="data-[state=checked]:bg-teal-600"
          />
          <span className={`text-sm font-medium transition-colors ${show3D ? 'text-teal-600' : 'text-slate-500'}`}>
            3D Structure
          </span>
        </div>

        {/* Divider */}
        <div className="h-4 w-px bg-slate-300 mx-2" />

        {/* Structural Features Toggle */}
        {!show3D && (
          <>
            <div className="flex items-center gap-3 bg-white px-3 py-2 rounded-md border border-slate-200">
              <span className="text-sm text-slate-700 font-medium">Structural Features</span>
              <Switch
                checked={showStructuralFeatures}
                onCheckedChange={setShowStructuralFeatures}
                className="data-[state=checked]:bg-purple-600"
              />
            </div>
            {/* Divider */}
            <div className="h-4 w-px bg-slate-300 mx-2" />
          </>
        )}

        {/* Shared Overlay Controls */}
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
              <ToggleGroupItem value="none" className="h-9 px-3 text-xs font-medium rounded-md border border-slate-200 hover:bg-slate-50 data-[state=on]:bg-slate-100 data-[state=on]:border-slate-300">
                None
              </ToggleGroupItem>
              <ToggleGroupItem value="clinvar" className="h-9 px-3 text-xs font-medium rounded-md border border-slate-200 hover:bg-slate-50 data-[state=on]:bg-blue-50 data-[state=on]:border-blue-200 data-[state=on]:text-blue-700">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-red-500"></div>
                  Variants
                </div>
              </ToggleGroupItem>
              <ToggleGroupItem value="gnomad" className="h-9 px-3 text-xs font-medium rounded-md border border-slate-200 hover:bg-slate-50 data-[state=on]:bg-indigo-50 data-[state=on]:border-indigo-200 data-[state=on]:text-indigo-700">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  gnomAD
                </div>
              </ToggleGroupItem>
              <ToggleGroupItem value="function_score" className="h-9 px-3 text-xs font-medium rounded-md border border-slate-200 hover:bg-slate-50 data-[state=on]:bg-emerald-50 data-[state=on]:border-emerald-200 data-[state=on]:text-emerald-700">
                <div className="flex items-center gap-1.5">
                  <BarChart3 className="h-3 w-3" />
                  SGE Function Score
                </div>
              </ToggleGroupItem>
              <ToggleGroupItem value="depletion_group" className="h-9 px-3 text-xs font-medium rounded-md border border-slate-200 hover:bg-slate-50 data-[state=on]:bg-orange-50 data-[state=on]:border-orange-200 data-[state=on]:text-orange-700">
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

        {!show3D && (
          <>
            {/* Divider */}
            <div className="h-4 w-px bg-slate-300 mx-2" />

            {/* 2D-specific controls (Zoom Controls) */}
            <div className="flex items-center gap-1">
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
            </div>
        </>
        )}
      </div>

      {/* Main Content Area */}
      {show3D && (
        <PDBViewer
          pdbData={pdbData}
          height="600px"
          overlayData={overlayData}
          overlayMode={overlayMode}
          selectedNucleotide={selectedNucleotide}
          onNucleotideClick={handleNucleotideClick}
          onNucleotideHover={handleNucleotideHover}
          variantData={variantData}
          gnomadVariants={gnomadVariants}
        />
      )}

      {!show3D && (
        <>
      
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
          viewBox={(() => {
            if (rnaData.nucleotides.length === 0) return '0 0 2000 2000';
            const minX = Math.min(...rnaData.nucleotides.map(n => n.x));
            const maxX = Math.max(...rnaData.nucleotides.map(n => n.x));
            const minY = Math.min(...rnaData.nucleotides.map(n => n.y));
            const maxY = Math.max(...rnaData.nucleotides.map(n => n.y));
            const padding = 100;
            return `${minX - padding} ${minY - padding} ${maxX - minX + padding * 2} ${maxY - minY + padding * 2}`;
          })()}
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
                isSelected={selectedNucleotide?.id === nucleotide.id}
                onHover={handleNucleotideHover}
                onClick={handleNucleotideClick}
                hasVariants={totalVariants > 0}
                variantCount={totalVariants}
              />
            );
          })}
        </g>
        
        {/* Structural Features Layer */}
        {showStructuralFeatures && rnaData.structuralFeatures?.map(feature => {
          const nucleotides = feature.nucleotideIds
            .map(id => rnaData.nucleotides.find(n => n.id === id))
            .filter(Boolean);

          if (nucleotides.length === 0) return null;

          // Calculate bounding box
          const xs = nucleotides.map(n => n.x);
          const ys = nucleotides.map(n => n.y);
          const minX = Math.min(...xs);
          const maxX = Math.max(...xs);
          const minY = Math.min(...ys);
          const maxY = Math.max(...ys);
          const centerX = (minX + maxX) / 2;
          const centerY = (minY + maxY) / 2;

          return (
            <g key={feature.id} className="structural-feature">
              {/* Highlight individual nucleotides */}
              {nucleotides.map(nuc => (
                <circle
                  key={`feature-${feature.id}-nuc-${nuc.id}`}
                  cx={nuc.x}
                  cy={nuc.y}
                  r={28}
                  fill={feature.color || '#8b5cf6'}
                  opacity={0.25}
                  className="pointer-events-none"
                />
              ))}

              {/* Feature label with background */}
              <g className="pointer-events-none">
                <rect
                  x={feature.label.x - (feature.label.text.length * feature.label.fontSize) / 3}
                  y={feature.label.y - feature.label.fontSize / 1.5}
                  width={(feature.label.text.length * feature.label.fontSize) / 1.5}
                  height={feature.label.fontSize + 8}
                  fill="rgba(255, 255, 255, 0.9)"
                  stroke={feature.label.color || '#6d28d9'}
                  strokeWidth="2"
                  rx="4"
                />
                <text
                  x={feature.label.x}
                  y={feature.label.y}
                  fontSize={feature.label.fontSize}
                  fill={feature.label.color || '#6d28d9'}
                  fontWeight="600"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="select-none"
                >
                  {feature.label.text}
                </text>
              </g>

              {/* Connector line from label to feature center */}
              <line
                x1={feature.label.x}
                y1={feature.label.y + feature.label.fontSize / 2}
                x2={centerX}
                y2={centerY}
                stroke={feature.label.color || '#6d28d9'}
                strokeWidth="1"
                strokeDasharray="2,2"
                opacity="0.5"
                className="pointer-events-none"
              />
            </g>
          );
        })}

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
        </>
      )}
    </div>
  );
};

export default RNAViewer;
