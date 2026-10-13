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

### Safe to do without asking

- Read files and inspect codebase
- Run lint, tests, builds, pre-commit
- Edit code directly related to the request
- Generate new Alembic migration with `--autogenerate`
- Update docs required by code change

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

## Branch & PR Workflow

- **Every change must have a PR**. Create a feature branch off `main` for each task.
- **Every PR must reference an issue**. If no issue exists, create it at the start of the session before writing code.
- **Always pull latest `main` before creating a feature branch**:
  ```bash
  git checkout main && git pull origin main
  ```
- **Always rebase onto `main` before opening a PR**:
  ```bash
  git fetch origin && git rebase origin/main
  ```
  Resolve any conflicts during the rebase, then force-push with `--force-with-lease`. This prevents stale branches and merge conflicts after other PRs land.

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

- `alembic/` — migrations
- `auth/` — auth changes
- `curation/` — TSV variant data to VCF + CSV import files
- `new-api/` — API endpoints
- `testing/` — test rules
- `documentation/` — doc updates
- `frontend-ui/` — UI patterns
- `database/` — SQLAlchemy
- `security/` — security rules

---

## Global Guidance

Global working agreements for AI coding agents.

### Accuracy, recency, and sourcing (REQUIRED)

When a request depends on recency (e.g., "latest", "current", "today", "as of now"):

1. **Establish the current date/time** and state it explicitly in ISO format.
   - Preferred: `date -Is` (timestamp).
2. **Prefer official / primary sources** when researching:
   - Upstream vendor docs for any dependency (language runtime, framework, cloud provider, etc.).
3. **Prefer the most recent authoritative information**:
   - Use the newest versioned docs, release notes, or changelogs.
   - Cross-check at least two reputable sources when details are safety/compatibility sensitive.

#### Web search policy

- Enable and use web search only when it materially improves correctness (e.g., up-to-date APIs, recent advisories, release notes).
- Prefer official docs and primary sources; otherwise use reputable, widely-cited references.
- Record source dates (publish/release dates) when relevant.

### Default autonomy and safety

- Default to read-only exploration and analysis.
- When edits are needed, prefer **workspace-scoped** write access and keep changes inside the repo.
- When interacting with remote APIs, use READ-only calls unless explicitly instructed otherwise. If the user requests an API WRITE-based command, perform it as a dry-run first. Never make destructive calls to remote APIs or production data sources.

#### Editing files

- Make the smallest safe change that solves the issue.
- Preserve existing style and conventions.
- Prefer patch-style edits (small, reviewable diffs) over full-file rewrites.
- After making changes, run the project's standard checks when feasible (format/lint, unit tests, build/typecheck).

#### Reading project documents (PDFs, uploads, long text, CSVs, etc.)

- Read the full document first.
- Draft the output.
- **Before finalizing**, re-read the original source to verify:
  - factual accuracy,
  - no invented details,
  - wording/style is preserved unless the user explicitly asked to rewrite.
- If paraphrasing is required, label it explicitly as a paraphrase.

### Baseline workflow

Start every task by determining:

1. Goal + acceptance criteria.
2. Constraints (time, safety, scope).
3. What must be inspected (files, commands, tests, docs).
4. Whether the request depends on **recency** (if yes, apply the "Accuracy, recency, and sourcing" rules).
5. If requirements are ambiguous, ask targeted clarifying questions before making irreversible changes.

### CONTINUITY.md (REQUIRED)

Maintain a single continuity file for the current workspace: `.agent/CONTINUITY.md`.

- `.agent/CONTINUITY.md` is a living document and canonical briefing designed to survive compaction; do not rely on earlier chat/tool output unless it's reflected there.
- At the start of each assistant turn: read `.agent/CONTINUITY.md` before acting.

#### File Format

Update `.agent/CONTINUITY.md` only when there is a meaningful delta in:

- `[PLANS]`: "Plans Log" is a guide for the next contributor as much as checklists for you.
- `[DECISIONS]`: "Decisions Log" is used to record all decisions made.
- `[PROGRESS]`: "Progress Log" is used to record course changes mid-implementation, documenting why and reflecting upon the implications.
- `[DISCOVERIES]`: "Discoveries Log" is for when you discover optimizer behavior, performance tradeoffs, unexpected bugs, or inverse/unapply semantics that shaped your approach, capture those observations with short evidence snippets (test output is ideal).
- `[OUTCOMES]`: "Outcomes Log" is used at completion of a major task or the full plan, summarizing what was achieved, what remains, and lessons learned.

#### Anti-drift / anti-bloat rules

- Facts only, no transcripts, no raw logs.
- Every entry must include:
  - a date in ISO timestamp (e.g., `2026-10-13T12:00Z`)
  - a provenance tag: `[USER]`, `[CODE]`, `[TOOL]`, `[ASSUMPTION]`
  - If unknown, write `UNCONFIRMED` (never guess). If something changes, supersede it explicitly (don't silently rewrite history).
- Keep the file bounded, short and high-signal (anti-bloat).
- If sections begin to become bloated, compress older items into milestone (`[MILESTONE]`) bullets.

### Definition of done

A task is done when:

- the requested change is implemented or the question is answered,
- verification is provided:
  - build attempted (when source code changed),
  - linting run (when source code changed),
  - errors/warnings addressed (or explicitly listed and agreed as out-of-scope),
  - plus tests/typecheck as applicable,
- documentation is updated exhaustively for impacted areas,
- impact is explained (what changed, where, why),
- follow-ups are listed if anything was intentionally left out.
- `.agent/CONTINUITY.md` is updated if the change materially affects goal/state/decisions.
