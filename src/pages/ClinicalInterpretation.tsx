import React, { useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Stethoscope, 
  AlertTriangle, 
  FileText,
  Lightbulb,
  Dna,
  BookOpen,
  ChevronRight
} from 'lucide-react';

const RECOMMENDATIONS = [
  {
    id: 1,
    title: 'Validate Variant Calls',
    description: 'Due to read mapping complexities with paralogous genes, carefully assess read data and QC metrics. Perform orthogonal validation if any ambiguity.',
    acmg: 'P',
    icon: 'check'
  },
  {
    id: 2,
    title: 'Use Updated Transcripts',
    description: 'Use the most recent transcript definitions for annotation. Historical mis-annotation is common (e.g., RNU4-2 was 141nt, now 145nt). Match coordinates across resources.',
    acmg: 'PM',
    icon: 'file'
  },
  {
    id: 3,
    title: 'Be Cautious with De Novo Variants',
    description: 'snRNA genes have elevated mutation rates. Rare de novo variants should not be classified as LP without additional evidence. Consider both dominant AND recessive contexts.',
    acmg: 'PS2',
    icon: 'alert'
  },
  {
    id: 4,
    title: 'Handle Biallelic Variants Carefully',
    description: 'When applying PM3 (in trans), do not give points if the variant in trans is VUS. Phase must be confirmed to apply any evidence.',
    acmg: 'PM3',
    icon: 'users'
  },
  {
    id: 5,
    title: 'Attempt Read-Based Phasing',
    description: 'The high variant density in snRNA genes enables phasing. Use second variants on same/alternate reads to determine haplotype and parental origin.',
    acmg: 'PP1',
    icon: 'dna'
  },
  {
    id: 6,
    title: 'Use In Silico Tools with Caution',
    description: 'Current tools (CADD, etc.) are NOT calibrated for snRNAs. They perform poorly - CADD thresholds that capture pathogenic variants also flag 55-62% of population variants as deleterious.',
    acmg: 'PP3/BP4',
    icon: 'lightbulb'
  },
  {
    id: 7,
    title: 'Apply PM1 for Hotspot Regions',
    description: 'Pathogenic variants cluster in specific regions (T-loop, Stem III, Sm binding site). These can be considered mutational hotspots / critical functional domains.',
    acmg: 'PM1',
    icon: 'map'
  },
  {
    id: 8,
    title: 'Use Paralog Evidence (PM5)',
    description: 'When two genes/analogs both cause disease with same mechanism, a pathogenic variant in one can evidence an equivalent variant in the other.',
    acmg: 'PM5',
    icon: 'link'
  }
];

const EXAMPLES = [
  {
    id: 1,
    gene: 'RNU4-2',
    variant: 'n.76C>T',
    position: 'chr12:120291828 G>A',
    inheritance: 'Heterozygous',
    phenotype: 'Moderate global developmental delay and intellectual disability',
    classification: 'Pathogenic',
    criteria: ['PS2_VeryStrong', 'PM1', 'PS3_Mod'],
    reasoning: [
      'Variant in Stem III region - enriched for ReNU syndrome variants (PM1)',
      'SGE functional data: score of -0.35 calibrated as moderate evidence (PS3_Mod)',
      'Identified in 17 individuals (7 Chen et al. + 10 Nava et al.), 15 confirmed de novo (PS2_VeryStrong)',
      'Phenotype consistent with gene but not highly specific'
    ],
    conclusion: 'Pathogenic'
  },
  {
    id: 2,
    gene: 'RNU2-2',
    variant: 'n.25G>A',
    position: 'chr11:62841785 C-T',
    inheritance: 'Homozygous',
    phenotype: 'Intellectual disability and seizures',
    classification: 'VUS',
    criteria: ['PM1', 'PM3', 'PM2_supp'],
    reasoning: [
      'Variant in 5\' region - enriched for recessive NDD variants (PM1)',
      '3 homozygous individuals in published cohorts (PM3)',
      'No points for compound heterozygous individuals (both variants are VUS)',
      'Rare in population, no homozygous individuals identified (PM2_supp)',
      'If RNA-seq showed reduced RNU2-2 expression, could apply PP4'
    ],
    conclusion: 'VUS'
  },
  {
    id: 3,
    gene: 'RNU2-2',
    variant: 'n.45C>T + n.100T>C',
    position: 'Compound heterozygous',
    inheritance: 'Paternal n.45C>T, Maternal n.100T>C',
    phenotype: 'Two affected sibs in 3 families',
    classification: 'Likely Pathogenic',
    criteria: ['PS4_mod', 'PM3', 'PM1', 'PP1'],
    reasoning: [
      'n.45C>T: 16 unrelated affected individuals (PS4_mod)',
      'n.45C>T: Reported with LP variant in trans (PM3)',
      'n.45C>T: Segregation in 2 affected sibs in 3 families (PP1)',
      'n.100T>C: 6 unrelated affected individuals (PS4_mod)',
      'n.100T>C: Located in Sm site (PM1)',
      'n.100T>C: In trans with LP variant (PM3)'
    ],
    conclusion: 'Likely Pathogenic'
  }
];

const CRITICAL_REGIONS = [
  { gene: 'RNU2-2', inheritance: 'Recessive', region: "5' region", nucleotides: 'n.1-67' },
  { gene: 'RNU4-2', inheritance: 'Dominant', region: 'T-loop', nucleotides: 'n.62-70' },
  { gene: 'RNU4-2', inheritance: 'Dominant', region: 'Stem III', nucleotides: 'n.75-78' },
  { gene: 'RNU4-2', inheritance: 'Recessive', region: 'Stem II', nucleotides: 'n.3-16' },
  { gene: 'RNU4-2', inheritance: 'Recessive', region: 'K-turn', nucleotides: 'n.27-35, n.41-46' },
  { gene: 'RNU4-2', inheritance: 'Recessive', region: 'Sm binding site', nucleotides: 'n.118-126' },
  { gene: 'RNU5B-1', inheritance: 'Dominant', region: "5' stem loop I", nucleotides: 'n.37-44' },
  { gene: 'RNU4ATAC', inheritance: 'Recessive', region: 'Stem II', nucleotides: 'n.3-19' },
  { gene: 'RNU4ATAC', inheritance: 'Recessive', region: "5' stem-loop", nucleotides: 'n.26-57' },
  { gene: 'RNU4ATAC', inheritance: 'Recessive', region: 'Sm binding site', nucleotides: 'n.116-124' }
];

const ACMG_CODES = [
  { code: 'PS2', name: 'Very Strong', description: 'De novo, confirmed maternity and paternity' },
  { code: 'PS4', name: 'Strong', description: 'Increased prevalence in affected individuals' },
  { code: 'PM1', name: 'Moderate', description: 'Located in mutational hotspot/critical domain' },
  { code: 'PM2', name: 'Moderate', description: 'Absent from controls (PM2_supp for snRNAs)' },
  { code: 'PM3', name: 'Moderate', description: 'In trans with another pathogenic variant' },
  { code: 'PM5', name: 'Moderate', description: 'Novel missense at same position as known pathogenic' },
  { code: 'PM6', name: 'Moderate', description: 'De novo, maternity and paternity unconfirmed' },
  { code: 'PP1', name: 'Supporting', description: 'Co-segregation with disease in family' },
  { code: 'PP3', name: 'Supporting', description: 'Computational evidence (NOT validated for snRNAs)' },
  { code: 'PP4', name: 'Supporting', description: 'Patient phenotype matches gene specificity' },
  { code: 'PS3', name: 'Strong', description: 'Functional studies (e.g., SGE for RNU4-2)' },
  { code: 'BP4', name: 'Supporting', description: 'Computational evidence favors benign (NOT validated)' }
];

const SpliceosomeDiagram: React.FC = () => (
  <svg viewBox="0 0 400 200" className="w-full max-w-md mx-auto">
    <rect x="10" y="10" width="180" height="180" rx="8" fill="#f0fdf4" stroke="#22c55e" strokeWidth="2" />
    <text x="100" y="30" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#166534">Major Spliceosome</text>
    <text x="100" y="55" textAnchor="middle" fontSize="11" fill="#166534">99% of introns</text>
    <g transform="translate(30, 75)">
      <circle cx="20" cy="20" r="15" fill="#22c55e" />
      <text x="20" y="25" textAnchor="middle" fontSize="10" fill="white" fontWeight="bold">U1</text>
      <text x="50" y="25" fontSize="9" fill="#166534">snRNA</text>
    </g>
    <g transform="translate(30, 105)">
      <circle cx="20" cy="20" r="15" fill="#22c55e" />
      <text x="20" y="25" textAnchor="middle" fontSize="10" fill="white" fontWeight="bold">U2</text>
      <text x="50" y="25" fontSize="9" fill="#166534">snRNA</text>
    </g>
    <g transform="translate(30, 135)">
      <circle cx="20" cy="20" r="15" fill="#22c55e" />
      <text x="20" y="25" textAnchor="middle" fontSize="10" fill="white" fontWeight="bold">U4</text>
      <text x="50" y="25" fontSize="9" fill="#166534">snRNA</text>
    </g>
    <g transform="translate(100, 105)">
      <circle cx="20" cy="20" r="15" fill="#22c55e" />
      <text x="20" y="25" textAnchor="middle" fontSize="10" fill="white" fontWeight="bold">U6</text>
      <text x="50" y="25" fontSize="9" fill="#166534">snRNA</text>
    </g>
    <g transform="translate(100, 135)">
      <circle cx="20" cy="20" r="15" fill="#22c55e" opacity="0.5" />
      <text x="20" y="25" textAnchor="middle" fontSize="8" fill="#166534">U5</text>
      <text x="50" y="25" fontSize="9" fill="#166534">both</text>
    </g>

    <rect x="210" y="10" width="180" height="180" rx="8" fill="#eff6ff" stroke="#3b82f6" strokeWidth="2" />
    <text x="300" y="30" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#1e40af">Minor Spliceosome</text>
    <text x="300" y="55" textAnchor="middle" fontSize="11" fill="#1e40af">~800 U12 introns</text>
    <g transform="translate(230, 75)">
      <circle cx="20" cy="20" r="15" fill="#3b82f6" />
      <text x="20" y="25" textAnchor="middle" fontSize="10" fill="white" fontWeight="bold">U11</text>
      <text x="50" y="25" fontSize="9" fill="#1e40af">snRNA</text>
    </g>
    <g transform="translate(230, 105)">
      <circle cx="20" cy="20" r="15" fill="#3b82f6" />
      <text x="20" y="25" textAnchor="middle" fontSize="10" fill="white" fontWeight="bold">U12</text>
      <text x="50" y="25" fontSize="9" fill="#1e40af">snRNA</text>
    </g>
    <g transform="translate(230, 135)">
      <circle cx="20" cy="20" r="15" fill="#3b82f6" />
      <text x="20" y="25" textAnchor="middle" fontSize="10" fill="white" fontWeight="bold">U4atac</text>
      <text x="60" y="25" fontSize="9" fill="#1e40af">snRNA</text>
    </g>
    <g transform="translate(300, 105)">
      <circle cx="20" cy="20" r="15" fill="#3b82f6" />
      <text x="20" y="25" textAnchor="middle" fontSize="10" fill="white" fontWeight="bold">U6atac</text>
      <text x="60" y="25" fontSize="9" fill="#1e40af">snRNA</text>
    </g>
    <g transform="translate(300, 135)">
      <circle cx="20" cy="20" r="15" fill="#3b82f6" opacity="0.5" />
      <text x="20" y="25" textAnchor="middle" fontSize="8" fill="#1e40af">U5</text>
      <text x="50" y="25" fontSize="9" fill="#1e40af">both</text>
    </g>
  </svg>
);

const ClassificationWorkflow: React.FC = () => (
  <svg viewBox="0 0 500 180" className="w-full max-w-2xl mx-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="workflowGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#0d9488" />
        <stop offset="100%" stopColor="#0f766e" />
      </linearGradient>
    </defs>
    
    <g transform="translate(20, 60)">
      <rect width="80" height="60" rx="8" fill="#f0fdf4" stroke="#22c55e" strokeWidth="2"/>
      <text x="40" y="25" textAnchor="middle" fontSize="11" fontWeight="600" fill="#166534">Variant</text>
      <text x="40" y="42" textAnchor="middle" fontSize="10" fill="#166534">Identified</text>
    </g>
    
    <path d="M100 90 L130 90" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="4 2"/>
    <polygon points="130,85 140,90 130,95" fill="#cbd5e1"/>
    
    <g transform="translate(140, 60)">
      <rect width="80" height="60" rx="8" fill="#fef3c7" stroke="#f59e0b" strokeWidth="2"/>
      <text x="40" y="25" textAnchor="middle" fontSize="11" fontWeight="600" fill="#92400e">Evidence</text>
      <text x="40" y="42" textAnchor="middle" fontSize="10" fill="#92400e">Collection</text>
    </g>
    
    <path d="M220 90 L250 90" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="4 2"/>
    <polygon points="250,85 260,90 250,95" fill="#cbd5e1"/>
    
    <g transform="translate(260, 60)">
      <rect width="80" height="60" rx="8" fill="#eff6ff" stroke="#3b82f6" strokeWidth="2"/>
      <text x="40" y="25" textAnchor="middle" fontSize="11" fontWeight="600" fill="#1e40af">Criteria</text>
      <text x="40" y="42" textAnchor="middle" fontSize="10" fill="#1e40af">Applied</text>
    </g>
    
    <path d="M340 90 L370 90" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="4 2"/>
    <polygon points="370,85 380,90 370,95" fill="#cbd5e1"/>
    
    <g transform="translate(380, 60)">
      <rect width="90" height="60" rx="8" fill="url(#workflowGrad)"/>
      <text x="45" y="25" textAnchor="middle" fontSize="11" fontWeight="600" fill="white">Classification</text>
      <text x="45" y="42" textAnchor="middle" fontSize="10" fill="#e0f2f1">Final Result</text>
    </g>
    
    <g transform="translate(50, 140)">
      <circle cx="8" cy="8" r="4" fill="#22c55e"/>
      <text x="20" y="12" fontSize="9" fill="#64748b">Population data</text>
    </g>
    <g transform="translate(150, 140)">
      <circle cx="8" cy="8" r="4" fill="#f59e0b"/>
      <text x="20" y="12" fontSize="9" fill="#64748b">Literature, functional</text>
    </g>
    <g transform="translate(280, 140)">
      <circle cx="8" cy="8" r="4" fill="#3b82f6"/>
      <text x="20" y="12" fontSize="9" fill="#64748b">ACMG codes assigned</text>
    </g>
  </svg>
);

const ClinicalInterpretation: React.FC = () => {
  const [selectedExample, setSelectedExample] = useState(0);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header showSearch={false} />
      
      <div className="bg-gradient-to-br from-teal-600 via-teal-700 to-teal-800 text-white">
        <div className="max-w-7xl mx-auto px-4 py-12 pt-24">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
              <Stethoscope className="h-6 w-6" />
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-3">Clinical Variant Classification Guidance</h1>
          <p className="text-teal-100 text-lg max-w-2xl">
            Guidance for clinical variant classification in genes for spliceosomal small nuclear RNAs (snRNAs)
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 w-full flex-1">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="mb-6 bg-slate-100 p-1 rounded-lg">
            <TabsTrigger 
              value="overview"
              className="data-[state=active]:bg-white data-[state=active]:text-teal-600 data-[state=active]:shadow-sm rounded-md px-4 py-2"
            >
              <BookOpen className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger 
              value="recommendations"
              className="data-[state=active]:bg-white data-[state=active]:text-teal-600 data-[state=active]:shadow-sm rounded-md px-4 py-2"
            >
              <Lightbulb className="h-4 w-4 mr-2" />
              Recommendations
            </TabsTrigger>
            <TabsTrigger 
              value="examples"
              className="data-[state=active]:bg-white data-[state=active]:text-teal-600 data-[state=active]:shadow-sm rounded-md px-4 py-2"
            >
              <FileText className="h-4 w-4 mr-2" />
              Examples
            </TabsTrigger>
            <TabsTrigger 
              value="reference"
              className="data-[state=active]:bg-white data-[state=active]:text-teal-600 data-[state=active]:shadow-sm rounded-md px-4 py-2"
            >
              <Dna className="h-4 w-4 mr-2" />
              Reference
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="space-y-6">
              <Card className="bg-white border border-slate-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Dna className="h-5 w-5 text-teal-600" />
                    What are snRNAs?
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-slate-600 leading-relaxed">
                    Small nuclear RNAs (snRNAs) are RNA components of the spliceosome - a large complex that removes 
                    introns from RNA transcripts. Humans have two spliceosomes: <strong className="text-teal-600">Major</strong> (&gt;99% of introns) 
                    and <strong className="text-blue-600">Minor</strong> (~800 introns).
                  </p>
                  <SpliceosomeDiagram />
                  <div className="grid md:grid-cols-2 gap-4 mt-4">
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <h4 className="font-semibold text-green-800 mb-2">Major Spliceosome snRNAs</h4>
                      <ul className="text-sm text-green-700 space-y-1">
                        <li><strong>U1, U2, U4, U6</strong> - Function only here</li>
                        <li><strong>U5</strong> - Functions in both</li>
                        <li>Multiple gene copies exist (paralogs)</li>
                      </ul>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <h4 className="font-semibold text-blue-800 mb-2">Minor Spliceosome snRNAs</h4>
                      <ul className="text-sm text-blue-700 space-y-1">
                        <li><strong>U11, U12, U4atac, U6atac</strong></li>
                        <li><strong>U5</strong> - Shared component</li>
                        <li>Single copy genes (no paralogs)</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border border-slate-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Stethoscope className="h-5 w-5 text-teal-600" />
                    Classification Workflow
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-slate-600 leading-relaxed">
                    Clinical variant classification follows a structured workflow using ACMG/ACMG guidelines adapted for snRNAs.
                  </p>
                  <ClassificationWorkflow />
                </CardContent>
              </Card>

              <Card className="bg-white border border-slate-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-600" />
                    Key Challenges for snRNA Variant Interpretation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                      <h4 className="font-semibold text-slate-800 mb-2">1. Exome Sequencing Gaps</h4>
                      <p className="text-sm text-slate-600">
                        Standard exome capture doesn't target snRNA genes. Confident identification requires 
                        <strong>genome sequencing</strong> or targeted approaches.
                      </p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                      <h4 className="font-semibold text-slate-800 mb-2">2. High Sequence Similarity</h4>
                      <p className="text-sm text-slate-600">
                        snRNA genes have paralogs with up to 100% sequence identity (e.g., RNU6 genes 
                        differ only by final nucleotide). Causes read mapping issues.
                      </p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                      <h4 className="font-semibold text-slate-800 mb-2">3. Gene Annotation Problems</h4>
                      <p className="text-sm text-slate-600">
                        Historical mis-annotations common. RNU4-2 was 141nt, now 145nt. Many variants 
                        mis-annotated as "intron variants" in protein-coding genes.
                      </p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                      <h4 className="font-semibold text-slate-800 mb-2">4. Elevated Mutation Rate</h4>
                      <p className="text-sm text-slate-600">
                        snRNA genes have ~50x higher mutation rate than background. Many de novo variants 
                        will be benign. Consider both dominant AND recessive contexts.
                      </p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                      <h4 className="font-semibold text-slate-800 mb-2">5. In Silico Tools Unreliable</h4>
                      <p className="text-sm text-slate-600">
                        CADD and similar tools NOT calibrated for snRNAs. Thresholds that capture 
                        pathogenic variants also flag 55-62% of population variants as deleterious.
                      </p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                      <h4 className="font-semibold text-slate-800 mb-2">6. Complex Inheritance</h4>
                      <p className="text-sm text-slate-600">
                        Major spliceosome snRNAs (multiple copies) can be dominant or recessive. 
                        Minor spliceosome snRNAs (single copy) are always recessive.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border border-slate-200 shadow-sm">
                <CardHeader>
                  <CardTitle>Critical Pathogenic Regions</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-500 mb-4">
                    Pathogenic variants cluster in specific regions. These can be used as evidence (PM1).
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-200">
                          <th className="text-left py-2 px-3 font-semibold">Gene</th>
                          <th className="text-left py-2 px-3 font-semibold">Inheritance</th>
                          <th className="text-left py-2 px-3 font-semibold">Region</th>
                          <th className="text-left py-2 px-3 font-semibold">Nucleotides</th>
                        </tr>
                      </thead>
                      <tbody>
                        {CRITICAL_REGIONS.map((region, idx) => (
                          <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="py-2 px-3 font-mono font-medium">{region.gene}</td>
                            <td className="py-2 px-3">
                              <Badge variant={region.inheritance === 'Dominant' ? 'default' : 'secondary'}
                                className={region.inheritance === 'Dominant' ? 'bg-pink-100 text-pink-700 border-pink-200' : 'bg-blue-100 text-blue-700 border-blue-200'}>
                                {region.inheritance}
                              </Badge>
                            </td>
                            <td className="py-2 px-3">{region.region}</td>
                            <td className="py-2 px-3 font-mono text-slate-600">{region.nucleotides}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="recommendations">
            <div className="grid md:grid-cols-2 gap-4">
              {RECOMMENDATIONS.map((rec) => (
                <Card key={rec.id} className="bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center text-white font-bold">
                          {rec.id}
                        </div>
                        <CardTitle className="text-lg">{rec.title}</CardTitle>
                      </div>
                      <Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-200 font-mono">
                        {rec.acmg}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-600">{rec.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="bg-amber-50 border-amber-200 mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-800">
                  <AlertTriangle className="h-5 w-5" />
                  Important Note on De Novo Variants
                </CardTitle>
              </CardHeader>
              <CardContent className="text-amber-900">
                <p className="mb-2">
                  <strong>Do NOT classify rare de novo variants as Likely Pathogenic without additional evidence.</strong>
                </p>
                <p className="text-sm">
                  snRNA genes have an elevated mutation rate. A de novo variant in an affected individual may be 
                  coincidental. Apply de novo criteria at "phenotype consistent with gene but not highly specific" 
                  level, NOT maximum weighting.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="examples">
            <div className="grid lg:grid-cols-5 gap-6">
              <div className="lg:col-span-2">
                <Card className="bg-white border border-slate-200 shadow-sm">
                  <CardHeader>
                    <CardTitle>Example Classifications</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {EXAMPLES.map((example, idx) => (
                      <button
                        key={example.id}
                        onClick={() => setSelectedExample(idx)}
                        className={`w-full text-left p-3 rounded-lg border transition-all ${
                          selectedExample === idx 
                            ? 'bg-teal-50 border-teal-300 shadow-sm' 
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-mono font-medium">{example.gene}</span>
                            <span className="text-slate-400 mx-2">·</span>
                            <span className="font-mono text-sm">{example.variant}</span>
                          </div>
                          <Badge className={
                            example.classification === 'Pathogenic' ? 'bg-red-100 text-red-700 border-red-200' :
                            example.classification === 'VUS' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                            'bg-blue-100 text-blue-700 border-blue-200'
                          }>
                            {example.classification}
                          </Badge>
                        </div>
                        <div className="text-xs text-slate-500 mt-1">{example.inheritance}</div>
                      </button>
                    ))}
                  </CardContent>
                </Card>
              </div>

              <div className="lg:col-span-3">
                {EXAMPLES[selectedExample] && (
                  <Card className="bg-white border border-slate-200 shadow-sm">
                    <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-xl">
                            {EXAMPLES[selectedExample].gene} {EXAMPLES[selectedExample].variant}
                          </CardTitle>
                          <p className="text-sm text-slate-500 font-mono mt-1">
                            {EXAMPLES[selectedExample].position}
                          </p>
                        </div>
                        <Badge className={
                          EXAMPLES[selectedExample].classification === 'Pathogenic' ? 'bg-red-100 text-red-700 border-red-200' :
                          EXAMPLES[selectedExample].classification === 'VUS' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                          'bg-blue-100 text-blue-700 border-blue-200'
                        } variant="outline">
                          {EXAMPLES[selectedExample].classification}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h4 className="text-sm font-semibold text-slate-700 mb-1">Inheritance</h4>
                        <p className="text-slate-600">{EXAMPLES[selectedExample].inheritance}</p>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-semibold text-slate-700 mb-1">Phenotype</h4>
                        <p className="text-slate-600">{EXAMPLES[selectedExample].phenotype}</p>
                      </div>

                      <div>
                        <h4 className="text-sm font-semibold text-slate-700 mb-2">Applied Criteria</h4>
                        <div className="flex flex-wrap gap-2">
                          {EXAMPLES[selectedExample].criteria.map((c) => (
                            <Badge key={c} variant="outline" className="bg-teal-50 text-teal-700 border-teal-200 font-mono">
                              {c}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-semibold text-slate-700 mb-2">Reasoning</h4>
                        <ul className="space-y-2">
                          {EXAMPLES[selectedExample].reasoning.map((reason, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm text-slate-600">
                              <ChevronRight className="h-4 w-4 text-teal-600 shrink-0 mt-0.5" />
                              {reason}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="pt-4 border-t border-slate-200">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-700">Final Classification</span>
                          <Badge className={
                            EXAMPLES[selectedExample].classification === 'Pathogenic' ? 'bg-red-600 text-white' :
                            EXAMPLES[selectedExample].classification === 'VUS' ? 'bg-amber-600 text-white' :
                            'bg-blue-600 text-white'
                          }>
                            {EXAMPLES[selectedExample].classification}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="reference">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card className="bg-white border border-slate-200 shadow-sm">
                <CardHeader>
                  <CardTitle>ACMG Evidence Codes for snRNAs</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-200">
                          <th className="text-left py-2 px-3 font-semibold">Code</th>
                          <th className="text-left py-2 px-3 font-semibold">Strength</th>
                          <th className="text-left py-2 px-3 font-semibold">Description</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ACMG_CODES.map((code) => (
                          <tr key={code.code} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="py-2 px-3 font-mono font-medium text-teal-600">{code.code}</td>
                            <td className="py-2 px-3">
                              <Badge variant="outline" className="text-xs">
                                {code.name}
                              </Badge>
                            </td>
                            <td className="py-2 px-3 text-slate-600">{code.description}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border border-slate-200 shadow-sm">
                <CardHeader>
                  <CardTitle>snRNA Disease Associations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div className="p-3 bg-pink-50 rounded-lg border border-pink-200">
                      <div className="font-semibold text-pink-800">Dominant NDD</div>
                      <div className="text-pink-700">RNU4-2 (ReNU syndrome), RNU2-2, RNU5B-1</div>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="font-semibold text-blue-800">Recessive NDD</div>
                      <div className="text-blue-700">RNU4-2, RNU2-2, RNU12, RNU4ATAC</div>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                      <div className="font-semibold text-green-800">Retinitis Pigmentosa</div>
                      <div className="text-green-700">RNU4-2, RNU6-1, RNU6-2, RNU6-8, RNU6-9</div>
                    </div>
                    <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                      <div className="font-semibold text-purple-800">Other Syndromes</div>
                      <div className="text-purple-700">
                        RNU4ATAC: MOPD1, Roifman, Lowry-Wood<br/>
                        RNU6ATAC: Multi-system, Autoimmune diabetes
                      </div>
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

export default ClinicalInterpretation;