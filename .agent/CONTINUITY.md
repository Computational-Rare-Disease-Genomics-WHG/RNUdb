# CONTINUITY.md

Canonical briefing for the RNUdb workspace. Living document; read before acting.
Keep short and high-signal (anti-bloat). Provenance tags: `[USER]`, `[CODE]`, `[TOOL]`, `[ASSUMPTION]` (write `UNCONFIRMED` instead of guessing).

---

## [PLANS]

- `[2026-10-13T12:25Z] [USER]` Upgrade `AGENTS.md` per issue #270: add Global Guidance + curation skill.

## [DECISIONS]

- `[2026-10-13T12:17Z] [CODE]` Latest `main` = `8ebbbae` (2026-10-13).
- `[2026-10-13T17:20Z] [USER]` Keep `variants.py` version of `/literature-counts`; fix `users.py` auth too.

## [PROGRESS]

- `[2026-10-13T12:40Z] [TOOL]` `AGENTS.md` edited per #270 (doc-only).
- `[2026-10-13T17:20Z] [TOOL]` PR for issues #137, #147, #155, #156, #157: backend cleanup. Branch `fix/backend-cleanup-137-147-155-156-157`. All 126 tests pass, pre-commit and npm build pass.

## [OUTCOMES]

- `[2026-10-13T17:20Z] [TOOL]` PR ready: fixes 5 backend issues (dead fields, auth patterns, duplicate endpoints, bare exception handlers). Ready for commit, push, and PR.
