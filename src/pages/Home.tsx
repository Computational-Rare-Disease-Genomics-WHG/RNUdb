import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Database, Edit, Dna, AlertTriangle } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import AdvancedSearch from '../components/AdvancedSearch';
import { getAllSnRNAIds } from '../data/genes';
import type { SnRNAGene } from '@/types';
import { Button } from '@/components/ui/button';

const Home: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<SnRNAGene[] | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [availableSnRNAs, setAvailableSnRNAs] = useState<string[]>([]);
  const navigate = useNavigate();
  
  useEffect(() => {
    const loadSnRNAIds = async () => {
      try {
        const ids = await getAllSnRNAIds();
        setAvailableSnRNAs(ids);
      } catch (error) {
        console.error('Error loading snRNA IDs:', error);
        setAvailableSnRNAs(['RNU4-2']); // Fallback
      }
    };
    
    loadSnRNAIds();
  }, []);

  // No longer needed - AdvancedSearch handles this
  // const handleSearch = () => {
  //   if (searchTerm.trim()) {
  //     navigate(`/gene/${searchTerm}`);
  //   }
  // };

  const handleGeneSelect = (geneName: string) => {
    navigate(`/gene/${geneName}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-stone-50 to-neutral-100">
      <Header
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        searchResults={searchResults}
        setSearchResults={setSearchResults}
        setSelectedSnRNA={handleGeneSelect}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />
      
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center space-x-4 mb-6">
            <div className="p-4 bg-teal-600 rounded-xl shadow-lg">
              <Dna className="h-12 w-12 text-white" />
            </div>
            <h1 className="text-6xl font-bold text-teal-600 tracking-tight">
              RNU<span className="text-teal-600">db</span>
            </h1>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            A comprehensive database for RNA structure visualization and analysis.
            Explore RNA sequences, variants, and clinical data with interactive tools.
          </p>

          <div className="max-w-2xl mx-auto mb-8">
            <AdvancedSearch
              className="w-full"
              placeholder="Search genes, variants, HGVS notation, clinical significance..."
            />
          </div>

          {/* Search Examples */}
          <div className="text-center mb-8">
            <p className="text-sm text-gray-500 mb-3">Try searching for:</p>
            <div className="flex flex-wrap justify-center gap-2 max-w-2xl mx-auto">
              <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">RNU4-2</span>
              <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">c.34A&gt;G</span>
            </div>
          </div>

          <p className="text-sm text-gray-500 mb-8">
            Available genes: {availableSnRNAs.join(', ')}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-6xl mx-auto">
          <Card className="hover:shadow-lg transition-shadow border-slate-200 bg-white/95 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-6 w-6 text-teal-600" />
                Browse RNA Database
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Explore our comprehensive collection of RNA structures, variants, and annotations.
              </p>
              <div className="flex flex-wrap gap-2">
                {availableSnRNAs.map(snrnaId => (
                  <Button 
                    key={snrnaId}
                    variant="outline" 
                    onClick={() => navigate(`/gene/${snrnaId}`)}
                    className="border-teal-600 text-teal-600 hover:bg-teal-50"
                  >
                    View {snrnaId}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

         

          {/* RNA Editor Card */}
          <Card className="hover:shadow-lg transition-shadow border-slate-200 bg-white/95 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Edit className="h-6 w-6 text-teal-600" />
                RNA Editor
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Create and edit RNA structures with our interactive WYSIWYG editor.
              </p>
              <button
                onClick={() => navigate('/editor')}
                className="w-full px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
              >
                Open Editor
              </button>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default Home;