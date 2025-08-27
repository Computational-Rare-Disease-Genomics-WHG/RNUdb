import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Database, Dna, Globe, Search } from 'lucide-react';
import type { SnRNAGene, Literature, Variant, Nucleotide, OverlayData } from '@/types';
import { getOverlayValue } from '@/lib/overlayUtils';

interface InfoPanelProps {
  currentData: SnRNAGene;
  paperData: Literature[];
  variantData: Variant[];
  overlayMode: 'none' | 'clinvar' | 'gnomad' | 'function_score' | 'depletion_group';
  onCycleOverlay: () => void;
  hoveredNucleotide: Nucleotide | null;
  overlayData: OverlayData;
}

const InfoPanel: React.FC<InfoPanelProps> = ({ 
  currentData,
  hoveredNucleotide,
  overlayData,
  overlayMode,
  variantData
}) => {
  const geneLength = currentData.end - currentData.start + 1;

  const getVariantInfoForNucleotide = (nucleotideId: number) => {
    // Find variants that affect this nucleotide position
    const relevantVariants = variantData.filter(variant => {
      // Handle both clinical variants (with position) and SGE variants (with nucleotidePosition)
      if (variant.nucleotidePosition !== undefined && variant.nucleotidePosition !== null) {
        // SGE variant - direct nucleotide mapping
        return variant.nucleotidePosition === nucleotideId;
      } else if (variant.position) {
        // Clinical variant - convert genomic position to nucleotide
        return Math.abs(variant.position - (currentData.start + nucleotideId)) < 5; // Within ~5bp
      }
      return false;
    });

    return {
      clinvarVariants: relevantVariants.filter(v => v.clinical_significance),
      gnomadVariants: relevantVariants.filter(v => v.gnomad_ac && v.gnomad_ac > 0)
    };
  };

  return (
    <div className="space-y-6">
      
      {/* Gene Information */}
      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-teal-600 rounded-lg">
                <Dna className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-gray-900">
                  {currentData.name}
                </CardTitle>
                <CardDescription className="text-sm text-gray-600 mt-1">
                  {currentData.fullName}
                </CardDescription>
              </div>
            </div>
            <Badge className="bg-teal-50 text-teal-700 border-teal-200 px-3 py-1 text-sm font-medium">
              snRNA
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-700 leading-relaxed">{currentData.description}</p>
          
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
            <div className="text-center">
              <div className="text-sm text-gray-500">Chromosome</div>
              <div className="text-lg font-semibold text-gray-900">{currentData.chromosome}</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-500">Position</div>
              <div className="text-xs font-mono text-gray-900">
                {currentData.start.toLocaleString()}–{currentData.end.toLocaleString()}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-500">Length</div>
              <div className="text-lg font-semibold text-gray-900">{geneLength} bp</div>
            </div>
          </div>
          
          {/* Additional Information */}
          <div className="pt-4 border-t border-gray-100 space-y-3">
            {/* External Links */}
            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-700">External Resources:</div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" className="h-8 px-3 text-xs">
                  <Globe className="h-3 w-3 mr-1" />
                  gnomAD
                </Button>
                <Button size="sm" variant="outline" className="h-8 px-3 text-xs">
                  <Search className="h-3 w-3 mr-1" />
                  UCSC
                </Button>
                <Button size="sm" variant="outline" className="h-8 px-3 text-xs">
                  <Database className="h-3 w-3 mr-1" />
                  OMIM
                </Button>
              </div>
            </div>
            
          </div>
        </CardContent>
      </Card>

      {/* Nucleotide Information Card */}
      <Card className="bg-white border border-gray-200 shadow-sm">
        {hoveredNucleotide ? (
          <>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <span className="text-lg font-bold text-gray-900">{hoveredNucleotide.base}</span>
                </div>
                <div>
                  <CardTitle className="text-lg font-bold text-gray-900">
                    Position {hoveredNucleotide.id}
                  </CardTitle>
                  <CardDescription className="text-sm text-gray-600">
                    Nucleotide information
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {getOverlayValue(overlayData, hoveredNucleotide.id) !== 0 && (
                <div className="text-sm">
                  <span className="font-medium text-gray-700">
                    {overlayMode === 'clinvar' ? 'Clinical Significance:' : 
                     overlayMode === 'gnomad' ? 'Population Frequency:' : 
                     overlayMode === 'function_score' ? 'Functional Impact:' :
                     overlayMode === 'depletion_group' ? 'Depletion Category:' : 'Data Value:'}
                  </span>
                  <span className="ml-2 text-gray-900">
                    {(() => {
                      const value = getOverlayValue(overlayData, hoveredNucleotide.id);
                      if (overlayMode === 'clinvar') {
                        return value === 1 ? 'Pathogenic' : value === 0.5 ? 'Benign' : value === 0.25 ? 'VUS' : 'Unknown';
                      } else if (overlayMode === 'depletion_group') {
                        return value === 3 ? 'Strong depletion' : value === 2 ? 'Moderate depletion' : value === 1 ? 'Normal' : 'Unknown';
                      } else if (overlayMode === 'function_score') {
                        return value.toFixed(3); // Show actual continuous value
                      } else {
                        return value.toFixed(3);
                      }
                    })()}
                  </span>
                </div>
              )}
              
              {(() => {
                const variantInfo = getVariantInfoForNucleotide(hoveredNucleotide.id);
                const totalVariants = variantInfo.clinvarVariants.length + variantInfo.gnomadVariants.length;
                
                if (totalVariants === 0) {
                  return (
                    <div className="text-sm text-gray-600">
                      No known variants at this position
                    </div>
                  );
                }
                
                return (
                  <>
                    {variantInfo.clinvarVariants.length > 0 && (
                      <div className="pt-3 border-t border-gray-100">
                        <div className="font-medium text-gray-700 mb-2 text-sm">
                          Clinical Variants
                        </div>
                        {variantInfo.clinvarVariants.slice(0, 2).map((variant, index) => (
                          <div key={index} className="text-sm text-gray-600 mb-1">
                            <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                              {variant.ref}→{variant.alt}
                            </span>
                            <span className="ml-2">{variant.clinical_significance}</span>
                          </div>
                        ))}
                        {variantInfo.clinvarVariants.length > 2 && (
                          <div className="text-xs text-gray-500">...and {variantInfo.clinvarVariants.length - 2} additional clinical variants</div>
                        )}
                      </div>
                    )}
                    
                    {variantInfo.gnomadVariants.length > 0 && (
                      <div className="pt-3 border-t border-gray-100">
                        <div className="font-medium text-gray-700 mb-2 text-sm">
                          Population Data
                        </div>
                        {variantInfo.gnomadVariants.slice(0, 2).map((variant, index) => (
                          <div key={index} className="text-sm text-gray-600 mb-1">
                            <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                              {variant.ref}→{variant.alt}
                            </span>
                            <span className="ml-2">Allele count: {variant.gnomad_ac}</span>
                          </div>
                        ))}
                        {variantInfo.gnomadVariants.length > 2 && (
                          <div className="text-xs text-gray-500">...and {variantInfo.gnomadVariants.length - 2} additional population variants</div>
                        )}
                      </div>
                    )}
                  </>
                );
              })()}
            </CardContent>
          </>
        ) : (
          <>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-bold text-gray-900">
                Nucleotide Information
              </CardTitle>
              <CardDescription className="text-sm text-gray-600">
                Hover over a nucleotide in the RNA structure to view details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center text-gray-500 py-8">
                <div className="text-4xl mb-2">🧬</div>
                <div className="text-sm">Select a nucleotide to explore variant data and functional annotations</div>
              </div>
            </CardContent>
          </>
        )}
      </Card>

    </div>
  );
};

export default InfoPanel;
