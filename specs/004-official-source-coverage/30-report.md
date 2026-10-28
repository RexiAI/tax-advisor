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
