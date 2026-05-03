import {
  BookOpen,
  Search,
  Dna,
  Layers,
  Download,
  CheckCircle2,
  AlertTriangle,
  User,
  Users,
  Settings,
  ChevronRight,
  FileText,
  HelpCircle,
  Key,
} from "lucide-react";
import React, { useState } from "react";
import Footer from "../components/Footer";
import Header from "../components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type TabValue = "getting-started" | "guides" | "navigation" | "faq";

const HowToUse: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabValue>("getting-started");

  const tabs: { value: TabValue; label: string; icon: React.ReactNode }[] = [
    {
      value: "getting-started",
      label: "Getting Started",
      icon: <BookOpen className="h-4 w-4 inline mr-2" />,
    },
    {
      value: "guides",
      label: "Guides",
      icon: <FileText className="h-4 w-4 inline mr-2" />,
    },

    {
      value: "faq",
      label: "FAQ",
      icon: <HelpCircle className="h-4 w-4 inline mr-2" />,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header showSearch={false} />

      <div className="bg-gradient-to-br from-teal-700 via-teal-800 to-teal-900 text-white">
        <div className="max-w-7xl mx-auto px-6 py-16 pt-24">
          <div className="flex items-center gap-3 mb-4">
            <BookOpen className="h-8 w-8 text-teal-300" />
          </div>
          <h1 className="text-4xl font-bold mb-3">How to Use RNUdb</h1>
          <p className="text-teal-100 text-lg max-w-2xl">
            A comprehensive guide to navigating RNUdb, searching for variants,
            and managing data
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10 w-full flex-1">
        <div className="flex items-center gap-1 p-1.5 bg-slate-100 rounded-lg w-fit mb-8">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                activeTab === tab.value
                  ? "bg-white text-teal-600 shadow-sm"
                  : "text-slate-600 hover:text-slate-800 hover:bg-slate-50"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "getting-started" && (
          <div className="space-y-8">
            <div className="grid lg:grid-cols-3 gap-6">
              <Card className="bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-xl bg-teal-100 flex items-center justify-center mb-5">
                    <Search className="h-6 w-6 text-teal-600" />
                  </div>
                  <h3 className="font-semibold text-slate-800 text-xl mb-3">
                    Search Genes
                  </h3>
                  <p className="text-slate-500 text-base leading-relaxed">
                    Use the search bar on the home page to find snRNA genes by
                    name or variant notation.
                  </p>
                  <div className="mt-4 text-sm text-teal-600 font-mono bg-teal-50 px-3 py-2 rounded-lg inline-block">
                    Try: RNU4-2, RNU2-2
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-xl bg-teal-100 flex items-center justify-center mb-5">
                    <Dna className="h-6 w-6 text-teal-600" />
                  </div>
                  <h3 className="font-semibold text-slate-800 text-xl mb-3">
                    View Structures
                  </h3>
                  <p className="text-slate-500 text-base leading-relaxed">
                    Each gene page displays the RNA secondary structure. Hover
                    over nucleotides to see associated variants.
                  </p>
                  <div className="mt-4 text-sm text-teal-600 bg-teal-50 px-3 py-2 rounded-lg inline-block">
                    Interactive nucleotide-level detail
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-xl bg-teal-100 flex items-center justify-center mb-5">
                    <Layers className="h-6 w-6 text-teal-600" />
                  </div>
                  <h3 className="font-semibold text-slate-800 text-xl mb-3">
                    Data Overlays
                  </h3>
                  <p className="text-slate-500 text-base leading-relaxed">
                    Toggle ClinVar, gnomAD, or function score overlays to
                    identify potentially pathogenic variants.
                  </p>
                  <div className="mt-4 text-sm text-teal-600 bg-teal-50 px-3 py-2 rounded-lg inline-block">
                    Multiple annotation layers
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-white border-l-4 border-l-teal-500 shadow-sm rounded-lg">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <AlertTriangle className="h-6 w-6 text-teal-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-slate-800 text-lg mb-2">
                      Note on Data Sources
                    </h4>
                    <p className="text-slate-600 text-base">
                      RNUdb aggregates data from gnomAD, ClinVar, and published
                      literature. Variant classifications reflect current
                      knowledge and may change as new evidence emerges.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "guides" && (
          <div className="space-y-6">
            <Card className="bg-white border border-slate-200 shadow-sm">
              <CardHeader className="pb-5 border-b border-slate-100">
                <CardTitle className="flex items-center gap-3 text-xl font-semibold text-slate-800">
                  <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center">
                    <User className="h-5 w-5 text-teal-600" />
                  </div>
                  Public User Guide
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-5 space-y-5">
                <p className="text-slate-600 text-lg">
                  Browse RNUdb without an account. Here&apos;s how to get
                  started:
                </p>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="p-5 border border-slate-200 rounded-xl hover:border-teal-200 transition-colors">
                    <h4 className="font-semibold text-slate-800 text-lg mb-2 flex items-center gap-2">
                      <span className="w-8 h-8 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center text-sm font-bold">
                        1
                      </span>
                      Browse Genes
                    </h4>
                    <p className="text-slate-500 text-base">
                      Use the home page search to find snRNA genes by name or
                      variant notation.
                    </p>
                  </div>
                  <div className="p-5 border border-slate-200 rounded-xl hover:border-teal-200 transition-colors">
                    <h4 className="font-semibold text-slate-800 text-lg mb-2 flex items-center gap-2">
                      <span className="w-8 h-8 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center text-sm font-bold">
                        2
                      </span>
                      View Gene Page
                    </h4>
                    <p className="text-slate-500 text-base">
                      Each gene page shows the RNA secondary structure with
                      interactive detail.
                    </p>
                  </div>
                  <div className="p-5 border border-slate-200 rounded-xl hover:border-teal-200 transition-colors">
                    <h4 className="font-semibold text-slate-800 text-lg mb-2 flex items-center gap-2">
                      <span className="w-8 h-8 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center text-sm font-bold">
                        3
                      </span>
                      Access Literature
                    </h4>
                    <p className="text-slate-500 text-base">
                      Click on variants to see linked research publications with
                      citation counts.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border border-slate-200 shadow-sm">
              <CardHeader className="pb-5 border-b border-slate-100">
                <CardTitle className="flex items-center gap-3 text-xl font-semibold text-slate-800">
                  <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center">
                    <Users className="h-5 w-5 text-teal-600" />
                  </div>
                  Curator Guide
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-5 space-y-6">
                <p className="text-slate-600 text-lg">
                  Curators manage variants and literature. Requires sign-in and
                  curator permissions.
                </p>

                <div>
                  <h4 className="font-semibold text-slate-800 text-lg mb-4 flex items-center gap-2">
                    <Key className="h-5 w-5 text-teal-500" />
                    Importing Variants via CSV
                  </h4>
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-100">
                          <th className="text-left py-4 px-5 font-semibold text-slate-700">
                            Column
                          </th>
                          <th className="text-left py-4 px-5 font-semibold text-slate-700">
                            Required
                          </th>
                          <th className="text-left py-4 px-5 font-semibold text-slate-700">
                            Description
                          </th>
                          <th className="text-left py-4 px-5 font-semibold text-slate-700">
                            Example
                          </th>
                        </tr>
                      </thead>
                      <tbody className="text-slate-600">
                        <tr className="border-b border-slate-100">
                          <td className="py-4 px-5 font-mono text-base">
                            gene_id
                          </td>
                          <td className="py-4 px-5">
                            <CheckCircle2 className="h-5 w-5 text-teal-500" />
                          </td>
                          <td className="py-4 px-5 text-base">
                            snRNA gene name
                          </td>
                          <td className="py-4 px-5 font-mono text-base">
                            RNU4-2
                          </td>
                        </tr>
                        <tr className="border-b border-slate-100">
                          <td className="py-4 px-5 font-mono text-base">
                            position
                          </td>
                          <td className="py-4 px-5">
                            <CheckCircle2 className="h-5 w-5 text-teal-500" />
                          </td>
                          <td className="py-4 px-5 text-base">
                            Genomic position (chr:pos)
                          </td>
                          <td className="py-4 px-5 font-mono text-base">
                            chr12:120291828
                          </td>
                        </tr>
                        <tr className="border-b border-slate-100">
                          <td className="py-4 px-5 font-mono text-base">ref</td>
                          <td className="py-4 px-5">
                            <CheckCircle2 className="h-5 w-5 text-teal-500" />
                          </td>
                          <td className="py-4 px-5 text-base">
                            Reference allele
                          </td>
                          <td className="py-4 px-5 font-mono text-base">G</td>
                        </tr>
                        <tr className="border-b border-slate-100">
                          <td className="py-4 px-5 font-mono text-base">alt</td>
                          <td className="py-4 px-5">
                            <CheckCircle2 className="h-5 w-5 text-teal-500" />
                          </td>
                          <td className="py-4 px-5 text-base">
                            Alternate allele
                          </td>
                          <td className="py-4 px-5 font-mono text-base">A</td>
                        </tr>
                        <tr>
                          <td className="py-4 px-5 font-mono text-base text-slate-400">
                            hgvs
                          </td>
                          <td className="py-4 px-5 text-slate-400">Optional</td>
                          <td className="py-4 px-5 text-base">HGVS notation</td>
                          <td className="py-4 px-5 font-mono text-base">
                            n.76C&gt;T
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-slate-800 text-lg mb-4">
                    Import Process
                  </h4>
                  <div className="grid md:grid-cols-5 gap-3">
                    {[
                      {
                        step: 1,
                        title: "Navigate to Curate",
                        desc: 'Click "Curate" in the navigation bar after signing in',
                      },
                      {
                        step: 2,
                        title: "Select Variants Tab",
                        desc: 'Click on "Variants" to access the management interface',
                      },
                      {
                        step: 3,
                        title: 'Click "Import CSV"',
                        desc: 'Locate the "Import CSV" button at the top of the section',
                      },
                      {
                        step: 4,
                        title: "Select Your CSV File",
                        desc: "Choose the CSV file from your computer",
                      },
                      {
                        step: 5,
                        title: "Review and Confirm",
                        desc: "Preview the imported variants and confirm",
                      },
                    ].map((item) => (
                      <div
                        key={item.step}
                        className="flex flex-col items-center text-center p-4 bg-slate-50 rounded-xl"
                      >
                        <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center font-bold text-lg mb-3">
                          {item.step}
                        </div>
                        <h5 className="font-semibold text-slate-700 text-sm mb-1">
                          {item.title}
                        </h5>
                        <p className="text-xs text-slate-500">{item.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                  <Download className="h-5 w-5 text-teal-500" />
                  <p className="text-slate-600 text-base">
                    Use "Export CSV" in the Curate dashboard to download
                    variants.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border border-slate-200 shadow-sm">
              <CardHeader className="pb-5 border-b border-slate-100">
                <CardTitle className="flex items-center gap-3 text-xl font-semibold text-slate-800">
                  <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center">
                    <Settings className="h-5 w-5 text-teal-600" />
                  </div>
                  Admin Guide
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-5">
                <p className="text-slate-600 text-lg mb-5">
                  Admins have full control over database content and user
                  management.
                </p>
                <div className="grid md:grid-cols-2 gap-5">
                  <div className="p-5 border border-slate-200 rounded-xl bg-slate-50">
                    <h4 className="font-semibold text-slate-800 text-lg mb-3">
                      User Management
                    </h4>
                    <ul className="text-slate-500 text-base space-y-2">
                      <li className="flex items-start gap-2">
                        <ChevronRight className="h-4 w-4 text-teal-500 mt-1.5 shrink-0" />{" "}
                        Manage user accounts and permissions
                      </li>
                      <li className="flex items-start gap-2">
                        <ChevronRight className="h-4 w-4 text-teal-500 mt-1.5 shrink-0" />{" "}
                        Approve or reject curator access requests
                      </li>
                      <li className="flex items-start gap-2">
                        <ChevronRight className="h-4 w-4 text-teal-500 mt-1.5 shrink-0" />{" "}
                        View user activity and audit logs
                      </li>
                    </ul>
                  </div>
                  <div className="p-5 border border-slate-200 rounded-xl bg-slate-50">
                    <h4 className="font-semibold text-slate-800 text-lg mb-3">
                      Data Management
                    </h4>
                    <ul className="text-slate-500 text-base space-y-2">
                      <li className="flex items-start gap-2">
                        <ChevronRight className="h-4 w-4 text-teal-500 mt-1.5 shrink-0" />{" "}
                        Bulk import and export data
                      </li>
                      <li className="flex items-start gap-2">
                        <ChevronRight className="h-4 w-4 text-teal-500 mt-1.5 shrink-0" />{" "}
                        Configure system settings
                      </li>
                      <li className="flex items-start gap-2">
                        <ChevronRight className="h-4 w-4 text-teal-500 mt-1.5 shrink-0" />{" "}
                        Manage API keys and rate limits
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "faq" && (
          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="bg-white border border-slate-200 shadow-sm rounded-lg">
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="text-base font-semibold text-slate-800">
                  General Questions
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                {[
                  {
                    q: "What are snRNAs?",
                    a: "Small nuclear RNAs are RNA components of the spliceosome, a complex that removes introns from RNA transcripts.",
                  },
                  {
                    q: "How do I search for a specific variant?",
                    a: "Use the search bar on the home page by gene name, HGVS notation, or genomic coordinates.",
                  },
                  {
                    q: "Is RNUdb free to use?",
                    a: "Yes, RNUdb is freely accessible for browsing. Curators and administrators require an account.",
                  },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 border border-slate-100 rounded-lg bg-slate-50"
                  >
                    <h4 className="font-semibold text-slate-800 text-sm mb-1">
                      {item.q}
                    </h4>
                    <p className="text-slate-500 text-sm">{item.a}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="bg-white border border-slate-200 shadow-sm rounded-lg">
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="text-base font-semibold text-slate-800">
                  Curator Questions
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                {[
                  {
                    q: "How do I get curator access?",
                    a: "Sign in and navigate to the Curate section. Request access if you don't have permissions.",
                  },
                  {
                    q: "What format should my CSV be in?",
                    a: "Headers should include: gene_id, position, ref, alt, and optionally hgvs.",
                  },
                  {
                    q: "Can I edit existing variants?",
                    a: "Yes, click on a variant in the Curate dashboard to view and edit its details.",
                  },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 border border-slate-100 rounded-lg bg-slate-50"
                  >
                    <h4 className="font-semibold text-slate-800 text-sm mb-1">
                      {item.q}
                    </h4>
                    <p className="text-slate-500 text-sm">{item.a}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default HowToUse;
