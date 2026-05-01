import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Dna, Menu, X, Database, LogIn, LogOut, Shield, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getAllSnRNAIds, getGeneData } from '../data/genes';
import { useAuth } from '../context/AuthContext';
import type { SnRNAGene } from '@/types';

interface HeaderProps {
  searchTerm?: string;
  setSearchTerm?: (term: string) => void;
  searchResults?: SnRNAGene[] | null;
  setSearchResults?: (results: SnRNAGene[] | null) => void;
  setSelectedSnRNA?: (snRNA: string) => void;
  isMobileMenuOpen?: boolean;
  setIsMobileMenuOpen?: (open: boolean) => void;
  showSearch?: boolean;
}

const Header: React.FC<HeaderProps> = ({
  searchTerm = '',
  setSearchTerm = () => {},
  searchResults: _searchResults = null,
  setSearchResults = () => {},
  isMobileMenuOpen = false,
  setIsMobileMenuOpen = () => {},
  showSearch = true
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
                  RNUdb
                </h1>
              </div>
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-4 flex-1 mx-4">
            {isLoggedIn && user && (
              <div className="flex items-center gap-1">
                {isAdmin && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/admin')}
                    className="text-teal-600 hover:bg-teal-50"
                  >
                    <Shield className="h-4 w-4 mr-1" />
                    Admin
                  </Button>
                )}
                {(user.role === 'curator' || user.role === 'admin') && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/curate')}
                    className="text-teal-600 hover:bg-teal-50"
                  >
                    <Database className="h-4 w-4 mr-1" />
                    Curate
                  </Button>
                )}
              </div>
            )}
            {showSearch && (
              <div className="flex gap-2 flex-1 max-w-xl">
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
                  className="h-12 px-6 bg-teal-600 hover:bg-teal-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 font-medium"
                >
                  Search
                </Button>
              </div>
            )}
          </nav>

          {/* Auth buttons */}
          <div className="flex items-center gap-3">
            {authLoading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-teal-600" />
            ) : isLoggedIn && user ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Avatar size="sm">
                    {user.avatar_url && <AvatarImage src={user.avatar_url} alt={user.name} />}
                    <AvatarFallback><User className="h-4 w-4 text-muted-foreground" /></AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium text-foreground">{user.name}</span>
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
          <div className="md:hidden py-4 border-t border-slate-200">
            <nav className="flex flex-col space-y-2">
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
