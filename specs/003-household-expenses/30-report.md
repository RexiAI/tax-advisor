# 30-report — 003-household-expenses

Stage 5a (Mutation Runner). attempt 1, phase 1.

Repo `/home/dbueno/projects/tax-advisor`, branch `spec/003-household-expenses`.
Stack: TypeScript / Next.js App Router / Vitest. Conformance tier **`mvp`**
(declared in `10-tasks.md`).

Precondition checked first: `25-verification.md` exists and carries
`Verdict: PASS` (attempt 1, phase 1). No gate was re-litigated; this stage
carries the Verifier's verdict forward and adds only the final full-suite
re-run and the mutation row.

## Summary

| Row | Value |
|---|---|
| Verifier verdict (carried forward) | **PASS** — attempt 1, phase 1 (`25-verification.md`) |
| Mutation score | **skipped — `mvp` tier** (`docs/SPEC_PIPELINE.md` §Conformance tiers) |
| Equivalent mutants | **none** — mutation testing not run at `mvp` tier |
| Complexity (carried from Refactorer) | changed files: **0 FAIL / 0 WARN**, scoped `-BaseRef main`, `mvp` tier |
| Final test status | **PASS** — 52 files / 492 tests, `npm test` exit 0 |
| Remediation record | **none** — no BLOCK occurred; phase-1 retries 0; phase-2 not yet run |
| Stage verdict | **GREEN** — cleared for stage 5b (PR Opener) |

## Mutation testing — skipped at `mvp` tier

Per `docs/SPEC_PIPELINE.md` §Conformance tiers, mutation testing is a
`production`-tier gate ("Architect — mutation testing: `mvp` skip"). This spec
declares `mvp`, so the stage is a recorded skip, not a failure. Stryker was
**not** installed, configured, or run — confirmed structurally: `package.json`
contains no `stryker`/mutation entry (`grep` exit 1, no match).

## Evidence: mutation score

command: grep -n 'conformance tier' specs/003-household-expenses/10-tasks.md
exit: 0
at: 2026-10-26T12:27:23Z

5:- Spec: `003-household-expenses`, conformance tier **mvp**.

command: grep -n -i "stryker\|mutat" package.json
exit: 1
at: 2026-10-26T12:27:23Z

(No output — no mutation tooling is declared or configured in the project.)

Mutation score: **skipped — `mvp` tier**. No survivor analysis was performed
because no mutants were generated.

## Equivalent mutants

**None.** Mutation testing did not run at `mvp` tier, so no mutant — equivalent
or otherwise — exists to name.

## Complexity summary (carried from the Refactorer's stage)

The Refactorer left no on-disk artifact (by design — per
`docs/SPEC_PIPELINE.md` §Audit contract, the Refactorer's claims are re-recorded
by the Verifier). The summary below is carried from the orchestrator's
Refactorer-stage summary and was **re-confirmed** by this stage rather than
copied blindly:

- Scoped gate over the changed files, `-BaseRef main`, `mvp` tier: **0 FAIL /
  0 WARN**.
- Three functions sit at cyclomatic complexity **6** — at the `≤6` limit, which
  is why the gate is silent about them rather than failing: `preModel`
  (`answer-question.ts:86`), `collectModelStream` (`:212`), `redactPartialMarker`
  (`:239`).

One correction to the carried wording, from a read-only probe: those three are
pre-existing and at the limit, but **`preModel`'s body was not byte-unchanged** —
Task 2 simplified its `insufficientResponse` call (its complexity stayed at 6).
And `main` carried a **fourth** CC=6 function, `answerResponse`, which the diff
brought **below** 6. Net direction is improvement, and nothing anywhere exceeds
the limit — so the `0 FAIL` is genuine, not a suppressed threshold.

## Evidence: complexity gate (re-confirmation, scoped)

command: .standards/scripts/check-code-principles.sh . --tier mvp -BaseRef main --json
exit: 0
at: 2026-10-26T12:26:18Z

{
  "tier": "mvp",
  "gates": ["complexity", "dry", "yagni", "solid", "component-per-file", "property-tests"],
  "fails": [],
  "warns": []
}

Probe proving the CC=6 limit is real and not vacuous — lint at threshold 5 over
the changed source files, listing every function above 5 (i.e. exactly those at
the limit):

command: npx eslint --rule '{"complexity":["error",5]}' src/components/AnswerBlock/AnswerBlock.tsx src/components/ChatScreen/use-chat-turn.ts src/content/scope-topics.ts src/content/strings.ts src/service/answer-question.ts src/service/responses.ts src/service/types.ts
exit: 1
at: 2026-10-26T12:26:50Z

/home/dbueno/projects/tax-advisor/src/service/answer-question.ts
   86:1  error  Function 'preModel' has a complexity of 6. Maximum allowed is 5                            complexity
  212:1  error  Async generator function 'collectModelStream' has a complexity of 6. Maximum allowed is 5  complexity
  239:1  error  Function 'redactPartialMarker' has a complexity of 6. Maximum allowed is 5                 complexity

✖ 3 problems (3 errors, 0 warnings)

Same probe against `main`'s `answer-question.ts` (scratch copy created under
`src/service/`, linted, deleted immediately — `git status` clean of it afterwards;
it confirms 4 functions at 6 before the diff, 3 after):

command: git show main:src/service/answer-question.ts > src/service/.probe-main-answer-question.ts && npx eslint --rule '{"complexity":["error",5]}' src/service/.probe-main-answer-question.ts
exit: 1
at: 2026-10-26T12:27:15Z

   71:1  error  Function 'preModel' has a complexity of 6. Maximum allowed is 5                            complexity
  110:1  error  Function 'answerResponse' has a complexity of 6. Maximum allowed is 5                      complexity
  207:1  error  Async generator function 'collectModelStream' has a complexity of 6. Maximum allowed is 5  complexity
  234:1  error  Function 'redactPartialMarker' has a complexity of 6. Maximum allowed is 5                 complexity

✖ 4 problems (4 errors, 0 warnings)

(4 findings on `main` vs 3 on the branch; `answerResponse` is the one the diff
lifted below the limit.)

## Evidence: final full test status

Full suite, one final time, after all stage-5a work. No source, test, or
`25-verification.md` file was modified by this stage, so this is the same code
the Verifier passed — re-run to confirm rather than assume.

command: npm test
exit: 0
at: 2026-10-26T12:25:52Z

> renta-clara@0.1.0 test
> vitest run

 RUN  v3.2.7 /home/dbueno/projects/tax-advisor

 ✓ test/acceptance/AC-001-corpus-sync.test.ts (7 tests) 1458ms
   ✓ AC-001-20 the corpus is built from official hosts only > AC-001-20: every source URL points at an official host  350ms
 ✓ test/acceptance/AC-001-scope-guard.test.ts (10 tests) 1289ms
   ✓ AC-001-55 a VAT question is answered from the corpus, not from a guide > AC-001-55: IVA reaches retrieval and never renders a fixed guide  428ms
 ✓ test/acceptance/AC-001-answer-orchestration.test.ts (9 tests) 1360ms
 ✓ test/acceptance/AC-001-chat-route.test.ts (8 tests) 2780ms
 ...
 ✓ test/acceptance/AC-003-boundary-note.test.ts (5 tests) 1641ms
   ✓ AC-003-06 an answered turn with an IBI mention carries the note > AC-003-06: the answer carries the constant and cites only retrieved passages  944ms
   ✓ AC-003-07 the note is deterministic and model-independent > AC-003-07: a model that never names IBI and one that does both carry the same note  418ms
 ✓ test/unit/ibi-boundary-note.test.ts (14 tests) 1319ms
 ✓ test/unit/answer-block-boundary-note.test.ts (12 tests) 714ms
 ✓ test/acceptance/AC-003-note-rendering.test.ts (2 tests) 953ms
   ✓ AC-003-11 insufficient_evidence renders the note > AC-003-11: the abstention notice body carries the note next to the explanation  655ms
 ✓ test/acceptance/AC-003-classification.test.ts (7 tests) 849ms
   ✓ AC-003-01 the verbatim sentence is not refused > AC-003-01: classifyScope is null, the turn is not refused and the model is called  729ms
 ✓ test/unit/ibi-scope-signal.test.ts (39 tests) 29ms
 ...
 ✓ test/acceptance/AC-002-policy-scope.test.ts (3 tests) 26ms
 ✓ test/acceptance/AC-002-docs.test.ts (6 tests) 43ms
 ✓ test/acceptance/AC-002-adr.test.ts (6 tests) 14ms
 ✓ test/unit/stores.test.ts (7 tests) 9ms
 ✓ test/acceptance/AC-001-prompt-assembly.test.ts (5 tests) 8ms
 ✓ test/acceptance/AC-001-chat-ui.test.ts (21 tests) 5158ms

 Test Files  52 passed (52)
      Tests  492 passed (492)
   Start at  13:25:52
   Duration  13.78s (transform 3.94s, setup 1.22s, collect 64.06s, tests 36.39s, environment 4.85s, prepare 9.02s)

(Representative excerpt of the per-file list; the run's own summary lines are
verbatim. Full run: **52 test files passed (52), 492 tests passed (492), 0
failed, 0 skipped**, exit 0, completed 2026-10-26T12:26:06Z. A
`grep -Ei "failed|skipped|todo"` over the captured log returned no matches.)

## Gates (Verifier's five checks, carried from `25-verification.md`)

| # | Check | Command | Exit |
|---|---|---|---|
| 1 | Scenario traceability | `.standards/scripts/check-scenario-traceability.sh --json` | 0 |
| 2 | Full test suite | `npm test` | 0 |
| 3 | Complexity gate | `npm run lint` / `npx tsc --noEmit` | 0 / 0 |
| 4 | Design-principles gate | `.standards/scripts/check-code-principles.sh . --tier mvp -BaseRef main --json` | 0 |
| 5 | Scenario-to-behavior spot check | manual read of scenario + test (non-executable) | 0 |

All 14 `AC-003` scenario IDs trace to tests; no unmatched or dangling ID.
Details and raw output live in `25-verification.md` — not duplicated here.

## Remediation record

**none** — no BLOCK occurred during this pipeline run.

- Verifier: attempt 1, phase 1 → `Verdict: PASS`. No BLOCK, so no phase-1
  remediation round was entered; phase-1 retries consumed: **0 of 3**.
- Phase 2 (post-PR CI loop): **not yet run** — it begins after stage 5b opens
  the draft PR. Phase-2 retries consumed: **0 of 3**.
- Phase 3 (deploy verification): **not applicable** to this stage and not run.
- No gate was re-run "until green". The one non-zero exit this stage saw (the
  design-principles script's transient SIGPIPE, below) is recorded as a finding,
  not as a gate failure, because the gate itself had already passed under the
  Verifier and re-passed here on retry with valid JSON.

Corroborated by the orchestrator's own append-only run log (`runs.jsonl`, last
line): `specSlug: 003-household-expenses`, `gatesFailed: []`, `warnings: []`,
`outcome: pass`, `phase1Retries: 0`, `phase2Retries: 0`.

## Findings (non-blocking, recorded not fixed)

| ID | Severity | Finding |
|---|---|---|
| M-01 | WARN | `.standards/scripts/check-code-principles.sh` exits **141** (SIGPIPE) intermittently when its stdout is redirected to a file; the same invocation exited **0** with valid JSON on the immediate retry (12:26:12Z → 141, 12:26:18Z → 0). The Verifier independently hit and documented the same flake in `25-verification.md`. Tooling flake in `.standards/`, not this spec's code. Follow-up belongs to the standards repo. |
| M-02 | note | `runs.jsonl` (tracked) gained one appended line — the orchestrator's own pipeline run record for 003. Pipeline bookkeeping, not source; not edited by this stage. |

Neither finding is a gate failure; neither changes the GREEN verdict.

## Working-tree note

The tree is dirty in the expected in-pipeline way: 8 modified source/test-support
files and 6 untracked `AC-003-*.test.ts` / unit test files, plus the untracked
`specs/` tree. These are the spec's own changes awaiting stage 5b's per-task
commits — not a dirty-tree stop condition. Nothing was stashed, committed,
pushed, reset, or cleaned. The one scratch file this stage created for the CC
probe was deleted immediately (`ls` → gone; `git status src/service/` shows only
the three expected modifications).

## What this stage did not do

- No source, test, or `25-verification.md` edits — read-only on all of them.
- No mutation tooling installed or run (`mvp` tier).
- No `specs-queue/` access.
- No commit, push, or PR — that is stage 5b (PR Opener). No version bump or git
  tag was created or inferred.

Stage 5a verdict: **GREEN** — mutation gate skipped by tier, complexity clean,
full suite green, no BLOCK. Cleared for stage 5b.
