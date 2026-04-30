import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Database, Dna, Globe, Search, AlertTriangle, CheckCircle, HelpCircle } from 'lucide-react';
import type { SnRNAGene, Literature, Variant, Nucleotide, LiteratureCounts } from '@/types';

interface InfoPanelProps {
  currentData: SnRNAGene;
  paperData: Literature[];
  literatureCounts: LiteratureCounts[];
  variantData: Variant[];
  overlayMode: 'none' | 'clinvar' | 'gnomad' | 'function_score' | 'depletion_group';
  onCycleOverlay: () => void;
  hoveredNucleotide: Nucleotide | null;
}

const InfoPanel: React.FC<InfoPanelProps> = ({
  currentData,
  paperData,
  literatureCounts,
  hoveredNucleotide,
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
        // Clinical variant - convert genomic position to nucleotide (strand-aware)
        let nucleotidePos: number;
        if (currentData.strand === '-') {
          // Reverse strand: nucleotide_pos = gene_end - genomic_pos + 1
          nucleotidePos = currentData.end - variant.position + 1;
        } else {
          // Forward strand: nucleotide_pos = genomic_pos - gene_start + 1
          nucleotidePos = variant.position - currentData.start + 1;
        }
        return nucleotidePos === nucleotideId;
      }
      return false;
    });

    // Filter to only show variants with clinical significance OR population frequency data
    const filteredVariants = relevantVariants.filter(variant => 
      variant.clinical_significance || variant.gnomad_ac || variant.aou_ac || variant.ukbb_ac
    );

    // Separate by clinical vs population data
    const clinicalVariants = filteredVariants.filter(v => v.clinical_significance);
    const populationVariants = filteredVariants.filter(v =>
      !v.clinical_significance && (v.gnomad_ac || v.aou_ac || v.ukbb_ac)
    );

    return {
      clinicalVariants,
      populationVariants,
      allVariants: filteredVariants
    };
  };

  const normalizeVariantId = (id: string) => {
    // Remove 'chr' prefix for consistency
    return id.replace(/^chr/, '');
  };

  const getSignificanceIcon = (significance?: string) => {
    if (!significance) return <HelpCircle className="h-3 w-3" />;
    const lower = significance.toLowerCase();
    if (lower === 'path' || (lower.includes('pathogenic') && !lower.includes('likely'))) {
      return <AlertTriangle className="h-3 w-3" />;
    } else if (lower === 'lp' || lower.includes('likely pathogenic')) {
      return <AlertTriangle className="h-3 w-3" />;
    } else if (lower.includes('benign')) {
      return <CheckCircle className="h-3 w-3" />;
    }
    return <HelpCircle className="h-3 w-3" />;
  };

  const getSignificanceColor = (significance?: string) => {
    if (!significance) return 'bg-gray-100 text-gray-700 border-gray-200';
    const lower = significance.toLowerCase();
    if (lower === 'path' || (lower.includes('pathogenic') && !lower.includes('likely'))) {
      return 'bg-red-50 text-red-700 border-red-200';
    } else if (lower === 'lp' || lower.includes('likely pathogenic')) {
      return 'bg-orange-50 text-orange-700 border-orange-200';
    } else if (lower.includes('benign')) {
      return 'bg-green-50 text-green-700 border-green-200';
    } else if (lower === 'vus' || lower.includes('uncertain')) {
      return 'bg-amber-50 text-amber-700 border-amber-200';
    }
    return 'bg-gray-50 text-gray-700 border-gray-200';
  };

  const getLiteratureForVariant = (variantId: string) => {
    // Find literature counts for this variant
    const counts = literatureCounts.filter(lc => lc.variant_id === variantId);
    if (counts.length === 0) return [];

    // Get the literature entries for these counts
    return counts.map(count => {
      const literature = paperData.find(p => p.id === count.literature_id);
      return literature ? { ...literature, count: count.counts } : null;
    }).filter((lit): lit is Literature & { count: number } => lit !== null);
  };

  return (
    <div className="space-y-4">
      {/* Gene Information Card */}
      <Card className="bg-linear-to-br from-teal-50 to-cyan-50 border-teal-200 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-teal-600 rounded-lg shadow-sm">
                <Dna className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold text-gray-900">
                  {currentData.name}
                </CardTitle>
                <CardDescription className="text-sm text-teal-700">
                  {currentData.fullName}
                </CardDescription>
              </div>
            </div>
            <Badge className="bg-teal-100 text-teal-800 border-teal-300 px-3 py-1 text-sm font-medium">
              snRNA Gene
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-700 leading-relaxed">{currentData.description}</p>

          <div className="grid grid-cols-3 gap-3 pt-3 border-t border-teal-100">
            <div className="text-center p-2 bg-white rounded-lg border border-teal-100">
              <div className="text-xs text-teal-600 font-medium">Chromosome</div>
              <div className="text-lg font-bold text-gray-900">{currentData.chromosome}</div>
            </div>
            <div className="text-center p-2 bg-white rounded-lg border border-teal-100">
              <div className="text-xs text-teal-600 font-medium">Position</div>
              <div className="text-xs font-mono text-gray-900">
                {currentData.start.toLocaleString()}–{currentData.end.toLocaleString()}
              </div>
            </div>
            <div className="text-center p-2 bg-white rounded-lg border border-teal-100">
              <div className="text-xs text-teal-600 font-medium">Length</div>
              <div className="text-lg font-bold text-gray-900">{geneLength} bp</div>
            </div>
          </div>

          <div className="pt-3 border-t border-teal-100">
            <div className="text-sm font-medium text-gray-700 mb-2">External Resources:</div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" className="h-7 px-2 text-xs border-teal-200 hover:bg-teal-50">
                <Globe className="h-3 w-3 mr-1" />
                gnomAD
              </Button>
              <Button size="sm" variant="outline" className="h-7 px-2 text-xs border-teal-200 hover:bg-teal-50">
                <Search className="h-3 w-3 mr-1" />
                UCSC
              </Button>
              <Button size="sm" variant="outline" className="h-7 px-2 text-xs border-teal-200 hover:bg-teal-50">
                <Database className="h-3 w-3 mr-1" />
                OMIM
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Nucleotide Information Card */}
      <Card className="bg-white border border-gray-200 shadow-sm">
        {hoveredNucleotide ? (
          <>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-linear-to-br from-blue-100 to-indigo-100 rounded-lg border border-blue-200">
                  <span className="text-xl font-bold text-blue-900">{hoveredNucleotide.base}</span>
                </div>
                <div className="flex-1">
                  <CardTitle className="text-lg font-bold text-gray-900">
                    Position {hoveredNucleotide.id}
                  </CardTitle>
                  <CardDescription className="text-sm text-gray-600">
                    RNA nucleotide {hoveredNucleotide.id} • Genomic position {currentData.strand === '-' ?
                      (currentData.end - hoveredNucleotide.id + 1).toLocaleString() :
                      (currentData.start + hoveredNucleotide.id - 1).toLocaleString()}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {(() => {
                const variantInfo = getVariantInfoForNucleotide(hoveredNucleotide.id);
                const totalVariants = variantInfo.allVariants.length;

                if (totalVariants === 0) {
                  return (
                    <div className="text-center py-6 text-gray-500">
                      <div className="text-3xl mb-2">✨</div>
                      <div className="text-sm font-medium">No known variants</div>
                      <div className="text-xs text-gray-400">This position appears conserved</div>
                    </div>
                  );
                }

                return (
                  <div className="space-y-4">
                    {/* Clinical Variants */}
                    {variantInfo.clinicalVariants.length > 0 && (
                      <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          <span className="text-sm font-medium text-green-900">
                            Clinical Variants ({variantInfo.clinicalVariants.length})
                          </span>
                        </div>
                        <div className="space-y-2">
                          {variantInfo.clinicalVariants.slice(0, 3).map((variant: Variant, index: number) => {
                            const variantLiterature = getLiteratureForVariant(variant.id);
                            const linkedVariants = variant.linkedVariantIds ? 
                              variantData.filter(v => variant.linkedVariantIds!.includes(v.id)) : [];
                            
                            return (
                              <div key={index} className="p-3 bg-white rounded border border-green-100">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    {getSignificanceIcon(variant.clinical_significance)}
                                    <div className="flex flex-col">
                                      <span className="font-mono text-xs text-gray-500">{normalizeVariantId(variant.id)}</span>
                                      <span className="font-mono text-sm font-medium">
                                        {variant.ref}→{variant.alt}
                                      </span>
                                    </div>
                                    {variant.zygosity && (
                                      <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                                        {variant.zygosity}
                                      </Badge>
                                    )}
                                  </div>
                                  <Badge className={`text-xs ${getSignificanceColor(variant.clinical_significance)}`}>
                                    {variant.clinical_significance}
                                  </Badge>
                                </div>
                                
                                {/* Linked variants for compound heterozygous */}
                                {linkedVariants.length > 0 && (
                                  <div className="mb-2 p-2 bg-green-25 rounded border border-green-200">
                                    <div className="text-xs text-green-700 font-medium mb-1">Compound Heterozygous with:</div>
                                    {linkedVariants.map((linked, linkedIndex) => (
                                      <div key={linkedIndex} className="text-xs text-gray-600">
                                        <span className="font-mono">{normalizeVariantId(linked.id)}</span> ({linked.ref}→{linked.alt})
                                        {linked.clinical_significance && (
                                          <Badge className={`text-xs ml-1 ${getSignificanceColor(linked.clinical_significance)}`}>
                                            {linked.clinical_significance}
                                          </Badge>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                                
                                {/* Population frequencies for this variant */}
                                {(variant.gnomad_ac || variant.aou_ac || variant.ukbb_ac) && (
                                  <div className="flex gap-4 mt-2 pt-2 border-t border-green-50">
                                    {variant.gnomad_ac && (
                                      <div className="text-xs text-gray-600">
                                        <span className="font-medium">gnomAD AC:</span> {variant.gnomad_ac.toLocaleString()}
                                      </div>
                                    )}
                                    {variant.aou_ac && (
                                      <div className="text-xs text-gray-600">
                                        <span className="font-medium">All of Us AC:</span> {variant.aou_ac.toLocaleString()}
                                      </div>
                                    )}
                                    {variant.ukbb_ac && (
                                      <div className="text-xs text-gray-600">
                                        <span className="font-medium">UK Biobank AC:</span> {variant.ukbb_ac.toLocaleString()}
                                      </div>
                                    )}
                                  </div>
                                )}
                                
                                {/* Literature citations for this variant */}
                                {variantLiterature.length > 0 && (
                                  <div className="mt-2 pt-2 border-t border-green-50">
                                    <div className="text-xs text-green-700 font-medium mb-1">Citations:</div>
                                    <div className="space-y-1">
                                      {variantLiterature.map((lit, litIndex) => (
                                        <div key={litIndex} className="text-xs text-gray-600 bg-green-25 p-1 rounded">
                                          {lit.authors} ({lit.year}) - {lit.count} reference{lit.count !== 1 ? 's' : ''}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Population-only Variants */}
                    {variantInfo.populationVariants.length > 0 && (
                      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-4 h-3 bg-blue-500 rounded-sm"></div>
                          <span className="text-sm font-medium text-blue-900">
                            Population Variants ({variantInfo.populationVariants.length})
                          </span>
                        </div>
                        <div className="space-y-2">
                          {variantInfo.populationVariants.slice(0, 3).map((variant: Variant, index: number) => {
                            const variantLiterature = getLiteratureForVariant(variant.id);
                            
                            return (
                              <div key={index} className="p-3 bg-white rounded border border-blue-100">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <div className="flex flex-col">
                                      <span className="font-mono text-xs text-gray-500">{normalizeVariantId(variant.id)}</span>
                                      <span className="font-mono text-sm font-medium">
                                        {variant.ref}→{variant.alt}
                                      </span>
                                    </div>
                                  </div>
                                  <Badge className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                    Population
                                  </Badge>
                                </div>
                                
                                {/* Population frequencies for this variant */}
                                <div className="flex gap-4 mt-2 pt-2 border-t border-blue-50">
                                  {variant.gnomad_ac && (
                                    <div className="text-xs text-gray-600">
                                      <span className="font-medium">gnomAD AC:</span> {variant.gnomad_ac.toLocaleString()}
                                    </div>
                                  )}
                                  {variant.aou_ac && (
                                    <div className="text-xs text-gray-600">
                                      <span className="font-medium">All of Us AC:</span> {variant.aou_ac.toLocaleString()}
                                    </div>
                                  )}
                                  {variant.ukbb_ac && (
                                    <div className="text-xs text-gray-600">
                                      <span className="font-medium">UK Biobank AC:</span> {variant.ukbb_ac.toLocaleString()}
                                    </div>
                                  )}
                                </div>
                                
                                {/* Literature citations for this variant */}
                                {variantLiterature.length > 0 && (
                                  <div className="mt-2 pt-2 border-t border-blue-50">
                                    <div className="text-xs text-blue-700 font-medium mb-1">Citations:</div>
                                    <div className="space-y-1">
                                      {variantLiterature.map((lit, litIndex) => (
                                        <div key={litIndex} className="text-xs text-gray-600 bg-blue-25 p-1 rounded">
                                          {lit.authors} ({lit.year}) - {lit.count} reference{lit.count !== 1 ? 's' : ''}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
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
