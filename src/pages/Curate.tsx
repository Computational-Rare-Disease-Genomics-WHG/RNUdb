import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Edit, Trash2, Dna, BookOpen, FileText } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import GeneForm from '../components/Curate/GeneForm';
import VariantForm from '../components/Curate/VariantForm';
import LiteratureForm from '../components/Curate/LiteratureForm';

const Curate: React.FC = () => {
  const navigate = useNavigate();
  const { isCurator, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('genes');
  const [genes, setGenes] = useState<any[]>([]);
  const [variants, setVariants] = useState<any[]>([]);
  const [literature, setLiterature] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(undefined);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (isLoading) return;
    if (!isCurator) {
      navigate('/login');
      return;
    }
    loadData();
  }, [isCurator, isLoading, navigate]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [genesRes, variantsRes, litRes] = await Promise.all([
        fetch('/api/genes', { credentials: 'include' }),
        fetch('/api/variants', { credentials: 'include' }),
        fetch('/api/literature', { credentials: 'include' }),
      ]);
      if (genesRes.ok) setGenes(await genesRes.json());
      if (variantsRes.ok) setVariants(await variantsRes.json());
      if (litRes.ok) setLiterature(await litRes.json());
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
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
        setShowForm(false);
        await loadData();
      } else {
        const err = await res.json();
        alert(err.detail || 'Failed to create gene');
      }
    } catch (error) {
      alert('Network error');
    }
  };

  const handleCreateVariant = async (data: any) => {
    try {
      const res = await fetch('/api/variants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (res.ok) {
        setShowForm(false);
        await loadData();
      } else {
        const err = await res.json();
        alert(err.detail || 'Failed to create variant');
      }
    } catch (error) {
      alert('Network error');
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
        setShowForm(false);
        await loadData();
      } else {
        const err = await res.json();
        alert(err.detail || 'Failed to create literature');
      }
    } catch (error) {
      alert('Network error');
    }
  };

  const handleDelete = async (type: string, id: string) => {
    if (!confirm(`Are you sure you want to delete this ${type}?`)) return;
    try {
      const res = await fetch(`/api/${type}/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.ok) {
        await loadData();
      } else {
        alert('Failed to delete');
      }
    } catch (error) {
      alert('Network error');
    }
  };

  const getFormComponent = () => {
    if (activeTab === 'genes') {
      return <GeneForm initialData={editingItem} onSubmit={handleCreateGene} onCancel={() => setShowForm(false)} />;
    } else if (activeTab === 'variants') {
      return <VariantForm initialData={editingItem} onSubmit={handleCreateVariant} onCancel={() => setShowForm(false)} />;
    } else {
      return <LiteratureForm initialData={editingItem} onSubmit={handleCreateLiterature} onCancel={() => setShowForm(false)} />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header showSearch={false} />
        <div className="max-w-7xl mx-auto px-4 py-8 pt-24">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4" />
            <div className="text-lg text-muted-foreground">Checking permissions...</div>
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
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-foreground">Curator Dashboard</h1>
          <Button
            onClick={() => {
              setEditingItem(null);
              setShowForm(true);
            }}
            className="bg-teal-600 hover:bg-teal-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add New
          </Button>
        </div>

        {loading && (
          <div className="space-y-4 mb-8">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-64 w-full" />
          </div>
        )}

        {showForm && (
          <Card className="mb-8 shadow-sm border-slate-200">
            <CardHeader>
              <CardTitle>
                {editingItem ? 'Edit' : 'Create'} {activeTab}
              </CardTitle>
            </CardHeader>
            <CardContent>{getFormComponent()}</CardContent>
          </Card>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="genes">
              <Dna className="h-4 w-4 mr-2" />
              Genes ({genes.length})
            </TabsTrigger>
            <TabsTrigger value="variants">
              <FileText className="h-4 w-4 mr-2" />
              Variants ({variants.length})
            </TabsTrigger>
            <TabsTrigger value="literature">
              <BookOpen className="h-4 w-4 mr-2" />
              Literature ({literature.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="genes">
            <Card className="shadow-sm border-slate-200 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Chromosome</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {genes.length === 0 && !loading && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        No genes found.
                      </TableCell>
                    </TableRow>
                  )}
                  {genes.map((gene: any) => (
                    <TableRow key={gene.id}>
                      <TableCell className="font-mono text-sm">{gene.id}</TableCell>
                      <TableCell>{gene.name}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{gene.chromosome}:{gene.start}-{gene.end}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => { setEditingItem(gene); setShowForm(true); }}>
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700" onClick={() => handleDelete('genes', gene.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="variants">
            <Card className="shadow-sm border-slate-200 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Gene</TableHead>
                    <TableHead>Change</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {variants.length === 0 && !loading && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        No variants found.
                      </TableCell>
                    </TableRow>
                  )}
                  {variants.map((variant: any) => (
                    <TableRow key={variant.id}>
                      <TableCell className="font-mono text-sm">{variant.id}</TableCell>
                      <TableCell className="text-sm">{variant.geneId}</TableCell>
                      <TableCell className="text-sm">
                        {variant.ref}→{variant.alt} at {variant.position}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => { setEditingItem(variant); setShowForm(true); }}>
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700" onClick={() => handleDelete('variants', variant.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="literature">
            <Card className="shadow-sm border-slate-200 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Year</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {literature.length === 0 && !loading && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        No literature found.
                      </TableCell>
                    </TableRow>
                  )}
                  {literature.map((lit: any) => (
                    <TableRow key={lit.id}>
                      <TableCell className="font-mono text-sm">{lit.id}</TableCell>
                      <TableCell className="text-sm">{lit.title}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{lit.year}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => { setEditingItem(lit); setShowForm(true); }}>
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700" onClick={() => handleDelete('literature', lit.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      <Footer />
    </div>
  );
};

export default Curate;
