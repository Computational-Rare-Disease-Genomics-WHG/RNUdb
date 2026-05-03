# AGENTS.md

Repository-specific guidance for AI coding agents working in RNUdb.

**Tradeoff:** These rules bias toward caution, minimal diffs, and verification over speed. For trivial requests, use judgment, but do not skip validation before committing.

> For deeper context, read the relevant files in `docs/`, `.github/workflows/`, and the nearest module before changing code.

---

## Core Behavior

### 1. Think before coding
- State assumptions explicitly.
- If the request is ambiguous, list the plausible interpretations and ask which one is intended.
- If a simpler solution exists, propose it before implementing a more complex one.
- If something is unclear, stop and ask instead of guessing.

### 2. Prefer the simplest change
- Implement the minimum code needed to satisfy the request.
- Do not add abstractions, flags, or configurability unless asked.
- Do not add speculative error handling for impossible states.
- If a solution feels overengineered, simplify it.

### 3. Make surgical edits
- Touch only files relevant to the request.
- Do not refactor unrelated code.
- Match the existing style and patterns of the surrounding code.
- Remove only the unused code your own change created.
- If you notice unrelated issues, mention them separately; do not fix them opportunistically.

### 4. Work goal-first
For non-trivial tasks, define a short verification-oriented plan before editing:

```text
1. [Change] → verify: [specific check]
2. [Change] → verify: [specific check]
3. [Change] → verify: [specific check]
```

Examples:
- “Fix bug” → reproduce with a test, implement fix, run affected tests.
- “Add field” → update model/schema/API/UI, add migration, verify build/tests.
- “Refactor” → preserve behavior, verify before/after with tests.

---

## Codebase Map

This is a monorepo-style repository with a Python backend and a React frontend.

- `api/` — FastAPI backend, routers, models, auth, imports
- `src/` — React + TypeScript frontend
- `src/components/` — UI and feature components
- `src/components/ui/` — reusable UI primitives, including Radix-based components
- `src/context/` — React Context state, including auth
- `src/services/api.ts` — central API service utilities
- `src/types/index.ts` — shared frontend types; update carefully
- `alembic/` — Alembic migration config and versions
- `alembic/versions/` — migration files; never edit existing migrations
- `tests/` — backend pytest suite with shared fixtures in `tests/conftest.py`
- `data/database.db` — local SQLite database file; do not edit directly
- `.github/workflows/` — CI/build pipeline definitions

---

## Stack

### Backend
- FastAPI
- SQLAlchemy (synchronous)
- Alembic
- SQLite
- `python-jose` for JWT handling
- `authlib` for GitHub OAuth

### Frontend
- React
- TypeScript
- Vite
- React Router DOM
- Tailwind CSS v4
- styled-components
- Radix UI
- `@tanstack/react-table`
- `@gnomad/track-variants`

### Tooling
- `uv` for Python commands
- `pytest` for backend tests
- `ruff` for Python linting/formatting
- `eslint` for frontend linting
- `pre-commit` for staged checks
- Playwright for e2e tests
- GitHub Actions for CI and image builds

---

## Environment Setup

When starting from a fresh checkout, use this sequence:

1. Copy env file: `cp .env.example .env`
2. Install Python dependencies: `uv sync`
3. Install frontend dependencies: `npm install`
4. Apply database migrations: `uv run alembic upgrade head`
5. Start local development: `npm run dev`

Notes:
- `npm run dev` starts both frontend and backend concurrently.
- Backend dev server is started via `uv run python3 dev.py`, which runs Uvicorn with reload.
- Alembic uses the DB URL from `alembic.ini`, not environment variables.
- The app itself loads `.env` via `python-dotenv`.

---

## Commands

### Python
Always run Python tooling through `uv run`.

| Task | Command |
|---|---|
| Start backend indirectly via dev script | `npm run dev` |
| Run all backend tests | `uv run pytest` |
| Run one test file | `uv run pytest tests/path/test_file.py` |
| Run one test | `uv run pytest tests/path/test_file.py::test_name` |
| Lint Python | `uv run ruff check api tests` |
| Lint and autofix Python | `uv run ruff check --fix api tests` |
| Format Python | `uv run ruff format api tests` |
| Run all pre-commit hooks | `uv run pre-commit run --all-files` |
| Run pre-commit on staged files | `uv run pre-commit run` |

### Frontend
| Task | Command |
|---|---|
| Start frontend + backend dev | `npm run dev` |
| Lint frontend | `npx eslint src --ext .ts,.tsx` |
| Lint and autofix one file | `npx eslint --fix src/path/to/file.tsx` |
| TypeScript check | `npx tsc --noEmit` |
| Production build | `npm run build` |

### Alembic
| Task | Command |
|---|---|
| Create migration from model changes | `uv run alembic revision --autogenerate -m "short_description"` |
| Apply all migrations | `uv run alembic upgrade head` |
| Roll back one revision | `uv run alembic downgrade -1` |
| Roll back to revision | `uv run alembic downgrade <revision_id>` |
| Show current revision | `uv run alembic current` |
| Show history | `uv run alembic history --verbose` |
| Check migration state | `uv run alembic check` |

Use file-scoped or targeted commands during iteration. Run full-project verification before committing [web:21][web:33].

---

## Development Flow

Use this default sequence for most tasks:

```text
Read relevant files → Plan → Write → Lint → Test → Build → Commit
```

Detailed flow:
1. Read the nearest related files first.
2. State assumptions and a short plan for non-trivial tasks.
3. Implement the smallest possible change.
4. Run targeted lint/test checks while iterating.
5. Run full validation before committing.
6. Commit only after code, tests, docs, and migrations are in sync.

### Required before commit
- `uv run pytest`
- `npm run build`
- `uv run pre-commit run --all-files`

Do not commit with failing tests, failing pre-commit hooks, or a broken frontend build.

---

## Autonomy Boundaries

### Safe to do without asking
- Read files and inspect the codebase
- Run lint, tests, builds, and pre-commit
- Edit code directly related to the request
- Generate a new Alembic migration file with `--autogenerate`
- Update docs that are clearly required by the code change

### Ask before doing
- Applying migrations to a non-local database
- Running `alembic downgrade`
- Installing or removing dependencies
- Deleting files
- Editing secrets or `.env`
- Editing CI workflows, deployment config, Docker publishing, or release config unless the task is specifically about those
- Making broad refactors unrelated to the request
- Creating new barrel exports

### Never do
- Commit `.env`
- Manually edit `data/database.db`
- Edit old migration files in `alembic/versions/`
- Modify lockfiles by hand (`uv.lock`, `package-lock.json`)
- Force-push or push directly unless explicitly asked

Tiered permission boundaries improve safety for coding agents, especially around schema changes and repository operations [web:34][web:35][web:41].

---

## Files Requiring Extra Care

Treat these as protected unless the request clearly requires touching them:

- `alembic/versions/*.py` — never edit an existing migration after creation
- `data/database.db` — never edit directly
- `.env` — contains secrets, never commit
- `uv.lock` and `package-lock.json` — only change through tooling
- `src/types/index.ts` — update only when feature changes require it
- `.github/workflows/*.yml` — change only for CI/build-specific tasks

If a task would require touching a protected file, say so explicitly before proceeding.

---

## FastAPI Conventions

- Backend framework is FastAPI.
- Protected routes live in `api/routers/`.
- Existing auth dependencies:
  - `get_current_user_from_cookie`
  - `require_curator`
  - `require_admin`

### Route rules
- Follow existing router structure; do not invent a new organization pattern.
- Reuse existing auth dependencies instead of creating parallel ones.
- Match existing response/error handling patterns in nearby routers.
- For protected endpoints, choose the narrowest correct dependency: curator vs admin.

### Roles
Valid roles are:
- `guest`
- `pending`
- `curator`
- `admin`

Do not invent new role names without explicit instruction.

---

## Database Rules

- Database engine is SQLite.
- ORM is synchronous SQLAlchemy.
- Alembic `target_metadata` is configured from `api.models_sqlalchemy.Base.metadata`.
- Alembic reads DB configuration from `alembic.ini`.

### SQLAlchemy
- Follow existing sync session patterns from `rnudb_utils/database.py`.
- Do not introduce async SQLAlchemy patterns.
- Reuse existing base/model patterns from `api/models_sqlalchemy.py`.
- If a model change affects API responses or frontend rendering, update those in the same change.

### Audit pattern
There is no soft-delete convention.
An audit pattern exists through `AuditLog`; preserve it when modifying create/update/delete flows.

### Timestamp pattern
`created_at` / `updated_at` are not universal across all models.
Do not assume every model has them; check the actual model first.

---

## Alembic Workflow

Use this sequence for schema changes:

```text
1. Update SQLAlchemy model(s)
2. Generate migration with autogenerate
3. Review migration manually
4. Apply migration locally
5. Verify downgrade works
6. Re-apply migration
7. Run tests
8. Update docs
9. Commit model + migration + docs together
```

Concrete commands:
1. `uv run alembic revision --autogenerate -m "describe_change"`
2. Review the new file in `alembic/versions/`
3. `uv run alembic upgrade head`
4. `uv run alembic downgrade -1`
5. `uv run alembic upgrade head`
6. `uv run pytest`

### Alembic rules
- Never edit an old migration; create a new corrective migration instead.
- Always review autogenerated output before applying.
- Every migration must have a meaningful `downgrade()` unless destructive data loss was explicitly approved.
- Update `docs/schema.md` when schema changes.

### Common SQLite/Alembic pitfalls
- Column rename: autogenerate may emit drop + add and lose data; review carefully.
- Non-null column on existing table: backfill or set a safe default before enforcing non-null.
- SQLite schema operations can be limited; use patterns compatible with SQLite and review generated operations carefully.
- Multiple heads must be resolved before continuing.

For dangerous, exact-step workflows like migrations, explicit sequential guidance is more reliable than loose prose [web:42].

---

## Testing

### Backend
- Test framework is `pytest`.
- Shared fixtures live in `tests/conftest.py`.
- Existing fixtures include:
  - `test_engine`
  - `test_db`
  - `mock_auth`
  - `test_client`

### Backend test strategy
- Tests use SQLite in-memory.
- Tables are created for the test session.
- Each test runs in a transaction that is rolled back afterward.
- Reuse the provided fixtures; do not invent a parallel test DB setup.

### Test rules
- New features need tests.
- Bug fixes need regression tests.
- Prefer targeted tests during iteration, then run the full suite before commit.
- Tests should be deterministic; avoid sleeps and external network dependencies.
- Mock at the boundary.

### Auth/security tests
When changing auth, always cover unhappy paths where relevant:
- expired tokens
- invalid signatures
- missing claims
- insufficient role
- missing cookie/session
- unauthorized vs forbidden behavior

### Frontend tests
- E2E tests use Playwright.
- No frontend unit-test framework is currently established.
- Do not introduce Vitest/Jest/React Query/TanStack Query unless explicitly requested.

If a frontend change is risky or user-flow heavy, note whether Playwright coverage should be updated.

---

## Frontend Conventions

### Routing
- Use React Router DOM.
- Follow the existing route/page structure; do not introduce a new routing pattern.

### State
- Global auth state uses React Context in `src/context/AuthContext.tsx`.
- Do not introduce Redux, Zustand, Jotai, or a second global-state approach unless requested.

### API access
- Existing pattern is raw `fetch` with `credentials: "include"` plus helpers in `src/services/api.ts`.
- Prefer the established `fetch` / `api.ts` pattern.
- Do not introduce React Query / TanStack Query.

### Types
- Frontend shared types live in `src/types/index.ts`.
- Types are manually maintained, not generated from OpenAPI.
- Update shared frontend types when API shape changes require it, but do so narrowly.

### Imports
- Use the configured alias: `@/*` → `./src/*`
- Prefer:
  - `import { Button } from "@/components/ui/button"`
- Avoid long relative chains like:
  - `../../../components/ui/button`

### Barrel exports
Existing barrel exports are limited and intentional.
- Use existing barrel exports where already present.
- Do not create new barrel export files unless explicitly requested.

---

## UI & Design System

### Styling stack
- Tailwind CSS v4
- styled-components
- Barlow as the application font

### Rules
- Maintain visual consistency with nearby components.
- Reuse existing UI primitives before creating new components.
- Do not mix in a new styling approach.
- Do not hardcode a different font family.
- Prefer existing Tailwind utility patterns and component variants already present in the codebase.

### Radix polymorphism
Polymorphism in this repo means the Radix `Slot` / `asChild` pattern.

Use the existing pattern from `src/components/ui/button.tsx`:
- Components that may render as a link or another element should use `asChild`
- Do not invent a separate `as` API if the local component pattern is `asChild`

Reference pattern:
```tsx
const Comp = asChild ? Slot : "button";
return <Comp {...props} />;
```

### Accessibility
- Preserve accessible names and semantics.
- Icon-only controls need an accessible label.
- Do not lose keyboard/focus behavior when changing Radix-based components.

---

## Coding Style

Tooling enforces most style; do not restate linter rules in prose.

### Python
- Use explicit type hints where the surrounding code does.
- Catch specific exceptions; no bare `except` in auth-sensitive code.
- Prefer `pathlib.Path` over `os.path` for new file-path code.
- Match existing SQLAlchemy model patterns.
- Do not introduce async patterns into sync code.

### TypeScript / React
- Prefer named exports unless the surrounding file/module clearly uses default exports.
- Keep component changes local and minimal.
- Define `@tanstack/react-table` column definitions outside render paths when practical.
- Follow existing component structure and naming in nearby files.

### Diffs
- Every changed line should be traceable to the request.
- Avoid broad formatting churn in unrelated files.

Specific, repo-grounded conventions outperform generic “follow best practices” rules in agent guidance [web:37][web:39].

---

## Error Handling

- Do not add defensive code for impossible states.
- Do not swallow exceptions silently.
- Surface meaningful errors to the caller.
- Keep user-facing errors clear; avoid leaking secrets or internal details.

### Auth-specific rule
For `python-jose` / auth flows, distinguish between:
- expired token
- invalid token/signature
- missing required claims
- insufficient permissions

Do not collapse all auth failures into one broad catch unless the existing handler intentionally does so.

---

## Security

This repo handles JWT auth and GitHub OAuth. Treat auth code as high-risk.

- Never log tokens, secrets, or credentials.
- Never hardcode secrets.
- New env vars must be added to both `.env.example` and the relevant docs.
- Keep cookie/session behavior consistent with existing auth flow.
- Validate JWT claims explicitly where applicable.
- Do not disable security checks for convenience in production code.
- Be careful when modifying admin/curator gating logic.

### Existing env vars
At minimum, this repo uses:
- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`
- `JWT_SECRET_KEY`
- `ADMIN_GITHUB_LOGINS`
- `FRONTEND_URL`

When adding a new env var:
1. Add it to `.env.example`
2. Update setup docs/README if needed
3. Ensure local/dev usage is clear

---

## Documentation Rules

Documentation changes should land in the same commit as the code they describe.

| Change | Update |
|---|---|
| New or changed public API endpoint | `README.md`, relevant docs, `src/pages/APIDocs.tsx` |
| New private/authenticated/internal endpoint | relevant docs only; usually not `APIDocs.tsx` |
| Schema change | migration + `docs/schema.md` |
| New feature or changed behavior | `README.md` and/or relevant `docs/` page |
| New env var | `.env.example` + setup docs |
| New user-facing page/workflow | relevant docs and possibly screenshots/docs if that convention already exists |

### APIDocs rule
Update `src/pages/APIDocs.tsx` only for endpoints that are:
1. Publicly accessible without auth, and
2. Intended for external consumers

Do not update it for private, authenticated, or restricted endpoints.

---

## Pre-commit

This repo uses `pre-commit` and it is part of the normal workflow.

- Check `.pre-commit-config.yaml` before assuming what is enforced.
- Use `uv run pre-commit run --all-files` before commit.
- If pre-commit reformats or fixes files, review the diff before committing.
- Do not bypass hooks unless explicitly instructed.

---

## CI/CD

There are two GitHub Actions workflows:

- `.github/workflows/ci.yml`
  - pre-commit hooks
  - frontend lint + TypeScript check
  - Python Ruff lint
  - backend pytest
  - frontend build
  - Playwright e2e tests

- `.github/workflows/build.yml`
  - builds and pushes multi-arch Docker images to GHCR on main pushes

### CI rules
- Do not merge code conceptually “hoping CI fixes it.”
- Keep local verification aligned with CI:
  - `uv run pre-commit run --all-files`
  - `uv run pytest`
  - `npm run build`
- Be careful when changing workflow-sensitive areas such as env vars, build scripts, Playwright assumptions, or Docker-related files.

---

## Commit Rules

- Commit after each completed feature or completed request.
- One logical change per commit.
- Use imperative commit messages:
  - `Add curator approval filter`
  - `Fix OAuth callback redirect`
  - `Add Alembic migration for audit log`

Avoid messages like:
- `updates`
- `fix stuff`
- `misc changes`

### Commit checklist
- [ ] Request is fully addressed
- [ ] Minimal diff
- [ ] Relevant tests added/updated
- [ ] `uv run pytest` passes
- [ ] `npm run build` passes
- [ ] `uv run pre-commit run --all-files` passes
- [ ] Docs updated
- [ ] Migration included and reviewed, if schema changed

---

## When to Ask Questions

Ask before proceeding if any of the following are true:
- The request could mean more than one thing
- A migration may affect existing data
- A route should be curator-only vs admin-only and it is unclear
- An API shape change would require frontend type updates and the intended contract is unclear
- A change touches auth/session logic
- A change appears to require editing a protected file
- A new dependency seems helpful but was not requested

---

## Success Criteria

These guidelines are working if they lead to:
- smaller diffs
- fewer speculative abstractions
- tests and docs shipping with the code
- fewer migration mistakes
- fewer auth regressions
- clarifying questions before implementation, not after breakage
