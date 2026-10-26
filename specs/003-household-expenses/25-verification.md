# 25-verification — 003-household-expenses

attempt 1, phase 1

Verifier stage 4, independent re-execution of the Coder's and Refactorer's
claims. Repo `/home/dbueno/projects/tax-advisor`, branch
`spec/003-household-expenses`. Stack: TypeScript / Next.js / Vitest (mvp tier).
Coder reported: 52 test files / 492 tests green, `npm run lint` 0,
`npx tsc --noEmit` 0, scoped design-principles gate 0 FAIL / 0 WARN with
`-BaseRef main`. Refactorer reported no change needed. All re-run below.

## Evidence: scenario traceability

command: .standards/scripts/check-scenario-traceability.sh --json
exit: 0
at: 2026-10-26T12:21:58Z

{
  "checks": [1, 2],
  "passes": ["AC-003-01 — traced to a test", "AC-003-02 — traced to a test", "AC-003-03 — traced to a test", "AC-003-04 — traced to a test", "AC-003-05 — traced to a test", "AC-003-06 — traced to a test", "AC-003-07 — traced to a test", "AC-003-08 — traced to a test", "AC-003-09 — traced to a test", "AC-003-10 — traced to a test", "AC-003-11 — traced to a test", "AC-003-12 — traced to a test", "AC-003-13 — traced to a test", "AC-003-14 — traced to a test"],
  "fails": []
}

Note: all 14 AC-003 scenario IDs trace to tests; no AC-004 reference appears
(the parked `004-official-source-coverage` spec lives under `specs-queue/`,
outside `specs/`, and is untracked — `git ls-files | grep -i 004` returns
nothing, and `grep -rn "AC-004" src/ test/` returns no matches).

## Evidence: full test suite

command: npm test
exit: 0
at: 2026-10-26T12:22:06Z

> renta-clara@0.1.0 test
> vitest run

 RUN  v3.2.7 /home/dbueno/projects/tax-advisor

 ✓ test/unit/ibi-boundary-note.test.ts (14 tests) 907ms
 ✓ test/acceptance/AC-002-corpus-sync.test.ts (7 tests) 1385ms
 ✓ test/acceptance/AC-001-corpus-sync.test.ts (7 tests) 1648ms
 ✓ test/acceptance/AC-001-chat-route.test.ts (8 tests) 2695ms
 ✓ test/acceptance/AC-001-privacy-and-logging.test.ts (8 tests) 952ms
 ✓ test/acceptance/AC-001-scope-guard.test.ts (10 tests) 1490ms
 ✓ test/acceptance/AC-001-answer-orchestration.test.ts (9 tests) 1406ms
 ✓ test/acceptance/AC-003-boundary-note.test.ts (5 tests) 1351ms
 ✓ test/acceptance/AC-001-offline-tests.test.ts (6 tests) 955ms
 ✓ test/acceptance/AC-002-gestor-guides.test.ts (8 tests) 859ms
 ✓ test/acceptance/AC-002-no-hardcoded-quantities.test.ts (6 tests) 1038ms
 ✓ test/acceptance/AC-001-citation-validation.test.ts (6 tests) 583ms
 ✓ test/unit/sync-and-format.test.ts (6 tests) 664ms
 ✓ test/unit/text-and-guards.test.ts (84 tests) 432ms
 ✓ test/unit/composer.test.tsx (3 tests) 289ms
 ✓ test/acceptance/AC-002-legacy-tests.test.ts (6 tests) 716ms
 ✓ test/unit/answer-block-boundary-note.test.ts (12 tests) 583ms
 ✓ test/acceptance/AC-003-note-rendering.test.ts (2 tests) 952ms
 ✓ test/acceptance/AC-002-copy-and-links.test.ts (6 tests) 1042ms
 ✓ test/acceptance/AC-003-classification.test.ts (7 tests) 615ms
 ✓ test/acceptance/AC-001-health.test.ts (4 tests) 557ms
 ✓ test/acceptance/AC-001-llm-adapter.test.ts (12 tests) 698ms
 ✓ test/acceptance/AC-002-scope-guard.test.ts (6 tests) 595ms
 ✓ test/acceptance/AC-002-registration-path.test.ts (8 tests) 1731ms
 ✓ test/acceptance/AC-001-app-scaffold-and-config.test.ts (9 tests) 111ms
 ✓ test/acceptance/AC-001-evidence-sufficiency.test.ts (5 tests) 99ms
 ✓ test/unit/auth.test.ts (11 tests) 58ms
 ✓ test/unit/chat-submit.test.ts (5 tests) 27ms
 ✓ test/unit/xml-and-parser.test.ts (12 tests) 41ms
 ✓ test/acceptance/AC-002-retrieval-vocabulary.test.ts (5 tests) 343ms
 ✓ test/acceptance/AC-001-boe-parser.test.ts (5 tests) 49ms
 ✓ test/unit/boe-fetcher.test.ts (12 tests) 45ms
 ✓ test/unit/format.test.ts (5 tests) 40ms
 ✓ test/unit/gestor-guide.test.ts (10 tests) 28ms
 ✓ test/unit/boundaries.test.ts (4 tests) 29ms
 ✓ test/acceptance/AC-002-adr.test.ts (6 tests) 14ms
 ✓ test/unit/normalize.test.ts (8 tests) 16ms
 ✓ test/acceptance/AC-001-lexical-retrieval.test.ts (6 tests) 42ms
 ✓ test/acceptance/AC-001-passage-model.test.ts (6 tests) 17ms
 ✓ test/unit/ibi-scope-signal.test.ts (39 tests) 57ms
 ✓ test/acceptance/AC-001-docs.test.ts (8 tests) 30ms
 ✓ test/acceptance/AC-002-reinforced-disclaimer.test.ts (9 tests) 2767ms
 ✓ test/acceptance/AC-002-allowed-norms.test.ts (3 tests) 26ms
 ✓ test/acceptance/AC-002-policy-scope.test.ts (3 tests) 10ms
 ✓ test/unit/stores.test.ts (7 tests) 9ms
 ✓ test/unit/config.test.ts (6 tests) 30ms
 ✓ test/unit/allowed-norms.test.ts (3 tests) 24ms
 ✓ test/acceptance/AC-002-docs.test.ts (6 tests) 15ms
 ✓ test/acceptance/AC-001-prompt-assembly.test.ts (5 tests) 10ms
 ✓ test/acceptance/AC-001-chat-ui.test.ts (21 tests) 4293ms

 Test Files  52 passed (52)
      Tests  492 passed (492)
   Start at  13:22:06
   Duration  12.33s (transform 3.66s, setup 1.25s, collect 58.54s, tests 32.41s, environment 5.19s, prepare 7.92s)

(Excerpt of the per-file pass list; full run is 52 files / 492 tests, all green,
exit 0.)

## Evidence: complexity gate

command: npm run lint
exit: 0
at: 2026-10-26T12:22:20Z

> renta-clara@0.1.0 lint
> eslint .

(No output — ESLint with `complexity: ['error', 6]` produced no findings.)

command: npx tsc --noEmit
exit: 0
at: 2026-10-26T12:22:21Z

(No output — type check clean.)

## Evidence: design-principles gate

command: .standards/scripts/check-code-principles.sh . --tier mvp -BaseRef main --json
exit: 0
at: 2026-10-26T12:22:33Z

{
  "tier": "mvp",
  "gates": ["complexity", "dry", "yagni", "solid", "component-per-file", "property-tests"],
  "fails": [],
  "warns": []
}

No SIGPIPE flake: the run exited 0 with valid JSON on the first attempt. The
unscoped pre-existing FAILs (`src/components/LoginForm/LoginForm.tsx` and a
`.standards/` example script) are correctly excluded by the `-BaseRef main`
scope — this spec's diff touches neither file.

## Evidence: scenario-to-behavior spot check

command: manual read of scenario + test (no executable command)
exit: 0
at: 2026-10-26T12:23:10Z

Checked two scenarios, both from the required files.

AC-003-01 (from `20-acceptance/AC-003-classification.md`):
  Scenario: Given "dime si me puedo deducir la luz, agua e ibi si me doy de alta
  de autonomo"; When classifyScope runs; Then it returns null, answerQuestion
  does not return out_of_scope, and the fake adapter's callCount is 1.
  Test (`test/acceptance/AC-003-classification.test.ts`, `AC-003-01`):
    expect(classifyScope(VERBATIM)).toBeNull();                       // matches "returns null"
    expect(response.kind).not.toBe('out_of_scope');                   // matches "not out_of_scope"
    expect(adapter.callCount).toBe(1);                                // matches "callCount is 1"
  The assertions match the Given/When/Then. The extra `.not.toBe('guide')`
  assertion is a harmless tightening consistent with the scenario's intent.

AC-003-10 (from `20-acceptance/AC-003-note-rendering.md`):
  Scenario: Given an AnswerResponse whose boundaryNote equals IBI_BOUNDARY_NOTE;
  When AnswerBlock renders; Then the note text is visible and rendered as an info
  notice titled "Sobre el IBI de tu pregunta".
  Test (`test/acceptance/AC-003-note-rendering.test.ts`, `AC-003-10`):
    renderAnswerBlock(answerResponse({ boundaryNote: IBI_BOUNDARY_NOTE }));
    expect(screen.getByText(IBI_BOUNDARY_NOTE)).toBeVisible();        // matches "note text visible"
    const heading = screen.getByRole('heading', { name: IBI_BOUNDARY_TITLE });
    expect(heading.tagName).toBe('H2');                               // matches "info notice titled"
    expect(notice?.className).toContain('info');                      // matches "info notice"
  The assertions match the Given/When/Then, including the "info" tone and the
  titled notice.

Both spot-checks confirm the tests assert what their scenario says — not merely
that an ID exists.

## No unaccounted behavior

None found. The full `git diff` (8 files: `AnswerBlock.tsx`,
`ChatScreen/use-chat-turn.ts`, `content/scope-topics.ts`, `content/strings.ts`,
`service/answer-question.ts`, `service/responses.ts`, `service/types.ts`,
`test/support/ui-harness.tsx`) plus the untracked test files
(`test/acceptance/AC-003-*.test.ts`, `test/unit/ibi-scope-signal.test.ts`,
`test/unit/ibi-boundary-note.test.ts`,
`test/unit/answer-block-boundary-note.test.ts`) map cleanly onto the three
tasks in `10-tasks.md`:

- Task 1 (ibi classifier) → `scope-topics.ts` `mentionsIbi` +
  `isDeductibilityQuestion` helpers and the narrowed `ibi` match; unit tests in
  `ibi-scope-signal.test.ts`.
- Task 2 (boundary note constant/field/derivation) → `strings.ts` constants,
  `types.ts` field, `responses.ts` `ibiBoundaryNoteFor`/`TurnNotes`/`noteFields`
  plus the `insufficientResponse` signature change, and the three
  `answer-question.ts` call sites; unit tests in `ibi-boundary-note.test.ts`.
- Task 3 (render) → `AnswerBlock.tsx` notice and `use-chat-turn.ts`
  `abstentionBody`/`abstentionNotice`; unit tests in
  `answer-block-boundary-note.test.ts`.

`test/support/ui-harness.tsx` changes are test-support helpers
(`renderAnswerBlock`, `insufficientResponse`) used by the new rendering tests.
No logic traces to an unlisted task or scenario. The `specs-queue/` directory
holds the parked 004 spec and is untracked scratch, correctly outside `specs/`.

Verdict: PASS
