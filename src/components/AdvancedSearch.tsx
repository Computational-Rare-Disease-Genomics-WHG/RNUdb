import { Search, X, ChevronRight, Dna } from "lucide-react";
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { searchService, type SearchResult } from "../services/search";
import type { SnRNAGene, Variant } from "../types";

interface AdvancedSearchProps {
  className?: string;
  placeholder?: string;
  onResultSelect?: (result: SearchResult) => void;
}

const AdvancedSearch: React.FC<AdvancedSearchProps> = ({
  className = "",
  placeholder = "Search genes, variants, HGVS notation...",
  onResultSelect,
}) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isFocused, setIsFocused] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowResults(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const searchTimeout = setTimeout(() => {
      if (query.trim().length >= 2) {
        performSearch();
      } else {
        setResults([]);
        setShowResults(false);
      }
    }, 200);

    return () => clearTimeout(searchTimeout);
  }, [query]);

  const performSearch = async () => {
    if (!query.trim()) return;

    setIsLoading(true);

    try {
      const searchResults = await searchService.search(query, {
        includeGenes: true,
        includeVariants: true,
        maxResults: 6,
      });
      setResults(searchResults);
      setShowResults(true);
    } catch (err) {
      console.error("Search error:", err);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(results.length, 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev <= 0 ? Math.max(results.length - 1, 0) : prev - 1,
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < results.length) {
        handleResultSelect(results[selectedIndex]);
      } else if (query.trim() && results.length > 0) {
        handleResultSelect(results[0]);
      }
    } else if (e.key === "Escape") {
      setShowResults(false);
      setSelectedIndex(-1);
    }
  };

  const handleResultSelect = (result: SearchResult) => {
    setShowResults(false);
    setSelectedIndex(-1);
    setQuery("");

    if (onResultSelect) {
      onResultSelect(result);
    } else {
      if (result.type === "gene") {
        const gene = result.item as SnRNAGene;
        navigate(`/gene/${gene.id}`);
      } else if (result.type === "variant") {
        const variant = result.item as Variant;
        navigate(`/gene/${variant.geneId}?variant=${variant.id}`);
      }
    }
  };

  const clearSearch = () => {
    setQuery("");
    setResults([]);
    setShowResults(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      <div
        className={`
        relative flex items-center bg-white rounded-2xl
        border border-slate-200 transition-all duration-200
        ${isFocused ? "border-teal-400 ring-2 ring-teal-500/10 shadow-lg shadow-teal-500/5" : "hover:border-slate-300"}
      `}
      >
        <div className="absolute left-4 text-slate-400">
          <Search className="h-5 w-5" />
        </div>

        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            setIsFocused(true);
            if (results.length > 0) setShowResults(true);
          }}
          onBlur={() => setIsFocused(false)}
          className="
            w-full pl-12 pr-12 h-14
            bg-transparent rounded-2xl
            text-slate-700 placeholder:text-slate-400
            focus:outline-none text-base
          "
        />

        {query && !isLoading && (
          <button
            onClick={clearSearch}
            className="absolute right-4 p-1 rounded-full hover:bg-slate-100 transition-colors"
          >
            <X className="h-4 w-4 text-slate-400" />
          </button>
        )}

        {isLoading && (
          <div className="absolute right-4">
            <div className="animate-spin h-5 w-5 border-2 border-teal-600 border-t-transparent rounded-full" />
          </div>
        )}
      </div>

      {showResults && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-[100] mt-3">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden">
            <div className="max-h-72 overflow-y-auto">
              {results.map((result, index) => (
                <button
                  key={`${result.type}-${result.item.id}`}
                  onClick={() => handleResultSelect(result)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`
                    w-full text-left px-4 py-3.5 flex items-center gap-3
                    transition-colors duration-100
                    ${selectedIndex === index ? "bg-teal-50" : "hover:bg-slate-50"}
                    ${index !== 0 ? "border-t border-slate-100" : ""}
                  `}
                >
                  <div
                    className={`
                    p-2 rounded-lg shrink-0
                    ${result.type === "gene" ? "bg-teal-50" : "bg-amber-50"}
                  `}
                  >
                    {result.type === "gene" ? (
                      <Dna className="h-4 w-4 text-teal-600" />
                    ) : (
                      <Search className="h-4 w-4 text-amber-600" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-slate-900 truncate">
                      {result.type === "gene"
                        ? (result.item as SnRNAGene).name
                        : (result.item as Variant).id}
                    </div>
                  </div>

                  <ChevronRight
                    className={`h-4 w-4 shrink-0 transition-colors ${selectedIndex === index ? "text-teal-500" : "text-slate-300"}`}
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedSearch;
