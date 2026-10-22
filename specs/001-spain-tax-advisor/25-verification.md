# 25-verification — 001-spain-tax-advisor

Stage 4 (Verifier). Independent re-execution of every claim from stages 2 (Coder) and 3
(Refactorer). Nothing below is a transcription of a prior stage's report: every gate was run by
this Verifier, in this session, on this working tree.

- **Attempt:** 1, phase 1 (pre-PR loop). No prior `25-verification.md` existed, so this is the first
  full run, not a scoped re-verification.
- **Branch:** `spec/001-spain-tax-advisor`, HEAD `30cb7cc` (1 commit).
- **Runtime:** Node v24.21.0, npm via `package.json` (Node `>=22`), jq 1.7.1 present.
- **Conformance tier:** `mvp` (as declared in `10-tasks.md`; property tests and mutation testing are
  therefore out of scope for this tier, and the design-principles gate reports property tests as
  skipped for the same reason).
- **Working-tree note:** the tree carries the operator's pre-existing untracked scaffolding
  (`.github/`, `config/`, `docs/`, `AGENTS.md`, `.opencode/`, `src/`, `test/`, `corpus/`, ...) plus
  staged `.gitmodules`/`.standards`. Per the spawn instruction this is the baseline, not a dirty-tree
  stop condition. Nothing was stashed, committed, pushed, reset or cleaned.
- **Information barrier:** `00-informal.md` was not read. Verification is against `10-tasks.md`,
  `20-acceptance/*.md` and `15-design.md` only.

## Re-verification log

| Attempt | Phase | Window (UTC) | Verdict | Failing gate | Note |
|---|---|---|---|---|---|
| 1 | 1 | 2026-10-22T17:59:44Z - 18:07:50Z | **FAIL** | spot-check | V-01, V-02 - in-scope IRPF questions refused by the Task 11 guard |
| 2 | 1 | 2026-10-22T18:12:05Z - 18:15Z | **FAIL** | spot-check | V-01/V-02 originals fixed, but the fix introduces V-12/V-13, the same over-refusal class |
| 3 | 1 | 2026-10-22T18:18:08Z - 18:21Z | **FAIL** | spot-check | V-12/V-13 verified fixed; the rewrite over-fires on Spanish generic *tú* (V-17) - **phase-1 budget exhausted, escalated** |
| 4 | 1 (authorized, outside budget) | 2026-10-22T19:04:09Z - 19:07Z | **PASS** | - | V-17/V-18/V-19 fixed by the structural rewrite; `filing_request` now keyed on direct address (`src/content/filing-request.ts`). Stage 5a cleared. |

Attempt 3 exhausted the phase-1 budget (max 3) and was escalated. The human then authorized **one
extra round outside that budget** for V-17/V-19 (+V-18); §Re-verification - attempt 4 (authorized extra
round) records it and carries the operative **PASS**. The §Escalation section at the end of attempt 3 is
retained as history - it is discharged, not deleted.

## Verdict: PASS (attempt 4 - authorized extra round)

The operative verdict is **PASS**. Attempts 1-3 failed on a single defect family - the Task 11
`filing_request` guard refusing in-scope IRPF questions - and after the human authorized one remediation
round outside the exhausted phase-1 budget, the guard was rewritten from vocabulary matching to
direct-address detection (`src/content/filing-request.ts`). Attempt 4 below re-executes every claim and
finds the defect family resolved: no answerable question is mis-refused, every required refusal still
refuses with zero model calls, and all six gates are green at this commit.

Attribution for the record: **Coder** (behaviour) resolved V-17/V-18/V-19; the Refactorer owed nothing.
Attempts 1-3 remain in this report verbatim as the audit trail for why the budget was spent.

**Stage 5a (Mutation Runner) is cleared.** At this spec's `mvp` tier the runner records a skip per
`docs/SPEC_PIPELINE.md` §Conformance tiers.

## Findings

| ID | Gate | Severity | Owner | Finding |
|---|---|---|---|---|
| V-01 | spot-check | **FAIL** | Coder | The `ibi` topic pattern `/bienes inmuebles/` refuses core IRPF questions that never mention the IBI. `¿Cómo tributan los rendimientos del alquiler de bienes inmuebles?` returns `out_of_scope` / `reasonCode: ibi` / "la autoridad tributaria de tu comunidad autónoma". Task 11 defines the topic as the **IBI tax**, not the Spanish phrase for "real estate"; arts. 22-24 LIRPF (present in the corpus) are exactly what the question asks about. Reproduced in the spot-check block. |
| V-02 | spot-check | **FAIL** | Coder | The `filing_request` patterns match third-person and impersonal phrasings of "presentar la declaración", contradicting Task 11's definition ("asks the product to file, sign, or represent"). `¿Cuándo se presenta el borrador de la renta?` and `¿Cuándo presenta la declaración un contribuyente con dos pagadores?` both return `out_of_scope` / `filing_request` - deadline questions answered with a scope statement claiming the product cannot file. Reproduced in the spot-check block. |
| V-03 | no-unaccounted | WARN | Coder | `social_security` patterns (`/cotizacion/`, `/seguridad social/`) also capture IRPF-treatment questions: `¿Son deducibles las cotizaciones a la Seguridad Social de un autónomo en el IRPF?` returns `out_of_scope`. Task 11's deterministic precedence ("out-of-scope wins a mixed message") arguably permits this, so it is recorded rather than blocking - but it is the same over-refusal class as V-01/V-02 and belongs in the same fix. |
| V-04 | no-unaccounted | WARN | Coder | Citation-marker stripping leaves a space before the following punctuation in displayed Spanish copy. The live response was `"explanation":"El BOE lo regula en el artículo correspondiente ."` (same in `rule`). Cosmetic; no scenario covers whitespace normalisation. |
| V-05 | no-unaccounted | WARN | Architect | Retrieval ranking for the canonical question `¿Puedo deducirme el alquiler de mi vivienda habitual?` against the **real** corpus returns `BOE-A-2007-6820#dtnovena`, `#a54`, `BOE-A-2006-20764#dtdecimoquinta`, `#a56`, `#dtduodecima` - transitional provisions and reglamento articles, not arts. 22-24 LIRPF. Task 5 specifies only deterministic TF-IDF ordering and no scenario asserts relevance quality, so this is not a gate failure; it is a product-quality risk to carry into a follow-up spec. |
| V-06 | design-principles | WARN | Refactorer | 7 WARNs on production code, all adjudicated as review hints rather than defects (see the design-principles block). 4x KISS body length (>20 lines), 2x DRY false positive (`Passage` vs `PassageInput` are deliberately distinct types with different reasons to change, per `docs/CODING_CONVENTIONS.md` §DRY), 1x YAGNI `LlmAdapter` (the interface is mandated by Task 7 and has a second implementation, `FakeLlmAdapter`, outside `src/`). |
| V-07 | design-principles | note | Architect | `.standards/scripts/check-code-principles.sh test` (bare relative path) exits 1 on `test/support/ui-harness.tsx` (7 exports, threshold <=4). The script's non-test filter is `grep -vE '...|/test/|...'` (line 409), which needs a `/test/` segment; a bare `test` argument produces paths like `test/support/...` with no leading slash, so the run evaluates the very files the gate is designed to exclude. Proven: the same directory as `./test` exits 0 with everything filtered out. Artefact of the gate script's path normalisation, not a code defect; follow-up spec suggestion, out of scope here. |
| V-08 | design-principles | note | - | Repo-root invocation (`. --tier mvp`) exits 1 on `.standards/skills/hallmark/site/examples/cobalt-01/script.js:7:90::CC=10`, plus generated-output WARNs from `.next/`. Environmental and explicitly adjudicated: `.standards` is a git submodule (`.gitmodules` -> `RexiAI/my-engineering-standards`) holding that repo's own skill demo asset, and `.next/` is untracked build output. Neither is code this spec produced or can change. |
| V-09 | no-unaccounted | observation | Architect | A missing or unparsable corpus artifact on `POST /api/chat` yields `kind:'insufficient_evidence'` with HTTP 200 (`insufficientResponse('corpus_unavailable')`, `src/server/chat-route.ts:237-241`). No task or scenario defines this path; `/health` covers corpus failure as 503 (AC-001-73). Defensible (never a 500, reuses the closed kind set) but unaccounted - record for the Architect. |
| V-10 | no-unaccounted | observation | Architect | `parseChatBody` maps malformed JSON to `errorCode:'unexpected_field'` (HTTP 400), the same code as an extra field. AC-001-61 covers extra fields only; malformed JSON is undefined by any scenario. The code is inside the closed set, so this is a note, not a defect. |

Supplementary non-gate observations:

- `npm run build` emits `Warning: Next.js inferred your workspace root ... selected the directory of
  /home/dbueno/package-lock.json` - an ambient parent lockfile on this machine, not a repo defect, but
  it does mean output tracing resolves outside the repo unless `outputFileTracingRoot` is set.
- `npm run build` emits `The Next.js plugin was not detected in your ESLint configuration` - the build
  still lints and type-checks (exit 0), so this is hygiene only.
- No `test.skip`, `test.todo`, `test.only`, `xit` or `xdescribe` exists anywhere under `test/` or `src/`
  (grep, zero hits). The 223-test count is the real executed count, not a filtered one.

## Evidence: scenario traceability

command: .standards/scripts/check-scenario-traceability.sh --json
exit: 0
at: 2026-10-22T18:06:19Z

{
  "checks": [1, 2],
  "passes": ["AC-001-01 — traced to a test", "AC-001-02 — traced to a test", "AC-001-03 — traced to a test", "AC-001-04 — traced to a test", "AC-001-05 — traced to a test", "AC-001-06 — traced to a test", "AC-001-07 — traced to a test", "AC-001-08 — traced to a test", "AC-001-09 — traced to a test", "AC-001-10 — traced to a test", "AC-001-11 — traced to a test", "AC-001-12 — traced to a test", "AC-001-13 — traced to a test", "AC-001-14 — traced to a test", "AC-001-15 — traced to a test", "AC-001-16 — traced to a test", "AC-001-17 — traced to a test", "AC-001-18 — traced to a test", "AC-001-19 — traced to a test", "AC-001-20 — traced to a test", "AC-001-21 — traced to a test", "AC-001-22 — traced to a test", "AC-001-23 — traced to a test", "AC-001-24 — traced to a test", "AC-001-25 — traced to a test", "AC-001-26 — traced to a test", "AC-001-27 — traced to a test", "AC-001-28 — traced to a test", "AC-001-29 — traced to a test", "AC-001-30 — traced to a test", "AC-001-31 — traced to a test", "AC-001-32 — traced to a test", "AC-001-33 — traced to a test", "AC-001-34 — traced to a test", "AC-001-35 — traced to a test", "AC-001-36 — traced to a test", "AC-001-37 — traced to a test", "AC-001-38 — traced to a test", "AC-001-39 — traced to a test", "AC-001-40 — traced to a test", "AC-001-41 — traced to a test", "AC-001-42 — traced to a test", "AC-001-43 — traced to a test", "AC-001-44 — traced to a test", "AC-001-45 — traced to a test", "AC-001-46 — traced to a test", "AC-001-47 — traced to a test", "AC-001-48 — traced to a test", "AC-001-49 — traced to a test", "AC-001-50 — traced to a test", "AC-001-51 — traced to a test", "AC-001-52 — traced to a test", "AC-001-53 — traced to a test", "AC-001-54 — traced to a test", "AC-001-55 — traced to a test", "AC-001-56 — traced to a test", "AC-001-57 — traced to a test", "AC-001-58 — traced to a test", "AC-001-59 — traced to a test", "AC-001-60 — traced to a test", "AC-001-61 — traced to a test", "AC-001-62 — traced to a test", "AC-001-63 — traced to a test", "AC-001-64 — traced to a test", "AC-001-65 — traced to a test", "AC-001-66 — traced to a test", "AC-001-67 — traced to a test", "AC-001-68 — traced to a test", "AC-001-69 — traced to a test", "AC-001-70 — traced to a test", "AC-001-71 — traced to a test", "AC-001-72 — traced to a test", "AC-001-73 — traced to a test", "AC-001-74 — traced to a test", "AC-001-75 — traced to a test", "AC-001-76 — traced to a test", "AC-001-77 — traced to a test", "AC-001-78 — traced to a test", "AC-001-79 — traced to a test", "AC-001-80 — traced to a test", "AC-001-81 — traced to a test", "AC-001-82 — traced to a test", "AC-001-83 — traced to a test", "AC-001-84 — traced to a test", "AC-001-85 — traced to a test", "AC-001-86 — traced to a test", "AC-001-87 — traced to a test", "AC-001-88 — traced to a test"],
  "fails": []
}

## Evidence: full test suite

command: npm test
exit: 0
at: 2026-10-22T17:59:47Z

> renta-clara@0.1.0 test
> vitest run

 RUN  v3.2.7 /home/dbueno/projects/tax-advisor

 ✓ test/unit/sync-and-format.test.ts (6 tests) 57ms
 ✓ test/acceptance/AC-001-answer-orchestration.test.ts (9 tests) 54ms
 ✓ test/acceptance/AC-001-corpus-sync.test.ts (7 tests) 132ms
 ✓ test/acceptance/AC-001-app-scaffold-and-config.test.ts (9 tests) 275ms
 ✓ test/acceptance/AC-001-llm-adapter.test.ts (10 tests) 275ms
 ✓ test/acceptance/AC-001-offline-tests.test.ts (6 tests) 391ms
 ✓ test/unit/xml-and-parser.test.ts (12 tests) 38ms
 ✓ test/acceptance/AC-001-scope-guard.test.ts (5 tests) 28ms
 ✓ test/acceptance/AC-001-health.test.ts (4 tests) 611ms
 ✓ test/acceptance/AC-001-citation-validation.test.ts (6 tests) 40ms
 ✓ test/acceptance/AC-001-privacy-and-logging.test.ts (8 tests) 719ms
 ✓ test/acceptance/AC-001-boe-parser.test.ts (5 tests) 37ms
 ✓ test/unit/boe-fetcher.test.ts (12 tests) 32ms
 ✓ test/unit/text-and-guards.test.ts (17 tests) 12ms
 ✓ test/unit/corpus-artifact.test.ts (12 tests) 12ms
 ✓ test/unit/boundaries.test.ts (4 tests) 12ms
 ✓ test/acceptance/AC-001-lexical-retrieval.test.ts (6 tests) 17ms
 ✓ test/acceptance/AC-001-docs.test.ts (8 tests) 22ms
 ✓ test/acceptance/AC-001-passage-model.test.ts (6 tests) 9ms
 ✓ test/unit/passage.test.ts (11 tests) 9ms
 ✓ test/acceptance/AC-001-prompt-assembly.test.ts (5 tests) 13ms
 ✓ test/acceptance/AC-001-evidence-sufficiency.test.ts (5 tests) 10ms
 ✓ test/unit/normalize.test.ts (5 tests) 6ms
 ✓ test/unit/stores.test.ts (7 tests) 7ms
 ✓ test/unit/config.test.ts (6 tests) 11ms
 ✓ test/acceptance/AC-001-chat-route.test.ts (8 tests) 1431ms
   ✓ AC-001-69 every error path returns JSON with a closed error code > AC-001-69: 503, 400, 429 and 504 all answer JSON with a closed code  453ms
   ✓ AC-001-70 route error handling leaks nothing and holds no stray state > AC-001-70: every adapter error maps to its fixed Spanish message  426ms
 ✓ test/unit/composer.test.tsx (3 tests) 140ms
 ✓ test/acceptance/AC-001-chat-ui.test.ts (21 tests) 1872ms

 Test Files  28 passed (28)
      Tests  223 passed (223)
   Start at  19:59:47
   Duration  5.49s (transform 1.45s, setup 743ms, collect 9.64s, tests 6.27s, environment 902ms, prepare 2.94s)

Offline confirmation (re-executed, not taken on trust):

- `vitest.setup.ts` deletes `LLM_BASE_URL`/`LLM_API_KEY`/`LLM_MODEL` before every test file and installs
  `test/support/offline-fetch.ts`, whose `installOfflineFetch()` replaces `globalThis.fetch` with a
  function that records the attempt and rejects with
  `Offline test policy: the test suite performs no HTTP requests. Inject a fake instead.`
- The suite above ran in this shell with no `LLM_*` variables exported, so AC-001-82's "`npm test` exits
  0 with no `LLM_API_KEY` in the environment" holds here.
- Independence note: the offline stub is what AC-001-82 asserts, so the suite passing is *also* evidence
  that no test opened a socket. That is the strongest offline claim available without a network
  namespace, which is why the live-path verification below was done entirely over loopback.

## Evidence: complexity gate

command: npm run lint
exit: 0
at: 2026-10-22T17:59:59Z

> renta-clara@0.1.0 lint
> eslint .

Configuration read back from `eslint.config.mjs` (not assumed): `complexity: ['error', 6]`,
`@typescript-eslint/no-explicit-any: 'error'`, `prefer-const: 'error'`. The complexity rule is
therefore not shadowed by the Next.js preset.

Non-vacuous probe - separate invocation, proving the gate actually fires (a clean run alone cannot
distinguish "no violations" from "rule not loaded"). Scratch file created, linted, deleted:

command: npx eslint src/verifier-complexity-probe.ts
exit: 1
at: 2026-10-22T18:00:04Z

/home/dbueno/projects/tax-advisor/src/verifier-complexity-probe.ts
  2:8  error  Function 'verifierProbe' has a complexity of 10. Maximum allowed is 6  complexity

✖ 1 problem (1 error, 0 warnings)

Scratch file removed immediately (`ls src/verifier-complexity-probe.ts` -> No such file or directory;
`git status` shows no residue).

## Evidence: design-principles gate

command: .standards/scripts/check-code-principles.sh ./src --tier mvp
exit: 0
at: 2026-10-22T18:05:31Z

Checking design principles in: ./src (tier: mvp)

WARN Method body >20 lines (node): ./src/components/SourceEntry/SourceEntry.tsx:17:41:SourceEntry:KISS_LINES=26
WARN Method body >20 lines (node): ./src/components/ChatScreen/ChatScreen.tsx:41:85:ChatScreen:KISS_LINES=46
WARN Method body >20 lines (node): ./src/components/Composer/Composer.tsx:25:62:Composer:KISS_LINES=31
WARN Method body >20 lines (node): ./src/components/AnswerBlock/AnswerBlock.tsx:20:44:AnswerBlock:KISS_LINES=26

--- DRY ---
WARN Possible duplication (2x identical 4-line block, first at ./src/domain/passage.ts:17): readonly sourceUrl: string; /readonly boeUpdatedAt: string; /readonly fetchedAt: string; /readonly text: string;
WARN Possible duplication (2x identical 4-line block, first at ./src/domain/passage.ts:12): readonly normTitle: string; /readonly blockId: string; /readonly blockTitle: string; /readonly normId: string;

--- YAGNI ---
WARN YAGNI: interface LlmAdapter has exactly one implementation (premature abstraction) — ./src/llm/types.ts:38

--- SOLID ---
PASS SOLID-SRP (node): no oversized files
PASS SOLID-OCP (node): no large type-dispatch chains
PASS SOLID-LSP (node): no heavy instanceof dispatch
PASS SOLID-ISP (node): no fat interfaces
PASS SOLID-DIP (java): no domain→infrastructure imports
PASS SOLID-DIP (go): no domain→infrastructure imports
PASS SOLID-DIP (node): no domain→infrastructure imports
PASS SOLID-DIP (python): no domain→infrastructure imports
PASS SOLID-DIP (rust): no domain→infrastructure imports

--- Component-per-file ---
PASS Component-per-file: no violations

--- Property tests ---
Property tests: skipped (project tier is mvp — production+ required)

---------------------------------------------
✔ Design-principles check: 0 FAIL(s), 7 WARN(s).
  WARNs are review hints — verify each before merging.

Scope adjudication. The gate takes a single `SOURCE_DIR`, and three invocations produce three different
exit codes. All three are transcribed here verbatim rather than only the convenient one:

1. `./src` (above) - **the production verdict**: 0 FAIL, 7 WARN, exit 0. The script's own comment at
   line 409 defines the non-test filter as the principles' scope ("principles apply to production
   code"), and all six gate categories consume that filtered list (`check_component_per_file
   "$NONTEST_NODE"`, line 1476).
2. `test` (bare relative path) - **exit 1**, one FAIL:
   `FAIL Component-per-file: test/support/ui-harness.tsx exports 7 functions/components (threshold: <=4) - split file`
   and summary `✘ Design-principles check: 1 FAIL(s), 0 WARN(s).`
   This is a path-normalisation artefact, not a code defect: the filter is
   `grep -vE '\.(test|spec)\.(ts|tsx|js|jsx)$|/test/|/tests/|__tests__/'`, so `test/support/ui-harness.tsx`
   (no leading slash before `test`) slips through, while `./test/support/ui-harness.tsx` is excluded.
   The same directory as `./test` reports:
   `✔ Design-principles check: 0 FAIL(s), 0 WARN(s).`
   i.e. exit 0 because every file in it is filtered out - a vacuous pass. Neither test-directory run is a
   meaningful production verdict; `./src` is. Recorded as V-07 for a follow-up spec on the gate script.
3. `. --tier mvp` (repo root) - **exit 1**, one FAIL in
   `FAIL Cyclomatic complexity >6 (node): ./.standards/skills/hallmark/site/examples/cobalt-01/script.js:7:90::CC=10`
   plus DRY/LSP WARNs sourced from `.next/` generated output. Adjudicated environmental (V-08):
   `.standards` is a git submodule pinned to `RexiAI/my-engineering-standards`, and `.next/` is untracked
   build output produced by the `npm run build` above. Neither is this spec's code.

Note on reading this transcript: the script prints `Complexity/KISS (<lang>): no violations found`
only when its KISS/complexity collector is empty (line 668). Here the four `Method body >20 lines`
WARNs are that collector's output, so no PASS line appears for the complexity sub-check - the check
ran and found no method above the <=6 decision-point threshold. That sub-check is separately proven
non-vacuous by the repo-root run's `FAIL Cyclomatic complexity >6 (node)` on the hallmark asset above.

WARN-by-WARN adjudication (V-06):

- `Method body >20 lines` x4 (`SourceEntry.tsx:17` 26 lines, `ChatScreen.tsx:41` 46, `Composer.tsx:25`
  31, `AnswerBlock.tsx:20` 26) - component bodies, JSX-heavy by nature; `docs/CODING_CONVENTIONS.md`
  states the size limits are guides to split by responsibility, not by arbitrary line counts. Each of
  these components has one responsibility. Review hint, not a defect.
- `Possible duplication (2x identical 4-line block ... passage.ts:12 / :17)` - the shared field
  declarations of `Passage` and `PassageInput`. Merging them would erase the input/value-object boundary
  that AC-001-06/07/08 rely on and would let an absent `passageId` leak into the value object. No shared
  reason to change, so not duplication per §DRY. False positive.
- `YAGNI: interface LlmAdapter has exactly one implementation` - Task 7 mandates the interface
  (`LlmAdapter` + `FakeLlmAdapter` as the injected test double, AC-001-36). The heuristic counts only
  `src/`, so it cannot see the second implementation. False positive against this spec.

## Evidence: scenario-to-behavior spot check

command: npx tsx /tmp/opencode/guard-repro.mts  (scratch probe importing src/service/scope-guard.ts; deleted after the run)
exit: 0
at: 2026-10-22T18:05:39Z

"¿Cómo tributan los rendimientos del alquiler de bienes inmuebles?"
  -> out_of_scope reasonCode=ibi topic=el IBI body=la autoridad tributaria de tu comunidad autónoma

"¿Cuándo se presenta el borrador de la renta?"
  -> out_of_scope reasonCode=filing_request topic=la presentación de la declaración body=Agencia Tributaria

"¿Cuándo presenta la declaración un contribuyente con dos pagadores?"
  -> out_of_scope reasonCode=filing_request topic=la presentación de la declaración body=Agencia Tributaria

Six scenarios across six different tasks were opened at the test-body level and traced into the
production path. Judged on assertion quality, not on test existence:

1. **AC-001-43 / 45 / 46 / 47 (Task 9, citation validation)** -
   `test/acceptance/AC-001-citation-validation.test.ts:60-147`. Assertions match the Given/When/Then:
   43 asserts `status:'fail'` **and** `unknownIds` equals `['BOE-A-2006-20764#a999']`; 46 asserts the
   malformed ids `['', 'BOE A 2006']`; 47 asserts `validateCitations.length === 2` (no index parameter)
   and that an id absent from the bundle fails. Production path: `src/citations/validate.ts` builds its
   membership map from `bundle.passages` only and re-projects through `citationOf`, so passage text
   cannot travel into a citation; `src/service/answer-question.ts:169-184` maps `fail` to
   `insufficientResponse('unverified_citation')`, a payload type with no `citations` field.
   Confirmed live: an answer citing `BOE-A-2006-20764#zz999` returned `kind:'insufficient_evidence'`
   with `zz999` and the string `citations` both absent from the serialized body.
2. **AC-001-55 / 56 / 57 / 58 (Task 11, scope guard)** - `test/acceptance/AC-001-scope-guard.test.ts`.
   Assertions match: 55 asserts `officialBody === 'Agencia Tributaria'`, `adapter.callCount === 0`,
   `JSON.stringify(response)` contains no digit, and `'citations' in response === false`; 58 asserts
   `reasonCode === 'filing_request'` and that the mixed message resolves to `iva`; the second 58 test
   reads `src/service/scope-guard.ts` from disk and asserts no body name is inlined. Production path:
   `src/service/scope-guard.ts` iterates `OUT_OF_SCOPE_TOPICS` in order, called from `preModel` before
   retrieval (`src/service/answer-question.ts:93-95`). **This is where V-01/V-02 were found:** the tests
   are honest about the scenarios, and every guard scenario is a positive case, so the over-refusal is
   invisible to the suite. Re-executing the guard against Task 11's own topic definitions produced both
   FAILs above.
3. **AC-001-59 / 60 / 63 / 64 (Task 12, privacy + logging)** -
   `test/acceptance/AC-001-privacy-and-logging.test.ts`. 59 asserts `kind:'privacy_warning'`,
   `categoryLabel:'DNI'`, `adapter.callCount === 0`, and that four substrings of the DNI (`12345678Z`,
   `12345678`, `1234567`, `5678Z`) are absent from the raw response; 64 asserts the log line carries a
   UUID-v4 `requestId` that differs between two requests, none of `message/answer/text/question/ip`, and
   that the serializer strips an attached `message` field. Production path: `src/observability/log.ts`
   copies only a nine-field whitelist into the JSON. Confirmed live against the real Next server: seven
   requests produced exactly seven log lines, each with exactly those nine keys;
   `grep -E "alquiler|12345678|factura|IVA|message|answer"` over the server log found nothing, and the
   client IP `203.0.113.5` never appeared.
4. **AC-001-16 / 17 / 19 (Task 4, corpus sync)** - `test/acceptance/AC-001-corpus-sync.test.ts`.
   16 asserts `fetchCount === 0` and deep-equal passages; 17 asserts `fetchCount === 1`,
   `fetchedNormIds === ['BOE-A-2007-6820']` and the untouched norm's `fetchedAt` unchanged; 19 asserts
   exit 1, the artifact byte-identical to the pre-failure file, and stderr naming the norm and
   `unparsable`. Production path: `src/corpus/sync.ts` reuses a norm only when
   `known.boeUpdatedAt === fechaActualizacion && passages.length > 0`, and returns the first failure
   immediately so nothing is written. Genuinely incremental, not test-shaped.
5. **AC-001-65 / 66 / 68 (Task 13, chat route)** - re-executed rather than read: a scratch probe drove
   the real route handler against the real corpus. Exactly 2000 characters -> 200; 2001 -> 400
   `message_too_long` with 0 adapter calls; 21 sequential same-IP requests inside one injected-clock
   window -> exactly one 429 with `retry-after: 600`, while a different IP was answered 200; SSE and JSON
   final payloads were `JSON.stringify`-identical.
6. **AC-001-82 / 84 / 85 (Task 16, offline e2e)** - `test/acceptance/AC-001-offline-tests.test.ts`.
   82 asserts the un-stubbed `fetch` rejects with the policy message **and** that a full turn leaves
   `offlineFetchState.attempts` empty; 85 asserts the suite started with `LLM_API_KEY === undefined`,
   that `kind:'insufficient_evidence'`, that `body.citations === undefined`, and that the raw body does
   not contain the invented id.

Additional claims re-verified by execution rather than by reading a report:

- **No invented citation can survive.** Live: a model answer citing an id retrieval did not return gave
  `kind:'insufficient_evidence'`, the id absent from the JSON body, and no `citations` key. Streaming:
  the same turn ended with `event: replace`, the unknown id appeared in no frame, and no `event: final`
  was emitted - partial markers are held back mid-stream by `redactPartialMarker`
  (`src/service/answer-question.ts:239-245`).
- **No request-time shell/file/network tool exists.** `grep -rn "child_process|node:net|node:http|
  execa|shell"` over `src/` returns only a comment. `fetch(` appears in exactly three places:
  `src/llm/openai-compatible.ts` (the Task 7 adapter, injected, config-driven), `src/corpus/boe-fetcher.ts`
  (build-time sync), and `src/components/ChatScreen/chat-submit.ts` (the browser calling our own route).
  `readFileSync` appears only in `src/server/corpus-loader.ts`, which reads the committed artifact **once**
  in `createCorpusLoader` and returns the cached immutable value thereafter - the request path never
  touches the filesystem. `fs` writes appear only in the build-time sync CLI. The assembled LLM request
  has keys `["system","messages"]` and nothing else; live stub confirms `hasTools=false`.
- **The live corpus is real BOE text.** `corpus/corpus.json` re-read directly (block below): 396
  passages, 2 norms, `boeUpdatedAt` 2026-10-07 on both, all hosts `www.boe.es`, article 20 and article 63
  present in both norms, and `contentHash` recomputed from `passages[]` matches the committed value
  exactly (`2c3b850bc4fbcefcbd871c7b779eb1d40d908e9c7779861d9077868c481dee41`), with `generatedAt`
  excluded from the hash input. Sampled text is genuine consolidated BOE prose (art. 20 reducción por
  rendimientos del trabajo; art. 63 escala general with the brackets rendered as a `|`-separated table).
- **The app starts, and `/health` + `/api/chat` behave.** Verified below against `next start` on
  `127.0.0.1:3100` with a **loopback-only** OpenAI-compatible stub on `127.0.0.1:9099` (no external
  network): the stub cites the first `<<<PASSAGE id=...>>>` it receives, so the whole chain - real
  corpus, real route, real `OpenAiCompatibleAdapter`, real HTTP - is exercised.

## Evidence: live server with loopback stub (next start)

command: LLM_BASE_URL=http://127.0.0.1:9099/v1 LLM_API_KEY=k-live-verifier LLM_MODEL=m-live npx next start -p 3100 ; curl -s http://127.0.0.1:3100/health ; curl -s -X POST http://127.0.0.1:3100/api/chat -H 'content-type: application/json' -H 'accept: application/json' -d '{"message":"¿Puedo deducirme el alquiler de mi vivienda habitual?"}'
exit: 0
at: 2026-10-22T18:03:32Z

GET /health
HTTP/1.1 200 OK
cache-control: no-store
content-type: application/json

{"status":"ok","checks":{"llmConfig":"ok","corpusIndex":"ok"}}

POST /api/chat (JSON)
HTTP/1.1 200 OK
content-type: application/json

{"kind":"answer","explanation":"El BOE lo regula en el artículo correspondiente .","rule":"El BOE lo regula en el artículo correspondiente .","citedPassages":[{"passageId":"BOE-A-2007-6820#dtnovena","normTitle":"Real Decreto 439/2007, Reglamento del IRPF","articleLabel":"Disposición transitoria novena","sourceUrl":"https://www.boe.es/buscar/act.php?id=BOE-A-2007-6820","boeUpdatedAt":"2026-10-07"}],"citations":[{"passageId":"BOE-A-2007-6820#dtnovena","normTitle":"Real Decreto 439/2007, Reglamento del IRPF","articleLabel":"Disposición transitoria novena","sourceUrl":"https://www.boe.es/buscar/act.php?id=BOE-A-2007-6820","boeUpdatedAt":"2026-10-07"}],"disclaimer":"Esto es información general elaborada con IA, no asesoramiento fiscal personalizado."}

POST /api/chat (SSE, same question)
data: {"type":"delta","text":"El BOE lo regula en "}

data: {"type":"delta","text":"el artículo correspo"}

data: {"type":"delta","text":"ndiente "}

data: {"type":"delta","text":"."}

event: final
data: {"kind":"answer","explanation":"El BOE lo regula en el artículo correspondiente .", ... ,"citations":[{"passageId":"BOE-A-2007-6820#dtnovena", ...}]}

event: done
data: [DONE]

POST /api/chat - 2001-character message
HTTP 400
{"kind":"error","errorCode":"message_too_long","message":"La pregunta es demasiado larga. El límite es de 2.000 caracteres: acórtala y vuelve a intentarlo."}

POST /api/chat - extra field
{"kind":"error","errorCode":"unexpected_field","message":"La solicitud contiene campos que no están permitidos."}

POST /api/chat - DNI
event: final
data: {"kind":"privacy_warning","category":"dni","categoryLabel":"DNI","message":"No puedo procesar datos personales. He detectado un dato de tipo DNI. Reformula la pregunta sin incluirlo.","disclaimer":"Esto es información general elaborada con IA, no asesoramiento fiscal personalizado."}

POST /api/chat - IVA
event: final
data: {"kind":"out_of_scope","reasonCode":"iva","topicLabel":"el IVA","officialBody":"Agencia Tributaria","explanation":"Las preguntas sobre el IVA quedan fuera del alcance de esta herramienta: aquí solo explico el IRPF. Para el IVA, la administración competente es Agencia Tributaria.","handoffUrl":"mailto:asesoria@example.com","disclaimer":"Esto es información general elaborada con IA, no asesoramiento fiscal personalizado."}

Stub-side observation (proves the adapter built its request from config, with no tools):
STUB auth=Bearer k-live-verifier model=m-live hasTools=false id=BOE-A-2007-6820#dtnovena
STUB auth=Bearer k-live-verifier model=m-live hasTools=false id=BOE-A-2007-6820#dtnovena

Two stub calls for two chat turns: the privacy and IVA turns produced **no** stub call, i.e. those
guard paths short-circuited before the adapter, as AC-001-55 / AC-001-59 require.

## Evidence: build and type check

command: npx tsc --noEmit
exit: 0
at: 2026-10-22T18:01:04Z

(no output)

command: npm run build
exit: 0
at: 2026-10-22T18:01:08Z

> renta-clara@0.1.0 build
> next build

 Warning: Next.js inferred your workspace root, but it may not be correct.
 We detected multiple lockfiles and selected the directory of /home/dbueno/package-lock.json as the root directory.
 To silence this warning, set `outputFileTracingRoot` in your Next.js config, or consider removing one of the lockfiles if it's not needed.

   Next.js 15.5.28
   Creating an optimized production build ...
 Compiled successfully in 5.5s
   Linting and checking validity of types ...

 The Next.js plugin was not detected in your ESLint configuration.

 Generating static pages (4/4)
   Finalizing page optimization ...

Route (app)                                 Size  First Load JS
 /                                       6.67 kB         109 kB
 /_not-found                               995 B         104 kB
 /api/chat                                 127 B         103 kB
 /health                                   127 B         103 kB

(Static)   prerendered as static content
(Dynamic)  server-rendered on demand

## Evidence: corpus artifact re-read independently

command: node -e '<read corpus/corpus.json; print provenance, counts, hosts, article 20/63, sampled text>'
exit: 0
at: 2026-10-22T18:05:42Z

### corpus verify at 2026-10-22T18:05:42Z
schemaVersion=1 taxYear=2025 generatedAt=2026-10-22T17:49:01Z contentHash=2c3b850bc4fbcefcbd871c7b779eb1d40d908e9c7779861d9077868c481dee41
norms=2 passages=396 distinctPassageIds=396
norm BOE-A-2006-20764 | Ley 35/2006 del Impuesto sobre la Renta | boeUpdatedAt=2026-10-07 | fetchedAt=2026-10-22T17:48:51Z | https://www.boe.es/buscar/act.php?id=BOE-A-2006-20764
norm BOE-A-2007-6820 | Real Decreto 439/2007, Reglamento del IRPF | boeUpdatedAt=2026-10-07 | fetchedAt=2026-10-22T17:48:51Z | https://www.boe.es/buscar/act.php?id=BOE-A-2007-6820
hosts=["www.boe.es"]
article 20 present: BOE-A-2006-20764#a20,BOE-A-2007-6820#a20
article 63 present: BOE-A-2006-20764#a63,BOE-A-2007-6820#a63
sample a20 text: Artículo 20. Reducción por obtención de rendimientos del trabajo.
Los contribuyentes con rendimientos netos del trabajo inferiores a 19.747,5 euros siempre que no tengan rentas, ex
sample a63 text: Artículo 63. Escala general del Impuesto.
1. La parte de la base liquidable general que exceda del importe del mínimo personal y familiar a que se refiere el artículo 56 de esta Le

## No unaccounted behaviour - findings (not a command)

- V-01, V-02: the two guard FAILs above. The patterns do trace to Task 11's map, but their breadth
  contradicts the task's own definitions of `ibi` ("the IBI") and `filing_request` ("asks the product to
  file, sign, or represent"). Owner: **Coder** (behaviour).
- V-03, V-09, V-10: behaviour no task or scenario accounts for, recorded for the Architect rather than
  blocked on - `social_security` breadth, the corpus-unavailable 200 path, and malformed JSON mapping to
  `unexpected_field`.
- V-04: cosmetic Spanish typography (`correspondiente .`) produced by marker stripping; owner Coder.
- V-05: retrieval relevance against the real corpus; owner Architect / follow-up spec.
- Everything else under `src/` traced to a task on inspection: `src/config/env.ts` (Task 1),
  `src/domain/*` (Task 2), `src/corpus/{xml,parse-consolidated-xml,article-label}.ts` (Task 3),
  `src/corpus/{sync,sync-cli,artifact,boe-fetcher,fetcher}.ts` (Task 4), `src/retrieval/*` (Task 5),
  `src/evidence/build-evidence.ts` (Task 6), `src/llm/*` (Task 7), `src/prompts/*` (Task 8),
  `src/citations/*` (Task 9), `src/service/{answer-question,responses,conversation-store,types}.ts`
  (Task 10), `src/service/scope-guard.ts` + `src/content/scope-topics.ts` (Task 11),
  `src/service/privacy.ts` + `src/observability/log.ts` (Task 12),
  `src/server/{chat-route,corpus-loader,deps}.ts` + `src/service/rate-limit.ts` (Task 13),
  `src/server/health-route.ts` (Task 14), the twelve `src/components/*` directories + `src/app/page.tsx`
  + `src/content/{strings,format}.ts` + `src/styles/tokens.css` (Task 15; every component named in
  `15-design.md` §Document anatomy), `test/**` (Task 16), `docs/RUNBOOK.md` + `docs/adr/0001-*` +
  `docs/adr/0002-*` (Task 17).
- AC-001-52's clause "no emitted frame contains the unknown passageId" was confirmed by execution
  (`event: replace`, no `zz777` in any frame), not by reading the test.

## Not live-verified (explicitly)

- The **production** LLM provider path (a real `https://.../v1/chat/completions` call). No credentials
  and no network egress were available, and the suite is required to be offline. The adapter was
  exercised against a loopback stub over real HTTP instead; its status/error mapping is covered by
  AC-001-31 - AC-001-36 with a stubbed `fetch`.
- The **browser** UI. jsdom + React Testing Library coverage is green (21 tests in
  `AC-001-chat-ui.test.ts`), and the 360px / `:focus-visible` / inline-style rules were re-read in the
  CSS modules (`grep` found exactly one `width:` declaration across all component CSS -
  `width: var(--hairline-width)` - and no `em`/`rem` fixed widths), but no real browser was driven.
  Visual and contrast verification belongs to stage 5c against the live preview.
- `firstTokenMs` p95 under 5 s: non-enforceable in code per `10-tasks.md`'s closing note. The field is
  present in the log line (`firstTokenMs` observed as 18 ms and 4 ms against the stub), but a provider
  p95 is a deploy-stage measurement.
- Real CI (`Self CI`) and real-Vercel behaviour: stage 5b / 5c territory.

## Handoff

**Verdict FAIL - pipeline stops before stage 5a (Mutation Runner).**

Route to the **Coder** (behaviour):

1. Narrow `OUT_OF_SCOPE_TOPICS`'s `ibi` patterns in `src/content/scope-topics.ts` so the phrase
   "bienes inmuebles" no longer classifies as the IBI tax (the topic is the *Impuesto sobre Bienes
   Inmuebles*: `/\bibi\b/`, `/\bimpuesto sobre bienes inmuebles\b/`). Keep AC-001-56's three positive
   cases green.
2. Narrow the `filing_request` patterns so they match only a request addressed to the product to act
   (first/second person: "hazme", "prepárame", "presenta tú", "presentar por mí", "firma",
   "representa"), and stop matching third-person or impersonal deadline questions. Keep AC-001-58's two
   cases green.
3. Add regression tests for the negative case under Task 11's own wording. Unit tests in `test/unit/`
   are sufficient - no new acceptance scenario is required - covering at minimum the three questions
   reproduced in the spot-check block plus `¿Son deducibles las cotizaciones a la Seguridad Social de un
   autónomo en el IRPF?`.
4. Optional in the same round: V-04's marker-stripping whitespace.

Re-verification after the fix is **scoped** per `docs/SPEC_PIPELINE.md` §Re-verification: only the
"scenario-to-behavior spot check" gate (plus the full test suite, which is a single whole script and is
re-run as such) is re-executed; the traceability, complexity and design-principles results above stand
unchanged. This is **attempt 1 of the phase-1 budget (max 3)**.

Recommended for the human gate (not blocking this round): add negative-case scenarios to
`20-acceptance/AC-001-scope-guard.md` so a future pattern regression is caught by the traceability gate
rather than only by a Verifier spot check.

---

# Re-verification - attempt 2, phase 1

Scoped re-verification after the Coder's fix to `src/content/scope-topics.ts` for V-01 / V-02 (and the
deductibility half of V-03). Per `docs/SPEC_PIPELINE.md` §Re-verification this re-runs the previously
failing gate (scenario-to-behavior spot check) plus the whole-script gates, not the full attempt-1 set.
Every claim in the Coder's report was re-executed here rather than accepted.

## What changed - observed, not reported

| Artifact | mtime (UTC) | Reading |
|---|---|---|
| `src/content/scope-topics.ts` | 2026-10-22T18:10:18Z | the fix (after attempt 1 finished at 18:07:50Z) |
| `test/unit/text-and-guards.test.ts` | 2026-10-22T18:10:32Z | 17 -> 35 tests, i.e. the +18 regression tests |
| `src/service/scope-guard.ts` | 2026-10-22T17:54:59Z | untouched |
| all 17 `test/acceptance/AC-001-*.test.ts` | <= 2026-10-22T17:42:32Z | all predate attempt 1 - **no acceptance test touched** |

The "no acceptance test weakened" claim holds on two independent readings: (a) every acceptance file's
mtime predates attempt 1, and (b) every per-file test count is byte-identical to the attempt-1 transcript
in §Evidence: full test suite - only `test/unit/text-and-guards.test.ts` moved, 17 -> 35, which is where
the +18 lands. `test/acceptance/AC-001-scope-guard.test.ts` is still 101 lines and still asserts the same
contract (AC-001-55 `topicLabel`/`officialBody`/`callCount === 0`/no digits/no citations; AC-001-56 the
three regional messages; AC-001-58 `filing_request`, mixed message -> `iva`, and the map-import source
check).

## Cleared findings

- **V-01 - FIXED.** `¿Cómo tributan los rendimientos del alquiler de bienes inmuebles?` is now in scope,
  reaches retrieval (`bundle=sufficient`, 5 passages, first `BOE-A-2006-20764#a21`) and produces
  `kind:'answer'` with one validated citation (`citationValidation=pass`) carrying the real
  `boeUpdatedAt` 2026-10-07. The `ibi` topic is now `[/\bibi\b/, /impuesto sobre bienes inmuebles/]`.
- **V-02 - FIXED.** `¿Cuándo se presenta el borrador de la renta?` and
  `¿Cuándo presenta la declaración un contribuyente con dos pagadores?` are in scope and answered with a
  validated citation (first retrievals `#a44` and `#a83` respectively). `filing_request` no longer
  matches third-person or impersonal phrasings.
- **V-03 (deductibility) - FIXED.** `¿Son deducibles las cotizaciones a la Seguridad Social de un
  autónomo en el IRPF?` is in scope. The literal-quota case
  `¿Cómo afecta la cuota de autónomos a mi rendimiento neto?` is still refused as `social_security`,
  which is now **judged spec-compliant**: Task 11 lists the autónomo quota as an out-of-scope topic and
  states that out-of-scope wins a mixed message. Recorded, not blocking (V-14).
- True-positive refusals still behave: true IBI -> `[ibi]` / comunidad autónoma;
  `Preséntame la declaración de la renta` and `Representa me ante Hacienda` -> `[filing_request]` /
  Agencia Tributaria; every one with `adapterCalls=0`, no digits and no `citations` field. All seven
  AC-001-56 / AC-001-57 / AC-001-58 spot messages still return their expected reason codes with zero
  model calls.

## New findings (attempt 2)

| ID | Gate | Severity | Owner | Finding |
|---|---|---|---|---|
| V-12 | spot-check | **FAIL** | Coder | The new bare pattern `/\ben mi nombre\b/` refuses core IRPF deduction questions. `¿Puedo deducir el alquiler si el contrato está en mi nombre?` and `La vivienda está en mi nombre, ¿puedo deducir el alquiler?` return `out_of_scope` / `reasonCode: filing_request` / "la presentación de la declaración" / Agencia Tributaria - while retrieval **would** have produced a `sufficient` bundle for them (5 passages, first `BOE-A-2006-20764#dtdecimoquinta`, the vivienda-habitual transitional rule). "en mi nombre" is ordinary Spanish for ownership ("the contract is in my name"), not a representation request, so this is Task 11's `ibi` failure mode again: a right question answered wrongly. |
| V-13 | spot-check | **FAIL** | Coder | Pattern 1's alternation `(me|mela|melo|melas|melos|la|lo|las|los)` treats the **user's own** action as a request to the product. Refused as `filing_request`: `¿Puedo presentarla por internet?`, `Quiero presentarla yo mismo, ¿qué necesito?`, `¿Puedo firmarla con certificado digital?`, `Voy a presentarla el lunes, ¿está bien así?`. This is internally inconsistent with the Coder's own new test, which asserts `¿Puedo presentar mi declaración por internet?` stays in scope - the same question with an object pronoun is refused. Task 11's `filing_request` is "asks the product to file, sign, or represent"; these ask whether the *taxpayer* may. |
| V-14 | no-unaccounted | WARN | Coder | `¿Cómo afecta la cuota de autónomos a mi rendimiento neto?` is still refused as `social_security`. Judged spec-compliant (Task 11 names the autónomo quota as an out-of-scope topic; out-of-scope wins a mixed message), so recorded only. |
| V-15 | no-unaccounted | WARN | Coder | Under-refusal remains for some filing phrasings: `¿Puedes presentar mi declaración?`, `¿Me presentas la declaración?`, `Quiero que presentes la declaración por mí` reach the model. Not blocking - no scenario or task criterion requires paraphrase coverage (`10-tasks.md` §Explicitly out of scope: "not tested beyond what a criterion above requires"), and the failure mode is degrade-to-cited-answer, not a wrong refusal. Worth closing in the same round as V-12/V-13, since it is the mirror of the same boundary. |
| V-16 | spot-check | WARN | Coder | The 18 new tests were written to the fix's chosen phrasings rather than to the criterion's boundary, which is why the suite is green while V-12/V-13 are user-visible: the in-scope list covers `presentar mi declaración por internet` but not `presentarla por internet`, and no case covers "en mi nombre" as ownership. The next round's regressions should assert pronoun forms and ownership phrases, not only the three strings the Verifier quoted. |

Carried forward unchanged from attempt 1 (not re-run, still open): V-04 (marker-stripping whitespace),
V-05 (real-corpus retrieval relevance), V-06 (7 design-principles WARNs), V-07 / V-08 (gate-script and
environmental scope notes), V-09 / V-10 (unaccounted chat-route paths). V-06 was in fact re-run because
`src/content/scope-topics.ts` changed - see the attempt-2 design-principles block: still exit 0, 0 FAIL,
the same 7 WARNs.

## Evidence: scenario traceability (attempt 2)

command: .standards/scripts/check-scenario-traceability.sh --json
exit: 0
at: 2026-10-22T18:13:57Z

{
  "checks": [1, 2],
  "passes": ["AC-001-01 — traced to a test", "AC-001-02 — traced to a test", "AC-001-03 — traced to a test", "AC-001-04 — traced to a test", "AC-001-05 — traced to a test", "AC-001-06 — traced to a test", "AC-001-07 — traced to a test", "AC-001-08 — traced to a test", "AC-001-09 — traced to a test", "AC-001-10 — traced to a test", "AC-001-11 — traced to a test", "AC-001-12 — traced to a test", "AC-001-13 — traced to a test", "AC-001-14 — traced to a test", "AC-001-15 — traced to a test", "AC-001-16 — traced to a test", "AC-001-17 — traced to a test", "AC-001-18 — traced to a test", "AC-001-19 — traced to a test", "AC-001-20 — traced to a test", "AC-001-21 — traced to a test", "AC-001-22 — traced to a test", "AC-001-23 — traced to a test", "AC-001-24 — traced to a test", "AC-001-25 — traced to a test", "AC-001-26 — traced to a test", "AC-001-27 — traced to a test", "AC-001-28 — traced to a test", "AC-001-29 — traced to a test", "AC-001-30 — traced to a test", "AC-001-31 — traced to a test", "AC-001-32 — traced to a test", "AC-001-33 — traced to a test", "AC-001-34 — traced to a test", "AC-001-35 — traced to a test", "AC-001-36 — traced to a test", "AC-001-37 — traced to a test", "AC-001-38 — traced to a test", "AC-001-39 — traced to a test", "AC-001-40 — traced to a test", "AC-001-41 — traced to a test", "AC-001-42 — traced to a test", "AC-001-43 — traced to a test", "AC-001-44 — traced to a test", "AC-001-45 — traced to a test", "AC-001-46 — traced to a test", "AC-001-47 — traced to a test", "AC-001-48 — traced to a test", "AC-001-49 — traced to a test", "AC-001-50 — traced to a test", "AC-001-51 — traced to a test", "AC-001-52 — traced to a test", "AC-001-53 — traced to a test", "AC-001-54 — traced to a test", "AC-001-55 — traced to a test", "AC-001-56 — traced to a test", "AC-001-57 — traced to a test", "AC-001-58 — traced to a test", "AC-001-59 — traced to a test", "AC-001-60 — traced to a test", "AC-001-61 — traced to a test", "AC-001-62 — traced to a test", "AC-001-63 — traced to a test", "AC-001-64 — traced to a test", "AC-001-65 — traced to a test", "AC-001-66 — traced to a test", "AC-001-67 — traced to a test", "AC-001-68 — traced to a test", "AC-001-69 — traced to a test", "AC-001-70 — traced to a test", "AC-001-71 — traced to a test", "AC-001-72 — traced to a test", "AC-001-73 — traced to a test", "AC-001-74 — traced to a test", "AC-001-75 — traced to a test", "AC-001-76 — traced to a test", "AC-001-77 — traced to a test", "AC-001-78 — traced to a test", "AC-001-79 — traced to a test", "AC-001-80 — traced to a test", "AC-001-81 — traced to a test", "AC-001-82 — traced to a test", "AC-001-83 — traced to a test", "AC-001-84 — traced to a test", "AC-001-85 — traced to a test", "AC-001-86 — traced to a test", "AC-001-87 — traced to a test", "AC-001-88 — traced to a test"],
  "fails": []
}

## Evidence: full test suite (attempt 2)

command: npm test
exit: 0
at: 2026-10-22T18:13:44Z


> renta-clara@0.1.0 test
> vitest run


 RUN  v3.2.7 /home/dbueno/projects/tax-advisor

 ✓ test/unit/xml-and-parser.test.ts (12 tests) 44ms
 ✓ test/unit/sync-and-format.test.ts (6 tests) 54ms
 ✓ test/acceptance/AC-001-corpus-sync.test.ts (7 tests) 120ms
 ✓ test/acceptance/AC-001-app-scaffold-and-config.test.ts (9 tests) 254ms
 ✓ test/acceptance/AC-001-llm-adapter.test.ts (10 tests) 250ms
 ✓ test/acceptance/AC-001-offline-tests.test.ts (6 tests) 361ms
 ✓ test/acceptance/AC-001-answer-orchestration.test.ts (9 tests) 66ms
 ✓ test/acceptance/AC-001-boe-parser.test.ts (5 tests) 56ms
 ✓ test/acceptance/AC-001-health.test.ts (4 tests) 633ms
 ✓ test/unit/text-and-guards.test.ts (35 tests) 40ms
 ✓ test/acceptance/AC-001-privacy-and-logging.test.ts (8 tests) 724ms
 ✓ test/acceptance/AC-001-scope-guard.test.ts (5 tests) 38ms
 ✓ test/acceptance/AC-001-citation-validation.test.ts (6 tests) 40ms
 ✓ test/unit/boe-fetcher.test.ts (12 tests) 31ms
 ✓ test/unit/passage.test.ts (11 tests) 12ms
 ✓ test/acceptance/AC-001-lexical-retrieval.test.ts (6 tests) 17ms
 ✓ test/unit/boundaries.test.ts (4 tests) 13ms
 ✓ test/acceptance/AC-001-docs.test.ts (8 tests) 15ms
 ✓ test/unit/corpus-artifact.test.ts (12 tests) 10ms
 ✓ test/unit/config.test.ts (6 tests) 10ms
 ✓ test/acceptance/AC-001-prompt-assembly.test.ts (5 tests) 13ms
 ✓ test/unit/stores.test.ts (7 tests) 6ms
 ✓ test/acceptance/AC-001-evidence-sufficiency.test.ts (5 tests) 10ms
 ✓ test/acceptance/AC-001-passage-model.test.ts (6 tests) 9ms
 ✓ test/unit/normalize.test.ts (5 tests) 6ms
 ✓ test/acceptance/AC-001-chat-route.test.ts (8 tests) 1486ms
   ✓ AC-001-69 every error path returns JSON with a closed error code > AC-001-69: 503, 400, 429 and 504 all answer JSON with a closed code  460ms
   ✓ AC-001-70 route error handling leaks nothing and holds no stray state > AC-001-70: every adapter error maps to its fixed Spanish message  423ms
 ✓ test/unit/composer.test.tsx (3 tests) 144ms
 ✓ test/acceptance/AC-001-chat-ui.test.ts (21 tests) 2021ms

 Test Files  28 passed (28)
      Tests  241 passed (241)
   Start at  20:13:44
   Duration  5.67s (transform 1.43s, setup 736ms, collect 9.74s, tests 6.48s, environment 862ms, prepare 2.90s)

TEST_EXIT=0
### test end 2026-10-22T18:13:50Z

## Evidence: complexity gate (attempt 2)

command: npm run lint
exit: 0
at: 2026-10-22T18:13:53Z


> renta-clara@0.1.0 lint
> eslint .


command: npx tsc --noEmit
exit: 0
at: 2026-10-22T18:13:55Z

(no output)

(The attempt-1 non-vacuous probe stands: the same `complexity: ['error', 6]` rule config was read back
from `eslint.config.mjs`, unchanged in this round. The changed file is plain data/regex, no new
function.)

## Evidence: design-principles gate (attempt 2)

command: .standards/scripts/check-code-principles.sh ./src --tier mvp
exit: 0
at: 2026-10-22T18:14:18Z

Checking design principles in: ./src (tier: mvp)

WARN Method body >20 lines (node): ./src/components/SourceEntry/SourceEntry.tsx:17:41:SourceEntry:KISS_LINES=26
WARN Method body >20 lines (node): ./src/components/ChatScreen/ChatScreen.tsx:41:85:ChatScreen:KISS_LINES=46
WARN Method body >20 lines (node): ./src/components/Composer/Composer.tsx:25:62:Composer:KISS_LINES=31
WARN Method body >20 lines (node): ./src/components/AnswerBlock/AnswerBlock.tsx:20:44:AnswerBlock:KISS_LINES=26

--- DRY ---
WARN Possible duplication (2x identical 4-line block, first at ./src/domain/passage.ts:17): readonly sourceUrl: string; /readonly boeUpdatedAt: string; /readonly fetchedAt: string; /readonly text: string;
WARN Possible duplication (2x identical 4-line block, first at ./src/domain/passage.ts:12): readonly normTitle: string; /readonly blockId: string; /readonly blockTitle: string; /readonly normId: string;

--- YAGNI ---
WARN YAGNI: interface LlmAdapter has exactly one implementation (premature abstraction) — ./src/llm/types.ts:38

--- SOLID ---
PASS SOLID-SRP (node): no oversized files
PASS SOLID-OCP (node): no large type-dispatch chains
PASS SOLID-LSP (node): no heavy instanceof dispatch
PASS SOLID-ISP (node): no fat interfaces
PASS SOLID-DIP (java): no domain→infrastructure imports
PASS SOLID-DIP (go): no domain→infrastructure imports
PASS SOLID-DIP (node): no domain→infrastructure imports
PASS SOLID-DIP (python): no domain→infrastructure imports
PASS SOLID-DIP (rust): no domain→infrastructure imports

--- Component-per-file ---
PASS Component-per-file: no violations

--- Property tests ---
Property tests: skipped (project tier is mvp — production+ required)

---------------------------------------------
✔ Design-principles check: 0 FAIL(s), 7 WARN(s).
  WARNs are review hints — verify each before merging.

## Evidence: scenario-to-behavior spot check (attempt 2)

command: npx tsx /tmp/opencode/a2/probe-scope.mts  (scratch probe importing src/service/scope-guard.ts; deleted after the run)
exit: 0
at: 2026-10-22T18:14:03Z

=== A. previously-failing strings: must be IN SCOPE ===
  in scope    ¿Cómo tributan los rendimientos del alquiler de bienes inmuebles?
  in scope    ¿Cuándo se presenta el borrador de la renta?
  in scope    ¿Cuándo presenta la declaración un contribuyente con dos pagadores?
  in scope    ¿Son deducibles las cotizaciones a la Seguridad Social de un autónomo en el IRPF?
  in scope    ¿Puedo presentar mi declaración por internet?

=== B. must still be REFUSED with the expected reason code ===
  ok          ¿Cuánto es el IBI de mi vivienda?  -> [ibi] (expected ibi)
  ok          Preséntame la declaración de la renta  -> [filing_request] (expected filing_request)
  ok          Representa me ante Hacienda  -> [filing_request] (expected filing_request)
  ok          Hazme la declaración de la renta de 2024  -> [filing_request] (expected filing_request)
  ok          ¿Cuánto es la cuota de autónomos este año?  -> [social_security] (expected social_security)
  ok          ¿Puedo deducir el alquiler y cuánto IVA pago?  -> [iva] (expected iva)

=== C. NEW over-refusals introduced by attempt-2 patterns (in-scope IRPF questions) ===
  REFUSED [filing_request] la presentación de la declaración / Agencia Tributaria  ¿Puedo deducir el alquiler si el contrato está en mi nombre?
  REFUSED [filing_request] la presentación de la declaración / Agencia Tributaria  La vivienda está en mi nombre, ¿puedo deducir el alquiler?
  REFUSED [filing_request] la presentación de la declaración / Agencia Tributaria  ¿Puedo presentarla por internet?
  REFUSED [filing_request] la presentación de la declaración / Agencia Tributaria  Quiero presentarla yo mismo, ¿qué necesito?
  REFUSED [filing_request] la presentación de la declaración / Agencia Tributaria  ¿Puedo firmarla con certificado digital?
  REFUSED [filing_request] la presentación de la declaración / Agencia Tributaria  Voy a presentarla el lunes, ¿está bien así?

=== D. filing requests the narrowed map now MISSES ===
  IN SCOPE    ¿Puedes presentar mi declaración?
  IN SCOPE    ¿Me presentas la declaración?
  IN SCOPE    Quiero que presentes la declaración por mí

command: npx tsx /tmp/opencode/a2/probe-orch.mts  (scratch probe driving answerQuestion against the real corpus/corpus.json; deleted after the run)
exit: 0
at: 2026-10-22T18:14:11Z

=== A. the three V-01/V-02 strings: kind, adapter calls, validated citation (real corpus) ===
  ¿Cómo tributan los rendimientos del alquiler de bienes inmuebles?
    bundle=sufficient retrievals=5 first=BOE-A-2006-20764#a21
    kind=answer adapterCalls=1 citationValidation=pass citations=1 ids=BOE-A-2006-20764#a21 boeUpdatedAt=2026-10-07
  ¿Cuándo se presenta el borrador de la renta?
    bundle=sufficient retrievals=5 first=BOE-A-2006-20764#a44
    kind=answer adapterCalls=1 citationValidation=pass citations=1 ids=BOE-A-2006-20764#a44 boeUpdatedAt=2026-10-07
  ¿Cuándo presenta la declaración un contribuyente con dos pagadores?
    bundle=sufficient retrievals=5 first=BOE-A-2006-20764#a83
    kind=answer adapterCalls=1 citationValidation=pass citations=1 ids=BOE-A-2006-20764#a83 boeUpdatedAt=2026-10-07

=== B. true-positive refusals: reason code + zero model calls ===
  ok       ¿Cuánto es el IBI de mi vivienda? -> kind=out_of_scope reasonCode=ibi officialBody=la autoridad tributaria de tu comunidad autónoma adapterCalls=0 noDigits=true noCitations=true
  ok       Preséntame la declaración de la renta -> kind=out_of_scope reasonCode=filing_request officialBody=Agencia Tributaria adapterCalls=0 noDigits=true noCitations=true
  ok       Representa me ante Hacienda -> kind=out_of_scope reasonCode=filing_request officialBody=Agencia Tributaria adapterCalls=0 noDigits=true noCitations=true

=== C. V-12 regression: in-scope IRPF question refused by the new "en mi nombre" pattern ===
  ¿Puedo deducir el alquiler si el contrato está en mi nombre?
    retrieval WOULD return bundle=sufficient passages=5 first=BOE-A-2006-20764#dtdecimoquinta (Disposición transitoria decimoquinta)
    ACTUAL kind=out_of_scope reasonCode=filing_request topicLabel=la presentación de la declaración officialBody=Agencia Tributaria adapterCalls=0
    explanation: Las preguntas sobre la presentación de la declaración quedan fuera del alcance de esta herramienta: aquí solo explico el IRPF. Para la presentación de la declaración, la administración competente es Agencia Tributaria.
  La vivienda está en mi nombre, ¿puedo deducir el alquiler?
    retrieval WOULD return bundle=sufficient passages=5 first=BOE-A-2006-20764#dtdecimoquinta (Disposición transitoria decimoquinta)
    ACTUAL kind=out_of_scope reasonCode=filing_request topicLabel=la presentación de la declaración officialBody=Agencia Tributaria adapterCalls=0
    explanation: Las preguntas sobre la presentación de la declaración quedan fuera del alcance de esta herramienta: aquí solo explico el IRPF. Para la presentación de la declaración, la administración competente es Agencia Tributaria.

=== D. V-13 regression: the user filing THEMSELVES is refused as a request to us ===
  REFUSED ¿Puedo presentarla por internet? -> kind=out_of_scope reasonCode=filing_request adapterCalls=0
  REFUSED Quiero presentarla yo mismo, ¿qué necesito? -> kind=out_of_scope reasonCode=filing_request adapterCalls=0
  REFUSED ¿Puedo firmarla con certificado digital? -> kind=out_of_scope reasonCode=filing_request adapterCalls=0
  REFUSED Voy a presentarla el lunes, ¿está bien así? -> kind=out_of_scope reasonCode=filing_request adapterCalls=0

## Handoff - attempt 2

**Verdict FAIL - pipeline stops again, before stage 5a.**

Route to the **Coder** (behaviour). Two narrow corrections, both in `src/content/scope-topics.ts`:

1. **V-12:** remove the bare `/\ben mi nombre\b/` pattern, or require an adjacent filing/representation
   verb (`presentar/firmar/representar ... en mi nombre`). "El contrato está en mi nombre" must stay in
   scope.
2. **V-13:** drop `la|lo|las|los` from pattern 1's alternation so it no longer matches the user's own
   `presentarla / firmarla / hacerla`. Keep only the benefactive enclitics (`me`, `mela`, `melo`,
   `melas`, `melos`) - the forms that make the product the agent - and keep the filing-object
   requirement. `¿Puedo presentarla por internet?` must agree with the already-passing
   `¿Puedo presentar mi declaración por internet?`.
3. While there: close V-15's three phrasings if a wording can do it without re-introducing V-01/V-02.
4. Regressions must include, at minimum: the two "en mi nombre" ownership questions, the four
   pronoun-attached self-filing questions, and the three V-15 phrasings - asserted through
   `classifyScope` and, for one of them, through `answerQuestion` with a real retrieval bundle (V-16).

Re-verification after this fix is scoped the same way: spot check + the whole-script gates only.
**This consumed phase-1 attempt 2 of 3.** If attempt 3 fails, the phase-1 budget is exhausted and the
pipeline escalates to the human with these gate IDs and this evidence - no fourth re-verification.

---

# Re-verification - attempt 3, phase 1 (final; budget exhausted)

Scoped re-verification after the Coder rewrote the `filing_request` guard to key on *who is being
asked*. Everything below was re-executed by this Verifier; nothing is taken from the Coder's report.

## What changed - observed

| Artifact | mtime (UTC) | Reading |
|---|---|---|
| `src/content/scope-topics.ts` | 2026-10-22T18:16:48Z | the rewrite: 11 `filing_request` patterns keyed on second-person address, wish clauses, benefactive clitics |
| `test/unit/text-and-guards.test.ts` | 2026-10-22T18:16:51Z | 35 -> 53 tests (+18), situation-based variants |
| `src/service/scope-guard.ts` | 2026-10-22T17:54:59Z | untouched |
| `test/acceptance/AC-001-scope-guard.test.ts` | 2026-10-22T17:27:38Z | untouched - predates attempt 1 |

## Claim-by-claim

| Claim | Verdict | Evidence |
|---|---|---|
| V-12: "¿Puedo deducir el alquiler si el contrato está en mi nombre?" reaches retrieval and cites `#dtdecimoquinta` | **confirmed** | `bundle=sufficient`, `kind:'answer'`, `citationValidation=pass`, citation `BOE-A-2006-20764#dtdecimoquinta`, `boeUpdatedAt=2026-10-07`, `adapterCalls=1` |
| V-12: "La vivienda está a nombre de mi madre, ¿puedo deducir el alquiler?" likewise | **confirmed** | same bundle/citation/validation as above |
| V-13: the four self-filing phrasings are no longer `filing_request` | **confirmed** | none returns `filing_request`. "¿Puedo firmarla con certificado digital?" answered with a validated citation (`BOE-A-2007-6820#a120`); "¿Puedo presentarla por internet?", "Quiero presentarla yo mismo, ¿qué necesito?", "Voy a presentarla el lunes" abstain (`insufficient_evidence`, `adapterCalls=0`) - permitted by the claim and by Task 11 |
| True requests still refuse (7 given strings) | **confirmed 7/7** | every one `kind:'out_of_scope'`, `reasonCode:'filing_request'`, `officialBody:'Agencia Tributaria'`, `adapterCalls=0` |
| Suite 259 tests | **confirmed** | 28 files, 259 passed, exit 0 |
| No AC-001 assertion changed/weakened | **confirmed** | `AC-001-scope-guard.test.ts` still 101 lines / 4390 bytes / 23 `expect(` calls, mtime predates attempt 1, and every AC-001-55…58 assertion is present and unchanged; all 17 acceptance per-file counts identical to the attempt-1 transcript |
| Lint / tsc / build / traceability green | **confirmed** | lint exit 0; `tsc --noEmit` exit 0; `next build` exit 0 (compiled, 4 routes); traceability exit 0, 88 passes / 0 fails |

## New finding - blocking (V-17)

The rewrite fixes the product-directed direction completely (7/7 claimed refusals, plus the clitic
variants `¿Podrías presentármela tú?` and `Necesito que me presentes la declaración`), but it over-fires
on Spanish **generic *tú***: pattern 5,
`/\b(presentas|presentes|firmas|firmes|tramitas|tramites|representas|representes)\b[^.]{0,80}?\b(declaracion|declaraciones|renta|modelo|irpf)\b/`,
matches any second-person present tense followed by a filing noun, and Spanish uses that form for
"one/you" in subordinate clauses ("cuando presentas…", "si presentas…"). The orientation controls in
the same probe show the discrimination is on the wrong axis: first-person, third-person and infinitive
forms all stay in scope, only generic *tú* is misread as an address to the product.

| Probe (fresh - none of these appear in the Coder's table) | Wanted | Observed |
|---|---|---|
| `Si presentas la declaración conjunta, ¿cuánto te desgravas?` | in scope | `REFUSED [filing_request]` |
| `Cuando presentas el modelo 100, ¿qué plazo tienes?` | in scope | `REFUSED [filing_request]` |
| `Cuando presentas la declaración, ¿qué documentos necesitas?` | in scope | `REFUSED [filing_request]` |
| `Cuando firmas el modelo 100, ¿qué casillas marcas?` | in scope | `REFUSED [filing_request]` |
| `Cuando presentas la renta, ¿tienes que adjuntar justificantes?` | in scope | `REFUSED [filing_request]` |
| `Si firmas la declaración de tu cónyuge, ¿la tienes que presentar también?` | in scope | `REFUSED [filing_request]` |
| `Si presentas el borrador, ¿puedes corregirlo después?` | in scope | in scope *(only because "borrador" is absent from the noun list)* |
| `Puse el contrato a mi nombre, ¿puedo deducir el alquiler?` | in scope | in scope |
| `¿Hasta qué día puedo presentar la declaración este año?` | in scope | in scope |
| `Presenté la declaración ayer, ¿puedo corregirla?` | in scope | in scope |
| `¿Podrías presentármela tú?` | refuse | `REFUSED [filing_request]` |
| `Necesito que me presentes la declaración` | refuse | `REFUSED [filing_request]` |
| `¿Me la puedes preparar tú?` | refuse | in scope (under-refusal, V-18) |

The user-visible effect is not theoretical. For
`Si presentas la declaración conjunta, ¿cuánto te desgravas?` retrieval **would have returned a
sufficient bundle whose top hit is `BOE-A-2006-20764#a83` (Artículo 83)** - the article on joint
taxation - and the guard replaced that answer with
`out_of_scope / filing_request / "la presentación de la declaración" / Agencia Tributaria`,
`adapterCalls=0`. Same for `Cuando presentas el modelo 100, ¿qué plazo tienes?` (would have answered,
top hit `BOE-A-2007-6820#da`).

This contradicts Task 11's definition in the same way V-02, V-12 and V-13 did: `filing_request` is
"asks the product to file, sign, or represent". A generic-*tú* informational question asks the product
nothing. No acceptance scenario covers this shape - every guard scenario (`AC-001-55` … `AC-001-58`) is
a positive case - so the suite is green while the defect is user-visible, exactly as in attempts 1 and 2.

## Residual findings (non-blocking)

| ID | Severity | Owner | Finding |
|---|---|---|---|
| V-18 | WARN | Coder | Under-refusal persists for `¿Me la puedes preparar tú?` (second-person modal + split clitic, no attached enclitic): it reaches the model. Same family as V-15; degrades to a cited answer, not a wrong refusal. |
| V-19 | WARN | Coder | Pattern 5 has no structural defence against a subordinate clause; `Si presentas el borrador…` stays in scope only because "borrador" is not in its noun list, so the current in-scope set is partly accidental. Any fix should key on *sentence position / interrogative address*, not on the noun list. |

Carried forward unchanged from attempts 1-2 (still open, non-blocking): V-04 (marker-stripping whitespace),
V-05 (real-corpus retrieval relevance), V-06 (7 design-principles WARNs - re-run this round because a
`src/` file changed: still exit 0, 0 FAIL, identical 7 WARNs), V-07 / V-08 (gate-script and environmental
scope notes), V-09 / V-10 (unaccounted chat-route paths), V-14 (autónomo-quota refusal, judged
spec-compliant).

## Evidence: scenario traceability (attempt 3)

command: .standards/scripts/check-scenario-traceability.sh --json
exit: 0
at: 2026-10-22T18:19:16Z

{
  "checks": [1, 2],
  "passes": ["AC-001-01 — traced to a test", "AC-001-02 — traced to a test", "AC-001-03 — traced to a test", "AC-001-04 — traced to a test", "AC-001-05 — traced to a test", "AC-001-06 — traced to a test", "AC-001-07 — traced to a test", "AC-001-08 — traced to a test", "AC-001-09 — traced to a test", "AC-001-10 — traced to a test", "AC-001-11 — traced to a test", "AC-001-12 — traced to a test", "AC-001-13 — traced to a test", "AC-001-14 — traced to a test", "AC-001-15 — traced to a test", "AC-001-16 — traced to a test", "AC-001-17 — traced to a test", "AC-001-18 — traced to a test", "AC-001-19 — traced to a test", "AC-001-20 — traced to a test", "AC-001-21 — traced to a test", "AC-001-22 — traced to a test", "AC-001-23 — traced to a test", "AC-001-24 — traced to a test", "AC-001-25 — traced to a test", "AC-001-26 — traced to a test", "AC-001-27 — traced to a test", "AC-001-28 — traced to a test", "AC-001-29 — traced to a test", "AC-001-30 — traced to a test", "AC-001-31 — traced to a test", "AC-001-32 — traced to a test", "AC-001-33 — traced to a test", "AC-001-34 — traced to a test", "AC-001-35 — traced to a test", "AC-001-36 — traced to a test", "AC-001-37 — traced to a test", "AC-001-38 — traced to a test", "AC-001-39 — traced to a test", "AC-001-40 — traced to a test", "AC-001-41 — traced to a test", "AC-001-42 — traced to a test", "AC-001-43 — traced to a test", "AC-001-44 — traced to a test", "AC-001-45 — traced to a test", "AC-001-46 — traced to a test", "AC-001-47 — traced to a test", "AC-001-48 — traced to a test", "AC-001-49 — traced to a test", "AC-001-50 — traced to a test", "AC-001-51 — traced to a test", "AC-001-52 — traced to a test", "AC-001-53 — traced to a test", "AC-001-54 — traced to a test", "AC-001-55 — traced to a test", "AC-001-56 — traced to a test", "AC-001-57 — traced to a test", "AC-001-58 — traced to a test", "AC-001-59 — traced to a test", "AC-001-60 — traced to a test", "AC-001-61 — traced to a test", "AC-001-62 — traced to a test", "AC-001-63 — traced to a test", "AC-001-64 — traced to a test", "AC-001-65 — traced to a test", "AC-001-66 — traced to a test", "AC-001-67 — traced to a test", "AC-001-68 — traced to a test", "AC-001-69 — traced to a test", "AC-001-70 — traced to a test", "AC-001-71 — traced to a test", "AC-001-72 — traced to a test", "AC-001-73 — traced to a test", "AC-001-74 — traced to a test", "AC-001-75 — traced to a test", "AC-001-76 — traced to a test", "AC-001-77 — traced to a test", "AC-001-78 — traced to a test", "AC-001-79 — traced to a test", "AC-001-80 — traced to a test", "AC-001-81 — traced to a test", "AC-001-82 — traced to a test", "AC-001-83 — traced to a test", "AC-001-84 — traced to a test", "AC-001-85 — traced to a test", "AC-001-86 — traced to a test", "AC-001-87 — traced to a test", "AC-001-88 — traced to a test"],
  "fails": []
}

## Evidence: full test suite (attempt 3)

command: npm test
exit: 0
at: 2026-10-22T18:19:05Z

> renta-clara@0.1.0 test
> vitest run


 RUN  v3.2.7 /home/dbueno/projects/tax-advisor

 ✓ test/unit/sync-and-format.test.ts (6 tests) 52ms
 ✓ test/acceptance/AC-001-answer-orchestration.test.ts (9 tests) 56ms
 ✓ test/acceptance/AC-001-corpus-sync.test.ts (7 tests) 128ms
 ✓ test/acceptance/AC-001-app-scaffold-and-config.test.ts (9 tests) 273ms
 ✓ test/acceptance/AC-001-llm-adapter.test.ts (10 tests) 282ms
 ✓ test/acceptance/AC-001-offline-tests.test.ts (6 tests) 379ms
 ✓ test/unit/xml-and-parser.test.ts (12 tests) 51ms
 ✓ test/unit/boe-fetcher.test.ts (12 tests) 27ms
 ✓ test/acceptance/AC-001-health.test.ts (4 tests) 606ms
 ✓ test/acceptance/AC-001-citation-validation.test.ts (6 tests) 38ms
 ✓ test/acceptance/AC-001-privacy-and-logging.test.ts (8 tests) 721ms
 ✓ test/acceptance/AC-001-boe-parser.test.ts (5 tests) 33ms
 ✓ test/unit/text-and-guards.test.ts (53 tests) 42ms
 ✓ test/acceptance/AC-001-docs.test.ts (8 tests) 17ms
 ✓ test/acceptance/AC-001-scope-guard.test.ts (5 tests) 36ms
 ✓ test/unit/corpus-artifact.test.ts (12 tests) 9ms
 ✓ test/acceptance/AC-001-evidence-sufficiency.test.ts (5 tests) 10ms
 ✓ test/acceptance/AC-001-lexical-retrieval.test.ts (6 tests) 18ms
 ✓ test/unit/passage.test.ts (11 tests) 16ms
 ✓ test/unit/boundaries.test.ts (4 tests) 14ms
 ✓ test/acceptance/AC-001-prompt-assembly.test.ts (5 tests) 11ms
 ✓ test/unit/config.test.ts (6 tests) 12ms
 ✓ test/unit/normalize.test.ts (5 tests) 7ms
 ✓ test/acceptance/AC-001-passage-model.test.ts (6 tests) 8ms
 ✓ test/unit/stores.test.ts (7 tests) 8ms
 ✓ test/acceptance/AC-001-chat-route.test.ts (8 tests) 1441ms
   ✓ AC-001-69 every error path returns JSON with a closed error code > AC-001-69: 503, 400, 429 and 504 all answer JSON with a closed code  456ms
   ✓ AC-001-70 route error handling leaks nothing and holds no stray state > AC-001-70: every adapter error maps to its fixed Spanish message  436ms
 ✓ test/unit/composer.test.tsx (3 tests) 142ms
 ✓ test/acceptance/AC-001-chat-ui.test.ts (21 tests) 1990ms

 Test Files  28 passed (28)
      Tests  259 passed (259)
   Start at  20:19:06
   Duration  5.67s (transform 1.54s, setup 753ms, collect 9.81s, tests 6.43s, environment 830ms, prepare 2.97s)

## Evidence: complexity gate (attempt 3)

command: npm run lint
exit: 0
at: 2026-10-22T18:19:11Z

> renta-clara@0.1.0 lint
> eslint .

command: npx tsc --noEmit
exit: 0
at: 2026-10-22T18:19:14Z

(no output)

command: npm run build
exit: 0
at: 2026-10-22T18:19:25Z

> renta-clara@0.1.0 build
> next build

 ⚠ Warning: Next.js inferred your workspace root, but it may not be correct.
 We detected multiple lockfiles and selected the directory of /home/dbueno/package-lock.json as the root directory.
 To silence this warning, set `outputFileTracingRoot` in your Next.js config, or consider removing one of the lockfiles if it's not needed.
   See https://nextjs.org/docs/app/api-reference/config/next-config-js/output#caveats for more information.
 Detected additional lockfiles: 
   * /home/dbueno/projects/tax-advisor/package-lock.json

   ▲ Next.js 15.5.28

   Creating an optimized production build ...
 ✓ Compiled successfully in 5.6s
   Linting and checking validity of types ...

 ⚠ The Next.js plugin was not detected in your ESLint configuration. See https://nextjs.org/docs/app/api-reference/config/eslint#migrating-existing-config
   Collecting page data ...
   Generating static pages (0/4) ...
   Generating static pages (1/4) 
   Generating static pages (2/4) 
   Generating static pages (3/4) 
 ✓ Generating static pages (4/4)
   Finalizing page optimization ...
   Collecting build traces ...

Route (app)                                 Size  First Load JS
┌ ○ /                                    6.67 kB         109 kB
├ ○ /_not-found                            995 B         104 kB
├ ƒ /api/chat                              127 B         103 kB
└ ƒ /health                                127 B         103 kB
+ First Load JS shared by all             103 kB
  ├ chunks/255-b1e2483a7e02feee.js       46.6 kB
  ├ chunks/4bd1b696-c023c6e3521b1417.js  54.2 kB
  └ other shared chunks (total)          1.94 kB


○  (Static)   prerendered as static content
ƒ  (Dynamic)  server-rendered on demand

## Evidence: design-principles gate (attempt 3)

command: .standards/scripts/check-code-principles.sh ./src --tier mvp
exit: 0
at: 2026-10-22T18:19:16Z

Checking design principles in: ./src (tier: mvp)

WARN Method body >20 lines (node): ./src/components/SourceEntry/SourceEntry.tsx:17:41:SourceEntry:KISS_LINES=26
WARN Method body >20 lines (node): ./src/components/ChatScreen/ChatScreen.tsx:41:85:ChatScreen:KISS_LINES=46
WARN Method body >20 lines (node): ./src/components/Composer/Composer.tsx:25:62:Composer:KISS_LINES=31
WARN Method body >20 lines (node): ./src/components/AnswerBlock/AnswerBlock.tsx:20:44:AnswerBlock:KISS_LINES=26

--- DRY ---
WARN Possible duplication (2x identical 4-line block, first at ./src/domain/passage.ts:17): readonly sourceUrl: string; /readonly boeUpdatedAt: string; /readonly fetchedAt: string; /readonly text: string;
WARN Possible duplication (2x identical 4-line block, first at ./src/domain/passage.ts:12): readonly normTitle: string; /readonly blockId: string; /readonly blockTitle: string; /readonly normId: string;

--- YAGNI ---
WARN YAGNI: interface LlmAdapter has exactly one implementation (premature abstraction) — ./src/llm/types.ts:38

--- SOLID ---
PASS SOLID-SRP (node): no oversized files
PASS SOLID-OCP (node): no large type-dispatch chains
PASS SOLID-LSP (node): no heavy instanceof dispatch
PASS SOLID-ISP (node): no fat interfaces
PASS SOLID-DIP (java): no domain→infrastructure imports
PASS SOLID-DIP (go): no domain→infrastructure imports
PASS SOLID-DIP (node): no domain→infrastructure imports
PASS SOLID-DIP (python): no domain→infrastructure imports
PASS SOLID-DIP (rust): no domain→infrastructure imports

--- Component-per-file ---
PASS Component-per-file: no violations

--- Property tests ---
Property tests: skipped (project tier is mvp — production+ required)

---------------------------------------------
✔ Design-principles check: 0 FAIL(s), 7 WARN(s).
  WARNs are review hints — verify each before merging.

## Evidence: scenario-to-behavior spot check (attempt 3)

command: npx tsx /tmp/opencode/a3/probe-scope.mts  (scratch probe: claimed strings + fresh variants through classifyScope; deleted after the run)
exit: 0
at: 2026-10-22T18:18:36Z

=== A. claimed IN SCOPE ===
  ok        in scope  ¿Puedo deducir el alquiler si el contrato está en mi nombre?
  ok        in scope  La vivienda está a nombre de mi madre, ¿puedo deducir el alquiler?
  ok        in scope  ¿Puedo presentarla por internet?
  ok        in scope  Quiero presentarla yo mismo, ¿qué necesito?
  ok        in scope  ¿Puedo firmarla con certificado digital?
  ok        in scope  Voy a presentarla el lunes

=== B. claimed REFUSED (reason code must match) ===
  ok        REFUSED [filing_request] (expected filing_request)  ¿Puedes presentar mi declaración?
  ok        REFUSED [filing_request] (expected filing_request)  ¿Me presentas la declaración?
  ok        REFUSED [filing_request] (expected filing_request)  Quiero que presentes la declaración por mí
  ok        REFUSED [filing_request] (expected filing_request)  Preséntame la declaración
  ok        REFUSED [filing_request] (expected filing_request)  Trámítame el modelo 100
  ok        REFUSED [filing_request] (expected filing_request)  Hazme la declaración de 2024
  ok        REFUSED [filing_request] (expected filing_request)  ¿Podrías firmar mi declaración en mi nombre?

=== C. FRESH variants (generalisation, not table-fit) ===
  FAILED !  want=self    got=REFUSED [filing_request]     Cuando presentas la declaración, ¿qué documentos necesitas?   [generic-tu present tense + filing noun]
  FAILED !  want=self    got=REFUSED [filing_request]     Si firmas el modelo 100 esta semana, ¿qué pasa con el borrador?   [generic-tu + modelo]
  ok        want=self    got=in scope                     Puse el contrato a mi nombre, ¿puedo deducir el alquiler?   [ownership via "a mi nombre"]
  ok        want=self    got=in scope                     ¿Hasta qué día puedo presentar la declaración este año?   [deadline, first person]
  ok        want=self    got=in scope                     Presenté la declaración ayer, ¿puedo corregirla?   [past tense self-filing]
  ok        want=product got=REFUSED [filing_request]     ¿Podrías presentármela tú?   [clitic "mela" variant]
  ok        want=product got=REFUSED [filing_request]     Necesito que me presentes la declaración   [wish + benefactive "me"]
  FAILED !  want=product got=in scope                     ¿Me la puedes preparar tú?   [clitic "me la" split + product as agent]

problems against the asserted matrix: 3

command: npx tsx /tmp/opencode/a3/probe-orch.mts  (scratch probe: answerQuestion against the real corpus/corpus.json; deleted after the run)
exit: 0
at: 2026-10-22T18:19:00Z

=== A. claimed IN-SCOPE strings through answerQuestion (real corpus) ===
  ¿Puedo deducir el alquiler si el contrato está en mi nombre?
    bundle=sufficient first=BOE-A-2006-20764#dtdecimoquinta | kind=answer reasonCode=- adapterCalls=1 citationValidation=pass citations=BOE-A-2006-20764#dtdecimoquinta boeUpdatedAt=2026-10-07
  La vivienda está a nombre de mi madre, ¿puedo deducir el alquiler?
    bundle=sufficient first=BOE-A-2006-20764#dtdecimoquinta | kind=answer reasonCode=- adapterCalls=1 citationValidation=pass citations=BOE-A-2006-20764#dtdecimoquinta boeUpdatedAt=2026-10-07
  ¿Puedo presentarla por internet?
    bundle=insufficient first=BOE-A-2006-20764#davigesimaquinta | kind=insufficient_evidence reasonCode=- adapterCalls=0 citationValidation=not_applicable citations=- boeUpdatedAt=-
  Quiero presentarla yo mismo, ¿qué necesito?
    bundle=insufficient first=BOE-A-2006-20764#a49 | kind=insufficient_evidence reasonCode=- adapterCalls=0 citationValidation=not_applicable citations=- boeUpdatedAt=-
  ¿Puedo firmarla con certificado digital?
    bundle=sufficient first=BOE-A-2007-6820#a120 | kind=answer reasonCode=- adapterCalls=1 citationValidation=pass citations=BOE-A-2007-6820#a120 boeUpdatedAt=2026-10-07
  Voy a presentarla el lunes
    bundle=insufficient first=- | kind=insufficient_evidence reasonCode=- adapterCalls=0 citationValidation=not_applicable citations=- boeUpdatedAt=-

=== B. claimed REFUSALS through answerQuestion ===
  ok       kind=out_of_scope reasonCode=filing_request officialBody=Agencia Tributaria adapterCalls=0  ¿Puedes presentar mi declaración?
  ok       kind=out_of_scope reasonCode=filing_request officialBody=Agencia Tributaria adapterCalls=0  ¿Me presentas la declaración?
  ok       kind=out_of_scope reasonCode=filing_request officialBody=Agencia Tributaria adapterCalls=0  Quiero que presentes la declaración por mí
  ok       kind=out_of_scope reasonCode=filing_request officialBody=Agencia Tributaria adapterCalls=0  Preséntame la declaración
  ok       kind=out_of_scope reasonCode=filing_request officialBody=Agencia Tributaria adapterCalls=0  Trámítame el modelo 100
  ok       kind=out_of_scope reasonCode=filing_request officialBody=Agencia Tributaria adapterCalls=0  Hazme la declaración de 2024
  ok       kind=out_of_scope reasonCode=filing_request officialBody=Agencia Tributaria adapterCalls=0  ¿Podrías firmar mi declaración en mi nombre?

=== C. residual over-refusals: retrieval would have answered ===
  Si presentas la declaración conjunta, ¿cuánto te desgravas?
    retrieval WOULD return bundle=sufficient passages=5 first=BOE-A-2006-20764#a83 (Artículo 83)
    ACTUAL kind=out_of_scope reasonCode=filing_request topicLabel=la presentación de la declaración officialBody=Agencia Tributaria adapterCalls=0
  Cuando presentas el modelo 100, ¿qué plazo tienes?
    retrieval WOULD return bundle=sufficient passages=5 first=BOE-A-2007-6820#da (Disposición adicional novena)
    ACTUAL kind=out_of_scope reasonCode=filing_request topicLabel=la presentación de la declaración officialBody=Agencia Tributaria adapterCalls=0

command: npx tsx /tmp/opencode/a3/probe-radius.mts  (scratch probe: blast radius of the generic-*tú* over-match; deleted after the run)
exit: 0
at: 2026-10-22T18:18:47Z

REFUSED [filing_request]  Cuando presentas la declaración, ¿qué documentos necesitas?
REFUSED [filing_request]  Si presentas la declaración conjunta, ¿cuánto te desgravas?
REFUSED [filing_request]  Cuando firmas el modelo 100, ¿qué casillas marcas?
in scope            Si presentas el borrador, ¿puedes corregirlo después?
REFUSED [filing_request]  Cuando presentas la renta, ¿tienes que adjuntar justificantes?
REFUSED [filing_request]  Si firmas la declaración de tu cónyuge, ¿la tienes que presentar también?
REFUSED [filing_request]  Cuando presentas el modelo 100, ¿qué plazo tienes?
in scope            Cuando se presenta la declaración, ¿qué documentos se necesitan?
in scope            Cuando presento la declaración, ¿qué documentos necesito?
in scope            Al presentar la declaración, ¿qué documentos hay que adjuntar?

# Escalation - phase-1 budget exhausted

`docs/SPEC_PIPELINE.md` §Remediation budget caps the pre-PR loop at **3** attempts. This was attempt 3.
The pipeline stops here, before stage 5a (Mutation Runner). There is no fourth re-verification.

- **Failing gate ID:** `spot-check` (severity FAIL).
- **Finding:** V-17 - the `filing_request` guard over-fires on Spanish generic *tú*, refusing in-scope
  IRPF questions while a sufficient evidence bundle was available (`Artículo 83` for the joint-filing
  question; `Disposición adicional novena` for the modelo-100 deadline question). Six of seven fresh
  generic-*tú* variants were refused; the seventh stayed in scope only by accident (V-19).
- **Owner named by the fix-routing rule:** Coder (behaviour).
- **Historic pattern, for the record:** the same over-refusal class has now blocked all three attempts -
  attempt 1 V-01/V-02 (phrase-level patterns), attempt 2 V-12/V-13 (enclitic and ownership patterns),
  attempt 3 V-17 (second-person present tense). Each fix closed the reported strings and moved the
  over-match to an adjacent shape. The next change should be structural rather than another pattern
  tweak: decide the filing topic from *sentence position and interrogative address* (e.g. only a
  question-initial second-person verb, an explicit "¿tú…?", or a benefactive clitic `me/mela/melo`
  attached to the filing verb), and treat subordinate-clause markers (`cuando`, `si`, `mientras`, `al`)
  before the verb as generic-*tú*, not as address to the product.
- **Regression shape needed:** the seven generic-*tú* strings in the table above, asserted both through
  `classifyScope` and through `answerQuestion` with a real retrieval bundle, so a future fix cannot pass
  by moving the boundary again.

**Human decision required.** Options, in the order this Verifier recommends them:

1. Authorize one further remediation round **outside** the exhausted phase-1 budget, scoped to V-17 +
   V-19 (+ V-18 if cheap), then re-verify only the spot check and the whole-script gates.
2. Accept the residual as a known limitation: ship with the guard refusing generic-*tú* informational
   questions, and record it in `docs/RUNBOOK.md` / a follow-up spec. This is a product-quality decision,
   not a gate verdict - the Verifier does not clear it.

**What is already proven green and needs no re-work when the fix lands:** traceability (88/88), the full
suite (259/259), lint, `tsc`, `next build`, and the design-principles gate (0 FAIL, 7 WARN) all pass at
this commit; the acceptance tests still encode the original AC-001-55…58 contract unchanged.

---

# Re-verification - attempt 4 (authorized extra round; operative verdict)

Final check for the V-17/V-19 (+V-18) defect family, authorized by the human after the phase-1 budget
was exhausted at attempt 3. Scoped to the scope-guard behaviour plus the whole-script gates. Nothing
below is taken from the Coder's report.

## What changed - observed

| Artifact | mtime (UTC) | Reading |
|---|---|---|
| `src/content/filing-request.ts` | 2026-10-22T19:02:54Z | **new module**: 8 address forms, each anchored to message start (`^` after `head()`) or to a benefactive clitic |
| `src/content/scope-topics.ts` | 2026-10-22T19:01:02Z | topic entries now carry a `match` function; `filing_request` delegates to `isFilingRequest` |
| `src/service/scope-guard.ts` | 2026-10-22T19:01:02Z | unchanged shape (still imports the map; the AC-001-58 source assertion still passes) |
| `test/unit/text-and-guards.test.ts` | 2026-10-22T19:01:25Z | 53 -> 80 tests (+27), incl. one describe per address form |
| `test/acceptance/AC-001-scope-guard.test.ts` | 2026-10-22T17:27:38Z | untouched - still predates attempt 1 |

Why the structural change matters: every over-refusal in attempts 1-3 came from an unanchored
vocabulary pattern, so each fix moved the boundary. Here each form is anchored - `^` + shift-out
punctuation for the message-initial shapes, or an explicit `me`/`me la`/`mela` beneficiary - so a
subordinate clause (`si` / `cuando` / `mientras` / `al` + verb) cannot match by construction.

## Claim-by-claim

| Claim | Verdict | Evidence |
|---|---|---|
| V-17: `Si presentas la declaración conjunta, ¿cuánto te desgravas?` in scope, answered, retrieval top `#a83` | **confirmed** | `bundle=sufficient`, top `BOE-A-2006-20764#a83` (**Artículo 83** - joint taxation), `kind:'answer'`, `citationValidation=pass`, citation `#a83`, `boeUpdatedAt=2026-10-07`, `adapterCalls=1` |
| V-17: `Cuando presentas el modelo 100, ¿qué plazo tienes?` in scope | **confirmed** | answered, `bundle=sufficient`, top `BOE-A-2007-6820#da`, `citationValidation=pass` |
| V-17: `Cuando presentas la declaración, ¿qué documentos necesitas?` in scope | **confirmed** | answered, `bundle=sufficient`, top `BOE-A-2007-6820#a64`, `citationValidation=pass` |
| V-18: `¿Me la puedes preparar tú?` -> `filing_request`, `adapterCalls=0` | **confirmed** | `out_of_scope` / `filing_request` / AEAT / `adapterCalls=0` / no digits / no citations |
| Seven required true refusals | **confirmed 7/7** | all `out_of_scope` / `filing_request` / Agencia Tributaria / `adapterCalls=0` / no digits / no `citations` key |
| Four self-filing strings stay in scope | **confirmed 4/4** | none is `filing_request`; `¿Puedo firmarla con certificado digital?` answers with a validated citation (`BOE-A-2007-6820#a120`); the other three abstain - and the abstention is justified, not lazy: `buildEvidence` returns `insufficient` for each, i.e. the corpus genuinely lacks evidence about online filing and about what one needs to file |
| Suite 286 tests | **confirmed** | 28 files, 286 passed, exit 0 |
| No AC-001 assertion changed | **confirmed** | `AC-001-scope-guard.test.ts` byte-identical to the attempt-1 record: 101 lines, 4390 bytes, 23 `expect(` calls, mtime predates attempt 1; AC-001-55…58 assertions all present and unchanged; all 17 acceptance per-file counts identical to attempt 1 |
| Lint / tsc / build / traceability / design-principles green | **confirmed** | lint 0; `tsc --noEmit` 0; `next build` 0 (compiled, 4 routes); traceability 0 with 88 passes / 0 fails; design-principles 0 FAIL, 7 WARN (unchanged set) |

## Generalisation - 15 fresh variants the Coder never saw

Matrix: 15 required cases + 15 fresh. **26/30 matched expectation; every mismatch is a permissive
(under-refusal) direction except one, adjudicated below.**

| Fresh variant | Wanted | Observed |
|---|---|---|
| `Mientras presentas la declaración, ¿puedes consultar el borrador?` | in scope | in scope |
| `Si firmas el modelo 100 esta semana, ¿qué pasa con el plazo?` | in scope | in scope |
| `Cuando firmas la declaración de tu cónyuge, ¿la presentas también?` | in scope | in scope |
| `Cuando presento la declaración, ¿qué documentos necesito?` | in scope | in scope |
| `Si presentamos la declaración conjunta, ¿cuánto nos desgravamos?` | in scope | in scope |
| `Puse el contrato a mi nombre, ¿puedo deducir el alquiler?` | in scope | in scope |
| `¿Puedes explicarme cómo presentar la declaración por internet?` | in scope | in scope |
| `¿Me presentas el resumen de la escala del ahorro?` | in scope | in scope (polysemous "presentar" with a non-filing object) |
| `¿Me la explicas otra vez?` | in scope | in scope |
| `¿Me la preparas?` | refuse | `filing_request` |
| `¿Puedes hacer la declaración por mí?` | refuse | `filing_request` |
| `¿Me puedes presentar la declaración?` | refuse | **in scope** (V-20) |
| `¿Me podrías firmar el modelo 100?` | refuse | **in scope** (V-20) |
| `¿Puedes hacer la declaración de la renta?` | refuse | **in scope** (V-20) |
| `¿Puedo firmar en mi nombre o hace falta un gestor?` | in scope | **`filing_request`** (V-21) |

Plus a 20-question sweep of ordinary IRPF questions (deductions, escala, mínimo personal, pension plan
limit, dividendos, retención, conjunta, deadlines, correction of a filed return): **0 refused, 20/20 in
scope, every one with a `sufficient` bundle**.

Adjudication of the two mismatch directions against the human's PASS criterion (*"a mis-refusal of an
answerable question is a FAIL; an abstention is acceptable only when the corpus genuinely lacks
evidence"*):

- **V-20 (three under-refusals) - WARN, not a FAIL.** These are filing requests that reach the model, so
  the failure is permissive: the user receives a cited, informational answer (`#a98`, `#da`, `#a44` -
  all `sufficient` bundles) instead of a refusal. No wrong refusal, no false claim of filing, and the
  response still carries the AI disclosure. No scenario or task criterion requires paraphrase coverage
  (`10-tasks.md` §Explicitly out of scope: "not tested beyond what a criterion requires"). Recorded for
  a follow-up spec, not a blocker.
- **V-21 (one over-refusal) - recorded, not a FAIL.** `¿Puedo firmar en mi nombre o hace falta un
  gestor?` is a self-action question, but the corpus **genuinely lacks evidence** for it
  (`buildEvidence` returns `insufficient`, top `#dtoctava` below `minRetrievalScore`), so it is not the
  "answerable question mis-refused" case the criterion names; and signing/representation routing to the
  AEAT is what Task 11 prescribes for that topic. It is the only over-refusal found in 50 distinct
  messages this round, and it lands on an out-of-scope topic rather than an IRPF one.

## Residual findings (non-blocking)

| ID | Severity | Owner | Finding |
|---|---|---|---|
| V-20 | WARN | Coder (follow-up) | Three under-refused shapes reach the model: `me` + modal + filing verb + object (`¿Me puedes presentar la declaración?`, `¿Me podrías firmar el modelo 100?`) and modal + generic verb + object (`¿Puedes hacer la declaración de la renta?`). Permissive direction; degrades to a cited answer. |
| V-21 | WARN | Coder (follow-up) | `¿Puedo firmar en mi nombre o hace falta un gestor?` refuses as `filing_request` via the unanchored `REPRESENTATION_IN_MY_NAME` form. Not answerable from this corpus, and representing/signing is out of scope per Task 11, so recorded rather than blocked. |

Carried forward, unchanged and still non-blocking: V-04 (marker-stripping whitespace), V-05 (real-corpus
retrieval relevance), V-06 (the same 7 design-principles WARNs - re-run this round, 0 FAIL), V-07 / V-08
(gate-script and environmental scope notes), V-09 / V-10 (unaccounted chat-route paths), V-14
(autónomo-quota refusal, spec-compliant).

## Evidence: scenario traceability (attempt 4)

command: .standards/scripts/check-scenario-traceability.sh --json
exit: 0
at: 2026-10-22T19:06:19Z

{
  "checks": [1, 2],
  "passes": ["AC-001-01 — traced to a test", "AC-001-02 — traced to a test", "AC-001-03 — traced to a test", "AC-001-04 — traced to a test", "AC-001-05 — traced to a test", "AC-001-06 — traced to a test", "AC-001-07 — traced to a test", "AC-001-08 — traced to a test", "AC-001-09 — traced to a test", "AC-001-10 — traced to a test", "AC-001-11 — traced to a test", "AC-001-12 — traced to a test", "AC-001-13 — traced to a test", "AC-001-14 — traced to a test", "AC-001-15 — traced to a test", "AC-001-16 — traced to a test", "AC-001-17 — traced to a test", "AC-001-18 — traced to a test", "AC-001-19 — traced to a test", "AC-001-20 — traced to a test", "AC-001-21 — traced to a test", "AC-001-22 — traced to a test", "AC-001-23 — traced to a test", "AC-001-24 — traced to a test", "AC-001-25 — traced to a test", "AC-001-26 — traced to a test", "AC-001-27 — traced to a test", "AC-001-28 — traced to a test", "AC-001-29 — traced to a test", "AC-001-30 — traced to a test", "AC-001-31 — traced to a test", "AC-001-32 — traced to a test", "AC-001-33 — traced to a test", "AC-001-34 — traced to a test", "AC-001-35 — traced to a test", "AC-001-36 — traced to a test", "AC-001-37 — traced to a test", "AC-001-38 — traced to a test", "AC-001-39 — traced to a test", "AC-001-40 — traced to a test", "AC-001-41 — traced to a test", "AC-001-42 — traced to a test", "AC-001-43 — traced to a test", "AC-001-44 — traced to a test", "AC-001-45 — traced to a test", "AC-001-46 — traced to a test", "AC-001-47 — traced to a test", "AC-001-48 — traced to a test", "AC-001-49 — traced to a test", "AC-001-50 — traced to a test", "AC-001-51 — traced to a test", "AC-001-52 — traced to a test", "AC-001-53 — traced to a test", "AC-001-54 — traced to a test", "AC-001-55 — traced to a test", "AC-001-56 — traced to a test", "AC-001-57 — traced to a test", "AC-001-58 — traced to a test", "AC-001-59 — traced to a test", "AC-001-60 — traced to a test", "AC-001-61 — traced to a test", "AC-001-62 — traced to a test", "AC-001-63 — traced to a test", "AC-001-64 — traced to a test", "AC-001-65 — traced to a test", "AC-001-66 — traced to a test", "AC-001-67 — traced to a test", "AC-001-68 — traced to a test", "AC-001-69 — traced to a test", "AC-001-70 — traced to a test", "AC-001-71 — traced to a test", "AC-001-72 — traced to a test", "AC-001-73 — traced to a test", "AC-001-74 — traced to a test", "AC-001-75 — traced to a test", "AC-001-76 — traced to a test", "AC-001-77 — traced to a test", "AC-001-78 — traced to a test", "AC-001-79 — traced to a test", "AC-001-80 — traced to a test", "AC-001-81 — traced to a test", "AC-001-82 — traced to a test", "AC-001-83 — traced to a test", "AC-001-84 — traced to a test", "AC-001-85 — traced to a test", "AC-001-86 — traced to a test", "AC-001-87 — traced to a test", "AC-001-88 — traced to a test"],
  "fails": []
}

## Evidence: full test suite (attempt 4)

command: npm test
exit: 0
at: 2026-10-22T19:05:08Z

> renta-clara@0.1.0 test
> vitest run


 RUN  v3.2.7 /home/dbueno/projects/tax-advisor

 ✓ test/unit/sync-and-format.test.ts (6 tests) 110ms
 ✓ test/acceptance/AC-001-answer-orchestration.test.ts (9 tests) 87ms
 ✓ test/acceptance/AC-001-corpus-sync.test.ts (7 tests) 194ms
 ✓ test/acceptance/AC-001-app-scaffold-and-config.test.ts (9 tests) 446ms
 ✓ test/acceptance/AC-001-llm-adapter.test.ts (10 tests) 583ms
   ✓ AC-001-35 the upstream error body never reaches our client > AC-001-35: a 401 body echo is replaced by a fixed Spanish message  378ms
 ✓ test/acceptance/AC-001-offline-tests.test.ts (6 tests) 647ms
 ✓ test/unit/xml-and-parser.test.ts (12 tests) 72ms
 ✓ test/acceptance/AC-001-boe-parser.test.ts (5 tests) 87ms
 ✓ test/acceptance/AC-001-citation-validation.test.ts (6 tests) 52ms
 ✓ test/acceptance/AC-001-health.test.ts (4 tests) 1228ms
   ✓ AC-001-71 healthy when configuration and corpus are present > AC-001-71: a complete configuration and a loaded corpus answer 200 with ok checks  421ms
   ✓ AC-001-73 a missing or empty corpus degrades the corpus check > AC-001-73: absent, empty and unparsable corpora each fail only the corpus check  478ms
 ✓ test/acceptance/AC-001-privacy-and-logging.test.ts (8 tests) 1401ms
   ✓ AC-001-59 a DNI stops the turn before retrieval or the model > AC-001-59: the warning names DNI, the model is not called and the value is not echoed  314ms
   ✓ AC-001-60 NIE and IBAN are detected too > AC-001-60: both categories are named and neither raw value reaches the response or the log  474ms
   ✓ AC-001-61 fields the product must never accept are rejected > AC-001-61: an extra field is a 400 before any processing; message+conversationId is accepted  312ms
 ✓ test/unit/text-and-guards.test.ts (80 tests) 123ms
 ✓ test/unit/boe-fetcher.test.ts (12 tests) 44ms
 ✓ test/acceptance/AC-001-lexical-retrieval.test.ts (6 tests) 40ms
 ✓ test/acceptance/AC-001-scope-guard.test.ts (5 tests) 57ms
 ✓ test/unit/boundaries.test.ts (4 tests) 22ms
 ✓ test/acceptance/AC-001-docs.test.ts (8 tests) 25ms
 ✓ test/unit/config.test.ts (6 tests) 18ms
 ✓ test/acceptance/AC-001-prompt-assembly.test.ts (5 tests) 13ms
 ✓ test/acceptance/AC-001-evidence-sufficiency.test.ts (5 tests) 18ms
 ✓ test/unit/passage.test.ts (11 tests) 13ms
 ✓ test/unit/corpus-artifact.test.ts (12 tests) 19ms
 ✓ test/acceptance/AC-001-passage-model.test.ts (6 tests) 15ms
 ✓ test/acceptance/AC-001-chat-route.test.ts (8 tests) 2395ms
   ✓ AC-001-66 the 21st request in a window is rate limited > AC-001-66: the limit holds per IP and resets when the window rolls over  310ms
   ✓ AC-001-69 every error path returns JSON with a closed error code > AC-001-69: 503, 400, 429 and 504 all answer JSON with a closed code  731ms
   ✓ AC-001-70 route error handling leaks nothing and holds no stray state > AC-001-70: every adapter error maps to its fixed Spanish message  669ms
 ✓ test/unit/normalize.test.ts (5 tests) 6ms
 ✓ test/unit/stores.test.ts (7 tests) 9ms
 ✓ test/unit/composer.test.tsx (3 tests) 178ms
 ✓ test/acceptance/AC-001-chat-ui.test.ts (21 tests) 1952ms

 Test Files  28 passed (28)
      Tests  286 passed (286)
   Start at  21:05:09
   Duration  8.20s (transform 4.20s, setup 1.95s, collect 17.20s, tests 9.86s, environment 2.04s, prepare 6.37s)

## Evidence: complexity gate (attempt 4)

command: npm run lint
exit: 0
at: 2026-10-22T19:05:21Z

> renta-clara@0.1.0 lint
> eslint .

command: npx tsc --noEmit
exit: 0
at: 2026-10-22T19:05:23Z

(no output)

command: npm run build
exit: 0
at: 2026-10-22T19:05:26Z

> renta-clara@0.1.0 build
> next build

 ⚠ Warning: Next.js inferred your workspace root, but it may not be correct.
 We detected multiple lockfiles and selected the directory of /home/dbueno/package-lock.json as the root directory.
 To silence this warning, set `outputFileTracingRoot` in your Next.js config, or consider removing one of the lockfiles if it's not needed.
   See https://nextjs.org/docs/app/api-reference/config/next-config-js/output#caveats for more information.
 Detected additional lockfiles: 
   * /home/dbueno/projects/tax-advisor/package-lock.json

   ▲ Next.js 15.5.28

   Creating an optimized production build ...
 ✓ Compiled successfully in 11.9s
   Linting and checking validity of types ...

 ⚠ The Next.js plugin was not detected in your ESLint configuration. See https://nextjs.org/docs/app/api-reference/config/eslint#migrating-existing-config
   Collecting page data ...
   Generating static pages (0/4) ...
   Generating static pages (1/4) 
   Generating static pages (2/4) 
   Generating static pages (3/4) 
 ✓ Generating static pages (4/4)
   Finalizing page optimization ...
   Collecting build traces ...

Route (app)                                 Size  First Load JS
┌ ○ /                                    6.67 kB         109 kB
├ ○ /_not-found                            995 B         104 kB
├ ƒ /api/chat                              127 B         103 kB
└ ƒ /health                                127 B         103 kB
+ First Load JS shared by all             103 kB
  ├ chunks/255-b1e2483a7e02feee.js       46.6 kB
  ├ chunks/4bd1b696-c023c6e3521b1417.js  54.2 kB
  └ other shared chunks (total)          1.94 kB


○  (Static)   prerendered as static content
ƒ  (Dynamic)  server-rendered on demand

## Evidence: design-principles gate (attempt 4)

command: .standards/scripts/check-code-principles.sh src --tier mvp
exit: 0
at: 2026-10-22T19:06:19Z

Checking design principles in: src (tier: mvp)

WARN Method body >20 lines (node): src/components/SourceEntry/SourceEntry.tsx:17:41:SourceEntry:KISS_LINES=26
WARN Method body >20 lines (node): src/components/ChatScreen/ChatScreen.tsx:41:85:ChatScreen:KISS_LINES=46
WARN Method body >20 lines (node): src/components/Composer/Composer.tsx:25:62:Composer:KISS_LINES=31
WARN Method body >20 lines (node): src/components/AnswerBlock/AnswerBlock.tsx:20:44:AnswerBlock:KISS_LINES=26

--- DRY ---
WARN Possible duplication (2x identical 4-line block, first at src/domain/passage.ts:17): readonly sourceUrl: string; /readonly boeUpdatedAt: string; /readonly fetchedAt: string; /readonly text: string;
WARN Possible duplication (2x identical 4-line block, first at src/domain/passage.ts:12): readonly normTitle: string; /readonly blockId: string; /readonly blockTitle: string; /readonly normId: string;

--- YAGNI ---
WARN YAGNI: interface LlmAdapter has exactly one implementation (premature abstraction) — src/llm/types.ts:38

--- SOLID ---
PASS SOLID-SRP (node): no oversized files
PASS SOLID-OCP (node): no large type-dispatch chains
PASS SOLID-LSP (node): no heavy instanceof dispatch
PASS SOLID-ISP (node): no fat interfaces
PASS SOLID-DIP (java): no domain→infrastructure imports
PASS SOLID-DIP (go): no domain→infrastructure imports
PASS SOLID-DIP (node): no domain→infrastructure imports
PASS SOLID-DIP (python): no domain→infrastructure imports
PASS SOLID-DIP (rust): no domain→infrastructure imports

--- Component-per-file ---
PASS Component-per-file: no violations

--- Property tests ---
Property tests: skipped (project tier is mvp — production+ required)

---------------------------------------------
✔ Design-principles check: 0 FAIL(s), 7 WARN(s).
  WARNs are review hints — verify each before merging.

## Evidence: scenario-to-behavior spot check (attempt 4)

command: npx tsx /tmp/opencode/a4/probe-scope.mts  (scratch probe: 15 required + 15 fresh variants through classifyScope; deleted after the run)
exit: 0
at: 2026-10-22T19:04:29Z

=== classifyScope matrix (required + 15 fresh) ===
  ok       want=in_scope       got=in_scope       Si presentas la declaración conjunta, ¿cuánto te desgravas?   [V-17 generic tu, conditional]
  ok       want=in_scope       got=in_scope       Cuando presentas el modelo 100, ¿qué plazo tienes?   [V-17 generic tu, temporal]
  ok       want=in_scope       got=in_scope       Cuando presentas la declaración, ¿qué documentos necesitas?   [V-17 generic tu, temporal]
  ok       want=filing_request got=filing_request ¿Me la puedes preparar tú?   [V-18 benefactive clitic + modal]
  ok       want=filing_request got=filing_request ¿Puedes presentar mi declaración?   [question-initial modal]
  ok       want=filing_request got=filing_request ¿Me presentas la declaración?   [me + 2sg]
  ok       want=filing_request got=filing_request Quiero que presentes la declaración por mí   [wish + representation]
  ok       want=filing_request got=filing_request Preséntame la declaración   [imperative + clitic]
  ok       want=filing_request got=filing_request Trámítame el modelo 100   [imperative + clitic]
  ok       want=filing_request got=filing_request Hazme la declaración de 2024   [imperative generic + object]
  ok       want=filing_request got=filing_request ¿Podrías firmar mi declaración en mi nombre?   [modal + representation]
  ok       want=in_scope       got=in_scope       ¿Puedo presentarla por internet?   [1sg + enclitic la]
  ok       want=in_scope       got=in_scope       Voy a presentarla el lunes   [1sg periphrasis]
  ok       want=in_scope       got=in_scope       Quiero presentarla yo mismo, ¿qué necesito?   [1sg + yo mismo]
  ok       want=in_scope       got=in_scope       ¿Puedo firmarla con certificado digital?   [1sg + enclitic la]
  ok       want=in_scope       got=in_scope       Mientras presentas la declaración, ¿puedes consultar el borrador?   [F1 temporal generic tu]
  ok       want=in_scope       got=in_scope       Si firmas el modelo 100 esta semana, ¿qué pasa con el plazo?   [F2 conditional generic tu]
  ok       want=in_scope       got=in_scope       Cuando firmas la declaración de tu cónyuge, ¿la presentas también?   [F3 temporal generic tu, two verbs]
  ok       want=in_scope       got=in_scope       Cuando presento la declaración, ¿qué documentos necesito?   [F4 1sg self-filing]
  ok       want=in_scope       got=in_scope       Si presentamos la declaración conjunta, ¿cuánto nos desgravamos?   [F5 1pl self-filing]
  ok       want=in_scope       got=in_scope       Puse el contrato a mi nombre, ¿puedo deducir el alquiler?   [F6 ownership a mi nombre]
  ok       want=in_scope       got=in_scope       ¿Puedes explicarme cómo presentar la declaración por internet?   [F7 information request to the product]
  ok       want=in_scope       got=in_scope       ¿Me presentas el resumen de la escala del ahorro?   [F8 polysemous presentar, non-filing object]
  ok       want=filing_request got=filing_request ¿Me la preparas?   [F9 benefactive clitic, no modal]
  ok       want=filing_request got=filing_request ¿Puedes hacer la declaración por mí?   [F10 representation with generic verb]
  MISMATCH want=filing_request got=in_scope       ¿Me puedes presentar la declaración?   [F11 me + modal + filing verb + object]
  MISMATCH want=filing_request got=in_scope       ¿Me podrías firmar el modelo 100?   [F12 me + modal + filing verb + object]
  MISMATCH want=filing_request got=in_scope       ¿Puedes hacer la declaración de la renta?   [F13 modal + generic verb + object]
  MISMATCH want=in_scope       got=filing_request ¿Puedo firmar en mi nombre o hace falta un gestor?   [F14 self-action with en mi nombre]
  ok       want=in_scope       got=in_scope       ¿Me la explicas otra vez?   [F15 clitic + non-action verb]

mismatches: 4 / 30

command: npx tsx /tmp/opencode/a4/probe-orch.mts  (scratch probe: answerQuestion against the real corpus/corpus.json; deleted after the run)
exit: 0
at: 2026-10-22T19:04:53Z

=== A. V-17 strings: must be answered (real corpus), top retrieval id shown ===
  Si presentas la declaración conjunta, ¿cuánto te desgravas?
    retrieval: bundle=sufficient top=BOE-A-2006-20764#a83 (Artículo 83) score>=threshold
    response : kind=answer reasonCode=- adapterCalls=1 citationValidation=pass citations=BOE-A-2006-20764#a83 boeUpdatedAt=2026-10-07
  Cuando presentas el modelo 100, ¿qué plazo tienes?
    retrieval: bundle=sufficient top=BOE-A-2007-6820#da (Disposición adicional novena) score>=threshold
    response : kind=answer reasonCode=- adapterCalls=1 citationValidation=pass citations=BOE-A-2007-6820#da boeUpdatedAt=2026-10-07
  Cuando presentas la declaración, ¿qué documentos necesitas?
    retrieval: bundle=sufficient top=BOE-A-2007-6820#a64 (Artículo 64) score>=threshold
    response : kind=answer reasonCode=- adapterCalls=1 citationValidation=pass citations=BOE-A-2007-6820#a64 boeUpdatedAt=2026-10-07

=== B. required refusals: filing_request + adapterCalls 0 ===
  ok       kind=out_of_scope reasonCode=filing_request body=Agencia Tributaria adapterCalls=0 noDigits=true noCitations=true  ¿Me la puedes preparar tú?
  ok       kind=out_of_scope reasonCode=filing_request body=Agencia Tributaria adapterCalls=0 noDigits=true noCitations=true  ¿Puedes presentar mi declaración?
  ok       kind=out_of_scope reasonCode=filing_request body=Agencia Tributaria adapterCalls=0 noDigits=true noCitations=true  ¿Me presentas la declaración?
  ok       kind=out_of_scope reasonCode=filing_request body=Agencia Tributaria adapterCalls=0 noDigits=true noCitations=true  Quiero que presentes la declaración por mí
  ok       kind=out_of_scope reasonCode=filing_request body=Agencia Tributaria adapterCalls=0 noDigits=true noCitations=true  Preséntame la declaración
  ok       kind=out_of_scope reasonCode=filing_request body=Agencia Tributaria adapterCalls=0 noDigits=true noCitations=true  Trámítame el modelo 100
  ok       kind=out_of_scope reasonCode=filing_request body=Agencia Tributaria adapterCalls=0 noDigits=true noCitations=true  Hazme la declaración de 2024
  ok       kind=out_of_scope reasonCode=filing_request body=Agencia Tributaria adapterCalls=0 noDigits=true noCitations=true  ¿Podrías firmar mi declaración en mi nombre?

=== C. required self-filing: must NOT be filing_request ===
  ok       kind=insufficient_evidence bundle=insufficient top=BOE-A-2006-20764#davigesimaquinta adapterCalls=0 cV=not_applicable citations=-  ¿Puedo presentarla por internet?
  ok       kind=insufficient_evidence bundle=insufficient top=- adapterCalls=0 cV=not_applicable citations=-  Voy a presentarla el lunes
  ok       kind=insufficient_evidence bundle=insufficient top=BOE-A-2006-20764#a49 adapterCalls=0 cV=not_applicable citations=-  Quiero presentarla yo mismo, ¿qué necesito?
  ok       kind=answer                bundle=sufficient top=BOE-A-2007-6820#a120 adapterCalls=1 cV=pass citations=BOE-A-2007-6820#a120  ¿Puedo firmarla con certificado digital?

=== D. residual mismatches: what the user actually receives ===
  ¿Me puedes presentar la declaración?
    corpus evidence: bundle=sufficient top=BOE-A-2006-20764#a98 (Artículo 98)
    response: kind=answer reasonCode=- adapterCalls=1
  ¿Me podrías firmar el modelo 100?
    corpus evidence: bundle=sufficient top=BOE-A-2007-6820#da (Disposición adicional novena)
    response: kind=answer reasonCode=- adapterCalls=1
  ¿Puedes hacer la declaración de la renta?
    corpus evidence: bundle=sufficient top=BOE-A-2006-20764#a44 (Artículo 44)
    response: kind=answer reasonCode=- adapterCalls=1
  ¿Puedo firmar en mi nombre o hace falta un gestor?
    corpus evidence: bundle=insufficient top=BOE-A-2006-20764#dtoctava (Disposición transitoria octava)
    response: kind=out_of_scope reasonCode=filing_request adapterCalls=0

command: npx tsx /tmp/opencode/a4/probe-sweep.mts  (scratch probe: 20-question ordinary-IRPF sweep with retrieval status; deleted after the run)
exit: 0
at: 2026-10-22T19:05:04Z

=== broad in-scope sweep (real corpus) ===
  in scope  bundle=sufficient top=BOE-A-2007-6820#dtnovena  ¿Puedo deducirme el alquiler de mi vivienda habitual?
  in scope  bundle=sufficient top=BOE-A-2006-20764#a21  ¿Cómo tributan los rendimientos del alquiler de bienes inmuebles?
  in scope  bundle=sufficient top=BOE-A-2007-6820#a20  ¿Qué gastos puedo deducir del alquiler que cobro?
  in scope  bundle=sufficient top=BOE-A-2006-20764#a6  ¿Cómo funciona la reducción por obtención de rendimientos del trabajo?
  in scope  bundle=sufficient top=BOE-A-2007-6820#a84  ¿Cuál es el mínimo personal y familiar?
  in scope  bundle=sufficient top=BOE-A-2006-20764#a55  ¿Qué límite tiene la aportación a un plan de pensiones?
  in scope  bundle=sufficient top=BOE-A-2006-20764#dtvigesimasegunda  ¿Está exenta la indemnización por despido?
  in scope  bundle=sufficient top=BOE-A-2006-20764#a56  ¿Cómo se calcula la base liquidable general?
  in scope  bundle=sufficient top=BOE-A-2006-20764#a73  ¿Qué tipos aplica la escala general del impuesto?
  in scope  bundle=sufficient top=BOE-A-2006-20764#a34  ¿Puedo compensar pérdidas patrimoniales de años anteriores?
  in scope  bundle=sufficient top=BOE-A-2007-6820#dtcuarta  ¿Cómo tributan los dividendos en el IRPF?
  in scope  bundle=sufficient top=BOE-A-2006-20764#davigesimacuarta  ¿Qué retención se aplica a los rendimientos del trabajo?
  in scope  bundle=sufficient top=BOE-A-2006-20764#dtdecimoquinta  ¿Puedo deducir el alquiler si el contrato está en mi nombre?
  in scope  bundle=sufficient top=BOE-A-2006-20764#dtdecimoquinta  La vivienda está a nombre de mi madre, ¿puedo deducir el alquiler?
  in scope  bundle=sufficient top=BOE-A-2006-20764#a83  Cuando presentas la declaración conjunta, ¿qué mínimo se aplica?
  in scope  bundle=sufficient top=BOE-A-2006-20764#a83  Si presentamos la declaración conjunta, ¿qué reducción tenemos?
  in scope  bundle=sufficient top=BOE-A-2006-20764#a44  ¿Cuándo se presenta el borrador de la renta?
  in scope  bundle=sufficient top=BOE-A-2006-20764#a83  ¿Cuándo presenta la declaración un contribuyente con dos pagadores?
  in scope  bundle=sufficient top=BOE-A-2006-20764#a13  ¿Hasta qué día puedo presentar la declaración este año?
  in scope  bundle=sufficient top=BOE-A-2007-6820#a106  Presenté la declaración ayer, ¿puedo corregirla?

refused: 0 / 20

## Handoff - attempt 4

**Verdict PASS. The pipeline advances to stage 5a (Mutation Runner).**

- Failing gates: none. `spot-check` is cleared; traceability, test suite, complexity, build,
  design-principles and the spot check are all green with recorded evidence.
- Mutation Runner precondition: the Verifier PASS it waits for is this one. At `mvp` tier the runner
  records a skip (property tests and mutation testing are `production`+; see
  `docs/SPEC_PIPELINE.md` §Conformance tiers), then stage 5b may commit, push and open the draft PR.
- Nothing is outstanding for the Coder on this defect family. V-20 and V-21 are documented follow-up
  candidates, not conditions of this PASS.
- Two Verifier notes worth carrying into `30-report.md`: the report's `25-verification.md` evidence
  blocks remain the attempt-1 ones for the four non-spot-check gates (attempts 2-4 append suffixed
  blocks and the re-verification log makes the sequence auditable); and the acceptance suite still holds
  no negative-case scenario for the scope guard, so a future pattern regression of the V-01 class would
  again be visible only to a Verifier spot check - the human gate may want to add two or three
  negative scenarios to `20-acceptance/AC-001-scope-guard.md`.
