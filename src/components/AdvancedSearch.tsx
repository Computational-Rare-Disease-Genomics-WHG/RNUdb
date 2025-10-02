import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Search, X, ChevronRight, Dna, AlertTriangle } from 'lucide-react';
import { searchService, type SearchResult } from '../services/search';
import type { SnRNAGene, Variant } from '../types';

interface AdvancedSearchProps {
  className?: string;
  placeholder?: string;
  onResultSelect?: (result: SearchResult) => void;
}

const AdvancedSearch: React.FC<AdvancedSearchProps> = ({
  className = '',
  placeholder = 'Search genes, variants, HGVS notation...',
  onResultSelect
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [error, setError] = useState<string | null>(null);

  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Close results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    const searchTimeout = setTimeout(() => {
      if (query.trim().length >= 2) {
        performSearch();
      } else {
        setResults([]);
        setSuggestions([]);
        setShowResults(false);
      }
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [query]);

  const performSearch = async () => {
    if (!query.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const [searchResults, searchSuggestions] = await Promise.all([
        searchService.search(query, { includeGenes: true, includeVariants: true, maxResults: 10 }),
        searchService.getSuggestions(query, 5)
      ]);

      setResults(searchResults);
      setSuggestions(searchSuggestions);
      setShowResults(true);
    } catch (err) {
      console.error('Search error:', err);
      setError('Search failed. Please try again.');
      setResults([]);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const totalItems = results.length + suggestions.length;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % totalItems);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => prev <= 0 ? totalItems - 1 : prev - 1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0) {
        if (selectedIndex < results.length) {
          handleResultSelect(results[selectedIndex]);
        } else {
          const suggestionIndex = selectedIndex - results.length;
          setQuery(suggestions[suggestionIndex]);
        }
      } else if (query.trim()) {
        // Direct navigation if no selection
        handleDirectSearch();
      }
    } else if (e.key === 'Escape') {
      setShowResults(false);
      setSelectedIndex(-1);
      inputRef.current?.blur();
    }
  };

  const handleResultSelect = (result: SearchResult) => {
    setShowResults(false);
    setSelectedIndex(-1);

    if (onResultSelect) {
      onResultSelect(result);
    } else {
      // Default navigation behavior
      if (result.type === 'gene') {
        const gene = result.item as SnRNAGene;
        navigate(`/gene/${gene.id}`);
      } else if (result.type === 'variant') {
        const variant = result.item as Variant;
        // Navigate to gene page with variant highlighted
        navigate(`/gene/${variant.geneId}?variant=${variant.id}`);
      }
    }
  };

  const handleSuggestionSelect = (suggestion: string) => {
    setQuery(suggestion);
    setShowResults(false);
    inputRef.current?.focus();
  };

  const handleDirectSearch = () => {
    // Try to find best match or navigate to search results page
    if (results.length > 0) {
      handleResultSelect(results[0]);
    } else {
      // Navigate to a search results page or show no results
      navigate(`/search?q=${encodeURIComponent(query)}`);
    }
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setSuggestions([]);
    setShowResults(false);
    setSelectedIndex(-1);
    setError(null);
    inputRef.current?.focus();
  };

  const formatResultSubtitle = (result: SearchResult): string => {
    if (result.type === 'gene') {
      const gene = result.item as SnRNAGene;
      return `${gene.chromosome}:${gene.start}-${gene.end}`;
    } else {
      const variant = result.item as Variant;
      const parts = [];
      if (variant.hgvs) parts.push(variant.hgvs);
      if (variant.clinical_significance) parts.push(variant.clinical_significance);
      return parts.join(' • ') || `${variant.ref}>${variant.alt}`;
    }
  };

  const getResultIcon = (result: SearchResult) => {
    if (result.type === 'gene') {
      return <Dna className="h-4 w-4 text-teal-600" />;
    } else {
      const variant = result.item as Variant;
      if (variant.clinical_significance === 'Pathogenic' || variant.clinvar_significance === 'Pathogenic') {
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      }
      return <div className="h-4 w-4 rounded border border-amber-400 bg-amber-100" />;
    }
  };

  return (
    <div ref={searchRef} className={`relative ${className}`} style={{ zIndex: 100 }}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (results.length > 0 || suggestions.length > 0) {
              setShowResults(true);
            }
          }}
          className={`pl-10 ${query ? 'pr-10' : ''} transition-all duration-200`}
        />
        {query && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin h-4 w-4 border-2 border-teal-600 border-t-transparent rounded-full"></div>
          </div>
        )}
      </div>

      {showResults && (results.length > 0 || suggestions.length > 0 || error) && (
        <Card className="absolute top-full left-0 right-0 z-[100] mt-2 max-h-96 overflow-y-auto shadow-2xl border-slate-300 bg-white">
          <CardContent className="p-2">
            {error && (
              <div className="px-3 py-2 text-sm text-red-600 bg-red-50 rounded-md mb-2">
                {error}
              </div>
            )}

            {results.length > 0 && (
              <div>
                <div className="px-2 py-1 text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Search Results
                </div>
                {results.map((result, index) => (
                  <button
                    key={`result-${index}`}
                    onClick={() => handleResultSelect(result)}
                    className={`w-full text-left px-3 py-2.5 rounded-md flex items-center gap-3 hover:bg-slate-50 transition-colors border border-transparent ${
                      selectedIndex === index ? 'bg-teal-50 !border-l-4 border-teal-600' : ''
                    }`}
                  >
                    {getResultIcon(result)}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate">
                        {result.type === 'gene'
                          ? (result.item as SnRNAGene).name
                          : (result.item as Variant).id
                        }
                      </div>
                      <div className="text-sm text-gray-600 truncate">
                        {formatResultSubtitle(result)}
                      </div>
                      <div className="flex gap-1 mt-1">
                        {result.matchedFields.map(field => (
                          <span
                            key={field}
                            className="px-1 py-0.5 text-xs bg-teal-100 text-teal-700 rounded"
                          >
                            {field}
                          </span>
                        ))}
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  </button>
                ))}
              </div>
            )}

            {suggestions.length > 0 && (
              <div>
                {results.length > 0 && <hr className="my-2" />}
                <div className="px-2 py-1 text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Suggestions
                </div>
                {suggestions.map((suggestion, index) => (
                  <button
                    key={`suggestion-${index}`}
                    onClick={() => handleSuggestionSelect(suggestion)}
                    className={`w-full text-left px-3 py-2 rounded-md hover:bg-slate-50 transition-colors border border-transparent ${
                      selectedIndex === results.length + index ? 'bg-teal-50 !border-l-4 border-teal-600' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Search className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-700">{suggestion}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {results.length === 0 && suggestions.length === 0 && !error && !isLoading && (
              <div className="px-3 py-4 text-center text-gray-500 text-sm">
                No results found for "{query}"
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdvancedSearch;