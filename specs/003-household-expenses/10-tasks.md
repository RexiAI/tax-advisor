# 10-tasks — Household utilities + IBI mention must not refuse the turn

Stage 1 output (Specifier). Review at the human gate before `/build`.

- Spec: `003-household-expenses`, conformance tier **mvp**.
- Stack: TypeScript, Node 22+, Next.js App Router, npm. Tests: Vitest + React Testing Library.
- Corpus: unchanged (`corpus/corpus.json`, 1,961 passages, tax year 2025). No corpus change, no
  `ALLOWED_NORMS` change, no new dependency, no new model.

## How to read a criterion

Every bullet is checkable by reading the committed code or by running the cited test — not by
judgment. The boundary note is a deterministic server-side field, so its presence and its value are
asserted structurally (string equality), never by reading model prose. The "no invented IBI
citation" half is already enforced by the existing citation validator (`validateCitations`): a
citation must resolve to a retrieved passage, and the corpus contains no IBI passage, so no IBI
citation can exist. Nothing in this spec relaxes that validator.

## Requirement coverage map

| Requirement (restated from 00-informal) | Tasks |
|---|---|
| A deductibility question that merely mentions IBI is not refused (reaches retrieval + model) — signal = stems `deduc`/`desgrav`, accent-insensitive | 1 |
| A question about the IBI itself keeps today's refusal (same reasonCode/label/body, no model call) — incl. third-person `¿cuánto desgrava el IBI?` and excluded-form `descontar` | 1 |
| The deductibility signal is exact: `deduc`/`desgrav` stems only; third-person `deduce`/`desgrava` and `descontar`/`descuento`/`restar` are not signals | 1 |
| The IBI part is never asserted: answered turns carry a deterministic note naming IBI as not covered; no invented citation | 2, 3 |
| `classifyScope` stays pure; `filing_request` still wins; ITP/ISD/non-residents/company tax unchanged; "bienes inmuebles" rental still reaches IRPF | 1 |
| No corpus or `ALLOWED_NORMS` change; no new dependency; no new model | all (out of scope) |

## Task list

| # | Task | Scenarios |
|---|---|---|
| 1 | Refine the `ibi` classifier: a deductibility question is not "about the IBI" | AC-003-01 – AC-003-04, AC-003-12 – AC-003-14 |
| 2 | Deterministic boundary note: constant, response field, derivation | AC-003-05 – AC-003-09 |
| 3 | Render the note (answer block + abstention notice) | AC-003-10 – AC-003-11 |

---

## Task 1 — Refine the `ibi` classifier: a deductibility question is not "about the IBI"

**Scope:** `src/content/scope-topics.ts` (only the `ibi` entry plus two helpers).
`src/service/scope-guard.ts` is unchanged: `classifyScope` keeps iterating the ordered map and stays
a pure function of the normalized message — no model, no network, no I/O added to the classification
path.

**The rule.** Today the `ibi` topic matches any message containing `ibi` or
`impuesto sobre bienes inmuebles`, whatever the question is about. The fix narrows that: the `ibi`
topic matches only when the message is **not** an expense-deductibility question. A deductibility
question that mentions IBI (the verbatim sentence, `¿puedo deducirme el IBI?`, or `¿me puedo
desgravar el IBI?`) is not refused; it reaches retrieval and the model. A question about the IBI
itself (`¿Cuánto es el IBI de mi vivienda?`) has no deductibility token and keeps the refusal.

The exemption keys on two accent-insensitive stems, `deduc` and `desgrav`, matched on the normalized
(lowercased, accent-stripped) text. Third-person present forms (`deduce`, `deduces`, `deducen`,
`desgrava`, `desgravas`, `desgravan`) are excluded: in third person the tax — not the taxpayer — is
the subject, so `¿cuánto desgrava el IBI en mi ayuntamiento?` asks about the IBI's own amount and is
still refused (AC-003-13). `descontar`/`descuento` and `restar` are not signals at all:
`descontar el IVA de una factura` is subtraction, not expense deductibility, and must not exempt an
IBI mention (AC-003-14).

**Acceptance criteria**

- `scope-topics.ts` exports a pure detector `mentionsIbi(normalizedText: string): boolean` equal to
  the current two IBI patterns: `/\bibi\b/` or `/impuesto sobre bienes inmuebles/`.
- The `ibi` topic's `match` is `mentionsIbi(normalizedText) && !isDeductibilityQuestion(normalizedText)`.
  `isDeductibilityQuestion(text)` returns true iff the normalized text matches the stems
  `/\b(?:deduc|desgrav)\w*/` AND does **not** match the third-person forms
  `/\b(?:deduce|deduces|deducen|desgrava|desgravas|desgravan)\b/`. Included forms: `deducir`,
  `deducirme`, `deducirnos`, `deducimos`, `deducción` (normalized `deduccion`), `deducciones`,
  `deducible`, `deducibles`, `deducibilidad`, `desgravar`, `desgravarme`, `desgravarnos`, `desgravo`,
  `desgravamos`, `desgravación` (normalized `desgravacion`), `desgravaciones`, `desgravable`,
  `desgravables`. Excluded: the third-person forms above (the tax, not the taxpayer, is the subject);
  `descontar`/`descuento` (subtraction/discount, e.g. `descontar el IVA de una factura`); `restar`
  (arithmetic). The irregular first-person `deduzco` is not matched by the stem and is out of scope
  (no scenario requires it). `gasto deducible` / `gasto desgravable` need no separate phrase: their
  adjectives are already matched by the stems. The test is accent-insensitive because it runs on the
  accent-stripped, lowercased text.
- The exemption applies to **both** IBI forms: `ibi` and `impuesto sobre bienes inmuebles`.
- `classifyScope` is unchanged in shape and purity; the only edit in this task is the `ibi` entry
  and the two helpers in `scope-topics.ts`. No network/client/fs import is added anywhere in the
  classification path.
- The `ibi` reason code, `label` (`'el IBI'`) and `officialBody` (`COMUNIDAD_AUTONOMA`) are unchanged.

**Scenarios:** AC-003-01 – AC-003-04, AC-003-12 – AC-003-14 → `20-acceptance/AC-003-classification.md`

---

## Task 2 — Deterministic boundary note: constant, response field, derivation

**Scope:** `src/content/strings.ts`, `src/service/types.ts`, `src/service/responses.ts`,
`src/service/answer-question.ts`. Adds a deterministic, user-visible note on answered turns whose
message mentions IBI but was not refused. No corpus, norm, or dependency change; no model
instruction is added (the note is a server-side field, not a prompt).

**Acceptance criteria**

- `strings.ts` exports two constants with exact text:
  - `IBI_BOUNDARY_TITLE = 'Sobre el IBI de tu pregunta'`
  - `IBI_BOUNDARY_NOTE = 'Tu pregunta menciona el IBI. Sus normas propias no están cubiertas por el corpus que este asesor cita, así que no puedo confirmar nada sobre él.'`
- `types.ts` adds the optional field `boundaryNote?: string` to `AnswerResponse` and to
  `InsufficientEvidenceResponse`. No other member of the union changes shape.
- `responses.ts` exports a pure helper `ibiBoundaryNoteFor(message: string): string | undefined`
  returning `IBI_BOUNDARY_NOTE` when `mentionsIbi(normalizeText(message))` and `undefined` otherwise.
  It is invoked only after the guard has passed (the call sites below), so "mentioned but not the
  subject" is guaranteed by call ordering, the same way `yearNoticeFor` is.
- `answerResponse` (in `answer-question.ts`) sets `boundaryNote` from `ibiBoundaryNoteFor(input.message)`.
- `insufficientResponse` carries the note too: every `insufficient_evidence` response produced for a
  message that mentions IBI carries `boundaryNote`, regardless of the reason (`no_results`,
  `below_threshold`, `no_citations`, `unverified_citation`). Threading may add a `boundaryNote`
  argument to `insufficientResponse` or compute it at the call sites; all three call sites
  (`preModel`, `resolveOutcome` fail, `clarificationOrAbstain`) must attach it.
- The note is **not** attached to `clarification`, `guide`, `privacy_warning`, `error`, or
  `out_of_scope` responses.
- The note never appears in the model request: `assembleRequest` is unchanged, and the note string
  is not concatenated into the system or user message.

**Scenarios:** AC-003-05 – AC-003-09 → `20-acceptance/AC-003-boundary-note.md`

---

## Task 3 — Render the note

**Scope:** `src/components/AnswerBlock/AnswerBlock.tsx`,
`src/components/ChatScreen/use-chat-turn.ts`. The note is user-visible in the two places an
answered/abstained turn renders.

**Acceptance criteria**

- `AnswerBlock` renders `response.boundaryNote`, when present, as an info `Notice` with title
  `IBI_BOUNDARY_TITLE` and body the note, placed alongside the existing `yearNotice` notice (before
  the sources block). It must not replace or hide the year notice or the AI disclaimer.
- For `insufficient_evidence`, `abstentionNotice` (in `use-chat-turn.ts`) renders the boundary note
  so it is visible to the user (composed into the `Notice`, e.g. appended to the body); `yearNotice`
  keeps its existing `footer` slot. Both remain visible when both are present.
- The note is plain text: rendering it adds no citation link and no external URL.

**Scenarios:** AC-003-10 – AC-003-11 → `20-acceptance/AC-003-note-rendering.md`

---

## Explicitly out of scope for this spec (non-goals)

- Adding the IBI (or the regional finance law that hosts it, RD Leg. 2/2004, `BOE-A-2004-4214`) to
  `ALLOWED_NORMS` or the corpus. `corpus/` and the norm registry are untouched.
- Answering whether the IBI is deductible, or at what percentage. The note says "not covered";
  nothing reasons about the IBI's rules.
- Changing the wording of the existing out-of-scope refusal beyond what the note needs (the refusal
  template and its constants are untouched).
- Broadening the fix to ITP/ISD mentions in expense questions — same failure class, follow-up spec.
  `¿puedo deducirme el ITP?` still refuses as `itp`; `¿puedo deducirme el ISD?` still refuses as `isd`.
- A new response `kind`, a new dependency, a new model, or a prompt/policy change.

## Resolved at the human gate (2026-10-26)

1. **Deductibility signal breadth — broadened.** The signal now covers both stems `deduc` and
   `desgrav` (`desgravar`, `desgravación`, `desgravable`, `me desgravo`), accent-insensitive, on the
   normalized text. Third-person present forms (`deduce`/`deduces`/`deducen`/`desgrava`/`desgravas`/
   `desgravan`) are excluded — in third person the tax is the subject, so `¿cuánto desgrava el IBI
   en mi ayuntamiento?` stays a question about the IBI itself and is refused. `descontar`/`descuento`
   and `restar` are **not** included: `descontar el IVA de una factura` is subtraction, not expense
   deductibility, and must not become an exemption. `gasto deducible` / `gasto desgravable` need no
   separate signal — their adjectives are already covered by the stems. See AC-003-12 – AC-003-14.
2. **Note scope on clarification turns — accepted as written.** The note attaches to `answer` and
   `insufficient_evidence` only; a `clarification` turn carries no note. No change.
3. **Prompt instruction vs note only — accepted.** The deterministic note plus the existing citation
   validator are the intended enforcement. No system-policy/prompt change is added.
4. **UX flags (from the design read) — accepted, two changes.** (a) `IBI_BOUNDARY_NOTE` ships
   **verbatim** (the word "corpus" stays; not reworded). (b) `AC-003-11` no longer asserts with an
   exact `getByText` on text that shares a paragraph with the explanation; it asserts a substring/
   regex of the notice body instead, with the reason stated in the scenario.

No open question remains.

## Acceptance scenarios

## AC-003-01 — The verbatim sentence is not refused
## AC-003-02 — A question about the IBI itself is still refused
## AC-003-03 — An IBI-deductibility-only question is not refused
## AC-003-04 — The rest of the guard is unchanged
## AC-003-05 — The constant names IBI and cites nothing
## AC-003-06 — An answered turn with an IBI mention carries the note
## AC-003-07 — The note is deterministic and model-independent
## AC-003-08 — IBI-deductibility-only is not refused and claims no corpus support
## AC-003-09 — The note is absent on a plain answer and on a refusal
## AC-003-10 — AnswerBlock renders the note
## AC-003-11 — insufficient_evidence renders the note
## AC-003-12 — The `desgravar` synonym is not refused
## AC-003-13 — A third-person `desgrava` question is still about the IBI and refused
## AC-003-14 — `descontar` is not a deductibility signal and does not exempt an IBI mention
