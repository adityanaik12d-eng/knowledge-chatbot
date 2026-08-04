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
  - PDF text extraction via `unpdf` library — works for digital/text-layer PDFs only, not scanned/image PDFs
  - `documents` table created: id, title, content, embedding (vector), uploaded_by, created_at
  - Admin-only restriction added:
    - New `profiles` table (id, email, role: admin/employee) — auto-created on signup via DB trigger
    - `src/routes/AdminRoute.jsx` — blocks non-admins from `/upload`, redirects to `/`
    - `AuthContext.jsx` updated — now also fetches `role`, exposes `isAdmin`
    - Edge Function also checks role server-side before insert (defense in depth)
    - Current admin: adityanaik.12d@gmail.com
  - Verified via direct Supabase query (not yet through chat UI — correct, per Phase 2 "done when" criteria)

## Currently In Progress

- **File/module:** None — Phase 2 closed out
- **Status:** Ready to start Phase 3
- **Blockers:** None

## Open Decisions / Not Yet Finalized

- Which LLM provider/model exactly for Phase 3 chat (Architecture.md suggests Claude API — confirm access/budget)
- Embedding model already decided for ingestion (`gte-small`, Supabase built-in, free) — confirm same model used for query embedding in Phase 3 for consistency

## Known Pitfalls (learned the hard way — avoid repeating)

- Don't let an AI agent freely rearchitect an already-working piece (Phase 1's backend was rebuilt from Supabase-Auth into a custom Express+JWT+in-memory setup without being asked — caused hours of debugging and had to be reverted)
- Verify library imports actually exist before using them (recurring bug source across this whole build)
- When editing files via Notepad on Windows, always confirm the save actually took (`Select-String` grep-check) — silent non-saves happened multiple times
- Prefer PowerShell heredoc (`@'...'@ | Set-Content`) over interactive Notepad for reliably writing file content
- Large PDFs (100+ pages) fail with HTTP 546 — Edge Function hits compute/memory limit trying to extract + embed a whole book in one request. Fine for v1/testing; would need background job/batching for large real docs.
- Title field only resets after a *successful* upload — if left unchanged before submit, wrong title can get attached to new content. No title-content validation currently exists.
- Test/dummy documents currently sitting in `documents` table — not cleaned yet, intentional (still testing), clean before real demo.

## Log (most recent first)

| Date | What changed |
|------|--------------|
| 2026-08-04 | Phase 2 (Document Ingestion) completed and verified: text + PDF upload, chunking, embedding, vector storage, admin-only restriction (new `profiles` table + `AdminRoute` + server-side role check) — all confirmed via direct Supabase query |
| 2026-07-29 | Phase 1 (Login) completed and verified end-to-end: signup, login, session persistence, logout all working via Supabase Auth |
| 2026-07-28 | Reverted incorrect custom Express backend (created without instruction); restored clean Supabase-Auth-based frontend for Phase 1 |
| 2026-07-25 | Supabase project `knowledge-chatbot` created; Phase 1 Login code (Supabase Auth) built and delivered |
| 2026-07-25 | Initial 6 planning docs created: Project-Requirements.md, Architecture.md, Rules.md, Phases.md, Design.md, Memory.md |