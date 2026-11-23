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
    <div
      id="main-content"
      tabIndex={-1}
      className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-stone-50 to-neutral-100"
    >
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
          <div className="flex flex-wrap justify-center items-center gap-2 text-sm text-slate-500">
            <span>Try:</span>
            {["RNU4-2", "RNU2-2", "RNU4atac", "RNU12"].map((gene) => (
              <button
                key={gene}
                onClick={() => handleGeneSelect(gene)}
                className="text-teal-600 hover:text-teal-700 hover:underline underline-offset-2"
              >
                {gene}
              </button>
            ))}
            <span className="text-slate-300">· {availableSnRNAs.length} genes</span>
          </div>
        </div>

        {/* Coming Soon */}
        <div className="mx-auto max-w-md mb-8">
          <div className="rounded-xl border border-slate-200 bg-white/95 px-6 py-5 shadow-sm">
            <h2 className="text-sm font-semibold tracking-wide text-slate-800">
              Coming Soon
            </h2>
            <div className="mt-1.5 h-0.5 w-8 rounded-full bg-teal-600" />

            <div className="mt-5 space-y-5 text-sm">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-teal-700">
                  December
                </p>
                <p className="mt-1 text-slate-700">RNU6-1, RNU6-2, RNU6-8, RNU6-9</p>
                <p className="text-slate-500">Retinitis pigmentosa (AD)</p>
              </div>

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-teal-700">
                  January
                </p>
                <p className="mt-1 text-slate-700">RNU5A-1, RNU5B-1</p>
                <p className="text-slate-500">NDD (AD)</p>
                <p className="mt-2 text-slate-700">RNU6ATAC</p>
                <p className="text-slate-500">
                  Multi-system disorders (AR), autoimmune diabetes (AR)
                </p>
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
