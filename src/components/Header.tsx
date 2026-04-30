import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Dna, Menu, X, Database, LogIn, LogOut, Shield, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getAllSnRNAIds, getGeneData } from '../data/genes';
import { useAuth } from '../context/AuthContext';
import type { SnRNAGene } from '@/types';

interface HeaderProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  searchResults: SnRNAGene[] | null;
  setSearchResults: (results: SnRNAGene[] | null) => void;
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
  const { user, isLoading: authLoading, isLoggedIn, isAdmin, login, logout } = useAuth();

  const handleSearch = async () => {
    if (searchTerm.trim()) {
      try {
        const geneIds = await getAllSnRNAIds();
        const results: SnRNAGene[] = [];
        
        for (const geneId of geneIds) {
          const geneData = await getGeneData(geneId);
          if (geneData) {
            if (geneData.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                geneData.fullName.toLowerCase().includes(searchTerm.toLowerCase())) {
              results.push(geneData);
            }
          }
        }
        
        setSearchResults(results);
        if (results.length > 0) {
          navigate(`/gene/${results[0].name}`);
        }
      } catch (error) {
        console.error('Error during search:', error);
        setSearchResults([]);
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
                                Chr {result.chromosome}:{result.start.toLocaleString()}-{result.end.toLocaleString()} | {(result.end - result.start + 1)} bp
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

          {/* Auth buttons */}
          <div className="flex items-center gap-3">
            {authLoading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-teal-600" />
            ) : isLoggedIn && user ? (
              <div className="flex items-center gap-3">
                {isAdmin && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/admin')}
                    className="text-teal-600"
                  >
                    <Shield className="h-4 w-4 mr-1" />
                    Admin
                  </Button>
                )}
                <div className="flex items-center gap-2">
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt={user.name} className="w-8 h-8 rounded-full" />
                  ) : (
                    <User className="h-5 w-5 text-gray-500" />
                  )}
                  <span className="text-sm font-medium text-gray-700">{user.name}</span>
                </div>
                <Button variant="outline" size="sm" onClick={logout}>
                  <LogOut className="h-4 w-4 mr-1" />
                  Sign Out
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={login}
                className="border-teal-600 text-teal-600 hover:bg-teal-50"
              >
                <LogIn className="h-4 w-4 mr-1" />
                Sign In
              </Button>
            )}
          </div>

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
