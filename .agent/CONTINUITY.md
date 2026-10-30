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
- `[2026-10-15T14:45Z] [TOOL]` Branch `fix/external-links-288` → PR #322 (Fixes #288): UCSC/gnomAD buttons broken for RNU4atac. Verified live: UCSC `dgDashRef` CGI → 404 (dead), `hgTracks` → 200; gnomAD `/variant/chr-start-end` malformed (needs pos-ref-alt). New `src/lib/externalLinks.ts` (`buildGnomadGeneUrl` → gnomAD gene page, `buildUcscRegionUrl` → hgTracks region) + tests; InfoPanel uses helpers, hides buttons when coords missing. 147 vitest pass, build/lint/pre-commit/pytest pass.

- `[2026-10-29T16:30Z] [TOOL]` CI/CD audit → created issues #323 (coverage visibility), #324 (CI reliability: E2E double-start port race/health poll, concurrency, timeouts, build.yml gate), #325 (security: CodeQL/dependency-review/audits), #326 (Dependabot: add github-actions + python/uv; #140 premise outdated). Updated #171 (deploy) with label `ci` + decision comment (Podman auto-update vs self-hosted runner).

- `[2026-10-29T18:00Z] [TOOL]` Branch `feat/sge-evidence-codes-328` → issue #328: SGE function-score ACMG evidence codes in InfoPanel. Generic score→code util `src/lib/sgeEvidence.ts` (breakpoints from De Jonghe et al. *Nature* 654:429–436 (2026) Brnich OddsPath calibration; PS3 strong strict < −0.45; benign-side midpoint approximation) + 12 vitest tests + badge in InfoPanel clinical & population variant rows. No gene/CR hard-coding by design (works for any future gene with functional data). 159 vitest pass, build/lint/pre-commit pass, pytest 140 passed/2 skipped.

- `[2026-10-30T12:50Z] [TOOL]` Branch `feat/equivalent-variants-331` → issue #331 → **PR #332**: equivalent-variant (PM5 / Rec 8) support. `variant_equivalences` pair-link table + migration (also extends `pending_changes.entity_type` with `'equivalence'`); read-only `api/routers/equivalences.py` (GET by gene/variant/all) — writes go through the approval flow only (no new write-endpoint bypass, cf. #299–#303); approvals apply handles equivalence create/update/delete with pre-try 400 validation (cross-gene, existing variants, dup, self). Frontend: `src/lib/equivalentEvidence.ts` (+20 vitest), InfoPanel per-nucleotide equivalents block + PM5 badge, `equivalents` overlay mode (5-mode cycle, deterministic), `VariantLiteratureCard` ≡ badge + expanded section, Curate "Equivalences" tab (add/delete via `submitChange` + CSV import wizard). Seed: `scripts/derive_equivalences.py` (NW alignment) → `data/equivalences/equivalences.csv` (43 rows, all `needs_review`, anchor n.37G>A≡n.32G>A pinned). Verified: 154 pytest / 173 vitest pass, tsc + lint + `npm run build` pass.

- `[2026-10-30T13:20Z] [TOOL]` Follow-up on PR #332 (fix review feedback): (1) fixed the /api/genes/{id}/equivalences 500 — SQLAlchemy `Row` string access must use `_mapping` (`class_row["x"]` → `class_row._mapping["x"]`); (2) InfoPanel equivalents block now labeled **"PM5 — Equivalent Variants (Rec 8)"** with a help tooltip (mechanism/anti-circularity caveats) + "Same mechanism (usable as PM5)" vs "NOT usable" chips (+6 RTL tests); (3) `derive_equivalences.py` now emits `literature_id` (strongest P/LP classification's paper) → CSV regenerated (43 rows, all non-empty literature_id); (4) new `POST /api/approvals/apply-batch` (ids or all_approved; per-row transaction + results) + Admin "Apply all approved" button — approving is two-step (approve → apply), which is why rows didn't appear post-review; (5) gene delete now cascades `variant_equivalences` (direct endpoint + approvals apply); (6) Curate Equivalences tab per-row status pills (pending/approved/applied) + delete disabled while in flight. Tests: 26 pytest equivalence/derive + 6 vite InfoPanel render.

- `[2026-10-30T14:10Z] [TOOL]` PR #332 follow-up #2: **equivalence derivation now RNU4-2 → RNU4atac, ONE pair per aligned position** (was: fan-out per alt-allele — RNU4atac n.5A>G showed 3× "RNU4-2 n.6" equivalents). `derive_equivalences.py` collapses each side to a representative row; CSV regenerated 43 → 15 rows, all `needs_review` + `literature_id`, anchor n.32↔n.37 kept. **"Linked Variants" fixed**: `GET /genes/{id}/variants` now unions `linked_variant_ids` across ALL of a variant's classifications (was: first paper only); frontend section renamed "Compound-Het Partners" (paper list stays "Linked Variants"). Tests: 171 pytest / 179 vitest.

- `[2026-10-30T14:45Z] [TOOL]` PR #332 follow-up #3 (user direction): **removed `functional_region`, `evidence_direction`, `mechanism_match`** from `variant_equivalences` (none needed: equivalences are only curated between usable, disease-linked analogs). Migration `f1e659c3d839` rebuilds the table (SQLite CHECK blocks DROP COLUMN) and **clears all rows** (re-import the cleaned CSV). Eval: `getEquivalentEvidence` is now classification-only (P/LP→PM5, B/LB→informative); Curate form/wizard/rows simplified; CSV header now `variant_id,equivalent_variant_id,relationship_type,status,notes,literature_id` (15 rows, all w/ `literature_id`); live DB migrated (43 rows→0, columns dropped). 175 vitest / 171 pytest.

## [OUTCOMES]

- `[2026-10-13T17:20Z] [TOOL]` PR ready: fixes 5 backend issues (dead fields, auth patterns, duplicate endpoints, bare exception handlers). Ready for commit, push, and PR.
- `[2026-10-14T12:45Z] [TOOL]` PR ready: fixes #132 + #134 (import endpoint auth + curator/admin role mismatch). Ready for commit, push, PR.
