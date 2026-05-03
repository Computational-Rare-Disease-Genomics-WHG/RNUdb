"""Tests for validation services."""

from api.services.validation import (
    validate_bed_intervals,
    validate_structure,
    validate_variant_batch,
)


class TestVariantValidation:
    """Test variant batch validation."""

    def test_valid_variants_pass(self, sample_gene, valid_variant_rows):
        """All valid variants should pass validation."""
        report = validate_variant_batch(valid_variant_rows, sample_gene)

        assert report.valid is True
        assert len(report.errors) == 0
        assert len(report.valid_rows) == 3
        assert report.total_rows == 3

    def test_position_out_of_bounds(self, sample_gene):
        """Variants outside gene bounds should fail."""
        rows = [{"position": 120291000, "ref": "C", "alt": "T"}]
        report = validate_variant_batch(rows, sample_gene)

        assert report.valid is False
        assert len(report.errors) == 1
        assert "outside gene bounds" in report.errors[0].message

    def test_invalid_nucleotide(self, sample_gene):
        """Invalid nucleotide characters should fail."""
        rows = [{"position": 120291785, "ref": "X", "alt": "T"}]
        report = validate_variant_batch(rows, sample_gene)

        assert report.valid is False
        assert len(report.errors) == 1
        assert "Invalid reference allele" in report.errors[0].message

    def test_invalid_clinical_significance(self, sample_gene):
        """Unknown clinical significance should fail."""
        rows = [
            {
                "position": 120291785,
                "ref": "G",
                "alt": "A",
                "clinical_significance": "Unknown",
            }
        ]
        report = validate_variant_batch(rows, sample_gene)

        assert report.valid is False
        assert len(report.errors) == 1
        assert "Invalid clinical significance" in report.errors[0].message

    def test_duplicate_within_batch(self, sample_gene):
        """Duplicate variants within the batch should fail."""
        rows = [
            {"position": 120291785, "ref": "G", "alt": "A"},
            {"position": 120291785, "ref": "G", "alt": "A"},  # Duplicate
        ]
        report = validate_variant_batch(rows, sample_gene)

        assert report.valid is False
        assert len(report.errors) == 1
        assert "Duplicate variant" in report.errors[0].message

    def test_duplicate_in_database(self, sample_gene):
        """Variants already in database should produce warning."""
        existing = {"120291785_G_A"}
        rows = [{"position": 120291785, "ref": "G", "alt": "A"}]
        report = validate_variant_batch(rows, sample_gene, existing)

        assert report.valid is True
        assert len(report.warnings) == 1
        assert "already exists" in report.warnings[0].message

    def test_required_fields_missing(self, sample_gene):
        """Missing required fields should fail."""
        rows = [{"position": 120291785}]  # Missing ref and alt
        report = validate_variant_batch(rows, sample_gene)

        assert report.valid is False
        assert len(report.errors) == 2
        error_fields = {e.field for e in report.errors}
        assert "ref" in error_fields
        assert "alt" in error_fields

    def test_numeric_fields_validation(self, sample_gene):
        """Non-numeric values in numeric fields should fail."""
        rows = [
            {
                "position": 120291785,
                "ref": "G",
                "alt": "A",
                "function_score": "not_a_number",
                "cadd_score": "also_bad",
            }
        ]
        report = validate_variant_batch(rows, sample_gene)

        assert report.valid is False
        assert len(report.errors) == 2
        assert report.errors[0].field == "function_score"
        assert report.errors[1].field == "cadd_score"

    def test_hgvs_warning(self, sample_gene):
        """Malformed HGVS should produce warning, not error."""
        rows = [
            {"position": 120291785, "ref": "G", "alt": "A", "hgvs": "invalid_format"}
        ]
        report = validate_variant_batch(rows, sample_gene)

        assert report.valid is True
        assert len(report.warnings) == 1
        assert "HGVS" in report.warnings[0].message

    def test_clinical_sig_normalization(self, sample_gene):
        """Abbreviated clinical significance should be normalized."""
        rows = [
            {
                "position": 120291785,
                "ref": "G",
                "alt": "A",
                "clinical_significance": "LP",
            }
        ]
        report = validate_variant_batch(rows, sample_gene)

        assert report.valid is True
        assert report.valid_rows[0]["clinical_significance"] == "Likely Pathogenic"

    def test_zygosity_warning(self, sample_gene):
        """Unexpected zygosity should produce warning."""
        rows = [
            {"position": 120291785, "ref": "G", "alt": "A", "zygosity": "unknown_value"}
        ]
        report = validate_variant_batch(rows, sample_gene)

        assert report.valid is True
        assert len(report.warnings) == 1
        assert "zygosity" in report.warnings[0].message


class TestStructureValidation:
    """Test RNA structure validation."""

    def test_valid_structure_passes(self, sample_gene, valid_structure_data):
        """A valid structure should pass validation."""
        report = validate_structure(valid_structure_data, sample_gene)

        assert report.valid is True
        assert len(report.errors) == 0

    def test_missing_required_fields(self, sample_gene):
        """Missing id or name should fail."""
        data = {"nucleotides": [], "base_pairs": []}
        report = validate_structure(data, sample_gene)

        assert report.valid is False
        assert len(report.errors) >= 2

    def test_invalid_nucleotide_base(self, sample_gene):
        """Invalid nucleotide base should fail."""
        data = {
            "id": "test",
            "name": "Test",
            "nucleotides": [{"id": 1, "base": "X", "x": 0, "y": 0}],
            "base_pairs": [],
        }
        report = validate_structure(data, sample_gene)

        assert report.valid is False
        assert any("Invalid base" in e.message for e in report.errors)

    def test_invalid_base_pair_reference(self, sample_gene):
        """Base pair referencing non-existent nucleotide should fail."""
        data = {
            "id": "test",
            "name": "Test",
            "nucleotides": [{"id": 1, "base": "A", "x": 0, "y": 0}],
            "base_pairs": [
                {"from_pos": 1, "to_pos": 99}  # 99 doesn't exist
            ],
        }
        report = validate_structure(data, sample_gene)

        assert report.valid is False
        assert any("does not match any nucleotide" in e.message for e in report.errors)

    def test_nucleotide_count_warning(self, sample_gene):
        """Nucleotide count mismatch with gene sequence should warn."""
        data = {
            "id": "test",
            "name": "Test",
            "nucleotides": [
                {"id": 1, "base": "A", "x": 0, "y": 0},
                {"id": 2, "base": "U", "x": 0, "y": 0},
            ],
            "base_pairs": [],
        }
        report = validate_structure(data, sample_gene)

        assert report.valid is True
        assert len(report.warnings) == 1
        assert "does not match gene sequence length" in report.warnings[0].message

    def test_missing_nucleotide_coordinates(self, sample_gene):
        """Missing x/y coordinates should fail."""
        data = {
            "id": "test",
            "name": "Test",
            "nucleotides": [
                {"id": 1, "base": "A"}  # Missing x, y
            ],
            "base_pairs": [],
        }
        report = validate_structure(data, sample_gene)

        assert report.valid is False
        assert any("x" in e.field for e in report.errors)


class TestBEDValidation:
    """Test BED track interval validation."""

    def test_valid_intervals_pass(self, sample_gene, valid_bed_intervals):
        """All valid intervals should pass."""
        report = validate_bed_intervals(valid_bed_intervals, sample_gene)

        assert report.valid is True
        assert len(report.errors) == 0
        assert len(report.valid_rows) == 3

    def test_start_greater_than_end(self, sample_gene):
        """Start >= end should fail."""
        intervals = [{"chrom": "12", "chromStart": 120291770, "chromEnd": 120291760}]
        report = validate_bed_intervals(intervals, sample_gene)

        assert report.valid is False
        assert len(report.errors) == 1
        assert "must be less than end" in report.errors[0].message

    def test_wrong_chromosome(self, sample_gene):
        """Chromosome mismatch should fail."""
        intervals = [{"chrom": "11", "chromStart": 120291760, "chromEnd": 120291770}]
        report = validate_bed_intervals(intervals, sample_gene)

        assert report.valid is False
        assert len(report.errors) == 1
        assert "does not match gene chromosome" in report.errors[0].message

    def test_out_of_bounds(self, sample_gene):
        """Intervals outside gene bounds should fail."""
        intervals = [{"chrom": "12", "chromStart": 120291000, "chromEnd": 120291010}]
        report = validate_bed_intervals(intervals, sample_gene)

        assert report.valid is False
        assert len(report.errors) == 1
        assert "outside gene bounds" in report.errors[0].message

    def test_score_out_of_range(self, sample_gene):
        """Score > 1000 should now pass validation - no score cap."""
        intervals = [
            {
                "chrom": "12",
                "chromStart": 120291760,
                "chromEnd": 120291770,
                "score": 1500,
            }
        ]
        report = validate_bed_intervals(intervals, sample_gene)

        assert report.valid is True
        assert len(report.errors) == 0

    def test_score_negative(self, sample_gene):
        """Negative score should fail validation."""
        intervals = [
            {"chrom": "12", "chromStart": 120291760, "chromEnd": 120291770, "score": -5}
        ]
        report = validate_bed_intervals(intervals, sample_gene)

        assert report.valid is False
        assert len(report.errors) >= 1

    def test_negative_start(self, sample_gene):
        """Negative start coordinate should fail."""
        intervals = [{"chrom": "12", "chromStart": -10, "chromEnd": 120291770}]
        report = validate_bed_intervals(intervals, sample_gene)

        assert report.valid is False
        assert len(report.errors) >= 1
        assert any("must be >= 0" in e.message for e in report.errors)

    def test_missing_required_fields(self, sample_gene):
        """Missing required fields should fail."""
        intervals = [{"chromStart": 120291760}]  # Missing chrom and chromEnd
        report = validate_bed_intervals(intervals, sample_gene)

        assert report.valid is False
        assert len(report.errors) == 2
        error_fields = {e.field for e in report.errors}
        assert "chrom" in error_fields
        assert "chromEnd" in error_fields

    def test_non_numeric_coordinates(self, sample_gene):
        """Non-numeric coordinates should fail."""
        intervals = [{"chrom": "12", "chromStart": "abc", "chromEnd": "def"}]
        report = validate_bed_intervals(intervals, sample_gene)

        assert report.valid is False
        assert len(report.errors) == 2
        assert report.errors[0].field == "chromStart"
        assert report.errors[1].field == "chromEnd"
