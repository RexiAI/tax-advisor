# 00-informal — Spanish tax advisor AI (MVP)

I want to build an AI agent that acts as a Spanish tax advisor for individuals
living in Spain. It should answer everyday IRPF (income tax) questions in
Spanish, explain the rule in plain language, and — unlike a generic chatbot —
show exactly where the answer comes from: the BOE article, a link, and the date
the law was last updated.

The product exists because Spanish tax information is fragmented across BOE,
AEAT, and 17 regional tax authorities, and generic LLMs confidently invent
article numbers, deduction limits, and deadlines. Existing consumer tools such
as TaxDown's Luz explain things well but do not advertise article-level
citations. Professional tools such as Maite.ai and Prudencia.ai are built for
lawyers and sell traceability as their main feature. I want the consumer
version of that: plain language on the surface, verifiable sources underneath.

Background research and the competitive landscape are in
`docs/research/2026-10-spain-tax-ai-landscape.md`. Read that for the source
URLs and the claims each competitor makes. Do not copy competitor content into
our corpus — only use their public positioning to inform product requirements.

## Who it is for

MVP user: a resident individual in Spain with a straightforward IRPF question.
Examples:

- "¿Puedo deducirme el alquiler de mi vivienda habitual?"
- "Soy autónomo, ¿qué gastos puedo deducir?"
- "He vendido acciones, ¿tengo que declararlo?"
- "¿Me sale a pagar o a devolver?"
- "¿Qué deducciones hay en mi comunidad autónoma?"
- "¿Estoy obligado a presentar la renta?"

They are not tax professionals. They may not know the technical term for their
situation. They are on a phone, in a hurry, and they will trust a confident
wrong answer — so the product must be honest when it does not know.

## Product shape (MVP)

A small web app with one chat screen:

1. The user asks a tax question.
2. The agent asks at most one clarifying question when a key fact is missing
   (tax year, region, income type, employment status). It does not interrogate.
3. The agent retrieves the relevant BOE/AEAT passages and answers in Spanish,
   with citations.
4. The answer shows: short explanation, the rule, a worked example only when
   the rule is unambiguous, the citations, and a disclaimer.
5. If the corpus does not support an answer, the agent says so, explains what
   it can and cannot confirm, and offers a handoff to a human advisor.

No filing, no signing, no representation, no tax calculation in v1. The agent
is an explainer with sources, not a preparer. A numeric IRPF estimator is a
possible follow-up spec, not part of this one.

## What "grounded" means

- The knowledge base is built only from official sources: BOE consolidated
  legislation and AEAT practical manual pages. Start with:
  - Ley 35/2006 del IRPF — BOE id `BOE-A-2006-20764`
  - Real Decreto 439/2007, Reglamento del IRPF — BOE id `BOE-A-2007-6820`
  - The AEAT Renta 2025 manual pages needed for the state-scale table and the
    common minimums/deductions.
- The BOE API is documented at
  <https://www.boe.es/datosabiertos/api/api.php>. The list endpoint supports
  JSON/XML; the by-id and text endpoints return XML. Consolidated text is split
  into `bloque` units with `id`, `tipo`, `titulo`, and one or more `version`
  nodes containing HTML. `fecha_actualizacion` drives incremental sync.
- Each stored passage keeps: norm id, block id, block title, article/precept
  label, text, source URL, BOE last-updated timestamp, and fetch timestamp.
- A consolidated BOE text is informative, not the official gazette version.
  The UI must say so and must not imply BOE endorsement.

## Hard requirements

These are the things I will judge the MVP on. Everything else is negotiable.

### R1 — Every substantive answer is cited

Every answer that states a tax rule, limit, deadline, exemption, or deduction
must include at least one citation. A citation is not a bare URL: it names the
norm, the article or block, the link, and the BOE last-updated date. If the
model cannot support the answer from retrieved passages, the product must
return an "insufficient evidence" response instead of an answer. No citation,
no claim.

### R2 — No invented citations

The server must validate citations against the passages actually retrieved for
that turn. A citation to an article that was not retrieved must be removed and
must fail the response, not be shown as if verified. The model may not cite
from memory.

### R3 — Freshness is visible and enforced

The app shows the corpus version date and the tax year covered. If the user asks
about a different year, the answer must say that the corpus covers Renta 2025
and that the rule may have changed for the year asked about. The sync job is
incremental and idempotent: re-running it with no BOE changes must not duplicate
passages or change their ids.

### R4 — Official corpus only

No user-generated content, no competitor content, no law-firm blogs. If a
question is outside IRPF (IVA, ITP, ISD, non-residents, municipal taxes,
Seguridad Social contributions), the agent says it is out of scope for this
version and points to the right official body. It must not improvise.

### R5 — Privacy by default

The app never asks for or accepts DNI/NIE, IBAN, bank credentials, payroll PDFs,
or full names. It warns users not to paste sensitive documents. Conversations
are not persisted in v1; the server keeps only in-memory session state. Logs
must not contain question text, answers, or any user identifier beyond a random
request id. If a user pastes personal data, the UI warns and the server does not
store it.

### R6 — AI disclosure and disclaimer

On first load and in the answer footer: "Esto es información general elaborada
con IA, no asesoramiento fiscal personalizado." The AI disclosure required by
EU AI Act Article 50 is explicit and not hidden behind a tooltip. The product
does not claim to be a registered advisor, gestor, or Colaborador Social.

### R7 — Prompt-injection resistant

Retrieved BOE text and user messages are untrusted data. Instructions inside a
document or a user message cannot change the system policy, reveal the system
prompt, call tools that are not allowed, or bypass citation validation. The
agent has no write, file, shell, or network tools at request time.

### R8 — Spanish-first, accessible, mobile-first

The UI and default answers are in Spanish (Spain). Answers use short paragraphs,
avoid unnecessary jargon, and explain a technical term the first time it is
used. The chat works on a 360px-wide screen, is keyboard navigable, and has
visible focus states and semantic headings. English is out of scope for v1.

### R9 — Bounded and observable

- Maximum user message length: 2,000 characters.
- Per-IP rate limit: 20 requests per 10 minutes, with a clear 429 message.
- LLM timeout: 60 seconds; first streamed token target p95 under 5 seconds on a
  normal connection (provider-dependent, measured, not promised).
- Structured logs: request id, route, latency, token counts, retrieval hit
  count, citation-validation result. Never the question or answer text.
- A `/health` endpoint checks the LLM configuration and the corpus index.

### R10 — Testable without network or paid API

The full test suite runs offline. The LLM adapter is behind an interface and
tests use a fake. Corpus sync tests use a small fixture that mimics the BOE XML
shape; they do not call boe.es. There is at least one end-to-end test of the
chat flow (ask → retrieve → answer with citation) using the fake LLM.

## Scope of the corpus

In scope for v1:

- IRPF for tax year 2025 (Renta 2025, filed in 2026).
- Resident individuals.
- Employment income, self-employment income, savings income, rental income,
  capital gains, common deductions, minimum personal/family, filing obligation.
- State-scale references and the existence of regional scales, but not a full
  regional calculation.
- The AEAT manual pages that explain these topics.

Out of scope for v1:

- Filing, signing, representation, or direct AEAT integration.
- IVA, ITP, ISD, IBI, non-resident income tax, Beckham regime, expatriates.
- Company tax, payroll withholding calculations, autónomo quota calculation.
- Regional deduction databases beyond what is needed to say "this depends on
  your comunidad autónoma".
- User accounts, payments, subscriptions, CRM, advisor marketplace.
- Document upload or OCR.
- Voice.

## Technical constraints

- TypeScript, Node 22+, Next.js App Router (the repo is greenfield; use the
  standards in `.standards/`, especially `docs/ARCHITECTURE.md`,
  `docs/CODING_CONVENTIONS.md`, `docs/TESTING.md`, `docs/SECURITY.md`).
- No external database in v1. The corpus is a build-time artifact loaded into
  an in-process search index. This keeps local dev and Vercel deployment
  simple.
- LLM access goes through an OpenAI-compatible HTTP interface configured by
  environment variables. No provider or model id is hardcoded. If the key is
  missing, the app fails closed with a clear configuration error, not a silent
  fallback to a fake answer.
- The retrieval layer is deterministic and unit-testable. Start with lexical
  retrieval (accent-insensitive, Spanish) over article-level chunks; do not add
  embeddings or a vector database without a measured reason.
- Streaming responses are preferred. The citation contract applies to the
  final answer, not to partial tokens.
- Deployment target: Vercel preview for the frontend lane; no server-side
  persistence that assumes a writable filesystem.

## Deliverables

- Working app with the chat flow and citation rendering.
- Corpus sync script + committed corpus artifact + provenance metadata
  (source URL, BOE update timestamp, fetch timestamp, license note).
- Test suite (unit, integration, one e2e) that runs offline.
- `docs/research/2026-10-spain-tax-ai-landscape.md` (already written; may be
  refined, not replaced by unsourced claims).
- A short `docs/RUNBOOK.md` covering corpus sync, env vars, local run, deploy,
  and what to do when BOE changes break parsing.
- An ADR for the retrieval choice (lexical vs embeddings) and for the
  no-persistence decision.

## Open questions (answer at the human gate)

1. Brand/name for the product? I have been calling it "tax-advisor"; the UI
   needs a human name.
2. Is Spanish-only acceptable for v1, or is English needed for resident
   foreigners on day one?
3. Should v1 include a deterministic IRPF estimator (state scale only, clearly
   labelled), or defer all numbers to a later spec?
4. Human handoff: real booking/contact form, or a placeholder CTA in v1?
5. Should the corpus include the full BOE text of both norms (larger, more
   faithful) or only the articles needed for the MVP topics (smaller, easier
   to review)? I lean full text for both norms, article-level chunks.
6. Do we want a public "sources" page listing every norm, version date, and
   license, or is the per-answer citation footer enough?
7. Any hosting constraint beyond Vercel (e.g., EU-only data residency for
   prompts)? The LLM provider must be chosen accordingly.
