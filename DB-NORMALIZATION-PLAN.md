# DB Normalization Plan — VIVA Career Academy

> **Status:** Planning document.
> **Recommendation:** **Post-launch.** Do not attempt before the May 26 P·01 cohort.
> See section 7 for reasoning.

The current backend stores almost all academy data — applications,
courses, modules, chapters, batches, sessions, attendance, certificates,
tests, test_questions, test_attempts, etc. — as a single JSON blob
inside `AcademyTenantState.state` (one row per tenant). See
`apps/api/app/models.py` and `apps/api/app/store.py`.

This works at small scale but has known problems:
- No proper indexes on `student_email`, `course_code`, etc.
- Optimistic-concurrency footgun (whole blob rewritten on every change)
- Blob-size limit (~1 MB before performance degrades)
- Hard to query analytically
- Can't do transactional cross-tenant operations

A v2-preview branch has scaffolding for normalized SQLAlchemy models —
`apps/api/app/v2_models.py` (V2Course, V2Module, V2Lesson, V2Assignment,
V2Submission, V2Certificate). Currently those models exist on
v2-preview but aren't wired into anything.

---

## 1. Full table inventory

Every key written into `tenant_state` JSON, with a proposed Postgres
schema. All tables get `tenant_name TEXT NOT NULL` plus index for
tenant scoping, `created_at TIMESTAMPTZ`, `updated_at TIMESTAMPTZ`.
Primary keys keep the existing `prefix_<hex>` string IDs to avoid
breaking external references (payment URLs, certificate tokens, IDs
already emailed to students).

| Source key | Table | Key columns | Indexes / constraints |
|---|---|---|---|
| `branding` (singleton per tenant) | `academy_branding` | tenant_name PK, brand_name, academy_name, custom_domain, primary_color, accent_color, support_email, certificate_name, classroom_provider, zoom_host_email, zoom_default_timezone | UNIQUE(custom_domain) |
| `applications[]` | `academy_applications` | id PK, tenant_name, batch_id FK→batches, student_name, student_email, student_phone, course_name, course_code, cohort_label, source, notes, application_stage, payment_stage, enrollment_stage, amount_due NUMERIC(12,2), currency, payment_order_id, payment_url, payment_reference, payment_mode, payment_gateway_status, payment_gateway_order_status, payment_gateway_payment_id, payment_reconciliation_status, payment_verified_at, payment_failed_at, payment_last_checked_at, public_receipt_token, certificate_url, attendance_completed INT, attendance_total INT, is_reservation BOOL, reservation_amount NUMERIC, balance_amount NUMERIC, balance_due_by, reservation_paid_at, balance_paid_at | INDEX(tenant_name, student_email), UNIQUE(payment_order_id) WHERE NOT NULL, UNIQUE(payment_reference) WHERE NOT NULL, UNIQUE(public_receipt_token), INDEX(application_stage), INDEX(payment_stage) |
| `batches[]` | `academy_batches` | id PK, tenant_name, name, course_name, start_date DATE, trainer_name, classroom_mode, classroom_link, zoom_meeting_id, capacity INT | INDEX(tenant_name, start_date) |
| `sessions[]` | `academy_sessions` | id PK, batch_id FK, title, session_date DATE, start_time TIME, end_time TIME, trainer_name, classroom_link, zoom_meeting_id, zoom_join_url, zoom_start_url, attendance_mode | INDEX(batch_id, session_date), UNIQUE(zoom_meeting_id) WHERE NOT NULL |
| `attendance[]` | `academy_attendance` | id PK, session_id FK, application_id FK, student_name, student_email, status, marked_by, join_source, join_time, note | UNIQUE(session_id, application_id), INDEX(application_id) |
| `courses[]` | `academy_courses` | id PK, title, slug, code, description, duration_weeks, weekly_unlock_days, penalty_fee_amount, penalty_fee_currency, relock_grace_days, certificate_name, active BOOL | UNIQUE(tenant_name, code), UNIQUE(tenant_name, slug) |
| `course_modules[]` | `academy_course_modules` | id PK, course_id FK, title, week_number INT, summary, unlock_offset_days INT, submission_required BOOL, passing_score NUMERIC, penalty_fee_amount, penalty_fee_currency, relock_grace_days | UNIQUE(course_id, week_number), INDEX(course_id) |
| `course_chapters[]` | `academy_course_chapters` | id PK, course_id FK, module_id FK, title, position INT, content_type, summary, estimated_minutes, mandatory BOOL, question_prompt, video_url | UNIQUE(module_id, position), INDEX(module_id) |
| `chapter_submissions[]` | `academy_chapter_submissions` | id PK, application_id FK, course_id FK, module_id FK, chapter_id FK, answer_text, answer_url, submission_kind, status, submitted_at | INDEX(application_id, chapter_id), INDEX(status, submitted_at) |
| `learner_progress[]` | `academy_learner_progress` | id PK, application_id FK, course_id FK, batch_id FK, current_week, current_module_id, status, module_status, chapter_status, completed_chapter_ids JSONB, submitted_chapter_ids JSONB, reviewed_submission_ids JSONB, unlock_override BOOL, last_unlocked_at, last_activity_at, penalty_status, penalty_fee_amount, penalty_fee_currency, penalty_paid_at, note | UNIQUE(application_id, course_id) |
| `trainer_reviews[]` | `academy_trainer_reviews` | id PK, submission_id FK, application_id FK, course_id FK, module_id FK, chapter_id FK, reviewer_name, outcome, score, ai_feedback, trainer_feedback, unlock_next_module BOOL, reviewed_at | INDEX(submission_id), INDEX(application_id, reviewed_at) |
| `tests[]` | `academy_tests` | id PK, course_id FK, pass_score INT, retake_days INT, time_limit_minutes INT, active BOOL | UNIQUE(course_id) WHERE active |
| `test_questions[]` | `academy_test_questions` | id PK, test_id FK, prompt, type, options JSONB, correct_answer, points INT, position INT | UNIQUE(test_id, position) |
| `test_attempts[]` | `academy_test_attempts` | id PK, test_id FK, application_id FK, started_at, submitted_at, score_pct NUMERIC, passed BOOL, earned_points INT, total_points INT, answers JSONB | INDEX(test_id, application_id, started_at DESC) |
| `certificates[]` | `academy_certificates` | id PK, application_id FK, course_id FK, attempt_id FK, student_name, student_email, course_code, course_name, cohort_label, score_pct, passed, issued_at, revoked_at, revoked_reason, verification_token, notes | UNIQUE(verification_token), UNIQUE(application_id, course_id) WHERE revoked_at IS NULL, INDEX(course_id, issued_at) |
| `message_events[]` | `academy_message_events` | id PK, message_id, channel, audience, purpose, template, status, note | INDEX(tenant_name, created_at DESC) |

`learner_progress.completed_chapter_ids` (and the two sister arrays)
are kept as JSONB rather than promoted to a join table — they're
per-learner read-mostly state, the cardinality is bounded by chapter
count (~30), and a join table here costs more than it saves.

The singleton-style tables already in `models.py` (`AcademyTenantState`,
`AcademyUserCredential`, `AcademyAuthSession`, `AcademyWebhookEvent`,
`AcademyCatalogSnapshot`, `AcademyCatalogChangeEvent`) stay as-is.
`AcademyTenantState` becomes archive-only after Phase 5.

---

## 2. Migration strategy

**Phase 1 — Build + dual-write (3 eng-days).** Add Alembic migration
creating the 16 new tables. Add a `dual_writer.py` module: for each
`create_*` / `update_*` / mutate function in `store.py`, after the
existing `save_tenant_state` call, write the same record into the
matching SQL row inside the same transaction. Wrap both writes in a
single `db.begin()` so partial failure rolls both back. *Risk:*
dual-write doubles latency on every mutation. *Rollback:* feature-flag
the dual-write path via env var `ACADEMY_DUAL_WRITE=1` — flip to 0
to disable.

**Phase 2 — Backfill (1 eng-day, plus monitored runtime).** One-shot
script that reads each `AcademyTenantState.state` blob and INSERTs
every record into the normalized tables with `ON CONFLICT (id) DO
UPDATE`. Idempotent so it can be re-run. Verify by row-count parity
per array per tenant. *Risk:* drift between blob and tables during
the run. *Mitigation:* take a logical snapshot of `academy_tenant_states`
before backfill; run inside a single transaction per tenant; re-run
after Phase 1 has been live for 24h to catch races.

**Phase 3 — Switch reads (4 eng-days).** One endpoint at a time,
change the `list_*` / `get_*` functions in `store.py` to read from
SQL. Keep dual-writes on. After each endpoint switch, run the full
QA suite. *Risk:* SQL queries return slightly different shapes (sort
order, null vs empty string). *Mitigation:* add a `read_parity_check()`
debug middleware that fetches both blob + SQL for the same request
in dev/staging and diffs them; alert on mismatch.

**Phase 4 — Stop writing JSON (1 eng-day).** Flip
`ACADEMY_DUAL_WRITE=0`; mutations now hit only SQL. Keep blob row
intact. *Rollback:* if a bug surfaces, flip flag back on and the next
`save_tenant_state` rebuilds the blob from SQL via a one-time
materialization function.

**Phase 5 — Drop JSON (later, 0.5 eng-day).** After 30 days clean,
rename `academy_tenant_states` to `academy_tenant_states_archive`
and stop reading it. Don't drop — keep as audit log indefinitely.

---

## 3. Endpoint-by-endpoint refactor list (`apps/api/app/routers/academy.py`)

Login/auth: no change — already on dedicated tables.

Tenant + branding: `get_branding`, `update_branding` → `academy_branding`.

Catalog: mostly on dedicated catalog tables already; `import_p01_curriculum`
becomes a multi-table transactional insert into courses / modules /
chapters / tests / test_questions.

Tests: every `create_or_replace_test`, `create_test_question`,
`update_test_question`, `delete_test_question`, `start_test_attempt`,
`submit_test_attempt`, `list_test_attempts`, `get_latest_attempt`
switches to SQL. `submit_test_attempt` is the critical one — its
grading loop becomes a single transaction over `test_questions` +
`test_attempts`.

Certificates: `create_certificate`, `revoke_certificate`,
`list_certificates`, `get_certificate_by_token`,
`get_certificate_by_token_any_tenant` all hit `academy_certificates`.
Cross-tenant token lookup becomes a single indexed query — big win.

Applications: `list_applications`, `get_application`,
`create_application`, `update_application`,
`find_application_by_reference`, `find_application_by_order_id`,
`find_application_by_email` all switch. The cross-tenant finders
become indexed point-lookups.

Payment webhooks: `_capture_payment` and
`_reconcile_application_payment` need careful transaction boundaries
— payment row updates must be atomic with the webhook idempotency
record.

Student LMS: `get_student_lms_overview`, `get_course_outline`,
`ensure_learner_progress`, `update_learner_progress`,
`create_chapter_submission`, `create_trainer_review` — these are the
heaviest blob-mutators today and benefit most.

Courses / modules / chapters admin: straight mapping.

Batches / sessions / attendance: straight mapping.

Zoom / state passthrough: `read_full_state` and `overwrite_full_state`
need a compatibility adapter that materializes a JSON blob from SQL
for any external consumer that still expects the old shape.

Messages: straight mapping.

---

## 4. Test coverage gaps

Today, tests aren't visible in the working tree — that's itself a
finding. New unit tests needed:

- **Per-table CRUD**: one test per `create_*` / `list_*` / `update_*`
  in the new SQL store, verifying field round-trip and tenant isolation.
- **Constraint tests**: duplicate `payment_order_id`, duplicate
  `verification_token`, duplicate `(application_id, course_id)`
  certificate must fail at the DB layer.
- **Cascade tests**: deleting a course must not orphan modules /
  chapters silently.
- **Transaction tests**: `submit_test_attempt`, `create_chapter_submission`,
  `create_trainer_review`, `mark_attendance` — each writes 2+ tables;
  verify partial failure rolls back all.
- **Concurrency tests**: two simultaneous `mark_attendance` calls on
  the same session+application — old code lost writes; new code with
  the unique constraint should resolve deterministically.
- **Backfill parity tests**: snapshot a real production blob, run
  backfill, diff every record against the original.
- **Endpoint contract tests**: existing API responses must be
  byte-identical pre/post migration. Use VCR-style fixtures.

---

## 5. Risk assessment (top 10, ranked)

1. **Payment row data loss during dual-write race.** A webhook fires
   while a backfill is running; the blob and SQL diverge.
   *Mitigation:* freeze writes on `applications` for ~30s during
   backfill; queue webhooks via the existing `AcademyWebhookEvent`
   idempotency table and replay after.
2. **Certificate verification token collision/loss.** A cert minted
   post-migration with a token that's already in an unmigrated tenant
   blob would shadow it. *Mitigation:* backfill all tenants before
   any new cert is issued; add `UNIQUE(verification_token)` from day
   one of Phase 1.
3. **Live cohort hits a code path missed in refactor.** A
   still-blob-only function gets called and bypasses SQL.
   *Mitigation:* type-check store.py to ensure every public function
   is migrated; add a `@migrated` decorator audit.
4. **Foreign-key violations on backfill.** Orphan submissions or
   attendance rows referring to deleted applications. *Mitigation:*
   pre-flight integrity script; insert orphans into a `_quarantine`
   table rather than failing the migration.
5. **Schema drift between Phase 1 deploy and Phase 5.** Code expects
   new columns that don't exist on a rolled-back DB. *Mitigation:*
   every Alembic migration reversible; test downgrade paths.
6. **Endpoint shape regression.** Frontend depends on field ordering
   or nullability that shifts when SQL replaces dict-merging.
   *Mitigation:* contract tests; staging soak with real frontend
   traffic for 48h before prod cutover.
7. **Test attempt grading divergence.** Auto-grading currently runs
   over an in-memory dict; SQL version may handle ties or duplicates
   differently. *Mitigation:* port `submit_test_attempt` last and
   only after parity tests pass on a snapshot of real attempts.
8. **Backfill takes longer than expected at scale.** Even ~50
   students implies ~5000 rows total — fast — but a future
   white-label tenant could have 100k. *Mitigation:* batch by
   tenant; checkpoint every 1000 rows.
9. **Optimistic-concurrency footgun moves, doesn't disappear.** Now
   sits in `learner_progress` JSONB arrays. *Mitigation:* either keep
   blob-style writes for those fields (read-modify-write under row
   lock) or promote to a join table later.
10. **Razorpay webhook replay during cutover.** A retry hits Phase 4
    code with a `payment_order_id` that lives only in the blob.
    *Mitigation:* don't deploy Phase 4 until backfill+parity have
    been clean for 7 days.

---

## 6. Realistic timeline

Total: ~12 engineer-days of focused work, plus 30 days of monitored
soak.

- M1 — Schema + Alembic + dual-write scaffold: 3 days
- M2 — Backfill script + parity harness: 2 days
- M3 — Switch reads, endpoint by endpoint: 4 days
- M4 — Stop JSON writes + monitor: 1 day + 30-day soak
- M5 — Archive blob: 0.5 day
- Buffer for incident response: 1.5 days

Ship in calendar weeks: ~3 weeks of engineering, 4–6 weeks elapsed
including soak.

---

## 7. Decision: ship pre- or post-launch?

**Recommendation: post-launch.** Specifically — do *not* attempt
this before the May 26 P·01 cohort. Ship after the first cohort
completes (end of Aug 2026 for a 12-week course) or, if pressure to
migrate sooner is real, after week 4 once payment + enrollment are
stable.

Reasoning:

- The user wants this by **May 7 (6 days from now)**. The honest
  minimum viable scope is **12 engineer-days** of net-new work plus
  30 days of monitored soak. Compressing to 6 days means cutting
  Phases 2–4 corners — exactly the corners where payment-row loss
  and certificate-token collisions live, which the prompt itself
  flags as high-cost failures.
- The current JSON pattern, while ugly, is **demonstrably working**
  at 50-student scale. The blob-size limit (~1 MB) is not close —
  even a fully-populated P·01 tenant blob is well under 200 KB. The
  optimistic-concurrency footgun is real but mostly bites under
  contention we won't see with one cohort and one trainer.
- The cost of a **partial migration shipped under deadline pressure**
  is exactly the failure mode named above: data corruption,
  payment-row loss. A clean JSON pattern through one cohort is
  cheaper than a half-migrated SQL schema during the cohort.
- Post-launch we get a real production dataset to validate the
  backfill against, plus we'll know which queries actually matter for
  analytics (current concern is theoretical).

**What to ship by May 7 instead:** the safety improvements that
don't require schema change:

(a) Row-level Postgres advisory lock around `save_tenant_state` to
    fix the optimistic-concurrency footgun today.
(b) Blob-size monitoring + alert.
(c) A one-shot read-only export job that flattens the blob to CSV
    nightly so analytics is unblocked.

That's 1.5 eng-days, low risk, and buys the runway to do the full
migration properly after the cohort.

If leadership insists on the full migration pre-launch, the only
honest version is **Phases 1+2 only** by May 7 (dual-write live,
backfill complete, reads still on blob). That's defensible at 5
days. Phases 3–5 wait until after the cohort.
