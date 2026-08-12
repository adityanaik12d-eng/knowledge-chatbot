# Memory Document
**Project:** IT/CSE Knowledge Assistant — Venus Remedies

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
  - Upload page (`src/pages/Upload.jsx`): text paste, PDF upload, and bulk multi-file upload (3 tabs)
  - Edge Function `ingest`: chunking + embedding (`gte-small`) + insert into `documents` table
  - PDF text extraction via `unpdf` — digital/text-layer PDFs only, not scanned/image PDFs
  - `documents` table: id, title, content, embedding (vector), uploaded_by, created_at
  - Access control evolved: originally admin-only, now **any IT/CSE department member can upload** (shared team knowledge base model)
- [x] Security hardening: COMPLETE
  - Input validation (Login.jsx, Upload.jsx), server-side sanitization (both Edge Functions), login lockout (5 attempts/60s), password hashing (automatic via Supabase Auth), generic error messages (no internal detail leakage)
  - Email-based password reset flow: `resetPassword`/`updatePassword` in `AuthContext.jsx`, `src/pages/ResetPassword.jsx`, `/reset-password` route
  - DB security fixes applied: `search_path` set explicitly on `match_documents()` and `handle_new_user()`; `handle_new_user()` public RPC execute permission revoked from `anon`/`authenticated`
  - Known limitation: "Leaked password protection" (Supabase Auth setting) requires Pro plan — not available on free tier, skipped
  - Minimum password length in Supabase Auth settings still at default (6) vs. app's own 8-char rule — mismatch noted, not yet fixed (low priority)
- [x] IT/CSE Department Restriction: COMPLETE
  - Project narrowed in scope: internal tool for IT/CSE staff only (not company-wide)
  - `profiles` table has `department` column (`'IT/CSE'`/`'unassigned'`, default unassigned), assigned manually by admin via SQL/Table Editor
  - `ProtectedRoute.jsx` gates on `isITCSE`; non-IT/CSE users redirected to `/access-denied` (`AccessDenied.jsx`, with working logout that properly navigates to `/login`)
  - Both Edge Functions (`ingest`, `chat`) independently check `profiles.department === 'IT/CSE'` server-side
  - Known accounts: `adityanaik.12d@gmail.com` (admin, IT/CSE), `eduhorizon.67@gmail.com` (employee, IT/CSE — test account)
- [x] **Major architecture pivot (2026-08-09 through 2026-08-12): COMPLETE & VERIFIED**
  - Moved from strict "only answer from uploaded documents" (RAG-only) model to a **general-reasoning assistant model** — like Claude/ChatGPT. The assistant now answers freely from its own knowledge (NVIDIA `meta/llama-3.1-8b-instruct`), and uses uploaded documents only as *optional* enrichment context — cited when relevant, never a hard requirement to answer
  - Reason for pivot: strict retrieval-only grounding was causing frustrating false-negatives ("I don't have enough information" even when the answer existed in an uploaded doc) despite several tuning attempts (match count 5→8→12, threshold adjustments, prompt tweaks). A more serious hallucination bug was also found and fixed along the way (assistant fabricated a fake "leave policy" when conversation history existed but no document matched — fixed by making the retrieval-empty fallback unconditional in the old model; this whole issue became moot after the pivot to reasoning-first)
  - Trade-off consciously accepted: answers are no longer guaranteed traceable to a source — this differs from the original core safety rule for this pharma-company internal tool. Documented explicitly for future reference.
  - Planning docs rewritten to reflect this: `Project-Requirements.md`, `Architecture.md`, `Rules.md`, `Phases.md` all updated
  - Natural Hinglish tone fixed via system prompt (previously produced stiff, overly formal/textbook Hindi translations — now matches casual bilingual chat style)
  - Retrieval performance: time-boxed to 4 seconds (never blocks the answer if slow), `max_tokens` reduced 1500→800 for faster typical replies
  - Model history: `meta/llama-3.3-70b-instruct` tried first, abandoned (too slow/unreliable on NVIDIA free tier, timed out even at 55s) — settled on `meta/llama-3.1-8b-instruct`, fast and reliable
- [x] **Multi-chat history (Claude-style): COMPLETE & VERIFIED**
  - New tables: `conversations` (id, user_id, title, created_at, updated_at) and `messages` (id, conversation_id, user_id, role, content, sources jsonb, created_at) — both RLS-enabled, users can only access their own rows
  - `Chat.jsx` rebuilt with a left sidebar: conversation list (most recent first), "+ New Chat" button, click-to-switch, full persistence (survives page refresh)
  - New conversations only get a DB row on first message sent (avoids empty junk conversations); title auto-derived from first ~40 chars of that message
  - Fixed a bug where switching to a past conversation showed empty user bubbles and permanently-stuck "Thinking…" — caused by a field-name mismatch (DB column `content` vs. UI's expected `text` field) in the message-loading function
- [x] **Inline file upload in chat (Claude-style "+" button): COMPLETE & VERIFIED**
  - "+" icon added to the chat input bar; uploads go straight into the shared knowledge base via the existing `ingest` Edge Function (same behavior as the separate Upload page — this was a deliberate choice, not ephemeral/session-only)
  - Upload status shown as inline system-style messages in the chat (uploading → success/error with chunk count), not persisted to the messages table
  - Fixed an auth bug: the upload function was reading `user.access_token` (doesn't exist — only `session` objects have that) instead of getting the token via `supabase.auth.getSession()`, causing all uploads to fail with "Not authenticated"

## Currently In Progress

- **File/module:** None — recent pivot + multi-chat + inline upload all tested end-to-end and confirmed working by the user
- **Status:** User has decided to hold off on further changes until the chatbot is live/deployed
- **Blockers:** None

## Open Decisions / Not Yet Finalized

- Minimum password length mismatch (Supabase Auth setting at 6, app enforces 8) — not yet synced, low priority
- No further feature work planned until after going live, per user's explicit decision (2026-08-12)

## Known Pitfalls (learned the hard way — avoid repeating)

- Don't let an AI agent freely rearchitect an already-working piece without being asked
- Verify library imports actually exist before using them
- When editing files via Notepad on Windows, always confirm the save actually took — silent non-saves and mid-paste cutoffs (once caused a JSX syntax error) have happened multiple times; always confirm full file length/ending after a large paste
- Prefer PowerShell heredoc (`@'...'@ | Set-Content`) over interactive Notepad for reliably writing file content
- Large PDFs (100+ pages) fail with compute limits — 8MB file-size cap enforced upfront in Upload.jsx and the Edge Function to prevent this
- Deleting a row from `profiles` does NOT delete the actual login account (`auth.users` is separate) — full account deletion requires deleting from `auth.users` too
- Supabase free-tier email sending has a rate limit — heavy testing (multiple signups/resets) can silently fail to send confirmation/reset emails
- Deleting+recreating a test auth account resets `profiles.department` back to default `'unassigned'` — must be manually re-set
- **New:** When delegating file generation to Claude Code, always instruct it to write output into a separate new folder (not edit real files directly) and to output complete, unambiguous single-block prompts with exact code snippets — vague "fix this" instructions led to a subtle auth-token bug (`user.access_token` vs `session.access_token`) that took an extra debugging round to catch
- **New:** When asking Claude Code for multiple file outputs at once via terminal print, files can get concatenated/mixed together, making it hard to tell where one ends and another begins — safer to have it write actual separate files to disk in a dedicated folder rather than printing everything to the terminal

## Log (most recent first)

| Date | What changed |
|------|--------------|
| 2026-08-12 | Major pivot completed & verified: general-reasoning assistant model (NVIDIA `llama-3.1-8b-instruct`) — answers freely from own knowledge, uses uploaded docs as optional cited context, no longer hard-gated on document match. Docs (Project-Requirements.md, Architecture.md, Rules.md, Phases.md) rewritten to reflect this. Natural Hinglish tone fixed via system prompt. Multi-chat history added: `conversations` + `messages` tables (RLS enabled), sidebar with conversation list, new-chat/switch-chat, full persistence across page refresh. Inline "+" file-attach added to chat input — uploads go straight to shared knowledge base via existing `ingest` function (fixed an auth-token bug where wrong token source caused "Not authenticated" failures). Response speed improved: retrieval time-boxed to 4s (never blocks answer), max_tokens reduced 1500→800 for faster typical replies. All changes tested end-to-end by user and confirmed working: general reasoning, document-grounded answers with citations, follow-up memory, multi-chat switching, refresh-persistence, file upload, streaming, Hinglish tone, IT/CSE access gate intact. User has decided to pause further feature work until the chatbot goes live. |
| 2026-08-08 | Phase 3 (Core Chat + Retrieval, original RAG-only version) completed and initially verified: vector search (`match_documents` SQL function), `chat` Edge Function, streaming responses, conversation memory (pre-multi-chat, single-thread version). A hallucination bug was found (fake "leave policy" fabricated when no document matched but conversation history existed) and fixed by forcing the empty-match fallback unconditionally — this whole issue later became moot after the reasoning-model pivot above. |
| 2026-08-04 | Security hardening completed: input validation, server-side sanitization, login-attempt lockout, generic error messages, email-based password reset flow — all verified working. Phase 2 (Document Ingestion) completed and verified: text + PDF upload, chunking, embedding, vector storage, admin-only restriction (later loosened to all IT/CSE members). |
| 2026-07-29 | Phase 1 (Login) completed and verified end-to-end: signup, login, session persistence, logout all working via Supabase Auth. |
| 2026-07-28 | Reverted incorrect custom Express backend (created without instruction); restored clean Supabase-Auth-based frontend for Phase 1. |
| 2026-07-25 | Supabase project `knowledge-chatbot` created; Phase 1 Login code (Supabase Auth) built and delivered. |
| 2026-07-25 | Initial 6 planning docs created: Project-Requirements.md, Architecture.md, Rules.md, Phases.md, Design.md, Memory.md. |