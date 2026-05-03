import React, { useState, useMemo } from 'react';
import { Database, BookOpen, ExternalLink, Search, X, ChevronDown, ChevronRight, FileText, Link as LinkIcon, Users } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Variant, Literature, LiteratureCounts } from '@/types';

interface VariantLiteratureCardProps {
  variantData: Variant[];
  paperData: Literature[];
  literatureCounts: LiteratureCounts[];
  currentGene: string;
}

type ViewMode = 'variants' | 'literature';
type ZygosityFilter = 'all' | 'het' | 'hom' | 'biallelic';

const CLINICAL_SIGS = ['All', 'Pathogenic', 'Likely Pathogenic', 'VUS', 'Likely Benign', 'Benign'];

const VariantLiteratureCard: React.FC<VariantLiteratureCardProps> = ({
  variantData,
  paperData,
  literatureCounts,
  currentGene
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('variants');
  const [searchQuery, setSearchQuery] = useState('');
  const [sigFilter, setSigFilter] = useState('All');
  const [diseaseFilter, setDiseaseFilter] = useState('All');
  const [zygosityFilter, setZygosityFilter] = useState<ZygosityFilter>('all');
  const [expandedVariant, setExpandedVariant] = useState<string | null>(null);
  const [selectedBiallelicLink, setSelectedBiallelicLink] = useState<string | null>(null);
  const [expandedPaper, setExpandedPaper] = useState<string | null>(null);

  const clinicalVariants = useMemo(() =>
    variantData.filter(variant =>
      variant.clinical_significance || variant.disease_type || variant.cohort
    ), [variantData]
  );

  const getVariantLiterature = (variantId: string) => {
    const counts = literatureCounts.filter(lc => lc.variant_id === variantId);
    return counts.map(count => {
      const paper = paperData.find(p => p.id === count.literature_id);
      return paper ? { ...paper, count: count.counts } : null;
    }).filter(Boolean);
  };

  const getLinkedVariants = (variantId: string): Variant[] => {
    const variant = variantData.find(v => v.id === variantId);
    if (!variant?.linkedVariantIds) return [];
    return variantData.filter(v => variant.linkedVariantIds!.includes(v.id));
  };

  const filteredVariants = useMemo(() => {
    let variants = clinicalVariants;

    if (selectedBiallelicLink) {
      const linkedVariant = variantData.find(v => v.id === selectedBiallelicLink);
      if (linkedVariant?.linkedVariantIds) {
        const linkedSet = new Set(linkedVariant.linkedVariantIds);
        linkedSet.add(linkedVariant.id);
        variants = variants.filter(v => linkedSet.has(v.id));
      }
    }

    return variants.filter(variant => {
      const matchesSearch = searchQuery === '' ||
        variant.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        variant.ref?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        variant.alt?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        variant.consequence?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        variant.disease_type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        getVariantLiterature(variant.id).some(p => 
          (p as any).title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (p as any).authors?.toLowerCase().includes(searchQuery.toLowerCase())
        );

      const matchesSig = sigFilter === 'All' ||
        variant.clinical_significance?.toLowerCase() === sigFilter.toLowerCase() ||
        (sigFilter === 'Pathogenic' && variant.clinical_significance?.toLowerCase().includes('pathogenic') && !variant.clinical_significance?.toLowerCase().includes('likely')) ||
        (sigFilter === 'Likely Pathogenic' && (variant.clinical_significance?.toLowerCase().includes('likely pathogenic') || variant.clinical_significance?.toLowerCase() === 'lp')) ||
        (sigFilter === 'VUS' && (variant.clinical_significance?.toLowerCase().includes('vus') || variant.clinical_significance?.toLowerCase().includes('uncertain'))) ||
        (sigFilter === 'Likely Benign' && (variant.clinical_significance?.toLowerCase().includes('likely benign') || variant.clinical_significance?.toLowerCase() === 'lb')) ||
        (sigFilter === 'Benign' && (variant.clinical_significance?.toLowerCase().includes('benign') && !variant.clinical_significance?.toLowerCase().includes('likely') || variant.clinical_significance?.toLowerCase() === 'b'));

      const matchesDisease = diseaseFilter === 'All' || variant.disease_type === diseaseFilter;

      const isBiallelic = variant.zygosity === 'hom' || (variant.linkedVariantIds && variant.linkedVariantIds.length > 0);
      const isHet = variant.zygosity === 'het';

      const matchesZygosity = zygosityFilter === 'all' ||
        (zygosityFilter === 'het' && isHet) ||
        (zygosityFilter === 'hom' && variant.zygosity === 'hom') ||
        (zygosityFilter === 'biallelic' && isBiallelic);

      return matchesSearch && matchesSig && matchesDisease && matchesZygosity;
    }).sort((a, b) => {
      if (zygosityFilter === 'biallelic') {
        const aBiallelic = a.zygosity === 'hom' || (a.linkedVariantIds?.length ?? 0) > 0 ? 1 : 0;
        const bBiallelic = b.zygosity === 'hom' || (b.linkedVariantIds?.length ?? 0) > 0 ? 1 : 0;
        return bBiallelic - aBiallelic;
      }
      if (zygosityFilter === 'hom') {
        return (b.zygosity === 'hom' ? 1 : 0) - (a.zygosity === 'hom' ? 1 : 0);
      }
      if (zygosityFilter === 'het') {
        return (b.zygosity === 'het' ? 1 : 0) - (a.zygosity === 'het' ? 1 : 0);
      }
      return 0;
    });
  }, [clinicalVariants, variantData, searchQuery, sigFilter, diseaseFilter, zygosityFilter, selectedBiallelicLink]);

  const filteredLiterature = useMemo(() => {
    const literatureWithCounts = paperData.map(paper => {
      const counts = literatureCounts.filter(lc => lc.literature_id === paper.id);
      const totalCounts = counts.reduce((sum, lc) => sum + lc.counts, 0);
      const linkedVariantIds = counts.map(lc => lc.variant_id);
      return { ...paper, totalCounts, linkedVariantIds, countDetails: counts };
    });

    return literatureWithCounts.filter(paper => {
      const matchesSearch = searchQuery === '' ||
        paper.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        paper.authors?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        paper.journal?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        paper.doi?.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesSearch;
    }).sort((a, b) => b.totalCounts - a.totalCounts);
  }, [paperData, literatureCounts, searchQuery]);

  const getClinicalBadge = (clinical: string) => {
    const lower = clinical?.toLowerCase() || '';
    if (lower.includes('pathogenic') && !lower.includes('likely')) return 'bg-red-100 text-red-800 border-red-200';
    if (lower.includes('likely pathogenic') || lower === 'lp') return 'bg-orange-100 text-orange-800 border-orange-200';
    if (lower.includes('benign') && !lower.includes('likely')) return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    if (lower.includes('likely benign') || lower === 'lb') return 'bg-green-100 text-green-800 border-green-200';
    if (lower.includes('vus') || lower.includes('uncertain')) return 'bg-amber-100 text-amber-800 border-amber-200';
    return 'bg-slate-100 text-slate-800 border-slate-200';
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSigFilter('All');
    setDiseaseFilter('All');
    setZygosityFilter('all');
    setSelectedBiallelicLink(null);
  };

  const hasActiveFilters = searchQuery !== '' || sigFilter !== 'All' || diseaseFilter !== 'All' || zygosityFilter !== 'all' || selectedBiallelicLink !== null;

  const toggleExpand = (variantId: string) => {
    setExpandedVariant(expandedVariant === variantId ? null : variantId);
  };

  const handleBiallelicLinkClick = (variantId: string) => {
    setSelectedBiallelicLink(variantId === selectedBiallelicLink ? null : variantId);
  };

  return (
    <Card className="bg-white/95 backdrop-blur-sm border border-slate-200 shadow-xl shadow-slate-200/30 rounded-2xl h-full">
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-4">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-teal-600" />
                {viewMode === 'variants' ? 'Clinical Variants & Literature' : 'Literature References'}
                <span className="text-slate-400 text-base font-normal">
                  ({viewMode === 'variants' ? filteredVariants.length : filteredLiterature.length})
                </span>
              </CardTitle>
              <CardDescription>
                {viewMode === 'variants' 
                  ? `Disease-associated variants with linked publications in ${currentGene}`
                  : `Research papers citing variants in ${currentGene}`}
              </CardDescription>
            </div>

            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
              <button
                onClick={() => { setViewMode('variants'); setSelectedBiallelicLink(null); }}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  viewMode === 'variants'
                    ? 'bg-white text-teal-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Database className="h-3 w-3 inline mr-1.5" />
                Variants
              </button>
              <button
                onClick={() => setViewMode('literature')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  viewMode === 'literature'
                    ? 'bg-white text-teal-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <BookOpen className="h-3 w-3 inline mr-1.5" />
                Literature
              </button>
            </div>
          </div>

          {selectedBiallelicLink && (
            <div className="flex items-center gap-2 p-2 bg-indigo-50 rounded-lg border border-indigo-200">
              <LinkIcon className="h-4 w-4 text-indigo-600" />
              <span className="text-sm text-indigo-700">
                Showing linked variants for: <span className="font-mono font-medium">{selectedBiallelicLink}</span>
              </span>
              <button 
                onClick={() => setSelectedBiallelicLink(null)}
                className="ml-auto text-indigo-500 hover:text-indigo-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex-1 min-w-[200px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder={viewMode === 'variants' ? "Search variants, papers..." : "Search papers, authors..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 bg-slate-50 border-slate-200 focus:bg-white focus:border-teal-500"
              />
            </div>

            {viewMode === 'variants' && (
              <>
                <Select value={sigFilter} onValueChange={setSigFilter}>
                  <SelectTrigger className="w-[160px] h-9 bg-slate-50 border-slate-200 focus:border-teal-500">
                    <SelectValue placeholder="Clinical Sig" />
                  </SelectTrigger>
                  <SelectContent>
                    {CLINICAL_SIGS.map(sig => (
                      <SelectItem key={sig} value={sig}>{sig}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={diseaseFilter} onValueChange={setDiseaseFilter}>
                  <SelectTrigger className="w-[160px] h-9 bg-slate-50 border-slate-200 focus:border-teal-500">
                    <SelectValue placeholder="Disease" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Diseases</SelectItem>
                    <SelectItem value="ReNU Syndrome">ReNU Syndrome</SelectItem>
                    <SelectItem value="Retinitis Pigmentosa">Retinitis Pigmentosa</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={zygosityFilter} onValueChange={(v) => setZygosityFilter(v as ZygosityFilter)}>
                  <SelectTrigger className="w-[140px] h-9 bg-slate-50 border-slate-200 focus:border-teal-500">
                    <SelectValue placeholder="Zygosity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="het">Heterozygous</SelectItem>
                    <SelectItem value="hom">Homozygous</SelectItem>
                    <SelectItem value="biallelic">Biallelic</SelectItem>
                  </SelectContent>
                </Select>
              </>
            )}

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-9 px-2 text-slate-500 hover:text-slate-700"
              >
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
            <span className="text-slate-400">{clinicalVariants.length} total variants</span>
            <span>·</span>
            <span>{literatureCounts.length} literature links</span>
            <span>·</span>
            <span>{paperData.length} papers</span>
          </div>

          <div className="flex items-center gap-2 text-xs font-medium text-slate-400 uppercase border-b border-slate-200 pb-2">
            <span className="w-32">HGVS</span>
            <span className="w-20">Position</span>
            <span className="w-16">Change</span>
            <span className="w-24">Classification</span>
            <span className="w-24">Disease</span>
            <span className="w-12">Zygosity</span>
            <span className="w-16">Biallelic</span>
            <span className="w-12">Papers</span>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {viewMode === 'variants' ? (
          filteredVariants.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                <FileText className="h-5 w-5 text-slate-400" />
              </div>
              <div className="text-sm font-medium">No variants found</div>
              <div className="text-xs text-slate-400">Try adjusting your filters</div>
            </div>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
              {filteredVariants.map((variant) => {
                const isExpanded = expandedVariant === variant.id;
                const variantLit = getVariantLiterature(variant.id);
                const linkedVariants = getLinkedVariants(variant.id);
                const isBiallelic = variant.zygosity === 'hom' || linkedVariants.length > 0;

                return (
                  <div key={variant.id} className="border border-slate-200 rounded-xl overflow-hidden bg-white hover:border-slate-300 transition-colors">
                    <div
                      className="flex items-center gap-3 p-4 cursor-pointer hover:bg-slate-50"
                      onClick={() => toggleExpand(variant.id)}
                    >
                      <button 
                        className="text-slate-400 hover:text-slate-600"
                        onClick={(e) => { e.stopPropagation(); toggleExpand(variant.id); }}
                      >
                        {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="w-32 text-xs font-mono text-slate-600 truncate" title={variant.hgvs || variant.id}>{variant.hgvs || variant.id}</span>
                          <span className="w-20 text-xs text-slate-500 font-mono">{variant.position?.toLocaleString()}</span>
                          <span className="w-16 text-xs font-mono text-slate-700">{variant.ref}→{variant.alt}</span>
                          <span className={`w-24 text-xs ${getClinicalBadge(variant.clinical_significance || '').replace('text-white', 'text-').replace('bg-slate-200', 'bg-slate-100 text-slate-700')}`}>
                            {variant.clinical_significance || 'Unknown'}
                          </span>
                          <span className="w-24 text-xs text-teal-700 truncate">{variant.disease_type || ''}</span>
                          <span className={`w-12 text-xs ${variant.zygosity === 'hom' ? 'text-purple-600 font-medium' : variant.zygosity === 'het' ? 'text-blue-600 font-medium' : 'text-slate-400'}`}>
                            {variant.zygosity === 'hom' ? 'Hom' : variant.zygosity === 'het' ? 'Het' : ''}
                          </span>
                          <span className="w-16">
                            {isBiallelic ? (
                              linkedVariants.length > 0 ? (
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleBiallelicLinkClick(variant.id); }}
                                  className={`text-xs font-medium hover:underline ${selectedBiallelicLink === variant.id ? 'text-indigo-700' : 'text-indigo-600'}`}
                                >
                                  {variant.zygosity === 'hom' ? 'Hom' : `${linkedVariants.length + 1} linked`}
                                </button>
                              ) : (
                                <span className="text-xs text-slate-500">Hom</span>
                              )
                            ) : <span className="text-xs text-slate-400">—</span>}
                          </span>
                          <span className={`w-12 text-xs ${variantLit.length > 0 ? 'text-blue-600 font-medium' : 'text-slate-400'}`}>
                            {variantLit.length}
                          </span>
                        </div>

                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          {variant.gnomad_ac !== undefined && variant.gnomad_ac > 0 && (
                            <span><span className="font-medium text-slate-600">gnomAD:</span> {variant.gnomad_ac.toLocaleString()}</span>
                          )}
                          {variant.aou_ac !== undefined && variant.aou_ac > 0 && (
                            <span><span className="font-medium text-slate-600">AoU:</span> {variant.aou_ac.toLocaleString()}</span>
                          )}
                          {variant.function_score !== undefined && variant.function_score !== null && (
                            <span><span className="font-medium text-slate-600">Score:</span> {variant.function_score.toFixed(3)}</span>
                          )}
                          {variant.consequence && (
                            <span className="text-slate-600">{variant.consequence}</span>
                          )}
                        </div>
                      </div>

                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-slate-400 hover:text-slate-600"
                        onClick={(e) => { e.stopPropagation(); toggleExpand(variant.id); }}
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                    </div>

                    {isExpanded && (
                      <div className="border-t border-slate-100 bg-slate-50 p-4 space-y-4">
                        {linkedVariants.length > 0 && (
                          <div>
                            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
                              Linked Variants ({linkedVariants.length})
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <button
                                onClick={() => handleBiallelicLinkClick(variant.id)}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-colors ${
                                  selectedBiallelicLink === variant.id 
                                    ? 'bg-indigo-100 border-indigo-300 text-indigo-700' 
                                    : 'bg-white border-slate-200 text-slate-700 hover:border-indigo-200'
                                }`}
                              >
                                <LinkIcon className="h-3 w-3 text-indigo-500" />
                                <span className="text-xs font-mono">{variant.id}</span>
                                <span className="text-xs text-slate-500">
                                  ({variant.ref}→{variant.alt})
                                </span>
                              </button>
                              {linkedVariants.map(linkedVariant => (
                                <button
                                  key={linkedVariant.id}
                                  onClick={() => handleBiallelicLinkClick(linkedVariant.id)}
                                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-colors ${
                                    selectedBiallelicLink === linkedVariant.id 
                                      ? 'bg-indigo-100 border-indigo-300 text-indigo-700' 
                                      : 'bg-white border-slate-200 text-slate-700 hover:border-indigo-200'
                                  }`}
                                >
                                  <LinkIcon className="h-3 w-3 text-indigo-500" />
                                  <span className="text-xs font-mono">{linkedVariant.id}</span>
                                  <span className="text-xs text-slate-500">
                                    ({linkedVariant.ref}→{linkedVariant.alt})
                                  </span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {variantLit.length > 0 ? (
                          <div>
                            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
                              Linked Literature ({variantLit.length})
                            </div>
                            <div className="space-y-2">
                              {variantLit.map((paper: any, idx: number) => (
                                <div key={idx} className="flex items-start gap-3 bg-white p-3 rounded-lg border border-slate-200">
                                  <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-medium text-slate-900 leading-snug mb-1 line-clamp-2">
                                      {paper.title}
                                    </h4>
                                    <p className="text-xs text-slate-600 mb-2">
                                      <span className="text-slate-700 font-medium">{paper.authors}</span>
                                      <span className="mx-1">·</span>
                                      <span className="italic">{paper.journal}</span>
                                      <span className="mx-1">·</span>
                                      <span>{paper.year}</span>
                                    </p>
                                    <div className="flex items-center gap-3">
                                      <Badge variant="outline" className="text-xs bg-white border-slate-300 text-slate-600 font-mono">
                                        DOI: {paper.doi}
                                      </Badge>
                                      <span className="text-xs text-slate-500 flex items-center gap-1" title="Number of individuals with this variant assessed in published studies">
                                        <Users className="h-3 w-3" />
                                        {paper.count} individual{paper.count !== 1 ? 's' : ''} assessed
                                      </span>
                                    </div>
                                  </div>
                                  <a
                                    href={`https://doi.org/${paper.doi}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="shrink-0"
                                  >
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-8 w-8 p-0 hover:bg-teal-50 hover:border-teal-300 hover:text-teal-600"
                                    >
                                      <ExternalLink className="h-4 w-4" />
                                    </Button>
                                  </a>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm text-slate-400 text-center py-4">
                            No literature linked to this variant
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )
        ) : (
          filteredLiterature.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                <BookOpen className="h-5 w-5 text-slate-400" />
              </div>
              <div className="text-sm font-medium">No papers found</div>
              <div className="text-xs text-slate-400">Try adjusting your search</div>
            </div>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
              {filteredLiterature.map((paper, idx) => {
                const isExpanded = expandedPaper === paper.id;
                return (
                  <div key={idx} className="bg-slate-50 rounded-xl border border-slate-200 hover:border-teal-200 hover:shadow-md transition-all overflow-hidden">
                    <div 
                      className="flex items-start justify-between gap-3 p-4 cursor-pointer hover:bg-slate-100/50"
                      onClick={() => setExpandedPaper(isExpanded ? null : paper.id)}
                    >
                      <div className="flex items-start gap-2">
                        <button className="text-slate-400 hover:text-slate-600 mt-0.5">
                          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </button>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-slate-900 leading-snug mb-2 line-clamp-2">
                          {paper.title}
                        </h4>
                        <p className="text-xs text-slate-600 mb-3">
                          <span className="text-slate-700 font-medium">{paper.authors}</span>
                          <span className="mx-1">·</span>
                          <span className="italic">{paper.journal}</span>
                          <span className="mx-1">·</span>
                          <span>{paper.year}</span>
                        </p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="text-xs bg-white border-slate-300 text-slate-600 font-mono">
                            DOI: {paper.doi}
                          </Badge>
                          <Badge 
                            variant="outline" 
                            className="text-xs bg-blue-50 text-blue-700 border-blue-200 cursor-pointer hover:bg-blue-100"
                            onClick={(e) => { e.stopPropagation(); setExpandedPaper(isExpanded ? null : paper.id); }}
                          >
                            <BookOpen className="h-3 w-3 mr-1" />
                            {paper.linkedVariantIds.length} variant{paper.linkedVariantIds.length !== 1 ? 's' : ''}
                          </Badge>
                          <span className="text-xs text-slate-500 flex items-center gap-1" title="Total individuals assessed across all linked variants">
                            <Users className="h-3 w-3" />
                            {paper.totalCounts} individual{paper.totalCounts !== 1 ? 's' : ''} assessed
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <a
                          href={`https://doi.org/${paper.doi}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 w-8 p-0 hover:bg-teal-50 hover:border-teal-300 hover:text-teal-600"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </a>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-slate-400 hover:text-slate-600"
                          onClick={(e) => { e.stopPropagation(); setExpandedPaper(isExpanded ? null : paper.id); }}
                        >
                          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="border-t border-slate-200 bg-white p-4">
                        <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">
                          Linked Variants ({paper.linkedVariantIds.length})
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {paper.linkedVariantIds.map((variantId: string, vIdx: number) => {
                            const variant = variantData.find(v => v.id === variantId);
                            return (
                              <div 
                                key={vIdx}
                                className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-200 text-xs"
                              >
                                <Badge variant="outline" className="font-mono text-xs bg-white border-slate-300 text-slate-700">
                                  {variantId}
                                </Badge>
                                {variant && (
                                  <span className="text-slate-600 font-mono">
                                    {variant.ref}→{variant.alt}
                                  </span>
                                )}
                                {variant?.clinical_significance && (
                                  <Badge className={`text-xs ${getClinicalBadge(variant.clinical_significance)}`}>
                                    {variant.clinical_significance}
                                  </Badge>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )
        )}
      </CardContent>
    </Card>
  );
};

export default VariantLiteratureCard;