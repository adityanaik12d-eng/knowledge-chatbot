# Project Requirements Document
**Project:** Internal Knowledge Chatbot — Venus Remedies
**Type:** RAG-based internal assistant

---

## 1. What to Build

A retrieval-augmented (RAG) chatbot that lets employees ask natural-language questions and get answers sourced from internal company documents — HR policies, IT guides, company FAQs, and general knowledge-base content.

The bot retrieves relevant document chunks from an internal knowledge base, feeds them to an LLM alongside the user's question, and returns a grounded answer with a reference to the source document (so answers are traceable, not hallucinated).

**Not in scope for v1:**
- Batch/QA data, SOP compliance clauses, regulatory documents (these carry higher accuracy/audit stakes — separate future project, see Idea #1/#2)
- Vendor email handling
- Any write-actions (the bot only answers questions, it does not modify records or send emails)

## 2. Targeted Users

- **Primary:** All employees who currently ping IT/HR for repetitive questions (leave policy, VPN setup, expense process, holiday calendar, etc.)
- **Secondary:** New hires during onboarding, who need fast access to "how do I..." answers without waiting on a person
- **Not targeted (v1):** QA/regulatory staff needing SOP or audit-clause lookups — that requires stricter accuracy guarantees and is a separate future phase

## 3. Core Features (v1)

1. **Chat interface** — simple, single-page chat window; ask a question, get an answer
2. **Source citation** — every answer references which internal document(s) it pulled from
3. **Login/access control** — only logged-in employees can use it (basic auth to start, company SSO later)
4. **Document ingestion pipeline** — admin can upload/update source documents (policies, FAQs, guides) that feed the knowledge base
5. **"I don't know" fallback** — if the bot has no relevant source to answer confidently, it says so instead of guessing
6. **Conversation history** — user can see their own past questions in the current session (not necessarily persisted long-term in v1)

## 4. Success Criteria (how we know v1 worked)

- A new hire can get accurate answers to at least 80% of common onboarding questions without contacting IT/HR
- Every answer shows a source; zero answers presented as fact without a citable source
- Demo-ready: leadership can see a working query → grounded answer → source, live
