# 30-report — 001-spain-tax-advisor

Stage 5a (Mutation Runner). Gate: mutation score at the project's conformance tier, plus one final
full-suite confirmation of the Verifier's PASS after stage 5a's own work.

- **Branch:** `spec/001-spain-tax-advisor`, HEAD `30cb7cc` (unchanged by this stage).
- **Conformance tier:** `mvp` — declared in `10-tasks.md` line 5 (`Spec: 001-spain-tax-advisor, MVP,
  conformance tier **mvp**`), re-confirmed from the repo at run time (`AGENTS_<PROJECT>.md` tier file
  absent; no other tier declaration exists). Evidence block below.
- **Precondition:** `specs/001-spain-tax-advisor/25-verification.md` exists and its operative verdict is
  **PASS** (§Verdict: PASS (attempt 4 — authorized extra round)). Precondition satisfied.
- **Information barrier:** `00-informal.md` was not read. This stage reasoned from `10-tasks.md`,
  `20-acceptance/*.md`, `25-verification.md` and the project test suite only.
- **Changes made by this stage:** none. No source file, no test file, no `specs/**` artifact other than
  this report was written, edited, deleted or moved. Nothing was committed, pushed, stashed, reset or
  cleaned.

## Verdict: GREEN — mutation testing skipped (`mvp` tier)

At `mvp` tier, mutation testing is a `production`-tier gate (`docs/SPEC_PIPELINE.md` §Conformance
tiers; `docs/CONFORMANCE_TIERS.md` §Tier assignments — "Mutation testing (PiTest / Gremlins / Stryker)
| `production`"). Running it is therefore **not a gap** and not a condition of this stage passing. A
scoped Stryker pass was considered and declined: `@stryker-mutator/core` is not present in
`package.json` (`stryker dep: absent`, evidence block below), and the stage's own instruction is not to
add a heavy dependency purely to satisfy a gate the tier exempts.

Stage 5a is green: precondition PASS, the conformant skip recorded with its reason, the tier rule cited
and re-confirmed, and the full suite re-run green after stage 5a's (empty) change set.

## Summary rows

| Row | Result |
|---|---|
| Verifier verdict (carried forward) | **PASS** — attempt 4, authorized extra round outside the exhausted phase-1 budget (`25-verification.md` §Verdict) |
| Mutation score | **skipped — `mvp` tier** (mutation testing is `production`+; no Stryker dependency present) |
| Complexity summary (carried from Refactorer via the Verifier) | 0 FAIL. `npm run lint` exit 0 under `complexity: ['error', 6]` (config read back by the Verifier, non-vacuous probe recorded); `tsc --noEmit` exit 0; `next build` exit 0. Design-principles gate 0 FAIL / 7 WARN, all adjudicated non-blocking |
| Property tests | skipped — `mvp` tier (same tier rule; recorded by the Verifier's design-principles run) |
| Equivalent mutants | **none named — no mutation run occurred**, so there is no survivor class to classify |
| Final full test suite | **GREEN** — 28 files, 286 tests passed, exit 0 (`npm test`, 2026-10-22T19:07:42Z) |
| Remediation record | Phase 1: 3 attempts used (attempts 1–3 FAIL), budget exhausted at attempt 3 → escalated; attempt 4 authorized by the human outside the budget → PASS. Phase 2: not entered (stage 5b has not run). Phase 3: not entered. Phase 1 was not consumed by stage 5a — no BLOCK occurred in this stage |
| Stage 5b clearance | cleared — precondition PASS and this stage GREEN |

## Evidence: mutation testing (skipped)

command: grep -n "conformance tier" specs/001-spain-tax-advisor/10-tasks.md
exit: 0
at: 2026-10-22T19:07:59Z

5:- Spec: `001-spain-tax-advisor`, MVP, conformance tier **mvp**.

command: node -e "const p=require('./package.json');console.log('stryker dep:', p.devDependencies['@stryker-mutator/core']||'absent')"
exit: 0
at: 2026-10-22T19:07:59Z

stryker dep: absent

**Mutation score: skipped — `mvp` tier.** Tier rule: `docs/SPEC_PIPELINE.md` §Conformance tiers (the
Architect/Mutation-Runner stage's mutation-testing row is `skip` at `mvp`, `yes` at `production` and
`multi-service`) and `docs/CONFORMANCE_TIERS.md` §Tier assignments (mutation testing is a `production`
rule). No mutation tooling was installed, configured, or run; no surviving or equivalent mutant exists
to report.

## Evidence: final full test suite

command: npm test
exit: 0
at: 2026-10-22T19:07:42Z

> renta-clara@0.1.0 test
> vitest run

 RUN  v3.2.7 /home/dbueno/projects/tax-advisor

 ✓ test/unit/sync-and-format.test.ts (6 tests)
 ✓ test/acceptance/AC-001-answer-orchestration.test.ts (9 tests)
 ✓ test/acceptance/AC-001-corpus-sync.test.ts (7 tests)
 ✓ test/acceptance/AC-001-app-scaffold-and-config.test.ts (9 tests)
 ✓ test/acceptance/AC-001-llm-adapter.test.ts (10 tests)
 ✓ test/acceptance/AC-001-offline-tests.test.ts (6 tests)
 ✓ test/unit/xml-and-parser.test.ts (12 tests)
 ✓ test/acceptance/AC-001-boe-parser.test.ts (5 tests)
 ✓ test/acceptance/AC-001-citation-validation.test.ts (6 tests)
 ✓ test/acceptance/AC-001-health.test.ts (4 tests)
 ✓ test/acceptance/AC-001-privacy-and-logging.test.ts (8 tests)
 ✓ test/unit/text-and-guards.test.ts (80 tests)
 ✓ test/unit/boe-fetcher.test.ts (12 tests)
 ✓ test/acceptance/AC-001-lexical-retrieval.test.ts (6 tests)
 ✓ test/acceptance/AC-001-scope-guard.test.ts (5 tests)
 ✓ test/unit/boundaries.test.ts (4 tests)
 ✓ test/acceptance/AC-001-docs.test.ts (8 tests)
 ✓ test/unit/config.test.ts (6 tests)
 ✓ test/acceptance/AC-001-prompt-assembly.test.ts (5 tests)
 ✓ test/acceptance/AC-001-evidence-sufficiency.test.ts (5 tests)
 ✓ test/unit/passage.test.ts (11 tests)
 ✓ test/unit/corpus-artifact.test.ts (12 tests)
 ✓ test/acceptance/AC-001-passage-model.test.ts (6 tests)
 ✓ test/acceptance/AC-001-chat-route.test.ts (8 tests)
 ✓ test/unit/normalize.test.ts (5 tests)
 ✓ test/unit/stores.test.ts (7 tests)
 ✓ test/unit/composer.test.tsx (3 tests)
 ✓ test/acceptance/AC-001-chat-ui.test.ts (21 tests)

 Test Files  28 passed (28)
      Tests  286 passed (286)
   Start at  21:07:42
   Duration  6.73s (transform 1.68s, setup 1.01s, collect 9.80s, tests 6.86s, environment 888ms, prepare 3.43s)

**Final test status: GREEN — 28 files, 286 tests, 0 failed, exit 0.** This is the full suite (every
acceptance, unit and component test) re-run by this stage immediately before writing this report. It
matches the Verifier's attempt-4 count (286/286) exactly, which is the expected result given this stage
changed nothing: there is no new stage-5a test code to fold in, so there is no coverage delta to explain.

## Complexity summary (carried from the Refactorer, re-measured by the Verifier)

Carried from `25-verification.md` §Evidence: complexity gate (attempt 4) and §Evidence:
design-principles gate (attempt 4) — not re-run here, per this stage's scope.

| Measurement | Result | Source |
|---|---|---|
| `npm run lint` (`eslint .`, incl. `complexity: ['error', 6]`) | exit 0 — no complexity violation | `25-verification.md`, attempt-4 complexity block |
| Rule actually loaded (non-vacuous probe: complexity-10 function → exit 1) | proven | `25-verification.md`, attempt-1 complexity block |
| `npx tsc --noEmit` | exit 0 | `25-verification.md`, attempt-4 complexity block |
| `npm run build` (`next build`) | exit 0 — compiled, 4 routes | `25-verification.md`, attempt-4 complexity block |
| Design-principles gate (`.standards/scripts/check-code-principles.sh src --tier mvp`) | exit 0 — **0 FAIL, 7 WARN** | `25-verification.md`, attempt-4 design-principles block |
| WARN breakdown | 4× KISS body >20 lines (`SourceEntry` 26, `ChatScreen` 46, `Composer` 31, `AnswerBlock` 26); 2× DRY false positive (`Passage` vs `PassageInput`, distinct reasons to change); 1× YAGNI `LlmAdapter` (mandated by Task 7, second implementation `FakeLlmAdapter`) | `25-verification.md` §Findings V-06 |
| Property tests | skipped — `mvp` tier | `docs/CONFORMANCE_TIERS.md` |

No gate configuration was touched at any point in this stage; per the Stop-and-Ask matrix a blocking
design gate is fixed in code, never in the threshold, and no gate blocked.

## Equivalent mutants

None. Mutation testing was skipped at `mvp` tier, so no mutant was generated, no survivor occurred, and
therefore **no equivalent mutant is named or claimed un-killable**. Recording a mutant as "equivalent"
without having run a mutator would be an invented finding, so this section is explicitly empty rather
than populated.

## Remediation record

Carried forward from `25-verification.md` §Re-verification log — neither guessed nor invented.

| Phase | Attempts | Outcome | Resolution |
|---|---|---|---|
| Phase 1 — pre-PR loop (max 3) | 1 | FAIL — spot check (V-01, V-02: in-scope IRPF questions refused by the Task 11 `filing_request` guard) | Resolved at attempt 1's remediation: routed to the Coder (behaviour) |
| Phase 1 | 2 | FAIL — spot check (V-01/V-02 originals fixed; the fix introduced V-12/V-13, same over-refusal class) | Resolved at attempt 2's remediation: routed to the Coder (behaviour) |
| Phase 1 | 3 | FAIL — spot check (V-12/V-13 fixed; the rewrite over-fired on Spanish generic *tú*, V-17) — **phase-1 budget exhausted, escalated to the human** | Resolved only outside the budget (see next row) |
| Phase 1 (authorized extra round, outside budget) | 4 | **PASS** — V-17/V-18/V-19 resolved by the structural rewrite in `src/content/filing-request.ts` | Attempt count at resolution: 4 (one round beyond the cap of 3, human-authorized; the extra round is not presented as a 4th unit of phase-1 budget) |
| Phase 2 — post-PR CI loop (max 3) | 0 | not entered — stage 5b has not run | n/a |
| Phase 3 — deploy verification (max 3) | 0 | not entered — frontend deploy lane runs after the PR opens (stage 5c) | n/a |
| Stage 5a BLOCKs | 0 | none — no gate failure occurred in this stage | n/a |

Explicit note on stage 5a's own count: mutation testing raised **no BLOCK**, so this stage contributes
no phase/attempt entry of its own to the record. The phase-1 entries above are the verifier's, carried
verbatim in substance; the phase-1 budget was already exhausted and discharged before this stage began
and is not re-opened by it.

## Handoff to stage 5b (PR Opener)

- Precondition met: `25-verification.md` verdict **PASS** (attempt 4).
- This stage's verdict: **GREEN** — mutation testing skipped (`mvp` tier), with the skip reason, the
  tier evidence and the final green suite recorded above.
- No source or test change was made by this stage, so stage 5b commits only the Coder's and
  Refactorer's work plus this report.
- Carried Verifier notes for the human gate (not conditions of this stage's GREEN): (1) the acceptance
  suite holds no negative-case scenario for the scope guard, so a future pattern regression of the
  V-01 class would again be visible only to a Verifier spot check — consider adding two or three
  negative scenarios to `20-acceptance/AC-001-scope-guard.md`; (2) V-20/V-21 remain WARN follow-up
  candidates for a later spec.
- Standing warning for whenever this project graduates: at `production` tier this stage stops being a
  skip and must run Stryker (`npx stryker run`, target ≥80%) — the skip recorded here is a tier
  exemption, not evidence that the suite has been mutation-validated.
