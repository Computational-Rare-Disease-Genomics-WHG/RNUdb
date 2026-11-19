"""Tests for ClinVar release download and snRNA filtering (rnudb_utils.clinvar)."""

import hashlib

import pysam
import pytest

from rnudb_utils import clinvar

RNU4_2 = {"id": "RNU4-2", "chromosome": "chr12", "start": 120291759, "end": 120291903}
RNU2_2 = {"id": "RNU2-2", "chromosome": "chr11", "start": 62841619, "end": 62841809}

VCF_HEADER = """##fileformat=VCFv4.1
##fileDate=2026-11-08
##source=ClinVar
##reference=GRCh38
##ID=<Description="ClinVar Variation ID">
##INFO=<ID=ALLELEID,Number=1,Type=Integer,Description="allele ID">
##INFO=<ID=CLNDISDB,Number=.,Type=String,Description="Disease database IDs">
##INFO=<ID=CLNDN,Number=.,Type=String,Description="Disease name">
##INFO=<ID=CLNHGVS,Number=.,Type=String,Description="HGVS expression">
##INFO=<ID=CLNREVSTAT,Number=.,Type=String,Description="Review status">
##INFO=<ID=CLNSIG,Number=.,Type=String,Description="Clinical significance">
##INFO=<ID=CLNSIGCONF,Number=.,Type=String,Description="Conflicting classification">
##INFO=<ID=CLNSIGSCV,Number=.,Type=String,Description="SCV accessions">
##INFO=<ID=CLNVC,Number=1,Type=String,Description="Variant type">
##INFO=<ID=GENEINFO,Number=1,Type=String,Description="Gene(s)">
##INFO=<ID=MC,Number=.,Type=String,Description="Molecular consequence">
##INFO=<ID=ORIGIN,Number=.,Type=String,Description="Allele origin">
##contig=<ID=1>
##contig=<ID=11>
##contig=<ID=12>
#CHROM\tPOS\tID\tREF\tALT\tQUAL\tFILTER\tINFO
"""

VCF_RECORDS = [
    # Before RNU4-2, no overlap
    "12\t120291700\t1001\tA\tG\t.\t.\tALLELEID=1;CLNSIG=Benign;GENEINFO=SIRT4:23409",
    # Deletion starting before RNU4-2 that runs into it
    "12\t120291755\t1002\tACGTACGTAC\tA\t.\t.\tALLELEID=2;CLNSIG=Pathogenic;CLNVC=Deletion",
    # Inside RNU4-2; disease name contains commas
    "12\t120291800\t1003\tG\tA\t.\t.\tALLELEID=3;"
    "CLNDISDB=MONDO:MONDO:0971172,MedGen:C5935628|MedGen:C3661900;"
    "CLNDN=Disorder_with_hypotonia,_brain_anomalies|not_provided;"
    "CLNHGVS=NC_000012.12:g.120291800G>A;"
    "CLNREVSTAT=criteria_provided,_single_submitter;"
    "CLNSIG=Uncertain_significance;CLNSIGSCV=SCV000000001|SCV000000002;"
    "CLNVC=single_nucleotide_variant;"
    "GENEINFO=SIRT4:23409|RNU4-2:26834;"
    "MC=SO:0001619|non-coding_transcript_variant;ORIGIN=1",
    # After RNU4-2, no overlap
    "12\t120291950\t1004\tC\tT\t.\t.\tALLELEID=4;CLNSIG=Benign",
    # Inside RNU2-2; submitters disagree
    "11\t62841700\t1005\tT\tC\t.\t.\tALLELEID=5;"
    "CLNSIG=Conflicting_classifications_of_pathogenicity;"
    "CLNSIGCONF=Uncertain_significance_(1)|Likely_benign_(1)",
    # Different chromosome entirely
    "1\t100\t1006\tA\tT\t.\t.\tALLELEID=6;CLNSIG=Benign",
]


def _md5_line(data: bytes) -> str:
    """A ClinVar-style .md5 line for ``data``."""
    return f"{hashlib.md5(data, usedforsecurity=False).hexdigest()}  /x/f.vcf.gz\n"


@pytest.fixture
def clinvar_vcf(tmp_path):
    """Small bgzipped + tabix-indexed VCF shaped like a ClinVar release."""
    sorted_records = sorted(
        VCF_RECORDS, key=lambda r: (r.split("\t")[0], int(r.split("\t")[1]))
    )
    plain = tmp_path / "clinvar_20261108.vcf"
    plain.write_text(VCF_HEADER + "\n".join(sorted_records) + "\n")
    return pysam.tabix_index(str(plain), preset="vcf", force=True)


class TestToClinvarContig:
    def test_strips_chr_prefix(self):
        assert clinvar.to_clinvar_contig("chr12") == "12"

    def test_mitochondrial(self):
        assert clinvar.to_clinvar_contig("chrMT") == "MT"


class TestFilterClinvarVcf:
    def test_keeps_only_variants_overlapping_genes(self, clinvar_vcf):
        rows = clinvar.filter_clinvar_vcf(
            clinvar_vcf, [RNU4_2, RNU2_2], "clinvar_20261108"
        )
        assert sorted(r["clinvar_variation_id"] for r in rows) == [
            "1002",
            "1003",
            "1005",
        ]

    def test_includes_deletion_starting_before_gene(self, clinvar_vcf):
        rows = clinvar.filter_clinvar_vcf(clinvar_vcf, [RNU4_2], "clinvar_20261108")
        assert "chr12-120291755-ACGTACGTAC-A" in [r["variant_id"] for r in rows]

    def test_rows_tagged_with_gene_and_release(self, clinvar_vcf):
        rows = clinvar.filter_clinvar_vcf(
            clinvar_vcf, [RNU4_2, RNU2_2], "clinvar_20261108"
        )
        by_id = {r["clinvar_variation_id"]: r for r in rows}
        assert by_id["1005"]["gene_id"] == "RNU2-2"
        assert by_id["1003"]["gene_id"] == "RNU4-2"
        assert {r["release"] for r in rows} == {"clinvar_20261108"}

    def test_preserves_clinvar_values_containing_commas(self, clinvar_vcf):
        rows = clinvar.filter_clinvar_vcf(clinvar_vcf, [RNU4_2], "clinvar_20261108")
        row = next(r for r in rows if r["clinvar_variation_id"] == "1003")
        assert (
            row["conditions"] == "Disorder_with_hypotonia,_brain_anomalies|not_provided"
        )
        assert row["review_status"] == "criteria_provided,_single_submitter"
        assert row["clinical_significance"] == "Uncertain_significance"
        assert row["gene_info"] == "SIRT4:23409|RNU4-2:26834"
        assert row["chromosome"] == "chr12"

    def test_missing_info_fields_are_empty_strings(self, clinvar_vcf):
        rows = clinvar.filter_clinvar_vcf(clinvar_vcf, [RNU2_2], "clinvar_20261108")
        assert rows[0]["conditions"] == ""

    def test_keeps_submission_accessions(self, clinvar_vcf):
        rows = clinvar.filter_clinvar_vcf(clinvar_vcf, [RNU4_2], "clinvar_20261108")
        row = next(r for r in rows if r["clinvar_variation_id"] == "1003")
        assert row["scv_accessions"] == "SCV000000001|SCV000000002"

    def test_keeps_conflicting_classification_breakdown(self, clinvar_vcf):
        rows = clinvar.filter_clinvar_vcf(clinvar_vcf, [RNU2_2], "clinvar_20261108")
        assert (
            rows[0]["conflicting_significance"]
            == "Uncertain_significance_(1)|Likely_benign_(1)"
        )

    def test_keeps_disease_database_ids_containing_commas(self, clinvar_vcf):
        rows = clinvar.filter_clinvar_vcf(clinvar_vcf, [RNU4_2], "clinvar_20261108")
        row = next(r for r in rows if r["clinvar_variation_id"] == "1003")
        assert (
            row["condition_ids"]
            == "MONDO:MONDO:0971172,MedGen:C5935628|MedGen:C3661900"
        )


class TestRelease:
    def test_release_from_md5_line(self):
        line = "c290b869  /netmnt/x/vcf_GRCh38/clinvar_20261108.vcf.gz\n"
        assert clinvar.release_from_md5_line(line) == "clinvar_20261108"

    def test_url_candidates_try_current_folder_then_archive(self):
        assert clinvar.release_url_candidates("clinvar_20250106") == [
            f"{clinvar.CLINVAR_VCF_BASE}/clinvar_20250106.vcf.gz",
            f"{clinvar.CLINVAR_VCF_BASE}/archive_2.0/2025/clinvar_20250106.vcf.gz",
        ]


class _FakeResponse:
    def __init__(self, body: bytes | None):
        self.status_code = 200 if body is not None else 404
        self._body = body or b""
        self.text = self._body.decode()

    def raise_for_status(self):
        if self.status_code != 200:
            raise RuntimeError(f"HTTP {self.status_code}")

    def iter_content(self, chunk_size):
        yield self._body

    def __enter__(self):
        return self

    def __exit__(self, *exc):
        return False


@pytest.fixture
def fake_ftp(monkeypatch):
    """Serve files from a dict instead of the network; records GET requests."""
    files: dict[str, bytes] = {}
    fetched: list[str] = []

    def fake_get(url, **kwargs):
        fetched.append(url)
        return _FakeResponse(files.get(url))

    monkeypatch.setattr(clinvar.requests, "get", fake_get)
    monkeypatch.setattr(
        clinvar.requests, "head", lambda url, **kwargs: _FakeResponse(files.get(url))
    )
    return files, fetched


class TestDownloadRelease:
    def _publish(self, files, url, vcf=b"vcf-bytes"):
        files[url] = vcf
        files[f"{url}.tbi"] = b"index"
        files[f"{url}.md5"] = _md5_line(vcf).encode()

    def test_falls_back_to_archive(self, tmp_path, fake_ftp):
        files, _ = fake_ftp
        archive_url = clinvar.release_url_candidates("clinvar_20250106")[1]
        self._publish(files, archive_url)

        path = clinvar.download_release("clinvar_20250106", tmp_path)

        assert path.read_bytes() == b"vcf-bytes"
        assert (tmp_path / "clinvar_20250106.vcf.gz.tbi").exists()

    def test_corrupt_download_raises(self, tmp_path, fake_ftp):
        files, _ = fake_ftp
        url = clinvar.release_url_candidates("clinvar_20261108")[0]
        self._publish(files, url)
        files[url] = b"truncated"

        with pytest.raises(ValueError, match="md5"):
            clinvar.download_release("clinvar_20261108", tmp_path)

    def test_skips_download_when_verified_copy_exists(self, tmp_path, fake_ftp):
        files, fetched = fake_ftp
        url = clinvar.release_url_candidates("clinvar_20261108")[0]
        self._publish(files, url)
        clinvar.download_release("clinvar_20261108", tmp_path)
        fetched.clear()

        clinvar.download_release("clinvar_20261108", tmp_path)

        assert fetched == []

    def test_unknown_release_raises(self, tmp_path, fake_ftp):
        with pytest.raises(FileNotFoundError):
            clinvar.download_release("clinvar_19990101", tmp_path)

    def test_latest_release_reads_md5_file(self, fake_ftp):
        files, _ = fake_ftp
        files[f"{clinvar.CLINVAR_VCF_BASE}/clinvar.vcf.gz.md5"] = (
            b"abc  /netmnt/x/clinvar_20261108.vcf.gz\n"
        )
        assert clinvar.latest_release() == "clinvar_20261108"


class TestVerifyMd5:
    def test_matching_checksum_passes(self, tmp_path):
        data = tmp_path / "f.vcf.gz"
        data.write_bytes(b"hello")
        md5 = tmp_path / "f.vcf.gz.md5"
        md5.write_text(_md5_line(b"hello"))
        clinvar.verify_md5(data, md5)

    def test_mismatched_checksum_raises(self, tmp_path):
        data = tmp_path / "f.vcf.gz"
        data.write_bytes(b"truncated")
        md5 = tmp_path / "f.vcf.gz.md5"
        md5.write_text(_md5_line(b"hello"))
        with pytest.raises(ValueError, match="md5"):
            clinvar.verify_md5(data, md5)
