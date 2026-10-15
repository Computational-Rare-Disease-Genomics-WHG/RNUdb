// src/lib/externalLinks.ts

export interface ExternalLinkGene {
  name?: string;
  chromosome?: string;
  start?: number;
  end?: number;
}

const UCSC_BASE = "https://genome.ucsc.edu/cgi-bin/hgTracks";
const GNOMAD_BASE = "https://gnomad.broadinstitute.org";

/**
 * Build the gnomAD gene page URL, e.g. https://gnomad.broadinstitute.org/gene/RNU4-2
 * Uses the gene symbol (e.g. "RNU4-2", "RNU4ATAC") rather than a region or variant ID.
 */
export const buildGnomadGeneUrl = (geneName?: string): string => {
  if (!geneName) return "";
  return `${GNOMAD_BASE}/gene/${encodeURIComponent(geneName)}`;
};

/**
 * Build the UCSC Genome Browser region URL, e.g.
 * https://genome.ucsc.edu/cgi-bin/hgTracks?db=hg38&position=chr2:121530880-121531009
 * Ensures the chromosome carries the "chr" prefix required by UCSC.
 */
export const buildUcscRegionUrl = (gene: ExternalLinkGene): string => {
  const { chromosome, start, end } = gene;
  if (!chromosome || start === undefined || end === undefined) return "";
  const chrom = chromosome.startsWith("chr") ? chromosome : `chr${chromosome}`;
  return `${UCSC_BASE}?db=hg38&position=${chrom}:${start}-${end}`;
};
