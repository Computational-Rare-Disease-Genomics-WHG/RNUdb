import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
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
  CheckCircle2,
  Plus,
  X,
  Sparkles,
  DnaIcon,
  ChevronRight,
  Pencil
} from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import VariantImportWizard from '../components/Curate/VariantImportWizard';
import StructureImportWizard from '../components/Curate/StructureImportWizard';
import BEDTrackImportWizard from '../components/Curate/BEDTrackImportWizard';
import LiteratureForm from '../components/Curate/LiteratureForm';
import GeneForm from '../components/Curate/GeneForm';
import VariantForm from '../components/Curate/VariantForm';
import { VariantTable } from '../components/Curate/VariantTable';
import { BEDTrackViewer } from '../components/Curate/BEDTrackViewer';
import { CuratorVariantTrack } from '../components/Curate/CuratorVariantTrack';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';

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
  const [showLiteratureForm, setShowLiteratureForm] = useState(false);
  const [showGeneForm, setShowGeneForm] = useState(false);
  const [showVariantForm, setShowVariantForm] = useState(false);
  const [editingGene, setEditingGene] = useState<any>(null);
  const [editingVariant, setEditingVariant] = useState<any>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowGeneDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const clearGeneSelection = () => {
    setSelectedGene(null);
    setGeneSearch('');
    setVariants([]);
    setLiterature([]);
    setStructures([]);
    setBedTracks([]);
  };

  const handleDeleteVariants = async () => {
    if (!selectedGene || selectedVariants.size === 0) return;
    if (!confirm(`Delete ${selectedVariants.size} selected variants? This action cannot be undone.`)) return;
    
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

  const handleCreateLiterature = async (data: any) => {
    try {
      const res = await fetch('/api/literature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (res.ok) {
        setShowLiteratureForm(false);
        if (selectedGene) {
          await loadGeneData(selectedGene.id);
        }
      } else {
        const err = await res.json();
        alert(err.detail || 'Failed to create literature');
      }
    } catch (error) {
      alert('Network error');
    }
  };

  const [editingLiterature, setEditingLiterature] = useState<any>(null);

  const handleEditLiterature = (paper: any) => {
    setEditingLiterature(paper);
    setShowLiteratureForm(true);
  };

  const handleUpdateLiterature = async (data: any) => {
    if (!editingLiterature) return;
    try {
      const res = await fetch(`/api/literature/${editingLiterature.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (res.ok) {
        setShowLiteratureForm(false);
        setEditingLiterature(null);
        if (selectedGene) {
          await loadGeneData(selectedGene.id);
        }
      } else {
        const err = await res.json();
        alert(err.detail || 'Failed to update literature');
      }
    } catch (error) {
      alert('Network error');
    }
  };

  const handleDeleteStructure = async (structureId: string) => {
    if (!selectedGene || !confirm(`Are you sure you want to delete this structure?`)) return;
    try {
      const res = await fetch(`/api/genes/${selectedGene.id}/structures/${structureId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.ok) {
        await loadGeneData(selectedGene.id);
      } else {
        const err = await res.json();
        alert(err.detail || 'Failed to delete structure');
      }
    } catch (error) {
      alert('Network error');
    }
  };

  const toggleVariantSelection = (id: string) => {
    const next = new Set(selectedVariants);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedVariants(next);
  };



  const handleEditGene = async () => {
    if (!selectedGene) return;
    try {
      const res = await fetch(`/api/genes/${selectedGene.id}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setEditingGene(data);
        setShowGeneForm(true);
      } else {
        alert('Failed to load gene details');
      }
    } catch (error) {
      alert('Network error');
    }
  };

  const handleUpdateGene = async (data: any) => {
    if (!editingGene) return;
    try {
      const res = await fetch(`/api/genes/${editingGene.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const updatedGene = await res.json();
        setSelectedGene({
          id: updatedGene.id,
          name: updatedGene.name,
          chromosome: updatedGene.chromosome,
          start: updatedGene.start,
          end: updatedGene.end,
        });
        setShowGeneForm(false);
        setEditingGene(null);
        await loadGenes();
      } else {
        const err = await res.json();
        alert(err.detail || 'Failed to update gene');
      }
    } catch (error) {
      alert('Network error');
    }
  };

  const handleCreateGene = async (data: any) => {
    try {
      const res = await fetch('/api/genes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const newGene = await res.json();
        setShowGeneForm(false);
        setEditingGene(null);
        await loadGenes();
        setSelectedGene({
          id: newGene.id,
          name: newGene.name,
          chromosome: newGene.chromosome,
          start: newGene.start,
          end: newGene.end,
        });
      } else {
        const err = await res.json();
        alert(err.detail || 'Failed to create gene');
      }
    } catch (error) {
      alert('Network error');
    }
  };

  const handleEditVariant = (variant: any) => {
    setEditingVariant(variant);
    setShowVariantForm(true);
  };

  const handleCreateVariant = async (data: any) => {
    if (!selectedGene) return;
    try {
      const res = await fetch('/api/variants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ...data, geneId: selectedGene.id }),
      });
      if (res.ok) {
        setShowVariantForm(false);
        setEditingVariant(null);
        await loadGeneData(selectedGene.id);
      } else {
        const err = await res.json();
        alert(err.detail || 'Failed to create variant');
      }
    } catch (error) {
      alert('Network error');
    }
  };

  const handleUpdateVariant = async (data: any) => {
    if (!editingVariant || !selectedGene) return;
    try {
      const res = await fetch(`/api/variants/${editingVariant.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (res.ok) {
        setShowVariantForm(false);
        setEditingVariant(null);
        await loadGeneData(selectedGene.id);
      } else {
        const err = await res.json();
        alert(err.detail || 'Failed to update variant');
      }
    } catch (error) {
      alert('Network error');
    }
  };

  const getClinicalSigColor = (sig: string) => {
    switch (sig) {
      case 'Pathogenic': return 'bg-red-100 text-red-800 border-red-200';
      case 'Likely Pathogenic': return 'bg-red-50 text-red-700 border-red-200';
      case 'VUS': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Likely Benign': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Benign': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header showSearch={false} />
        <div className="max-w-7xl mx-auto px-4 py-6 pt-12">
          <div className="space-y-4">
            <Skeleton className="h-12 w-64" />
            <Skeleton className="h-10 w-full max-w-xl" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!isCurator) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header showSearch={false} />
      
      <div className="max-w-7xl mx-auto px-4 py-6 pt-12 flex-1 w-full">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-teal-600 rounded-lg">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Curator Dashboard</h1>
          </div>
          <p className="text-slate-500 ml-12">Manage gene data, variants, structures, literature, and annotation tracks</p>
        </div>

        {/* Gene Selector */}
        <div className="mb-8 flex items-center gap-3">
          <div className="relative max-w-2xl flex-1" ref={dropdownRef}>
            <div className={`
              relative flex items-center bg-white border-2 rounded-xl transition-all duration-200
              ${showGeneDropdown ? 'border-teal-500 shadow-lg shadow-teal-500/10' : 'border-slate-200 hover:border-slate-300'}
            `}>
              <Search className="absolute left-4 h-5 w-5 text-slate-400" />
              <Input
                placeholder={selectedGene ? '' : "Search and select a gene to curate..."}
                value={selectedGene ? `${selectedGene.name}` : geneSearch}
                onChange={(e) => {
                  setGeneSearch(e.target.value);
                  setShowGeneDropdown(true);
                  if (selectedGene) setSelectedGene(null);
                }}
                onFocus={() => setShowGeneDropdown(true)}
                className="border-0 shadow-none focus-visible:ring-0 pl-12 pr-12 h-14 text-lg bg-transparent"
              />
              {selectedGene ? (
                <button
                  onClick={clearGeneSelection}
                  className="absolute right-4 p-1 rounded-full hover:bg-slate-100 transition-colors"
                >
                  <X className="h-4 w-4 text-slate-400" />
                </button>
              ) : (
                <ChevronDown className={`absolute right-4 h-5 w-5 text-slate-400 transition-transform ${showGeneDropdown ? 'rotate-180' : ''}`} />
              )}
            </div>
            
            {showGeneDropdown && (
              <div className="absolute z-40 w-full mt-2 bg-white border-2 border-slate-200 rounded-xl shadow-xl overflow-hidden">
                {filteredGenes.length === 0 ? (
                  <div className="px-6 py-8 text-center">
                    <AlertCircle className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm text-slate-500">No genes found matching "{geneSearch}"</p>
                  </div>
                ) : (
                  <div className="max-h-72 overflow-y-auto py-2">
                    <div className="px-4 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      {geneSearch ? 'Search Results' : 'All Genes'}
                    </div>
                    {filteredGenes.map(gene => (
                      <button
                        key={gene.id}
                        onClick={() => handleSelectGene(gene)}
                        className="w-full px-4 py-3 mx-2 rounded-lg text-left hover:bg-teal-50 flex items-center gap-4 transition-colors group"
                        style={{ width: 'calc(100% - 16px)' }}
                      >
                        <div className="p-2 bg-teal-100 rounded-lg group-hover:bg-teal-200 transition-colors">
                          <Dna className="h-4 w-4 text-teal-700" />
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-slate-900">{gene.name}</div>
                          <div className="text-xs text-slate-500">
                            Chromosome {gene.chromosome} • {gene.start.toLocaleString()} - {gene.end.toLocaleString()}
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-teal-600 transition-colors" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          <Button
            onClick={() => {
              setEditingGene(null);
              setShowGeneForm(true);
            }}
            className="bg-teal-600 hover:bg-teal-700 text-white h-14 px-6 rounded-xl shadow-md shadow-teal-600/20"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Gene
          </Button>
        </div>

        {!selectedGene ? (
          <Card className="border-2 border-dashed border-slate-300 bg-slate-50/50">
            <CardContent className="p-16 text-center">
              <div className="p-4 bg-white rounded-2xl shadow-sm border border-slate-200 w-fit mx-auto mb-6">
                <Dna className="h-10 w-10 text-teal-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-3">Select a Gene to Begin</h2>
              <p className="text-slate-500 max-w-md mx-auto mb-6">
                Search and select a gene above to start curating variants, RNA structures, 
                literature references, and BED annotation tracks.
              </p>
              <div className="flex items-center justify-center gap-2 text-sm text-slate-400">
                <span className="px-3 py-1 bg-white rounded-full border border-slate-200">{genes.length} genes available</span>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Gene Context Bar */}
            <div className="mb-8 bg-gradient-to-r from-teal-600 via-teal-700 to-teal-800 rounded-2xl p-6 text-white shadow-lg shadow-teal-900/20">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/20 backdrop-blur rounded-xl">
                    <Dna className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">{selectedGene.name}</h2>
                    <p className="text-teal-100 text-sm mt-1">
                      Chromosome {selectedGene.chromosome} • {selectedGene.start.toLocaleString()} - {selectedGene.end.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleEditGene}
                    className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-sm font-medium"
                  >
                    <Pencil className="h-4 w-4" />
                    Edit Gene
                  </button>
                  <button
                    onClick={clearGeneSelection}
                    className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <div className="px-4 py-2 bg-white/15 backdrop-blur rounded-lg">
                  <div className="text-2xl font-bold">{variants.length}</div>
                  <div className="text-xs text-teal-100 uppercase tracking-wider">Variants</div>
                </div>
                <div className="px-4 py-2 bg-white/15 backdrop-blur rounded-lg">
                  <div className="text-2xl font-bold">{structures.length}</div>
                  <div className="text-xs text-teal-100 uppercase tracking-wider">Structures</div>
                </div>
                <div className="px-4 py-2 bg-white/15 backdrop-blur rounded-lg">
                  <div className="text-2xl font-bold">{literature.length}</div>
                  <div className="text-xs text-teal-100 uppercase tracking-wider">Literature</div>
                </div>
                <div className="px-4 py-2 bg-white/15 backdrop-blur rounded-lg">
                  <div className="text-2xl font-bold">{bedTracks.length}</div>
                  <div className="text-xs text-teal-100 uppercase tracking-wider">BED Tracks</div>
                </div>
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-6 bg-white border-2 border-slate-200 p-1.5 rounded-xl h-auto gap-1">
                <TabsTrigger 
                  value="variants" 
                  className="px-5 py-2.5 rounded-lg data-[state=active]:bg-teal-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Variants
                  <Badge variant="secondary" className="ml-2 bg-slate-100 text-slate-600">
                    {variants.length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger 
                  value="structures"
                  className="px-5 py-2.5 rounded-lg data-[state=active]:bg-teal-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all"
                >
                  <Layers className="h-4 w-4 mr-2" />
                  Structures
                  <Badge variant="secondary" className="ml-2 bg-slate-100 text-slate-600">
                    {structures.length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger 
                  value="literature"
                  className="px-5 py-2.5 rounded-lg data-[state=active]:bg-teal-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all"
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  Literature
                  <Badge variant="secondary" className="ml-2 bg-slate-100 text-slate-600">
                    {literature.length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger 
                  value="bedtracks"
                  className="px-5 py-2.5 rounded-lg data-[state=active]:bg-teal-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all"
                >
                  <DnaIcon className="h-4 w-4 mr-2" />
                  BED Tracks
                  <Badge variant="secondary" className="ml-2 bg-slate-100 text-slate-600">
                    {bedTracks.length}
                  </Badge>
                </TabsTrigger>
              </TabsList>

              {/* Variants Tab */}
              <TabsContent value="variants" className="mt-0">
                {selectedGene && variants.length > 0 && (
                  <GnomADVariantViewer
                    variants={variants}
                    geneStart={selectedGene.start}
                    geneEnd={selectedGene.end}
                    geneName={selectedGene.name}
                  />
                )}
                <Card className="border-slate-200 shadow-sm">
                  <div className="p-6 border-b border-slate-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">Variants</h3>
                        <p className="text-sm text-slate-500 mt-0.5">
                          {selectedVariants.size > 0 ? `${selectedVariants.size} selected` : `${variants.length} total variants`}
                        </p>
                      </div>
                      <div className="flex gap-3">
                        {selectedVariants.size > 0 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleDeleteVariants}
                            className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete {selectedVariants.size}
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingVariant(null);
                            setShowVariantForm(true);
                          }}
                          className="border-teal-200 text-teal-700 hover:bg-teal-50 hover:border-teal-300"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Variant
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => setShowVariantImport(true)}
                          className="bg-teal-600 hover:bg-teal-700 text-white shadow-md shadow-teal-600/20"
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Import Variants
                        </Button>
                      </div>
                    </div>
                  </div>
                  <CardContent className="p-0">
                    {loading ? (
                      <div className="p-6 space-y-3">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Skeleton key={i} className="h-12 w-full" />
                        ))}
                      </div>
                    ) : variants.length === 0 ? (
                      <div className="text-center py-16">
                        <div className="p-4 bg-slate-50 rounded-2xl w-fit mx-auto mb-4">
                          <FileText className="h-8 w-8 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-2">No variants yet</h3>
                        <p className="text-slate-500 mb-6 max-w-sm mx-auto">
                          This gene doesn't have any variants. Import a CSV file to add variants.
                        </p>
                        <Button
                          onClick={() => setShowVariantImport(true)}
                          className="bg-teal-600 hover:bg-teal-700 text-white"
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Import Variants
                        </Button>
                      </div>
                    ) : (
                      <VariantTable
                        data={variants}
                        selectedVariants={selectedVariants}
                        onToggleVariant={toggleVariantSelection}
                        onEdit={handleEditVariant}
                        getClinicalSigColor={getClinicalSigColor}
                      />
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Structures Tab */}
              <TabsContent value="structures" className="mt-0">
                <Card className="border-slate-200 shadow-sm">
                  <div className="p-6 border-b border-slate-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">RNA Structures</h3>
                        <p className="text-sm text-slate-500 mt-0.5">{structures.length} structure(s) available</p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => setShowStructureImport(true)}
                        className="bg-teal-600 hover:bg-teal-700 text-white shadow-md shadow-teal-600/20"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Import Structure
                      </Button>
                    </div>
                  </div>
                  <CardContent className="p-6">
                    {loading ? (
                      <Skeleton className="h-32 w-full" />
                    ) : structures.length === 0 ? (
                      <div className="text-center py-16">
                        <div className="p-4 bg-slate-50 rounded-2xl w-fit mx-auto mb-4">
                          <Layers className="h-8 w-8 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-2">No structures yet</h3>
                        <p className="text-slate-500 mb-6 max-w-sm mx-auto">
                          Import a JSON structure file from the RNA Editor to visualize and store it.
                        </p>
                        <Button
                          onClick={() => setShowStructureImport(true)}
                          className="bg-teal-600 hover:bg-teal-700 text-white"
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Import Structure
                        </Button>
                      </div>
                    ) : (
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {structures.map((structure: any) => (
                          <div key={structure.id} className="p-5 bg-white border-2 border-slate-100 rounded-xl hover:border-teal-200 hover:shadow-md transition-all group relative">
                            <div className="flex items-start justify-between mb-3">
                              <div className="p-2 bg-teal-50 rounded-lg group-hover:bg-teal-100 transition-colors">
                                <Layers className="h-5 w-5 text-teal-600" />
                              </div>
                              <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                                <button
                                  onClick={() => handleDeleteStructure(structure.id)}
                                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                  title="Delete structure"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                            <h4 className="font-semibold text-slate-900 mb-1">{structure.id}</h4>
                            <div className="text-sm text-slate-500 space-y-1">
                              <p>{structure.nucleotides?.length || 0} nucleotides</p>
                              <p>{structure.basePairs?.length || 0} base pairs</p>
                              {structure.annotations?.length > 0 && (
                                <p>{structure.annotations.length} annotations</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Literature Tab */}
              <TabsContent value="literature" className="mt-0">
                <Card className="border-slate-200 shadow-sm">
                  <div className="p-6 border-b border-slate-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">Literature</h3>
                        <p className="text-sm text-slate-500 mt-0.5">{literature.length} paper(s) linked</p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => setShowLiteratureForm(true)}
                        className="bg-teal-600 hover:bg-teal-700 text-white shadow-md shadow-teal-600/20"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Literature
                      </Button>
                    </div>
                  </div>
                  <CardContent className="p-6">
                    {loading ? (
                      <div className="space-y-3">
                        {Array.from({ length: 3 }).map((_, i) => (
                          <Skeleton key={i} className="h-20 w-full" />
                        ))}
                      </div>
                    ) : literature.length === 0 ? (
                      <div className="text-center py-16">
                        <div className="p-4 bg-slate-50 rounded-2xl w-fit mx-auto mb-4">
                          <BookOpen className="h-8 w-8 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-2">No literature yet</h3>
                        <p className="text-slate-500 mb-6 max-w-sm mx-auto">
                          Add research papers and publications related to this gene.
                        </p>
                        <Button
                          onClick={() => setShowLiteratureForm(true)}
                          className="bg-teal-600 hover:bg-teal-700 text-white"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Literature
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {literature.map((paper: any) => (
                          <div key={paper.id} className="p-5 bg-white border-2 border-slate-100 rounded-xl hover:border-teal-200 hover:shadow-sm transition-all group relative">
                            <div className="flex items-start gap-4">
                              <div className="p-2 bg-amber-50 rounded-lg shrink-0">
                                <BookOpen className="h-5 w-5 text-amber-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-slate-900 mb-1">{paper.title}</h4>
                                <p className="text-sm text-slate-500 mb-2">
                                  {paper.authors} • <span className="font-medium text-slate-700">{paper.journal}</span> • {paper.year}
                                </p>
                                {paper.doi && (
                                  <a 
                                    href={`https://doi.org/${paper.doi}`} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-sm text-teal-600 hover:text-teal-700 font-medium inline-flex items-center gap-1"
                                  >
                                    DOI: {paper.doi}
                                    <ChevronRight className="h-3 w-3" />
                                  </a>
                                )}
                              </div>
                              <button
                                onClick={() => handleEditLiterature(paper)}
                                className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100 shrink-0"
                                title="Edit literature"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              {/* BED Tracks Tab */}
              <TabsContent value="bedtracks" className="mt-0">
                <Card className="border-slate-200 shadow-sm">
                  <div className="p-6 border-b border-slate-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">BED Tracks</h3>
                        <p className="text-sm text-slate-500 mt-0.5">{bedTracks.length} annotation track(s)</p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => setShowBEDImport(true)}
                        className="bg-teal-600 hover:bg-teal-700 text-white shadow-md shadow-teal-600/20"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Import BED Track
                      </Button>
                    </div>
                  </div>
                  <CardContent className="p-6">
                    {loading ? (
                      <Skeleton className="h-32 w-full" />
                    ) : bedTracks.length === 0 ? (
                      <div className="text-center py-16">
                        <div className="p-4 bg-slate-50 rounded-2xl w-fit mx-auto mb-4">
                          <DnaIcon className="h-8 w-8 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-2">No BED tracks yet</h3>
                        <p className="text-slate-500 mb-6 max-w-sm mx-auto">
                          Import BED files to add genomic annotation tracks like conservation scores or regulatory elements.
                        </p>
                        <Button
                          onClick={() => setShowBEDImport(true)}
                          className="bg-teal-600 hover:bg-teal-700 text-white"
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Import BED Track
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <BEDTrackViewer
                          tracks={bedTracks}
                          geneStart={selectedGene?.start || 0}
                          geneEnd={selectedGene?.end || 0}
                        />
                        <div className="space-y-3">
                        {bedTracks.map((track: any) => (
                          <div key={track.id} className="p-5 bg-white border-2 border-slate-100 rounded-xl hover:border-teal-200 hover:shadow-sm transition-all">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3">
                                {track.color && (
                                  <div
                                    className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                                    style={{ backgroundColor: track.color }}
                                  />
                                )}
                                <h4 className="font-semibold text-slate-900">{track.track_name}</h4>
                              </div>
                              <Badge variant="outline" className="text-xs">
                                {track.interval_end - track.interval_start} bp
                              </Badge>
                            </div>
                            <div className="text-sm text-slate-500">
                              {track.chrom}:{track.interval_start.toLocaleString()}-{track.interval_end.toLocaleString()}
                              {track.score !== null && track.score !== undefined && (
                                <span className="ml-3 px-2 py-0.5 bg-slate-100 rounded text-xs font-medium">
                                  Score: {track.score}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                        </div>
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

      {/* Literature Add/Edit Modal */}
      <Dialog open={showLiteratureForm} onOpenChange={setShowLiteratureForm}>
        <DialogContent className="sm:max-w-[600px]">
          <div className="bg-gradient-to-r from-teal-600 via-teal-700 to-teal-800 px-8 py-6 rounded-t-xl">
            <DialogTitle className="text-xl font-bold text-white">{editingLiterature ? 'Edit Literature' : 'Add Literature'}</DialogTitle>
          </div>
          <div className="px-8 pb-8 pt-4">
            <LiteratureForm
              initialData={editingLiterature}
              onSubmit={editingLiterature ? handleUpdateLiterature : handleCreateLiterature}
              onCancel={() => {
                setShowLiteratureForm(false);
                setEditingLiterature(null);
              }}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Gene Create/Edit Modal */}
      <Dialog open={showGeneForm} onOpenChange={setShowGeneForm}>
        <DialogContent className="sm:max-w-[650px]">
          <div className="bg-gradient-to-r from-teal-600 via-teal-700 to-teal-800 px-8 py-6 rounded-t-xl">
            <DialogTitle className="text-xl font-bold text-white">{editingGene ? 'Edit Gene' : 'Add New Gene'}</DialogTitle>
          </div>
          <div className="px-8 pb-8 pt-4">
            <GeneForm
              initialData={editingGene}
              onSubmit={editingGene ? handleUpdateGene : handleCreateGene}
              onCancel={() => {
                setShowGeneForm(false);
                setEditingGene(null);
              }}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Variant Create/Edit Modal */}
      <Dialog open={showVariantForm} onOpenChange={setShowVariantForm}>
        <DialogContent className="sm:max-w-[650px]">
          <div className="bg-gradient-to-r from-teal-600 via-teal-700 to-teal-800 px-8 py-6 rounded-t-xl">
            <DialogTitle className="text-xl font-bold text-white">{editingVariant ? 'Edit Variant' : 'Add Variant'}</DialogTitle>
          </div>
          <div className="px-8 pb-8 pt-4">
            <VariantForm
              geneId={selectedGene?.id}
              initialData={editingVariant}
              onSubmit={editingVariant ? handleUpdateVariant : handleCreateVariant}
              onCancel={() => {
                setShowVariantForm(false);
                setEditingVariant(null);
              }}
            />
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default Curate;
