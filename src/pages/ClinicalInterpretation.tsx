import {
  Stethoscope,
  AlertTriangle,
  ChevronRight,
  BookOpen,
  FileText,
  Dna,
  Lightbulb,
} from "lucide-react";
import React, { useState } from "react";
import Footer from "../components/Footer";
import Header from "../components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type TabValue = "overview" | "recommendations" | "examples" | "reference";

const RECOMMENDATIONS = [
  {
    id: 1,
    title: "Validate Variant Calls",
    description:
      "Due to read mapping complexities with paralogous genes, carefully assess read data and QC metrics. Perform orthogonal validation if any ambiguity.",
    acmg: "P",
    severity: "critical",
  },
  {
    id: 2,
    title: "Use Updated Transcripts",
    description:
      "Use the most recent transcript definitions for annotation. Historical mis-annotation is common (e.g., RNU4-2 was 141nt, now 145nt). Match coordinates across resources.",
    acmg: "PM",
    severity: "high",
  },
  {
    id: 3,
    title: "Be Cautious with De Novo Variants",
    description:
      "snRNA genes have elevated mutation rates. Rare de novo variants should not be classified as LP without additional evidence. Consider both dominant AND recessive contexts.",
    acmg: "PS2",
    severity: "critical",
  },
  {
    id: 4,
    title: "Handle Biallelic Variants Carefully",
    description:
      "When applying PM3 (in trans), do not give points if the variant in trans is VUS. Phase must be confirmed to apply any evidence.",
    acmg: "PM3",
    severity: "high",
  },
  {
    id: 5,
    title: "Attempt Read-Based Phasing",
    description:
      "The high variant density in snRNAs enables phasing. Use second variants on same/alternate reads to determine haplotype and parental origin.",
    acmg: "PP1",
    severity: "medium",
  },
  {
    id: 6,
    title: "Use In Silico Tools with Caution",
    description:
      "Current tools (CADD, etc.) are NOT calibrated for snRNAs. They perform poorly - CADD thresholds that capture pathogenic variants also flag 55-62% of population variants as deleterious.",
    acmg: "PP3/BP4",
    severity: "critical",
  },
  {
    id: 7,
    title: "Apply PM1 for Hotspot Regions",
    description:
      "Pathogenic variants cluster in specific regions (T-loop, Stem III, Sm binding site). These can be considered mutational hotspots / critical functional domains.",
    acmg: "PM1",
    severity: "medium",
  },
  {
    id: 8,
    title: "Use Paralog Evidence (PM5)",
    description:
      "When two genes/analogs both cause disease with same mechanism, a pathogenic variant in one can evidence an equivalent variant in the other.",
    acmg: "PM5",
    severity: "medium",
  },
];

const EXAMPLES = [
  {
    id: 1,
    gene: "RNU4-2",
    variant: "n.76C>T",
    position: "chr12:120291828 G>A",
    inheritance: "Heterozygous",
    phenotype:
      "Moderate global developmental delay and intellectual disability",
    classification: "Pathogenic",
    criteria: ["PS2_VeryStrong", "PM1", "PS3_Mod"],
    reasoning: [
      "Variant in Stem III region - enriched for ReNU syndrome variants (PM1)",
      "SGE functional data: score of -0.35 calibrated as moderate evidence (PS3_Mod)",
      "Identified in 17 individuals (7 Chen et al. + 10 Nava et al.), 15 confirmed de novo (PS2_VeryStrong)",
      "Phenotype consistent with gene but not highly specific",
    ],
    conclusion: "Pathogenic",
  },
  {
    id: 2,
    gene: "RNU2-2",
    variant: "n.25G>A",
    position: "chr11:62841785 C-T",
    inheritance: "Homozygous",
    phenotype: "Intellectual disability and seizures",
    classification: "VUS",
    criteria: ["PM1", "PM3", "PM2_supp"],
    reasoning: [
      "Variant in 5' region - enriched for recessive NDD variants (PM1)",
      "3 homozygous individuals in published cohorts (PM3)",
      "No points for compound heterozygous individuals (both variants are VUS)",
      "Rare in population, no homozygous individuals identified (PM2_supp)",
      "If RNA-seq showed reduced RNU2-2 expression, could apply PP4",
    ],
    conclusion: "VUS",
  },
  {
    id: 3,
    gene: "RNU2-2",
    variant: "n.45C>T + n.100T>C",
    position: "Compound heterozygous",
    inheritance: "Paternal n.45C>T, Maternal n.100T>C",
    phenotype: "Two affected sibs in 3 families",
    classification: "Likely Pathogenic",
    criteria: ["PS4_mod", "PM3", "PM1", "PP1"],
    reasoning: [
      "n.45C>T: 16 unrelated affected individuals (PS4_mod)",
      "n.45C>T: Reported with LP variant in trans (PM3)",
      "n.45C>T: Segregation in 2 affected sibs in 3 families (PP1)",
      "n.100T>C: 6 unrelated affected individuals (PS4_mod)",
      "n.100T>C: Located in Sm site (PM1)",
      "n.100T>C: In trans with LP variant (PM3)",
    ],
    conclusion: "Likely Pathogenic",
  },
];

const CRITICAL_REGIONS = [
  {
    gene: "RNU2-2",
    inheritance: "Recessive",
    region: "5' region",
    nucleotides: "n.1-67",
  },
  {
    gene: "RNU4-2",
    inheritance: "Dominant",
    region: "T-loop",
    nucleotides: "n.62-70",
  },
  {
    gene: "RNU4-2",
    inheritance: "Dominant",
    region: "Stem III",
    nucleotides: "n.75-78",
  },
  {
    gene: "RNU4-2",
    inheritance: "Recessive",
    region: "Stem II",
    nucleotides: "n.3-16",
  },
  {
    gene: "RNU4-2",
    inheritance: "Recessive",
    region: "K-turn",
    nucleotides: "n.27-35, n.41-46",
  },
  {
    gene: "RNU4-2",
    inheritance: "Recessive",
    region: "Sm binding site",
    nucleotides: "n.118-126",
  },
  {
    gene: "RNU5B-1",
    inheritance: "Dominant",
    region: "5' stem loop I",
    nucleotides: "n.37-44",
  },
  {
    gene: "RNU4ATAC",
    inheritance: "Recessive",
    region: "Stem II",
    nucleotides: "n.3-19",
  },
  {
    gene: "RNU4ATAC",
    inheritance: "Recessive",
    region: "5' stem-loop",
    nucleotides: "n.26-57",
  },
  {
    gene: "RNU4ATAC",
    inheritance: "Recessive",
    region: "Sm binding site",
    nucleotides: "n.116-124",
  },
];

const ACMG_CODES = [
  {
    code: "PS2",
    name: "Very Strong",
    description: "De novo, confirmed maternity and paternity",
  },
  {
    code: "PS4",
    name: "Strong",
    description: "Increased prevalence in affected individuals",
  },
  {
    code: "PM1",
    name: "Moderate",
    description: "Located in mutational hotspot/critical domain",
  },
  {
    code: "PM2",
    name: "Moderate",
    description: "Absent from controls (PM2_supp for snRNAs)",
  },
  {
    code: "PM3",
    name: "Moderate",
    description: "In trans with another pathogenic variant",
  },
  {
    code: "PM5",
    name: "Moderate",
    description: "Novel missense at same position as known pathogenic",
  },
  {
    code: "PM6",
    name: "Moderate",
    description: "De novo, maternity and paternity unconfirmed",
  },
  {
    code: "PP1",
    name: "Supporting",
    description: "Co-segregation with disease in family",
  },
  {
    code: "PP3",
    name: "Supporting",
    description: "Computational evidence (NOT validated for snRNAs)",
  },
  {
    code: "PP4",
    name: "Supporting",
    description: "Patient phenotype matches gene specificity",
  },
  {
    code: "PS3",
    name: "Strong",
    description: "Functional studies (e.g., SGE for RNU4-2)",
  },
  {
    code: "BP4",
    name: "Supporting",
    description: "Computational evidence favors benign (NOT validated)",
  },
];

const DISEASE_ASSOCIATIONS = [
  {
    category: "Dominant NDD",
    genes: "RNU4-2 (ReNU syndrome), RNU2-2, RNU5B-1",
  },
  { category: "Recessive NDD", genes: "RNU4-2, RNU2-2, RNU12, RNU4ATAC" },
  {
    category: "Retinitis Pigmentosa",
    genes: "RNU4-2, RNU6-1, RNU6-2, RNU6-8, RNU6-9",
  },
  {
    category: "Other Syndromes",
    genes: "RNU4ATAC (MOPD1, Roifman, Lowry-Wood), RNU6ATAC (Multi-system)",
  },
];

const ClinicalInterpretation: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabValue>("overview");
  const [selectedExample, setSelectedExample] = useState(0);

  const tabs: { value: TabValue; label: string; icon: React.ReactNode }[] = [
    {
      value: "overview",
      label: "Overview",
      icon: <BookOpen className="h-4 w-4 inline mr-2" />,
    },
    {
      value: "recommendations",
      label: "Recommendations",
      icon: <Lightbulb className="h-4 w-4 inline mr-2" />,
    },
    {
      value: "examples",
      label: "Examples",
      icon: <FileText className="h-4 w-4 inline mr-2" />,
    },
    {
      value: "reference",
      label: "Reference",
      icon: <Dna className="h-4 w-4 inline mr-2" />,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header showSearch={false} />

      <div className="bg-gradient-to-br from-teal-700 via-teal-800 to-teal-900 text-white">
        <div className="max-w-7xl mx-auto px-6 py-16 pt-24">
          <div className="flex items-center gap-3 mb-4">
            <Stethoscope className="h-8 w-8 text-teal-300" />
          </div>
          <h1 className="text-4xl font-bold mb-3">
            Clinical Variant Classification
          </h1>
          <p className="text-teal-100 text-lg max-w-2xl">
            Guidance for clinical variant classification in genes for
            spliceosomal small nuclear RNAs
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10 w-full flex-1">
        <div className="flex items-center gap-1 p-1.5 bg-slate-200 rounded-xl w-fit mb-10">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`px-5 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                activeTab === tab.value
                  ? "bg-white text-teal-600 shadow-md"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "overview" && (
          <div className="space-y-10">
            <div>
              <h2 className="text-2xl font-bold text-slate-800 mb-5">
                What are snRNAs?
              </h2>
              <p className="text-slate-600 text-lg leading-relaxed mb-8">
                Small nuclear RNAs (snRNAs) are RNA components of the
                spliceosome - a large complex that removes introns from RNA
                transcripts. Humans have two spliceosomes: Major (&gt;99% of
                introns) and Minor (~800 introns).
              </p>
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="bg-white border border-slate-200 shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-4 h-4 rounded-full bg-teal-500"></div>
                      <h3 className="font-semibold text-slate-800 text-lg">
                        Major Spliceosome snRNAs
                      </h3>
                    </div>
                    <ul className="text-slate-600 text-base space-y-2">
                      <li className="flex items-start gap-2">
                        <span className="text-teal-500 mt-1">•</span>
                        U1, U2, U4, U6 - function only here
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-teal-500 mt-1">•</span>
                        U5 - functions in both
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-teal-500 mt-1">•</span>
                        Multiple gene copies exist (paralogs)
                      </li>
                    </ul>
                  </CardContent>
                </Card>
                <Card className="bg-white border border-slate-200 shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-4 h-4 rounded-full bg-teal-600"></div>
                      <h3 className="font-semibold text-slate-800 text-lg">
                        Minor Spliceosome snRNAs
                      </h3>
                    </div>
                    <ul className="text-slate-600 text-base space-y-2">
                      <li className="flex items-start gap-2">
                        <span className="text-teal-500 mt-1">•</span>
                        U11, U12, U4atac, U6atac
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-teal-500 mt-1">•</span>
                        U5 - shared component
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-teal-500 mt-1">•</span>
                        Single copy genes (no paralogs)
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-slate-800 mb-5">
                Key Challenges
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                {[
                  {
                    title: "Exome Sequencing Gaps",
                    desc: "Standard exome capture does not target snRNA genes. Requires genome sequencing or targeted approaches.",
                  },
                  {
                    title: "High Sequence Similarity",
                    desc: "snRNA genes have paralogs with up to 100% sequence identity. Causes read mapping issues.",
                  },
                  {
                    title: "Gene Annotation Problems",
                    desc: "Historical mis-annotations common. RNU4-2 was 141nt, now 145nt.",
                  },
                  {
                    title: "Elevated Mutation Rate",
                    desc: "snRNA genes have ~50x higher mutation rate. Many de novo variants will be benign.",
                  },
                  {
                    title: "In Silico Tools Unreliable",
                    desc: "CADD NOT calibrated for snRNAs. Thresholds capture 55-62% of population variants as deleterious.",
                  },
                  {
                    title: "Complex Inheritance",
                    desc: "Major spliceosome snRNAs can be dominant or recessive. Minor are always recessive.",
                  },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-white border border-slate-200 p-5 shadow-sm rounded-lg"
                  >
                    <h4 className="font-semibold text-slate-800 text-base mb-2">
                      {idx + 1}. {item.title}
                    </h4>
                    <p className="text-slate-500 text-base leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-slate-800 mb-5">
                Critical Pathogenic Regions
              </h2>
              <Card className="bg-white border border-slate-200 shadow-sm">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b-2 border-slate-200 bg-slate-100">
                          <th className="text-left py-4 px-5 font-semibold text-slate-700">
                            Gene
                          </th>
                          <th className="text-left py-4 px-5 font-semibold text-slate-700">
                            Inheritance
                          </th>
                          <th className="text-left py-4 px-5 font-semibold text-slate-700">
                            Region
                          </th>
                          <th className="text-left py-4 px-5 font-semibold text-slate-700">
                            Nucleotides
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {CRITICAL_REGIONS.map((region, idx) => (
                          <tr
                            key={idx}
                            className="border-b border-slate-100 hover:bg-slate-50"
                          >
                            <td className="py-4 px-5 font-mono text-slate-800">
                              {region.gene}
                            </td>
                            <td className="py-4 px-5">
                              <span
                                className={`text-sm px-3 py-1.5 rounded-full font-medium ${
                                  region.inheritance === "Dominant"
                                    ? "bg-teal-100 text-teal-700"
                                    : "bg-slate-200 text-slate-700"
                                }`}
                              >
                                {region.inheritance}
                              </span>
                            </td>
                            <td className="py-4 px-5 text-slate-600">
                              {region.region}
                            </td>
                            <td className="py-4 px-5 font-mono text-slate-500">
                              {region.nucleotides}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === "recommendations" && (
          <div className="space-y-5">
            <div className="grid md:grid-cols-2 gap-5">
              {RECOMMENDATIONS.map((rec) => (
                <Card
                  key={rec.id}
                  className="bg-white border border-slate-200 shadow-sm"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg shrink-0 ${
                          rec.severity === "critical"
                            ? "bg-red-100 text-red-600"
                            : rec.severity === "high"
                              ? "bg-amber-100 text-amber-600"
                              : "bg-teal-100 text-teal-600"
                        }`}
                      >
                        {rec.id}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-semibold text-slate-800 text-lg">
                            {rec.title}
                          </h4>
                        </div>
                        <p className="text-slate-500 text-base leading-relaxed mb-3">
                          {rec.description}
                        </p>
                        <span className="inline-block text-sm font-mono text-teal-600 bg-teal-50 px-3 py-1 rounded-md">
                          {rec.acmg}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="bg-white border-l-4 border-l-amber-500 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <AlertTriangle className="h-6 w-6 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-slate-800 text-lg mb-2">
                      Important Note on De Novo Variants
                    </h4>
                    <p className="text-slate-600 text-base">
                      Do NOT classify rare de novo variants as Likely Pathogenic
                      without additional evidence. snRNA genes have an elevated
                      mutation rate. Apply de novo criteria at "phenotype
                      consistent" level.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "examples" && (
          <div className="grid lg:grid-cols-5 gap-8">
            <div className="lg:col-span-2 space-y-3">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">
                Select Example
              </h3>
              {EXAMPLES.map((example, idx) => (
                <button
                  key={example.id}
                  onClick={() => setSelectedExample(idx)}
                  className={`w-full text-left p-5 rounded-xl border transition-all ${
                    selectedExample === idx
                      ? "bg-white border-teal-300 shadow-md ring-1 ring-teal-100"
                      : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-slate-800 text-lg">
                        {example.gene}
                      </span>
                      <span className="text-slate-400">·</span>
                      <span className="font-mono text-slate-600">
                        {example.variant}
                      </span>
                    </div>
                    <span
                      className={`text-sm font-medium px-3 py-1 rounded-full ${
                        example.classification === "Pathogenic"
                          ? "bg-red-100 text-red-700"
                          : example.classification === "Likely Pathogenic"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {example.classification}
                    </span>
                  </div>
                  <div className="text-slate-500">{example.inheritance}</div>
                </button>
              ))}
            </div>

            <div className="lg:col-span-3">
              {EXAMPLES[selectedExample] && (
                <Card className="bg-white border border-slate-200 shadow-sm">
                  <CardHeader className="pb-5 border-b border-slate-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-xl text-slate-800">
                          {EXAMPLES[selectedExample].gene}{" "}
                          {EXAMPLES[selectedExample].variant}
                        </h3>
                        <p className="text-slate-500 font-mono mt-1">
                          {EXAMPLES[selectedExample].position}
                        </p>
                      </div>
                      <span
                        className={`text-base font-semibold px-4 py-2 rounded-full ${
                          EXAMPLES[selectedExample].classification ===
                          "Pathogenic"
                            ? "bg-red-100 text-red-700"
                            : EXAMPLES[selectedExample].classification ===
                                "Likely Pathogenic"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {EXAMPLES[selectedExample].classification}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-2">
                          Inheritance
                        </h4>
                        <p className="text-slate-700 text-lg">
                          {EXAMPLES[selectedExample].inheritance}
                        </p>
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-2">
                          Phenotype
                        </h4>
                        <p className="text-slate-700 text-lg">
                          {EXAMPLES[selectedExample].phenotype}
                        </p>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">
                        Applied Criteria
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {EXAMPLES[selectedExample].criteria.map((c) => (
                          <span
                            key={c}
                            className="text-sm font-mono text-teal-600 bg-teal-50 px-3 py-1.5 rounded-md"
                          >
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">
                        Reasoning
                      </h4>
                      <ul className="space-y-3">
                        {EXAMPLES[selectedExample].reasoning.map(
                          (reason, idx) => (
                            <li
                              key={idx}
                              className="flex items-start gap-3 text-slate-600 text-base"
                            >
                              <ChevronRight className="h-5 w-5 text-teal-500 shrink-0 mt-0.5" />
                              {reason}
                            </li>
                          ),
                        )}
                      </ul>
                    </div>

                    <div className="pt-5 border-t border-slate-200 flex items-center justify-between">
                      <span className="text-lg font-semibold text-slate-600">
                        Classification
                      </span>
                      <span className="text-xl font-bold text-slate-800">
                        {EXAMPLES[selectedExample].classification}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}

        {activeTab === "reference" && (
          <div className="grid lg:grid-cols-2 gap-8">
            <Card className="bg-white border border-slate-200 shadow-sm">
              <CardHeader className="pb-4 border-b border-slate-100">
                <CardTitle className="text-xl font-semibold text-slate-800">
                  ACMG Evidence Codes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-3 px-4 font-semibold text-slate-700">
                          Code
                        </th>
                        <th className="text-left py-3 px-4 font-semibold text-slate-700">
                          Strength
                        </th>
                        <th className="text-left py-3 px-4 font-semibold text-slate-700">
                          Description
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {ACMG_CODES.map((code) => (
                        <tr
                          key={code.code}
                          className="border-b border-slate-100"
                        >
                          <td className="py-3 px-4 font-mono text-teal-600 font-medium">
                            {code.code}
                          </td>
                          <td className="py-3 px-4 text-slate-600">
                            {code.name}
                          </td>
                          <td className="py-3 px-4 text-slate-500">
                            {code.description}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border border-slate-200 shadow-sm">
              <CardHeader className="pb-4 border-b border-slate-100">
                <CardTitle className="text-xl font-semibold text-slate-800">
                  Disease Associations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {DISEASE_ASSOCIATIONS.map((assoc, idx) => (
                  <div
                    key={idx}
                    className="p-4 border border-slate-100 rounded-lg bg-slate-50"
                  >
                    <div className="font-semibold text-slate-800 text-base mb-1">
                      {assoc.category}
                    </div>
                    <div className="text-slate-500">{assoc.genes}</div>
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

export default ClinicalInterpretation;
