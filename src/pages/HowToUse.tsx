import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BookOpen,
  HelpCircle,
  Users,
  Database,
  FileUp,
  Navigation,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Search,
  Layers,
  Dna,
  FileText,
  ExternalLink,
  Upload,
  Download,
  Settings
} from 'lucide-react';

const HowToUse: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header showSearch={false} />

      <div className="bg-gradient-to-br from-teal-600 via-teal-700 to-teal-800 text-white">
        <div className="max-w-7xl mx-auto px-4 py-12 pt-24">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
              <BookOpen className="h-6 w-6" />
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-3">How to Use RNUdb</h1>
          <p className="text-teal-100 text-lg max-w-2xl">
            A comprehensive guide to navigating RNUdb, importing variants, and using the curator workflow
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 w-full flex-1">
        <Tabs defaultValue="getting-started" className="w-full">
          <TabsList className="mb-6 bg-slate-100 p-1 rounded-lg">
            <TabsTrigger
              value="getting-started"
              className="data-[state=active]:bg-white data-[state=active]:text-teal-600 data-[state=active]:shadow-sm rounded-md px-4 py-2"
            >
              <Lightbulb className="h-4 w-4 mr-2" />
              Getting Started
            </TabsTrigger>
            <TabsTrigger
              value="user-types"
              className="data-[state=active]:bg-white data-[state=active]:text-teal-600 data-[state=active]:shadow-sm rounded-md px-4 py-2"
            >
              <Users className="h-4 w-4 mr-2" />
              User Types
            </TabsTrigger>
            <TabsTrigger
              value="importing"
              className="data-[state=active]:bg-white data-[state=active]:text-teal-600 data-[state=active]:shadow-sm rounded-md px-4 py-2"
            >
              <FileUp className="h-4 w-4 mr-2" />
              Importing Variants
            </TabsTrigger>
            <TabsTrigger
              value="navigation"
              className="data-[state=active]:bg-white data-[state=active]:text-teal-600 data-[state=active]:shadow-sm rounded-md px-4 py-2"
            >
              <Navigation className="h-4 w-4 mr-2" />
              Site Navigation
            </TabsTrigger>
            <TabsTrigger
              value="faq"
              className="data-[state=active]:bg-white data-[state=active]:text-teal-600 data-[state=active]:shadow-sm rounded-md px-4 py-2"
            >
              <HelpCircle className="h-4 w-4 mr-2" />
              FAQ
            </TabsTrigger>
          </TabsList>

          <TabsContent value="getting-started">
            <div className="space-y-6">
              <Card className="bg-white border border-slate-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-teal-600" />
                    What is RNUdb?
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-slate-600 leading-relaxed">
                    RNUdb is a comprehensive database for spliceosomal small nuclear RNA (snRNA) variant visualization and analysis.
                    It provides tools for exploring RNA sequences, variants, and clinical data with interactive visualizations.
                  </p>
                  <div className="grid md:grid-cols-3 gap-4 mt-4">
                    <div className="p-4 bg-teal-50 rounded-lg border border-teal-200">
                      <Dna className="h-8 w-8 text-teal-600 mb-2" />
                      <h4 className="font-semibold text-teal-800 mb-1">snRNA Genes</h4>
                      <p className="text-sm text-teal-700">Explore 22 spliceosomal snRNA genes with interactive structure visualization</p>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <FileText className="h-8 w-8 text-blue-600 mb-2" />
                      <h4 className="font-semibold text-blue-800 mb-1">Variants</h4>
                      <p className="text-sm text-blue-700">Browse disease-associated variants with literature evidence and clinical classifications</p>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                      <Layers className="h-8 w-8 text-purple-600 mb-2" />
                      <h4 className="font-semibold text-purple-800 mb-1">Structures</h4>
                      <p className="text-sm text-purple-700">View secondary and tertiary RNA structures with variant mapping</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border border-slate-200 shadow-sm">
                <CardHeader>
                  <CardTitle>Quick Start Guide</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg">
                      <div className="w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center text-white font-bold shrink-0">1</div>
                      <div>
                        <h4 className="font-semibold text-slate-800">Search for a Gene</h4>
                        <p className="text-sm text-slate-600">Use the search bar to find snRNA genes by name (e.g., RNU4-2, RNU2-1) or variant notation</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg">
                      <div className="w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center text-white font-bold shrink-0">2</div>
                      <div>
                        <h4 className="font-semibold text-slate-800">Explore the Gene Page</h4>
                        <p className="text-sm text-slate-600">View the RNA structure, associated variants, and literature in the interactive visualization</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg">
                      <div className="w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center text-white font-bold shrink-0">3</div>
                      <div>
                        <h4 className="font-semibold text-slate-800">Overlay Data Layers</h4>
                        <p className="text-sm text-slate-600">Toggle ClinVar, gnomAD, or function score overlays to see variant pathogenicity evidence</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg">
                      <div className="w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center text-white font-bold shrink-0">4</div>
                      <div>
                        <h4 className="font-semibold text-slate-800">Review Literature</h4>
                        <p className="text-sm text-slate-600">Click on variants to see linked publications and external database references</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-amber-50 border-amber-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-amber-800">
                    <AlertTriangle className="h-5 w-5" />
                    Important Note on Data Sources
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-amber-900">
                  <p className="mb-2">
                    RNUdb aggregates data from multiple sources including gnomAD, ClinVar, and published literature.
                    Variant pathogenicity classifications reflect the current state of knowledge and may change as new evidence emerges.
                  </p>
                  <p className="text-sm">
                    Always verify critical variant classifications against primary sources and consider the Clinical Interpretation guidelines
                    when making clinical decisions.
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="user-types">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card className="bg-white border border-slate-200 shadow-sm">
                <CardHeader className="bg-gradient-to-r from-teal-50 to-transparent">
                  <CardTitle className="flex items-center gap-2">
                    <Search className="h-5 w-5 text-teal-600" />
                    Public Users
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-slate-600">
                    Anyone can browse RNUdb without an account. Public users can:
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-teal-600 shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-600">Search and browse all snRNA genes</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-teal-600 shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-600">View interactive RNA structures with variant overlays</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-teal-600 shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-600">Browse variant literature and classifications</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-teal-600 shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-600">Access Clinical Interpretation guidelines</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-teal-600 shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-600">Use the public API for programmatic access</span>
                    </li>
                  </ul>
                  <div className="pt-4 border-t border-slate-200">
                    <p className="text-sm text-slate-500">
                      <strong>No account required.</strong> Start exploring immediately.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border border-slate-200 shadow-sm">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-transparent">
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5 text-blue-600" />
                    Curators
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-slate-600">
                    Curators contribute to the database by managing variants and literature:
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-600">Import variants via CSV upload</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-600">Edit variant classifications and metadata</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-600">Link variants to literature and external databases</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-600">Manage RNA structure annotations</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-600">Create and manage BED tracks for visualization</span>
                    </li>
                  </ul>
                  <div className="pt-4 border-t border-slate-200">
                    <p className="text-sm text-slate-500">
                      <strong>Requires sign-in.</strong> Contact an admin to request curator access.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border border-slate-200 shadow-sm lg:col-span-2">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-transparent">
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5 text-purple-600" />
                    Administrators
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-slate-600">
                    Admins have full control over the database content and user management:
                  </p>
                  <div className="grid md:grid-cols-2 gap-4">
                    <ul className="space-y-2">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-purple-600 shrink-0 mt-0.5" />
                        <span className="text-sm text-slate-600">Manage user accounts and permissions</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-purple-600 shrink-0 mt-0.5" />
                        <span className="text-sm text-slate-600">Approve or reject curator access requests</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-purple-600 shrink-0 mt-0.5" />
                        <span className="text-sm text-slate-600">Bulk import and export data</span>
                      </li>
                    </ul>
                    <ul className="space-y-2">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-purple-600 shrink-0 mt-0.5" />
                        <span className="text-sm text-slate-600">Configure system settings</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-purple-600 shrink-0 mt-0.5" />
                        <span className="text-sm text-slate-600">View audit logs and activity reports</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-purple-600 shrink-0 mt-0.5" />
                        <span className="text-sm text-slate-600">Manage API keys and rate limits</span>
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="importing">
            <div className="space-y-6">
              <Card className="bg-white border border-slate-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5 text-teal-600" />
                    Importing Variants via CSV
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-slate-600">
                    Curators can import variants in bulk using a CSV file. The CSV should contain one variant per row
                    with the following columns:
                  </p>
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-200">
                          <th className="text-left py-2 px-3 font-semibold">Column</th>
                          <th className="text-left py-2 px-3 font-semibold">Required</th>
                          <th className="text-left py-2 px-3 font-semibold">Description</th>
                          <th className="text-left py-2 px-3 font-semibold">Example</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-slate-100">
                          <td className="py-2 px-3 font-mono text-teal-600">gene_id</td>
                          <td className="py-2 px-3"><CheckCircle2 className="h-4 w-4 text-green-600" /></td>
                          <td className="py-2 px-3">snRNA gene name</td>
                          <td className="py-2 px-3 font-mono">RNU4-2</td>
                        </tr>
                        <tr className="border-b border-slate-100">
                          <td className="py-2 px-3 font-mono text-teal-600">position</td>
                          <td className="py-2 px-3"><CheckCircle2 className="h-4 w-4 text-green-600" /></td>
                          <td className="py-2 px-3">Genomic position (chr:pos)</td>
                          <td className="py-2 px-3 font-mono">chr12:120291828</td>
                        </tr>
                        <tr className="border-b border-slate-100">
                          <td className="py-2 px-3 font-mono text-teal-600">ref</td>
                          <td className="py-2 px-3"><CheckCircle2 className="h-4 w-4 text-green-600" /></td>
                          <td className="py-2 px-3">Reference allele</td>
                          <td className="py-2 px-3 font-mono">G</td>
                        </tr>
                        <tr className="border-b border-slate-100">
                          <td className="py-2 px-3 font-mono text-teal-600">alt</td>
                          <td className="py-2 px-3"><CheckCircle2 className="h-4 w-4 text-green-600" /></td>
                          <td className="py-2 px-3">Alternate allele</td>
                          <td className="py-2 px-3 font-mono">A</td>
                        </tr>
                        <tr className="border-b border-slate-100">
                          <td className="py-2 px-3 font-mono text-teal-600">hgvs</td>
                          <td className="py-2 px-3">Optional</td>
                          <td className="py-2 px-3">HGVS notation</td>
                          <td className="py-2 px-3 font-mono">n.76C&gt;T</td>
                        </tr>
                        <tr className="border-b border-slate-100">
                          <td className="py-2 px-3 font-mono text-teal-600">clinical_significance</td>
                          <td className="py-2 px-3">Optional</td>
                          <td className="py-2 px-3">Variant classification</td>
                          <td className="py-2 px-3 font-mono">Pathogenic</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border border-slate-200 shadow-sm">
                <CardHeader>
                  <CardTitle>Step-by-Step Import Process</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg">
                      <div className="w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center text-white font-bold shrink-0">1</div>
                      <div>
                        <h4 className="font-semibold text-slate-800">Navigate to Curate</h4>
                        <p className="text-sm text-slate-600">Click "Curate" in the navigation bar (visible after signing in)</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg">
                      <div className="w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center text-white font-bold shrink-0">2</div>
                      <div>
                        <h4 className="font-semibold text-slate-800">Select the Variants Tab</h4>
                        <p className="text-sm text-slate-600">Click on "Variants" to access the variant management interface</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg">
                      <div className="w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center text-white font-bold shrink-0">3</div>
                      <div>
                        <h4 className="font-semibold text-slate-800">Click "Import CSV"</h4>
                        <p className="text-sm text-slate-600">Locate the "Import CSV" button at the top of the Variants section</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg">
                      <div className="w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center text-white font-bold shrink-0">4</div>
                      <div>
                        <h4 className="font-semibold text-slate-800">Select Your CSV File</h4>
                        <p className="text-sm text-slate-600">Choose the CSV file from your computer. Ensure it follows the required format.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg">
                      <div className="w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center text-white font-bold shrink-0">5</div>
                      <div>
                        <h4 className="font-semibold text-slate-800">Review and Confirm</h4>
                        <p className="text-sm text-slate-600">Preview the imported variants and confirm to add them to the database</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-green-50 border-green-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-800">
                    <Download className="h-5 w-5" />
                    Exporting Data
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-green-900">
                  <p className="mb-2">
                    You can also export existing variants to CSV format for backup or analysis.
                    Use the "Export CSV" button in the Curate dashboard to download all variants.
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="navigation">
            <div className="space-y-6">
              <Card className="bg-white border border-slate-200 shadow-sm">
                <CardHeader>
                  <CardTitle>Main Navigation</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                      <h4 className="font-semibold text-slate-800 mb-2">Home Page</h4>
                      <p className="text-sm text-slate-600 mb-2">Entry point with search functionality and gene overview</p>
                      <code className="text-xs bg-slate-200 px-2 py-1 rounded">/</code>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                      <h4 className="font-semibold text-slate-800 mb-2">Gene Page</h4>
                      <p className="text-sm text-slate-600 mb-2">Interactive RNA structure visualization with variant overlay</p>
                      <code className="text-xs bg-slate-200 px-2 py-1 rounded">/gene/:geneId</code>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                      <h4 className="font-semibold text-slate-800 mb-2">API Documentation</h4>
                      <p className="text-sm text-slate-600 mb-2">Developer documentation for programmatic access</p>
                      <code className="text-xs bg-slate-200 px-2 py-1 rounded">/api-docs</code>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                      <h4 className="font-semibold text-slate-800 mb-2">Clinical Interpretation</h4>
                      <p className="text-sm text-slate-600 mb-2">Guidelines for variant classification in snRNA genes</p>
                      <code className="text-xs bg-slate-200 px-2 py-1 rounded">/clinical-interpretation</code>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border border-slate-200 shadow-sm">
                <CardHeader>
                  <CardTitle>Curator Features</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <h4 className="font-semibold text-blue-800 mb-2">Curate Dashboard</h4>
                      <p className="text-sm text-blue-700 mb-2">Manage variants, structures, literature, and BED tracks</p>
                      <code className="text-xs bg-blue-200 px-2 py-1 rounded text-blue-800">/curate</code>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Variants</span>
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Structures</span>
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Literature</span>
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">BED Tracks</span>
                      </div>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                      <h4 className="font-semibold text-purple-800 mb-2">Editor</h4>
                      <p className="text-sm text-purple-700 mb-2">Interactive visualization editor for detailed variant analysis</p>
                      <code className="text-xs bg-purple-200 px-2 py-1 rounded text-purple-800">/editor</code>
                    </div>
                    <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                      <h4 className="font-semibold text-amber-800 mb-2">Admin Panel</h4>
                      <p className="text-sm text-amber-700 mb-2">User management and system configuration (admin only)</p>
                      <code className="text-xs bg-amber-200 px-2 py-1 rounded text-amber-800">/admin</code>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border border-slate-200 shadow-sm">
                <CardHeader>
                  <CardTitle>Gene Page Features</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="p-4 bg-teal-50 rounded-lg border border-teal-200">
                        <h4 className="font-semibold text-teal-800 mb-2">RNA Structure Viewer</h4>
                        <p className="text-sm text-teal-700">Interactive secondary structure with nucleotide resolution</p>
                      </div>
                      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <h4 className="font-semibold text-blue-800 mb-2">Variant Track</h4>
                        <p className="text-sm text-blue-700">gnomAD variant frequency overlay using track-variants</p>
                      </div>
                      <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                        <h4 className="font-semibold text-purple-800 mb-2">Literature Panel</h4>
                        <p className="text-sm text-purple-700">Linked publications with variant associations</p>
                      </div>
                      <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                        <h4 className="font-semibold text-green-800 mb-2">Data Overlays</h4>
                        <p className="text-sm text-green-700">Toggle ClinVar, gnomAD, and function score layers</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="faq">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card className="bg-white border border-slate-200 shadow-sm">
                <CardHeader>
                  <CardTitle>General Questions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <h4 className="font-semibold text-slate-800 mb-2">What are snRNAs?</h4>
                    <p className="text-sm text-slate-600">
                      Small nuclear RNAs (snRNAs) are RNA components of the spliceosome, a large complex that removes
                      introns from RNA transcripts. They are essential for proper mRNA processing.
                    </p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <h4 className="font-semibold text-slate-800 mb-2">How do I search for a specific variant?</h4>
                    <p className="text-sm text-slate-600">
                      Use the search bar on the home page. You can search by gene name (e.g., RNU4-2),
                      HGVS notation (e.g., n.76C&gt;T), or genomic coordinates.
                    </p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <h4 className="font-semibold text-slate-800 mb-2">Is RNUdb free to use?</h4>
                    <p className="text-sm text-slate-600">
                      Yes, RNUdb is freely accessible for browsing. Curators and administrators require
                      an account which can be requested by contacting the site administrators.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border border-slate-200 shadow-sm">
                <CardHeader>
                  <CardTitle>Curator Questions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold text-blue-800 mb-2">How do I get curator access?</h4>
                    <p className="text-sm text-blue-700">
                      Sign in to RNUdb and navigate to the Curate section. If you don't have curator
                      permissions, you'll see an option to request access. An administrator will review your request.
                    </p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold text-blue-800 mb-2">What format should my CSV be in?</h4>
                    <p className="text-sm text-blue-700">
                      The CSV should have headers matching the required columns: gene_id, position, ref, alt,
                      and optionally hgvs and clinical_significance. See the Importing Variants tab for full details.
                    </p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold text-blue-800 mb-2">Can I edit existing variants?</h4>
                    <p className="text-sm text-blue-700">
                      Yes, in the Curate dashboard, click on a variant to view its details and make edits.
                      Changes are saved automatically and tracked in the audit log.
                    </p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold text-blue-800 mb-2">What are BED tracks?</h4>
                    <p className="text-sm text-blue-700">
                      BED tracks allow you to display custom genomic regions on the RNA structure viewer.
                      They're useful for showing conservation, regulatory elements, or other annotation data.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border border-slate-200 shadow-sm lg:col-span-2">
                <CardHeader>
                  <CardTitle>Technical Questions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 rounded-lg">
                      <h4 className="font-semibold text-slate-800 mb-2">How do I use the API?</h4>
                      <p className="text-sm text-slate-600 mb-2">
                        See the API Documentation page for endpoints, authentication, and example code.
                      </p>
                      <a href="/api-docs" className="text-sm text-teal-600 hover:underline flex items-center gap-1">
                        View API Docs <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-lg">
                      <h4 className="font-semibold text-slate-800 mb-2">Why don't some variants show up in my search?</h4>
                      <p className="text-sm text-slate-600">
                        Variants may not be indexed if they haven't been imported yet. If you're a curator,
                        try importing the variant via CSV. Otherwise, contact the team to request addition.
                      </p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-lg">
                      <h4 className="font-semibold text-slate-800 mb-2">How often is the data updated?</h4>
                      <p className="text-sm text-slate-600">
                        Variant data from gnomAD and ClinVar is refreshed periodically. Curators can add
                        new variants at any time. Literature links are updated when new papers are published.
                      </p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-lg">
                      <h4 className="font-semibold text-slate-800 mb-2">Can I download the entire database?</h4>
                      <p className="text-sm text-slate-600">
                        For bulk data access, use the public API with appropriate rate limits, or contact
                        an administrator for dataset exports. API documentation provides download endpoints.
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

export default HowToUse;