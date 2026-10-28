# 004-official-source-coverage

> Spec pipeline archive. Original source: `specs/004-official-source-coverage/` (deleted by this script).
> Archived: 2026-10-28

## Original ask

# 00-informal — Official-source coverage for autónomo and business deductions

## Why this spec exists

Spec 003 ("household utilities + IBI") is a guard fix, not coverage: it lets a
deductibility question through and states that the IBI's own rules are not in the
corpus. That is honest, but the user's actual ask was wider:

> "no solo añadas esto, añade deducciones de autónomos, empresas aunque dependan
> del boe de la comunidad autónoma o de donde sea mientras sea fuente oficial"

So: deductions available to autónomos and to companies, including those set by
each autonomous community or by any other administration, **provided the source
is official**. This spec builds the part that makes that possible — the source
model, jurisdiction, declared coverage, and the first regional deductions — for
two communities. Rollout to the rest and the company tax are separate specs
(005, 006) by explicit decision on 2026-10-26.

## What exists today (facts, checked)

- `ALLOWED_NORMS` (`src/domain/allowed-norms.ts`) lists **8 state norms**, all
  with `BOE-A-*` identifiers. `corpus/corpus.json` (schema v1) is 1,961 passages
  from those 8, each with `normId`, `normTitle`, `sourceUrl`, `boeUpdatedAt`,
  `fetchedAt`.
- `scripts/corpus-sync.ts` walks `ALLOWED_NORMS` through **one** fetcher
  (`src/corpus/boe-fetcher.ts`) that talks only to the BOE consolidated-legislation
  API and only recognises BOE identifiers and BOE update dates.
- The scope guard refuses ITP, ISD, IBI, non-residents and company tax
  **wholesale**, because they belong to another administration. There is no notion
  of "which community's rules do we actually hold".
- There is no jurisdiction field anywhere: not on a norm, not on a passage, not on
  a citation, and not in the prompt or the UI.
- BOE's consolidated-legislation collection advertises state **and** regional
  norms ("normas estatales y autonómicas más relevantes … estén o no publicadas en
  el BOE"). That is a lead, not a guarantee: coverage must be verified norm by
  norm, and consolidated regional text is not uniform across communities.
- Every community has its own official bulletin with its own formats; there is no
  single API across the 17. An adapter per source family is unavoidable.

## Desired behaviour

1. **A source registry, not a list of BOE ids.** Every norm carries its official
   publisher (BOE, a community bulletin, another official body), its jurisdiction
   (state / each community / municipal), its official identifier, a stable
   official URL, the date of the consolidated version being used, and the
   publisher's reuse conditions. A norm missing any of these is not admitted.
2. **Declared coverage, enforced.** The product knows and states which
   (jurisdiction, tax) pairs it covers. Coverage is machine-readable in the corpus
   artifact, not prose in a README. A question whose jurisdiction or tax is not
   covered gets the honest refusal/abstention naming the competent body — never a
   state-level answer dressed up as a regional one.
3. **First regional deductions, answerable and cited.** For the two pilot
   communities, a question about the autónomo's regional deductions is answered
   from the regional norm and cites it, showing the publisher, the jurisdiction and
   the consolidated-version date. The answer must never borrow a state citation to
   stand in for a regional rule it does not have.
4. **Citations and UI name the source.** A regional norm is not labelled "BOE".
   Source entry shows publisher + jurisdiction + date + link. The product's
   existing "cite what you retrieved, validate server-side" contract is unchanged;
   only the source metadata gets richer.
5. **Jurisdiction comes from the user, not from a guess — and an unsupported
   community is refused, not re-asked.** When a message names no community at all
   and the answer genuinely depends on one, the product asks (the existing
   clarification reason "comunidad autónoma" exists for exactly this) — once. When
   the message names a community the product does not cover, the turn is refused
   with a coverage statement naming that community's competent body; it does not
   ask "¿en qué comunidad?" again after the user already answered. It never assumes
   Madrid, never assumes the state rule applies regionally, and never silently
   drops the regional part. Everything else — state-level questions, covered
   communities — keeps the default answering path unchanged.
6. **Ingestion stays reproducible and offline-testable.** A source adapter per
   family, incremental by the source's own update date, fixtures committed for
   tests, artifact content hash covering the new provenance fields, and a sync that
   fails closed — an unreadable or undated source is reported, never guessed.
7. **The existing state surface does not regress.** IRPF/IVA/RETA questions keep
   their answers and citations; the six refusals keep working where coverage is
   genuinely absent; spec 003's IBI boundary note stays accurate as coverage
   changes.

## Explicit non-goals

- The remaining communities. Two pilots here; 005 rolls out the rest.
- **Impuesto sobre Sociedades and company-level deductions.** 006. This spec must
  not half-open `company_tax`.
- **Municipal taxes (IBI and friends).** There are 8,000+ municipalities; coverage
  can never be exhaustive. They stay out unless a later spec picks specific
  municipalities and says so. The honest note from 003 remains the answer.
- DGT binding consultations, AEAT manuals and similar official-but-not-normative
  material, unless a later spec declares them with a stable identifier scheme.
- Embeddings, a database, or any request-time network call. Lexical retrieval over
  a committed artifact stays (ADR 0001); if the corpus grows past its stated
  threshold, that is a separate decision.
- Scraping unofficial mirrors, aggregators, or any source without a stable official
  identifier and URL.

## Constraints

- **ADR required** (next number: `docs/adr/0004-*.md`): new data dependency,
  change of provenance model, and a jurisdiction concept. Security/legal note:
  each publisher's reuse terms must be recorded, and the product must not imply the
  publisher endorses it.
- **Schema migration**: `corpus.json` v1 → v2 with jurisdiction/publisher/updated
  fields; the parser must reject an artifact whose declared coverage is missing or
  malformed, and the tests must cover both the old-shape rejection and the new
  shape.
- **Pilot pair (decided 2026-10-26): Comunidad de Madrid + Región de Murcia.**
  Both publish in Castilian — the product cites verbatim in Spanish, so a
  Catalan/Galician/Basque-only text would force a translation and break the
  verbatim-citation contract. Two different publishers (BOCM and BORM), two
  different-sized administrations, so the source model is exercised on more than
  one shape. Viability is verified per norm during the spec: an official
  consolidated text with a stable identifier and update date, or the norm is not
  admitted. If either fails that check, the ordered fallback list is Castilla y
  León (BOCYL), Aragón (BOA), Extremadura (DOE); record which and why. Never
  substitute an unofficial copy.
- Spanish copy, same voice. No new runtime dependency. Tests offline (fixtures).
- The pipeline's normal gates apply; the mutation-testing tier follows the repo's
  existing configuration.

## Decisions taken at the human gate (2026-10-26)

1. **Pilot pair:** Madrid + Región de Murcia (see Constraints). Alternative to the
   first proposal, at the user's request. Viability is a task-level verification,
   not an open question.
2. **Authority for a regional norm: its own publisher.** The community bulletin is
   the source of record; BOE's consolidated text is used only when the publisher
   offers no stable, versioned consolidated text. Every ingested norm records
   `authorityUsed` (which publisher was used) and, when both exist, both URLs and
   both dates. A norm does not switch authority between syncs without an explicit
   migration note. Rationale: competence follows the publisher, and BOE's regional
   collection is explicitly "the most relevant" norms, not an exhaustive one — so
   BOE-first would silently narrow coverage.
3. **Coverage granularity: per (jurisdiction, tax) pair.** Partial coverage must be
   expressible and user-visible (e.g. "Madrid · IRPF deductions: covered; Madrid ·
   ITP: not covered"), because that is the only honest way to ship a roll-out.
4. **An unsupported community is refused, not looped back into a clarification.**
   If the message names a community outside the coverage matrix, the turn ends with
   a refusal that names that community's competent body and says the coverage does
   not extend to it. The "comunidad autónoma" clarification is reserved for a
   message that names no community at all. No second ask after the user has already
   given the community. Everything else keeps the default answering path.

## Tasks

# 10-tasks — Official-source coverage for autónomo and business deductions

Stage-1 formalization of `00-informal.md` (spec 004). Decisions taken at the human
gate (2026-10-26) are fixed: pilot pair **Comunidad de Madrid (BOCM) + Región de
Murcia (BORM)**, **publisher-is-authoritative** (`authorityUsed` records which
publisher supplied the text), coverage granularity **per (jurisdiction, tax)
pair**, and **an unsupported community is refused, not looped back into a
clarification** (a named community outside the coverage matrix ends the turn with
a refusal naming its competent body; the "comunidad autónoma" clarification is
reserved for a message that names no community).

Decisions taken at the human gate (2026-10-28) are fixed: the source link label
names the **real host of the consolidated text** (`authorityUsed`), not the issuing
publisher; `publisher` and `jurisdiction` stay visible in the metadata row. The two
pilots' consolidated text is served by BOE (`authorityUsed: 'boe'`, `publisher:
'bocm'` / `'borm'`), so their link reads "Ver en el BOE" while the row shows
"Comunidad de Madrid" / "Región de Murcia" and records the publisher. This resolves
the `publisher`-vs-`authorityUsed` label risk (was `15-design.md` flagged
uncertainty #2).

Grounding (read, not assumed): schema v1 lives in `src/corpus/artifact.ts`
(`CorpusNorm.normId/normTitle/sourceUrl/boeUpdatedAt/fetchedAt/licenseNote`),
`src/domain/passage.ts` (`Passage.boeUpdatedAt`), and `src/domain/citation.ts`
(`Citation.boeUpdatedAt`). The sync (`src/corpus/sync.ts`) walks `ALLOWED_NORMS`
through one `CorpusFetcher` (`src/corpus/boe-fetcher.ts`) and one BOE XML parser
(`src/corpus/parse-consolidated-xml.ts`). The scope guard
(`src/content/scope-topics.ts` + `src/service/scope-guard.ts`) refuses ITP, ISD,
IBI, non-residents and company tax wholesale, and there is no jurisdiction field
anywhere. The user-facing copy names the BOE in a dozen places
(`src/content/strings.ts`, `src/prompts/system-policy.ts`).

The tasks are ordered so that each one leaves `npm test` green. Task 2 is the one
"big-bang" coordinated migration (rename + new provenance fields + schema bump);
everything after it builds on the v2 shape. Task 1 is docs-only.

---

## Task 1 — ADR: official-source coverage, provenance model and jurisdiction (AC-004-adr.md)

Write `docs/adr/0004-official-source-coverage.md`. The Specifier only defines the
task; the Coder writes the ADR.

Acceptance criteria:

- The file exists at `docs/adr/0004-official-source-coverage.md` with the repository
  ADR sections `## Context`, `## Decision`, `## Alternatives considered`,
  `## Consequences`, and `## Sources`.
- It records the **source-registry data model**: every covered norm carries
  `publisher`, `jurisdiction`, `authorityUsed`, `officialId`, `sourceUrl`,
  `updatedAt`, and `licenseNote`, and a norm missing any of them is not admitted.
- It records the **jurisdiction concept**: `state` plus a closed set of communities
  (the two pilots first), municipal named only as an honest-refusal string, not as
  a jurisdiction value (municipal taxes stay out).
- It records the **publisher-authority rule**: the community bulletin is the source
  of record for a regional norm; BOE's consolidated text is used only when the
  publisher offers no stable, versioned consolidated text; `authorityUsed` records
  which was used; when both exist both URLs and both dates are recorded; a norm
  does not switch authority between syncs without an explicit migration note.
- It records the **license-per-publisher** model: each publisher's reuse terms are
  recorded per norm, and the product does not imply any publisher endorses it.
- It records the **coverage matrix** decision: coverage is declared per
  (jurisdiction, tax) pair, machine-readable in the artifact, with a single lookup
  and no second list that can disagree.
- It records the **pilot pair** and the **ordered fallback** (Castilla y León /
  BOCYL, Aragón / BOA, Extremadura / DOE).
- It records the **incremental-sync-keyed-on-source-date** and **fail-closed**
  decisions, and what **stays out** (specs 005 and 006, municipal taxes, DGT
  consultations / AEAT manuals).
- Its `## Sources` section cites only official hosts (BOCM / BORM bulletin hosts
  and `boe.es`), consistent with the repository convention that no ADR cites a
  competitor or a commercial mirror.

Acceptance scenarios: `AC-004-01`–`AC-004-05` (the ADR records the data model,
the jurisdiction concept, the publisher-authority rule, license-per-publisher,
the coverage matrix, the pilot pair and the fallback order).

---

## Task 2 — Provenance & jurisdiction domain model; corpus schema v2 (AC-004-schema-v2.md)

Introduce the source/provenance model and migrate the artifact, the passages and
the citations to schema v2. This is the one coordinated change that must land in a
single task: renaming a field and adding required provenance are inseparable from
regenerating the committed artifact.

Acceptance criteria:

- A new domain module (e.g. `src/domain/source.ts` or `src/domain/jurisdiction.ts`)
  defines a `Jurisdiction` type (`'state' | 'madrid' | 'murcia'`), a `Publisher`
  type (a closed set including `'boe' | 'bocm' | 'borm'` with a display name, an
  official host, and a license note per publisher), an `AuthorityUsed` type (a
  publisher id), and a `Tax` type covering the axes the guard and the coverage
  matrix need: `'irpf' | 'iva' | 'autonomo' | 'iae' | 'itp' | 'isd' | 'ibi' |
  'non_residents' | 'company_tax'`.
- The norm registry (`src/domain/allowed-norms.ts`) entry grows the provenance
  fields `publisher`, `jurisdiction`, `authorityUsed`, `officialId`, `sourceUrl`,
  `updatedAt` (renamed from `boeUpdatedAt`), `licenseNote`, plus a `tax` tag used
  only to derive the coverage matrix (Task 3) — no second list. The 8 existing
  norms are migrated to `publisher: 'boe'`, `jurisdiction: 'state'`,
  `authorityUsed: 'boe'`, `officialId: <the BOE-A-* id>`, `tax` mapped from their
  current role (IRPF pair → `irpf`; IVA → `iva`; LGSS + afiliación + LGT +
  reglamento gestión → `autonomo`; IAE → `iae`).
- `Passage` (`src/domain/passage.ts`) renames `boeUpdatedAt` → `updatedAt` and adds
  `publisher` and `jurisdiction`. `Citation` (`src/domain/citation.ts`) renames
  `boeUpdatedAt` → `updatedAt` and adds `publisher` and `jurisdiction`.
  `citationOf` carries them. `officialId` and `authorityUsed` stay norm-level only
  (a citation shows publisher + jurisdiction + date + link, not the internal id).
- `CORPUS_SCHEMA_VERSION` becomes `2`. `CorpusNorm` gains `publisher`,
  `jurisdiction`, `authorityUsed`, `officialId` and renames `boeUpdatedAt` →
  `updatedAt`. `CorpusArtifact` gains a `coverage` field (filled by Task 3; the
  parser already validates it here).
- `parseCorpusArtifact` (`src/corpus/artifact.ts`) rejects: a v1 artifact
  (`schemaVersion !== 2`), and a v2 artifact whose coverage is missing/malformed or
  whose norm/passage provenance (`publisher`, `jurisdiction`, `authorityUsed`,
  `officialId`, `updatedAt`) is missing or malformed. Rejection is
  `unparsable`/`empty`, matching the existing error surface.
- The content hash covers the new provenance fields: changing any of `publisher`,
  `jurisdiction`, `authorityUsed`, `officialId`, `sourceUrl`, `updatedAt` or
  `licenseNote` changes `contentHash`; changing `generatedAt` does not. (The hash
  function's domain may widen to norms + coverage + passages; the invariant is what
  the tests assert.)
- The committed `corpus/corpus.json` is migrated to v2 (offline, deterministic:
  the 8 norms' v1 fields map 1:1 onto v2 with `boe`/`state`/`boe`/the BOE id).
  This is a one-time transform committed with the task; the parser permanently
  rejects v1 afterwards.
- The test support surface is updated to v2 in the same task: `test/support/
  factories.ts` (`makePassage`), `test/support/harness.ts` (`FIXTURE_META` and
  `fixtureCorpus`), and the assertions in `AC-001-corpus-sync.test.ts` that pin the
  exact passage key list. No test keeps a v1 key.

Acceptance scenarios: `AC-004-06–AC-004-11` (new shape accepted; v1 shape rejected;
malformed provenance rejected; provenance change flips the hash; the 8 migrated
norms carry `boe`/`state`).

---

## Task 3 — Declared coverage matrix: machine-readable, single lookup (AC-004-coverage-matrix.md)

Make coverage a first-class value in the artifact with exactly one runtime lookup.

Acceptance criteria:

- `CorpusArtifact.coverage` is a canonical list of `{ jurisdiction, tax }` pairs,
  derived by the sync from the registry's `(jurisdiction, tax)` tags — the sync is
  the only producer; nothing else lists coverage.
- A single lookup — `isCovered(coverage, jurisdiction, tax)` — answers "is
  (jurisdiction, tax) covered?". It returns `true` only for a pair present in the
  artifact's `coverage`; an unknown jurisdiction, an unknown tax, or an
  un-declared pair returns `false`.
- The committed artifact declares exactly the pairs the pilot covers:
  `(state, irpf)`, `(state, iva)`, `(state, autonomo)`, `(state, iae)`,
  `(madrid, irpf)`, `(murcia, irpf)`.
- The parser (Task 2) rejects an artifact with a missing or malformed `coverage`
  field, so a coverage change can never ship silently.
- The scope guard (Task 8) reads coverage from the artifact via this lookup; there
  is no hardcoded covered/uncovered list anywhere else.

Acceptance scenarios: `AC-004-12–AC-004-16` (lookup semantics; derivation from the
registry; the six pilot pairs; malformed coverage rejected; no second list).

---

## Task 4 — Source-adapter interface; BOE adapter refactored onto it (AC-004-source-adapter.md)

Turn the single BOE fetcher into one adapter behind a per-publisher-family
interface, so the sync dispatches by publisher.

Acceptance criteria:

- A `SourceAdapter` interface exists (e.g. `src/corpus/source-adapter.ts`) exposing
  per-norm: the source's own last-updated date, the consolidated-text document,
  the official source URL for the norm, and a parse of the document into passages.
  The existing `CorpusFetcher` shape (`getLastUpdated` / `fetchNormXml`) is
  generalized, not thrown away: the adapter owns its update date and its document
  shape.
- The BOE adapter (`src/corpus/boe-fetcher.ts` + `parse-consolidated-xml.ts`)
  implements the interface; `boeSourceUrl` and the BOE parser stay the BOE
  adapter's own shape handling, unchanged in behaviour.
- The sync (`src/corpus/sync.ts`) stops iterating `ALLOWED_NORMS` against one hard
  fetcher and instead dispatches each registry entry to the adapter for its
  `publisher`. The incremental-reuse and idempotency behaviour is unchanged.
- Every existing sync acceptance test (`AC-001-corpus-sync`, `AC-002-corpus-sync`)
  still passes against the adapter-driven sync, updated only for the v2 shape.

Acceptance scenarios: `AC-004-17–AC-004-20` (interface contract; BOE adapter satisfies it;
sync dispatches by publisher; behaviour unchanged).

---

## Task 5 — Regional-bulletin adapter; fail-closed incremental sync (AC-004-regional-adapter.md)

Add at least one regional-bulletin adapter and make the sync fail closed on any
source it cannot read or date.

Acceptance criteria:

- At least one regional adapter (BOCM or BORM) exists, keyed to its publisher,
  reading the bulletin's own document shape from a committed fixture — no network
  in tests. It extracts the source's **own** update date (the bulletin's update
  date, not a BOE date) and the text.
- Incremental sync is keyed on the source's own update date: a regional norm whose
  recorded `updatedAt` matches the source's current date is reused, not re-fetched,
  exactly like the BOE norms today.
- Fail-closed: an adapter that returns an unreadable document or no/undated update
  date fails the whole sync (`fetch_failed` / `parse_failed`), names the norm, and
  writes nothing — an undated source is never guessed and never shipped.
- The regional adapter's parse reports skipped blocks with a reason, mirroring the
  BOE parser, so a regional document can never silently shrink the corpus.

Acceptance scenarios: `AC-004-21–AC-004-25` (regional adapter reads a fixture; reuse on
unchanged date; unreadable source fails closed; undated source fails closed).

---

## Task 6 — Pilot ingestion: Madrid (BOCM) + Región de Murcia (BORM) (AC-004-pilot-ingestion.md)

Ingest the two pilot communities' IRPF autónomo deductions and record the
per-norm verification evidence.

Acceptance criteria:

- The registry gains one Madrid (BOCM) and one Murcia (BORM) entry for the IRPF
  autónomo deductions, each with non-empty `publisher`, `jurisdiction`,
  `authorityUsed`, `officialId`, `sourceUrl`, `updatedAt`, `licenseNote`, and
  `tax: 'irpf'`.
- A per-norm verification record (a comment in the registry, a fixture-metadata
  entry, or a short `docs/` note the task names) states, for each pilot norm, that
  an official consolidated text with a stable identifier and an update date was
  found, and records `authorityUsed` and the reuse conditions. The spec asserts
  the mechanism and the evidence to record — it asserts **no fact** about the
  content of either community's rules.
- If a pilot norm cannot be verified (no stable consolidated text / identifier /
  date from its publisher), the **fallback order** — Castilla y León (BOCYL),
  Aragón (BOA), Extremadura (DOE) — is applied and the choice recorded with the
  reason. Never an unofficial copy.
- Fixtures for the pilot norms are committed under `test/fixtures/`; the sync and
  the suite stay offline. The harness `FIXTURE_META` and `fixtureCorpus` include
  the pilot norms.
- The corpus is re-synced and the committed artifact now declares the pilot pairs
  in `coverage` (Task 3) and carries the regional passages.

Acceptance scenarios: `AC-004-26–AC-004-30` (registry entries complete; verification
evidence recorded; fallback recorded when verification fails; fixtures offline;
coverage reflects the pilots).

---

## Task 7 — Citations & UI: publisher + jurisdiction + date + link; source-agnostic copy (AC-004-citation-ui.md)

A citation and its UI render the official source; the link label names the host
that serves the consolidated text (`authorityUsed`), never a different host; the
publisher and jurisdiction render as metadata; the identity copy stops saying
"del BOE".

Acceptance criteria:

- `SourceEntry` (`src/components/SourceEntry/SourceEntry.tsx`) renders the
  citation's `publisher` and `jurisdiction` alongside the existing article label,
  norm title, link and date. The date shown is `updatedAt`, formatted with the
  existing `formatSpanishDate`.
- The source link label is a function of the citation's `authorityUsed` (the host
  that actually serves the consolidated text), not the issuing `publisher`: a
  citation whose `authorityUsed` is `boe` reads "Ver en el BOE" (including the two
  pilots, whose consolidated text BOE serves while their `publisher` is `bocm` /
  `borm`), `authorityUsed: 'bocm'` reads "Ver en el BOCM", `authorityUsed: 'borm'`
  reads "Ver en el BORM". `publisher` and `jurisdiction` render in the metadata
  row, separate from the link label, and are never used to build the link label.
  The accessible label (`SOURCE_LINK_ARIA_PREFIX`) matches the visible label.
- The following user-facing strings are made source-agnostic (they must not assert
  the source is the BOE): `CONSOLIDATED_TEXT_NOTICE`, `INSUFFICIENT_TITLE`,
  `OUT_OF_SCOPE_EXPLANATION` ("con la norma del BOE citada" → "con la norma
  oficial citada"), `STATUS_SEARCHING`, `INSUFFICIENT_EXPLANATIONS.{no_results,
  below_threshold, no_citations, corpus_unavailable}`, `INSUFFICIENT_BOUNDARY`,
  `YEAR_NOTICE_BODY`, and the identity sentence in `SYSTEM_POLICY`
  (`src/prompts/system-policy.ts`, "del Boletín Oficial del Estado" → the official
  sources).
- `SOURCE_LINK_LABEL` / `SOURCE_LINK_ARIA_PREFIX` move from constants to a
  per-`authorityUsed` function (or equivalent), so there is no single "BOE" label
  and no publisher-derived label that could name a host different from where the
  link goes.

Acceptance scenarios: `AC-004-31–AC-004-35` (publisher + jurisdiction render as metadata; the link label is `authorityUsed`-aware, never mislabelled; the named
strings no longer hardcode "BOE" where the
source must be generic; date is `updatedAt`) plus `AC-004-53` (the label's host
token matches `sourceUrl`'s host for every citation).

---

## Task 8 — Scope guard, region-aware (AC-004-scope-guard.md)

The guard consults coverage for the resolved jurisdiction instead of refusing
wholesale. The refusal-vs-clarification split (decision 4) is: a named community
outside the coverage matrix is **refused** deterministically; only a message that
names **no** community while the answer depends on one is **clarified**.

Acceptance criteria:

- The guard resolves a jurisdiction from the message deterministically
  (accent-stripped): a named pilot community → that community; a named community
  outside the coverage matrix → `uncovered_community`; no community and no
  regional implication → `state`; a regional implication (e.g. "deducciones
  autonómicas", "mi comunidad") with no named community → unknown.
- An out-of-scope tax is refused **only when** `isCovered(jurisdiction, tax)` is
  `false` for the resolved jurisdiction. Because ITP/ISD/IBI/non-residents/company
  tax are not covered for any jurisdiction in this spec, they keep refusing — but
  the decision now comes from the coverage lookup, not a hardcoded list.
- A covered (madrid/murcia, `irpf`) question is **not** refused; it reaches
  retrieval. A (jurisdiction, tax) that is uncovered is refused/abstained honestly
  naming the competent body.
- An unknown jurisdiction (regional implication, no community) routes to the
  existing "comunidad autónoma" clarification — it never guesses Madrid, never
  assumes the state rule applies regionally, and never drops the regional part.
  The clarification fires only for a nameless message; a message that names any
  community is resolved (refused or answered), never clarified.
- A named community outside the coverage matrix is **refused**, not clarified. The
  refusal reuses the `out_of_scope` response shape with a new reason code
  `'uncovered_community'` added to `OutOfScopeReasonCode` — the smallest change to
  the closed union: no new response `kind`, and not `insufficient_evidence` (which
  means "I could not ground it", not "coverage does not extend"). The turn ends
  deterministically from the coverage lookup alone, with no model call: `officialBody`
  names that community's competent body, and the explanation (a new template selected
  by reason code, mirroring `filing_request`) states that coverage does not extend to
  it.
- Spec 003's IBI boundary note is preserved: `classifyScope('¿Cuánto es el IBI de
  mi vivienda?')` still returns `reasonCode: 'ibi'` with
  `officialBody: 'la autoridad tributaria de tu comunidad autónoma'`.
- The guard reads coverage from the artifact (single source of truth); the
  coverage lookup is injected so a test can flip a pair and observe the refusal
  disappear.

Acceptance scenarios: `AC-004-36–AC-004-40` (covered pair reaches retrieval; uncovered
pair refused naming the body; unknown jurisdiction clarifies; IBI note preserved;
the refusal is coverage-driven, not hardcoded) plus `AC-004-50–AC-004-52` (a named
uncovered community is refused — not clarified — naming its competent body; the
refusal is deterministic with no model call; the explanation states coverage does
not extend to the named community).

---

## Task 9 — Jurisdiction-aware answering: never borrow a state citation (AC-004-jurisdiction-answering.md)

When the resolved jurisdiction is a covered community, the evidence and the
citation validation are scoped to that jurisdiction.

Acceptance criteria:

- The turn carries the resolved jurisdiction from Task 8. Task 8 refuses an
  uncovered community before this task runs, so the jurisdiction reaching Task 9
  is always `state`, `madrid`, or `murcia` — an uncovered community is never
  answered from the state corpus. When it is `state`, all state passages are
  eligible (behaviour unchanged).
- When it is a specific community (madrid/murcia), only passages whose
  `jurisdiction` matches are eligible: a citation to a passage of another
  jurisdiction fails validation (the turn abstains with `insufficient_evidence` /
  `unverified_citation`), so a state passage is never cited to stand in for a
  regional rule the corpus does not hold.
- If the resolved community's norm has no matching passages, the turn abstains
  (`insufficient_evidence`) rather than answering from the state corpus.

Acceptance scenarios: `AC-004-41–AC-004-44` (regional question cites regional passages;
state citation for a regional question fails; no regional passages → abstain;
state jurisdiction unaffected).

---

## Task 10 — State-surface non-regression (AC-004-non-regression.md)

Pin that the existing surface keeps working and the honest refusals stay honest
where coverage is genuinely absent.

Acceptance criteria:

- The 8 state norms still load, retrieve, and answer with a citation (IRPF, IVA,
  RETA/autónomo, IAE) — the existing `AC-001`/`AC-002` answer paths stay green
  after the schema rename.
- ITP, ISD, IBI, non-residents and company tax still classify to their existing
  `reasonCode` + `officialBody` (`AC-002-scope-guard.test.ts`), because coverage
  is genuinely absent for those (jurisdiction, tax) pairs.
- The IBI note text is byte-identical to spec 003's.
- `AC-001-corpus-sync` "official hosts only" is updated to admit the pilot
  bulletin hosts (`www.boe.es` plus the BOCM/BORM official hosts) and still
  rejects any unofficial mirror; the fixture corpus (now including the pilots)
  still has more than 396 passages and no duplicate ids.

Acceptance scenarios: `AC-004-45–AC-004-49` (state answers preserved; refusals preserved;
IBI note preserved; official hosts only; corpus intact).

---

## Open questions / risks

Flagged for a human, not silently decided:

1. **Regional bulletin formats (feasibility).** BOCM and BORM have their own
   document shapes (HTML/PDF, no common API across the 17 communities — stated in
   `00-informal.md`). Task 5's adapter must be written against the *actual*
   BOCM/BORM shape, which cannot be pinned here without a live check. If a
   stable, machine-readable consolidated text with an update date does not exist
   for a pilot norm, Task 6's fallback order applies and the reason must be
   recorded — the spec's mechanism works either way, but the *adapter's* parse is
   the genuine unknown.
2. **Whether a stable consolidated text exists for the pilot norms.** This is a
   Task 6 verification, not a spec-time fact. The spec must not assert any
   community's deduction content; it asserts the evidence to record.
3. **Licence terms per publisher.** Each publisher's reuse terms must be recorded;
   whether BOCM/BORM publish under an open licence equivalent to the BOE's is not
   verifiable here. The license note is recorded verbatim from the publisher; the
   spec must not invent a licence.
4. **Multi-turn jurisdiction carryover — resolved by decision 4.** The loop is
   gone by rule, not by memory: the guard refuses a named community and clarifies
   only a nameless message, so there is no "re-ask after the user answered" path.
   A turn sees only its own message (ADR 0002, no persistence), so the rule is
   per-turn: "only clarify when the message names no community". A follow-up that
   names a community is resolved (refused or answered); a follow-up that again
   names none re-asks, which is the no-persistence boundary, not a new defect.
5. **`tax` tag taxonomy.** The informal field list (publisher, jurisdiction,
   authorityUsed, officialId, sourceUrl, updatedAt, licenseNote) does not include
   `tax`, but the (jurisdiction, tax) coverage matrix requires each norm to declare
   its tax. Tasks 2–3 introduce a `tax` tag on the registry entry and derive
   coverage from it (no second list). The exact tax labels
   (`irpf`/`iva`/`autonomo`/`iae` plus the out-of-scope labels) are a taxonomy the
   Coder finalizes; the acceptance criteria pin the *resulting* six covered pairs,
   not the spelling.
6. **Coverage semantics of "IRPF deductions".** The pilot covers the communities'
   IRPF *deductions* for autónomos, not the whole IRPF. The matrix represents this
   as `(madrid, irpf)` / `(murcia, irpf)`. If finer granularity (deductions vs the
   whole tax) is ever needed, that is a later spec, not this one.
7. **Community-name recognition and canonical competent-body phrasing.** Decision 4
   requires the guard to deterministically detect "a community outside the coverage
   matrix" and to name that community's competent body — but the matrix only knows
   Madrid and Murcia. The guard therefore needs a closed, deterministic recognizer
   for community names (the Spanish autonomous communities and their common aliases,
   accent-stripped) used **only** to refuse and to produce a determiner-led
   `officialBody` ("la Comunidad Autónoma de Galicia") — never to ingest a norm or
   declare coverage. The exact alias set and the canonical determiner-led form per
   community are a taxonomy the Coder finalizes (like risk 5's `tax` labels); an
   unrecognized community name falls through to the nameless clarification path,
   which is a lesser failure than a loop but a real coverage hole to confirm. This
   recognizer is a refusal aid, not the 005 rollout — 005 owns the full community
   data.
8. **Design addendum required (human gate).** The unsupported-community refusal adds
   user-visible copy `15-design.md` does not cover: a new `UNCOVERED_COMMUNITY_EXPLANATION`
   template and the `uncovered_community` reason code, plus a canonical determiner-led
   `officialBody` form for a named community. `15-design.md`'s Task 8 section covers
   only the *existing* refusal copy (the `OUT_OF_SCOPE_EXPLANATION` BOE→"norma oficial"
   edit), and its flagged uncertainty #5 is now resolved by decision 4 in the "refuse"
   direction. The refusal wording and the reason-code addition are a design addendum
   the human gate must approve; this spec does not edit `15-design.md`.
9. **Link label vs host — resolved by the 2026-10-28 decision.** The label names
   `authorityUsed` (the host serving the consolidated text), not the publisher, so
   a `bocm`/`borm` publisher whose text `boe` serves reads "Ver en el BOE" and the
   publisher stays recorded in the metadata row. Host coherence is a test
   (`AC-004-53`, `HOST_BY_AUTHORITY`), not a runtime branch. This closes the
   `publisher`-vs-`authorityUsed` mislabel risk (`15-design.md` flagged uncertainty
   #2). Not open.

## Acceptance scenarios

## AC-004-01 — The ADR exists with the repository structure
## AC-004-02 — It records the source-registry data model and the jurisdiction concept
## AC-004-03 — It records the publisher-authority rule and the license-per-publisher model
## AC-004-04 — It records the coverage matrix, the pilot pair and the fallback order
## AC-004-05 — Its sources cite only official hosts
## AC-004-06 — A v2 artifact with full provenance is accepted
## AC-004-07 — A v1 artifact is rejected
## AC-004-08 — A v2 artifact with missing or malformed provenance is rejected
## AC-004-09 — Provenance is part of the content hash
## AC-004-10 — The 8 existing norms migrate to `boe` / `state`
## AC-004-11 — The citation and passage projection carry publisher and jurisdiction
## AC-004-12 — The lookup answers true for a declared pair
## AC-004-13 — The lookup answers false for an undeclared pair, unknown jurisdiction, or unknown tax
## AC-004-14 — The committed coverage declares exactly the six pilot pairs
## AC-004-15 — Coverage is derived from the registry, not a second list
## AC-004-16 — A missing or malformed coverage field is rejected at parse time
## AC-004-17 — The adapter interface exposes the source's own update date and document
## AC-004-18 — The BOE adapter satisfies the interface with unchanged behaviour
## AC-004-19 — The sync dispatches each norm to its publisher's adapter
## AC-004-20 — The adapter-driven sync keeps incremental and idempotent behaviour
## AC-004-21 — A regional adapter reads its bulletin fixture offline
## AC-004-22 — Incremental sync is keyed on the source's own update date
## AC-004-23 — An unreadable regional source fails closed
## AC-004-24 — An undated regional source fails closed, never guessed
## AC-004-25 — A regional document that parses to zero passages fails instead of shrinking the corpus
## AC-004-26 — The pilot norms enter the registry with complete provenance
## AC-004-27 — Per-norm verification evidence is recorded
## AC-004-28 — The fallback order is applied and recorded when a pilot norm cannot be verified
## AC-004-29 — The pilot fixtures are committed and offline
## AC-004-30 — The committed artifact reflects the pilots
## AC-004-31 — A source entry renders publisher and jurisdiction
## AC-004-32 — The link label names the text's real host, not the issuing publisher
## AC-004-33 — The link label follows authorityUsed and never contradicts sourceUrl
## AC-004-34 — The named identity and refusal copy no longer hardcodes "del BOE"
## AC-004-35 — A regional citation shows the consolidated-version date, not a BOE date
## AC-004-36 — A covered (jurisdiction, tax) question reaches retrieval
## AC-004-37 — An uncovered (jurisdiction, tax) is refused naming the competent body
## AC-004-38 — An unknown jurisdiction asks the existing clarification, never guesses
## AC-004-39 — The IBI boundary note from spec 003 is preserved
## AC-004-40 — The refusal is coverage-driven, not a hardcoded list
## AC-004-41 — A regional question cites only that jurisdiction's passages
## AC-004-42 — A state citation for a regional question fails validation
## AC-004-43 — No matching regional passage means abstention, not a state answer
## AC-004-44 — State jurisdiction is unchanged
## AC-004-45 — The 8 state norms still answer with a citation
## AC-004-46 — The five refusals keep their reason codes and bodies
## AC-004-47 — The IBI note text is unchanged
## AC-004-48 — Every source URL still points at an official host
## AC-004-49 — The corpus remains intact and de-duplicated
## AC-004-50 — A named community outside the coverage matrix is refused, not clarified
## AC-004-51 — The uncovered-community refusal is deterministic, no model call
## AC-004-52 — The refusal states that coverage does not extend to the named community
## AC-004-53 — The link label's host token matches the sourceUrl host for every citation

## Verification

# 25-verification — spec 004 (official-source-coverage)

attempt 1, phase 1

Independent re-check of the Coder and Refactorer claims, run on branch
`spec/004-official-source-coverage` (stacked on `spec/003-household-expenses`).
Nothing was fixed; nothing outside this file was edited. Working tree carries
the spec's own uncommitted stage-2/3 output, which is the normal pre-stage-5b
state.

## Evidence: scenario traceability

command: .standards/scripts/check-scenario-traceability.sh --json
exit: 0
at: 2026-10-28T16:39:35Z

{
  "checks": [1, 2],
  "passes": ["AC-004-01 — traced to a test", "AC-004-02 — traced to a test", "AC-004-03 — traced to a test", "AC-004-04 — traced to a test", "AC-004-05 — traced to a test", "AC-004-06 — traced to a test", "AC-004-07 — traced to a test", "AC-004-08 — traced to a test", "AC-004-09 — traced to a test", "AC-004-10 — traced to a test", "AC-004-11 — traced to a test", "AC-004-12 — traced to a test", "AC-004-13 — traced to a test", "AC-004-14 — traced to a test", "AC-004-15 — traced to a test", "AC-004-16 — traced to a test", "AC-004-17 — traced to a test", "AC-004-18 — traced to a test", "AC-004-19 — traced to a test", "AC-004-20 — traced to a test", "AC-004-21 — traced to a test", "AC-004-22 — traced to a test", "AC-004-23 — traced to a test", "AC-004-24 — traced to a test", "AC-004-25 — traced to a test", "AC-004-26 — traced to a test", "AC-004-27 — traced to a test", "AC-004-28 — traced to a test", "AC-004-29 — traced to a test", "AC-004-30 — traced to a test", "AC-004-31 — traced to a test", "AC-004-32 — traced to a test", "AC-004-33 — traced to a test", "AC-004-34 — traced to a test", "AC-004-35 — traced to a test", "AC-004-36 — traced to a test", "AC-004-37 — traced to a test", "AC-004-38 — traced to a test", "AC-004-39 — traced to a test", "AC-004-40 — traced to a test", "AC-004-41 — traced to a test", "AC-004-42 — traced to a test", "AC-004-43 — traced to a test", "AC-004-44 — traced to a test", "AC-004-45 — traced to a test", "AC-004-46 — traced to a test", "AC-004-47 — traced to a test", "AC-004-48 — traced to a test", "AC-004-49 — traced to a test", "AC-004-50 — traced to a test", "AC-004-51 — traced to a test", "AC-004-52 — traced to a test", "AC-004-53 — traced to a test"],
  "fails": []
}

## Evidence: full test suite

command: npm test
exit: 0
at: 2026-10-28T16:39:39Z

> renta-clara@0.1.0 test
> vitest run

 RUN  v3.2.7 /home/dbueno/projects/tax-advisor

 ✓ test/acceptance/AC-004-scope-guard.test.ts (12 tests)
 ✓ test/acceptance/AC-004-citation-ui.test.ts (11 tests)
 ✓ test/acceptance/AC-004-coverage-matrix.test.ts (6 tests)
 ✓ test/acceptance/AC-004-schema-v2.test.ts (9 tests)
 ✓ test/acceptance/AC-004-source-adapter.test.ts (4 tests)
 ✓ test/acceptance/AC-004-regional-adapter.test.ts (8 tests)
 ✓ test/acceptance/AC-004-pilot-ingestion.test.ts (6 tests)
 ✓ test/acceptance/AC-004-jurisdiction-answering.test.ts (4 tests)
 ✓ test/acceptance/AC-004-non-regression.test.ts (5 tests)
 ✓ test/acceptance/AC-004-adr.test.ts (7 tests)
 ✓ test/unit/provenance.test.ts (7 tests)
 ... (full run of all 63 files green)

 Test Files  63 passed (63)
      Tests  571 passed (571)
   Start at  17:39:40
   Duration  20.86s

## Evidence: complexity gate

command: npm run lint
exit: 0
at: 2026-10-28T16:40:05Z

> renta-clara@0.1.0 lint
> eslint .

(no output — ESLint clean; the `complexity` ≤6 rule is enforced by this run.
The type check `npx tsc --noEmit` also exited 0 in the same pass — see the
type-check evidence block below.)

## Evidence: type check (tsc)

command: npx tsc --noEmit
exit: 0
at: 2026-10-28T16:40:05Z

(no output — type check clean)

## Evidence: design-principles gate

command: .standards/scripts/check-code-principles.sh . --tier mvp -BaseRef main --json
exit: 0
at: 2026-10-28T16:40:14Z

{
  "tier": "mvp",
  "gates": ["complexity", "dry", "yagni", "solid", "component-per-file", "property-tests"],
  "fails": [],
  "warns": [{ "message": "YAGNI: interface CorpusFetcher has exactly one implementation (premature abstraction) — ./src/corpus/fetcher.ts:17", "file": "./src/corpus/fetcher.ts", "line": "17" }]
}

The script exited 0 on the first attempt with clean JSON on stdout — no SIGPIPE
(exit 141) flake was observed, so no retry was required. The single WARN is the
pre-existing `YAGNI: CorpusFetcher single implementation` reported by the
Refactorer; it is a review hint, not a FAIL, and does not block.

## Evidence: production build

command: npm run build
exit: 0
at: 2026-10-28T16:40:31Z

> renta-clara@0.1.0 build
> next build

   ▲ Next.js 15.5.28
 ✓ Compiled successfully in 8.4s
 ✓ Generating static pages (7/7)
Route (app)  /  /_not-found  /api/auth/login  /api/auth/logout  /api/chat  /health  /login

(compiled and typed clean; `next build` runs its own lint + type validation)

## Evidence: scenario-to-behavior spot check

command: manual spot check of two acceptance scenarios against their tests
exit: 0
at: 2026-10-28T16:41:10Z

Checked two scenarios (and their tests) by reading the markdown and the test
source, confirming the assertions match the Given/When/Then — not just that the
ID exists.

1. AC-004-citation-ui.md — AC-004-53 (label/host coherence):
   Scenario requires "the link label's host token matches the sourceUrl host for
   every citation" and "boe.es → BOE, bocm.es → BOCM, borm.es → BORM".
   test/acceptance/AC-004-citation-ui.test.ts `AC-004-53` builds the citation
   set from the committed corpus + fixtures + 4 constants, asserts
   `new URL(citation.sourceUrl).hostname` equals `HOST_BY_AUTHORITY[authorityUsed]`
   for each, and asserts `hostToken(sourceLinkLabel(authorityUsed))` equals the
   host's token uppercased; the second test pins BOE/BOCM/BORM specifically.
   Assertions match the scenario exactly. Also confirmed AC-004-32/-33 (link
   label names the real host, not the issuing publisher; metadata row keeps the
   publisher/jurisdiction).

2. AC-004-scope-guard.md — AC-004-50 (uncovered-community refusal):
   Scenario requires a named community outside the matrix be refused with
   `kind: out_of_scope`, `reasonCode: uncovered_community`, an `officialBody`
   naming that community's competent body (not the generic placeholder), and no
   clarification.
   test/acceptance/AC-004-scope-guard.test.ts `AC-004-50` asserts exactly those:
   `response.kind === 'out_of_scope'`, `reasonCode === 'uncovered_community'`,
   `officialBody === 'la autoridad tributaria de Galicia'`, no 'tu comunidad
   autónoma' placeholder, and `adapter.callCount === 0`. AC-004-51 additionally
   pins determinism (first === second) and no model call. Assertions match.

No scenario was found asserting the wrong thing; both are true positives.

## No unaccounted behavior (skim, not a runnable check)

Skimmed the full diff (schema v2 migration, source-adapter interface + BOE/BOCM
adapters, coverage matrix + isCovered lookup, region-aware scope guard, the
community recognizer, citation UI, regenerated `corpus/corpus.json`, and ADR
0004). Every new module traces to a task/scenario:

- `src/domain/source.ts` → Task 2 (Jurisdiction/Publisher/AuthorityUsed/Tax types).
- `src/domain/coverage.ts` → Task 3 (`CoveragePair`, `isCovered`, `coverageOf`).
- `src/domain/pilot-ingestion.ts` → Task 6 (ordered pilot fallback).
- `src/content/communities.ts` → Task 8 risk 7 (community recognizer, refusal-only).
- `src/domain/allowed-norms.ts` → Task 2 provenance + Task 6 pilot entries + evidence.
- `src/corpus/source-adapter.ts` / `boe-adapter.ts` / `bocm-adapter.ts` → Tasks 4–5.
- `src/service/scope-guard.ts` → Task 8 (`isCovered` with `REGISTRY_COVERAGE` default, injected for tests).
- `docs/adr/0004-official-source-coverage.md` → Task 1.

No logic found that traces to no task or scenario.

Committed-artifact provenance/coverage check (no second list):

- `corpus/corpus.json` is `schemaVersion: 2`; `boeUpdatedAt` is gone from
  production source and the artifact (only the migration tests still cite it).
- `coverage` in the artifact is exactly the six pilot pairs:
  `(state,irpf) (state,iva) (state,autonomo) (state,iae) (madrid,irpf) (murcia,irpf)`
  — matching `REGISTRY_COVERAGE = coverageOf(ALLOWED_NORMS)` (the sync's only
  producer, `src/corpus/sync.ts:202`). No second list.
- The 10 artifact norms' `publisher`/`jurisdiction`/`authorityUsed`/`officialId`
  match the registry exactly (8× boe/state/boe, plus bocm/madrid/boe and
  borm/murcia/boe for the pilots).

## Verdict

Verdict: PASS

All five contract checks ran and produced no findings: traceability (53
scenarios, 0 fails), full test suite (63 files / 571 tests), complexity/type
gates (ESLint + tsc clean), design-principles gate (0 FAIL, 1 pre-existing WARN),
and the scenario-to-behavior spot check (both scenarios' assertions match their
Given/When/Then). No unaccounted behavior; the committed artifact's coverage and
provenance match the registry with no second list.

WARN (recorded, not blocking): `YAGNI: interface CorpusFetcher has exactly one
implementation (premature abstraction) — ./src/corpus/fetcher.ts:17`.

## Quality gates

# 30-report — spec 004 (official-source-coverage)

Stage 5a (Mutation Runner). Branch `spec/004-official-source-coverage`.
No source, test, or `25-verification.md` file was modified by this stage; nothing
was committed and nothing was pushed.

Precondition satisfied: `25-verification.md` exists and carries `Verdict: PASS`
(attempt 1, phase 1). Read before any work here. `00-informal.md` was not read.

## Summary rows

| Row | Value |
|---|---|
| Verifier verdict (carried forward) | **PASS** — attempt 1, phase 1 |
| Conformance tier | **`mvp`** |
| Mutation score | **skipped — `mvp` tier** |
| Equivalent mutants | **none — mutation testing not run at `mvp` tier** |
| Complexity (carried from Refactorer) | ESLint `complexity` ≤6 clean; design gate 0 FAIL, 1 WARN; 8 duplication sites removed across 6 clusters |
| Final test status | **PASS** — 63 files / 571 tests, exit 0 |
| Remediation record | **none** — no BLOCK in phase 1; phase 2 not yet run |

## Verifier verdict carried forward

`25-verification.md` — attempt 1, phase 1 — `Verdict: PASS`. All five contract
checks ran and produced no findings. Gate exit codes transcribed from that file
(not re-derived, not paraphrased):

| # | Check | Command | Exit | At (UTC) |
|---|---|---|---|---|
| 1 | Scenario traceability | `.standards/scripts/check-scenario-traceability.sh --json` | `0` | 2026-10-28T16:39:35Z |
| 2 | Full test suite | `npm test` | `0` | 2026-10-28T16:39:39Z |
| 3 | Complexity gate | `npm run lint` | `0` | 2026-10-28T16:40:05Z |
| 4 | Design-principles gate | `.standards/scripts/check-code-principles.sh . --tier mvp -BaseRef main --json` | `0` | 2026-10-28T16:40:14Z |
| 5 | Scenario-to-behavior spot check | manual spot check of two scenarios against their tests | `0` | 2026-10-28T16:41:10Z |

Supporting evidence the Verifier also recorded: `npx tsc --noEmit` exit `0`
(2026-10-28T16:40:05Z) and `npm run build` exit `0` (2026-10-28T16:40:31Z).

Traceability detail: 53 scenarios (`AC-004-01`–`AC-004-53`) traced, `fails: []`.

## Mutation score — skipped

Per `docs/SPEC_PIPELINE.md §Conformance tiers`, mutation testing is a
`production`-tier gate ("Architect — mutation testing: `mvp` skip"). This spec
runs at `mvp`, so the mutation gate does not apply and no mutant population was
generated, scored, or killed.

Tier determination (recorded rather than assumed): `10-tasks.md` and
`15-design.md` carry no literal tier declaration, and the repo has no
tier-config file. The Verifier independently invoked the design-principles gate
with `--tier mvp` (exit 0), and `docs/SPEC_PIPELINE.md §Stop-and-Ask decision
matrix` pins the harness default to `mvp` when the tier is not explicitly
declared. Both signals agree: `mvp`.

No mutation tooling is wired into this project regardless of tier —
`package.json` has no Stryker dependency or script, no `stryker.conf.*` exists,
and `node_modules/.bin/stryker` is absent. Stryker was therefore not installed
and not run. (Installing it would be a new dependency and a new CI surface for a
gate this tier does not carry.)

### Evidence: mutation score

command: grep -q '"stryker' package.json || echo "stryker not configured in package.json"; ls node_modules/.bin/stryker 2>/dev/null || echo "binary: absent"; ls stryker.conf.* 2>/dev/null || echo "no stryker config file"
exit: 0
at: 2026-10-28T16:45:06Z

stryker not configured in package.json
binary: absent
no stryker config file

Mutation score: not applicable — `mvp` tier (mutation testing skipped by
`docs/SPEC_PIPELINE.md §Conformance tiers`), and no mutation runner is configured
in the project.

## Equivalent mutants

**None — mutation testing was not run at `mvp` tier.** Zero surviving mutants
exist because zero mutants were generated. This is a recorded skip, not a claim
that the suite is mutation-clean; the mutation gate remains unexercised for this
spec and would be the first thing a `production`-tier promotion would owe.

## Complexity summary (carried from the Refactorer)

Carried forward from the Refactorer's stage-3 output as relayed by the
orchestrator. The two rows that the Verifier independently re-ran are marked as
such; the duplication counts are the Refactorer's own measurement and were not
independently re-derived here.

| Measure | Result | Source |
|---|---|---|
| Cyclomatic complexity ≤6 | Clean — `npm run lint` (ESLint `complexity` rule) exit 0, no findings | Re-run by the Verifier (`25-verification.md`, 2026-10-28T16:40:05Z) |
| Design-principles gate | 0 FAIL, 1 WARN | Re-run by the Verifier (`25-verification.md`, 2026-10-28T16:40:14Z) |
| Duplication | 8 duplication sites removed across 6 clusters | Refactorer measurement, carried forward |
| Property tests | n/a — skipped at `mvp` tier | `docs/SPEC_PIPELINE.md §Conformance tiers` |

The single WARN is pre-existing and non-blocking, kept verbatim:

```
YAGNI: interface CorpusFetcher has exactly one implementation (premature abstraction) — ./src/corpus/fetcher.ts:17
```

Per the decision matrix a design-gate WARN is recorded and flagged, not treated
as a stop. It is the Refactorer's carried WARN, not a regression introduced by
this spec's work.

## Final test status (full suite, re-run after the mutation-kill pass)

Re-run in this stage because the Verifier's green was recorded before stage 5a.
(At `mvp` tier no mutation-killing tests were added, so the suite is unchanged
from the Verifier's run — re-confirmed all the same rather than assumed.)

### Evidence: final test status

command: npm test
exit: 0
at: 2026-10-28T16:44:09Z

> renta-clara@0.1.0 test
> vitest run

All 10 `AC-004` acceptance files green (72 tests):

```
 ✓ test/acceptance/AC-004-non-regression.test.ts (5 tests) 2689ms
 ✓ test/acceptance/AC-004-regional-adapter.test.ts (8 tests) 1628ms
 ✓ test/acceptance/AC-004-citation-ui.test.ts (11 tests) 4578ms
 ✓ test/acceptance/AC-004-scope-guard.test.ts (12 tests) 3505ms
 ✓ test/acceptance/AC-004-jurisdiction-answering.test.ts (4 tests) 2050ms
 ✓ test/acceptance/AC-004-coverage-matrix.test.ts (6 tests) 2633ms
 ✓ test/acceptance/AC-004-pilot-ingestion.test.ts (6 tests) 1514ms
 ✓ test/acceptance/AC-004-schema-v2.test.ts (9 tests) 1170ms
 ✓ test/acceptance/AC-004-source-adapter.test.ts (4 tests) 1819ms
 ✓ test/acceptance/AC-004-adr.test.ts (7 tests) 102ms
```

Full-run totals, verbatim from the tail:

```
 Test Files  63 passed (63)
      Tests  571 passed (571)
   Start at  17:44:11
   Duration  33.11s (transform 8.72s, setup 3.29s, collect 143.25s, tests 112.83s, environment 11.59s, prepare 21.89s)
```

Breakdown: 43 acceptance files + 20 unit files = 63; 0 failures, 0 skips. Run
started 2026-10-28T16:44:09Z and completed 2026-10-28T16:44:44Z (UTC). The
counts match the Verifier's independent run exactly (63 / 571), so the suite is
stable across two runs.

## Remediation record

**none** — no BLOCK occurred during this run.

- **Phase 1 (pre-PR loop):** no BLOCK. The Verifier's `25-verification.md` is
  attempt 1 and records every gate passing on its first execution — no failing
  gate, so no fix-and-re-verify attempt was consumed. Budget used: 0 of 3.
- **Phase 2 (post-PR CI loop):** not yet started — it begins after stage 5b opens
  the draft PR. Budget used: 0 of 3.

`25-verification.md` carries no attempt/failure entries to carry forward beyond
the "attempt 1, phase 1" header, and no orchestrator loop summary reported a
BLOCK. Nothing is invented here to fill that gap.

One human-gate decision was implemented **before** verification and is not
remediation: the 2026-10-28 decision that the source-link label names the real
host of the consolidated text (`authorityUsed`), not the issuing `publisher`
(`10-tasks.md`, decisions at the human gate; risk 9 marked "Not open"). It landed
in Task 7 (label is `authorityUsed`-aware; publisher/jurisdiction render in the
metadata row) and is pinned by `AC-004-32`, `AC-004-33` and `AC-004-53`, all
green. Because it preceded the Verifier's run it appears in no attempt counter —
it is a gate input, not a gate failure.

## Working-tree condition (noted, not a stop)

The working tree is dirty with 69 entries (46 modified, 23 untracked — the new
`src/domain/source.ts`, `src/domain/coverage.ts`, `src/domain/pilot-ingestion.ts`,
`src/content/communities.ts`, the four `src/corpus/*adapter*` files,
`docs/adr/0004-official-source-coverage.md`, the ten `AC-004-*` test files,
`test/unit/provenance.test.ts`, the BOCM/BOE fixtures, and `specs/004-*/`).

This is the spec's own uncommitted stage-2/3 output — the normal pre-stage-5b
state, exactly as the Verifier recorded it in `25-verification.md`. It is the
deliverable that stage 5b commits, not an unaccounted change, so the
dirty-tree STOP condition does not apply. Nothing was stashed, committed, or
reverted by this stage.

## Gates not run by this stage

| Gate | Status |
|---|---|
| Mutation testing (PiTest/Gremlins/Stryker) | skipped — `mvp` tier, and no runner configured |
| Property tests | skipped — `mvp` tier |
| Everything else (traceability, tests, complexity, design principles, spot check) | re-run by the Verifier; exit codes transcribed above |

## Handoff

Stage 5a is green for an `mvp`-tier spec: Verifier PASS carried forward, mutation
gate recorded as skipped with the tier justification, full suite re-confirmed
green (63 files / 571 tests, exit 0), no equivalent mutants to name, no
remediation consumed. Stage 5b (PR Opener) is cleared to read this file, commit
one conventional commit per task from `10-tasks.md`, push `spec/004-official-source-coverage`,
and open the draft PR.

## 15-design.md

# Design Spec: 004-official-source-coverage

Mixed surface. Three tasks change what the screen renders: **Task 7** (citation entry, publisher-aware
copy), **Task 8** (region-aware guard: refusal copy and the clarification path), **Task 9** (a
regional answer's citations, and the abstention when the regional corpus is silent). Tasks 1 to 6 and
10 are backend, data or verification and are listed under Out-of-scope tasks.

This is not a redesign and it opens no new surface. The whole visual delta is: **one more metadata
token inside the existing citation row**, **a publisher-aware link label in place of a constant**, and
**rewrites of strings that already render in existing slots**. No page, no panel, no badge, no
selector, no new component, no new token, no new icon, no new dependency.

## Design Read

Reading this as: a provenance and honesty upgrade inside an existing single-screen consumer tax
explainer for Spanish residents and autónomos, keeping v1 to v3's calm documentary language (paper
and ink, one archive-green accent, mono citation metadata, qualifier notices in the same inset
family), leaning toward reusing `SourceEntry`'s existing metadata row and the existing `Notice`
family rather than designing anything new.

Why the design work stays this small:

- The change is about **where a fact is printed**, not about a new affordance. The fact already
  exists in the payload (`publisher`, `jurisdiction`, `updatedAt`); today the entry prints a
  constant `"Ver en el BOE"` and a field named `boeUpdatedAt`, so a regional norm is mislabelled
  by construction. Printing the real values is the fix. A new block would be inventing surface for
  a bug.
- The mislabel is the product's core claim under attack: every citation is supposed to be
  verifiable. If a BOCM norm reads "Ver en el BOE", the citation stops being verifiable at a
  glance. The repair has to look like the same citation entry, better labelled, because a
  visually *new* citation entry would say "we changed how citations work", which is not true.
- 003 already settled the "one qualifier, two renderings" question for scope statements. 004 adds
  no qualifier of its own: it rewrites the words inside three existing slots (sources notice,
  abstention body and title, search status). A fourth inset would break 003's stated ceiling of two
  qualifier blocks in the slot between the answer body and `Fuentes`.
- The coverage matrix (Task 3) must **not** become a screen. A coverage table is a second copy of
  the artifact's data, it goes stale the moment 005 adds communities, and it invites the reader to
  audit the matrix instead of the citation. Coverage is stated pair by pair: an answer names the
  administration it cited; a refusal names the administration that has competence.

## Dial Values

- **DESIGN_VARIANCE: 3** - unchanged from v1 to v3, and the constraint that does the work. The
  jurisdiction token is not a chip, a pill, a badge, a flag, a coat of arms or a coloured tag: it is
  a mono 12px metadata string inside a row that already wraps. Its distinctness comes from the
  words, never from a new shape. Explicitly rejected: a publisher logo or shield next to the norm
  title, a two-tone "state vs regional" colour, a left border on regional entries, a segmented
  control anywhere on the page. At this variance, hierarchy is carried by weight and colour, and a
  citation entry that gained a graphic would be claiming the citation changed status.
- **MOTION_INTENSITY: 2** - unchanged, and unchanged on purpose. Sources arrive in the same commit
  as the answer. Rejected: a per-entry stagger on reveal (it would make provenance the most dynamic
  thing on screen), a highlight on the publisher acronym, a shimmer while the source list is
  pending. Under a stream `replace` frame the entry participates in the existing 160ms cross-fade
  already declared on `.answer`, and nothing more.
- **VISUAL_DENSITY: 4** - held, with one new ceiling. Citation entries gain exactly one token and
  lose none. At 360px the metadata row goes from two items (link, date) to three (jurisdiction,
  link, date) and, for the pilot pair, still occupies **two** wrapped lines because the date was
  already wrapping. New ceiling: the row carries **at most three tokens**, and the Coder must not
  add a fourth (no `officialId`, no `authorityUsed`, no licence note, no "fuente oficial" label).
  A long jurisdiction name may push the row to three lines at 360px; that is accepted, silently
  dropping the token is not.

## Design System / Foundation

Unchanged from v1 to v3. No official design system applies: GOV.UK and USWDS are jurisdictional,
and Material, Fluent, Carbon, Primer and shadcn each import a visual language this brief must not
have. The foundation stays:

- **CSS Modules plus CSS custom properties**, tokens via `var(--token)`, no inline `style` prop, no
  Tailwind, no component library.
- **No new component.** `SourceEntry` carries the new fields with one added `span`; `Notice` already
  renders every state this spec touches (refusal, abstention, clarification, year notice) with the
  props it has; `AnswerBlock` needs no change. `SourceEntry`, `Notice` and `AnswerBlock` can carry
  this spec. A `SourceProvenance`, `PublisherBadge`, `CoverageChip`, `JurisdictionPicker` or
  `CoveragePanel` component for one call site is a YAGNI violation and would duplicate the tone,
  radius, padding and type rules already locked.
- **No new `Notice` prop**, no new response `kind`, no new payload field beyond what Tasks 2 and 8
  already define.
- **CSS delta is one class name at most.** The two metadata spans share one class. Preferred: rename
  `SourceEntry.module.css` `.date` to `.metaItem` with its four declarations byte-identical (mono,
  `--font-size-citation-date`, `--line-metadata`, `--ink-tertiary`) and use it for both. Acceptable:
  keep the name `.date` and use it for both spans. Not acceptable: a second class duplicating those
  four declarations (the design-principles gate flags identical four-line blocks).
- **No icon and no new dependency.** The external-link arrow stays Phosphor `ArrowSquareOut` at 16px
  with `aria-hidden="true"`. A map pin, a flag, a building glyph or a shield would each add an
  implication the product does not have.
- **Honesty note on the skill's scope.** The hero, bento, image, marquee, eyebrow and CTA rules in
  `design-taste-frontend` describe landing pages and do not transfer. What transfers and is applied
  below: the copy self-audit, the em-dash and en-dash ban, the shape and colour consistency locks,
  the contrast check, the reduced-motion rule, and the empty/error-state discipline.

## Global Tokens

Locked, and this spec adds **nothing**:

- **Font:** `--font-sans` IBM Plex Sans (400 / 500 / 600), `--font-mono` IBM Plex Mono (400 / 500).
  Unchanged. Mono stays reserved for citation metadata: article label, jurisdiction, date. Never set
  prose in mono.
- **Accent color:** `#1B5E4B` (verde archivo), single accent, used identically. The link label is
  the only accented item in a source entry and it now names the publisher, so the publisher is
  prominent without a new colour.
- **Neutral base:** the existing cool graphite family. The jurisdiction token uses `--ink-tertiary`,
  the same pair the date already uses. No new colour pair is introduced; the contrast ratio of
  `#656D68` on `--surface-raised` `#FFFFFF` computes to roughly 5.3:1, above AA for normal text at
  any size, and it is the pair already in production.
- **Corner-radius system:** soft, one value, `--radius` (8px), inherited. No pills, no mixed scale.
- **Theme:** light, locked (`color-scheme: light`). Unchanged. Every touched element uses tokens, so
  a future dark theme needs no component edit. The skill's dark-mode-mandatory rule is deliberately
  not honoured here: the theme lock is a v1 decision and changing it would put unaccounted
  behaviour in front of the traceability gate.
- **Icon library:** Phosphor. **No addition.**
- **Semantic colours:** `--warning` and `--error` stay reserved for the privacy warning and for
  transport or configuration failure. Neither may be used for an uncovered regional pair, for the
  abstention, or for a clarification. An uncovered pair is a competence fact, not a fault.
- **Type registers used by the touched elements, and no others:** article label
  `--font-size-citation-label` / `--weight-medium` / `--ink`; norm title `--font-size-citation-norm`
  / `--ink-secondary`; metadata tokens (jurisdiction, date) `--font-size-citation-date` / mono /
  `--ink-tertiary`; link label `--font-size-citation-norm` / `--weight-medium` / `--accent`; notice
  title `--font-size-h2` / `--line-h2` / `--weight-semibold` / `--ink-secondary`; notice body
  `--font-size-notice` / `--line-notice` / `--ink`; sources notice `--font-size-disclaimer` /
  `--line-metadata` / `--ink-secondary`; status line `--font-size-citation-date` / mono /
  `--ink-secondary`.
- **Copy rules for every string:** Spanish (Spain) only, no em-dash or en-dash, no figure of any
  kind (the only numbers a string may carry are the year placeholders already pinned), guillemets
  and inverted `¿` as typed, and every user-facing string lives in `src/content/strings.ts`. No
  Spanish literal in a `.tsx`.

## Per-Task Directives

### Task 7: Citations and UI, publisher plus jurisdiction plus date plus link

- **Layout:** Single-Column Reading Stream entry, unchanged family. The citation entry keeps its
  place inside the `Fuentes (N)` block, which keeps its place between the qualifier notices and the
  disclaimers inside the answer document. Nothing moves. The new fact takes the existing fourth slot
  inside the entry (the wrapping metadata row), not a new row of its own.

- **Components:** `SourceEntry` only. The exact rendering contract:

  ```
  li.entry                                   .entry  gap --space-1             UNCHANGED
    p.label        {citation.articleLabel}                 mono 13 / 500 / --ink       UNCHANGED
    p.norm         {citation.normTitle}                    sans 14 / --ink-secondary   UNCHANGED
                                                           -webkit-line-clamp: 2
    p.meta         .meta  flex-wrap  gap --space-2                                     UNCHANGED
      span.metaItem  {jurisdictionDisplayName(citation.jurisdiction)}   <- NEW, first child
      a.link         "Ver en el {publisherCode}" + ArrowSquareOut(16, aria-hidden)
                     href={citation.sourceUrl} target=_blank rel="noopener noreferrer"
                     aria-label={sourceLinkAriaLabel(citation.publisher)} + ": " + normTitle + ", " + articleLabel
      time.metaItem  {SOURCE_UPDATED_LABEL} + " " + {formatSpanishDate(citation.updatedAt)}
                     dateTime={citation.updatedAt}
  ```

  Contract the Coder must satisfy, item by item:

  - **T7-C1.** `SourceEntryProps` stays `{ citation: Citation }`. The entry reads `articleLabel`,
    `normTitle`, `publisher`, `jurisdiction`, `updatedAt`, `sourceUrl`. It reads no other field.
  - **T7-C2.** Exactly one element is added: the jurisdiction `span`, as the **first** child of
    `p.meta`. The row's render order is jurisdiction, link, date, so the reading sequence is: whose
    rules, where to read them, which version.
  - **T7-C3.** The jurisdiction is rendered **unconditionally, including `state`**. Suppressing it
    for state entries is rejected: the conditional is a bug class (a regional entry silently
    suppressed keeps the mislabel alive), it makes the entry shape depend on data in a way no test
    states, and it teaches the reader that the field appears only for "special" sources. The
    redundancy of naming the state beside "Ver en el BOE" is accepted for uniformity.
  - **T7-C4.** The jurisdiction `span` contains the display name and nothing else. No separator
    glyph, no `·`, no parentheses, no second value in the same node: the gaps come from `.meta`'s
    `gap`. A test asserting `getByText('Comunidad de Madrid')` must find an exact text node.
  - **T7-C5.** The link label is a function of the publisher, not a constant: `boe` yields exactly
    `"Ver en el BOE"`, `bocm` exactly `"Ver en el BOCM"`, `borm` exactly `"Ver en el BORM"`. The
    `boe` branch must be byte-identical to today's string; `AC-001-76` asserts
    `link.textContent === 'Ver en el BOE'`.
  - **T7-C6.** The accessible label is a function of the publisher too, producing the same prefix
    plus `": " + normTitle + ", " + articleLabel`. For `boe` the result must be byte-identical to
    today's `SOURCE_LINK_ARIA_PREFIX` form. `SOURCE_LINK_LABEL` and `SOURCE_LINK_ARIA_PREFIX` stop
    existing as single BOE constants: replace them with a function or an exhaustive
    `Record<Publisher, string>` typed on the domain `Publisher`, so adding a publisher is a compile
    error, not a silent BOE label.
  - **T7-C7.** No `?? 'Ver en el BOE'`, no `|| 'Ver en el BOE'`, no try/catch fallback. The only
    permitted fallback for a value outside the type is a non-claiming generic ("Ver en la fuente
    oficial"); a fallback that names a publisher is the exact defect this spec removes.
  - **T7-C8.** The date reads `updatedAt` and only `updatedAt`. `boeUpdatedAt` must not appear in
    any component after this task. Wrap the value in `<time dateTime={citation.updatedAt}>` so the
    provenance is machine-readable the way the header's corpus date already is; `<time>` is phrasing
    content, valid inside `p`, and takes no new CSS because it is a flex child of `p.meta`.
  - **T7-C9.** One class for both metadata spans (see Foundation). The authoritative typography for
    the row is the four declarations already written; none of them changes.
  - **T7-C10.** Nothing is added inside an `[aria-live]` subtree. `SourcesList` stays outside the
    answer's live region, and `AC-001-80` keeps asserting that no live region contains "Fuentes" or
    "Artículo 63".
  - **T7-C11.** `href`, `target` and `rel` are unchanged. No `title` attribute is added anywhere (it
    is not a place to hide a truncated title, and it is not reachable on touch).
  - **T7-C12.** `SourcesList` changes only in which constant it renders for the notice. The heading
    `Fuentes (N)`, the `passageId` de-duplication, the count and the notice's position below the
    list are unchanged.
  - **T7-C13.** The string rewrites are exactly the ones below, in the existing slots. No new string
    constant is introduced for this task except the per-publisher label map.

  String contract (source-agnostic copy). Each replacement keeps every claim the original made:

  | Constant | Today | Proposed |
  |---|---|---|
  | `CONSOLIDATED_TEXT_NOTICE` | "El texto consolidado del BOE es informativo y no tiene valor legal. Este producto no es una publicación oficial del BOE ni cuenta con su respaldo." | "El texto consolidado de las fuentes oficiales citadas es informativo y no tiene valor legal. Este producto no es una publicación oficial ni cuenta con el respaldo de los organismos citados." |
  | `INSUFFICIENT_TITLE` | "No puedo confirmarlo con el BOE" | "No puedo confirmarlo con las fuentes oficiales" |
  | `STATUS_SEARCHING` | "Buscando en el BOE" | "Buscando en las fuentes oficiales" |
  | `INSUFFICIENT_EXPLANATIONS.no_results` | "... en el texto del BOE pasajes ..." | "... en el texto oficial pasajes ..." |
  | `INSUFFICIENT_EXPLANATIONS.below_threshold` | "Lo que he encontrado en el BOE ..." | "Lo que he encontrado en las fuentes oficiales ..." |
  | `INSUFFICIENT_EXPLANATIONS.no_citations` | "... en ningún pasaje del BOE que haya recuperado ..." | "... en ningún pasaje oficial que haya recuperado ..." |
  | `INSUFFICIENT_EXPLANATIONS.corpus_unavailable` | "No puedo consultar el texto del BOE en este momento ..." | "No puedo consultar el texto oficial en este momento ..." |
  | `INSUFFICIENT_BOUNDARY` | "Puedo explicar el texto consolidado del BOE, ..." | "Puedo explicar el texto consolidado de las fuentes oficiales, ..." |
  | `YEAR_NOTICE_BODY` | "El texto del BOE que cito corresponde al año {corpusYear}." | "El texto oficial que cito corresponde al año {corpusYear}." |
  | `OUT_OF_SCOPE_EXPLANATION` | "... con la norma del BOE citada, ..." | "... con la norma oficial citada, ..." |

  Judgment calls inside that table, recorded so they are not re-litigated: the notice keeps its two
  sentences and loses only the publisher claim ("organismos citados" replaces "del BOE" and "su
  respaldo" so no pronoun is left dangling); `INSUFFICIENT_TITLE` keeps its verb and its "no puedo
  confirmarlo" opening, because that phrase is what the live region announces for an abstention;
  `INSUFFICIENT_EXPLANATIONS.unverified_citation` needs **no edit** (it names no source) and must be
  left byte-identical, which is what "make it source-agnostic" means for a string that already is;
  `SOURCES_TITLE` stays `"Fuentes"` (a wider title would imply a scope statement the section does
  not make).

- **Typography:** unchanged registers. The jurisdiction token takes the metadata register, not the
  norm-title register: at 14px sans it would compete with the title above with no gap between them,
  and the row would read as two titles. Do not bold it, do not set it in `--ink`, do not
  uppercasing it. The link label carries the prominence the publisher needs.

- **Motion:** none. No new transition, no entrance for the added token, no stagger per entry. The
  entry participates in the pre-existing `--motion-fast` cross-fade declared on `.answer`.

- **A11y:**
  - The row's reading order is DOM order: jurisdiction, link (accessible name carries publisher plus
    norm plus article), date. A screen-reader user hears "Comunidad de Madrid", then the link, then
    "Actualizado 2 de noviembre de 2026".
  - The date's accessible text is the formatted string, already spoken naturally by
    `formatSpanishDate` ("2 de noviembre de 2026"). Do not add an `aria-label` to the `<time>`: it
    would double-announce the same date.
  - The jurisdiction `span` carries no `aria-label` and no `role`. It is text.
  - `ArrowSquareOut` stays `aria-hidden="true"`; the link is never icon-only.
  - Tap target unchanged: `min-height: var(--tap-target)` on `.link`; the new span is not
    interactive and adds no tab stop, so tab order per entry is unchanged (one link).
  - Contrast: no new pair. The date pair is reused, verified above at roughly 5.3:1.
  - Reduced motion: nothing new animates, so nothing new needs gating.
  - The norm title is visually clamped at two lines but complete in the DOM, so a screen reader
    reads the full official title even when the sighted reader sees an ellipsis. That asymmetry is
    accepted and is the reason not to truncate the string itself.

- **Anti-patterns to avoid (specific to this task):**
  - A publisher badge, chip, pill, flag, logo or "BOCM" superscript. The acronym belongs in the link
    label, where it is also the destination.
  - A jurisdiction selector, filter, tab set or segmented control above `Fuentes`. The jurisdiction
    of a citation is not a user choice; it is what the cited norm is.
  - Grouping the sources block by jurisdiction with subheadings ("Normativa estatal",
    "Normativa autonómica"). It is a new component, it invents an order the list does not have, and
    it hides the count in `Fuentes (N)`. One flat list.
  - Repeating the notice per entry, or making the notice per-publisher ("El texto del BOCM es
    informativo..."). One notice, below the list, true for the whole list.
  - Printing `officialId`, `authorityUsed` or the licence note in the entry. They are registry
    facts; the entry shows what a reader can verify by clicking.
  - Printing the full publisher name ("Boletín Oficial de la Comunidad de Madrid") in the entry. It
    is a second, longer token for a fact the label already carries, and it wraps badly at 360px.
  - Keeping a BOE constant as a default in the label function, or a `publisher ?? 'boe'` cast.
  - An em-dash or en-dash in any of the rewritten strings, and a figure of any kind (the year
    placeholders in `YEAR_NOTICE_BODY` are the only allowed numbers and they stay).
  - Rewriting `INSUFFICIENT_EXPLANATIONS.unverified_citation` "for consistency". It is already
    source-agnostic; touching it is unaccounted behaviour.

- **Must not change:** the article label's mono/medium/`--ink` treatment; the two-line clamp on the
  norm title; `Fuentes (N)` and its count; the `passageId` de-duplication; the sources notice's
  position below the list and its 12.5px secondary register; the answer document's block order
  (body, then 003's IBI boundary note when present, then the year notice, then `Fuentes`, then the
  disclaimers); the year notice's adjacency to `Fuentes` that spec 002 argued for; the disclaimer
  paragraphs and `AI_DISCLOSURE`; the refusal and abstention `Notice` shapes; the header's
  `Año fiscal` / `Corpus` strip; the composer; the empty state; the status line's component,
  register and position in the dock.

- **Watch items (Coder must check):**
  1. **`AC-001-76` pins bytes.** `link.textContent` must still be exactly `Ver en el BOE` for a BOE
     citation, and `getByRole('link', { name: /Ver en el BOE/ })` must still resolve. Any deviation
     in the `boe` branch is a regression, not a wording choice.
  2. **`AC-001-77` pins three substrings of the old notice** ("El texto consolidado del BOE es
     informativo y no tiene valor legal", "no es una publicación oficial del BOE", "ni cuenta con su
     respaldo"). Re-point those assertions at the new string deliberately; do not delete them. The
     three claims they exist to protect (informative, no legal value, no official publication, no
     endorsement) must all still be asserted, and the test must also assert that the rendered notice
     no longer contains "BOE".
  3. **`AC-001-81`'s `USER_FACING_COPY` list** holds the old literals including
     `'El texto consolidado del BOE es informativo'` and `'Ver en el BOE'`. Update those entries to
     the new strings in the same commit, or the "no hardcoded copy in a `.tsx`" guard silently stops
     guarding the strings this task created.
  4. **Link label and link host must agree.** The label names the publisher whose page `sourceUrl`
     points at. The citation carries `publisher` but not `authorityUsed`, so a norm whose text was
     taken from BOE while its `publisher` is the community would render "Ver en el BOCM" over a
     `boe.es` URL. That is the same mislabel in a new place. Add an assertion that the host of
     `citation.sourceUrl` belongs to the publisher the label names, and if the data cannot satisfy it
     for the pilot norms, raise it before shipping (see Flagged uncertainties).
  5. **`publisherCode` must exist in the domain.** The label needs the acronym (BOE / BOCM / BORM),
     which is shorter than a full display name. If Task 2's `Publisher` exposes only a long display
     name, the entry cannot render an honest short label; the domain must expose the short code.
  6. **Long regional titles truncate.** A Madrid or Murcia consolidated text's official title can
     run past 150 characters (`Decreto Legislativo 1/2010, de 21 de julio, por el que se aprueba el
     Texto Refundido ...`). The two-line clamp will cut it with an ellipsis after roughly 90 to 110
     characters at 360px. Verify with the real pilot titles after Task 6, and if the cut removes the
     norm's identifying number and date, that is a genuine information loss: raise it rather than
     raising the clamp on your own initiative.
  7. **`formatSpanishDate` receives `updatedAt`.** The field rename is typed, so a stale
     `boeUpdatedAt` is a compile error rather than `undefined` reaching `.slice()`. Also migrate
     `test/support/ui-harness.ts`'s `CITATION` fixture, which still carries `boeUpdatedAt`
     (Task 2 lists it).
  8. **`.meta` wrapping.** At 360px the content box inside `.sources` is about 296px. The pilot rows
     are expected to occupy two wrapped lines, the same as today. Confirm no horizontal scrollbar
     and no clipped date at 320px and at 200% zoom, where one token per line is correct behaviour.
  9. **No live-region regression.** `AC-001-80` scans every `[aria-live="polite"]` region for
     "Fuentes" and "Artículo 63". Do not move any part of the entry into the answer body region to
     "keep the metadata together".
  10. **`StatusLine` length.** "Buscando en las fuentes oficiales" is 33 mono characters, roughly
     238px at 12px: it fits one line at 360px and wraps gracefully below that. Do not shorten it by
     dropping "oficiales" (it would no longer say the sources are official).

### Task 8: Scope guard, region-aware (refusal copy and the clarification path)

- **Layout:** unchanged. An uncovered pair renders the existing refusal `Notice` in the thread, in
  the same slot as today's ITP, ISD, IBI, non-residents and company-tax refusals. An unknown
  jurisdiction renders the existing clarification `Notice` in the dock, above the composer, in the
  same slot as the year or income-type clarification. Nothing new appears on screen; what changes is
  what the existing slots say.

- **Components:** `Notice` (both cases) driven by `abstentionNotice` and `composerNotice` in
  `use-chat-turn.ts`, unchanged in structure.

  ```
  click: 'out_of_scope'                              (abstentionNotice, UNCHANGED shape)
  aside.notice.info
    h2 OUT_OF_SCOPE_TITLE
    p.body   response.explanation        <- {topic} and {body} already interpolated server-side
    a.action 'Hablar con un asesor'
    (no items, no links, no footer)

  kind: 'clarification'                               (composerNotice, UNCHANGED shape)
  aside.notice.info   (in Dock, above the composer)
    h2 CLARIFICATION_TITLE
    p.body   response.question           <- model prose, names the missing datum
  ```

  Contract:

  - **T8-C1.** The refusal `Notice` keeps `tone: 'info'`, `OUT_OF_SCOPE_TITLE`, `body` =
    `explanation`, the handoff `action`, and no `items`, `links` or `footer`. The exact-shape
    assertion that already exists on that notice keeps passing.
  - **T8-C2.** The only copy edit in the refusal is `OUT_OF_SCOPE_EXPLANATION`'s
    "con la norma del BOE citada" to "con la norma oficial citada". "Lo que sí cubro ... es el IRPF,
    el IVA y el ciclo fiscal del autónomo" stays as written.
  - **T8-C3.** `officialBody` must remain a determiner-led noun phrase, because the template reads
    "la administración competente es {body}". A jurisdiction-supplied body is "la Comunidad de
    Madrid" or "la Región de Murcia", never "Comunidad de Madrid". This is a guard-side contract
    with a UI consequence: the component interpolates nothing, so the grammar is decided in
    `scope-topics.ts` / the guard.
  - **T8-C4.** The unknown-jurisdiction path renders the **existing** clarification notice. No
    community picker, no suggestion chips, no radio group, no auto-filled answer, no disabled
    composer. The question is the model's single clarifying question, as today.
  - **T8-C5.** No copy anywhere lists which (jurisdiction, tax) pairs are covered. The matrix is the
    artifact's, reached through one lookup; a second list in a string would drift the moment spec
    005 adds a community, and `AC-004-15` forbids a second list. The refusal therefore names what is
    covered in **tax** terms only, and the administration only as the competent body for the refused
    topic.
  - **T8-C6.** The IBI line stays byte-identical: the `ibi` topic entry keeps `officialBody:
    'la autoridad tributaria de tu comunidad autónoma'`, which is exactly what
    `AC-001-79` renders and asserts today. The `{body}` interpolation must still produce that
    phrase for an IBI question with no resolved community, and the same phrase for a resolved one
    only if Task 8's rule says so; the component must not special-case it.
  - **T8-C7.** The clarification keeps `tone: 'info'`. It is a request for one datum, not a warning
    and not an error; `--warning` and `--error` stay unused here.
  - **T8-C8.** No jurisdiction state in the UI: no `localStorage`, no hidden field, no client-side
    memo of the answered community. The resolved jurisdiction is derived per turn (Task 8/9) and
    the UI never implies memory it does not have.
  - **T8-C9.** The refusal must not gain a "cobertura" line, a link to a coverage page, or a
    footnote. The handoff remains the only affordance, and it stays last.

- **Typography:** unchanged: notice title 15px/600 `--ink-secondary`, body 14px/1.5 `--ink`. No
  emphasis inside the interpolated body (no bold around the administration's name). The sentence
  already carries the weight; bolding a body fragment inside a single `p.body` requires markup the
  component does not accept, and adding it would be a new prop for one string.

- **Motion:** none. Same inset, same commit, pre-existing cross-fade only.

- **A11y:**
  - A refusal is announced through the persistent polite region using the notice `title`
    (`OUT_OF_SCOPE_TITLE`), as today. Do not switch the announcement to the body: the body now names
    a specific administration and an announcement should be short.
  - The clarification is a `Notice` in the dock, not an alert, and it must not steal focus from the
    composer. Unchanged.
  - Reading order: title, then the sentence naming topic and competent body, then the handoff. That
    order is the whole point of the copy: the reader learns who is competent before learning what
    the product does instead.
  - No new interactive element, so no new tab stop and no new focus ring.
  - Contrast unchanged: no new pair.

- **Anti-patterns to avoid (specific to this task):**
  - A community selector, chips of the 17 communities, or a "¿En qué comunidad vives?" form control.
    The product asks in prose, once, and the clarification slot is one `h2` plus one `p`.
  - Turning the refusal into a warning or an error tone because the pair is "uncovered". Competence
    is not a fault.
  - Naming a community the product does not cover in the refusal body as if it were covered, or
    naming Madrid as an example of what is covered. Both are the coverage list in disguise.
  - A new "cobertura" surface of any kind: badge, banner, tooltip, footer link, help page.
  - Rewriting the IBI sentence, or "harmonising" the itp/isd/ibi `officialBody` values while in
    there.
  - Making the clarification a `details` element, a modal, or an inline form.
  - Any em-dash in the rewritten template.

- **Must not change:** `OUT_OF_SCOPE_TITLE`; the `filing_request` template's shape and its
  "No presento declaraciones" opening; the handoff label and its `mailto:` href (no `target`, no
  `rel`, per `AC-002-28`); `CLARIFICATION_TITLE` ("Necesito un dato más"); the composer notice slot;
  the privacy warning's `warning` tone and the transport error's `error` tone.

- **Watch items (Coder must check):**
  1. **The clarification can loop for a named non-pilot community.** Task 8's rule resolves a named
     pilot community to that community and an unnamed regional implication to unknown. A message
     naming **Galicia** is a regional implication the pilot set cannot represent. If it resolves to
     unknown, the product asks "¿en qué comunidad autónoma?" again, and the user has already
     answered. That is a dead end and the worst user-visible outcome in this spec. Confirm which
     branch a named non-pilot community takes before shipping, and if the answer is "clarify again",
     raise it rather than shipping the loop (see Flagged uncertainties).
  2. **Grammar of the interpolated body.** Test the rendered sentence for Madrid, Murcia and the
     state fallback, not only the `officialBody` value. `la administración competente es la
     Comunidad de Madrid` must read correctly, and so must the untouched IBI case.
  3. **The genuinely most common surface for an uncovered regional tax is a guide, not a refusal.**
     `preModel` runs `gestorGuide(message)` before `scopeResponse`, so "¿cuánto pago de ITP en
     Madrid?" is answered by `ITP_GUIDE` (steps plus an AEAT link) and never reaches the guard. If
     the coverage story must hold on that surface, it is a different task (see Flagged
     uncertainties). Do not change the guides inside Task 8.
  4. **The clarification's own wording.** The question is model prose, so no string in `strings.ts`
     can guarantee it names the community. Check the prompt (`SYSTEM_POLICY`'s "comunidad autónoma"
     reason) still produces a question that asks for the community by name, since the follow-up
     must contain it (no persistence).
  5. **`AC-001-79`'s IBI refusal assertion** renders a hardcoded `officialBody` in the fixture; keep
     it as the state fallback so the test keeps testing the fallback.
  6. **No uncovered-pair copy leaks a covered pair.** Grep the new template for any community name
     before merging.

### Task 9: Jurisdiction-aware answering (citations and the abstention)

- **Layout:** unchanged. An answer's `Fuentes (N)` block keeps its position, its flat list and its
  notice. An abstention keeps its `Notice` with the handoff action and the optional year-notice
  footer.

- **Components:** none added, none changed in structure. The only visible consequences are which
  citations arrive (all from the answer's jurisdiction, hence a single publisher per answer) and
  which string the abstention body carries.

  Contract:

  - **T9-C1.** The abstention `Notice` shape is unchanged: `tone: 'info'`, `INSUFFICIENT_TITLE`,
    `body` = the server-composed `explanation` (already `INSUFFICIENT_EXPLANATIONS[reason]` plus
    `INSUFFICIENT_BOUNDARY`, composed in `responses.ts`), the handoff `action`, `footer` =
    `yearNotice` when present. The component composes nothing.
  - **T9-C2.** No jurisdiction token is added to the abstention. If the abstention should say which
    administration was searched, that sentence goes into `explanation` server-side; the notice does
    not grow a field, a row or a footnote for it.
  - **T9-C3.** Every citation in a regional answer carries that region's publisher, so the `Fuentes`
    block reads uniformly ("Ver en el BOCM" on every entry). No grouping, no per-jurisdiction
    subheadings, no summary line naming the community above the list.
  - **T9-C4.** De-duplication by `passageId`, first-appearance order, and the count in the heading
    are unchanged.
  - **T9-C5.** A cheap invariant worth asserting at the UI level: within one answer's citation list,
    all entries share the same `jurisdiction` (state answers cite state norms; a regional answer
    cites that region's norms). If that ever fails, the leakage `AC-004-41` and `AC-004-42` forbid
    has reached the screen.
  - **T9-C6.** `CONSOLIDATED_TEXT_NOTICE` is rendered once per list and must be true for a list whose
    entries all come from one regional bulletin. The proposed wording ("fuentes oficiales citadas",
    "organismos citados") satisfies that without naming a publisher.
  - **T9-C7.** `scopeDisclaimer` and `REINFORCED_SCOPE_DISCLAIMER` are untouched and stay a plain
    paragraph below `Fuentes`, never promoted to a `Notice`. Its closing "confirma las cuantías y
    plazos vigentes con la administración competente" is already jurisdiction-neutral, which is why
    Task 7 does not list it.
  - **T9-C8.** An empty citation list still renders nothing (`SourcesList` returns `null`), so an
    abstention can never be read as citation-bearing.

- **Typography:** unchanged. Nothing in the abstention or the source list changes register because
  the jurisdiction changed.

- **Motion:** none.

- **A11y:**
  - The abstention is announced by `INSUFFICIENT_TITLE` (now "No puedo confirmarlo con las fuentes
    oficiales"), not by the body. Same mechanism as today.
  - The year-notice `footer` on an abstention stays in the 12.5px footer slot below the handoff; it
    is a caveat about the corpus year, not part of the verdict.
  - No heading level changes: an answer gains no `h3`, and the flat `h2` structure (`En resumen`,
    `La norma dice`, `Ejemplo`, `Fuentes`, notice titles) is preserved. An existing test iterates
    every heading and requires `H2`.

- **Anti-patterns to avoid (specific to this task):**
  - A "normativa aplicable: Comunidad de Madrid" banner above the sources block, or a jurisdiction
    chip in the answer header. The citation entry already says it, per entry, where it is
    verifiable.
  - Mixing state and regional citations in one list and letting the reader sort it out. That is a
    server-side failure (`AC-004-41`), and the UI must not paper over it by grouping.
  - Adding "no hay normativa autonómica sobre esto" as a new block. It is either true (then it
    belongs in `explanation`) or it is the product guessing.
  - Reusing `OUT_OF_SCOPE_TITLE` on an abstention, or `INSUFFICIENT_TITLE` on a refusal: the two
    titles mean different things and are announced differently.

- **Must not change:** the abstention's handoff `action` and its position last in the block; the
  year-notice footer slot; the `Fuentes` heading and count; the notice copy slot; every existing
  answer's block order and prose headings.

- **Watch items (Coder must check):**
  1. **An all-Madrid `Fuentes` list still renders the consolidated-text notice once, and it is true.**
     Check the rendered text against a Madrid-only list, not only a BOE list.
  2. **The abstention keeps its `yearNotice` footer** when the message names another year, and the
     footer does not absorb the new explanation.
  3. **`INSUFFICIENT_EXPLANATIONS` strings are joined with `INSUFFICIENT_BOUNDARY` into one body.**
     After the rewrite, read the joined paragraph aloud: both sentences must still end cleanly and
     the pair must not repeat "texto oficial" three times in two sentences. If it does, adjust the
     two strings as a pair, not the composition.
  4. **No response `kind` is added** and no citation field beyond `publisher` / `jurisdiction` /
     `updatedAt` reaches the client. A jurisdiction-only banner would need a new field, which is why
     it is rejected.
  5. **`scopeDisclaimerFor` derives from cited norms, not from the message.** Changing how it
     derives would be unaccounted behaviour; it only needs to keep working when the cited norms are
     regional (a Madrid IRPF norm is still an IRPF norm for that rule's purpose; verify the
     `normIdOfPassageId` lookup still resolves for the new regional ids, or the reinforced
     disclaimer will silently appear or disappear).

## Out-of-scope tasks

- **Task 1: ADR.** Docs only. Design-relevant only as the record of the display names and licence
  notes the UI reads; if the ADR names the jurisdictions, the UI must use the same names.
- **Task 2: provenance and schema v2.** Backend, with one UI dependency: the citation must carry
  `publisher`, `jurisdiction` and `updatedAt` (it does, per `AC-004-11`), the `Publisher` type must
  expose a short code for the link label, and a display name per jurisdiction must exist somewhere
  the component can read. The component decides nothing about shape.
- **Task 3: coverage matrix.** Backend. Its only UI consequence is the refusal copy of Task 8 and
  the deliberate absence of any coverage surface.
- **Task 4 and Task 5: source adapters and fail-closed sync.** Backend. `sourceUrl` and `updatedAt`
  must describe the text actually used, which the entry renders verbatim; a wrong value here is a
  mislabel the component cannot detect.
- **Task 6: pilot ingestion.** Data. It decides the strings the entry will show (norm titles,
  publisher codes, update dates), so the two title and label questions below are answered by its
  output.
- **Task 10: state-surface non-regression.** Verification. Its UI-facing requirement is
  `AC-004-47`: the IBI refusal text stays byte-identical, which constrains Task 8's edits (see
  T8-C6).

**Explicit UI non-goals for this spec.** No new page, route or screen. No jurisdiction switcher,
filter, tab set or picker. No coverage dashboard, coverage badge, coverage table, coverage tooltip or
"ver coberturas" link. No coverage line in the header's `Año fiscal` / `Corpus` strip. No new
component (`SourceEntry`, `Notice` and `AnswerBlock` carry all of it). No new `Notice` prop and no new
response `kind`. No new design token, type size or colour. No new icon. No dark theme or theme
toggle. No new responsive breakpoint. No animation. No grouping of sources by jurisdiction. No
per-entry licence note. No change to `EMPTY_STATE_EXAMPLES` (a regional example would privilege one
community and imply coverage the matrix does not declare). No change to the composer, the thread
shell, the login surfaces or the guide (`gestor-guide`) rendering.

**Flagged uncertainties for the human gate (not decided here).**

1. **Publisher rendered only inside the link label.** `AC-004-31` says the entry "shows the publisher
   and the jurisdiction". This design satisfies the publisher through the link label ("Ver en el
   BOCM"), which also states where the link goes. A reviewer wanting a separate publisher token gets
   `BOCM · Comunidad de Madrid · Ver en el BOCM`, i.e. the acronym twice, and a fourth token the
   density ceiling refuses. Confirm the link-label reading is accepted.
2. **`publisher` versus `authorityUsed` in the label.** The citation carries `publisher` but not
   `authorityUsed`, and `AC-004-41` pins `publisher: 'bocm'` for a Madrid citation. For a pilot norm
   whose consolidated text came from BOE instead (allowed by the publisher-authority rule when the
   bulletin has no stable consolidated text), "Ver en el BOCM" over a `boe.es` URL is a mislabel of
   the same kind this spec exists to remove. Either the citation's `publisher` must describe the
   linked host, or `sourceUrl` must stay on the issuing publisher's own page. Not decidable in the
   component.
3. **Long regional norm titles against a two-line clamp.** Real pilot titles may exceed 150
   characters and will be cut at roughly 90 to 110 characters at 360px. The full title stays in the
   DOM for assistive technology and the link reaches the complete text, but sighted readers lose the
   norm's number and date. Options: accept the clamp (this design), or raise it to three lines for
   every entry. Needs a decision after Task 6 shows the real titles.
4. **The full publisher name is never rendered.** The entry shows BOCM, not "Boletín Oficial de la
   Comunidad de Madrid". Accepted because the acronym is the standard citation form and is also the
   link's destination, and because the long name wraps badly at 360px and would be a second token.
   If the legal review wants the full name on screen, it needs its own line and a typographic
   decision, not a find-and-replace.
5. **Named non-pilot community can loop the clarification.** See Task 8 watch item 1. The honest
   alternatives are a refusal naming that community's competent body, or a clarification that states
   the coverage boundary; both are Task 8's call. This design flags it rather than choosing.
6. **Partial coverage is user-visible pair by pair, never as a list.** `00-informal.md` decision 3
   asks that partial coverage be user-visible. It is, in the two places a user actually reaches: a
   covered pair produces an answer whose citation names the administration, and an uncovered pair
   produces a refusal naming the competent body. A matrix view would be a second copy of the data
   and is an explicit non-goal above. Confirm pair-by-pair is the intended reading of "user-visible".
7. **The `state` jurisdiction display name.** This design proposes "Administración estatal" for
   `state`, chosen over the shorter "Estado" because "Estado" reads as "status" beside "Actualizado"
   on the same line. The string belongs to the domain's jurisdiction display map, so the exact
   wording is Task 2's, and the component must render whatever that map says without a local
   override.
8. **Two strings still say "BOE" and are not in Task 7's list.** `FILING_REQUEST_EXPLANATION` ("con
   la cita del BOE") and `ERROR_MESSAGES.corpus_unavailable` ("No puedo consultar el texto del BOE en
   este momento") both assert the source is the BOE and both render to users. `AC-004-34` enumerates
   a narrower set. Recommend the same treatment ("con la cita oficial", "el texto oficial") for
   consistency, but that is a scope addition to Task 7 and needs gate approval rather than a silent
   extra edit.
9. **The uncovered regional tax usually renders a guide, not a refusal.** `gestorGuide` runs before
   the guard, so the ITP/ISD surfaces name no community and link to AEAT. If the coverage statement
   must hold on those surfaces, it is a follow-up spec; this spec does not touch guide copy.
10. **Whether the abstention should name the administration it searched.** More honest, and it
    requires a jurisdiction-aware `explanation` (server-side interpolation). The component needs no
    change either way, so this is deferred to whoever owns Task 9's copy, not decided here.

## Addendum — uncovered-community refusal (decision 2026-10-26)

Decision 4 at the human gate resolved flagged uncertainty #5 in the "refuse" direction: a message
that names a community the coverage matrix does not contain ends the turn with an `out_of_scope`
refusal naming that community's competent body, and the "comunidad autónoma" clarification is
reserved for a message that names no community. Task 8 carries it as
`reasonCode: 'uncovered_community'` added to the existing `OutOfScopeReasonCode` union, pinned by
`AC-004-50` to `AC-004-52`.

The visual delta is **zero**. This addendum adds one string constant and the branch that selects it.
No component, no class, no icon, no prop, no token, no response `kind`, no layout. The dials above
are unchanged and this section does not move them: DESIGN_VARIANCE 3 (the refusal is the notice
shape that already exists, hierarchy by weight and colour), MOTION_INTENSITY 2 (static, no entrance
of its own), VISUAL_DENSITY 4 (one `h2`, one paragraph, one link - the existing refusal density).

### Copy (locked)

**Title: `OUT_OF_SCOPE_TITLE`, byte-identical** ("Fuera del alcance de esta herramienta"). A second
title for this reason is rejected. The title is the only string the polite region announces
(`abstentionNotice` feeds `setAnnouncement(title ?? body)`), and the verdict the reader hears is the
same one every other refusal gives. A per-reason title would need a title map plus a second
announcement assertion to say what the body already says in one clause, and it would make the
refusal's accessible name depend on a reason code the reader cannot see.

**Body: one new constant**, selected by reason code the way `filing_request` selects its own:

```
export const UNCOVERED_COMMUNITY_EXPLANATION =
  'Esta herramienta no cubre la normativa que aplica en {community}: la administración competente es {body}. No puedo confirmar ningún dato sobre ella porque el corpus que este asesor cita no incluye normas de esa comunidad.';
```

Locked properties of that template:

- **Exactly two placeholders**, `{community}` and `{body}`, both interpolated server-side (the same
  place `OUT_OF_SCOPE_EXPLANATION` interpolates `{topic}` and `{body}` today). The component
  interpolates nothing and receives a finished string.
- **No `{topic}`.** The reason is about the community, not the tax: the guard resolves the community
  first and a community outside the matrix has no tax axis to name. Adding `{topic}` would need the
  refusal to carry a topic it cannot classify, and the sentence is complete without it.
- **No "lo que sí cubro" clause.** The existing refusal's second sentence names tax axes it does
  cover; here the same sentence would either name covered communities (which is the coverage list in
  disguise, `T8-C5`) or name tax axes that may not apply to the message. The second sentence instead
  explains why the answer is impossible (no norms from that community in the corpus), which is the
  honest distinction from `insufficient_evidence`.
- **"en {community}", not "de {community}".** After `en`, a determiner-led name needs no contraction,
  so one stored form renders correctly for every community: "en la Comunidad de Madrid", "en Galicia",
  "en el País Vasco". After `de` the same forms would produce "de el País Vasco".
- **No figure, no em-dash or en-dash, no guillemets**, and the string lives in
  `src/content/strings.ts` like every other. The copy rules in Global Tokens apply unchanged.
- **Sentence rhythm mirrors the existing refusal**: verdict clause with the competent body, then the
  reason clause. Two sentences, both period-terminated, so the same paragraph reads correctly if a
  future reason composes it with another.

**`{body}`: determiner-led, preposition already complete.** The shape is
`la autoridad tributaria ` plus the community's **prepositional** phrase, with the contraction
resolved in the data: `de Galicia`, `de la Comunidad de Madrid`, `del País Vasco`. It must never be
built at render time by prefixing `de ` onto the locative form - that is the defect that produces
"de el País Vasco" for exactly the communities nobody tests first. It follows `T8-C3`: the template
reads "la administración competente es {body}", so the phrase must stand after "es" without an
article added or removed, and the component never repairs grammar.

**`{community}`: determiner-led, locative-safe.** One canonical record per community, two derived
renderings (the locative form for `{community}`, the prepositional phrase for `{body}`), both
produced from that record. Worked examples of both renderings together:

| Community | `{community}` | `{body}` |
|---|---|---|
| Galicia | `Galicia` | `la autoridad tributaria de Galicia` |
| Castilla y León | `la Comunidad de Castilla y León` | `la autoridad tributaria de la Comunidad de Castilla y León` |
| País Vasco | `el País Vasco` | `la autoridad tributaria del País Vasco` |

The covered pair is the control, not a fourth rule: Madrid and Murcia use the same two renderings
("en la Comunidad de Madrid" / "la autoridad tributaria de la Comunidad de Madrid"), so a refusal and
an answer name the same administration in the same words.

**Who finalises the 17 forms.** This addendum fixes the shape and the three examples above and
nothing else. The alias set and the canonical name per community are the Coder's taxonomy
(`10-tasks.md` risk 7); **spec 005 owns the full community data**. Two cases the taxonomy must settle
rather than inherit: the foral communities, where "la autoridad tributaria de" may be too generic for
the body that is actually competent, and the communities with two co-official names, where one of
them is chosen once and used in both renderings. The string asserts no fact beyond "the tax
authority of that community", which is exactly what today's state fallback
(`la autoridad tributaria de tu comunidad autónoma`) already claims without naming AEAT.

### Rendering (locked)

```
kind: 'out_of_scope', reasonCode: 'uncovered_community'     thread entry, the whole turn
  aside.notice.info
    h2  OUT_OF_SCOPE_TITLE                                 UNCHANGED
    p.body  UNCOVERED_COMMUNITY_EXPLANATION                {community} and {body} already resolved
    a.action  HANDOFF_LABEL -> HANDOFF_URL                 UNCHANGED, last child
  (no items, no links, no footer, no SourcesList, no AnswerBlock, no disclaimers)
```

It is the existing `out_of_scope` branch of `abstentionNotice` with a different body string. Slot,
tone, DOM order and the trailing handoff are what `AC-001`/`AC-002` already assert for that branch.

Position against the three qualifiers the answer surface carries - the point of this paragraph is
that none of them joins the refusal:

- **Year notice.** An `out_of_scope` refusal has no `footer` today and keeps none, for this reason
  too, even when the message names another year. The year notice is a caveat about the corpus year,
  and a refusal makes no claim the corpus year could qualify. It stays where it is: an `AnswerBlock`
  sibling for answers, the footer slot of an `insufficient_evidence` notice.
- **Spec 003's IBI boundary note.** `response.boundaryNote` renders only inside `AnswerBlock`, or
  appended to an abstention body by `abstentionBody`. A refusal's body is `response.explanation`
  verbatim, so the note must not be appended to the refusal even when the message mentions the IBI:
  the guard's ordered classification already decided which reason wins, and two boundary statements
  in one paragraph would contradict each other.
- **Disclaimers.** `AI_DISCLOSURE` and `scopeDisclaimer` live inside `AnswerBlock`'s footer
  paragraphs. A refusal renders no answer document, so it carries neither. Nothing is added here: the
  handoff is the last thing in the block, full stop.
- **The clarification.** Mutually exclusive by decision 4: a message that names a community is
  resolved (answered or refused) and never clarified. `composerNotice` must stay `null` for this
  response, so the dock shows no second notice asking for a community the user already named.

**Must not change:** the `info` tone (this is a competence fact, not a fault: `--warning` and
`--error` stay unused); `OUT_OF_SCOPE_TITLE`; `HANDOFF_LABEL` and the `mailto:` handoff with no
`target` and no `rel` (`AC-002-28`); the handoff's position as the last child; the absence of
`items`, `links` and `footer`; the notice's padding, radius, rule, type registers and
`--surface-sunken` background; the thread-entry shell that wraps it. **No new component, no new CSS
class, no new icon** (a map pin, a flag or a building glyph would each claim a jurisdiction surface
this spec does not have), no new `Notice` prop, no new response `kind`, no new design token.

### Telling the three "no" apart

The three outcomes are distinguished by one fact each, and the strings must not blur them:

| | Uncovered community | Other `out_of_scope` refusals | `insufficient_evidence` |
|---|---|---|---|
| What it means | coverage does not extend to the community the message names | the topic is outside the product, in every jurisdiction | the product tried and could not ground the answer |
| Payload | `out_of_scope` + `uncovered_community` | `out_of_scope` + `itp`/`isd`/`ibi`/`non_residents`/`company_tax`/`filing_request` | `insufficient_evidence` + its reason |
| What the body names | the community and its competent body | the topic and the competent body | no administration, unless the explanation says so |
| Decided by | the coverage lookup, no model call (`AC-004-51`) | the ordered guard, no model call | retrieval, after the model has run |
| Announced as | `OUT_OF_SCOPE_TITLE` | `OUT_OF_SCOPE_TITLE` | `INSUFFICIENT_TITLE` |
| Reader's next step | that community's office, or the handoff | the same | rephrase, or the handoff |

So: "this community is not covered" is a coverage verdict with a named administration; "this
question is out of scope" is a topic verdict with a named administration; "I could not ground it" is
a retrieval verdict with no administration and no citation. Reusing `INSUFFICIENT_TITLE` here, or
`OUT_OF_SCOPE_TITLE` on an abstention, collapses two of the three.

### Accessibility and length

- **Announcement stays the title.** The body names a community and can run long; announcing it would
  read a full paragraph into the live region for a verdict the title already states. Unchanged
  mechanism.
- **Long community names are not shortened.** "la Comunidad de Castilla y León" and "el Principado
  de Asturias" wrap. The body has no clamp, no `max-height`, no ellipsis and no `title` attribute;
  `.notice` grows with its content and `p.body`'s existing `white-space: pre-line` needs no help
  (do not insert `\n` to "lay it out").
- **At 360px** the notice's content box is roughly 288 to 296px; the body at 14px/1.5 is about 42 to
  46 characters per line, so roughly five lines, six with the longest names. Today's refusal
  (`OUT_OF_SCOPE_EXPLANATION`, about 230 characters) already occupies that footprint, so this is not
  a new density.
- **Hyphens in names are kept as published.** "Castilla-La Mancha" carries a hyphen, not a dash: do
  not convert it to an en-dash (copy rule) and do not hard-break it.
- **No new tab stop.** The handoff is the only interactive element, it is the last child, and the
  reading order is title, sentence, handoff - the reader learns who is competent before learning what
  the product offers instead. No `aria-label` on the paragraph, no `role="alert"`, no focus move.
- **Contrast unchanged**: `--ink` on `--surface-sunken`, the pair the refusal already uses.
- **No placeholder reaches the DOM.** A missing `{community}` or `{body}` must be a type or test
  failure, never an empty string: "la administración competente es ." is a worse outcome than a
  failed turn. Assert the rendered body contains no `{` and no `}`.
- **Reduced motion**: nothing new animates; the notice's existing transition is gated as it is.

### Open decision

**Whether the handoff URL differs for an uncovered community.** Nothing grounds a different
destination: `HANDOFF_URL` is one `mailto:` constant, the domain and the artifact carry no
per-community address, and the copy names no office the product could link to. **Default: the same
handoff URL as the existing refusal** (`HANDOFF_URL`, same `HANDOFF_LABEL`), unchanged. A
community-specific destination would be a per-community data field with no source in this spec; that
belongs to spec 005's data, and until it exists the single handoff stays.

## Addendum — link label names the host, 2026-10-28

Human gate, 2026-10-28: the link label names the **real host of the consolidated text**
(`authorityUsed`), not the issuing publisher, while jurisdiction and publisher stay visible in the
metadata row. The pilot cites Madrid and Murcia norms whose consolidated text BOE serves, so the label
reads "Ver en el BOE", the row says "Comunidad de Madrid" / "Región de Murcia", and the publisher stays
recorded. Supersedes T7-C5 and T7-C6 ("a function of the publisher"), T7-C2's "exactly one element is
added" (the publisher span is the second and last), and the VISUAL_DENSITY ceiling's "no fourth token"
clause. Every other Task 7 directive stands. Dials unchanged: 3 / 2 / 4.

**Label rule (locked).** Keyed on `authorityUsed`, exhaustive so a new authority is a compile error:
`boe` -> exactly `"Ver en el BOE"`, `bocm` -> `"Ver en el BOCM"`, `borm` -> `"Ver en el BORM"`. The
`boe` branch stays byte-identical to today's string (`AC-001-76`). Only fallback for a value outside
the type: `"Ver en la fuente oficial"`; no `?? 'Ver en el BOE'`, no publisher-naming default (T7-C7
stands). The code appears only inside `"Ver en el X"`, never as a standalone `BOE` label, badge or
superscript: a bare code beside the title reads as an attribution.

**Accessible label.** One map, two consumers: `aria-label = <same code> + ": " + normTitle + ", " +
articleLabel`. Visible text and accessible name cannot diverge, and the BOE form stays byte-identical
to today's `SOURCE_LINK_ARIA_PREFIX` composition. No provenance claim is added: "en el BOE" names a
destination, never that BOE issued the norm.

**Metadata row (locked).**

```
span.metaItem  {jurisdictionDisplayName(citation.jurisdiction)}       UNCHANGED, first child
span.metaItem  {publisherCode(citation.publisher)}                    <- NEW, short code
a.link         "Ver en el " + {authorityCode(citation.authorityUsed)} + ArrowSquareOut(16, aria-hidden)
time.metaItem  {SOURCE_UPDATED_LABEL} + " " + {formatSpanishDate(citation.updatedAt)}
```

- **Ceiling is now four metadata items, and four is the maximum.** Order is jurisdiction, publisher,
  link, date: whose rules, who publishes them, where to read them, which version. Today's three keep
  their relative order and the date stays last.
- **Short code, not the display name** (flagged uncertainty #4 stands: the full name wraps badly at
  360px and would be a second, longer token).
- **Unconditional, including `state`**, for T7-C3's reason (a conditional is a bug class, and the entry
  shape must not depend on data). "Administración estatal · BOE · Ver en el BOE" is redundant, accepted
  exactly as T7-C3 accepts the state token beside "Ver en el BOE".
- All three spans share the one existing class (`.metaItem`), its four declarations, register, colour
  and the untouched tap target. At 360px the pilot rows go from two wrapped lines to three. Accepted;
  dropping a token to save a line is not.

**Host coherence: a test, not a runtime branch.** `new URL(citation.sourceUrl).hostname` must be the
official host of the `authorityUsed` the label names (pilot pair: `boe.es` while `publisher` is `bocm`
or `borm`). Enforced by a test-only `HOST_BY_AUTHORITY: Record<AuthorityUsed, string>` asserted over
every citation fixture and once over the committed artifact's norms. It belongs in the test because
the component cannot repair a mismatch: a runtime branch would have to crash the entry or silently
relabel it, both worse than a red test, and only Tasks 4 to 6 can fix the data. **No `new URL` call in
a component**, and no host string in `strings.ts`.

**The one visual risk.** A Madrid norm labelled "Ver en el BOE" must not read as state law. Three facts
already on screen prevent it: (1) the jurisdiction token is the row's first child, so "Comunidad de
Madrid" is read before "Ver en el BOE" at every width, and in that order for assistive technology;
(2) the publisher token sits between them, separating "where the norm is published" (BOCM) from "where
its consolidated text is served" (BOE), two facts in two slots rather than one merged string; (3) the
pilot norm titles name the instrument and its community in their own words, and where a title does
not, (1) still does. Rejected: a "texto consolidado en el BOE" parenthetical, a superscript, a
tooltip, a colour split - each is new copy or a fifth token the ceiling refuses.

**Must not change.** No new component, CSS class, design token, icon, prop, response `kind`,
breakpoint or animation; three spans, one class. `publisher` stays recorded in the payload **and** on
screen: the label stopped carrying it, the row carries it, dropping it is the regression. Spec 003's
IBI boundary note is untouched and byte-identical (`AC-004-47`, `scopeDisclaimer`,
`REINFORCED_SCOPE_DISCLAIMER`). The rest of Task 7's string table, `unverified_citation` in
particular, is byte-identical; `Fuentes (N)`, the notice's slot and position, the `passageId`
de-duplication, the heading levels and the block order are unchanged.

PR: https://github.com/RexiAI/tax-advisor/pull/17
Commits: 12 (10 task commits + telemetry + archive; 13 including this record commit)
