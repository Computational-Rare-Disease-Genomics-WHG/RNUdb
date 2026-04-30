import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
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
  const [genes, setGenes] = useState([]);
  const [variants, setVariants] = useState([]);
  const [literature, setLiterature] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    // Wait for auth to finish loading before checking role
    if (isLoading) return;
    
    console.log('Curate page - isCurator:', isCurator);
    if (!isCurator) {
      navigate('/login');
      return;
    }
    loadData();
  }, [isCurator, isLoading, navigate]);

  const loadData = async () => {
    setLoading(true);
    try {
      console.log('Fetching data...');
      const [genesRes, variantsRes, litRes] = await Promise.all([
        fetch('/api/genes', { credentials: 'include' }),
        fetch('/api/variants', { credentials: 'include' }),
        fetch('/api/literature', { credentials: 'include' }),
      ]);
      console.log('Responses:', { genesRes: genesRes.status, variantsRes: variantsRes.status, litRes: litRes.status });
      if (genesRes.ok) {
        const genesData = await genesRes.json();
        console.log('Genes data:', genesData);
        setGenes(genesData);
      }
      if (variantsRes.ok) {
        const variantsData = await variantsRes.json();
        console.log('Variants data:', variantsData);
        setVariants(variantsData);
      }
      if (litRes.ok) {
        const litData = await litRes.json();
        console.log('Literature data:', litData);
        setLiterature(litData);
      }
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <div className="text-lg text-gray-600">Checking permissions...</div>
        </div>
      </div>
    );
  }

  if (!isCurator) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      <Header showSearch={false} />
      <div className="max-w-7xl mx-auto px-4 py-8 pt-24">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Curator Dashboard</h1>
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
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto mb-4"></div>
            <div className="text-gray-600">Loading data...</div>
          </div>
        )}

        {showForm && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">
              {editingItem ? 'Edit' : 'Create'} {activeTab.slice(0, -1)}
            </h2>
            {activeTab === 'genes' && (
              <GeneForm
                initialData={editingItem}
                onSubmit={handleCreateGene}
                onCancel={() => setShowForm(false)}
              />
            )}
            {activeTab === 'variants' && (
              <VariantForm
                initialData={editingItem}
                onSubmit={handleCreateVariant}
                onCancel={() => setShowForm(false)}
              />
            )}
            {activeTab === 'literature' && (
              <LiteratureForm
                initialData={editingItem}
                onSubmit={handleCreateLiterature}
                onCancel={() => setShowForm(false)}
              />
            )}
          </div>
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
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <table className="min-w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">ID</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Name</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Chromosome</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {genes.map((gene: any) => (
                    <tr key={gene.id} className="border-b border-slate-100">
                      <td className="py-3 px-4 font-mono text-sm">{gene.id}</td>
                      <td className="py-3 px-4">{gene.name}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{gene.chromosome}:{gene.start}-{gene.end}</td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => { setEditingItem(gene); setShowForm(true); }}>
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="outline" className="text-red-600" onClick={() => handleDelete('genes', gene.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="variants">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <table className="min-w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">ID</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Gene</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Change</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {variants.map((variant: any) => (
                    <tr key={variant.id} className="border-b border-slate-100">
                      <td className="py-3 px-4 font-mono text-sm">{variant.id}</td>
                      <td className="py-3 px-4 text-sm">{variant.geneId}</td>
                      <td className="py-3 px-4 text-sm">
                        {variant.ref}→{variant.alt} at {variant.position}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => { setEditingItem(variant); setShowForm(true); }}>
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="outline" className="text-red-600" onClick={() => handleDelete('variants', variant.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="literature">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <table className="min-w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">ID</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Title</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Year</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {literature.map((lit: any) => (
                    <tr key={lit.id} className="border-b border-slate-100">
                      <td className="py-3 px-4 font-mono text-sm">{lit.id}</td>
                      <td className="py-3 px-4 text-sm">{lit.title}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{lit.year}</td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => { setEditingItem(lit); setShowForm(true); }}>
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="outline" className="text-red-600" onClick={() => handleDelete('literature', lit.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      <Footer />
    </div>
  );
};

export default Curate;
