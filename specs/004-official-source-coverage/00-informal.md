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
