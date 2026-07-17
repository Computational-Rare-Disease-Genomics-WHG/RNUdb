# Contributing to RNUdb

Thank you for your interest in contributing to RNUdb! This document provides guidelines and instructions for contributing.

## Code of Conduct

Be respectful and constructive in all interactions. We welcome contributors of all experience levels.

## How to Contribute

### Reporting Bugs

1. Check if the issue already exists in [GitHub Issues](https://github.com/CRDG/RNUdb/issues)
2. If not, create a new issue with:
   - Clear title and description
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots if applicable
   - Environment details (browser, OS, etc.)

### Suggesting Features

1. Open a GitHub Issue with the "enhancement" label
2. Describe the feature and its use case
3. Discuss implementation approach with maintainers

### Pull Requests

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes following our [Development Guide](docs/DEVELOPMENT.md)
4. Add tests for new functionality
5. Ensure all tests pass (`uv run pytest`)
6. Commit with clear messages following [Conventional Commits](https://www.conventionalcommits.org/)
7. Push to your fork and submit a Pull Request

## Development Setup

See [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) for full setup instructions. Quick start:

```bash
# Install Python dependencies (requires uv: https://github.com/astral-sh/uv)
uv sync

# Install frontend dependencies
npm install

# Copy and configure environment
cp .env.example .env

# Apply database migrations
uv run alembic upgrade head

# Start development servers
npm run dev
```

### Code Style

**Python**

- Follow PEP 8
- Use type hints where possible
- Document functions with docstrings

**TypeScript/React**

- Use TypeScript strict mode
- Follow existing component patterns
- Use TailwindCSS utility classes
- Prefer composition over inheritance

### Testing

All new features must include tests:

```bash
# Run tests
uv run pytest -v

# Run specific test
uv run pytest tests/test_validation.py::TestVariantValidation::test_valid_variants_pass -v
```

### Commit Message Format

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

Types:

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Test changes
- `chore`: Build process, dependencies, etc.

Examples:

```
feat(variants): add batch import wizard
fix(ui): resolve modal transparency issue
docs(api): expand endpoint documentation
```

## Database Migrations

When making schema changes:

1. Update SQLAlchemy models in `api/models.py`
2. Generate Alembic migration: `uv run alembic revision --autogenerate -m "describe your change"`
3. Review the generated file in `alembic/versions/`
4. Apply migration: `uv run alembic upgrade head`
5. Document changes in PR description

## Questions?

- Open a GitHub Discussion
- Email: nwhiffin@well.ox.ac.uk

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
