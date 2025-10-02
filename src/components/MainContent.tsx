import React, { useState } from 'react';
import { Dna } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import InfoPanel from './InfoPanel';
import RNAViewer from './RNAViewer';
import GenomeBrowser from './GenomeBrowser';
import VariantsSection from './VariantsSection';
import LiteratureSection from './LiteratureSection';
import type { OverlayData, Literature, Variant, SnRNAGene, RNAStructure, Nucleotide, PDBStructure } from '../types';

interface MainContentProps {
  currentData: SnRNAGene;
  rnaStructureData: RNAStructure | null;
  pdbStructureData: PDBStructure | null;
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
  rnaStructureData,
  pdbStructureData,
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
  // State to manage hovered and selected nucleotide
  const [hoveredNucleotide, setHoveredNucleotide] = useState<Nucleotide | null>(null);
  const [selectedNucleotide, setSelectedNucleotide] = useState<Nucleotide | null>(null);

  // Handler for nucleotide selection (single select)
  const handleNucleotideClick = (nucleotide: Nucleotide) => {
    // Toggle selection: if clicking the same nucleotide, deselect it
    if (selectedNucleotide?.id === nucleotide.id) {
      setSelectedNucleotide(null);
    } else {
      setSelectedNucleotide(nucleotide);
    }
  };

  // Get the nucleotide to display in InfoPanel (prioritize hovered, then selected)
  const getDisplayNucleotide = (): Nucleotide | null => {
    return hoveredNucleotide || selectedNucleotide;
  };

  // Convert RNAStructure to RNAData format for RNAViewer
  const getRNAData = () => {
    if (rnaStructureData) {
      return {
        id: rnaStructureData.id,
        geneId: rnaStructureData.geneId,
        name: currentData.name,
        nucleotides: rnaStructureData.nucleotides,
        basePairs: rnaStructureData.basePairs,
        annotations: rnaStructureData.annotations,
        structuralFeatures: rnaStructureData.structuralFeatures
      };
    }
    // Return minimal structure if no data available
    return {
      id: "default",
      geneId: currentData.id,
      name: currentData.name,
      nucleotides: [],
      basePairs: [],
      annotations: [],
      structuralFeatures: []
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
              hoveredNucleotide={getDisplayNucleotide()}
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
                  pdbData={pdbStructureData}
                  overlayData={getCurrentOverlayData()}
                  overlayMode={overlayMode}
                  onCycleOverlay={cycleOverlayMode}
                  variantStats={variantStats}
                  variantData={variantData}
                  gnomadVariants={gnomadVariants}
                  onNucleotideHover={setHoveredNucleotide}
                  onNucleotideClick={handleNucleotideClick}
                  selectedNucleotide={selectedNucleotide}
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
