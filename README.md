# RNUdb - The snRNA Variant Database

[![CI/CD](https://github.com/Computational-Rare-Disease-Genomics-WHG/RNUdb/actions/workflows/ci.yml/badge.svg)](https://github.com/Computational-Rare-Disease-Genomics-WHG/RNUdb/actions/workflows/ci.yml)
[![Docker](https://img.shields.io/docker/pulls/ghcr.io/computational-rare-disease-genomics-whg/rnudb.svg)](https://github.com/Computational-Rare-Disease-Genomics-WHG/RNUdb/pkgs/container/rnudb)

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
- TailwindCSS v4 + shadcn/ui components
- gnomAD region-viewer for genomic visualization
- Vite for fast development and builds

**Backend**

- Python FastAPI
- SQLite database with SQLAlchemy
- JWT authentication via GitHub OAuth
- Alembic for database migrations

**Infrastructure**

- GitHub Actions CI/CD
- Multi-arch Docker images (amd64, arm64)
- GitHub Container Registry for image hosting

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Environment Setup](#environment-setup)
3. [Running Locally](#running-locally)
4. [Database Migrations](#database-migrations)
5. [Testing](#testing)
6. [Docker Deployment](#docker-deployment)
7. [Backup & Restore](#backup--restore)
8. [Project Structure](#project-structure)
9. [Documentation](#documentation)
10. [Contributing](#contributing)
11. [License](#license)

---

## Quick Start

### Prerequisites

- Python 3.11
- Node.js 20.19+ or 22.12+ (for Vite 8)
- [uv](https://github.com/astral-sh/uv) (Python package manager)
- Docker (for containerized deployment)

### Installation

```bash
# Clone the repository
git clone https://github.com/Computational-Rare-Disease-Genomics-WHG/RNUdb.git
cd RNUdb

# Install Python dependencies
uv sync

# Install frontend dependencies
npm install

# Copy environment file
cp .env.example .env
```

---

## Environment Setup

### Required Environment Variables

Create a `.env` file with the following variables:

```bash
# GitHub OAuth - Create an OAuth App at https://github.com/settings/developers
GITHUB_CLIENT_ID=your_github_oauth_app_client_id
GITHUB_CLIENT_SECRET=your_github_oauth_app_client_secret

# JWT Authentication - Generate a secure random key
JWT_SECRET_KEY=your_random_secret_key_at_least_32_characters

# Admin Users - Comma-separated GitHub usernames who have admin access
ADMIN_GITHUB_LOGINS=username1,username2

# Frontend URL - Used for OAuth callback redirects
FRONTEND_URL=http://localhost:5173
```

### Setting up GitHub OAuth

1. Go to GitHub Settings → Developer settings → OAuth Apps
2. Create a new OAuth App:
   - **Homepage URL**: `http://localhost:5173`
   - **Authorization callback URL**: `http://localhost:5173/api/auth/callback`
3. Copy the Client ID and Client Secret to your `.env` file

---

## Running Locally

### Development Mode (Frontend + Backend)

```bash
npm run dev
```

This runs both the frontend (Vite) and backend (Uvicorn) concurrently:

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000

### Manual Start (Separate Terminals)

**Backend:**

```bash
uv run python3 dev.py
# Runs on http://localhost:8000
```

**Frontend:**

```bash
npm run dev
# Runs on http://localhost:5173
```

### Verify Installation

After starting both servers:

1. Open http://localhost:5173 in your browser
2. Click "Sign In" to authenticate via GitHub
3. You should be redirected back and logged in

---

## Database Migrations

RNUdb uses Alembic for database schema migrations.

### Apply All Migrations

```bash
uv run alembic upgrade head
```

### Create a New Migration

After making changes to SQLAlchemy models:

```bash
uv run alembic revision --autogenerate -m "describe_your_change"
```

Then edit the generated file in `alembic/versions/` to review and add details.

### Migration Commands

| Command                       | Description                      |
| ----------------------------- | -------------------------------- |
| `uv run alembic upgrade head` | Apply all pending migrations     |
| `uv run alembic downgrade -1` | Roll back the last migration     |
| `uv run alembic current`      | Show current migration version   |
| `uv run alembic history`      | Show migration history           |
| `uv run alembic check`        | Verify migrations are up to date |

---

## Testing

### Backend Tests

```bash
# Run all backend tests
uv run pytest

# Run specific test file
uv run pytest tests/test_validation.py

# Run with verbose output
uv run pytest -v

# Run with coverage
uv run pytest --cov=api --cov-report=html
```

### Frontend Tests (Playwright E2E)

```bash
# Run all e2e tests
npx playwright test

# Run specific test file
npx playwright test tests/e2e/functional.spec.ts

# Run with UI
npx playwright test --ui

# Debug mode
npx playwright test --debug
```

### Pre-commit Hooks

Before committing, run:

```bash
uv run pre-commit run --all-files
```

This runs:

- Ruff (Python linting & formatting)
- ESLint (TypeScript linting)
- Prettier (code formatting)
- Various file checks

---

## Docker Deployment

### Quick Start with Docker Compose

```bash
# Pull and run the latest image
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

The app runs on http://localhost:8000

### Build Docker Image Locally

```bash
# Build for your current architecture
docker build -t rnudb:local .

# Build for multiple architectures (requires Docker Buildx)
docker buildx build --platform linux/amd64,linux/arm64 -t rnudb:local .
```

### Run Container

```bash
# Run with environment variables
docker run -d \
  -p 8000:8000 \
  -e GITHUB_CLIENT_ID=your_client_id \
  -e GITHUB_CLIENT_SECRET=your_client_secret \
  -e JWT_SECRET_KEY=your_secret_key \
  -e ADMIN_GITHUB_LOGINS=your_github_username \
  -e FRONTEND_URL=http://localhost:8000 \
  -v ./data:/app/data \
  ghcr.io/computational-rare-disease-genomics-whg/rnudb:latest
```

### Production Deployment

The project automatically builds and pushes Docker images to GitHub Container Registry on main branch commits.

Image: `ghcr.io/computational-rare-disease-genomics-whg/rnudb:latest`

---

## Backup & Restore

### Backup SQLite Database

The database is stored at `data/database.db`. To create a backup:

```bash
# Create a timestamped backup
mkdir -p data/backups
cp data/database.db "data/backups/database-$(date +%Y%m%d-%H%M%S).db"

# Or use sqlite3 backup command (atomic)
sqlite3 data/database.db ".backup 'data/backups/database-backup.db'"
```

### Automated Backup Script

Create a backup script:

```bash
#!/bin/bash
# scripts/backup.sh
BACKUP_DIR="data/backups"
DATE=$(date +%Y%m%d-%H%M%S)

mkdir -p "$BACKUP_DIR"
cp data/database.db "$BACKUP_DIR/database-$DATE.db"

# Keep only last 7 backups
cd "$BACKUP_DIR" && ls -t | tail -n +8 | xargs -r rm

echo "Backup created: database-$DATE.db"
```

Make it executable: `chmod +x scripts/backup.sh`

### Restore from Backup

```bash
# Stop the server first
# Then restore
cp data/backups/database-20240115-120000.db data/database.db
```

### Export Data (JSON)

```bash
# Export all genes
curl -s http://localhost:8000/api/genes > backup-genes.json

# Export all variants
curl -s http://localhost:8000/api/variants > backup-variants.json
```

---

## Project Structure

```
RNUdb/
├── api/                    # FastAPI backend
│   ├── main.py            # Application entry point
│   ├── routers/           # API route handlers
│   │   ├── auth.py        # Authentication endpoints
│   │   ├── genes.py       # Gene CRUD endpoints
│   │   ├── variants.py    # Variant CRUD endpoints
│   │   ├── literature.py  # Literature endpoints
│   │   ├── approvals.py  # Admin approval workflow
│   │   └── imports.py     # Batch import endpoints
│   └── models.py          # Pydantic/SQLAlchemy models
├── src/                   # React frontend
│   ├── components/       # React components
│   │   ├── ui/           # shadcn/ui components
│   │   ├── Curate/      # Curation interface components
│   │   └── GenomeBrowser/ # Genomic visualization
│   ├── pages/           # Route-level pages
│   ├── context/         # React context (auth state)
│   ├── hooks/           # Custom React hooks
│   ├── services/        # API service utilities
│   └── types/           # TypeScript type definitions
├── alembic/              # Database migrations
│   └── versions/        # Migration files
├── data/                 # Database and backups
├── tests/                # Backend pytest suite
│   ├── conftest.py      # Test fixtures
│   ├── test_*.py        # Test modules
├── tests/e2e/           # Playwright e2e tests
├── scripts/             # Utility scripts
├── docs/                 # Documentation
├── .github/workflows/    # CI/CD pipelines
│   ├── ci.yml           # Tests and linting
│   └── build.yml        # Docker build & push
├── pyproject.toml       # Python dependencies
├── package.json          # Node dependencies
├── vite.config.ts       # Vite configuration
├── Dockerfile           # Multi-stage Docker build
└── docker-compose.yml   # Docker Compose configuration
```

---

## Documentation

- [Development Guide](docs/DEVELOPMENT.md) - Setup and development workflow
- [Curator Guide](docs/FOR_CURATORS.md) - How to curate data
- [Database Schema](docs/schema.md) - Database table documentation
- [Deployment Guide](docs/DEPLOYMENT.md) - Docker and production deployment
- [API Documentation](https://rnudb.rarediseasegenomics.org/api-docs) - Interactive API docs (live)

---

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Development Workflow

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make changes and run tests
4. Run pre-commit hooks: `uv run pre-commit run --all-files`
5. Commit with clear messages
6. Push and create a Pull Request

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Citation

If you use RNUdb in your research, please cite:

```
RNUdb: A curated database for small nuclear RNA variants
Rare Disease Genomics Lab
https://rnudb.rarediseasegenomics.org
```

---

## Support

- **Issues**: [GitHub Issues](https://github.com/Computational-Rare-Disease-Genomics-WHG/RNUdb/issues)
- **Email**: info@rarediseasegenomics.org
- **Website**: https://rnudb.rarediseasegenomics.org
