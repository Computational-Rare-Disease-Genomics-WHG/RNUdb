import React, { useState } from 'react';
import { Dna } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import InfoPanel from './InfoPanel';
import RNAViewer from './RNAViewer';
import GenomeBrowser from './GenomeBrowser';
import VariantsSection from './VariantsSection';
import LiteratureSection from './LiteratureSection';
import type { OverlayData, Literature, Variant, SnRNAGene, RNAStructure, Nucleotide } from '../types';

interface MainContentProps {
  currentData: SnRNAGene;
  structureData: RNAStructure | null;
  paperData: Literature[];
  variantData: Variant[];
  gnomadVariants: Variant[];
  aouVariants: Variant[];
  overlayMode: 'none' | 'clinvar' | 'gnomad' | 'function_score' | 'depletion_group';
  getCurrentOverlayData: () => OverlayData;
  cycleOverlayMode: () => void;
  variantStats: {
    pathogenic: number;
    benign: number;
    vus: number;
    total: number;
  };
  functionScoreTrackData: OverlayData;
  depletionGroupTrackData: OverlayData;
  caddScoreTrackData: OverlayData;
}

const MainContent: React.FC<MainContentProps> = ({
  currentData,
  structureData,
  paperData,
  variantData,
  gnomadVariants,
  aouVariants,
  overlayMode,
  getCurrentOverlayData,
  cycleOverlayMode,
  variantStats,
  functionScoreTrackData,
  depletionGroupTrackData,
  caddScoreTrackData
}) => {
  // State to manage hovered nucleotide
  const [hoveredNucleotide, setHoveredNucleotide] = useState<Nucleotide | null>(null);

  // Convert RNAStructure to RNAData format for RNAViewer
  const getRNAData = () => {
    if (structureData) {
      return {
        id: structureData.id,
        geneId: structureData.geneId,
        name: currentData.name,
        nucleotides: structureData.nucleotides,
        basePairs: structureData.basePairs,
        annotations: structureData.annotations
      };
    }
    // Return minimal structure if no data available
    return {
      id: "default",
      geneId: currentData.id,
      name: currentData.name,
      nucleotides: [],
      basePairs: [],
      annotations: []
    };
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-8">
        {/* Top Row: InfoPanel and RNA Structure */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full">
          {/* Left Column: InfoPanel */}
          <div className="lg:col-span-1 space-y-8 w-full">
            <InfoPanel 
              currentData={currentData}
              paperData={paperData}
              variantData={variantData}
              overlayMode={overlayMode}
              onCycleOverlay={cycleOverlayMode}
              hoveredNucleotide={hoveredNucleotide}
              overlayData={getCurrentOverlayData()}
            />
          </div>

          {/* Right Column: RNA Structure */}
          <div className="lg:col-span-2 space-y-8 w-full">
            {/* RNA Secondary Structure */}
            <Card className="bg-white/95 backdrop-blur-sm border border-slate-200 shadow-xl shadow-slate-200/30 rounded-2xl w-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Dna className="h-5 w-5 text-teal-600" />
                  RNA Secondary Structure
                </CardTitle>
                <CardDescription>
                  Interactive visualization of {currentData.name} structure with overlay data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RNAViewer
                  rnaData={getRNAData()}
                  overlayData={getCurrentOverlayData()}
                  overlayMode={overlayMode}
                  onCycleOverlay={cycleOverlayMode}
                  variantStats={variantStats}
                  variantData={variantData}
                  gnomadVariants={gnomadVariants}
                  onNucleotideHover={setHoveredNucleotide}
                />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Second Row: Genome Browser Full Width */}
        <div className="w-full">
          <Card className="bg-white/95 backdrop-blur-sm border border-slate-200 shadow-xl shadow-slate-200/30 rounded-2xl w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Dna className="h-5 w-5 text-teal-600" />
                Genome Browser
              </CardTitle>
              <CardDescription>
                Genomic context and variant annotations for {currentData.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <GenomeBrowser 
                selectedGene={currentData.name}
                variants={variantData}
                gnomadVariants={gnomadVariants}
                aouVariants={aouVariants}
                functionScoreTrackData={functionScoreTrackData}
                depletionGroupTrackData={depletionGroupTrackData}
                caddScoreTrackData={caddScoreTrackData}
                geneData={{
                  id: currentData.id,
                  name: currentData.name,
                  chromosome: currentData.chromosome,
                  start: currentData.start,
                  end: currentData.end,
                  sequence: currentData.sequence
                }}
              />
            </CardContent>
          </Card>
        </div>

        {/* Third Row: Literature and Variants */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full">
          <div>
            <LiteratureSection 
              paperData={paperData}
              currentGene={currentData.name}
            />
          </div>
          <div>
            <VariantsSection 
              variantData={variantData}
              currentGene={currentData.name}
              variantStats={variantStats}
            />
          </div>
        </div>
      </div>
    </main>
  );
};

export default MainContent;
