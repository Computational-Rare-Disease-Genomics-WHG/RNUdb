# CONTINUITY.md

Canonical briefing for the RNUdb workspace. Living document; read before acting.
Keep short and high-signal (anti-bloat). Provenance tags: `[USER]`, `[CODE]`, `[TOOL]`, `[ASSUMPTION]` (write `UNCONFIRMED` instead of guessing).

---

## [PLANS]

- `[2026-10-13T12:25Z] [USER]` Upgrade `AGENTS.md` per issue #270: add Global Guidance + curation skill.
- `[2026-11-04T16:30Z] [USER]` Approval-system hardening epic #346: 5 batched PRs over issues #298–#303, #307–#321 (+ #285). Decisions: admin-only direct endpoints; imports via real `import` apply action; payload keys validated at submission. Batch 1 (apply-path integrity) landed on branch `fix/approval-apply-integrity-307-308-311-312-317-318`.

## [DECISIONS]

- `[2026-10-13T12:17Z] [CODE]` Latest `main` = `8ebbbae` (2026-10-13). Superseded 2026-10-14 by `0610cb2` (3 frontend PRs merged).
- `[2026-10-14T12:40Z] [CODE]` Latest `main` = `0610cb2` (frontend PRs #274/#275/#276 merged).
- `[2026-10-13T17:20Z] [USER]` Keep `variants.py` version of `/literature-counts`; fix `users.py` auth too.
- `[2026-10-14T12:45Z] [USER]` #134 direction: change code to `require_curator` (docstrings were right). Single PR for #132+#134. Include `/imports/literature/lookup`, `/literature/bulk`, and audit attribution.
- `[2026-11-04T14:35Z] [USER]` Continuity file moved `.agent/CONTINUITY.md` → `.agents/CONTINUITY.md` (consolidates with `.agents/skills/`). File remains git-tracked. All 5 `AGENTS.md` references updated in the same change.
- `[2026-11-04T16:30Z] [USER]` Approval epic #346 decisions (all recommended options): (1) all 24 issues, staged; (2) direct write endpoints become `require_admin`, curators→approval; (3) import action implemented in apply; (4) payload keys validated at submission (422), never silently dropped.
- `[2026-11-04T16:45Z] [CODE]` Latent bug found+fixed: `# noqa: S608` comments were embedded inside SQL f-strings in approvals apply (`text(f"""  # noqa: S608`) → SQLite "unrecognized token: #" → every variant-create/update apply 500'd. Moved noqa comments to Python-comment positions.
- `[2026-11-04T16:45Z] [CODE]` Gene-create population fetch moved to submission time (`create_pending_change` calls `merge_population_variants`, stores under payload `population_variants`); apply is now deterministic DB-only (fixes #317 + always-truthy `query_gnomad_variants` guard).

## [PROGRESS]

- `[2026-10-13T12:40Z] [TOOL]` `AGENTS.md` edited per #270 (doc-only).
- `[2026-10-13T17:20Z] [TOOL]` PR for issues #137, #147, #155, #156, #157: backend cleanup. Branch `fix/backend-cleanup-137-147-155-156-157`. All 126 tests pass, pre-commit and npm build pass.
- `[2026-10-13T19:15Z] [TOOL]` Created 3 frontend PRs:
  - PR #274: fix #112 (redundant back button) + #111 (misleading amber alerts)
  - PR #275: fix #148 (auth guards on /curate and /admin routes)
  - PR #276: fix #150 (any types batch 1 — 13 instances fixed in 4 files)
- `[2026-10-14T12:45Z] [TOOL]` Branch `fix/auth-roles-132-134` : fixed #132 (all /imports write endpoints + /imports/literature/lookup now `require_curator`) and #134 (12 endpoints switched `require_admin`→`require_curator`: variants ×3, literature ×4 incl. /literature/bulk, genes ×5). Also added `db` session to audit_log calls that lacked it (was causing "database is locked" in tests) and replaced `"system"` audit attribution with `user["github_login"]`. Strict 401 tests + role-pinning tests. 140 passed, 2 skipped, pre-commit + npm build pass.
- `[2026-10-15T14:45Z] [TOOL]` Branch `fix/external-links-288` → PR #322 (Fixes #288): UCSC/gnomAD buttons broken for RNU4atac. Verified live: UCSC `dgDashRef` CGI → 404 (dead), `hgTracks` → 200; gnomAD `/variant/chr-start-end` malformed (needs pos-ref-alt). New `src/lib/externalLinks.ts` (`buildGnomadGeneUrl` → gnomAD gene page, `buildUcscRegionUrl` → hgTracks region) + tests; InfoPanel uses helpers, hides buttons when coords missing. 147 vitest pass, build/lint/pre-commit/pytest pass.

- `[2026-10-29T16:30Z] [TOOL]` CI/CD audit → created issues #323 (coverage visibility), #324 (CI reliability: E2E double-start port race/health poll, concurrency, timeouts, build.yml gate), #325 (security: CodeQL/dependency-review/audits), #326 (Dependabot: add github-actions + python/uv; #140 premise outdated). Updated #171 (deploy) with label `ci` + decision comment (Podman auto-update vs self-hosted runner).

- `[2026-10-29T18:00Z] [TOOL]` Branch `feat/sge-evidence-codes-328` → issue #328: SGE function-score ACMG evidence codes in InfoPanel. Generic score→code util `src/lib/sgeEvidence.ts` (breakpoints from De Jonghe et al. *Nature* 654:429–436 (2026) Brnich OddsPath calibration; PS3 strong strict < −0.45; benign-side midpoint approximation) + 12 vitest tests + badge in InfoPanel clinical & population variant rows. No gene/CR hard-coding by design (works for any future gene with functional data). 159 vitest pass, build/lint/pre-commit pass, pytest 140 passed/2 skipped.

- `[2026-11-04T17:00Z] [TOOL]` **Batch 1 of epic #346** on branch `fix/approval-apply-integrity-307-308-311-312-317-318`:
  - #318: single whitelist source `_ALLOWED_COLUMNS` (+meta/import-shape keys); both create/update apply branches reference it.
  - #312: payload keys validated at submission → 422 with `invalid_fields`/`allowed_fields`; frontend `submitChange` formats API errors and Curate handlers now surface `err.message` instead of hardcoded "Network error"/false success alerts.
  - #307: `action: "import"` implemented in apply for variant/structure/bed_track via shared `api/services/import_ops.py` (also used by imports router — dedup); migration `ed2f69106e20` adds `import` to `check_action`. Also rejects unsupported (entity, action) combos at submission (no silent no-op applies).
  - #317: gene-create population fetch moved to submission time; apply is DB-only; fixed always-truthy guard; `merge_population_variants` helper in `rnudb_utils/external_apis.py` dedups genes.py create + refresh paths.
  - #311 (+ #285): cascade-delete helpers in `rnudb_utils/database.py` (`delete_variant_cascade`, `delete_structure_cascade`, `delete_literature_cascade`, `delete_gene_cascade`); used by apply AND direct endpoints (genes.py/delete_gene, variants.py, literature.py).
  - #308: `applied` added to list status regex.
  - Tests: rewritten `tests/test_approvals.py` (43 new/updated: cascade, import-apply writes, whitelist, deterministic gene create, filter by applied). 154 backend pass / 2 skip, vitest 159, build, lint, pre-commit all pass. Migration chain verified on scratch SQLite DB.

## [OUTCOMES]

- `[2026-11-04T14:50Z] [TOOL]` Continuity file moved to `.agents/CONTINUITY.md`. Issue #344 → branch `chore/continuity-md-to-agents-344` → PR #345 (commit `16fecaa`). pytest 140 passed/2 skipped, npm build + pre-commit pass. Awaiting merge.
- `[2026-10-13T17:20Z] [TOOL]` PR ready: fixes 5 backend issues (dead fields, auth patterns, duplicate endpoints, bare exception handlers). Ready for commit, push, and PR.
- `[2026-10-14T12:45Z] [TOOL]` PR ready: fixes #132 + #134 (import endpoint auth + curator/admin role mismatch). Ready for commit, push, PR.
