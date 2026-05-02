# RNUdb - The snRNA Variant Database

[![CI/CD](https://github.com/CRDG/RNUdb/actions/workflows/ci.yml/badge.svg)](https://github.com/CRDG/RNUdb/actions/workflows/ci.yml)

A curated database for small nuclear RNA (snRNA) variants in rare disease genomics. RNUdb provides researchers, clinicians, and curators with comprehensive tools to explore, visualize, and annotate snRNA variants, structures, and associated literature.

## Features

- **Interactive RNA Structure Visualization** - View and edit RNA secondary structures with a WYSIWYG editor
- **Variant Database** - Curated clinical variants with gnomAD, UK Biobank, and All of Us population frequencies
- **Literature Integration** - Link publications and citations to variants
- **Genomic Browser** - Visualize variants alongside genomic annotation tracks (BED files)
- **Curator Dashboard** - Gene-scoped curation interface with batch import wizards
- **Admin Approval Workflow** - Changes require admin approval before going live
- **Audit Logging** - Complete history of all data modifications
- **REST API** - Public API for programmatic access to all data

## Technology Stack

**Frontend**
- React 19 + TypeScript
- TailwindCSS + shadcn/ui components
- gnomAD region-viewer for genomic visualization
- React Query for data fetching

**Backend**
- Python FastAPI
- SQLite database
- JWT authentication via GitHub OAuth
- Pydantic for data validation

**Infrastructure**
- GitHub Actions CI/CD
- Automated testing with pytest

## Quick Start

### Prerequisites
- Python 3.11
- Node.js 20+
- uv (Python package manager)

### Installation

```bash
# Clone the repository
git clone https://github.com/CRDG/RNUdb.git
cd RNUdb

# Install Python dependencies
uv pip install -e ".[dev]"

# Install frontend dependencies
npm install

# Create database
python -c "from rnudb_utils.database import create_database; create_database()"

# Set up environment
cp .env.example .env
# Edit .env with your GitHub OAuth credentials
```

### Development

```bash
# Start backend server
uvicorn api.main:app --reload --port 8000

# Start frontend dev server (in another terminal)
npm run dev

# Run database migrations
python scripts/migrate.py
```

### Testing

```bash
# Run all tests
python -m pytest tests/ -v

# Run with coverage
python -m pytest tests/ --cov=api --cov-report=html

# Run specific test file
python -m pytest tests/test_validation.py -v
```

### Production Build

```bash
# Build frontend
npm run build

# Start production server
uvicorn api.main:app --host 0.0.0.0 --port 8000
```

## Project Structure

```
RNUdb/
├── api/                    # FastAPI backend
│   ├── routers/           # API route handlers
│   ├── models.py          # Pydantic models
│   └── services/          # Business logic
├── src/                   # React frontend
│   ├── components/        # React components
│   ├── pages/            # Route-level pages
│   └── data/             # Data fetching utilities
├── rnudb_utils/          # Shared utilities
│   └── database.py       # Database operations
├── tests/                # Test suite
├── scripts/              # Migration and data scripts
└── docs/                 # Documentation

```

## Documentation

- [Development Guide](docs/DEVELOPMENT.md) - Setup and development workflow
- [Curator Guide](docs/FOR_CURATORS.md) - How to curate data
- [API Documentation](https://rnudb.rarediseasegenomics.org/api-docs) - Interactive API docs

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Citation

If you use RNUdb in your research, please cite:

```
RNUdb: A curated database for small nuclear RNA variants
[Publication details pending]
```

## Contact

- Issues: [GitHub Issues](https://github.com/CRDG/RNUdb/issues)
- Email: info@rarediseasegenomics.org
