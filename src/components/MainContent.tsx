import React from 'react';
import { Dna } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import InfoPanel from './InfoPanel';
import RNAViewer from './RNAViewer';
import GenomeBrowser from './GenomeBrowser';
import VariantsSection from './VariantsSection';
import LiteratureSection from './LiteratureSection';
import { toyRNAData } from '../data/toyRNAData';
import type { OverlayData } from '../types';
import type { SnRNAGeneData } from '../data/snRNAData';
import type { Paper } from '../data/paperData';
import type { Variant } from '../data/variantData';

interface MainContentProps {
  currentData: SnRNAGeneData;
  paperData: Paper[];
  variantData: Variant[];
  gnomadVariants: any[];
  overlayMode: 'none' | 'clinvar' | 'gnomad' | 'function_score' | 'depletion_group';
  getCurrentOverlayData: () => OverlayData;
  cycleOverlayMode: () => void;
  variantStats: {
    pathogenic: number;
    benign: number;
    vus: number;
    total: number;
  };
}

const MainContent: React.FC<MainContentProps> = ({
  currentData,
  paperData,
  variantData,
  gnomadVariants,
  overlayMode,
  getCurrentOverlayData,
  cycleOverlayMode,
  variantStats
}) => {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-8">
        {/* Main Content Grid: InfoPanel on left, RNA Structure & Genome Browser on right */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full">
          {/* Left Column: InfoPanel and Literature */}
          <div className="lg:col-span-1 space-y-8 w-full">
            <InfoPanel 
              currentData={currentData}
              paperData={paperData}
              variantData={variantData}
              overlayMode={overlayMode}
              onCycleOverlay={cycleOverlayMode}
            />
            <LiteratureSection 
              paperData={paperData}
              currentGene={currentData.name}
            />
          </div>

          {/* Right Column: RNA Structure & Genome Browser */}
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
                  rnaData={toyRNAData}
                  overlayData={getCurrentOverlayData()}
                  overlayMode={overlayMode}
                  onCycleOverlay={cycleOverlayMode}
                  variantStats={variantStats}
                  variantData={variantData}
                  gnomadVariants={gnomadVariants}
                />
              </CardContent>
            </Card>

            {/* Genome Browser */}
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
                />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Bottom Row: ClinVar Variants Full Width */}
        <div className="w-full">
          <VariantsSection 
            variantData={variantData}
            currentGene={currentData.name}
            variantStats={variantStats}
          />
        </div>
      </div>
    </main>
  );
};

export default MainContent;