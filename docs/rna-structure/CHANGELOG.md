# Changelog

All notable changes to the RNA structure import format are documented here.

## [1.0.0] - 2026-05-06

### Added

- Initial documentation of the RNA structure import format
- Field reference for all object types (nucleotides, base_pairs, annotations, structural_features)
- Validation rules (errors and warnings)
- Naming convention documentation (camelCase to snake_case conversion)
- Sample JSON files:
  - `minimal.json` - Minimal valid structure
  - `with-base-pairs.json` - Structure with base pair connections
  - `with-annotations.json` - Structure with text annotations
  - `full.json` - Complete structure with all features
- Related links to API endpoints and components

---

## Versioning

This document follows [Semantic Versioning](https://semver.org/) (MAJOR.MINOR.PATCH):

- **MAJOR** - Incompatible changes to the format
- **MINOR** - Backwards-compatible new fields or features
- **PATCH** - Documentation updates without format changes

---

## Format Specification Version

The current format specification version is **1.0.0**. This version is stored in the `README.md` header and should be updated whenever changes are made.

---

## Updating This Document

When making changes to the import format:

1. Update the version in `README.md` header
2. Add an entry to this `CHANGELOG.md`
3. If adding new fields, update the Field Reference section
4. If adding new validation rules, update the Validation Rules section
5. Create an issue on GitHub to track the change

---

## Related Issues

- Issue #38: Document RNA structure import format
