import {
  BookOpen,
  Code,
  Play,
  Copy,
  CheckCircle2,
  Terminal,
  Globe,
  AlertCircle,
  Clock,
  Shield,
  Zap,
  FileCode,
  Terminal as TerminalIcon,
  Scale,
  ChevronRight,
} from "lucide-react";
import React, { useState } from "react";
import Footer from "../components/Footer";
import Header from "../components/Header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Endpoint {
  id: string;
  category: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  description: string;
  parameters?: {
    name: string;
    type: string;
    required: boolean;
    description: string;
  }[];
  exampleResponse?: any;
}

const ENDPOINTS: Endpoint[] = [
  {
    id: "genes",
    category: "Genes",
    method: "GET",
    path: "/api/genes",
    description:
      "List all snRNA genes with their genomic coordinates, names, and basic metadata. Returns an array of gene objects sorted alphabetically by gene ID. This endpoint is public and does not require authentication.",
    exampleResponse: [
      {
        id: "RNU4-2",
        name: "RNU4-2",
        chromosome: "12",
        start: 120291759,
        end: 120291903,
      },
    ],
  },
  {
    id: "gene-detail",
    category: "Genes",
    method: "GET",
    path: "/api/genes/{geneId}",
    description:
      "Get comprehensive details for a specific gene including full name, genomic coordinates, strand orientation, DNA sequence, and descriptive information about the gene function. Public endpoint.",
    parameters: [
      {
        name: "geneId",
        type: "string",
        required: true,
        description: "Gene ID (e.g., RNU4-2)",
      },
    ],
    exampleResponse: {
      id: "RNU4-2",
      name: "RNU4-2",
      fullName: "RNA, U4 small nuclear 2",
      chromosome: "12",
      start: 120291759,
      end: 120291903,
      strand: "-",
      sequence: "tcagtctccgtagagactgtc...",
      description: "U4 small nuclear RNA involved in pre-mRNA splicing",
    },
  },
  {
    id: "gene-variants",
    category: "Genes",
    method: "GET",
    path: "/api/genes/{geneId}/variants",
    description:
      "Retrieve all variants associated with a specific gene. Returns variant data including genomic position, nucleotide changes, clinical significance annotations, gnomAD allele counts, and functional scores. Public endpoint.",
    parameters: [
      {
        name: "geneId",
        type: "string",
        required: true,
        description: "Gene ID",
      },
    ],
    exampleResponse: [
      {
        id: "chr12-120291785-T-C",
        geneId: "RNU4-2",
        position: 120291785,
        ref: "T",
        alt: "C",
        clinical_significance: "Pathogenic",
      },
    ],
  },
  {
    id: "gene-structure",
    category: "Genes",
    method: "GET",
    path: "/api/genes/{geneId}/structure",
    description:
      "Get RNA secondary structure data for a gene, including nucleotide positions, base pairing information, and structural annotations. Data is returned in JSON format compatible with RNA structure visualization tools. Public endpoint.",
    parameters: [
      {
        name: "geneId",
        type: "string",
        required: true,
        description: "Gene ID",
      },
    ],
    exampleResponse: {
      id: "RNU4-2",
      nucleotides: [
        { id: 1, base: "A", x: 0, y: 0 },
        { id: 2, base: "G", x: 1, y: 0 },
      ],
      basePairs: [{ nucleotide1: 1, nucleotide2: 144, type: "canonical" }],
      annotations: [],
    },
  },
  {
    id: "gene-bed-tracks",
    category: "Annotation Tracks",
    method: "GET",
    path: "/api/genes/{geneId}/bed-tracks",
    description:
      "Retrieve all BED annotation tracks associated with a gene. Each track contains genomic intervals with optional score values for visualization. Commonly used for conservation scores, regulatory elements, or experimental data. Public endpoint.",
    parameters: [
      {
        name: "geneId",
        type: "string",
        required: true,
        description: "Gene ID",
      },
    ],
    exampleResponse: [
      {
        id: "track-1",
        geneId: "RNU4-2",
        track_name: "Conservation",
        chrom: "12",
        interval_start: 120291760,
        interval_end: 120291800,
        score: 0.85,
        label: "PhastCons",
      },
    ],
  },
  {
    id: "variants-list",
    category: "Variants",
    method: "GET",
    path: "/api/variants",
    description:
      "List all variants in the database across all genes. Returns comprehensive variant information including position, reference/alternate alleles, clinical significance, gnomAD allele counts, and functional annotations. Public endpoint.",
    exampleResponse: [
      {
        id: "chr12-120291785-T-C",
        geneId: "RNU4-2",
        position: 120291785,
        ref: "T",
        alt: "C",
        clinical_significance: "Pathogenic",
        gnomad_ac: 0,
      },
    ],
  },
  {
    id: "variant-detail",
    category: "Variants",
    method: "GET",
    path: "/api/variants/{variantId}",
    description:
      "Get detailed information about a specific variant including genomic coordinates, nucleotide change, HGVS notation, consequence annotation, clinical significance from ClinVar, population allele counts from gnomAD, All of Us, and UK Biobank, as well as functional scores and p-values. Public endpoint.",
    parameters: [
      {
        name: "variantId",
        type: "string",
        required: true,
        description: "Variant ID (e.g., chr12-120291785-T-C)",
      },
    ],
    exampleResponse: {
      id: "chr12-120291785-T-C",
      geneId: "RNU4-2",
      position: 120291785,
      ref: "T",
      alt: "C",
      hgvs: "c.85T>C",
      consequence: "missense",
      clinical_significance: "Pathogenic",
      gnomad_ac: 0,
      gnomad_hom: 0,
      function_score: -2.847,
      cadd_score: 28.5,
    },
  },
  {
    id: "literature-list",
    category: "Literature",
    method: "GET",
    path: "/api/literature",
    description:
      "List all literature entries in the database. Each entry includes title, authors, journal, publication year, and DOI linking to the full paper. Literature entries are associated with variants through the literature-counts endpoint. Public endpoint.",
    exampleResponse: [
      {
        id: "lit-1",
        title: "Pathogenic variants in RNU4-2 cause a syndrome",
        authors: "Smith et al.",
        journal: "Nature Genetics",
        year: "2024",
        doi: "10.1038/s41588-024-1234-5",
      },
    ],
  },
  {
    id: "literature-detail",
    category: "Literature",
    method: "GET",
    path: "/api/literature/{literatureId}",
    description:
      "Get detailed information about a specific literature entry by its unique identifier. Public endpoint.",
    parameters: [
      {
        name: "literatureId",
        type: "string",
        required: true,
        description: "Literature ID",
      },
    ],
    exampleResponse: {
      id: "lit-1",
      title: "Pathogenic variants in RNU4-2 cause a syndrome",
      authors: "Smith J, Johnson A, Williams B et al.",
      journal: "Nature Genetics",
      year: "2024",
      doi: "10.1038/s41588-024-1234-5",
    },
  },
  {
    id: "literature-counts",
    category: "Literature",
    method: "GET",
    path: "/api/literature-counts",
    description:
      "Get counts of literature links per variant. Returns variant-lit literature pairs with the number of times each literature entry is cited for that variant. Useful for understanding which variants have the most literature support. Public endpoint.",
    exampleResponse: [
      { variant_id: "chr12-120291785-T-C", literature_id: "lit-1", counts: 3 },
    ],
  },
  {
    id: "bed-tracks",
    category: "Annotation Tracks",
    method: "GET",
    path: "/api/bed-tracks",
    description:
      "List all BED annotation tracks in the database across all genes. BED tracks contain genomic intervals with optional score values, useful for visualizing conservation scores, regulatory regions, or experimental data. Public endpoint.",
    exampleResponse: [
      {
        id: "track-1",
        geneId: "RNU4-2",
        track_name: "Conservation",
        chrom: "12",
        interval_start: 120291760,
        interval_end: 120291800,
        score: 0.85,
        label: "PhastCons",
      },
    ],
  },
  {
    id: "gene-pdb",
    category: "Genes",
    method: "GET",
    path: "/api/genes/{geneId}/pdb",
    description:
      "Get PDB structure file for a gene. Returns structural data in PDB format for visualization. Currently available for RNU4-2. Public endpoint.",
    parameters: [
      {
        name: "geneId",
        type: "string",
        required: true,
        description: "Gene ID (e.g., RNU4-2)",
      },
    ],
    exampleResponse: {
      message: "PDB file for RNU4-2 structural data",
    },
  },
  {
    id: "gene-literature",
    category: "Genes",
    method: "GET",
    path: "/api/genes/{geneId}/literature",
    description:
      "Get all literature entries associated with a specific gene. Returns research papers that cite variants in the specified gene. Public endpoint.",
    parameters: [
      {
        name: "geneId",
        type: "string",
        required: true,
        description: "Gene ID",
      },
    ],
    exampleResponse: [
      {
        id: "lit-1",
        title: "Pathogenic variants in RNU4-2 cause a syndrome",
        authors: "Smith et al.",
        journal: "Nature Genetics",
        year: "2024",
        doi: "10.1038/s41588-024-1234-5",
      },
    ],
  },
  {
    id: "variants-disease-types",
    category: "Variants",
    method: "GET",
    path: "/api/variants/disease-types",
    description:
      "Get all distinct disease type values from variants in the database. Useful for filtering variants by disease association. Public endpoint.",
    exampleResponse: ["ReNU syndrome", "Retinitis Pigmentosa", "NDD"],
  },
  {
    id: "variants-clinical-significances",
    category: "Variants",
    method: "GET",
    path: "/api/variants/clinical-significances",
    description:
      "Get all distinct clinical significance values from variants. Returns ACMG classification categories (Pathogenic, Likely Pathogenic, VUS, etc.). Public endpoint.",
    exampleResponse: [
      "Pathogenic",
      "Likely Pathogenic",
      "VUS",
      "Likely Benign",
      "Benign",
    ],
  },
];

const methodColors: Record<
  string,
  { bg: string; text: string; border: string }
> = {
  GET: {
    bg: "bg-emerald-100",
    text: "text-emerald-700",
    border: "border-emerald-300",
  },
  POST: { bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-300" },
  PUT: {
    bg: "bg-amber-100",
    text: "text-amber-700",
    border: "border-amber-300",
  },
  DELETE: { bg: "bg-red-100", text: "text-red-700", border: "border-red-300" },
};

const APIDocs: React.FC = () => {
  const [selectedEndpoint, setSelectedEndpoint] = useState<Endpoint>(
    ENDPOINTS[0],
  );
  const [tryItPath, setTryItPath] = useState("");
  const [tryItResult, setTryItResult] = useState<any>(null);
  const [tryItLoading, setTryItLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("endpoints");

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
    } catch {
      setTryItResult({ status: 0, error: "Network error" });
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
    const baseUrl = "https://rnudb.rarediseasegenomics.org";
    return `#!/bin/bash
# RNUdb API - ${endpoint.description.substring(0, 50)}...

# Fetch ${endpoint.path}
curl -s -X ${endpoint.method} "${baseUrl}${endpoint.path}" | jq .`;
  };

  const categories = [...new Set(ENDPOINTS.map((e) => e.category))];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header showSearch={false} />

      <div className="bg-gradient-to-br from-teal-700 via-teal-800 to-teal-900 text-white">
        <div className="max-w-7xl mx-auto px-6 py-16 pt-24">
          <div className="flex items-center gap-3 mb-4">
            <Globe className="h-8 w-8 text-teal-300" />
          </div>
          <h1 className="text-4xl font-bold mb-3">REST API Documentation</h1>
          <p className="text-teal-100 text-lg max-w-2xl">
            Access RNUdb data programmatically. All public endpoints are freely
            accessible without authentication.
          </p>
          <div className="flex items-center gap-6 mt-6">
            <span className="text-base text-teal-200">
              Base URL: https://rnudb.rarediseasegenomics.org
            </span>
            <span className="text-base text-teal-300 font-medium">v1.0</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10 w-full flex-1">
        <div className="flex items-center gap-1 p-1.5 bg-slate-200 rounded-xl w-fit mb-10">
          <button
            onClick={() => setActiveTab("endpoints")}
            className={`px-5 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
              activeTab === "endpoints"
                ? "bg-white text-teal-600 shadow-md"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <FileCode className="h-4 w-4 inline mr-2" />
            Endpoints
          </button>
          <button
            onClick={() => setActiveTab("guides")}
            className={`px-5 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
              activeTab === "guides"
                ? "bg-white text-teal-600 shadow-md"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <BookOpen className="h-4 w-4 inline mr-2" />
            Guides
          </button>
          <button
            onClick={() => setActiveTab("rate-limiting")}
            className={`px-5 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
              activeTab === "rate-limiting"
                ? "bg-white text-teal-600 shadow-md"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Clock className="h-4 w-4 inline mr-2" />
            Rate Limits
          </button>
        </div>

        {activeTab === "endpoints" && (
          <div className="grid lg:grid-cols-5 gap-8">
            <div className="lg:col-span-1">
              <div className="sticky top-6 space-y-6">
                <div>
                  <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
                    Endpoints
                  </h2>
                  <div className="space-y-4">
                    {categories.map((category) => (
                      <div key={category}>
                        <h3 className="text-base font-semibold text-slate-700 mb-3 px-3">
                          {category}
                        </h3>
                        <div className="space-y-1">
                          {ENDPOINTS.filter((e) => e.category === category).map(
                            (endpoint) => (
                              <button
                                key={endpoint.id}
                                onClick={() => {
                                  setSelectedEndpoint(endpoint);
                                  setTryItPath("");
                                  setTryItResult(null);
                                }}
                                className={`w-full text-left px-3 py-3 rounded-lg text-sm transition-all ${
                                  selectedEndpoint.id === endpoint.id
                                    ? "bg-teal-50 text-teal-700 font-semibold border-l-3 border-l-teal-500"
                                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-800"
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`text-xs font-bold px-2 py-1 rounded ${
                                      methodColors[endpoint.method].bg
                                    } ${methodColors[endpoint.method].text}`}
                                  >
                                    {endpoint.method}
                                  </span>
                                  <span className="truncate text-sm">
                                    {endpoint.path}
                                  </span>
                                </div>
                              </button>
                            ),
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Badge
                      className={`text-sm font-bold px-3 py-1.5 ${methodColors[selectedEndpoint.method].bg} ${methodColors[selectedEndpoint.method].text} ${methodColors[selectedEndpoint.method].border} border`}
                    >
                      {selectedEndpoint.method}
                    </Badge>
                    <code className="text-xl font-mono text-slate-800">
                      {selectedEndpoint.path}
                    </code>
                  </div>
                  <Badge
                    variant="outline"
                    className="bg-emerald-50 text-emerald-700 border-emerald-200 text-sm px-3 py-1.5"
                  >
                    <Shield className="h-4 w-4 mr-1.5" />
                    Public
                  </Badge>
                </div>
                <p className="text-slate-600 text-lg leading-relaxed">
                  {selectedEndpoint.description}
                </p>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3 text-white">
                    <Terminal className="h-5 w-5 text-teal-400" />
                    <h3 className="font-semibold text-lg">API Console</h3>
                  </div>
                  <code className="text-sm text-teal-300 font-mono">
                    rnudb.rarediseasegenomics.org{getFullPath(selectedEndpoint)}
                  </code>
                </div>
                <div className="p-6">
                  {selectedEndpoint.parameters && (
                    <div className="mb-6">
                      <label className="block text-base font-semibold text-slate-700 mb-3">
                        Path Parameters
                      </label>
                      {selectedEndpoint.parameters.map((param) => (
                        <div key={param.name} className="mb-4">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="font-mono text-base text-slate-800 font-medium">
                              {param.name}
                            </span>
                            {param.required && (
                              <span className="text-sm text-red-500 font-semibold">
                                required
                              </span>
                            )}
                            <span className="text-sm text-slate-400">
                              {param.type}
                            </span>
                          </div>
                          <Input
                            placeholder={param.description}
                            value={tryItPath}
                            onChange={(e) => setTryItPath(e.target.value)}
                            className="max-w-md bg-slate-50 border-slate-200 text-base"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                  <Button
                    onClick={handleTryIt}
                    disabled={tryItLoading}
                    className="bg-teal-600 hover:bg-teal-700 text-white text-base px-5 py-2.5"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    {tryItLoading ? "Sending..." : "Send Request"}
                  </Button>

                  {tryItResult && (
                    <div className="mt-6 bg-slate-950 rounded-xl overflow-hidden">
                      <div className="px-5 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
                        <span
                          className={`text-sm font-medium ${
                            tryItResult.status >= 200 &&
                            tryItResult.status < 300
                              ? "text-emerald-400"
                              : "text-red-400"
                          }`}
                        >
                          Status: {tryItResult.status}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-slate-400 hover:text-white h-8 px-3"
                          onClick={() =>
                            copyToClipboard(
                              JSON.stringify(
                                tryItResult.data || tryItResult.error,
                                null,
                                2,
                              ),
                            )
                          }
                        >
                          {copied ? (
                            <CheckCircle2 className="h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      <pre className="p-5 text-sm text-slate-300 overflow-x-auto font-mono">
                        {JSON.stringify(
                          tryItResult.data || tryItResult.error,
                          null,
                          2,
                        )}
                      </pre>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
                <div className="px-6 py-4 border-b border-slate-100">
                  <h3 className="font-semibold text-slate-800 text-lg flex items-center gap-2">
                    <Code className="h-5 w-5 text-teal-500" />
                    Code Examples
                  </h3>
                </div>
                <div className="p-6">
                  <Tabs defaultValue="curl">
                    <TabsList className="bg-slate-100 mb-5">
                      <TabsTrigger value="curl" className="text-sm px-4 py-2">
                        cURL
                      </TabsTrigger>
                      <TabsTrigger value="python" className="text-sm px-4 py-2">
                        Python
                      </TabsTrigger>
                      <TabsTrigger value="js" className="text-sm px-4 py-2">
                        JavaScript
                      </TabsTrigger>
                      <TabsTrigger value="bash" className="text-sm px-4 py-2">
                        Bash
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="curl">
                      <div className="relative bg-slate-950 rounded-xl p-5">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="absolute top-3 right-3 text-slate-400 hover:text-white h-8 w-8 p-0"
                          onClick={() =>
                            copyToClipboard(generateCurl(selectedEndpoint))
                          }
                        >
                          {copied ? (
                            <CheckCircle2 className="h-5 w-5" />
                          ) : (
                            <Copy className="h-5 w-5" />
                          )}
                        </Button>
                        <pre className="text-base text-slate-300 overflow-x-auto font-mono">
                          {generateCurl(selectedEndpoint)}
                        </pre>
                      </div>
                    </TabsContent>
                    <TabsContent value="python">
                      <div className="relative bg-slate-950 rounded-xl p-5">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="absolute top-3 right-3 text-slate-400 hover:text-white h-8 w-8 p-0"
                          onClick={() =>
                            copyToClipboard(generatePython(selectedEndpoint))
                          }
                        >
                          {copied ? (
                            <CheckCircle2 className="h-5 w-5" />
                          ) : (
                            <Copy className="h-5 w-5" />
                          )}
                        </Button>
                        <pre className="text-base text-slate-300 overflow-x-auto font-mono">
                          {generatePython(selectedEndpoint)}
                        </pre>
                      </div>
                    </TabsContent>
                    <TabsContent value="js">
                      <div className="relative bg-slate-950 rounded-xl p-5">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="absolute top-3 right-3 text-slate-400 hover:text-white h-8 w-8 p-0"
                          onClick={() =>
                            copyToClipboard(generateJS(selectedEndpoint))
                          }
                        >
                          {copied ? (
                            <CheckCircle2 className="h-5 w-5" />
                          ) : (
                            <Copy className="h-5 w-5" />
                          )}
                        </Button>
                        <pre className="text-base text-slate-300 overflow-x-auto font-mono">
                          {generateJS(selectedEndpoint)}
                        </pre>
                      </div>
                    </TabsContent>
                    <TabsContent value="bash">
                      <div className="relative bg-slate-950 rounded-xl p-5">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="absolute top-3 right-3 text-slate-400 hover:text-white h-8 w-8 p-0"
                          onClick={() =>
                            copyToClipboard(generateBash(selectedEndpoint))
                          }
                        >
                          {copied ? (
                            <CheckCircle2 className="h-5 w-5" />
                          ) : (
                            <Copy className="h-5 w-5" />
                          )}
                        </Button>
                        <pre className="text-base text-slate-300 overflow-x-auto font-mono">
                          {generateBash(selectedEndpoint)}
                        </pre>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              </div>

              {selectedEndpoint.exampleResponse && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
                  <div className="px-6 py-4 border-b border-slate-100">
                    <h3 className="font-semibold text-slate-800 text-lg flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-teal-500" />
                      Example Response
                    </h3>
                  </div>
                  <div className="p-6">
                    <div className="bg-slate-950 rounded-xl p-5">
                      <pre className="text-sm text-slate-300 overflow-x-auto font-mono">
                        {JSON.stringify(
                          selectedEndpoint.exampleResponse,
                          null,
                          2,
                        )}
                      </pre>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "guides" && (
          <div className="space-y-6">
            <Card className="bg-white border border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl font-semibold text-slate-800">
                  <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center">
                    <Zap className="h-5 w-5 text-teal-600" />
                  </div>
                  Getting Started
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <p className="text-slate-600 text-lg">
                  The RNUdb REST API provides programmatic access to snRNA
                  variant data. All public endpoints can be accessed without
                  authentication, making it ideal for data pipelines and
                  analysis scripts.
                </p>
                <div className="bg-slate-50 rounded-xl p-5">
                  <h4 className="font-semibold text-slate-800 text-lg mb-3">
                    Quick Start - Fetch Gene Data
                  </h4>
                  <pre className="text-base text-slate-700 font-mono overflow-x-auto">
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

            <Card className="bg-white border border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl font-semibold text-slate-800">
                  <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center">
                    <Scale className="h-5 w-5 text-teal-600" />
                  </div>
                  Usage Policies & Guidelines
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid md:grid-cols-2 gap-5">
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5">
                    <h4 className="font-semibold text-emerald-800 text-lg mb-3 flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5" />
                      Acceptable Use
                    </h4>
                    <ul className="text-emerald-700 text-base space-y-2">
                      <li className="flex items-start gap-2">
                        <ChevronRight className="h-4 w-4 mt-1.5 shrink-0" />{" "}
                        Academic research and educational purposes
                      </li>
                      <li className="flex items-start gap-2">
                        <ChevronRight className="h-4 w-4 mt-1.5 shrink-0" />{" "}
                        Clinical variant interpretation workflows
                      </li>
                      <li className="flex items-start gap-2">
                        <ChevronRight className="h-4 w-4 mt-1.5 shrink-0" />{" "}
                        Population genetics studies
                      </li>
                      <li className="flex items-start gap-2">
                        <ChevronRight className="h-4 w-4 mt-1.5 shrink-0" />{" "}
                        Bioinformatics pipeline integration
                      </li>
                      <li className="flex items-start gap-2">
                        <ChevronRight className="h-4 w-4 mt-1.5 shrink-0" />{" "}
                        Data analysis and visualization projects
                      </li>
                    </ul>
                  </div>
                  <div className="bg-red-50 border border-red-200 rounded-xl p-5">
                    <h4 className="font-semibold text-red-800 text-lg mb-3 flex items-center gap-2">
                      <AlertCircle className="h-5 w-5" />
                      Prohibited Use
                    </h4>
                    <ul className="text-red-700 text-base space-y-2">
                      <li className="flex items-start gap-2">
                        <ChevronRight className="h-4 w-4 mt-1.5 shrink-0" />{" "}
                        Commercial redistribution of API data
                      </li>
                      <li className="flex items-start gap-2">
                        <ChevronRight className="h-4 w-4 mt-1.5 shrink-0" />{" "}
                        Building competing variant databases
                      </li>
                      <li className="flex items-start gap-2">
                        <ChevronRight className="h-4 w-4 mt-1.5 shrink-0" />{" "}
                        Automated scraping without rate limiting
                      </li>
                      <li className="flex items-start gap-2">
                        <ChevronRight className="h-4 w-4 mt-1.5 shrink-0" />{" "}
                        Attempts to circumvent authentication
                      </li>
                      <li className="flex items-start gap-2">
                        <ChevronRight className="h-4 w-4 mt-1.5 shrink-0" />{" "}
                        Data mining for training ML models without attribution
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-xl p-5">
                  <h4 className="font-semibold text-slate-800 text-lg mb-3">
                    Data Attribution Requirements
                  </h4>
                  <p className="text-slate-600 text-base mb-3">
                    When using RNUdb data in publications, presentations, or
                    derivative works, please cite:
                  </p>
                  <code className="text-base bg-white px-4 py-3 rounded-lg border border-slate-200 block text-slate-700">
                    RNUdb: A curated database of snRNA variants. Rare Disease
                    Genomics Lab.
                  </code>
                </div>

                <div className="bg-slate-50 rounded-xl p-5">
                  <h4 className="font-semibold text-slate-800 text-lg mb-3">
                    Disclaimer
                  </h4>
                  <p className="text-slate-600 text-base">
                    RNUdb data is provided for research purposes only. While we
                    strive for accuracy, variant annotations should be validated
                    independently before clinical use. The curators of RNUdb
                    make no warranty regarding the completeness, accuracy, or
                    timeliness of the data. Always consult current literature
                    and professional guidelines for clinical decisions.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl font-semibold text-slate-800">
                  <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center">
                    <TerminalIcon className="h-5 w-5 text-teal-600" />
                  </div>
                  Bash Scripting Guide
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-slate-600 text-lg">
                  Below is a complete example bash script that fetches variant
                  data for multiple genes and processes the results with jq.
                </p>
                <div className="bg-slate-950 rounded-xl p-5 overflow-x-auto">
                  <pre className="text-base text-slate-300 font-mono">{String.raw`#!/bin/bash
# fetch_rnudb_variants.sh
# Fetch and analyze variants for multiple snRNA genes

BASE_URL="https://rnudb.rarediseasegenomics.org"
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
                <p className="text-slate-600 text-base">
                  Save this script and run:{" "}
                  <code className="bg-slate-100 px-3 py-1.5 rounded text-teal-600">
                    chmod +x fetch_rnudb_variants.sh &&
                    ./fetch_rnudb_variants.sh RNU4-2
                  </code>
                </p>

                <div className="bg-slate-950 rounded-xl p-5 overflow-x-auto">
                  <h4 className="font-semibold text-slate-200 text-lg mb-3">
                    Batch Download Script
                  </h4>
                  <pre className="text-base text-slate-300 font-mono">{`#!/bin/bash
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

            <Card className="bg-white border border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl font-semibold text-slate-800">
                  <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center">
                    <Code className="h-5 w-5 text-teal-600" />
                  </div>
                  Python Pipeline Integration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-slate-600 text-lg">
                  Integrate RNUdb data into your Python-based analysis pipelines
                  using requests or pyfetch.
                </p>
                <div className="bg-slate-950 rounded-xl p-5 overflow-x-auto">
                  <pre className="text-base text-slate-300 font-mono">{`#!/usr/bin/env python3
import requests
import json
from pathlib import Path
from typing import Optional

BASE_URL = "https://rnudb.rarediseasegenomics.org"

class RNUdbClient:
    def __init__(self, base_url: str = BASE_URL, timeout: int = 30):
        self.base_url = base_url
        self.session = requests.Session()
        self.session.headers.update({"Accept": "application/json"})
        self.timeout = timeout

    def get_gene(self, gene_id: str) -> dict:
        response = self.session.get(
            f"{self.base_url}/api/genes/{gene_id}",
            timeout=self.timeout
        )
        response.raise_for_status()
        return response.json()

    def get_variants(self, gene_id: str) -> list:
        response = self.session.get(
            f"{self.base_url}/api/genes/{gene_id}/variants",
            timeout=self.timeout
        )
        response.raise_for_status()
        return response.json()

# Usage in pipeline
if __name__ == "__main__":
    client = RNUdbClient()
    variants = client.get_variants("RNU4-2")
    print(f"Found {len(variants)} variants")`}</pre>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl font-semibold text-slate-800">
                  <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center">
                    <BookOpen className="h-5 w-5 text-teal-600" />
                  </div>
                  Data Formats & Conventions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid md:grid-cols-2 gap-5">
                  <div className="bg-slate-50 rounded-xl p-5">
                    <h4 className="font-semibold text-slate-800 text-lg mb-2">
                      Variant IDs
                    </h4>
                    <p className="text-slate-600 text-base">
                      Format:{" "}
                      <code className="bg-white px-2 rounded">
                        chr{"{chrom}-{pos}-{ref}-{alt}"}
                      </code>
                      <br />
                      Example:{" "}
                      <code className="bg-white px-2 rounded">
                        chr12-120291785-T-C
                      </code>
                    </p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-5">
                    <h4 className="font-semibold text-slate-800 text-lg mb-2">
                      Positions
                    </h4>
                    <p className="text-slate-600 text-base">
                      Genomic positions use <strong>1-based indexing</strong>{" "}
                      (HGVS convention). Sequence coordinates match the
                      reference genome (GRCh38).
                    </p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-5">
                    <h4 className="font-semibold text-slate-800 text-lg mb-2">
                      Clinical Significance
                    </h4>
                    <p className="text-slate-600 text-base">
                      Values: Pathogenic, Likely Pathogenic, VUS, Likely Benign,
                      Benign
                      <br />
                      Short codes: PATH, LP, VUS, LB, B
                    </p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-5">
                    <h4 className="font-semibold text-slate-800 text-lg mb-2">
                      Score Ranges
                    </h4>
                    <p className="text-slate-600 text-base">
                      CADD scores: 1-100 (higher = more deleterious)
                      <br />
                      Function scores: varies (negative = deleterious)
                      <br />
                      gnomAD AC: allele count (integer)
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "rate-limiting" && (
          <div className="space-y-6">
            <Card className="bg-white border border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl font-semibold text-slate-800">
                  <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-teal-600" />
                  </div>
                  Rate Limiting Policy
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
                  <p className="text-amber-800 font-semibold text-lg">
                    Rate limiting is not yet implemented, but guidelines are
                    provided for responsible usage.
                  </p>
                </div>
                <h4 className="font-semibold text-slate-800 text-lg">
                  Expected Rate Limits (Future Implementation)
                </h4>
                <div className="grid md:grid-cols-3 gap-5">
                  <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                    <h5 className="font-semibold text-slate-700 text-lg">
                      Public Endpoints
                    </h5>
                    <p className="text-3xl font-bold text-teal-600 mt-2">100</p>
                    <p className="text-slate-500 mt-1">requests per minute</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                    <h5 className="font-semibold text-slate-700 text-lg">
                      Bulk Downloads
                    </h5>
                    <p className="text-3xl font-bold text-teal-600 mt-2">10</p>
                    <p className="text-slate-500 mt-1">requests per minute</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                    <h5 className="font-semibold text-slate-700 text-lg">
                      Burst Allowance
                    </h5>
                    <p className="text-3xl font-bold text-teal-600 mt-2">20</p>
                    <p className="text-slate-500 mt-1">requests in 1 second</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl font-semibold text-slate-800">
                  <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center">
                    <Zap className="h-5 w-5 text-teal-600" />
                  </div>
                  Best Practices for API Usage
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-slate-950 rounded-xl p-5">
                  <pre className="text-base text-slate-300 font-mono">{`# Good practices for pipeline integration

# 1. Cache responses locally
curl -s "https://rnudb.rarediseasegenomics.org/api/genes" | tee genes_cache.json

# 2. Add delays between requests in loops
for gene in RNU4-2 RNU1-1 RNU2-1; do
    curl -s "/api/genes/$gene/variants"
    sleep 1  # Rate limit compliance
done

# 3. Filter results server-side when possible
curl -s "/api/variants?clinical_significance=Pathogenic"

# 4. Handle errors gracefully with retry logic
curl -s --retry 3 --retry-delay 5 "/api/genes/RNU4-2/variants"`}</pre>
                </div>

                <div className="grid md:grid-cols-2 gap-5">
                  <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-xl">
                    <h5 className="font-semibold text-emerald-800 text-lg mb-3">
                      Do
                    </h5>
                    <ul className="text-emerald-700 text-base space-y-2">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 mt-1.5 shrink-0 text-emerald-600" />{" "}
                        Add reasonable delays between requests
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 mt-1.5 shrink-0 text-emerald-600" />{" "}
                        Cache responses for repeated queries
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 mt-1.5 shrink-0 text-emerald-600" />{" "}
                        Use bulk endpoints when available
                      </li>
                    </ul>
                  </div>
                  <div className="p-5 bg-red-50 border border-red-200 rounded-xl">
                    <h5 className="font-semibold text-red-800 text-lg mb-3">
                      Don&apos;t
                    </h5>
                    <ul className="text-red-700 text-base space-y-2">
                      <li className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 mt-1.5 shrink-0 text-red-600" />{" "}
                        Batch requests in tight loops
                      </li>
                      <li className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 mt-1.5 shrink-0 text-red-600" />{" "}
                        Ignore rate limit headers
                      </li>
                      <li className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 mt-1.5 shrink-0 text-red-600" />{" "}
                        Attempt to circumvent limits
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="p-5 border border-slate-200 rounded-xl">
                  <h5 className="font-semibold text-slate-800 text-lg mb-3">
                    Error Codes
                  </h5>
                  <div className="space-y-3">
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                      <h5 className="font-semibold text-slate-700">
                        429 Too Many Requests
                      </h5>
                      <p className="text-slate-600 mt-1">
                        Rate limit exceeded. Implement exponential backoff and
                        retry after the reset time.
                      </p>
                    </div>
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <h5 className="font-semibold text-amber-800">
                        503 Service Unavailable
                      </h5>
                      <p className="text-amber-600 mt-1">
                        Temporary outage. Retry with backoff. Check status page
                        for ongoing incidents.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default APIDocs;
