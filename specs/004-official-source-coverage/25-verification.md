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
