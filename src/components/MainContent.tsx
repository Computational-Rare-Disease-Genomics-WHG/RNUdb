import { Dna } from "lucide-react";
import React, { useState } from "react";
import type {
  OverlayData,
  Literature,
  Variant,
  SnRNAGene,
  RNAStructure,
  Nucleotide,
  PDBStructure,
  LiteratureCounts,
} from "../types";
import GenomeBrowser from "./GenomeBrowser";
import InfoPanel from "./InfoPanel";
import RNAViewer from "./RNAViewer";
import VariantLiteratureCard from "./VariantLiteratureCard";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface MainContentProps {
  currentData: SnRNAGene;
  rnaStructureData: RNAStructure | null;
  pdbStructureData: PDBStructure | null;
  paperData: Literature[];
  literatureCounts: LiteratureCounts[];
  variantData: Variant[];
  gnomadVariants: Variant[];
  aouVariants: Variant[];
  overlayMode: "none" | "clinvar" | "gnomad" | "depletion_group";
  getCurrentOverlayData: () => OverlayData;
  cycleOverlayMode: () => void;
  functionScoreTrackData?: OverlayData;
  depletionGroupTrackData: OverlayData;
  caddScoreTrackData: OverlayData;
}

const MainContent: React.FC<MainContentProps> = ({
  currentData,
  rnaStructureData,
  pdbStructureData,
  paperData,
  literatureCounts,
  variantData,
  gnomadVariants,
  aouVariants,
  overlayMode,
  getCurrentOverlayData,
  cycleOverlayMode,
  functionScoreTrackData,
  depletionGroupTrackData,
  caddScoreTrackData,
}) => {
  const [hoveredNucleotide, setHoveredNucleotide] = useState<Nucleotide | null>(
    null,
  );
  const [selectedNucleotide, setSelectedNucleotide] =
    useState<Nucleotide | null>(null);

  const handleNucleotideClick = (nucleotide: Nucleotide) => {
    if (selectedNucleotide?.id === nucleotide.id) {
      setSelectedNucleotide(null);
    } else {
      setSelectedNucleotide(nucleotide);
    }
  };

  const getDisplayNucleotide = (): Nucleotide | null => {
    return hoveredNucleotide || selectedNucleotide;
  };

  const getRNAData = () => {
    if (rnaStructureData) {
      return {
        id: rnaStructureData.id,
        geneId: rnaStructureData.gene_id,
        name: currentData.name,
        nucleotides: rnaStructureData.nucleotides,
        base_pairs: rnaStructureData.base_pairs,
        annotations: rnaStructureData.annotations,
        structural_features: rnaStructureData.structural_features,
      };
    }
    return {
      id: "default",
      geneId: currentData.id,
      name: currentData.name,
      nucleotides: [],
      base_pairs: [],
      annotations: [],
      structural_features: [],
    };
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full">
          <div className="lg:col-span-1 space-y-8 w-full">
            <InfoPanel
              currentData={currentData}
              paperData={paperData}
              literatureCounts={literatureCounts}
              variantData={variantData}
              hoveredNucleotide={getDisplayNucleotide()}
              overlayMode={overlayMode}
              onCycleOverlay={cycleOverlayMode}
            />
          </div>

          <div className="lg:col-span-2 space-y-8 w-full">
            <Card className="bg-white/95 backdrop-blur-sm border border-slate-200 shadow-xl shadow-slate-200/30 rounded-2xl w-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Dna className="h-5 w-5 text-teal-600" />
                  RNA Secondary Structure
                </CardTitle>
                <CardDescription>
                  Interactive visualization of {currentData.name} structure with
                  overlay data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RNAViewer
                  rnaData={getRNAData()}
                  pdbData={pdbStructureData}
                  overlayData={getCurrentOverlayData()}
                  overlayMode={overlayMode}
                  onCycleOverlay={cycleOverlayMode}
                  variantData={variantData}
                  gnomadVariants={gnomadVariants}
                  onNucleotideHover={setHoveredNucleotide}
                  onNucleotideClick={handleNucleotideClick}
                  selectedNucleotide={selectedNucleotide}
                  geneData={{
                    id: currentData.id,
                    name: currentData.name,
                    chromosome: currentData.chromosome,
                    start: currentData.start,
                    end: currentData.end,
                    strand: currentData.strand,
                    sequence: currentData.sequence,
                  }}
                />
              </CardContent>
            </Card>
          </div>
        </div>

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
                  strand: currentData.strand,
                  sequence: currentData.sequence,
                }}
              />
            </CardContent>
          </Card>
        </div>

        <div className="w-full">
          <VariantLiteratureCard
            variantData={variantData}
            paperData={paperData}
            literatureCounts={literatureCounts}
            currentGene={currentData.name}
          />
        </div>
      </div>
    </main>
  );
};

export default MainContent;
