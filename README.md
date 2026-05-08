<!-- Logo -->
<p align="center">
  <img src="https://raw.githubusercontent.com/Computational-Rare-Disease-Genomics-WHG/RNUdb/main/public/favicon.svg" width="128" height="128" alt="RNUdb Logo">
</p>

<h1 align="center">RNUdb</h1>

<p align="center"><strong>The snRNA Variant Database</strong></p>

<p align="center">
  <a href="https://github.com/Computational-Rare-Disease-Genomics-WHG/RNUdb/actions/workflows/ci.yml">
    <img src="https://github.com/Computational-Rare-Disease-Genomics-WHG/RNUdb/actions/workflows/ci.yml/badge.svg" alt="CI/CD">
  </a>
  <a href="https://github.com/Computational-Rare-Disease-Genomics-WHG/RNUdb/pkgs/container/rnudb">
    <img src="https://img.shields.io/docker/pulls/ghcr.io/computational-rare-disease-genomics-whg/rnudb.svg" alt="Docker Pulls">
  </a>
  <a href="https://codecov.io/gh/Computational-Rare-Disease-Genomics-WHG/RNUdb">
    <img src="https://codecov.io/gh/Computational-Rare-Disease-Genomics-WHG/RNUdb/branch/main/graph/badge.svg?flag=backend" alt="Backend Coverage">
  </a>
  <a href="https://codecov.io/gh/Computational-Rare-Disease-Genomics-WHG/RNUdb">
    <img src="https://codecov.io/gh/Computational-Rare-Disease-Genomics-WHG/RNUdb/branch/main/graph/badge.svg?flag=frontend" alt="Frontend Coverage">
  </a>
</p>

---

## What is RNUdb?

RNUdb is a curated database for small nuclear RNA (snRNA) variants in rare disease genomics. It provides researchers, clinicians, and curators with tools to explore, visualize, and annotate snRNA variants, RNA structures, and associated literature.

### Features

- **Variant Database** - Curated clinical variants with population frequencies (gnomAD, UK Biobank, All of Us)
- **Interactive RNA Structures** - View and edit RNA secondary structures
- **Genomic Browser** - Visualize variants alongside annotation tracks
- **Literature Integration** - Link publications to variants
- **Curator Dashboard** - Batch import and data management
- **Public API** - Programmatic access to all data

For full feature details and screenshots, see the [Curator Guide](docs/FOR_CURATORS.md).

---

## Quick Start

```bash
# Clone the repository
git clone https://github.com/Computational-Rare-Disease-Genomics-WHG/RNUdb.git
cd RNUdb

# Install dependencies
uv sync
npm install

# Setup environment
cp .env.example .env

# Run the app
npm run dev
```

The app runs at **http://localhost:5173** (frontend) and **http://localhost:8000** (API).

### First Login

1. Click "Sign In" in the header
2. Authenticate via GitHub
3. If first login, you'll be a "pending" user awaiting admin approval

---

## Documentation

| Guide                                                      | Description                                       |
| ---------------------------------------------------------- | ------------------------------------------------- |
| [Curator Guide](docs/FOR_CURATORS.md)                      | How to curate data, import files, manage variants |
| [Development Guide](docs/DEVELOPMENT.md)                   | Local dev setup, testing, code quality            |
| [Deployment Guide](docs/DEPLOYMENT.md)                     | Docker, production, hosting                       |
| [Database Schema](docs/schema.md)                          | Database tables and API endpoints                 |
| [API Docs](https://rnudb.rarediseasegenomics.org/api-docs) | Interactive API reference                         |

---

## Support

- **Issues**: [GitHub Issues](https://github.com/Computational-Rare-Disease-Genomics-WHG/RNUdb/issues)
- **Email**: info@rarediseasegenomics.org
- **Website**: https://rnudb.rarediseasegenomics.org
