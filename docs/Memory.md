# Memory Document
**Project:** IT/CSE Knowledge Assistant — Venus Remedies

> Update this file after every work session. Keep entries short and factual — this exists so anyone (including a future AI session) can pick up exactly where work left off, without re-reading the whole conversation history.

---

## What Has Been Completed

- [x] Phase 1 (Login), Phase 2 (Ingestion), Security hardening, IT/CSE dept restriction, Phase 3 (Core Chat + Reasoning) — as documented in prior entries below (through 2026-08-12).
- [x] Chat.jsx UI bug-fix rounds (post-Phase-3) — broken "New Project" creation, non-functional `&:hover`, raw-DOM dropdown menu, mojibake icons, duplicate style keys, clipped "Move to project" submenu, flexbox overflow in input row, a typo causing a full app crash, sidebar auto-open bug — all fixed and confirmed working.
- [x] Six-point UI/UX overhaul — auto-resizing textarea, fully responsive layout (mobile/tablet/desktop), accept-all-file-types picker, auto-scroll during streaming, scroll-to-bottom on conversation open.
- [x] File-type ingestion expanded — images (PNG/JPG via NVIDIA vision model), Word (.docx) and Excel (.xlsx) via a native dependency-free ZIP/XML reader.
- [x] Root cause of repeated CPU-Time-exceeded (546) crashes on large/data-heavy uploads identified and fixed: embedding generation switched from local/CPU-bound (Supabase.ai `gte-small`) to NVIDIA's hosted embedding endpoint (`nvidia/nv-embedqa-e5-v5`).
- [x] **Phase 4 (Fallback & Error Handling) — signed off as complete**: rate limiting (429 on both chat/ingest), clear LLM-failure messages (timeout + one retry, then 504/502), clear auth/input-failure messages (400/401/403), retrieval failure fails silently into "no context". Explicit accepted deviation: no hard "insufficient information" gate — superseded by Phase 3 reasoning-model pivot.
- [x] **Phase 5 (Admin Dashboard) — built and confirmed working**, scope deviation from Phases.md (original: document-management only; actual, per explicit request: full user-management panel):
  - DB: `activity_log` table; `suspended`/`full_name` on `profiles`; admin RLS policies via `is_admin()` security-definer helper.
  - New `admin` Edge Function (service-role-backed): list/update/bulk-update/add/delete/bulk-delete users, list/delete documents, usage_stats, activity_log.
  - `chat`/`ingest` check `profiles.suspended`, write activity_log entries.
  - Frontend (`Dashboard.jsx`) debugged across rounds: missing route, role/isAdmin naming mismatch, wrong column query, error banner not clearing, `.functions.fetch` vs `.invoke()`, Add-user toggle regression, no-op logout. All fixed.
  - CORS fix on `admin` function: `x-client-info` header missing from allowed list, broke every `.invoke()` call.
  - **Verification status:** only "Add User" explicitly confirmed end-to-end; other actions likely-working, not individually re-verified.
- [x] Chat system-prompt timezone fix: UTC → IST (`Asia/Kolkata`) via native `Intl.DateTimeFormat`. Hardcodes India-only user-base assumption.
- [x] **Critical embedding-dimension bug found and fixed (2026-08-22):** all uploads silently failing at DB-insert — `documents.embedding` was still `vector(384)` (old local-model dimension) while ingest/chat had switched to `nv-embedqa-e5-v5` (1024-dim). A prior log entry claiming this was already fixed had not actually persisted. Verified table empty, altered column to `vector(1024)`, confirmed fixed with PDF/DOCX/image uploads. **Lesson:** never trust a past log entry claiming a schema fix without re-checking live schema — a failure spanning multiple unrelated file types signals a shared-step bug.
- [x] **Chat.jsx fix round (2026-08-22):** upload success now adds an assistant-role message (fixes "what is the file I just shared" — history previously only carried system-role upload notices, excluded from context); replaced `window.confirm()` on conversation delete with inline two-click confirm; added working hover states to dropdown menu options. Also caught and fixed two incidental Claude-Code-introduced syntax errors (missing `=>`, missing closing JSX brace) via Babel parse, not by reading alone.
- [x] **Phase 6 — Design.md typography alignment (2026-08-23):** audited Login/Home/Chat/Dashboard against the type scale (page title 20px/700, body 15px/400, source citation 12px/500, meta 11px/400, button text 14px/600, line-height 1.5). Login/Home/Chat already aligned. Dashboard.jsx needed four fixes, applied and independently re-verified (Babel parse + grep, not just trusting the tool's "VERIFIED" claim):
  1. Header "Back to Home"/"Log out" resized 12.5px → 14px; hardcoded hex colors replaced with `COLORS` constants (added `COLORS.heading` for the one non-matching shade — zero-visual-change).
  2. `lineHeight: 1.5` added to the two genuinely multi-line text blocks only (bulk-action confirm sentence, activity-log detail).
  3. Every `fontSize: 12` style object given `fontWeight: 500` (14 occurrences, verified correctly paired).
  4. All 15 `<th>` table headers resized 13px → 14px; table body cells and form labels left unchanged.
- [x] **Phase 6 — Load testing (2026-08-23):** built standalone `loadtest.js` (Node 18+, built-in fetch, kept outside repo) firing concurrent requests at live `chat`/`ingest` endpoints.
  - First run (10 chat, 5 ingest): all passed clean.
  - Second run (20 concurrent chat, above the 15/min cap): **all 20 succeeded — rate limit did not trigger.** Real bug, not a test artifact.
  - **Root cause:** rate-limit check was a non-atomic "count rows, then insert" across two separate DB calls — classic TOCTOU race under concurrency.
  - **Fix:** atomic Postgres function `check_and_record_rate_limit(user_id, endpoint, limit, window_seconds)`, serialized per user+endpoint via `pg_advisory_xact_lock`, fails open on RPC error. `chat` (v46) and `ingest` (v25) switched to this single RPC call.
  - **Verified fixed:** re-ran 20-concurrent-chat — exactly 15 succeeded, exactly 5 got 429, matching the configured limit. Re-ran 5-concurrent ingest — 5/5 passed, no regression.
  - **Lesson:** a "check then act" pattern split across two DB calls is a race condition waiting to happen even if sequential testing never shows it. Concurrent load testing caught a real, silent correctness bug that no prior single-request testing surfaced in this whole project.

## Currently In Progress

- **File/module:** None active.
- **Status:** Phase 6 (Design.md alignment + load testing) complete. Phase 5 functionally complete, pending full action-by-action verification beyond "Add User". All Edge Functions (`chat` v46, `ingest` v25, `admin` v2) and frontend in a clean, verified state as of 2026-08-23.
- **Blockers:** None.
- **Recommended next step:** either (a) the deferred dashboard-action-by-action verification pass, or (b) proceed with the rollout plan — small review-group access first, with further polish continuing in parallel.

## Deferred (explicitly, not forgotten)

- **Large PDF ingestion still unreliable.** Page-by-page, time-boxed extraction fix (`ingest` v23) deployed but still failed against a real 408-page book PDF. Not resolved — do not assume fixed. (Distinct from the embedding-dimension bug, which affected ALL uploads including small ones and is now fixed.)

## Open Decisions / Not Yet Finalized

- Minimum password length mismatch (Supabase Auth setting at 6, app enforces 8) — not yet synced, low priority.
- Skip-sources-on-bare-greeting fix — not confirmed present in current live chat function code.
- NVIDIA-hang retry — confirmed present and live. Resolved, no action needed.
- Hardcoded IST assumption in the chat system prompt — fine for now, flag if user base expands outside India.
- Large PDF ingestion reliability — see Deferred above.
- Dashboard actions beyond "Add User" — not individually re-verified.
- Rollout plan: small review-group access first, further polish/verification in parallel.

## Known Pitfalls (learned the hard way — avoid repeating)

- Don't let an AI agent freely rearchitect an already-working piece without being asked; verify library imports exist before using them; confirm large pastes/file writes actually completed in full; prefer PowerShell heredoc over interactive Notepad; deleting a `profiles` row doesn't delete the `auth.users` account; Supabase free-tier email sending can silently rate-limit during heavy test signups; re-creating a test account resets `department` to `'unassigned'`.
- Full-file regenerations by Claude Code can silently drop previously-applied fixes AND introduce brand-new, unrelated syntax errors — always re-verify fixes are present AND run the file through an actual parser after any Claude Code session.
- A "VERIFIED" claim from an AI code-editing tool is not fully trustworthy if the verification only checks presence of a pattern, not correctness of placement.
- Third-party blog posts about LLM-provider free-tier limits can be outdated or wrong — confirm against official docs before switching models based on a blog claim.
- A silent/hanging LLM API call is a different failure mode from an explicit error response, and needs different diagnosis via logs.
- When asked to "revert everything to how it was," be explicit about what specifically gets reverted and what side effects that has.
- Time-boxing a CPU-bound operation by wall-clock duration does not guarantee it stays under a platform's actual CPU-time budget — retest with the actual failing input before declaring a fix resolved.
- `supabase.functions.fetch(...)` is not a real method (correct method is `.functions.invoke()`) — this mistake has appeared more than once across regenerated files.
- Switching a frontend call to `supabase.functions.invoke()` requires the target Edge Function's CORS `Access-Control-Allow-Headers` to include `x-client-info`, or every call fails preflight with a generic, misleading error.
- `profiles.last_sign_in_at` does not exist — that data only lives in `auth.users`, read via `auth.admin.listUsers()`.
- Never trust a log entry claiming a schema fix is "done" without re-checking the live schema directly. A failure spanning multiple unrelated code paths at once signals a shared-step bug.
- A "check current state, then act" pattern split across two DB calls is a race condition waiting to happen under real concurrency, even if it works in sequential testing. Fix by making the check-and-act atomic (e.g. a Postgres function with a transaction-scoped advisory lock).
- Load testing with genuinely concurrent requests (not repeated sequential ones) is worth doing even on a small internal tool — it can catch silent correctness bugs sequential testing never surfaces.

## Log (most recent first)

| Date | What changed |
|------|--------------|
| 2026-08-23 | Phase 6 completed: Design.md typography alignment (Dashboard.jsx: header 14px + COLORS constants, line-height 1.5 on two multi-line blocks, fontWeight 500 on 12px controls, table headers to 14px) — applied and independently re-verified. Load testing built (`loadtest.js`) and found a genuine rate-limit race condition (non-atomic count-then-insert let all 20 concurrent requests through instead of capping at 15); fixed with atomic Postgres function `check_and_record_rate_limit` using a per-user advisory lock; re-tested, confirmed exactly 15/20 now succeed as designed. |
| 2026-08-22 | Found and fixed critical embedding-dimension mismatch (`documents.embedding` was `vector(384)`, model produces `1024`-dim) silently breaking every upload. Fixed Chat.jsx: upload success adds assistant-role message for history-awareness; replaced `window.confirm()` with inline two-click delete confirm; added working dropdown hover states. Caught and fixed two incidental Claude-Code syntax errors via Babel parse. |
| 2026-08-21 | Phase 5 (Admin Dashboard) built and confirmed working: DB schema, new `admin` Edge Function (9 actions), `chat`/`ingest` suspend-checks + activity logging, `Dashboard.jsx` frontend built/debugged across rounds, CORS header fix (`x-client-info`). Scope deviation from Phases.md noted. Chat system prompt UTC → IST. |
| 2026-08-20 | Phase 4 reviewed line-by-line and signed off complete. PDF page-by-page extraction fix deployed (`ingest` v23); still failed on a real 408-page book — deferred. Sidebar default-open bug fixed. |
| 2026-08-17 (approx.) | Streaming re-enabled on chat Edge Function. Full revert to "last known working state" after LLM-provider switching and a chunking-size fix caused confusion; two in-progress fixes dropped as part of revert. |
| 2026-08-14 to 2026-08-17 (approx.) | Extensive LLM-provider and ingestion debugging: Groq model deprecations/TPM limits, NVIDIA silent-hang issue diagnosed, CPU-timeout root cause diagnosed and fixed via chunk sizing — later reverted, then properly re-fixed via NVIDIA-hosted-embedding switch. |
| 2026-08-13 to 2026-08-14 (approx.) | Six-point UI/UX overhaul plus multi-round Chat.jsx bug-fix pass. Several fixes regressed once due to full-file regeneration, re-applied and re-verified. |
| 2026-08-12 | Phase 3 (Core Chat + Reasoning) marked fully complete: general-reasoning model (NVIDIA `llama-3.1-8b-instruct`). Multi-chat history added. Inline file-attach added to chat input. |
| 2026-08-08 | Phase 3 (original RAG-only version) completed and initially verified. Hallucination bug found and fixed — later made moot by reasoning-model pivot. |
| 2026-08-04 | Security hardening completed. Phase 2 (Document Ingestion) completed and verified. |
| 2026-07-29 | Phase 1 (Login) completed and verified end-to-end. |
| 2026-07-28 | Reverted incorrect custom Express backend; restored clean Supabase-Auth-based frontend for Phase 1. |
| 2026-07-25 | Supabase project `knowledge-chatbot` created; Phase 1 Login code delivered. |
| 2026-07-25 | Initial 6 planning docs created: Project-Requirements.md, Architecture.md, Rules.md, Phases.md, Design.md, Memory.md. |
