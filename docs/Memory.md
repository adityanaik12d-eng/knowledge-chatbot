# Memory Document
**Project:** IT/CSE Knowledge Assistant — Venus Remedies

> Update this file after every work session. Keep entries short and factual — this exists so anyone (including a future AI session) can pick up exactly where work left off, without re-reading the whole conversation history.

---

## What Has Been Completed

- [x] Phase 1 (Login), Phase 2 (Ingestion), Security hardening, IT/CSE dept restriction, Phase 3 (Core Chat + Reasoning) — as documented in prior entries below (through 2026-08-12).
- [x] Chat.jsx UI bug-fix rounds (post-Phase-3) — broken "New Project" creation, non-functional `&:hover`, raw-DOM dropdown menu, mojibake icons, duplicate style keys, clipped "Move to project" submenu, flexbox overflow in input row, a typo causing a full app crash, sidebar auto-open bug — all fixed and confirmed working.
- [x] Six-point UI/UX overhaul — auto-resizing textarea, fully responsive layout (mobile/tablet/desktop), accept-all-file-types picker, auto-scroll during streaming, scroll-to-bottom on conversation open.
- [x] File-type ingestion expanded — images (PNG/JPG via NVIDIA vision model), Word (.docx) and Excel (.xlsx) via a native dependency-free ZIP/XML reader (built after `mammoth` and third-party `xlsx` libraries both proved unreliable in the Edge Function's CPU/time budget).
- [x] Root cause of repeated CPU-Time-exceeded (546) crashes on large/data-heavy uploads (CSV, XLSX, big DOCX) identified and fixed: embedding generation was local/CPU-bound (Supabase.ai `gte-small`). Switched to NVIDIA's hosted embedding endpoint (`nvidia/nv-embedqa-e5-v5`), which is network-bound instead — this was the real, durable fix, re-applied and confirmed after an earlier full revert had accidentally undone it.
- [x] **Phase 4 (Fallback & Error Handling) — signed off as complete**, verified against live Edge Function code line-by-line (not assumed):
  - Rate limiting / abuse protection: done. `RATE_LIMIT_PER_MINUTE` (15 for chat, 40 for ingest) backed by a `rate_limit_events` table, returns HTTP 429 on both endpoints.
  - Clear error messages for LLM failure: done. Timeout + one automatic retry on the NVIDIA call, then a clear 504/502 message if both attempts fail.
  - Clear error messages for auth/input failures: done. Distinct 400/401/403 responses with specific messages (not authenticated, wrong department, malformed body, message too long, etc.).
  - Vector DB / retrieval failure: handled via a timeout-boxed retrieval call that fails silently into "no context" rather than crashing the request — acceptable given the point below.
  - **Explicit, accepted deviation:** the original "I don't have enough information" hard-gate (refuse to answer when no document matches) is intentionally NOT current behavior. Superseded by the Phase 3 reasoning-model pivot (2026-08-12): the assistant now answers from its own general knowledge when no relevant document is found, using retrieved documents as optional cited context rather than a strict requirement. Reviewed against original Phases.md wording and knowingly kept as-is by explicit decision, not an oversight.

## Currently In Progress

- **File/module:** None active.
- **Status:** Phase 4 confirmed complete. Ready to begin Phase 5 (Dashboard / Admin View) per Phases.md — not yet started.
- **Blockers:** None blocking Phase 5 start.

## Deferred (explicitly, not forgotten)

- **Large PDF ingestion still unreliable.** A fix was deployed (`ingest` v23): PDF text extraction changed from a single `extractText(mergePages: true)` call over the whole document to a page-by-page loop (`pdf.getPage(i)` → `getTextContent()`) with a 20-second wall-clock budget, truncating honestly and reporting `truncated: true` instead of crashing if a document doesn't finish in time. **This was tested against a real 408-page book PDF after deploy and still failed** ("Could not save document. Please try again."), so the fix has not resolved the underlying issue for very large PDFs. User explicitly chose to drop this and revisit later rather than keep debugging now — do not treat this as solved.

## Open Decisions / Not Yet Finalized

- Minimum password length mismatch (Supabase Auth setting at 6, app enforces 8) — not yet synced, low priority.
- Whether to re-apply two previously-drafted-then-reverted chat-quality fixes (skip-sources-on-bare-greeting, NVIDIA-hang retry) — a retry-on-failure mechanism was in fact re-added since (`callNvidiaOnce` with one retry, confirmed in current code), so this item may already be resolved; the skip-sources-on-greeting fix has not been re-confirmed as present or absent in current code.
- Large PDF ingestion reliability — see "Deferred" above.

## Known Pitfalls (learned the hard way — avoid repeating)

- Don't let an AI agent freely rearchitect an already-working piece without being asked; verify library imports exist before using them; confirm large pastes/file writes actually completed in full; prefer PowerShell heredoc over interactive Notepad; deleting a `profiles` row doesn't delete the `auth.users` account; Supabase free-tier email sending can silently rate-limit during heavy test signups; re-creating a test account resets `department` to `'unassigned'`.
- Full-file regenerations by Claude Code (even when only asked to make a small edit) can silently drop previously-applied fixes — always re-verify specific fixes are present in the real project file after any Claude Code session, especially after a large or multi-part prompt.
- A "VERIFIED" claim from an AI code-editing tool is not fully trustworthy on its own if the verification only checks *presence* of a pattern, not *correctness* of its placement.
- Third-party blog posts about LLM-provider free-tier limits (TPM/RPM, which models are active) can be outdated or wrong — always confirm against the provider's own official docs before switching models based on a blog claim.
- A silent/hanging LLM API call (no error, no response, just timeout) is a different failure mode from an explicit error response, and needs different diagnosis via logs (was the outbound request even attempted, did any response come back at all).
- When asked to "revert everything to how it was," be explicit about what specifically gets reverted and what side effects that has — a revert can silently un-fix unrelated, still-valid work (this happened with the CPU-timeout fix during an earlier provider-switching revert).
- Time-boxing a CPU-bound operation (e.g. PDF page parsing) by wall-clock duration does not guarantee it stays under a platform's actual CPU-time budget — it reduces worst-case damage (truncates instead of crashing) but is not a proven fix until tested against a real worst-case file. Always retest with the actual failing input before declaring a CPU-budget fix resolved.

## Log (most recent first)

| Date | What changed |
|------|--------------|
| 2026-08-20 | Phase 4 (Fallback & Error Handling) reviewed line-by-line against live Edge Function code and signed off as complete, with one explicit accepted deviation (no hard "insufficient information" gate — superseded by the reasoning-model pivot). PDF page-by-page extraction fix deployed (`ingest` v23) to address CPU-Time-exceeded crashes on large PDFs; tested against a real 408-page book and still failed — issue deferred, not resolved, do not assume it's fixed. |
| 2026-08-20 | Sidebar default-open bug fixed: `sidebarOpen` no longer initializes or resets based on `window.innerWidth > 768`; now always starts closed, only the hamburger toggle controls it. Confirmed working. |
| 2026-08-17 (approx.) | Streaming re-enabled on the chat Edge Function (had been silently left as `stream: false`), restoring incremental token delivery and auto-scroll-while-answering. Confirmed working. |
| 2026-08-17 (approx.) | Full revert to "last known working state" after several rounds of LLM-provider switching and a chunking-size fix caused confusion. Chat reverted to NVIDIA `meta/llama-3.1-8b-instruct`; ingest reverted to the pre-chunk-fix version. Two in-progress fixes (retry-on-hang, skip-sources-on-greeting) were dropped as part of this revert. |
| 2026-08-14 to 2026-08-17 (approx.) | Extensive LLM-provider and ingestion debugging: Groq model deprecations/TPM limits chased across several models; NVIDIA endpoint-level silent-hang issue diagnosed on `meta/llama-3.3-70b-instruct`; CPU-timeout root cause in ingestion diagnosed (sequential per-chunk local embedding, not file parsing) and fixed via larger chunk sizes + a hard cap — later reverted along with the provider changes above, then properly re-fixed via the NVIDIA-hosted-embedding switch (see "What Has Been Completed"). |
| 2026-08-13 to 2026-08-14 (approx.) | Six-point UI/UX overhaul plus a large multi-round Chat.jsx bug-fix pass (see "What Has Been Completed"). Several fixes were found to have regressed at least once due to full-file regeneration by Claude Code and had to be re-applied and re-verified. |
| 2026-08-12 | Phase 3 (Core Chat + Reasoning) marked fully complete: general-reasoning assistant model (NVIDIA `llama-3.1-8b-instruct`) — answers freely from own knowledge, uses uploaded docs as optional cited context, no longer hard-gated on document match. Docs rewritten and pushed to GitHub. Multi-chat history added (`conversations` + `messages` tables, RLS enabled, sidebar). Inline file-attach added to chat input. Response speed improved (time-boxed retrieval, reduced max_tokens). |
| 2026-08-08 | Phase 3 (original RAG-only version) completed and initially verified. A hallucination bug (fake "leave policy" fabricated with no matching document) was found and fixed — later made moot by the reasoning-model pivot above. |
| 2026-08-04 | Security hardening completed. Phase 2 (Document Ingestion) completed and verified. |
| 2026-07-29 | Phase 1 (Login) completed and verified end-to-end. |
| 2026-07-28 | Reverted incorrect custom Express backend; restored clean Supabase-Auth-based frontend for Phase 1. |
| 2026-07-25 | Supabase project `knowledge-chatbot` created; Phase 1 Login code delivered. |
| 2026-07-25 | Initial 6 planning docs created: Project-Requirements.md, Architecture.md, Rules.md, Phases.md, Design.md, Memory.md. |
