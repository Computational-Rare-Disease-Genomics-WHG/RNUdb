# AGENTS.md

Repository-specific guidance for AI coding agents.

---

## Core Behavior

- **Think before coding**: State assumptions explicitly. If ambiguous, ask.
- **Prefer simplest change**: Minimum code needed. No speculative abstractions.
- **Make surgical edits**: Touch only relevant files. Match existing style.
- **Work goal-first**: For non-trivial tasks, define a verify-oriented plan.

---

## Autonomy Boundaries

### Ask before doing

- Applying migrations to non-local DB
- Running `alembic downgrade`
- Installing/removing dependencies
- Editing secrets or `.env`
- Editing CI workflows
- Creating barrel exports

### Never do

- Commit `.env`
- Edit `data/database.db` directly
- Edit old migrations in `alembic/versions/`
- Modify lockfiles by hand

---

## Protected Files

- `alembic/versions/*.py` — never edit after creation
- `data/database.db` — never edit directly
- `.env` — never commit
- `uv.lock`, `package-lock.json` — only via tooling

---

## Commit Checklist

Before commit, verify:

- [ ] `uv run pytest` passes
- [ ] `npm run build` passes
- [ ] `uv run pre-commit run --all-files` passes

---

## Non-obvious Conventions

- **Roles**: guest, pending, curator, admin (don't invent new ones)
- **SQLAlchemy**: sync only, no async
- **Auth deps**: use existing `require_curator`, `require_admin`
- **Frontend state**: AuthContext only (no Redux/Zustand)
- **API access**: raw fetch + api.ts (no React Query)
- **Frontend imports**: use `@/*` alias
- **UI**: Radix Slot/asChild pattern

---

## Skills

For complex workflows, see `.agents/skills/`:

- alembic.md — migrations
- auth.md — auth changes
- new-api.md — API endpoints
- testing.md — test rules
- documentation.md — doc updates
- frontend-ui.md — UI patterns
- database.md — SQLAlchemy
- security.md — security rules
