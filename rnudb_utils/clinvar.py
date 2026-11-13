"""Download ClinVar GRCh38 VCF releases and filter them to RNUdb genes."""

from __future__ import annotations

import csv
import hashlib
from pathlib import Path

import pysam
import requests

CLINVAR_VCF_BASE = "https://ftp.ncbi.nlm.nih.gov/pub/clinvar/vcf_GRCh38"

# INFO keys copied to the output, keyed by output column name
INFO_COLUMNS = {
    "allele_id": "ALLELEID",
    "clinical_significance": "CLNSIG",
    "conflicting_significance": "CLNSIGCONF",
    "review_status": "CLNREVSTAT",
    "scv_accessions": "CLNSIGSCV",
    "conditions": "CLNDN",
    "condition_ids": "CLNDISDB",
    "hgvs": "CLNHGVS",
    "variant_type": "CLNVC",
    "molecular_consequence": "MC",
    "gene_info": "GENEINFO",
    "origin": "ORIGIN",
}

CSV_COLUMNS = [
    "release",
    "gene_id",
    "variant_id",
    "clinvar_variation_id",
    "chromosome",
    "position",
    "ref",
    "alt",
    *INFO_COLUMNS,
]


def to_clinvar_contig(chromosome: str) -> str:
    """Convert an RNUdb chromosome (``chr12``) to ClinVar's contig name (``12``)."""
    return chromosome.removeprefix("chr")


def _info_value(record: pysam.VariantRecord, key: str) -> str:
    """Return an INFO value as ClinVar wrote it.

    pysam splits multi-value fields on commas, which also splits ClinVar text
    such as disease names; joining with commas restores the original string.
    """
    value = record.info.get(key)
    if value is None:
        return ""
    if isinstance(value, tuple):
        return ",".join(str(v) for v in value)
    return str(value)


def filter_clinvar_vcf(
    vcf_path: str | Path, genes: list[dict], release: str
) -> list[dict]:
    """Return one row per ClinVar allele overlapping any of ``genes``.

    Genes use RNUdb coordinates (1-based inclusive). Overlap is by genomic
    position, so variants are kept even when ClinVar labels them with a
    neighbouring gene.
    """
    rows = []
    with pysam.VariantFile(str(vcf_path)) as vcf:
        for gene in genes:
            contig = to_clinvar_contig(gene["chromosome"])
            if contig not in vcf.index:
                continue
            for record in vcf.fetch(contig, gene["start"] - 1, gene["end"]):
                for alt in record.alts or ():
                    row = {
                        "release": release,
                        "gene_id": gene["id"],
                        "variant_id": f"chr{contig}-{record.pos}-{record.ref}-{alt}",
                        "clinvar_variation_id": record.id,
                        "chromosome": f"chr{contig}",
                        "position": record.pos,
                        "ref": record.ref,
                        "alt": alt,
                    }
                    for column, key in INFO_COLUMNS.items():
                        row[column] = _info_value(record, key)
                    rows.append(row)
    return rows


def write_csv(rows: list[dict], path: Path) -> None:
    """Write filtered ClinVar rows to ``path``."""
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=CSV_COLUMNS)
        writer.writeheader()
        writer.writerows(rows)


def release_from_md5_line(line: str) -> str:
    """Extract the release name from a ClinVar ``.md5`` line.

    e.g. ``"<hash>  /path/clinvar_20261108.vcf.gz"`` -> ``"clinvar_20261108"``
    """
    filename = line.split()[1].rsplit("/", 1)[-1]
    return filename.removesuffix(".vcf.gz")


def release_url_candidates(release: str) -> list[str]:
    """URLs where a dated release may live: the current folder, then the archive."""
    year = release.removeprefix("clinvar_")[:4]
    return [
        f"{CLINVAR_VCF_BASE}/{release}.vcf.gz",
        f"{CLINVAR_VCF_BASE}/archive_2.0/{year}/{release}.vcf.gz",
    ]


def verify_md5(data_path: Path, md5_path: Path) -> None:
    """Raise ValueError if ``data_path`` does not match the checksum in ``md5_path``."""
    expected = md5_path.read_text().split()[0]
    digest = hashlib.md5(usedforsecurity=False)
    with data_path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            digest.update(chunk)
    if digest.hexdigest() != expected:
        raise ValueError(f"md5 mismatch for {data_path.name}")


def latest_release() -> str:
    """Return the name of the newest ClinVar release, e.g. ``clinvar_20261108``."""
    response = requests.get(f"{CLINVAR_VCF_BASE}/clinvar.vcf.gz.md5", timeout=30)
    response.raise_for_status()
    return release_from_md5_line(response.text)


def _download(url: str, dest: Path) -> None:
    with requests.get(url, stream=True, timeout=60) as response:
        response.raise_for_status()
        with dest.open("wb") as f:
            for chunk in response.iter_content(chunk_size=1024 * 1024):
                f.write(chunk)


def download_release(release: str, dest_dir: Path) -> Path:
    """Download a release's VCF, index and checksum into ``dest_dir``.

    Skips the download if a verified copy is already present. Returns the
    path to the VCF.
    """
    dest_dir.mkdir(parents=True, exist_ok=True)
    vcf_path = dest_dir / f"{release}.vcf.gz"
    md5_path = dest_dir / f"{release}.vcf.gz.md5"
    tbi_path = dest_dir / f"{release}.vcf.gz.tbi"

    if vcf_path.exists() and md5_path.exists() and tbi_path.exists():
        try:
            verify_md5(vcf_path, md5_path)
            return vcf_path
        except ValueError:
            pass

    for url in release_url_candidates(release):
        if requests.head(f"{url}.md5", timeout=30).status_code != 200:
            continue
        _download(f"{url}.md5", md5_path)
        _download(url, vcf_path)
        _download(f"{url}.tbi", tbi_path)
        verify_md5(vcf_path, md5_path)
        return vcf_path

    raise FileNotFoundError(f"ClinVar release {release} not found")
