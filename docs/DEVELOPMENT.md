# Development Guide

This guide covers setting up a local development environment for RNUdb.

## Prerequisites

- **Python 3.11** - Required for the backend
- **Node.js 20.19+ or 22.12+** - Required for Vite 8 frontend
- **uv** - Python package manager (install via `curl -LsSf https://astral.sh/uv/install.sh | sh` or `pip install uv`)
- **Docker** - Optional, for containerized development

## Initial Setup

### 1. Clone the Repository

```bash
git clone https://github.com/Computational-Rare-Disease-Genomics-WHG/RNUdb.git
cd RNUdb
```

### 2. Install Dependencies

**Python:**

```bash
uv sync
```

**Frontend:**

```bash
npm install
```

### 3. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your settings (see [Environment Setup](../README.md#environment-setup) in README).

### 4. Setup Database

```bash
# Apply migrations
uv run alembic upgrade head
```

### 5. Run Development Servers

```bash
npm run dev
```

This runs both:

- **Frontend**: http://localhost:5173 (Vite)
- **Backend**: http://localhost:8000 (Uvicorn)

The development script uses `concurrently` to run both servers. The backend auto-reloads on code changes.

---

## Running Tests

### Backend Tests

```bash
# Run all tests
uv run pytest

# Run with verbose output
uv run pytest -v

# Run specific test file
uv run pytest tests/test_validation.py

# Run specific test
uv run pytest tests/test_validation.py::test_gene_validation

# Run with coverage
uv run pytest --cov=api --cov-report=html
```

### E2E Tests (Playwright)

```bash
# Run all e2e tests
npx playwright test

# Run specific test file
npx playwright test tests/e2e/functional.spec.ts

# Run with UI mode
npx playwright test --ui

# Debug mode
npx playwright test --debug
```

### CI Simulation

To run the full CI pipeline locally:

```bash
# 1. Run pre-commit hooks
uv run pre-commit run --all-files

# 2. Run backend tests
uv run pytest

# 3. Build frontend
npm run build

# 4. Run e2e tests
npx playwright test
```

---

## Code Quality

### Pre-commit Hooks

This project uses pre-commit hooks to ensure code quality:

```bash
# Run all hooks
uv run pre-commit run --all-files

# Run on staged files only
uv run pre-commit run

# Install hooks (usually automatic on first commit)
uv run pre-commit install
```

Hooks include:

- **Ruff** - Python linting and formatting
- **ESLint** - TypeScript/JavaScript linting
- **Prettier** - Code formatting
- Various file checks (trailing whitespace, merge conflicts, etc.)

### Manual Linting

**Python:**

```bash
# Lint
uv run ruff check api tests

# Format
uv run ruff format api tests

# Fix automatically
uv run ruff check --fix api tests
```

**TypeScript:**

```bash
# Lint
npm run lint

# Fix automatically
npx eslint --fix src/
```

**TypeScript Check:**

```bash
npx tsc --noEmit
```

---

## Database Development

### Creating Migrations

After modifying SQLAlchemy models in `api/models.py`:

```bash
uv run alembic revision --autogenerate -m "describe_your_change"
```

Review the generated file in `alembic/versions/` before applying.

### Applying Migrations

```bash
# Apply all pending migrations
uv run alembic upgrade head

# Rollback one migration
uv run alembic downgrade -1

# Rollback to specific revision
uv run alembic downgrade <revision_id>
```

### Viewing Database State

```bash
# Current version
uv run alembic current

# Migration history
uv run alembic history

# Check if up to date
uv run alembic check
```

---

## Development Workflow

### Adding a New Feature

1. **Create a branch:**

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make changes** to backend and/or frontend

3. **Run tests** to verify:

   ```bash
   uv run pytest
   npx playwright test
   ```

4. **Run linting:**

   ```bash
   uv run pre-commit run --all-files
   ```

5. **Build frontend:**

   ```bash
   npm run build
   ```

6. **Commit and push:**
   ```bash
   git add .
   git commit -m "Add your feature"
   git push -u origin feature/your-feature-name
   ```

### Code Style Guidelines

**Python:**

- Follow PEP 8 (enforced by Ruff)
- Use type hints where beneficial
- Use pathlib for file paths

**TypeScript/React:**

- Use functional components with hooks
- Follow existing component patterns in `src/components/`
- Use the `@/` alias for imports (e.g., `import { Button } from "@/components/ui/button"`)

---

## Troubleshooting

### Backend Won't Start

**Port in use:**

```bash
# Kill processes on port 8000
lsof -ti:8000 | xargs kill -9
```

**Database locked:**

```bash
# Check for concurrent processes
lsof data/database.db
```

### Frontend Issues

**Node modules corrupted:**

```bash
rm -rf node_modules
npm install
```

**TypeScript errors:**

```bash
npx tsc --noEmit
```

### Database Reset

```bash
# Remove database and remigrate
rm data/database.db
uv run alembic upgrade head
```

---

## Additional Resources

- [README.md](../README.md) - Main documentation
- [AGENTS.md](../AGENTS.md) - AI coding agent guidelines
- [API Documentation](http://localhost:8000/api-docs) - Interactive API docs (when running)
- [GitHub Actions](../.github/workflows/) - CI/CD configuration
