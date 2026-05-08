# Curator Guide

This guide covers using RNUdb as a curator for data management and curation tasks.

## User Roles

RNUdb has four user roles:

| Role        | Description              | Permissions                          |
| ----------- | ------------------------ | ------------------------------------ |
| **Guest**   | Unauthenticated visitors | View public data only                |
| **Pending** | Awaiting approval        | Cannot curate                        |
| **Curator** | Data contributor         | Add/edit pending changes             |
| **Admin**   | Data approver            | Approve/reject changes, manage users |

Curators can create pending changes that require admin approval before going live.

---

## Authentication

### Signing In

1. Visit https://rnudb.rarediseasegenomics.org
2. Click "Sign In" in the header
3. You will be redirected to GitHub for authentication
4. After authentication, you will be redirected back

Your role is determined by your GitHub username being in the `ADMIN_GITHUB_LOGINS` environment variable (admin) or having an existing user record with curator role.

### First-time Login

On first login, you will be created as a "pending" user until an admin upgrades your role to "curator".

---

## Curate Dashboard

Navigate to `/curate` to access the curator dashboard.

### Dashboard Features

- **Gene selector** - Select a gene to curate
- **Data tabs** - Switch between Genes, Variants, Literature, Variant Associations, Structures, and BED Tracks
- **Import wizards** - Batch import data for each entity type
- **Pending changes** - View your pending submissions
- **Refresh variants** - Update population frequency data for existing genes

---

## Curating Data

### Adding a Gene

1. Go to `/curate`
2. Select a gene from the dropdown or enter a new gene ID
3. Fill in the gene details:
   - Gene ID (e.g., RNU4-2)
   - Full Name
   - Chromosome
   - Start/End positions
   - Strand
   - Sequence
   - Description
4. Optional: Enable "Fetch population data" to automatically import gnomAD and All of Us frequency data
5. Click "Save Changes"
6. Your changes will appear as "pending" until an admin approves them

### Adding Variants

1. Select a gene in the curate dashboard
2. Go to the "Variants" tab
3. Click "Add Variant" or use the Import Wizard for batch import
4. Fill in variant details:
   - Variant ID (format: chr{chrom}-{pos}-{ref}-{alt})
   - Position
   - Reference/Alternate alleles
   - Clinical significance
   - Population frequencies (gnomAD, UK Biobank, All of Us)
   - CADD score
5. Save as pending change

### Adding Literature

1. Go to the "Literature" tab
2. Add publication details:
   - Title
   - Authors
   - Journal
   - Year
   - DOI
3. Link literature to variants using the variant literature counts

### Variant Associations

The Variant Association tab links variants to literature with clinical classifications:

1. Go to the "Variant Association" tab
2. Add or edit variant classifications:
   - Clinical significance (ACMG guidelines)
   - Zygosity (Homozygous, Heterozygous, Compound Heterozygous)
   - Inheritance pattern (Autosomal Dominant, Recessive, etc.)
   - Disease association
   - Number of individuals diagnosed
   - Linked variant IDs
3. Use the Import Wizard for bulk import from CSV

### RNA Structures

1. Go to the "Structures" tab
2. Add or edit RNA secondary structures
3. Use the interactive structure editor to:
   - Add nucleotides with positions
   - Define base pairs
   - Add structural annotations

### BED Tracks

1. Go to the "BED Tracks" tab
2. Import genomic annotation tracks:
   - Conservation scores
   - Regulatory elements
   - Custom annotations
3. Specify chromosome, start/end positions, and scores

---

## Import Wizards

RNUdb provides batch import wizards for each data type:

| Wizard                         | Description                          | File Format |
| ------------------------------ | ------------------------------------ | ----------- |
| **Gene Import**                | Add multiple genes                   | CSV/JSON    |
| **Variant Import**             | Batch add variants                   | CSV/JSON    |
| **Variant Import (VCF)**       | Import variants from VCF files       | VCF         |
| **Literature Import**          | Add publications                     | CSV/JSON    |
| **Variant Association Import** | Bulk import clinical classifications | CSV         |
| **Structure Import**           | Import RNA structures                | JSON        |
| **BED Track Import**           | Import annotation tracks             | BED/CSV     |

Access wizards from the curate dashboard tabs.

---

## Pending Changes Workflow

### Viewing Your Pending Changes

1. Go to `/curate`
2. Look for the "My Pending Changes" section
3. Each change shows: entity type, action, status, timestamp

### Change States

| Status       | Description                             |
| ------------ | --------------------------------------- |
| **pending**  | Awaiting admin review                   |
| **approved** | Applied to live database                |
| **rejected** | Rejected by admin                       |
| **applied**  | Changes have been applied (for deletes) |

### Editing Pending Changes

You can edit your pending changes before they are approved:

1. Find your pending change
2. Click "Edit" to modify
3. Save updates

### Cancelling Pending Changes

Before admin approval, you can withdraw your pending change:

1. Find your pending change
2. Click "Delete" or "Withdraw"
3. The change will be cancelled

---

## Admin Approval (For Admins)

_This section describes the approval workflow for administrators._

### Viewing Pending Changes

1. Go to `/admin` (admin dashboard)
2. View the "Pending Approvals" tab
3. See all pending changes from all curators

### Approving Changes

1. Review the pending change details
2. Click "Approve" to apply the change to the live database
3. Optionally add review notes

### Rejecting Changes

1. Review the pending change
2. Click "Reject"
3. Add a reason for rejection (curator will see this)

### Batch Operations

Admins can approve or reject multiple changes at once.

---

## Best Practices

### Data Quality

- Verify variant positions against reference genome (GRCh38)
- Include population frequency data when available
- Add literature citations for clinical significance claims
- Use standardized terminology (e.g., ACMG guidelines for clinical significance)

### Version Control

- All changes create audit log entries
- Keep track of who made what changes and when
- Review the Change Log in the admin dashboard

### Communication

- Use review notes to explain approval/rejection reasons
- Contact curators if additional information is needed

---

## External Resources

For step-by-step visual guides and tutorials, visit the RNUdb website:

- **Curator Tutorial**: https://rnudb.rarediseasegenomics.org/curator-guide
- **Video Tutorials**: https://rnudb.rarediseasegenomics.org/tutorials

---

## Troubleshooting

### Cannot Access Curate Dashboard

- Ensure you are logged in
- Contact an admin to upgrade your role to "curator"

### Pending Changes Not Appearing

- Check that you are logged in as the same account that created the changes
- Contact admin if changes were rejected without notification

### Import Failures

- Check file format matches the expected schema
- Validate data types (numbers, strings)
- Ensure required fields are populated

---

## Support

- **Issues**: Create a GitHub issue for bugs or feature requests
- **Email**: info@rarediseasegenomics.org
- **Admin Contact**: Reach out to the admin team for role upgrades or permissions
