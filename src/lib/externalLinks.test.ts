import { describe, it, expect } from "vitest";
import {
  buildGnomadGeneUrl,
  buildUcscRegionUrl,
  type ExternalLinkGene,
} from "./externalLinks";

describe("buildGnomadGeneUrl", () => {
  it("builds a gnomAD gene page URL from the gene symbol", () => {
    expect(buildGnomadGeneUrl("RNU4-2")).toBe(
      "https://gnomad.broadinstitute.org/gene/RNU4-2",
    );
  });

  it("builds a gnomAD gene page URL for RNU4ATAC", () => {
    expect(buildGnomadGeneUrl("RNU4ATAC")).toBe(
      "https://gnomad.broadinstitute.org/gene/RNU4ATAC",
    );
  });

  it("returns empty string when gene name is missing", () => {
    expect(buildGnomadGeneUrl(undefined)).toBe("");
    expect(buildGnomadGeneUrl("")).toBe("");
  });
});

describe("buildUcscRegionUrl", () => {
  const rnu4atac: ExternalLinkGene = {
    chromosome: "chr2",
    start: 121530880,
    end: 121531009,
  };

  it("builds a UCSC hgTracks URL for a gene region", () => {
    expect(buildUcscRegionUrl(rnu4atac)).toBe(
      "https://genome.ucsc.edu/cgi-bin/hgTracks?db=hg38&position=chr2:121530880-121531009",
    );
  });

  it("adds the chr prefix when chromosome lacks it", () => {
    expect(buildUcscRegionUrl({ ...rnu4atac, chromosome: "2" })).toBe(
      "https://genome.ucsc.edu/cgi-bin/hgTracks?db=hg38&position=chr2:121530880-121531009",
    );
  });

  it("returns empty string when coordinates are missing", () => {
    expect(buildUcscRegionUrl({ chromosome: "chr2" })).toBe("");
    expect(buildUcscRegionUrl({ start: 1, end: 2 })).toBe("");
    expect(buildUcscRegionUrl({})).toBe("");
  });
});
