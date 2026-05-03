import {
  Dna,
  Menu,
  X,
  Database,
  LogIn,
  LogOut,
  Shield,
  User,
  FileCode,
  Edit3,
  Stethoscope,
  BookOpen,
  Search,
} from "lucide-react";
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getAllSnRNAIds, getGeneData } from "../data/genes";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { SnRNAGene } from "@/types";

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
  searchTerm = "",
  setSearchTerm = () => {},
  searchResults: _searchResults = null,
  setSearchResults = () => {},
  isMobileMenuOpen = false,
  setIsMobileMenuOpen = () => {},
  showSearch = true,
}) => {
  const navigate = useNavigate();
  const {
    user,
    isLoading: authLoading,
    isLoggedIn,
    isAdmin,
    login,
    logout,
  } = useAuth();

  const handleSearch = async () => {
    if (searchTerm.trim()) {
      try {
        const geneIds = await getAllSnRNAIds();
        const results: SnRNAGene[] = [];

        for (const geneId of geneIds) {
          const geneData = await getGeneData(geneId);
          if (geneData) {
            if (
              geneData.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
              geneData.fullName.toLowerCase().includes(searchTerm.toLowerCase())
            ) {
              results.push(geneData);
            }
          }
        }

        setSearchResults(results);
        if (results.length > 0) {
          navigate(`/gene/${results[0].name}`);
        }
      } catch (error) {
        console.error("Error during search:", error);
        setSearchResults([]);
      }
    }
  };

  return (
    <header className="bg-white/95 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center h-16 gap-6">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="p-2 bg-teal-600 rounded-lg">
              <Dna className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-teal-600 tracking-tight hidden sm:block">
              RNUdb
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-1">
            {isLoggedIn &&
              user &&
              (user.role === "curator" || user.role === "admin") && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate("/curate")}
                    className="text-slate-600 hover:text-teal-600 hover:bg-teal-50"
                  >
                    <Database className="h-4 w-4 mr-1.5" />
                    Curate
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate("/editor")}
                    className="text-slate-600 hover:text-teal-600 hover:bg-teal-50"
                  >
                    <Edit3 className="h-4 w-4 mr-1.5" />
                    Editor
                  </Button>
                </>
              )}
            {isAdmin && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/admin")}
                className="text-slate-600 hover:text-teal-600 hover:bg-teal-50"
              >
                <Shield className="h-4 w-4 mr-1.5" />
                Admin
              </Button>
            )}
            <div className="w-px h-5 bg-slate-200 mx-1" />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/clinical-interpretation")}
              className="text-slate-600 hover:text-teal-600 hover:bg-teal-50"
            >
              <Stethoscope className="h-4 w-4 mr-1.5" />
              Clinical
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/api-docs")}
              className="text-slate-600 hover:text-teal-600 hover:bg-teal-50"
            >
              <FileCode className="h-4 w-4 mr-1.5" />
              API
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/how-to-use")}
              className="text-slate-600 hover:text-teal-600 hover:bg-teal-50"
            >
              <BookOpen className="h-4 w-4 mr-1.5" />
              Guide
            </Button>
          </nav>

          {showSearch && (
            <div className="hidden md:flex flex-1 max-w-md mx-auto">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search genes, variants..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="pl-9 h-10 border-slate-200 focus:border-teal-500 focus:ring-teal-500 rounded-lg bg-slate-50"
                />
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 ml-auto">
            {showSearch && (
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden text-slate-600"
                onClick={() => {}}
              >
                <Search className="h-5 w-5" />
              </Button>
            )}

            {authLoading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-teal-600" />
            ) : isLoggedIn && user ? (
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex items-center gap-2">
                  <Avatar size="sm">
                    {user.avatar_url && (
                      <AvatarImage src={user.avatar_url} alt={user.name} />
                    )}
                    <AvatarFallback>
                      <User className="h-4 w-4 text-muted-foreground" />
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium text-slate-700">
                    {user.name}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={logout}
                  className="text-slate-500 hover:text-slate-700"
                >
                  <LogOut className="h-4 w-4" />
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
                <span className="hidden sm:inline">Sign In</span>
              </Button>
            )}

            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden text-slate-600"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {showSearch && (
          <div className="md:hidden pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search genes, variants..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="pl-9 h-10 border-slate-200 focus:border-teal-500 rounded-lg bg-slate-50"
              />
            </div>
          </div>
        )}
      </div>

      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white">
          <div className="px-4 py-4 space-y-2">
            {isLoggedIn &&
              user &&
              (user.role === "curator" || user.role === "admin") && (
                <>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      navigate("/curate");
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full justify-start text-slate-700"
                  >
                    <Database className="h-4 w-4 mr-2" />
                    Curate
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      navigate("/editor");
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full justify-start text-slate-700"
                  >
                    <Edit3 className="h-4 w-4 mr-2" />
                    Editor
                  </Button>
                </>
              )}
            {isAdmin && (
              <Button
                variant="ghost"
                onClick={() => {
                  navigate("/admin");
                  setIsMobileMenuOpen(false);
                }}
                className="w-full justify-start text-slate-700"
              >
                <Shield className="h-4 w-4 mr-2" />
                Admin
              </Button>
            )}
            <div className="border-t border-slate-100 my-2" />
            <Button
              variant="ghost"
              onClick={() => {
                navigate("/clinical-interpretation");
                setIsMobileMenuOpen(false);
              }}
              className="w-full justify-start text-slate-700"
            >
              <Stethoscope className="h-4 w-4 mr-2" />
              Clinical Interpretation
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                navigate("/api-docs");
                setIsMobileMenuOpen(false);
              }}
              className="w-full justify-start text-slate-700"
            >
              <FileCode className="h-4 w-4 mr-2" />
              API Docs
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                navigate("/how-to-use");
                setIsMobileMenuOpen(false);
              }}
              className="w-full justify-start text-slate-700"
            >
              <BookOpen className="h-4 w-4 mr-2" />
              How to Use
            </Button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
