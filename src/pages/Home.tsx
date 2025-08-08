import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Search, Database, Edit, Dna } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { getAllSnRNAIds } from '../data/snrnas';
import type { SnRNAGeneData } from '../data/snRNAData';

const Home: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<SnRNAGeneData[] | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  
  const availableSnRNAs = getAllSnRNAIds();

  const handleSearch = () => {
    if (searchTerm.trim()) {
      navigate(`/gene/${searchTerm}`);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

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
            Explore RNA sequences, variants, and regulatory elements with interactive tools.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                type="text"
                placeholder="Search genes (e.g., RNU4-2)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={handleKeyPress}
                className="pl-10"
              />
            </div>
            <Button 
              onClick={handleSearch} 
              className="px-8 bg-teal-600 hover:bg-teal-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 font-medium"
            >
              Search
            </Button>
          </div>
          
          <p className="text-sm text-gray-500 mb-8">
            Currently available: {availableSnRNAs.join(', ')}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
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
              <Button 
                variant="outline" 
                onClick={() => navigate('/editor')}
                className="border-teal-600 text-teal-600 hover:bg-teal-50"
              >
                Open Editor
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default Home;