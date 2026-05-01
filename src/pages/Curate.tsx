import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import {
  Dna,
  BookOpen,
  FileText,
  Layers,
  Upload,
  Trash2,
  Search,
  ChevronDown,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import VariantImportWizard from '../components/Curate/VariantImportWizard';
import StructureImportWizard from '../components/Curate/StructureImportWizard';
import BEDTrackImportWizard from '../components/Curate/BEDTrackImportWizard';

interface Gene {
  id: string;
  name: string;
  chromosome: string;
  start: number;
  end: number;
}

const Curate: React.FC = () => {
  const navigate = useNavigate();
  const { isCurator, isLoading } = useAuth();
  const [selectedGene, setSelectedGene] = useState<Gene | null>(null);
  const [genes, setGenes] = useState<Gene[]>([]);
  const [geneSearch, setGeneSearch] = useState('');
  const [showGeneDropdown, setShowGeneDropdown] = useState(false);
  const [activeTab, setActiveTab] = useState('variants');
  const [variants, setVariants] = useState<any[]>([]);
  const [literature, setLiterature] = useState<any[]>([]);
  const [structures, setStructures] = useState<any[]>([]);
  const [bedTracks, setBedTracks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedVariants, setSelectedVariants] = useState<Set<string>>(new Set());
  const [showVariantImport, setShowVariantImport] = useState(false);
  const [showStructureImport, setShowStructureImport] = useState(false);
  const [showBEDImport, setShowBEDImport] = useState(false);

  useEffect(() => {
    if (isLoading) return;
    if (!isCurator) {
      navigate('/login');
      return;
    }
    loadGenes();
  }, [isCurator, isLoading, navigate]);

  useEffect(() => {
    if (selectedGene) {
      loadGeneData(selectedGene.id);
    }
  }, [selectedGene]);

  const loadGenes = async () => {
    try {
      const res = await fetch('/api/genes', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setGenes(data);
      }
    } catch (error) {
      console.error('Error loading genes:', error);
    }
  };

  const loadGeneData = async (geneId: string) => {
    setLoading(true);
    try {
      const [variantsRes, litRes, structRes, bedRes] = await Promise.all([
        fetch(`/api/genes/${geneId}/variants`, { credentials: 'include' }),
        fetch(`/api/genes/${geneId}/literature`, { credentials: 'include' }),
        fetch(`/api/genes/${geneId}/structure`, { credentials: 'include' }).catch(() => null),
        fetch(`/api/genes/${geneId}/bed-tracks`, { credentials: 'include' }).catch(() => null),
      ]);
      if (variantsRes.ok) setVariants(await variantsRes.json());
      if (litRes.ok) setLiterature(await litRes.json());
      if (structRes?.ok) {
        const s = await structRes.json();
        setStructures(Array.isArray(s) ? s : [s]);
      } else {
        setStructures([]);
      }
      if (bedRes?.ok) setBedTracks(await bedRes.json());
      else setBedTracks([]);
    } catch (error) {
      console.error('Error loading gene data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredGenes = genes.filter(g =>
    g.name.toLowerCase().includes(geneSearch.toLowerCase()) ||
    g.id.toLowerCase().includes(geneSearch.toLowerCase())
  );

  const handleSelectGene = (gene: Gene) => {
    setSelectedGene(gene);
    setShowGeneDropdown(false);
    setGeneSearch('');
    setSelectedVariants(new Set());
  };

  const handleDeleteVariants = async () => {
    if (!selectedGene || selectedVariants.size === 0) return;
    if (!confirm(`Delete ${selectedVariants.size} variants?`)) return;
    
    try {
      const promises = Array.from(selectedVariants).map(id =>
        fetch(`/api/variants/${id}`, { method: 'DELETE', credentials: 'include' })
      );
      await Promise.all(promises);
      setSelectedVariants(new Set());
      await loadGeneData(selectedGene.id);
    } catch (error) {
      alert('Failed to delete variants');
    }
  };

  const toggleVariantSelection = (id: string) => {
    const next = new Set(selectedVariants);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedVariants(next);
  };

  const toggleAllVariants = () => {
    if (selectedVariants.size === variants.length) {
      setSelectedVariants(new Set());
    } else {
      setSelectedVariants(new Set(variants.map((v: any) => v.id)));
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header showSearch={false} />
        <div className="max-w-7xl mx-auto px-4 py-8 pt-24">
          <div className="text-center">
            <Skeleton className="h-12 w-64 mx-auto mb-4" />
            <Skeleton className="h-8 w-48 mx-auto" />
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!isCurator) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      <Header showSearch={false} />
      
      <div className="max-w-7xl mx-auto px-4 py-8 pt-24">
        {/* Gene Selector */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-4">Curator Dashboard</h1>
          
          <div className="relative max-w-xl">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search and select a gene..."
                value={selectedGene ? `${selectedGene.name} (${selectedGene.chromosome}:${selectedGene.start}-${selectedGene.end})` : geneSearch}
                onChange={(e) => {
                  setGeneSearch(e.target.value);
                  setShowGeneDropdown(true);
                  if (selectedGene) setSelectedGene(null);
                }}
                onFocus={() => setShowGeneDropdown(true)}
                className="pl-10 h-12"
              />
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
            
            {showGeneDropdown && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {filteredGenes.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-muted-foreground">No genes found</div>
                ) : (
                  filteredGenes.map(gene => (
                    <button
                      key={gene.id}
                      onClick={() => handleSelectGene(gene)}
                      className="w-full px-4 py-3 text-left hover:bg-slate-50 flex items-center gap-3"
                    >
                      <Dna className="h-4 w-4 text-teal-600" />
                      <div>
                        <div className="font-medium">{gene.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {gene.chromosome}:{gene.start.toLocaleString()}-{gene.end.toLocaleString()}
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {!selectedGene ? (
          <Card className="p-12 text-center">
            <Dna className="h-12 w-12 text-teal-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">Select a Gene</h2>
            <p className="text-muted-foreground">Search and select a gene above to start curating variants, structures, literature, and BED tracks.</p>
          </Card>
        ) : (
          <>
            {/* Gene Context Bar */}
            <div className="flex items-center gap-4 mb-6 p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="p-2 bg-teal-100 rounded-lg">
                <Dna className="h-5 w-5 text-teal-700" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">{selectedGene.name}</h2>
                <p className="text-sm text-muted-foreground">
                  {selectedGene.chromosome}:{selectedGene.start.toLocaleString()}-{selectedGene.end.toLocaleString()} | 
                  {variants.length} variants | {structures.length} structures | {literature.length} literature | {bedTracks.length} BED tracks
                </p>
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-6">
                <TabsTrigger value="variants">
                  <FileText className="h-4 w-4 mr-2" />
                  Variants ({variants.length})
                </TabsTrigger>
                <TabsTrigger value="structures">
                  <Layers className="h-4 w-4 mr-2" />
                  Structures ({structures.length})
                </TabsTrigger>
                <TabsTrigger value="literature">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Literature ({literature.length})
                </TabsTrigger>
                <TabsTrigger value="bedtracks">
                  <Dna className="h-4 w-4 mr-2" />
                  BED Tracks ({bedTracks.length})
                </TabsTrigger>
              </TabsList>

              {/* Variants Tab */}
              <TabsContent value="variants">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Variants</CardTitle>
                      <div className="flex gap-2">
                        {selectedVariants.size > 0 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleDeleteVariants}
                            className="text-red-600 border-red-200 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete {selectedVariants.size}
                          </Button>
                        )}
                        <Button
                          size="sm"
                          onClick={() => setShowVariantImport(true)}
                          className="bg-teal-600 hover:bg-teal-700 text-white"
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Import Variants
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="space-y-2">
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-8 w-full" />
                      </div>
                    ) : variants.length === 0 ? (
                      <div className="text-center py-12">
                        <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                        <p className="text-muted-foreground">No variants for this gene.</p>
                        <Button
                          variant="link"
                          onClick={() => setShowVariantImport(true)}
                          className="text-teal-600"
                        >
                          Import variants
                        </Button>
                      </div>
                    ) : (
                      <div className="border rounded-lg overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-10">
                                <Checkbox
                                  checked={selectedVariants.size === variants.length && variants.length > 0}
                                  onCheckedChange={toggleAllVariants}
                                />
                              </TableHead>
                              <TableHead>ID</TableHead>
                              <TableHead>Position</TableHead>
                              <TableHead>Change</TableHead>
                              <TableHead>Clinical Significance</TableHead>
                              <TableHead>HGVS</TableHead>
                              <TableHead>Cohort</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {variants.map((variant: any) => (
                              <TableRow key={variant.id}>
                                <TableCell>
                                  <Checkbox
                                    checked={selectedVariants.has(variant.id)}
                                    onCheckedChange={() => toggleVariantSelection(variant.id)}
                                  />
                                </TableCell>
                                <TableCell className="font-mono text-sm">{variant.id}</TableCell>
                                <TableCell>{variant.position}</TableCell>
                                <TableCell>{variant.ref}→{variant.alt}</TableCell>
                                <TableCell>
                                  {variant.clinical_significance && (
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                      variant.clinical_significance === 'Pathogenic' ? 'bg-red-100 text-red-800' :
                                      variant.clinical_significance === 'Likely Pathogenic' ? 'bg-red-50 text-red-700' :
                                      variant.clinical_significance === 'VUS' ? 'bg-amber-100 text-amber-800' :
                                      'bg-emerald-100 text-emerald-800'
                                    }`}>
                                      {variant.clinical_significance}
                                    </span>
                                  )}
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">{variant.hgvs}</TableCell>
                                <TableCell className="text-sm text-muted-foreground">{variant.cohort}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Structures Tab */}
              <TabsContent value="structures">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>RNA Structures</CardTitle>
                      <Button
                        size="sm"
                        onClick={() => setShowStructureImport(true)}
                        className="bg-teal-600 hover:bg-teal-700 text-white"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Import Structure
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <Skeleton className="h-32 w-full" />
                    ) : structures.length === 0 ? (
                      <div className="text-center py-12">
                        <Layers className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                        <p className="text-muted-foreground">No structures for this gene.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {structures.map((structure: any) => (
                          <div key={structure.id} className="p-4 border rounded-lg bg-slate-50">
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="font-semibold">{structure.id}</h3>
                              <CheckCircle2 className="h-5 w-5 text-teal-600" />
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {structure.nucleotides?.length || 0} nucleotides | 
                              {structure.basePairs?.length || 0} base pairs
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Literature Tab */}
              <TabsContent value="literature">
                <Card>
                  <CardHeader>
                    <CardTitle>Literature</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <Skeleton className="h-32 w-full" />
                    ) : literature.length === 0 ? (
                      <div className="text-center py-12">
                        <BookOpen className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                        <p className="text-muted-foreground">No literature for this gene.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {literature.map((paper: any) => (
                          <div key={paper.id} className="p-4 border rounded-lg">
                            <h3 className="font-medium text-sm mb-1">{paper.title}</h3>
                            <p className="text-xs text-muted-foreground">
                              {paper.authors} | {paper.journal} ({paper.year})
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* BED Tracks Tab */}
              <TabsContent value="bedtracks">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>BED Tracks</CardTitle>
                      <Button
                        size="sm"
                        onClick={() => setShowBEDImport(true)}
                        className="bg-teal-600 hover:bg-teal-700 text-white"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Import BED Track
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <Skeleton className="h-32 w-full" />
                    ) : bedTracks.length === 0 ? (
                      <div className="text-center py-12">
                        <Dna className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                        <p className="text-muted-foreground">No BED tracks for this gene.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {bedTracks.map((track: any) => (
                          <div key={track.id} className="p-4 border rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="font-semibold">{track.track_name}</h3>
                              {track.color && (
                                <div
                                  className="w-4 h-4 rounded-full border"
                                  style={{ backgroundColor: track.color }}
                                />
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {track.chrom}:{track.interval_start.toLocaleString()}-{track.interval_end.toLocaleString()}
                              {track.score && ` | Score: ${track.score}`}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>

      {/* Import Wizards */}
      {selectedGene && (
        <>
          <VariantImportWizard
            geneId={selectedGene.id}
            open={showVariantImport}
            onClose={() => setShowVariantImport(false)}
            onSuccess={() => loadGeneData(selectedGene.id)}
          />
          <StructureImportWizard
            geneId={selectedGene.id}
            open={showStructureImport}
            onClose={() => setShowStructureImport(false)}
            onSuccess={() => loadGeneData(selectedGene.id)}
          />
          <BEDTrackImportWizard
            geneId={selectedGene.id}
            open={showBEDImport}
            onClose={() => setShowBEDImport(false)}
            onSuccess={() => loadGeneData(selectedGene.id)}
          />
        </>
      )}

      <Footer />
    </div>
  );
};

export default Curate;
