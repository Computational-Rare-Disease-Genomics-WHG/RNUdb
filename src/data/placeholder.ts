import type { SnRNAGene, Variant, Literature, RNAStructure } from '@/types';

// Simple placeholder gene for development
export const placeholderGene: SnRNAGene = {
  id: "RNU4-2",
  name: "RNU4-2",
  fullName: "RNA, U4 small nuclear 2", 
  chromosome: "12",
  start: 120291759,
  end: 120291903,
  strand: "-",
  sequence: "AUACUUACCUGAUUAGGUAGUGCAUUUCGUUCUAGACCUGAAGUGAUCCUGAGGGAAUUUCCCGACCGAAGCCGAAGCAACUUCGGUCGGAAUUCCCUCAGGAUCACUUCAGGUCUAGAACGA",
  description: "U4 small nuclear RNA involved in pre-mRNA splicing as part of the spliceosome complex."
};

// Simple placeholder variants for development
export const placeholderVariants: Variant[] = [
  {
    id: "test_variant_1",
    geneId: "RNU4-2",
    position: 120291859,  // nucleotidePosition 45 on reverse strand: 120291903 - 45 + 1
    nucleotidePosition: 45,
    ref: "A",
    alt: "G",
    hgvs: "n.45A>G",
    consequence: "structural_variant",
    clinvar_significance: "Pathogenic"
  }
];

// Simple placeholder literature for development
export const placeholderLiterature: Literature[] = [
  {
    pmid: "test_paper_1",
    title: "Test Research Paper on U4 snRNA",
    authors: "Researcher, A. et al.",
    journal: "Test Journal",
    year: "2023",
    abstract: "This is a test abstract for development purposes.",
    associatedGenes: ["RNU4-2"]
  }
];

// Simple placeholder structure for development
export const placeholderStructure: RNAStructure = {
  id: "test_structure",
  geneId: "RNU4-2",
  nucleotides: [
    { id: 1, base: 'A', x: 100, y: 100 },
    { id: 2, base: 'U', x: 120, y: 90 },
    { id: 3, base: 'A', x: 140, y: 100 }
  ],
  basePairs: [
    { from: 1, to: 3 }
  ],
  annotations: [
    { id: "test_annotation", text: "Test", x: 120, y: 70, fontSize: 12 }
  ]
};
