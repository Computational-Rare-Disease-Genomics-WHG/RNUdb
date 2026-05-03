import { Dna } from "lucide-react";
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdvancedSearch from "../components/AdvancedSearch";
import Footer from "../components/Footer";
import Header from "../components/Header";
import { getAllSnRNAIds } from "../data/genes";
import type { SnRNAGene } from "@/types";
const Home: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
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
        console.error("Error loading snRNA IDs:", error);
        setAvailableSnRNAs(["RNU4-2"]); // Fallback
      }
    };

    loadSnRNAIds();
  }, []);
  //   if (searchTerm.trim()) {
  //     navigate(`/gene/${searchTerm}`);
  //   }
  // };
  const handleGeneSelect = (geneName: string) => {
    navigate(`/gene/${geneName}`);
  };
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-stone-50 to-neutral-100">
      <Header
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        searchResults={searchResults}
        setSearchResults={setSearchResults}
        setSelectedSnRNA={handleGeneSelect}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />

      <div className="container mx-auto px-4 py-16 flex-1">
        <div className="text-center mb-8 sm:mb-16">
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4 mb-6">
            <div className="p-3 sm:p-4 bg-teal-600 rounded-xl shadow-lg">
              <Dna className="h-8 w-8 sm:h-12 sm:w-12 text-white" />
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-teal-600 tracking-tight">
              RNUdb
            </h1>
          </div>
          <p className="text-base sm:text-lg md:text-xl text-slate-500 max-w-2xl mx-auto mb-6 sm:mb-8 px-4">
            A comprehensive database for RNA structure visualization and
            analysis. Explore RNA sequences, variants, and clinical data with
            interactive tools.
          </p>
          <div className="max-w-2xl mx-auto mb-8">
            <AdvancedSearch
              className="w-full"
              placeholder="Search genes, variants, HGVS notation, clinical significance..."
            />
          </div>
          {/* Search Examples */}
          <div className="max-w-2xl mx-auto">
            <div className="bg-white/60 backdrop-blur-sm border border-slate-200 rounded-xl p-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-center sm:text-left">
                  <p className="text-sm font-medium text-slate-700 mb-2">
                    Try searching for:
                  </p>
                  <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                    <button
                      onClick={() => handleGeneSelect("RNU4-2")}
                      className="px-3 py-1.5 bg-teal-50 text-teal-700 border border-teal-200 rounded-lg text-sm font-medium hover:bg-teal-100 transition-colors"
                    >
                      RNU4-2
                    </button>
                    <button
                      onClick={() => setSearchTerm("c.34A>G")}
                      className="px-3 py-1.5 bg-teal-50 text-teal-700 border border-teal-200 rounded-lg text-sm font-medium hover:bg-teal-100 transition-colors"
                    >
                      c.34A&gt;G
                    </button>
                  </div>
                </div>
                <div className="text-center sm:text-right border-t sm:border-t-0 sm:border-l border-slate-200 pt-4 sm:pt-0 sm:pl-4">
                  <p className="text-xs text-slate-500 mb-1">Available genes</p>
                  <p className="text-sm font-semibold text-slate-700">
                    {availableSnRNAs.join(", ")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};
export default Home;
