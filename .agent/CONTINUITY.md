# CONTINUITY.md

Canonical briefing for the RNUdb workspace. Living document; read before acting.
Keep short and high-signal (anti-bloat). Provenance tags: `[USER]`, `[CODE]`, `[TOOL]`, `[ASSUMPTION]` (write `UNCONFIRMED` instead of guessing).

---

## [PLANS]

- `[2026-10-13T12:25Z] [USER]` Upgrade `AGENTS.md` per issue #270: add Global Guidance + curation skill.

## [DECISIONS]

- `[2026-10-13T12:17Z] [CODE]` Latest `main` = `8ebbbae` (2026-10-13). Superseded 2026-10-14 by `0610cb2` (3 frontend PRs merged).
- `[2026-10-14T12:40Z] [CODE]` Latest `main` = `0610cb2` (frontend PRs #274/#275/#276 merged).
- `[2026-10-13T17:20Z] [USER]` Keep `variants.py` version of `/literature-counts`; fix `users.py` auth too.
- `[2026-10-14T12:45Z] [USER]` #134 direction: change code to `require_curator` (docstrings were right). Single PR for #132+#134. Include `/imports/literature/lookup`, `/literature/bulk`, and audit attribution.

## [PROGRESS]

- `[2026-10-13T12:40Z] [TOOL]` `AGENTS.md` edited per #270 (doc-only).
- `[2026-10-13T17:20Z] [TOOL]` PR for issues #137, #147, #155, #156, #157: backend cleanup. Branch `fix/backend-cleanup-137-147-155-156-157`. All 126 tests pass, pre-commit and npm build pass.
- `[2026-10-13T19:15Z] [TOOL]` Created 3 frontend PRs:
  - PR #274: fix #112 (redundant back button) + #111 (misleading amber alerts)
  - PR #275: fix #148 (auth guards on /curate and /admin routes)
  - PR #276: fix #150 (any types batch 1 — 13 instances fixed in 4 files)
- `[2026-10-14T12:45Z] [TOOL]` Branch `fix/auth-roles-132-134` : fixed #132 (all /imports write endpoints + /imports/literature/lookup now `require_curator`) and #134 (12 endpoints switched `require_admin`→`require_curator`: variants ×3, literature ×4 incl. /literature/bulk, genes ×5). Also added `db` session to audit_log calls that lacked it (was causing "database is locked" in tests) and replaced `"system"` audit attribution with `user["github_login"]`. Strict 401 tests + role-pinning tests. 140 passed, 2 skipped, pre-commit + npm build pass.

## [OUTCOMES]

- `[2026-10-13T17:20Z] [TOOL]` PR ready: fixes 5 backend issues (dead fields, auth patterns, duplicate endpoints, bare exception handlers). Ready for commit, push, and PR.
- `[2026-10-14T12:45Z] [TOOL]` PR ready: fixes #132 + #134 (import endpoint auth + curator/admin role mismatch). Ready for commit, push, PR.
