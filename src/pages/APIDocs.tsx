import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, Code, Play, Copy, CheckCircle2, Terminal } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

interface Endpoint {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  description: string;
  parameters?: { name: string; type: string; required: boolean; description: string }[];
  exampleResponse?: any;
}

const ENDPOINTS: Endpoint[] = [
  {
    id: 'genes',
    method: 'GET',
    path: '/api/genes',
    description: 'List all snRNA genes',
    exampleResponse: [
      { id: 'RNU4-2', name: 'RNU4-2', chromosome: '12', start: 120291759, end: 120291903 }
    ]
  },
  {
    id: 'gene-detail',
    method: 'GET',
    path: '/api/genes/{geneId}',
    description: 'Get details for a specific gene',
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
    method: 'GET',
    path: '/api/genes/{geneId}/variants',
    description: 'Get all variants for a gene',
    parameters: [
      { name: 'geneId', type: 'string', required: true, description: 'Gene ID' }
    ],
    exampleResponse: [
      { id: 'chr12-120291785-T-C', geneId: 'RNU4-2', position: 120291785, ref: 'T', alt: 'C', clinical_significance: 'Pathogenic' }
    ]
  },
  {
    id: 'gene-literature',
    method: 'GET',
    path: '/api/genes/{geneId}/literature',
    description: 'Get literature associated with a gene',
    parameters: [
      { name: 'geneId', type: 'string', required: true, description: 'Gene ID' }
    ],
    exampleResponse: [
      { id: 'rius_et_al_2025', title: 'Characterization of snRNA-related neurodevelopmental disorders', authors: 'Rius et al.', journal: 'medRxiv', year: '2025', doi: '10.1101/2025.08.13.25333306' }
    ]
  },
  {
    id: 'gene-structure',
    method: 'GET',
    path: '/api/genes/{geneId}/structure',
    description: 'Get RNA structure for a gene',
    parameters: [
      { name: 'geneId', type: 'string', required: true, description: 'Gene ID' }
    ]
  },
  {
    id: 'gene-pdb',
    method: 'GET',
    path: '/api/genes/{geneId}/pdb',
    description: 'Get PDB structure data for a gene',
    parameters: [
      { name: 'geneId', type: 'string', required: true, description: 'Gene ID' }
    ]
  },
  {
    id: 'gene-bed-tracks',
    method: 'GET',
    path: '/api/genes/{geneId}/bed-tracks',
    description: 'Get BED annotation tracks for a gene',
    parameters: [
      { name: 'geneId', type: 'string', required: true, description: 'Gene ID' }
    ],
    exampleResponse: [
      { id: 1, geneId: 'RNU4-2', track_name: 'conservation', chrom: '12', interval_start: 120291760, interval_end: 120291770, score: 500 }
    ]
  },
  {
    id: 'variants',
    method: 'GET',
    path: '/api/variants',
    description: 'List all variants across all genes',
    exampleResponse: [
      { id: 'chr12-120291785-T-C', geneId: 'RNU4-2', position: 120291785, ref: 'T', alt: 'C' }
    ]
  },
  {
    id: 'variant-detail',
    method: 'GET',
    path: '/api/variants/{variantId}',
    description: 'Get details for a specific variant',
    parameters: [
      { name: 'variantId', type: 'string', required: true, description: 'Variant ID' }
    ]
  },
  {
    id: 'literature',
    method: 'GET',
    path: '/api/literature',
    description: 'List all literature entries',
    exampleResponse: [
      { id: 'rius_et_al_2025', title: 'Characterization of snRNA-related neurodevelopmental disorders', authors: 'Rius et al.', journal: 'medRxiv', year: '2025', doi: '10.1101/2025.08.13.25333306' }
    ]
  },
  {
    id: 'literature-detail',
    method: 'GET',
    path: '/api/literature/{literatureId}',
    description: 'Get a specific literature entry',
    parameters: [
      { name: 'literatureId', type: 'string', required: true, description: 'Literature ID' }
    ]
  },
  {
    id: 'literature-counts',
    method: 'GET',
    path: '/api/literature-counts',
    description: 'Get variant-literature citation counts',
    exampleResponse: [
      { variant_id: 'chr12-120291785-T-C', literature_id: 'rius_et_al_2025', counts: 4 }
    ]
  }
];

const methodColors: Record<string, string> = {
  GET: 'bg-emerald-100 text-emerald-800',
  POST: 'bg-blue-100 text-blue-800',
  PUT: 'bg-amber-100 text-amber-800',
  DELETE: 'bg-red-100 text-red-800'
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
      path = endpoint.path.replace(/{\w+}/, tryItPath);
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

  return (
    <div className="min-h-screen bg-slate-50">
      <Header showSearch={false} />
      
      <div className="max-w-7xl mx-auto px-4 py-8 pt-24">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">API Documentation</h1>
          <p className="text-muted-foreground">
            Public REST API for accessing RNUdb data. No authentication required for read endpoints.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Endpoint List */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-teal-600" />
                  Endpoints
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="space-y-1">
                  {ENDPOINTS.map(endpoint => (
                    <button
                      key={endpoint.id}
                      onClick={() => {
                        setSelectedEndpoint(endpoint);
                        setTryItPath('');
                        setTryItResult(null);
                      }}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-2 ${
                        selectedEndpoint.id === endpoint.id ? 'bg-teal-50 border-l-2 border-teal-600' : ''
                      }`}
                    >
                      <Badge className={`text-xs ${methodColors[endpoint.method]}`}>
                        {endpoint.method}
                      </Badge>
                      <span className="truncate">{endpoint.path}</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Endpoint Detail */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Badge className={`text-sm ${methodColors[selectedEndpoint.method]}`}>
                    {selectedEndpoint.method}
                  </Badge>
                  <code className="text-lg font-mono">{selectedEndpoint.path}</code>
                </div>
                <p className="text-muted-foreground mt-2">{selectedEndpoint.description}</p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Parameters */}
                {selectedEndpoint.parameters && (
                  <div>
                    <h3 className="text-sm font-semibold mb-3">Parameters</h3>
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="px-4 py-2 text-left">Name</th>
                            <th className="px-4 py-2 text-left">Type</th>
                            <th className="px-4 py-2 text-left">Required</th>
                            <th className="px-4 py-2 text-left">Description</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedEndpoint.parameters.map(param => (
                            <tr key={param.name} className="border-t">
                              <td className="px-4 py-2 font-mono">{param.name}</td>
                              <td className="px-4 py-2">{param.type}</td>
                              <td className="px-4 py-2">{param.required ? 'Yes' : 'No'}</td>
                              <td className="px-4 py-2">{param.description}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Try It */}
                <div>
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Play className="h-4 w-4" />
                    Try It
                  </h3>
                  <div className="bg-slate-900 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-emerald-400 font-mono text-sm">{selectedEndpoint.method}</span>
                      <code className="text-slate-300 text-sm">{getFullPath(selectedEndpoint)}</code>
                    </div>
                    {selectedEndpoint.parameters && (
                      <div className="mb-3">
                        <Input
                          placeholder={`Enter ${selectedEndpoint.parameters[0].name}...`}
                          value={tryItPath}
                          onChange={(e) => setTryItPath(e.target.value)}
                          className="bg-slate-800 border-slate-700 text-white"
                        />
                      </div>
                    )}
                    <Button
                      onClick={handleTryIt}
                      disabled={tryItLoading}
                      size="sm"
                      className="bg-teal-600 hover:bg-teal-700 text-white"
                    >
                      {tryItLoading ? 'Loading...' : 'Send Request'}
                    </Button>
                  </div>

                  {tryItResult && (
                    <div className="mt-3 bg-slate-900 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-sm font-medium ${tryItResult.status >= 200 && tryItResult.status < 300 ? 'text-emerald-400' : 'text-red-400'}`}>
                          Status: {tryItResult.status}
                        </span>
                      </div>
                      <pre className="text-xs text-slate-300 overflow-x-auto">
                        {JSON.stringify(tryItResult.data || tryItResult.error, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>

                {/* Code Examples */}
                <div>
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Code className="h-4 w-4" />
                    Code Examples
                  </h3>
                  <Tabs defaultValue="curl">
                    <TabsList className="mb-3">
                      <TabsTrigger value="curl">cURL</TabsTrigger>
                      <TabsTrigger value="python">Python</TabsTrigger>
                      <TabsTrigger value="js">JavaScript</TabsTrigger>
                    </TabsList>
                    <TabsContent value="curl">
                      <div className="relative bg-slate-900 rounded-lg p-4">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="absolute top-2 right-2 text-slate-400 hover:text-white"
                          onClick={() => copyToClipboard(generateCurl(selectedEndpoint))}
                        >
                          {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                        <pre className="text-xs text-slate-300 overflow-x-auto">
                          <code>{generateCurl(selectedEndpoint)}</code>
                        </pre>
                      </div>
                    </TabsContent>
                    <TabsContent value="python">
                      <div className="relative bg-slate-900 rounded-lg p-4">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="absolute top-2 right-2 text-slate-400 hover:text-white"
                          onClick={() => copyToClipboard(generatePython(selectedEndpoint))}
                        >
                          {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                        <pre className="text-xs text-slate-300 overflow-x-auto">
                          <code>{generatePython(selectedEndpoint)}</code>
                        </pre>
                      </div>
                    </TabsContent>
                    <TabsContent value="js">
                      <div className="relative bg-slate-900 rounded-lg p-4">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="absolute top-2 right-2 text-slate-400 hover:text-white"
                          onClick={() => copyToClipboard(generateJS(selectedEndpoint))}
                        >
                          {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                        <pre className="text-xs text-slate-300 overflow-x-auto">
                          <code>{generateJS(selectedEndpoint)}</code>
                        </pre>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>

                {/* Example Response */}
                {selectedEndpoint.exampleResponse && (
                  <div>
                    <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <Terminal className="h-4 w-4" />
                      Example Response
                    </h3>
                    <div className="bg-slate-900 rounded-lg p-4">
                      <pre className="text-xs text-slate-300 overflow-x-auto">
                        {JSON.stringify(selectedEndpoint.exampleResponse, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default APIDocs;
