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
