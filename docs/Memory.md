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
  - Edge Function `ingest` (Supabase): chunking + embedding (`gte-small`) + insert into `documents` table
  - PDF text extraction via `unpdf` — digital/text-layer PDFs only, not scanned/image PDFs
  - `documents` table: id, title, content, embedding (vector), uploaded_by, created_at
  - Admin-only restriction: `profiles` table (role: admin/employee), `AdminRoute.jsx`, server-side role check in Edge Function
  - Current admin: adityanaik.12d@gmail.com
  - Verified via direct Supabase query
- [x] Security hardening (post-Phase 2, applies across Phase 1+2): COMPLETE
  - **Input validation** — Login.jsx (email format, password rules), Upload.jsx (title/content required + max length, PDF type/size check)
  - **Server-side sanitization** — `ingest` Edge Function v3: strips control chars, hard length caps (title 200 chars, content 200k chars, PDF base64 ~8MB), malformed-JSON handled cleanly
  - **Login attempt limiting** — client-side lockout: 5 failed attempts → 60s cooldown, countdown shown on button
  - **Password hashing** — already handled by Supabase Auth (bcrypt), no custom work needed
  - **Hide auth details** — generic "Invalid email or password" on all sign-in failures (never reveals which field was wrong); generic "Something went wrong" on all server errors (no stack traces/internal details leaked)
  - **Password reset (bonus, not in original Rules.md but added)** — email-link flow: `resetPassword`/`updatePassword` added to `AuthContext.jsx`, "Forgot password?" link in `Login.jsx`, new `src/pages/ResetPassword.jsx`, route added in `App.jsx`
  - Verified end-to-end: lockout triggers correctly, reset email received, new password works to log in

## Currently In Progress

- **File/module:** IT/CSE department-only access restriction — discussion started, not yet implemented
- **Status:** Decision made — this will be an internal tool for IT/CSE staff only (their own runbooks/SOPs), not company-wide
- **Next technical step:** add `department` column to `profiles` table, decide assignment method (manual vs auto-rule — not yet decided), update `ProtectedRoute`/login flow to block non-IT/CSE users
- **Blockers:** Need to decide how new users get assigned to IT/CSE department before implementing (manual admin action vs automatic rule)

## Open Decisions / Not Yet Finalized

- Department assignment method for IT/CSE restriction (manual vs auto-rule) — pending user decision
- Which LLM provider/model exactly for Phase 3 chat (Architecture.md suggests Claude API — confirm access/budget)
- Embedding model already decided for ingestion (`gte-small`, Supabase built-in, free) — confirm same model used for query embedding in Phase 3

## Known Pitfalls (learned the hard way — avoid repeating)

- Don't let an AI agent freely rearchitect an already-working piece (Phase 1 backend was wrongly rebuilt once, had to be reverted)
- Verify library imports actually exist before using them
- When editing files via Notepad on Windows, always confirm the save actually took (`Select-String` grep-check) — silent non-saves happened multiple times
- Prefer PowerShell heredoc over interactive Notepad for reliably writing file content
- Large PDFs (100+ pages) used to fail with HTTP 546 (compute limit) — now prevented upfront by 8MB file-size validation in Upload.jsx + server-side base64 length cap in Edge Function
- Title field only resets after a *successful* upload — reused/stale titles can get attached to new content if not manually changed before submit
- Test/dummy documents currently sitting in `documents` table — not cleaned yet, intentional (still testing)

## Log (most recent first)

| Date | What changed |
|------|--------------|
| 2026-08-04 | Security hardening completed: input validation, server-side sanitization, login-attempt lockout, generic error messages, email-based password reset flow — all verified working |
| 2026-08-04 | Phase 2 (Document Ingestion) completed and verified: text + PDF upload, chunking, embedding, vector storage, admin-only restriction |
| 2026-07-29 | Phase 1 (Login) completed and verified end-to-end |
| 2026-07-28 | Reverted incorrect custom Express backend (created without instruction); restored clean Supabase-Auth-based frontend |
| 2026-07-25 | Supabase project `knowledge-chatbot` created; Phase 1 Login code delivered |
| 2026-07-25 | Initial 6 planning docs created |