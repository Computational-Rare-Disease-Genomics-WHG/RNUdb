# CONTINUITY.md

Canonical briefing for the RNUdb workspace. Living document; read before acting.
Keep short and high-signal (anti-bloat). Provenance tags: `[USER]`, `[CODE]`, `[TOOL]`, `[ASSUMPTION]` (write `UNCONFIRMED` instead of guessing).

---

## [PLANS]

- `[2026-10-13T12:25Z] [USER]` Upgrade `AGENTS.md` per issue #270: add Global Guidance (recency/sourcing, autonomy & safety, editing files, reading docs, baseline workflow, CONTINUITY.md, definition of done). Backfill `.agent/CONTINUITY.md` from commit history. Also add `.agents/skills/curation/` (new skill: TSV variant data → VCF + CSV import files) and list it in `AGENTS.md` Skills.

## [DECISIONS]

- `[2026-10-13T12:25Z] [USER]` PR for #270 may include all Global Guidance sections as drafted; backfill CONTINUITY.md using repo commits; curation skill added as-is.
- `[2026-10-13T12:17Z] [CODE]` Latest `main` = `8ebbbae` (2026-10-13, "fix: handle null user name on admin page (#269)").

## [PROGRESS]

- `[2026-10-13T12:40Z] [TOOL]` `AGENTS.md` edited: `curation/` added to Skills list + full Global Guidance section appended (replacing the draft in the issue; verified via diff — 100 insertions).
- `[2026-10-13T12:40Z] [TOOL]` `.agent/CONTINUITY.md` created (backfilled from commits and issue #270).
- `[2026-10-13T12:40Z] [CODE]` `.agents/skills/curation/SKILL.md` present on disk (untracked), ready to include as-is.
- `[2026-10-13T12:40Z] [ASSUMPTION]` Doc-only changes; no source/backend/frontend code touched, so `uv run pytest` / `npm run build` expected unaffected.

## [DISCOVERIES]

- `[2026-10-13T12:25Z] [CODE]` `.agents/skills/curation/SKILL.md` exists on disk but is untracked in git; `AGENTS.md` Skills list omitted `curation/`. (Confirmed via `git status` / `git ls-tree main`.)

## [OUTCOMES]

- `[2026-10-13T12:40Z] [ASSUMPTION]` Pending: commit all changes on branch `docs/upgrade-agents-md-270`, push, and open PR referencing #270.
