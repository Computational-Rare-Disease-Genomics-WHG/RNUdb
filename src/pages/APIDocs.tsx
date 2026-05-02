import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  BookOpen, 
  Code, 
  Play, 
  Copy, 
  CheckCircle2, 
  Terminal,
  Globe,
  Server,
  AlertCircle,
  Clock,
  Shield,
  Zap,
  FileCode,
  Terminal as TerminalIcon,
  Scale
} from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

interface Endpoint {
  id: string;
  category: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  description: string;
  parameters?: { name: string; type: string; required: boolean; description: string }[];
  exampleResponse?: any;
}

const ENDPOINTS: Endpoint[] = [
  {
    id: 'genes',
    category: 'Genes',
    method: 'GET',
    path: '/api/genes',
    description: 'List all snRNA genes with their genomic coordinates, names, and basic metadata. Returns an array of gene objects sorted alphabetically by gene ID. This endpoint is public and does not require authentication.',
    exampleResponse: [
      { id: 'RNU4-2', name: 'RNU4-2', chromosome: '12', start: 120291759, end: 120291903 }
    ]
  },
  {
    id: 'gene-detail',
    category: 'Genes',
    method: 'GET',
    path: '/api/genes/{geneId}',
    description: 'Get comprehensive details for a specific gene including full name, genomic coordinates, strand orientation, DNA sequence, and descriptive information about the gene function. Public endpoint.',
    parameters: [
      { name: 'geneId', type: 'string', required: true, description: 'Gene ID (e.g., RNU4-2)' }
    ],
    exampleResponse: {
      id: 'RNU4-2', name: 'RNU4-2', fullName: 'RNA, U4 small nuclear 2',
      chromosome: '12', start: 120291759, end: 120291903, strand: '-',
      sequence: 'tcagtctccgtagagactgtc...',
      description: 'U4 small nuclear RNA involved in pre-mRNA splicing'
    }
  },
  {
    id: 'gene-variants',
    category: 'Genes',
    method: 'GET',
    path: '/api/genes/{geneId}/variants',
    description: 'Retrieve all variants associated with a specific gene. Returns variant data including genomic position, nucleotide changes, clinical significance annotations, gnomAD allele counts, and functional scores. Public endpoint.',
    parameters: [
      { name: 'geneId', type: 'string', required: true, description: 'Gene ID' }
    ],
    exampleResponse: [
      { id: 'chr12-120291785-T-C', geneId: 'RNU4-2', position: 120291785, ref: 'T', alt: 'C', clinical_significance: 'Pathogenic' }
    ]
  },
  {
    id: 'gene-structure',
    category: 'Genes',
    method: 'GET',
    path: '/api/genes/{geneId}/structure',
    description: 'Get RNA secondary structure data for a gene, including nucleotide positions, base pairing information, and structural annotations. Data is returned in JSON format compatible with RNA structure visualization tools. Public endpoint.',
    parameters: [
      { name: 'geneId', type: 'string', required: true, description: 'Gene ID' }
    ],
    exampleResponse: {
      id: 'RNU4-2',
      nucleotides: [
        { id: 1, base: 'A', x: 0, y: 0 },
        { id: 2, base: 'G', x: 1, y: 0 }
      ],
      basePairs: [
        { nucleotide1: 1, nucleotide2: 144, type: 'canonical' }
      ],
      annotations: []
    }
  },
  {
    id: 'gene-bed-tracks',
    category: 'Annotation Tracks',
    method: 'GET',
    path: '/api/genes/{geneId}/bed-tracks',
    description: 'Retrieve all BED annotation tracks associated with a gene. Each track contains genomic intervals with optional score values for visualization. Commonly used for conservation scores, regulatory elements, or experimental data. Public endpoint.',
    parameters: [
      { name: 'geneId', type: 'string', required: true, description: 'Gene ID' }
    ],
    exampleResponse: [
      { id: 'track-1', geneId: 'RNU4-2', track_name: 'Conservation', chrom: '12', interval_start: 120291760, interval_end: 120291800, score: 0.85, label: 'PhastCons' }
    ]
  },
  {
    id: 'variants-list',
    category: 'Variants',
    method: 'GET',
    path: '/api/variants',
    description: 'List all variants in the database across all genes. Returns comprehensive variant information including position, reference/alternate alleles, clinical significance, gnomAD allele counts, and functional annotations. Public endpoint.',
    exampleResponse: [
      { id: 'chr12-120291785-T-C', geneId: 'RNU4-2', position: 120291785, ref: 'T', alt: 'C', clinical_significance: 'Pathogenic', gnomad_ac: 0 }
    ]
  },
  {
    id: 'variant-detail',
    category: 'Variants',
    method: 'GET',
    path: '/api/variants/{variantId}',
    description: 'Get detailed information about a specific variant including genomic coordinates, nucleotide change, HGVS notation, consequence annotation, clinical significance from ClinVar, population allele counts from gnomAD, All of Us, and UK Biobank, as well as functional scores and p-values. Public endpoint.',
    parameters: [
      { name: 'variantId', type: 'string', required: true, description: 'Variant ID (e.g., chr12-120291785-T-C)' }
    ],
    exampleResponse: {
      id: 'chr12-120291785-T-C',
      geneId: 'RNU4-2',
      position: 120291785,
      ref: 'T',
      alt: 'C',
      hgvs: 'c.85T>C',
      consequence: 'missense',
      clinical_significance: 'Pathogenic',
      gnomad_ac: 0,
      gnomad_hom: 0,
      function_score: -2.847,
      cadd_score: 28.5
    }
  },
  {
    id: 'literature-list',
    category: 'Literature',
    method: 'GET',
    path: '/api/literature',
    description: 'List all literature entries in the database. Each entry includes title, authors, journal, publication year, and DOI linking to the full paper. Literature entries are associated with variants through the literature-counts endpoint. Public endpoint.',
    exampleResponse: [
      { id: 'lit-1', title: 'Pathogenic variants in RNU4-2 cause a syndrome', authors: 'Smith et al.', journal: 'Nature Genetics', year: '2024', doi: '10.1038/s41588-024-1234-5' }
    ]
  },
  {
    id: 'literature-detail',
    category: 'Literature',
    method: 'GET',
    path: '/api/literature/{literatureId}',
    description: 'Get detailed information about a specific literature entry by its unique identifier. Public endpoint.',
    parameters: [
      { name: 'literatureId', type: 'string', required: true, description: 'Literature ID' }
    ],
    exampleResponse: {
      id: 'lit-1',
      title: 'Pathogenic variants in RNU4-2 cause a syndrome',
      authors: 'Smith J, Johnson A, Williams B et al.',
      journal: 'Nature Genetics',
      year: '2024',
      doi: '10.1038/s41588-024-1234-5'
    }
  },
  {
    id: 'literature-counts',
    category: 'Literature',
    method: 'GET',
    path: '/api/literature-counts',
    description: 'Get counts of literature links per variant. Returns variant-lit literature pairs with the number of times each literature entry is cited for that variant. Useful for understanding which variants have the most literature support. Public endpoint.',
    exampleResponse: [
      { variant_id: 'chr12-120291785-T-C', literature_id: 'lit-1', counts: 3 }
    ]
  },
  {
    id: 'bed-tracks',
    category: 'Annotation Tracks',
    method: 'GET',
    path: '/api/bed-tracks',
    description: 'List all BED annotation tracks in the database across all genes. BED tracks contain genomic intervals with optional score values, useful for visualizing conservation scores, regulatory regions, or experimental data. Public endpoint.',
    exampleResponse: [
      { id: 'track-1', geneId: 'RNU4-2', track_name: 'Conservation', chrom: '12', interval_start: 120291760, interval_end: 120291800, score: 0.85, label: 'PhastCons' }
    ]
  }
];

const methodColors: Record<string, { bg: string; text: string; border: string }> = {
  GET: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  POST: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  PUT: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  DELETE: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' }
};

const APIDocs: React.FC = () => {
  const [selectedEndpoint, setSelectedEndpoint] = useState<Endpoint>(ENDPOINTS[0]);
  const [tryItPath, setTryItPath] = useState('');
  const [tryItResult, setTryItResult] = useState<any>(null);
  const [tryItLoading, setTryItLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('endpoints');

  const getFullPath = (endpoint: Endpoint) => {
    let path = endpoint.path;
    if (tryItPath && endpoint.parameters) {
      path = endpoint.path.replace(/\{\w+\}/, tryItPath);
    }
    return path;
  };

  const handleTryIt = async () => {
    setTryItLoading(true);
    setTryItResult(null);
    try {
      const res = await fetch(getFullPath(selectedEndpoint));
      const data = await res.json();
      setTryItResult({ status: res.status, data });
    } catch (err) {
      setTryItResult({ status: 0, error: 'Network error' });
    } finally {
      setTryItLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const generateCurl = (endpoint: Endpoint) => {
    return `curl -X ${endpoint.method} "https://rnudb.rarediseasegenomics.org${getFullPath(endpoint)}"`;
  };

  const generatePython = (endpoint: Endpoint) => {
    return `import requests

response = requests.${endpoint.method.toLowerCase()}("https://rnudb.rarediseasegenomics.org${getFullPath(endpoint)}")
data = response.json()
print(data)`;
  };

  const generateJS = (endpoint: Endpoint) => {
    return `fetch("https://rnudb.rarediseasegenomics.org${getFullPath(endpoint)}")
  .then(res => res.json())
  .then(data => console.log(data));`;
  };

  const generateBash = (endpoint: Endpoint) => {
    const baseUrl = 'https://rnudb.rarediseasegenomics.org';
    return `#!/bin/bash
# RNUdb API - ${endpoint.description.substring(0, 50)}...

# Fetch ${endpoint.path}
curl -s -X ${endpoint.method} "${baseUrl}${endpoint.path}" | jq .`;
  };

const categories = [...new Set(ENDPOINTS.map(e => e.category))];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header showSearch={false} />
      
      <div className="bg-gradient-to-br from-teal-600 via-teal-700 to-teal-800 text-white">
        <div className="max-w-7xl mx-auto px-4 py-12 pt-24">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
              <Globe className="h-6 w-6" />
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-3">REST API Documentation</h1>
          <p className="text-teal-100 text-lg max-w-2xl">
            Access RNUdb data programmatically. All public endpoints are freely accessible without authentication.
          </p>
          <div className="flex items-center gap-4 mt-6">
            <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/30">
              Base URL: https://rnudb.rarediseasegenomics.org
            </Badge>
            <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/30">
              <Server className="h-3 w-3 mr-1" />
              v1.0
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 w-full flex-1">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6 bg-white border border-slate-200 p-1 rounded-xl">
            <TabsTrigger 
              value="endpoints"
              className="data-[state=active]:bg-teal-600 data-[state=active]:text-white rounded-lg px-4 py-2"
            >
              <FileCode className="h-4 w-4 mr-2" />
              Endpoints
            </TabsTrigger>
            <TabsTrigger 
              value="guides"
              className="data-[state=active]:bg-teal-600 data-[state=active]:text-white rounded-lg px-4 py-2"
            >
              <BookOpen className="h-4 w-4 mr-2" />
              Guides
            </TabsTrigger>
            <TabsTrigger 
              value="rate-limiting"
              className="data-[state=active]:bg-teal-600 data-[state=active]:text-white rounded-lg px-4 py-2"
            >
              <Clock className="h-4 w-4 mr-2" />
              Rate Limits
            </TabsTrigger>
          </TabsList>

          <TabsContent value="endpoints">
            <div className="grid lg:grid-cols-5 gap-8">
              {/* Sidebar Navigation */}
              <div className="lg:col-span-1">
                <div className="sticky top-6 space-y-6">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
                      Endpoints
                    </h2>
                    <div className="space-y-4">
                      {categories.map(category => (
                        <div key={category}>
                          <h3 className="text-sm font-medium text-slate-700 mb-2 px-2">{category}</h3>
                          <div className="space-y-0.5">
                            {ENDPOINTS.filter(e => e.category === category).map(endpoint => (
                              <button
                                key={endpoint.id}
                                onClick={() => {
                                  setSelectedEndpoint(endpoint);
                                  setTryItPath('');
                                  setTryItResult(null);
                                }}
                                className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-all ${
                                  selectedEndpoint.id === endpoint.id 
                                    ? 'bg-teal-50 text-teal-700 font-medium border-l-2 border-teal-500' 
                                    : 'text-slate-600 hover:bg-slate-100'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                    methodColors[endpoint.method].bg
                                  } ${methodColors[endpoint.method].text}`}>
                                    {endpoint.method}
                                  </span>
                                  <span className="truncate">{endpoint.path}</span>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Main Content */}
              <div className="lg:col-span-4 space-y-6">
                {/* Endpoint Header */}
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Badge className={`text-sm px-3 py-1 ${methodColors[selectedEndpoint.method].bg} ${methodColors[selectedEndpoint.method].text} ${methodColors[selectedEndpoint.method].border} border`}>
                        {selectedEndpoint.method}
                      </Badge>
                      <code className="text-xl font-mono text-slate-900">
                        {selectedEndpoint.path}
                      </code>
                    </div>
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                      <Shield className="h-3 w-3 mr-1" />
                      Public
                    </Badge>
                  </div>
                  <p className="text-slate-600 text-lg">{selectedEndpoint.description}</p>
                </div>

                {/* Try It Console */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="bg-slate-900 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-white">
                      <Terminal className="h-5 w-5 text-teal-400" />
                      <h3 className="font-semibold">API Console</h3>
                    </div>
                    <code className="text-sm text-slate-400 font-mono">
                      https://rnudb.rarediseasegenomics.org{getFullPath(selectedEndpoint)}
                    </code>
                  </div>
                  <div className="p-6">
                    {selectedEndpoint.parameters && (
                      <div className="mb-6">
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Path Parameters
                        </label>
                        {selectedEndpoint.parameters.map(param => (
                          <div key={param.name} className="mb-3">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-mono text-sm text-slate-700">{param.name}</span>
                              {param.required && (
                                <span className="text-xs text-red-500 font-medium">required</span>
                              )}
                              <span className="text-xs text-slate-400">{param.type}</span>
                            </div>
                            <Input
                              placeholder={param.description}
                              value={tryItPath}
                              onChange={(e) => setTryItPath(e.target.value)}
                              className="max-w-md bg-slate-50 border-slate-200"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                    <Button
                      onClick={handleTryIt}
                      disabled={tryItLoading}
                      className="bg-teal-600 hover:bg-teal-700 text-white"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      {tryItLoading ? 'Sending...' : 'Send Request'}
                    </Button>

                    {tryItResult && (
                      <div className="mt-6 bg-slate-950 rounded-lg overflow-hidden">
                        <div className="px-4 py-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-medium ${
                              tryItResult.status >= 200 && tryItResult.status < 300 
                                ? 'text-emerald-400' 
                                : 'text-red-400'
                            }`}>
                              Status: {tryItResult.status}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-slate-400 hover:text-white h-6 px-2"
                            onClick={() => copyToClipboard(JSON.stringify(tryItResult.data || tryItResult.error, null, 2))}
                          >
                            {copied ? <CheckCircle2 className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                          </Button>
                        </div>
                        <pre className="p-4 text-xs text-slate-300 overflow-x-auto">
                          {JSON.stringify(tryItResult.data || tryItResult.error, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>

                {/* Code Examples */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
                  <div className="px-6 py-4 border-b border-slate-100">
                    <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                      <Code className="h-5 w-5 text-teal-600" />
                      Code Examples
                    </h3>
                  </div>
                  <div className="p-6">
                    <Tabs defaultValue="curl">
                      <TabsList className="bg-slate-100 mb-4">
                        <TabsTrigger value="curl">cURL</TabsTrigger>
                        <TabsTrigger value="python">Python</TabsTrigger>
                        <TabsTrigger value="js">JavaScript</TabsTrigger>
                        <TabsTrigger value="bash">Bash</TabsTrigger>
                      </TabsList>
                      <TabsContent value="curl">
                        <div className="relative bg-slate-950 rounded-lg p-4">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="absolute top-2 right-2 text-slate-400 hover:text-white"
                            onClick={() => copyToClipboard(generateCurl(selectedEndpoint))}
                          >
                            {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          </Button>
                          <pre className="text-sm text-slate-300 overflow-x-auto font-mono">
                            {generateCurl(selectedEndpoint)}
                          </pre>
                        </div>
                      </TabsContent>
                      <TabsContent value="python">
                        <div className="relative bg-slate-950 rounded-lg p-4">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="absolute top-2 right-2 text-slate-400 hover:text-white"
                            onClick={() => copyToClipboard(generatePython(selectedEndpoint))}
                          >
                            {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          </Button>
                          <pre className="text-sm text-slate-300 overflow-x-auto font-mono">
                            {generatePython(selectedEndpoint)}
                          </pre>
                        </div>
                      </TabsContent>
                      <TabsContent value="js">
                        <div className="relative bg-slate-950 rounded-lg p-4">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="absolute top-2 right-2 text-slate-400 hover:text-white"
                            onClick={() => copyToClipboard(generateJS(selectedEndpoint))}
                          >
                            {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          </Button>
                          <pre className="text-sm text-slate-300 overflow-x-auto font-mono">
                            {generateJS(selectedEndpoint)}
                          </pre>
                        </div>
                      </TabsContent>
                      <TabsContent value="bash">
                        <div className="relative bg-slate-950 rounded-lg p-4">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="absolute top-2 right-2 text-slate-400 hover:text-white"
                            onClick={() => copyToClipboard(generateBash(selectedEndpoint))}
                          >
                            {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          </Button>
                          <pre className="text-sm text-slate-300 overflow-x-auto font-mono">
                            {generateBash(selectedEndpoint)}
                          </pre>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>
                </div>

                {/* Example Response */}
                {selectedEndpoint.exampleResponse && (
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
                    <div className="px-6 py-4 border-b border-slate-100">
                      <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-teal-600" />
                        Example Response
                      </h3>
                    </div>
                    <div className="p-6">
                      <div className="bg-slate-950 rounded-lg p-4">
                        <pre className="text-sm text-slate-300 overflow-x-auto font-mono">
                          {JSON.stringify(selectedEndpoint.exampleResponse, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="guides">
            <div className="space-y-6">
              {/* Getting Started */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-teal-600" />
                    Getting Started
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-slate-600">
                    The RNUdb REST API provides programmatic access to snRNA variant data. All public endpoints 
                    can be accessed without authentication, making it ideal for data pipelines and analysis scripts.
                  </p>
                  <div className="bg-slate-50 rounded-lg p-4">
                    <h4 className="font-semibold text-slate-800 mb-2">Quick Start - Fetch Gene Data</h4>
                    <pre className="text-sm text-slate-700 font-mono overflow-x-auto">
{`# Fetch all genes
curl "https://rnudb.rarediseasegenomics.org/api/genes"

# Fetch specific gene variants  
curl "https://rnudb.rarediseasegenomics.org/api/genes/RNU4-2/variants"

# Fetch gene structure
curl "https://rnudb.rarediseasegenomics.org/api/genes/RNU4-2/structure"`}
                    </pre>
                  </div>
                </CardContent>
              </Card>

              {/* Usage Policies */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Scale className="h-5 w-5 text-teal-600" />
                    Usage Policies & Guidelines
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                      <h4 className="font-semibold text-emerald-800 mb-2 flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" />
                        Acceptable Use
                      </h4>
                      <ul className="text-sm text-emerald-700 space-y-1">
                        <li>• Academic research and educational purposes</li>
                        <li>• Clinical variant interpretation workflows</li>
                        <li>• Population genetics studies</li>
                        <li>• Bioinformatics pipeline integration</li>
                        <li>• Data analysis and visualization projects</li>
                      </ul>
                    </div>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <h4 className="font-semibold text-red-800 mb-2 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        Prohibited Use
                      </h4>
                      <ul className="text-sm text-red-700 space-y-1">
                        <li>• Commercial redistribution of API data</li>
                        <li>• Building competing variant databases</li>
                        <li>• Automated scraping without rate limiting</li>
                        <li>• Attempts to circumvent authentication</li>
                        <li>• Data mining for training ML models without attribution</li>
                      </ul>
                    </div>
                  </div>
                  
                  <div className="bg-slate-50 rounded-lg p-4 mt-4">
                    <h4 className="font-semibold text-slate-800 mb-2">Data Attribution Requirements</h4>
                    <p className="text-sm text-slate-600 mb-2">
                      When using RNUdb data in publications, presentations, or derivative works, please cite:
                    </p>
                    <code className="text-sm bg-white px-3 py-2 rounded border border-slate-200 block">
                      RNUdb: A curated database of snRNA variants. Rare Disease Genomics Lab.
                    </code>
                  </div>

                  <div className="bg-slate-50 rounded-lg p-4">
                    <h4 className="font-semibold text-slate-800 mb-2">Disclaimer</h4>
                    <p className="text-sm text-slate-600">
                      RNUdb data is provided for research purposes only. While we strive for accuracy, 
                      variant annotations should be validated independently before clinical use. 
                      The curators of RNUdb make no warranty regarding the completeness, accuracy, or 
                      timeliness of the data. Always consult current literature and professional guidelines 
                      for clinical decisions.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Bash Scripting Guide */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TerminalIcon className="h-5 w-5 text-teal-600" />
                    Bash Scripting Guide
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-slate-600">
                    Below is a complete example bash script that fetches variant data for multiple genes 
                    and processes the results with jq.
                  </p>
                  <div className="bg-slate-950 rounded-lg p-4 overflow-x-auto">
                    <pre className="text-sm text-slate-300 font-mono">{String.raw`#!/bin/bash
# fetch_rnudb_variants.sh
# Fetch and analyze variants for multiple snRNA genes

BASE_URL="https://rnudb.arediseasegenomics.org"
GENES=(RNU4-2 RNU1-1 RNU2-1)

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    echo "jq is required but not installed. Install with: brew install jq"
    exit 1
fi

# Fetch variants for each gene
for gene in "\${GENES[@]}"; do
    echo "=== Fetching variants for \$gene ==="
    curl -s "\${BASE_URL}/api/genes/\$gene/variants" | jq '.'
    
    # Count pathogenic variants
    echo "Pathogenic count:"
    curl -s "\${BASE_URL}/api/genes/\$gene/variants" | jq '[.[] | select(.clinical_significance == "Pathogenic")] | length'
    echo ""
done`}</pre>
                  </div>
                  <p className="text-slate-600">
                    Save this script and run: <code className="bg-slate-100 px-2 py-1 rounded">chmod +x fetch_rnudb_variants.sh && ./fetch_rnudb_variants.sh RNU4-2</code>
                  </p>

                  <div className="bg-slate-950 rounded-lg p-4 overflow-x-auto mt-4">
                    <h4 className="font-semibold text-slate-300 mb-2">Batch Download Script</h4>
                    <pre className="text-sm text-slate-300 font-mono">{`#!/bin/bash
# download_all_variants.sh - Export all variants for a gene to JSON
# Useful for offline analysis or pipeline integration

GENE="\${1:-RNU4-2}"
OUTPUT_DIR="./rnudb_exports"
mkdir -p "$OUTPUT_DIR"

echo "Downloading all variants for $GENE..."
curl -s "\${BASE_URL}/api/genes/$GENE/variants" | jq . > "\${OUTPUT_DIR}/\${GENE}_variants.json"

echo "Downloading gene structure..."
curl -s "\${BASE_URL}/api/genes/$GENE/structure" | jq . > "\${OUTPUT_DIR}/\${GENE}_structure.json"

echo "Downloading BED tracks..."
curl -s "\${BASE_URL}/api/genes/$GENE/bed-tracks" | jq . > "\${OUTPUT_DIR}/\${GENE}_bedtracks.json"

echo "Downloading literature..."
curl -s "\${BASE_URL}/api/genes/$GENE/literature" | jq . > "\${OUTPUT_DIR}/\${GENE}_literature.json"

echo "Export complete: \${OUTPUT_DIR}/"
ls -la "\${OUTPUT_DIR}/\${GENE}_"*`}</pre>
                  </div>
                </CardContent>
              </Card>

              {/* Python Pipeline Guide */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Code className="h-5 w-5 text-teal-600" />
                    Python Pipeline Integration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-slate-600">
                    Integrate RNUdb data into your Python-based analysis pipelines using requests or pyfetch.
                  </p>
                  <div className="bg-slate-950 rounded-lg p-4 overflow-x-auto">
                    <pre className="text-sm text-slate-300 font-mono">{`#!/usr/bin/env python3
"""
RNUdb Python API Client for Pipeline Integration
"""
import requests
import json
from pathlib import Path
from typing import Optional

BASE_URL = "https://rnudb.arediseasegenomics.org"

class RNUdbClient:
    def __init__(self, base_url: str = BASE_URL, timeout: int = 30):
        self.base_url = base_url
        self.session = requests.Session()
        self.session.headers.update({"Accept": "application/json"})
        self.timeout = timeout
    
    def get_gene(self, gene_id: str) -> dict:
        """Fetch gene details"""
        response = self.session.get(
            f"{self.base_url}/api/genes/{gene_id}",
            timeout=self.timeout
        )
        response.raise_for_status()
        return response.json()
    
    def get_variants(self, gene_id: str) -> list:
        """Fetch all variants for a gene"""
        response = self.session.get(
            f"{self.base_url}/api/genes/{gene_id}/variants",
            timeout=self.timeout
        )
        response.raise_for_status()
        return response.json()
    
    def get_structure(self, gene_id: str) -> dict:
        """Fetch RNA secondary structure"""
        response = self.session.get(
            f"{self.base_url}/api/genes/{gene_id}/structure",
            timeout=self.timeout
        )
        response.raise_for_status()
        return response.json()
    
    def get_bed_tracks(self, gene_id: str) -> list:
        """Fetch BED annotation tracks"""
        response = self.session.get(
            f"{self.base_url}/api/genes/{gene_id}/bed-tracks",
            timeout=self.timeout
        )
        response.raise_for_status()
        return response.json()
    
    def export_variants_to_json(self, gene_id: str, output_path: Path):
        """Export variants to JSON file for pipeline processing"""
        variants = self.get_variants(gene_id)
        with open(output_path, 'w') as f:
            json.dump(variants, f, indent=2)
        print(f"Exported {len(variants)} variants to {output_path}")
        return variants
    
    def filter_variants_by_significance(self, variants: list, 
            significance: list[str]) -> list:
        """Filter variants by clinical significance"""
        return [
            v for v in variants 
            if v.get('clinical_significance') in significance
        ]

# Usage in pipeline
if __name__ == "__main__":
    client = RNUdbClient()
    
    # Fetch and process variants
    variants = client.get_variants("RNU4-2")
    
    # Filter for pathogenic variants
    pathogenic = client.filter_variants_by_significance(
        variants, 
        ["Pathogenic", "Likely Pathogenic"]
    )
    print(f"Found {len(pathogenic)} pathogenic/likely pathogenic variants")
    
    # Export to file
    client.export_variants_to_json("RNU4-2", Path("rnudb_variants.json"))`}</pre>
                  </div>

                  <div className="bg-slate-950 rounded-lg p-4 overflow-x-auto mt-4">
                    <h4 className="font-semibold text-slate-300 mb-2">Async Python Example (with httpx)</h4>
                    <pre className="text-sm text-slate-300 font-mono">{`#!/usr/bin/env python3
"""
Async RNUdb client for high-throughput pipelines
Requires: pip install httpx asyncio
"""
import asyncio
import httpx
import json
from typing import Optional

BASE_URL = "https://rnudb.arediseasegenomics.org"

class AsyncRNUdbClient:
    def __init__(self, base_url: str = BASE_URL, max_concurrent: int = 5):
        self.base_url = base_url
        self.semaphore = asyncio.Semaphore(max_concurrent)
    
    async def fetch_json(self, client: httpx.AsyncClient, path: str) -> dict:
        async with self.semaphore:
            response = await client.get(f"{self.base_url}{path}")
            response.raise_for_status()
            return response.json()
    
    async def get_gene_data(self, gene_id: str) -> dict:
        """Fetch all data for a gene concurrently"""
        async with httpx.AsyncClient(timeout=30.0) as client:
            variants, structure, bed_tracks = await asyncio.gather(
                self.fetch_json(client, f"/api/genes/{gene_id}/variants"),
                self.fetch_json(client, f"/api/genes/{gene_id}/structure"),
                self.fetch_json(client, f"/api/genes/{gene_id}/bed-tracks"),
            )
            return {
                "gene_id": gene_id,
                "variants": variants,
                "structure": structure,
                "bed_tracks": bed_tracks
            }

async def main():
    client = AsyncRNUdbClient(max_concurrent=10)
    genes = ["RNU4-2", "RNU1-1", "RNU2-1", "RNU5-1"]
    
    # Fetch all genes concurrently
    tasks = [client.get_gene_data(gene) for gene in genes]
    results = await asyncio.gather(*tasks)
    
    for result in results:
        print(f"{result['gene_id']}: {len(result['variants'])} variants")

if __name__ == "__main__":
    asyncio.run(main())`}</pre>
                  </div>
                </CardContent>
              </Card>

              {/* Data Format Guide */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-teal-600" />
                    Data Formats & Conventions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-slate-50 rounded-lg p-4">
                      <h4 className="font-semibold text-slate-800 mb-2">Variant IDs</h4>
                      <p className="text-sm text-slate-600">
                        Format: <code className="bg-white px-1 rounded">chr{"{chrom}-{pos}-{ref}>{alt}"}</code>
                        <br />Example: <code className="bg-white px-1 rounded">chr12-120291785-T-C</code>
                      </p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-4">
                      <h4 className="font-semibold text-slate-800 mb-2">Positions</h4>
                      <p className="text-sm text-slate-600">
                        Genomic positions use <strong>1-based indexing</strong> (HGVS convention).
                        Sequence coordinates match the reference genome (GRCh38).
                      </p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-4">
                      <h4 className="font-semibold text-slate-800 mb-2">Clinical Significance</h4>
                      <p className="text-sm text-slate-600">
                        Values: Pathogenic, Likely Pathogenic, VUS, Likely Benign, Benign
                        <br />Short codes: PATH, LP, VUS, LB, B
                      </p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-4">
                      <h4 className="font-semibold text-slate-800 mb-2">Score Ranges</h4>
                      <p className="text-sm text-slate-600">
                        CADD scores: 1-100 (higher = more deleterious)
                        <br />Function scores: varies (negative = deleterious)
                        <br />gnomAD AC: allele count (integer)
                      </p>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-lg p-4 mt-4">
                    <h4 className="font-semibold text-slate-800 mb-2">BED Track Format</h4>
                    <p className="text-sm text-slate-600 mb-2">
                      BED tracks are stored with the following columns:
                    </p>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-200">
                          <th className="text-left py-2 px-2 font-semibold">Column</th>
                          <th className="text-left py-2 px-2 font-semibold">Type</th>
                          <th className="text-left py-2 px-2 font-semibold">Description</th>
                        </tr>
                      </thead>
                      <tbody className="text-slate-600">
                        <tr className="border-b border-slate-100">
                          <td className="py-2 px-2 font-mono">chrom</td>
                          <td className="py-2 px-2">string</td>
                          <td className="py-2 px-2">Chromosome identifier (e.g., "12" or "chr12")</td>
                        </tr>
                        <tr className="border-b border-slate-100">
                          <td className="py-2 px-2 font-mono">chromStart</td>
                          <td className="py-2 px-2">integer</td>
                          <td className="py-2 px-2">Start position (0-based in standard BED, RNUdb uses 1-based)</td>
                        </tr>
                        <tr className="border-b border-slate-100">
                          <td className="py-2 px-2 font-mono">chromEnd</td>
                          <td className="py-2 px-2">integer</td>
                          <td className="py-2 px-2">End position (exclusive)</td>
                        </tr>
                        <tr className="border-b border-slate-100">
                          <td className="py-2 px-2 font-mono">name</td>
                          <td className="py-2 px-2">string</td>
                          <td className="py-2 px-2">Optional label for the interval</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-2 font-mono">score</td>
                          <td className="py-2 px-2">float</td>
                          <td className="py-2 px-2">Optional score value (0-1000 in standard, any float accepted)</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* R Integration Guide */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Code className="h-5 w-5 text-teal-600" />
                    R Integration Example
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-slate-950 rounded-lg p-4 overflow-x-auto">
                    <pre className="text-sm text-slate-300 font-mono">{`# RNUdb API integration in R
# Requires: install.packages("httr"), install.packages("jsonlite")

library(httr)
library(jsonlite)

BASE_URL <- "https://rnudb.arediseasegenomics.org"

#' Fetch variants for a gene
#' @param gene_id Gene identifier (e.g., "RNU4-2")
#' @return Data frame of variants
get_variants <- function(gene_id) {
  url <- paste0(BASE_URL, "/api/genes/", gene_id, "/variants")
  response <- GET(url)
  stop_for_status(response)
  content <- fromJSON(content(response, "text", encoding = "UTF-8"))
  as.data.frame(content)
}

#' Fetch gene metadata
#' @param gene_id Gene identifier
#' @return List of gene information
get_gene <- function(gene_id) {
  url <- paste0(BASE_URL, "/api/genes/", gene_id)
  response <- GET(url)
  stop_for_status(response)
  fromJSON(content(response, "text", encoding = "UTF-8"))
}

# Example usage
variants <- get_variants("RNU4-2")
pathogenic <- variants[variants$clinical_significance %in% c("Pathogenic", "Likely Pathogenic"), ]
print(paste("Found", nrow(pathogenic), "pathogenic variants"))`}</pre>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="rate-limiting">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-teal-600" />
                    Rate Limiting Policy
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <p className="text-amber-800 font-medium">
                      Rate limiting is not yet implemented, but guidelines are provided for responsible usage.
                    </p>
                  </div>
                  <h4 className="font-semibold text-slate-800">Expected Rate Limits (Future Implementation)</h4>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="bg-slate-50 rounded-lg p-4">
                      <h5 className="font-semibold text-slate-700">Public Endpoints</h5>
                      <p className="text-2xl font-bold text-teal-600">100</p>
                      <p className="text-sm text-slate-500">requests per minute</p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-4">
                      <h5 className="font-semibold text-slate-700">Bulk Downloads</h5>
                      <p className="text-2xl font-bold text-teal-600">10</p>
                      <p className="text-sm text-slate-500">requests per minute</p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-4">
                      <h5 className="font-semibold text-slate-700">Burst Allowance</h5>
                      <p className="text-2xl font-bold text-teal-600">20</p>
                      <p className="text-sm text-slate-500">requests in 1 second</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Best Practices for API Usage</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-slate-950 rounded-lg p-4">
                    <pre className="text-sm text-slate-300 font-mono">{`# Good practices for pipeline integration

# 1. Cache responses locally
curl -s "https://rnudb.arediseasegenomics.org/api/genes" | tee genes_cache.json

# 2. Add delays between requests in loops
for gene in RNU4-2 RNU1-1 RNU2-1; do
    curl -s "/api/genes/$gene/variants"
    sleep 1  # Rate limit compliance
done

# 3. Use conditional requests (check HTTP headers)
curl -s -I "/api/genes"  # Check Last-Modified header
curl -s -H "If-Modified-Since: Mon, 01 Jan 2024 00:00:00 GMT" "/api/genes"

# 4. Implement exponential backoff for retries
#!/bin/bash
max_retries=3
delay=1
for i in $(seq 1 $max_retries); do
    response=$(curl -s -w "%{http_code}" -o response.json "/api/endpoint")
    if [ "$response" -eq 200 ]; then
        break
    fi
    echo "Retry $i after \${delay}s..."
    sleep $delay
    delay=\$((\$delay * 2))
done`}</pre>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Response Headers</CardTitle>
                </CardHeader>
                <CardContent>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-2 px-3 font-semibold">Header</th>
                        <th className="text-left py-2 px-3 font-semibold">Description</th>
                      </tr>
                    </thead>
                    <tbody className="text-slate-600">
                      <tr className="border-b border-slate-100">
                        <td className="py-2 px-3 font-mono text-xs">X-RateLimit-Limit</td>
                        <td className="py-2 px-3">Maximum requests allowed per window</td>
                      </tr>
                      <tr className="border-b border-slate-100">
                        <td className="py-2 px-3 font-mono text-xs">X-RateLimit-Remaining</td>
                        <td className="py-2 px-3">Requests remaining in current window</td>
                      </tr>
                      <tr className="border-b border-slate-100">
                        <td className="py-2 px-3 font-mono text-xs">X-RateLimit-Reset</td>
                        <td className="py-2 px-3">Unix timestamp when the rate limit resets</td>
                      </tr>
                      <tr className="border-b border-slate-100">
                        <td className="py-2 px-3 font-mono text-xs">Cache-Control</td>
                        <td className="py-2 px-3">Caching directives (public, max-age)</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-mono text-xs">Last-Modified</td>
                        <td className="py-2 px-3">Last modification timestamp for conditional requests</td>
                      </tr>
                    </tbody>
                  </table>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Error Handling</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <h5 className="font-semibold text-red-800">429 Too Many Requests</h5>
                      <p className="text-sm text-red-600 mt-1">
                        Rate limit exceeded. Implement exponential backoff and retry after the reset time.
                      </p>
                    </div>
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <h5 className="font-semibold text-amber-800">503 Service Unavailable</h5>
                      <p className="text-sm text-amber-600 mt-1">
                        Temporary outage. Retry with backoff. Check status page for ongoing incidents.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Footer />
    </div>
  );
};

export default APIDocs;