import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Dna, Menu, X, Database } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { snRNAData, type SnRNAGeneData } from '../data/snRNAData';

interface HeaderProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  searchResults: SnRNAGeneData[] | null;
  setSearchResults: (results: SnRNAGeneData[] | null) => void;
  setSelectedSnRNA: (snRNA: string) => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
}

const Header: React.FC<HeaderProps> = ({
  searchTerm,
  setSearchTerm,
  searchResults,
  setSearchResults,
  isMobileMenuOpen,
  setIsMobileMenuOpen
}) => {
  const navigate = useNavigate();

  const handleSearch = () => {
    if (searchTerm.trim()) {
      const results = Object.values(snRNAData).filter(snrna =>
        snrna.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        snrna.fullName.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setSearchResults(results);
      if (results.length > 0) {
        navigate(`/gene/${results[0].name}`);
      }
    }
  };

  return (
    <header className="bg-white/95 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-50 shadow-lg shadow-slate-200/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center space-x-4">
            <Link to="/" className="flex items-center space-x-2">
              <div className="p-3 bg-teal-600 rounded-xl shadow-lg">
                <Dna className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-teal-600 tracking-tight">
                  RNU<span className="text-teal-600">db</span>
                </h1>
              </div>
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Input
                  placeholder="Search snRNA (e.g., RNU4-2, RNU1-1, RNU2-1)"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-4 h-12 border-slate-300 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 rounded-xl bg-white shadow-sm transition-all duration-200"
                />
              </div>
              <Button 
                onClick={handleSearch} 
                className="h-12 px-8 bg-teal-600 hover:bg-teal-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 font-medium"
              >
                Search
              </Button>
            </div>
            
            {searchResults && (
              <div className="mt-4">
                {searchResults.length > 0 ? (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600">Found {searchResults.length} result(s):</p>
                    {searchResults.map((result) => (
                      <Alert key={result.name} className="border-teal-200 bg-teal-50/80 rounded-xl shadow-sm">
                        <Database className="h-4 w-4 text-teal-600" />
                        <AlertDescription>
                          <div className="flex items-center justify-between">
                            <div>
                              <strong className="text-teal-800">{result.name}</strong> - {result.fullName}
                              <br />
                              <span className="text-sm text-gray-600">
                                Chr {result.chromosome}:{result.position} | {result.length}
                              </span>
                            </div>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => navigate(`/gene/${result.name}`)}
                              className="ml-4"
                            >
                              Select
                            </Button>
                          </div>
                        </AlertDescription>
                      </Alert>
                    ))}
                  </div>
                ) : (
                  <Alert className="border-yellow-200 bg-yellow-50">
                    <AlertDescription>No results found for "{searchTerm}"</AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </nav>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <nav className="flex flex-col space-y-2">
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;