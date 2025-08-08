export interface Paper {
  title: string;
  authors: string;
  journal: string;
  year: string;
  pmid: string;
  doi: string;
  abstract: string;
}

export const paperData: Paper[] = [
  {
    title: 'Structural analysis of U4 snRNA and its role in pre-mRNA splicing',
    authors: 'Smith, J. et al.',
    journal: 'Nature Structural Biology',
    year: '2023',
    pmid: '12345678',
    doi: '10.1038/nsb.2023.001',
    abstract: 'Comprehensive structural analysis of U4 snRNA reveals critical base-pairing interactions essential for spliceosome assembly and function.'
  },
  {
    title: 'Pathogenic variants in RNU4-2 associated with developmental disorders',
    authors: 'Johnson, M. et al.',
    journal: 'American Journal of Human Genetics',
    year: '2023',
    pmid: '23456789',
    doi: '10.1016/j.ajhg.2023.002',
    abstract: 'Identification of disease-causing mutations in RNU4-2 that disrupt splicing and lead to neurodevelopmental phenotypes.'
  },
  {
    title: 'Evolution and conservation of U4 snRNA across species',
    authors: 'Brown, K. et al.',
    journal: 'RNA Biology',
    year: '2022',
    pmid: '34567890',
    doi: '10.1080/15476286.2022.001',
    abstract: 'Comparative genomic analysis reveals highly conserved regions in U4 snRNA critical for splicing function.'
  }
];