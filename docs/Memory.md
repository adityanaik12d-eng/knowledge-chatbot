# Memory Document
**Project:** Internal Knowledge Chatbot — Venus Remedies

> Update this file after every work session. Keep entries short and factual — this exists so anyone (including a future AI session) can pick up exactly where work left off, without re-reading the whole conversation history.

---

## What Has Been Completed

- [x] Project planning docs created: Project-Requirements.md, Architecture.md, Rules.md, Phases.md, Design.md, Memory.md
- [x] Supabase project created (`knowledge-chatbot`, ap-south-1 region) — separate from CrickCoach
- [x] Phase 1 — Login: COMPLETE
  - Frontend: React (Vite) at `frontend/`, using Supabase Auth (email + password)
  - Files: `src/lib/supabase.js`, `src/context/AuthContext.jsx`, `src/routes/ProtectedRoute.jsx`, `src/pages/Login.jsx`, `src/pages/Home.jsx` (placeholder)
  - Verified: signup, login, session persists across refresh, logout — all working
  - No backend needed for this phase (Supabase Auth handles it client-side)

## Currently In Progress

- **File/module:** None — Phase 1 closed out
- **Status:** Ready to start Phase 2
- **Blockers:** None

## Open Decisions / Not Yet Finalized

- Backend framework/approach for Phase 2+ (ingestion needs server-side logic — Node/Express planned per Architecture.md, but keep scope minimal this time to avoid the churn from the last attempt)
- Which LLM provider/model exactly (Architecture.md suggests Claude API — confirm access/budget)
- Embedding model/provider for the vector search step

## Known Pitfalls (learned the hard way — avoid repeating)

- Don't let an AI agent freely rearchitect an already-working piece (Phase 1's backend was rebuilt from Supabase-Auth into a custom Express+JWT+in-memory setup without being asked — caused hours of debugging and had to be reverted)
- Verify library imports actually exist before using them (recurring bug source across this whole build)
- When editing files via Notepad on Windows, always confirm the save actually took (`Select-String` grep-check) — silent non-saves happened multiple times
- Prefer PowerShell heredoc (`@'...'@ | Set-Content`) over interactive Notepad for reliably writing file content

## Log (most recent first)

| Date | What changed |
|------|--------------|
| 2026-07-29 | Phase 1 (Login) completed and verified end-to-end: signup, login, session persistence, logout all working via Supabase Auth |
| 2026-07-28 | Reverted incorrect custom Express backend (created without instruction); restored clean Supabase-Auth-based frontend for Phase 1 |
| 2026-07-25 | Supabase project `knowledge-chatbot` created; Phase 1 Login code (Supabase Auth) built and delivered |
| 2026-07-25 | Initial 6 planning docs created: Project-Requirements.md, Architecture.md, Rules.md, Phases.md, Design.md, Memory.md |
'@ | Set-Content -Path docs\Memory.md -Encoding UTF8