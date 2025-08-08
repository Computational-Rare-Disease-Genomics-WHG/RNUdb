export interface SnRNAGeneData {
  name: string;
  fullName: string;
  chromosome: string;
  position: string;
  length: string;
  type: string;
  description: string;
}

export const snRNAData: { [key: string]: SnRNAGeneData } = {
  'RNU4-2': {
    name: 'RNU4-2',
    fullName: 'RNA, U4 small nuclear 2',
    chromosome: '12',
    position: '6,648,956-6,649,101',
    length: '146 bp',
    type: 'U4 snRNA',
    description: 'U4 small nuclear RNA involved in pre-mRNA splicing as part of the spliceosome complex'
  },
  'RNU1-1': {
    name: 'RNU1-1',
    fullName: 'RNA, U1 small nuclear 1',
    chromosome: '1',
    position: '16,069,983-16,070,146',
    length: '164 bp',
    type: 'U1 snRNA',
    description: 'U1 small nuclear RNA involved in pre-mRNA splicing'
  },
  'RNU2-1': {
    name: 'RNU2-1',
    fullName: 'RNA, U2 small nuclear 1',
    chromosome: '17',
    position: '20,088,438-20,088,625',
    length: '188 bp',
    type: 'U2 snRNA',
    description: 'U2 small nuclear RNA involved in pre-mRNA splicing'
  }
};