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

- `[2026-11-04T17:20Z] [TOOL]` **Batch 2 of epic #346** on branch `fix/approval-failure-audit-309-310-319-320-321` (stacked on Batch 1):
  - #309: apply failures mark change `failed` w/ `failure_reason` (direct SQL marker, ORM object unsafe post-rollback); apply accepts retry from `failed`; status filterable; migration `08cf1ba3f420` (adds column + status).
  - #310: every apply mutation now queues an `audit_log` entry (via `_audit_entry`, no mid-txn commit) attributed to the applying admin. Note: audit_log JSON columns read back as strings when queried via raw `text()`.
  - #320: `notify_change_submitted` Slack notifier wired into `create_pending_change`.
  - #321: `/imports/literature/lookup` + `/imports/literature/fetch` are read-only (no INSERT, no "Unknown" placeholder rows).
  - #319: user approve/reject now 404-if-missing, 409-if-already-in-target-state (and refuse to demote/reject admins), audit role changes. Also fixed latent route bug: router mounted at `/api/users` AND route paths `/users/{login}/approve` → real URL was `/api/users/users/...` while frontend calls `/api/users/{login}/approve` → paths corrected.
  - Tests: 170 backend pass / 2 skip, vitest 159, build/lint/pre-commit pass, full migration chain verified on scratch DB.

- `[2026-11-04T17:50Z] [TOOL]` **Batch 3 of epic #346** on branch `fix/approval-admin-only-writes-298-299-300-301-302-303` (stacked on #347/#348):
  - Direct write endpoints → `require_admin` (curator writes via approval): variants POST/PUT/DELETE (#303), genes DELETE (#301), literature POST/PUT/DELETE + /literature/bulk (#299), structures DELETE (#302), import write endpoints variants/batch, variants/vcf, structures, bed-tracks, variants/classifications (#300). BED-track DELETE was already admin (#298) → verified + role test added.
  - Extends import action to **literature** (`exec_literature_bulk_import` in import_ops + apply branch) so the LiteratureImportWizard can route through approval.
  - Frontend rerouting: gene delete, literature create/update/delete (incl. table rows) → `submitChange`; Structure/BEDTrack/Variant(VCF→JSON rows)/Literature import wizards → POST `/api/approvals` with `action: "import"` + "Submitted for Approval" success screens.
  - Scope boundary (documented in PR): variant-classifications CRUD/bulk + gene create/update + refresh-variants remain curator-gated as association/operation data with NO approval entity type yet. Follow-up needed to extend approval to a `classification` entity (epic note).
  - Tests: rewrote auth/role tests (new `enforce_real_admin_auth` fixture; `TestAdminOnlyRoleAccess` asserts 401 on all locked endpoints). 172 backend pass / 2 skip, vitest 159, build/lint/pre-commit pass.

- `[2026-11-04T18:00Z] [TOOL]` **Batch 4 of epic #346** on branch `fix/approval-ux-my-requests-313-314` (stacked on #347/#348/#349):
  - #314 Admin UX: split Approve (review-only) from Apply; "Apply All" button; separate "Pending Review", "Approved — Awaiting Apply", "Failed" sections on the Admin page. `failed` status now rendered with distinct color in the change log.
  - #313 Curator UX: "My Change Requests" collapsible panel on the Curate page, listing the curator's submissions (status, action, entity, date, review notes, failure reason). Loads on demand when expanded.
  - 172 backend pass / 2 skip, vitest 159, build/lint/pre-commit pass.

- `[2026-11-04T18:30Z] [TOOL]` **Batch 5 of epic #346** on branch `fix/approval-test-hardening-315-316` (stacked on batches 1–4):
  - #316: per-role TestClients (`curator_client`, `admin_client`, `guest_client`, `anon_client`, `curator_bob_client`) in conftest. Each applies its role's auth overrides per-request (`_RoleTestClient`), so multiple role clients coexist in one test (global override dict footgun solved). Un-skipped `test_admin_can_list_all` + `test_reviewer_cannot_access_other_users_submissions`; tightened unauthenticated tests to strict 401 and added guest/curator 403 enforcement tests.
  - #315: startup fail-fast in `main.py` lifespan via `api/bootstrap.check_bootstrap_config()` — blocks boot when `ADMIN_GITHUB_LOGINS` empty AND users table empty; `scripts/promote_to_admin.py` one-shot recovery; `get_admin_logins()` dedupes/parses.
  - **IMPORTANT caution recorded**: Python module-level `from rnudb_utils.database import SessionLocal` binds at import-time and IGNORES the conftest test_engine swap; tests must import SessionLocal lazily. During development this bug briefly wrote test users into real `data/database.db` — rows removed immediately, DB verified clean.
  - Tests: 183 backend pass / 0 skipped (was 172/2), vitest 159, build/lint/pre-commit pass. Migration chain unchanged (no new migration in batch 5).

- `[2026-11-05T15:35Z] [TOOL]` **User approve/reject 500 hotfix** — issue #354, branch `fix/user-approve-audit-datetime-354`, PR #356:
  - Root cause: `users.py` passed `target.model_dump()` (real `datetime` for `created_at`/`updated_at`) into `audit_log` JSON column → `TypeError: Object of type datetime is not JSON serializable`; role committed before audit (500 still promotes, retries 409, no audit row). Tests missed it because `_seed_user` seeded via raw SQL without `created_at`/`updated_at` (NULL).
  - Fix: `model_dump(mode="json")` in `approve_user` + `reject_user`; `_seed_user` now sets `created_at`/`updated_at` so happy path exercises datetime→JSON. 183 pass / build / pre-commit ✓.
  - **DECISION [USER]:** same-class latent bug in `bed_tracks.py delete_bed_track` (ALL tracks created via raw SQL → `created_at` NULL, unreachable today) **scoped out** of PR #356; tracked separately as issue #355.
  - **Prod status [USER]: migrated `b051df0029e7` → `08cf1ba3f420` on Oracle VM** (docker compose exec `rnudb /app/.venv/bin/python -m alembic upgrade head`; distroless image has no `uv`). Prod DB was clean (no #331 `equivalence` data — that branch never deployed there). This is the env running sampling of approve users; code fix ships via PR #356.
  - **Local dev `data/database.db` still in mixed state** (alembic_version=`f1e659c3d839` from unmerged `feat/equivalent-variants-331`; 104 `equivalence` pending_changes rows + `variant_equivalences` table). Recovery agreed: backup → archive equivalence rows to `pending_changes_equiv_backup` → delete them → `UPDATE alembic_version SET version_num='b051df0029e7'` → `alembic upgrade head`. **SUPERSEDED 2026-11-05 [USER]: will nuke `data/database.db` instead** — rebuild = `rm data/database.db` (backup first if wanted) → `uv run alembic upgrade head` (fresh chain from base) → `.env` `ADMIN_GITHUB_LOGINS` governs first-login admin; local `scripts/promote_to_admin.py` works as backup (uv present locally).
- `[2026-11-05T15:50Z] [TOOL]` New issue #357: **no in-app mechanism to promote curator → admin** (`POST /api/users/{login}/approve|reject` only handle pending→curator / →guest; `ADMIN_GITHUB_LOGINS` boot-only; `scripts/promote_to_admin.py` unavailable in distroless Docker image). Proposed: admin-only `POST /api/users/{login}/promote` per #319 conventions (404/409/audit w/ mode="json" per #354) + no-last-admin lockout guard.

## [OUTCOMES]

- `[2026-11-04T18:40Z] [TOOL]` **Epic #346 (approval-system hardening) implementation complete** — all 24 issues (#298–#303, #307–#321, + #285) fixed across 5 stacked PRs: #347 (apply integrity), #348 (failure/audit/observability), #349 (admin-only writes + UX), #350 (test hardening + bootstrap). pytest 183/0, vitest 159, build/lint/pre-commit pass. Merge order: #347 → #348 → #349 → #350 (retarget to main sequentially). Follow-ups documented on #346: classification-entity approval + gene create/update/refresh routing.
- `[2026-11-04T14:50Z] [TOOL]` Continuity file moved to `.agents/CONTINUITY.md`. Issue #344 → branch `chore/continuity-md-to-agents-344` → PR #345 (commit `16fecaa`). pytest 140 passed/2 skipped, npm build + pre-commit pass. Awaiting merge.
- `[2026-10-13T17:20Z] [TOOL]` PR ready: fixes 5 backend issues (dead fields, auth patterns, duplicate endpoints, bare exception handlers). Ready for commit, push, and PR.
- `[2026-10-14T12:45Z] [TOOL]` PR ready: fixes #132 + #134 (import endpoint auth + curator/admin role mismatch). Ready for commit, push, PR.
