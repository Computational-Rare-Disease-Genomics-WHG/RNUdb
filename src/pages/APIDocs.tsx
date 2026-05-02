import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BookOpen, 
  Code, 
  Play, 
  Copy, 
  CheckCircle2, 
  Terminal,
  Globe,
  Server,
  AlertCircle
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
    description: 'List all snRNA genes with their genomic coordinates, names, and basic metadata. Returns an array of gene objects sorted alphabetically by gene ID.',
    exampleResponse: [
      { id: 'RNU4-2', name: 'RNU4-2', chromosome: '12', start: 120291759, end: 120291903 }
    ]
  },
  {
    id: 'gene-detail',
    category: 'Genes',
    method: 'GET',
    path: '/api/genes/{geneId}',
    description: 'Get comprehensive details for a specific gene including full name, genomic coordinates, strand orientation, DNA sequence, and descriptive information about the gene function.',
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
    description: 'Retrieve all variants associated with a specific gene. Returns variant data including genomic position, nucleotide changes, clinical significance annotations, gnomAD allele counts, and functional scores.',
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
    description: 'Get RNA secondary structure data for a gene, including nucleotide positions, base pairing information, and structural annotations. Data is returned in JSON format compatible with RNA structure visualization tools.',
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
    category: 'Genes',
    method: 'GET',
    path: '/api/genes/{geneId}/bed-tracks',
    description: 'Retrieve all BED annotation tracks associated with a gene. Each track contains genomic intervals with optional score values for visualization. Commonly used for conservation scores, regulatory elements, or experimental data.',
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
    description: 'List all variants in the database across all genes. Returns comprehensive variant information including position, reference/alternate alleles, clinical significance, gnomAD allele counts, and functional annotations.',
    exampleResponse: [
      { id: 'chr12-120291785-T-C', geneId: 'RNU4-2', position: 120291785, ref: 'T', alt: 'C', clinical_significance: 'Pathogenic', gnomad_ac: 0 }
    ]
  },
  {
    id: 'variant-detail',
    category: 'Variants',
    method: 'GET',
    path: '/api/variants/{variantId}',
    description: 'Get detailed information about a specific variant including genomic coordinates, nucleotide change, HGVS notation, consequence annotation, clinical significance from ClinVar, population allele counts from gnomAD, All of Us, and UK Biobank, as well as functional scores and p-values.',
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
    description: 'List all literature entries in the database. Each entry includes title, authors, journal, publication year, and DOI linking to the full paper. Literature entries are associated with variants through the literature-counts endpoint.',
    exampleResponse: [
      { id: 'lit-1', title: 'Pathogenic variants in RNU4-2 cause a syndrome', authors: 'Smith et al.', journal: 'Nature Genetics', year: '2024', doi: '10.1038/s41588-024-1234-5' }
    ]
  },
  {
    id: 'literature-detail',
    category: 'Literature',
    method: 'GET',
    path: '/api/literature/{literatureId}',
    description: 'Get detailed information about a specific literature entry by its unique identifier.',
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
    description: 'Get counts of literature links per variant. Returns variant-lit literature pairs with the number of times each literature entry is cited for that variant. Useful for understanding which variants have the most literature support.',
    exampleResponse: [
      { variant_id: 'chr12-120291785-T-C', literature_id: 'lit-1', counts: 3 }
    ]
  },
  {
    id: 'bed-tracks',
    category: 'Annotation Tracks',
    method: 'GET',
    path: '/api/bed-tracks',
    description: 'List all BED annotation tracks in the database. BED tracks contain genomic intervals with optional score values, useful for visualizing conservation scores, regulatory regions, or experimental data across the genome.',
    exampleResponse: [
      { id: 'track-1', geneId: 'RNU4-2', track_name: 'Conservation', chrom: '12', interval_start: 120291760, interval_end: 120291800, score: 0.85, label: 'PhastCons' }
    ]
  },
  {
    id: 'auth-github',
    category: 'Authentication',
    method: 'GET',
    path: '/api/auth/github',
    description: 'Initiate GitHub OAuth authentication flow. Redirects to GitHub for authorization. After the user authorizes, they are redirected back to the application with a code parameter.',
    exampleResponse: { redirect: 'https://github.com/login/oauth/authorize?client_id=...' }
  },
  {
    id: 'auth-callback',
    category: 'Authentication',
    method: 'GET',
    path: '/api/auth/callback',
    description: 'OAuth callback endpoint handling the response from GitHub after user authorization. Exchanges the authorization code for an access token and creates or updates the user session.',
    parameters: [
      { name: 'code', type: 'string', required: true, description: 'Authorization code from GitHub' },
      { name: 'state', type: 'string', required: true, description: 'CSRF state parameter for security' }
    ]
  },
  {
    id: 'auth-me',
    category: 'Authentication',
    method: 'GET',
    path: '/api/auth/me',
    description: 'Get the currently authenticated user information. Returns the user\'s GitHub login, name, email, avatar URL, and role (admin, curator, or pending). Returns 401 if not authenticated.',
    exampleResponse: {
      github_login: 'exampleuser',
      name: 'Example User',
      email: 'user@example.com',
      avatar_url: 'https://avatars.githubusercontent.com/u/12345',
      role: 'curator'
    }
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
    return `import requests\n\nresponse = requests.${endpoint.method.toLowerCase()}("https://rnudb.rarediseasegenomics.org${getFullPath(endpoint)}")\ndata = response.json()\nprint(data)`;
  };

  const generateJS = (endpoint: Endpoint) => {
    return `fetch("https://rnudb.rarediseasegenomics.org${getFullPath(endpoint)}")\n  .then(res => res.json())\n  .then(data => console.log(data));`;
  };

  // Group endpoints by category
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
            Access RNUdb data programmatically. All endpoints require authentication except for read-only gene data.
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
                <Button
                  variant="outline"
                  size="sm"
                  className="text-teal-600 border-teal-200 hover:bg-teal-50"
                >
                  <BookOpen className="h-4 w-4 mr-1" />
                  Docs
                </Button>
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
                      Parameters
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
      </div>

      <Footer />
    </div>
  );
};

export default APIDocs;
