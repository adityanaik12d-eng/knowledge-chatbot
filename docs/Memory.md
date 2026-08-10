# Memory Document
**Project:** Internal Knowledge Chatbot — Venus Remedies

> Update this file after every work session. Keep entries short and factual — this exists so anyone (including a future AI session) can pick up exactly where work left off, without re-reading the whole conversation history.

---

## What Has Been Completed

- [x] Project planning docs created: Project-Requirements.md, Architecture.md, Rules.md, Phases.md, Design.md, Memory.md
- [x] Supabase project created (`knowledge-chatbot`, ap-south-1 region) — separate from CrickCoach
- [x] Phase 1 — Login: COMPLETE
  - Frontend: React (Vite) at `frontend/`, using Supabase Auth (email + password)
  - Files: `src/lib/supabase.js`, `src/context/AuthContext.jsx`, `src/routes/ProtectedRoute.jsx`, `src/pages/Login.jsx`, `src/pages/Home.jsx`
  - Verified: signup, login, session persists across refresh, logout — all working
- [x] Phase 2 — Document Ingestion: COMPLETE
  - Upload page (`src/pages/Upload.jsx`): text paste + PDF upload, tab toggle
  - Edge Function `ingest` (Supabase, now v7): chunking + embedding (`gte-small`) + insert into `documents` table
  - PDF text extraction via `unpdf` — digital/text-layer PDFs only, not scanned/image PDFs
  - `documents` table: id, title, content, embedding (vector), uploaded_by, created_at
  - Upload restriction evolved: originally admin-only → now any IT/CSE department member can upload (shared team knowledge base model); admin role check removed, replaced with department check
  - Current admin: adityanaik.12d@gmail.com
  - Verified via direct Supabase query
- [x] Security hardening (post-Phase 2, applies across Phase 1+2): COMPLETE
  - **Input validation** — Login.jsx (email format, password rules), Upload.jsx (title/content required + max length, PDF type/size check)
  - **Server-side sanitization** — Edge Functions strip control chars, hard length caps (title 200 chars, content 200k chars, PDF base64 ~8MB), malformed-JSON handled cleanly
  - **Login attempt limiting** — client-side lockout: 5 failed attempts → 60s cooldown, countdown shown on button
  - **Password hashing** — already handled by Supabase Auth (bcrypt), no custom work needed
  - **Hide auth details** — generic "Invalid email or password" on all sign-in failures (never reveals which field was wrong); generic "Something went wrong" on all server errors (no stack traces/internal details leaked)
  - **Password reset (bonus, not in original Rules.md but added)** — email-link flow: `resetPassword`/`updatePassword` added to `AuthContext.jsx`, "Forgot password?" link in `Login.jsx`, new `src/pages/ResetPassword.jsx`, route added in `App.jsx`
  - Verified end-to-end: lockout triggers correctly, reset email received, new password works to log in
- [x] IT/CSE Department Restriction: COMPLETE
  - Decision finalized: internal tool for IT/CSE staff only, not company-wide
  - `profiles` table got new `department` column (`'IT/CSE'` / `'unassigned'`, default `'unassigned'`)
  - Assignment method decided: **manual** — admin sets department via direct SQL/Table Editor for approved users, no auto-rule
  - `ProtectedRoute.jsx` now checks `isITCSE`, non-IT/CSE users redirected to `/access-denied`
  - New page `src/pages/AccessDenied.jsx` — includes working "Log out" button (fixed navigation bug, now uses `useNavigate` after `signOut()`)
  - `AuthContext.jsx` now exposes `department`, `isITCSE`, `isAdmin` (role and department kept separate — role for future admin-panel features, department is the access gate)
  - Upload route switched from `AdminRoute` to `ProtectedRoute` (department check alone now sufficient)
  - Server-side: `ingest` and `chat` Edge Functions both independently check `profiles.department === 'IT/CSE'` (defense in depth)
  - Test account: eduhorizon.67@gmail.com (role=employee, department=IT/CSE) — had to be manually re-fixed twice after account recreation reset department to default
- [x] Phase 3 — Core Chat + Retrieval: COMPLETE (pending final retest, see below)
  - New DB function `match_documents(query_embedding, match_count, match_threshold)` — pgvector cosine similarity, threshold 0.3, top 5 matches
  - Edge Function `chat` (now v10): auth + IT/CSE check → embeds question (`gte-small`) → retrieves matches via `match_documents` → if no matches, always returns "I don't have enough information in the knowledge base to answer that." → builds context from matches → calls NVIDIA NIM LLM with strict-grounding system prompt → streams response via custom NDJSON protocol (sources → tokens → done/error)
  - Conversation memory: last 6 messages sent as history, included in LLM message list for follow-ups
  - Frontend: `src/pages/Chat.jsx` — streaming message bubbles, source citation badges (title + similarity %), markdown rendering via `react-markdown` + `remark-gfm`
  - Route `/chat` added, "Start Chat →" button added to `Home.jsx`
  - LLM decision finalized: **NOT Claude** (Architecture.md originally suggested this) — using NVIDIA NIM API, model `meta/llama-3.1-8b-instruct`. Note: `llama-3.3-70b-instruct` tried first, too slow/unreliable on free tier (timed out at 55s), switched to 8B for reliability/speed
  - Embedding model confirmed same as ingestion: `gte-small`, used for both document embedding and query embedding

## Currently In Progress

- **File/module:** Hallucination bug fix retest
- **Status:** Bug found and fixed — conversation history previously let LLM bypass "no source, no answer" rule and hallucinate (fake leave policy generated for "company ki leave policy kya hai?"). Fix applied: empty-match fallback now unconditional regardless of history.
- **Next technical step:** retest same 5-question sequence (esp. leave-policy question) to confirm fix holds, then this Memory.md entry can be considered fully closed
- **Blockers:** none — just needs retest pass

## Open Decisions / Not Yet Finalized

- Rate limiting on `/chat` endpoint specifically — not yet implemented (Phase 4)
- Admin dashboard for user/department/role management — deferred intentionally until team size grows; managed manually via Supabase Table Editor / direct SQL for now (Phase 5)
- Planning docs (Architecture.md, Phases.md, Project-Requirements.md) not yet updated to match actual implementation — known drift, low priority

## Known Pitfalls (learned the hard way — avoid repeating)

- Don't let an AI agent freely rearchitect an already-working piece (Phase 1 backend was wrongly rebuilt once, had to be reverted)
- Verify library imports actually exist before using them
- When editing files via Notepad on Windows, always confirm the save actually took (`Select-String` grep-check) — silent non-saves happened multiple times
- Prefer PowerShell heredoc over interactive Notepad for reliably writing file content
- Large PDFs (100+ pages) used to fail with HTTP 546 (compute limit) — now prevented upfront by 8MB file-size validation in Upload.jsx + server-side base64 length cap in Edge Function
- Title field only resets after a *successful* upload — reused/stale titles can get attached to new content if not manually changed before submit
- Test/dummy documents (e.g. "bank account registration form" code sample) still sitting in `documents` table — flagged for cleanup before real demo
- Deleting a row from `profiles` does NOT delete the actual login account — `auth.users` is separate; full account deletion requires deleting from `auth.users` too
- Supabase free-tier email sending has a rate limit — heavy testing (multiple signups/resets) can silently fail with no email sent, not a bug
- Recreating a deleted test auth account resets `profiles.department` back to default `'unassigned'` — must be manually re-set
- PowerShell doesn't support `&&` as a statement separator (bash syntax) — use `;` or separate lines for chained git commands

## Log (most recent first)

| Date | What changed |
|------|--------------|
| 2026-08-10 | Phase 3 hallucination bug found (fake leave policy generated) and fixed — fallback now unconditional; retest pending |
| 2026-08-10 | Phase 3 (Core Chat + Retrieval) completed: retrieval, streaming chat, conversation memory, source citations, markdown rendering — verified via 5-question test sequence (4/5 passed, 1 flagged and fixed above) |
| 2026-08-06 | IT/CSE department restriction completed and verified: department column, manual assignment, ProtectedRoute/AccessDenied, server-side checks on both Edge Functions |
| 2026-08-04 | Security hardening completed: input validation, server-side sanitization, login-attempt lockout, generic error messages, email-based password reset flow — all verified working |
| 2026-08-04 | Phase 2 (Document Ingestion) completed and verified: text + PDF upload, chunking, embedding, vector storage, admin-only restriction (later loosened to IT/CSE-wide) |
| 2026-07-29 | Phase 1 (Login) completed and verified end-to-end |
| 2026-07-28 | Reverted incorrect custom Express backend (created without instruction); restored clean Supabase-Auth-based frontend |
| 2026-07-25 | Supabase project `knowledge-chatbot` created; Phase 1 Login code delivered |
| 2026-07-25 | Initial 6 planning docs created |