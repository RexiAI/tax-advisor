# 25-verification — spec 002 (advisor scope expansion)

Verifier stage 4, attempt 1, phase 1 (no remediation rounds yet).
Branch: `spec/002-advisor-scope-expansion` (dirty working tree, nothing committed).
Conformance tier: **mvp** (property tests and mutation testing are out of tier).

Information barrier respected: `00-informal.md` was not read. Verification is against
`10-tasks.md`, `20-acceptance/`, and `15-design.md` only.

## Overall verdict

**PASS** — every runnable gate ran and produced no findings in this spec's diff.

The two design-principles FAILs in the whole-repo run are pre-existing and **byte-identical
to `main`** (confirmed by empty `git diff main -- <path>` for each), so they are out of scope
for this spec; the diff-scoped gate (`-BaseRef main`) is clean (exit 0, 0 FAIL, 0 WARN). No
gate BLOCKed, no in-diff finding was produced.

---

## Evidence: scenario traceability

command: .standards/scripts/check-scenario-traceability.sh
exit: 0
at: 2026-10-25T17:40:30Z

Scenario IDs found: 33 live, 88 archived

PASS AC-002-01 — traced to a test
PASS AC-002-02 — traced to a test
PASS AC-002-03 — traced to a test
PASS AC-002-04 — traced to a test
PASS AC-002-05 — traced to a test
PASS AC-002-06 — traced to a test
PASS AC-002-07 — traced to a test
PASS AC-002-08 — traced to a test
PASS AC-002-09 — traced to a test
PASS AC-002-10 — traced to a test
PASS AC-002-11 — traced to a test
PASS AC-002-12 — traced to a test
PASS AC-002-13 — traced to a test
PASS AC-002-14 — traced to a test
PASS AC-002-15 — traced to a test
PASS AC-002-16 — traced to a test
PASS AC-002-17 — traced to a test
PASS AC-002-18 — traced to a test
PASS AC-002-19 — traced to a test
PASS AC-002-20 — traced to a test
PASS AC-002-21 — traced to a test
PASS AC-002-22 — traced to a test
PASS AC-002-23 — traced to a test
PASS AC-002-24 — traced to a test
PASS AC-002-25 — traced to a test
PASS AC-002-26 — traced to a test
PASS AC-002-27 — traced to a test
PASS AC-002-28 — traced to a test
PASS AC-002-29 — traced to a test
PASS AC-002-30 — traced to a test
PASS AC-002-31 — traced to a test
PASS AC-002-32 — traced to a test
PASS AC-002-33 — traced to a test

✔ Scenario traceability check: every scenario traced, every reference resolves.

---

## Evidence: full test suite

command: npm test
exit: 0
at: 2026-10-25T17:40:45Z

...
✓ test/acceptance/AC-002-corpus-sync.test.ts (7 tests) 1457ms
✓ test/acceptance/AC-001-answer-orchestration.test.ts (9 tests) 1487ms
✓ test/acceptance/AC-001-corpus-sync.test.ts (7 tests) 1668ms
✓ test/acceptance/AC-001-app-scaffold-and-config.test.ts (9 tests) 99ms
✓ test/acceptance/AC-001-citation-validation.test.ts (6 tests) 539ms
✓ test/acceptance/AC-002-scope-guard.test.ts (6 tests) 550ms
✓ test/unit/text-and-guards.test.ts (84 tests) 479ms
✓ test/unit/sync-and-format.test.ts (6 tests) 655ms
✓ test/acceptance/AC-001-health.test.ts (4 tests) 569ms
✓ test/unit/xml-and-parser.test.ts (12 tests) 64ms
✓ test/unit/format.test.ts (5 tests) 40ms
✓ test/unit/auth.test.ts (11 tests) 69ms
✓ test/unit/boe-fetcher.test.ts (12 tests) 37ms
✓ test/acceptance/AC-001-evidence-sufficiency.test.ts (5 tests) 96ms
✓ test/unit/gestor-guide.test.ts (10 tests) 22ms
✓ test/acceptance/AC-001-boe-parser.test.ts (5 tests) 51ms
✓ test/unit/chat-submit.test.ts (5 tests) 29ms
✓ test/acceptance/AC-001-chat-route.test.ts (8 tests) 2703ms
✓ test/acceptance/AC-001-lexical-retrieval.test.ts (6 tests) 31ms
✓ test/unit/config.test.ts (6 tests) 15ms
✓ test/unit/boundaries.test.ts (4 tests) 18ms
✓ test/acceptance/AC-001-docs.test.ts (8 tests) 22ms
✓ test/unit/corpus-artifact.test.ts (12 tests) 16ms
✓ test/acceptance/AC-002-allowed-norms.test.ts (3 tests) 12ms
✓ test/unit/normalize.test.ts (8 tests) 22ms
✓ test/unit/stores.test.ts (7 tests) 9ms
✓ test/unit/allowed-norms.test.ts (3 tests) 15ms
✓ test/acceptance/AC-002-adr.test.ts (6 tests) 16ms
✓ test/acceptance/AC-001-passage-model.test.ts (6 tests) 14ms
✓ test/unit/passage.test.ts (11 tests) 14ms
✓ test/acceptance/AC-002-docs.test.ts (6 tests) 13ms
✓ test/acceptance/AC-001-prompt-assembly.test.ts (5 tests) 8ms
✓ test/unit/composer.test.tsx (3 tests) 187ms
✓ test/acceptance/AC-002-copy-and-links.test.ts (6 tests) 498ms
✓ test/acceptance/AC-002-registration-path.test.ts (8 tests) 696ms
✓ test/acceptance/AC-002-reinforced-disclaimer.test.ts (9 tests) 1195ms
✓ test/acceptance/AC-001-chat-ui.test.ts (21 tests) 2213ms

 Test Files  44 passed (44)
      Tests  405 passed (405)
   Start at  18:40:25
   Duration  9.91s (transform 2.06s, setup 934ms, collect 23.13s, tests 22.14s, environment 2.66s, prepare 5.88s)

---

## Evidence: type-check

command: npx tsc --noEmit
exit: 0
at: 2026-10-25T17:41:20Z

(no output — clean)

---

## Evidence: production build

command: npm run build
exit: 0
at: 2026-10-25T17:42:00Z

> renta-clara@0.1.0 build
> next build

   ▲ Next.js 15.5.28
   - Environments: .env.local

   Creating an optimized production build ...
 ✓ Compiled successfully in 8.8s
   Linting and checking validity of types ...

 ⚠ The Next.js plugin was not detected in your ESLint configuration. See https://nextjs.org/docs/app/api-reference/config/eslint#migrating-existing-config
   Collecting page data ...
   Generating static pages (0/7) ...
 ✓ Generating static pages (7/7)
   Finalizing page optimization ...
   Collecting build traces ...

Route (app)                                 Size  First Load JS
┌ ○ /                                    7.73 kB         110 kB
├ ○ /_not-found                            995 B         104 kB
├ ƒ /api/auth/login                        133 B         103 kB
├ ƒ /api/auth/logout                       133 B         103 kB
├ ƒ /api/chat                              133 B         103 kB
├ ƒ /health                                133 B         103 kB
└ ƒ /login                               2.33 kB         105 kB
+ First Load JS shared by all             103 kB

(The build succeeds; the ESLint-plugin warning is a pre-existing config notice, not a
failure — `npm run lint` below is the authority for lint.)

---

## Evidence: complexity gate

command: npm run lint
exit: 0
at: 2026-10-25T17:41:20Z

> renta-clara@0.1.0 lint
> eslint .

(no output — zero violations; `complexity: [error,6]` and `no-explicit-any` pass)

---

## Evidence: design-principles gate

command: .standards/scripts/check-code-principles.sh .
exit: 1
at: 2026-10-25T17:42:40Z
scope: whole repo

Checking design principles in: . (tier: mvp)

PASS Complexity/KISS (java): no violations found
WARN Method body >20 lines (go): ./.standards/ci/templates/go-saga-lint.go:45:71:main:KISS_LINES=28
WARN Method body >20 lines (go): ./.standards/ci/templates/go-saga-lint.go:101:124:checkCompensationPairs:KISS_LINES=25
FAIL Cyclomatic complexity >6 (node): ./.standards/skills/hallmark/site/examples/cobalt-01/script.js:7:90::CC=10
WARN Method body >20 lines (node): ./.standards/skills/hallmark/site/examples/cobalt-01/script.js:7:90::KISS_LINES=41
WARN Method body >20 lines (node): ./.standards/skills/hallmark/site/examples/cobalt-01/script.js:93:225::KISS_LINES=43
WARN Method body >20 lines (node): ./src/components/SourceEntry/SourceEntry.tsx:17:41:SourceEntry:KISS_LINES=26
FAIL Cyclomatic complexity >6 (node): ./src/components/LoginForm/LoginForm.tsx:17:100:LoginForm:CC=8
WARN Method body >20 lines (node): ./src/components/LoginForm/LoginForm.tsx:17:100:LoginForm:KISS_LINES=79
WARN Method body >20 lines (node): ./src/components/Composer/Composer.tsx:27:64:Composer:KISS_LINES=31
WARN Method body >20 lines (node): ./src/components/Header/Header.tsx:14:35:Header:KISS_LINES=23

--- DRY ---
WARN Possible duplication (56x identical 4-line block, first at ./.next/types/app/api/auth/login/route.ts:122): >() /checkFields< /Diff< />
WARN Possible duplication (28x identical 4-line block, first at ./.next/types/app/api/auth/login/route.ts:123): checkFields< /Diff< /ParamCheck<RouteContext>, />()
WARN Possible duplication (12x identical 4-line block, first at ./.next/types/app/api/auth/login/route.ts:276): 'PATCH' /> />() /},
WARN Possible duplication (12x identical 4-line block, first at ./.next/types/app/api/auth/login/route.ts:120): 'OPTIONS' /> />() /},
WARN Possible duplication (12x identical 4-line block, first at ./.next/types/app/api/auth/login/route.ts:237): 'DELETE' /> />() /},
WARN Possible duplication (8x identical 4-line block, first at ./.next/types/app/api/auth/login/route.ts:199): > />() /checkFields< /'PUT'
WARN Possible duplication (8x identical 4-line block, first at ./.next/types/app/api/auth/login/route.ts:160): > />() /checkFields< /'POST'
WARN Possible duplication (8x identical 4-line block, first at ./.next/types/app/api/auth/login/route.ts:277): > />() /checkFields< /'PATCH'
WARN Possible duplication (8x identical 4-line block, first at ./.next/types/app/api/auth/login/route.ts:121): > />() /checkFields< /'OPTIONS'
WARN Possible duplication (8x identical 4-line block, first at ./.next/types/app/api/auth/login/route.ts:82): > />() /checkFields< /'HEAD'

--- YAGNI ---
WARN Empty method body (java): ./.standards/ci/templates/archunit/OutboxArchRules.java:30
WARN Empty method body (java): ./.standards/ci/templates/archunit/SagaArchRules.java:33
PASS YAGNI (go): no premature abstractions detected
WARN YAGNI: interface CorpusFetcher has exactly one implementation (premature abstraction) — ./src/corpus/fetcher.ts:12

--- SOLID ---
PASS SOLID-SRP (java): no oversized files
PASS SOLID-SRP (go): no oversized files
PASS SOLID-SRP (node): no oversized files
PASS SOLID-OCP (java): no large type-dispatch chains
PASS SOLID-OCP (go): no large type-dispatch chains
PASS SOLID-OCP (node): no large type-dispatch chains
PASS SOLID-LSP (java): no heavy instanceof dispatch
WARN LSP: 4 instanceof checks in one file (node) — ./.next/server/chunks/714.js (suggests broken substitutability or type dispatch)
PASS SOLID-ISP (java): no fat interfaces
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
✘ Design-principles check: 2 FAIL(s), 22 WARN(s).
  Reference: docs/CODING_CONVENTIONS.md §Design Principles, docs/ARCHITECTURE.md, docs/TESTING.md

### Whole-repo FAIL disposition (pre-existing, out of scope)

Both FAILs are **byte-identical to `main`** — confirmed by empty diff, so neither is in
this spec's diff and neither blocks it:

- `./.standards/skills/hallmark/site/examples/cobalt-01/script.js:7:90::CC=10` — vendored example
  inside the `.standards` submodule. `git diff main -- <path>` → empty.
- `./src/components/LoginForm/LoginForm.tsx:17:100:LoginForm:CC=8` — pre-existing.
  `git diff main -- src/components/LoginForm/LoginForm.tsx` → empty.

---

## Evidence: design-principles gate (diff-scoped)

command: .standards/scripts/check-code-principles.sh . -BaseRef main
exit: 0
at: 2026-10-25T17:43:00Z

Checking design principles in: . (tier: mvp)

PASS Complexity/KISS (java): no violations found

--- DRY ---

--- YAGNI ---
PASS YAGNI (go): no premature abstractions detected

--- SOLID ---
PASS SOLID-SRP (java): no oversized files
PASS SOLID-SRP (go): no oversized files
PASS SOLID-SRP (node): no oversized files
PASS SOLID-OCP (java): no large type-dispatch chains
PASS SOLID-OCP (go): no large type-dispatch chains
PASS SOLID-OCP (node): no large type-dispatch chains
PASS SOLID-LSP (java): no heavy instanceof dispatch
PASS SOLID-ISP (java): no fat interfaces
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
✔ Design-principles check: 0 FAIL(s), 0 WARN(s).

---

## Evidence: scenario-to-behavior spot check

command: (manual read of test + source + scenario; no shell command)
exit: 0
at: 2026-10-25T17:43:40Z

Six scenarios across five tasks were opened and matched test assertion → scenario text:

1. **AC-002-01/02/03 (Task 1)** — `test/acceptance/AC-002-allowed-norms.test.ts`. The test
   pins the six new `normId`/`normTitle` pairs verbatim (matching `10-tasks.md` Task 1 table),
   asserts `ALLOWED_NORMS.length === 8`, `isAllowedNorm` true for new norms, `createPassage`
   returns `{ok:false, error:'unsupported_norm'}` for `BOE-A-2004-4214`, and `boeSourceUrl`
   resolves per entry. Real, not vacuous. Confirmed `src/domain/allowed-norms.ts` carries the
   same 8 ids in the same order, and `corpus/corpus.json` agrees exactly (8 norms, same ids).

2. **AC-002-08/09/10/11 (Task 3)** — `test/acceptance/AC-002-scope-guard.test.ts`. Asserts
   `classifyScope` returns `null` for the three newly answerable messages, that
   `OUT_OF_SCOPE_TOPICS` holds exactly the six remaining reason codes in order, that a filing
   request naming IVA still resolves to `filing_request` (first-match-wins), and that
   «preséntame el 303» is `out_of_scope` with `adapter.callCount === 0`. Matches the scenario
   and the narrowed `OutOfScopeReasonCode` union in `src/content/scope-topics.ts` verbatim.

3. **AC-002-12/13/14/15 (Task 4)** — `test/acceptance/AC-002-registration-path.test.ts`.
   Asserts `src/content/autonomo.ts` no longer exists and no `src/` module references its
   constants; the `out_of_scope` payload has exactly the seven fields (no `steps`/`links`);
   `OutOfScopeResponse` declares no `steps`/`links` (confirmed in `src/service/types.ts`); and
   the alta end-to-end reaches retrieval and calls the model once, never returning
   `out_of_scope` with fixed steps. Real.

4. **AC-002-22/23 (Task 6)** — `test/acceptance/AC-002-no-hardcoded-quantities.test.ts`.
   Asserts the year notice on «¿cuánto IVA pago en 2024?» contains «2025» and «2024», and that
   «¿cuánto IVA pago?»/«en 2025?» carry none; an invented figure backed by an unretrieved
   citation is dropped to `insufficient_evidence` and the payload contains no `312`/`art-inventado`.
   Real.

5. **AC-002-24/25 (Task 7)** — `test/acceptance/AC-002-reinforced-disclaimer.test.ts`.
   Asserts `REINFORCED_SCOPE_DISCLAIMER` equals the verbatim string (confirmed byte-identical in
   `src/content/strings.ts`), that `NON_IRPF_NORM_IDS` has six members with a membership
   predicate, and that an answer citing a non-IRPF norm carries the field while an IRPF-only
   answer does not (confirmed `AnswerResponse.scopeDisclaimer?: string` in `types.ts`). Real.

6. **AC-002-27 (Task 8)** — refusal copy: `OUT_OF_SCOPE_EXPLANATION` in `strings.ts` now reads
   «Lo que sí cubro… es el IRPF, el IVA y el ciclo fiscal del autónomo» and no longer contains
   «solo explico el IRPF» / «explico el IRPF»; `test/acceptance/AC-002-copy-and-links.test.ts`
   asserts the string is absent from an `out_of_scope` payload. Real.

### Load-bearing spot checks (adjudicated)

**AC-002-26 ordering — real, not a tautology.** `test/acceptance/AC-002-reinforced-disclaimer.test.ts`
asserts `scopeIndex === aiIndex + 1`, where `aiIndex = indexOf(withScope.disclaimer)` and
`scopeIndex = indexOf(EXPECTED_DISCLAIMER)` over the `article`'s paragraph order. The AI
disclaimer and the reinforced scope line are two distinct strings; `indexOf` finds the first
occurrence of each, and the equality requires the scope paragraph to sit *immediately* after
the AI-disclaimer paragraph. `AnswerBlock` renders `AnswerDisclaimers` as `<p>{disclaimer}</p>`
then `<p>{scopeDisclaimer}</p>` (footer order: AI disclosure → reinforced line), after the
`[aria-live]` body. Reordering the scope line ahead of the AI line, or interposing any paragraph
between them, breaks the assertion; a missing scope line yields `scopeIndex === -1`, which can
never equal `aiIndex + 1` (with `aiIndex >= 0` asserted). Not a tautology. The companion
`the answer body still comes first` test verifies the body (`[aria-live]`) precedes the
reinforced line via `compareDocumentPosition`, matching the adjudication (15-design §Reinforced
disclaimer, item 3) which dropped the unconditional `ANSWER_BOUNDARY` paragraph and left the
footer at `AI_DISCLOSURE` → `scopeDisclaimer`. The `ANSWER_BOUNDARY` constant survives, composed
into `GUIDE_FOOTER` only, with its doc comment updated exactly as item 5 required.

**AC-002-21 no-hardcoded-quantities — a real but heuristic gate, with one scope limitation.**
`test/acceptance/AC-002-no-hardcoded-quantities.test.ts` extracts *string literals only*
(`STRING_LITERAL` matches `'…'`/`"…"`/backtick; regex literals like `/modelo (303|390|036)/`
are never extracted, so model-identifier *matchers* are excluded by construction, not by an
explicit whitelist) from `src/content` + `src/prompts` and fails on any literal matching
`/\d+\s*%/`, `/€/`, or a quantity phrase (`cuota|base de cotizacion|tramo|tarifa|tipo de iva|importe`)
followed by a digit within 24 chars. It is **not** self-fulfilling: a hardcoded «cuota de 312
euros», «21%», or «€40» in content/prompts would fail it. Limitations, recorded not suppressed:
(a) it covers only `src/content` + `src/prompts`, not all of `src/` that AC-002-21's scenario
text names, so a figure hardcoded in `src/components`/`src/service` would not be caught by this
test (only by the human read-audit); (b) the patterns are heuristics — a spelled-out figure
without `%`/`€`/a quantity keyword would slip through. Both are acceptable for the gate's intent
(no *advisory* constant fixes a figure), and the test passes today because the tree genuinely
carries no such literals.

---

## No unaccounted behavior (finding, not a command)

Every changed file traces to a task. New/notable pieces beyond the obvious scenario wiring:

- `src/domain/passage.ts` adds `normIdOfPassageId()` — inverse of `passageIdOf`, used by
  `scopeDisclaimerFor` (`src/service/answer-question.ts:103-105`) to test a cited passage's
  `normId` against the non-IRPF set. Traces to Task 7 (derivation from cited norms). Legitimate
  helper.
- `src/service/responses.ts` now hosts `privacyResponse`, `scopeResponse`, `guideResponse`
  alongside the pre-existing constructors (moved from `answer-question.ts`), and `yearNoticeFor`
  was refactored to use the `YEAR_NOTICE_BODY` template (logic unchanged). Traces to the Task 4/7/8
  response-shape change; the module doc comment states the single-home intent. Legitimate refactor.
- `src/components/ChatScreen/ChatScreen.tsx` extracts `StreamingRegion`/`Announcer`/`TurnFeedback`/
  `Dock`/`SkipLink` and adds an `Announcer` live region for `turn.announcement` (screen-reader
  announcement of refusals/abstentions), with the `--sr-only-size` token and `.announcer` CSS.
  Accompanies the Task 4/8 refusal/abstention rendering change (a refusal appended silently would
  otherwise never be announced). Legitimate, small a11y addition.
- `corpus/corpus.json` regenerated: 8 norms (ids match Task 1 exactly, in registry order), 1961
  passages, `taxYear` 2025, `contentHash` present. `git diff main -- corpus/corpus.json` shows the
  artifact change (Task 2). `src/domain/allowed-norms.ts` and `corpus/corpus.json` agree exactly.

No logic found that does not trace to a task or scenario.

---

## Out-of-scope findings (recorded, not fixed)

1. **`OfficialLink` type — correct-as-is (not orphaned).** The orchestrator's brief flagged it
   "orphaned"; my read disagrees. `OfficialLink` is defined in `src/content/scope-topics.ts:21`
   and is still imported and used: `src/service/types.ts:8,53` (`GuideResponse.links`) and
   `src/content/gestor-guides.ts:2,10,17,20` (`GuideContent.links`, `AEAT_MODELOS`). It lost its
   `OutOfScopeResponse` use (Task 4) but retains its guide-link use. Not dead. Minor naming hint:
   the type now describes guide links yet lives in the scope-topics module — a cohesion smell,
   not a defect, and not worth a follow-up spec on its own.

2. **`abstentionNotice` exported — correct-as-is, minor hint.** Exported from
   `use-chat-turn.ts:71`, consumed in production at `use-chat-turn.ts:133`, and additionally
   imported directly by `test/acceptance/AC-002-registration-path.test.ts:13`. It is not "only"
   a test seam — it is a production function whose export also enables direct unit testing.
   Acceptable; a pure seam would be a smell.

3. **Pre-existing design-principles FAILs (2) — out of scope, not a block.** See the whole-repo
   evidence block: `LoginForm.tsx` CC=8 and the vendored `.standards` cobalt example CC=10. Both
   byte-identical to `main`. Recorded for the Architect; not introduced by this spec.

4. **`shadowsAnswerableSubject` left per-matcher — correct-as-is.** The guard
   (`gestor-guides.ts:295`) is applied individually at each colliding predicate (`gastosGuide:308`,
   `laborGuide:322`, `presentationGuide:359`), not as a single early gate. This is defensible: only
   three of the retained guides can collide with an answerable subject, and each call site makes
   its own decision explicit. Centralizing would be a mild DRY win at the cost of hiding which
   guides are affected. Not a defect.

---

## Verification attempt log

- attempt 1, phase 1 — full run. `SPEC_LOOP_COUNT=0`, `SPEC_PHASE1_RETRIES=0`,
  `SPEC_PHASE2_RETRIES=0`.
- attempt 2, phase 1 — scoped re-verification (audit-trail heading fix only).
  `SPEC_LOOP_COUNT=1`, `SPEC_PHASE1_RETRIES=1`, `SPEC_PHASE2_RETRIES=0`.

---

## Re-verification (attempt 2, phase 1) — audit-trail heading fix

**Cause of the re-trigger.** The Mutation Runner ran the stage-5b pre-push gate
`.standards/scripts/check-audit-trail.sh 002-advisor-scope-expansion`, which matches the five
contract check names exactly (case-insensitive) via `evidence_block()`. Two of this report's
headings were qualified, so neither matched:

- `## Evidence: complexity gate (ESLint)` → renamed to `## Evidence: complexity gate`
- `## Evidence: design-principles gate (whole repo)` → renamed to `## Evidence: design-principles gate`

The whole-repo qualifier was preserved inside the block body as a `scope: whole repo` line under
the markers (the diff-scoped block stays a clearly-qualified supplemental `## Evidence:
design-principles gate (diff-scoped)` and is ignored by the gate, which returns the first
exact-match block). No measurement, exit code, or timestamp was changed.

## Evidence: audit-trail gate (re-verification, attempt 2)

command: .standards/scripts/check-audit-trail.sh 002-advisor-scope-expansion
exit: 0
at: 2026-10-25T17:52:30Z

PASS 002-advisor-scope-expansion: 10-tasks.md present and non-empty
PASS 002-advisor-scope-expansion: 20-acceptance/ has an AC-*.md with a '## AC-NNN-NN' heading (AC-015-10)
PASS 002-advisor-scope-expansion: 25-verification.md present and non-empty
PASS 002-advisor-scope-expansion: 30-report.md present and non-empty
PASS 002-advisor-scope-expansion: 15-design.md present and non-empty (AC-015-13)
PASS 002-advisor-scope-expansion: 40-deploy.md absent — tolerated pre-5c (stage 5d re-runs with --require-deploy, AC-031-21)
PASS 002-advisor-scope-expansion: evidence block 'scenario traceability' — command: .standards/scripts/check-scenario-traceability.sh, exit: 0, at: 2026-10-25T17:40:30Z
PASS 002-advisor-scope-expansion: evidence block 'full test suite' — command: npm test, exit: 0, at: 2026-10-25T17:40:45Z
PASS 002-advisor-scope-expansion: evidence block 'complexity gate' — command: npm run lint, exit: 0, at: 2026-10-25T17:41:20Z
PASS 002-advisor-scope-expansion: evidence block 'design-principles gate' — command: .standards/scripts/check-code-principles.sh ., exit: 1, at: 2026-10-25T17:42:40Z
PASS 002-advisor-scope-expansion: evidence block 'scenario-to-behavior spot check' — command: (manual read of test + source + scenario; no shell command), exit: 0, at: 2026-10-25T17:43:40Z
✔ Audit-trail check: specs/002-advisor-scope-expansion complete, verifier evidence recorded.

---

## Evidence: scenario traceability (re-verification, attempt 2)

command: .standards/scripts/check-scenario-traceability.sh
exit: 0
at: 2026-10-25T17:52:30Z

... (33 live scenarios, all PASS) ...
PASS AC-002-31 — traced to a test
PASS AC-002-32 — traced to a test
PASS AC-002-33 — traced to a test

✔ Scenario traceability check: every scenario traced, every reference resolves.

The heading rename in 25-verification.md does not touch the trace scan (it greps test files and
scenario files, not the verifier report), so the scan is unchanged and still exit 0.

---

## Verdict (unchanged after re-verification)

**PASS.** The audit-trail gate now exits 0; the five contract evidence blocks parse; traceability
still exit 0. No measurement, exit code, or timestamp in the five blocks was altered — only two
headings were renamed to the contract literals and a `scope:` qualifier line added to the body.
No gate revealed any other deficiency (no missing check, no unrecorded command, no malformed
block).

---

## Phase 2 — round 1 (post-PR CI)

PR #13, draft, head `c343e17d4c4a7efd5e942311a9891b81a57abd0c`, branch `spec/002-advisor-scope-expansion`,
repo RexiAI/tax-advisor. Round 1 of the phase-2 CI check-and-remediate loop
(`SPEC_LOOP_COUNT=2`, `SPEC_PHASE1_RETRIES=1`, `SPEC_PHASE2_RETRIES=0`).

### Verdict: PASS

All CI checks terminal and green; no FAIL, no BLOCK. No remediation needed, no routing.

## Evidence: PR checks query (terminal)

command: gh pr checks 13 --json name,state,bucket,workflow,link
exit: 0
at: 2026-10-25T18:00:53Z

[{"bucket":"pass","link":"https://vercel.com/github","name":"Vercel Preview Comments","state":"SUCCESS","workflow":""},
 {"bucket":"pass","link":"https://github.com/RexiAI/tax-advisor/actions/runs/40219052569/job/121246544826","name":"lint","state":"SUCCESS","workflow":"CI"},
 {"bucket":"pass","link":"https://github.com/RexiAI/tax-advisor/actions/runs/40219052569/job/121246544845","name":"test","state":"SUCCESS","workflow":"CI"},
 {"bucket":"pass","link":"https://github.com/RexiAI/tax-advisor/actions/runs/40219052569/job/121246544677","name":"build","state":"SUCCESS","workflow":"CI"},
 {"bucket":"pass","link":"https://vercel.com/danielbueno76-4270s-projects/tax-advisor/49KcnY72nvoS8cvtbXHiwG4W8Wwz","name":"Vercel","state":"SUCCESS","workflow":""}]

Per-check parse (`bucket` field → PASS/FAIL):

| Check | bucket | state | Round-1 verdict |
|---|---|---|---|
| Vercel Preview Comments | pass | SUCCESS | PASS |
| lint (CI) | pass | SUCCESS | PASS |
| test (CI) | pass | SUCCESS | PASS |
| build (CI) | pass | SUCCESS | PASS |
| Vercel | pass | SUCCESS | PASS |

### Polling

The first `gh pr checks 13 --json` (≈17:59:40Z) returned only the two Vercel statuses — the three
GitHub Actions jobs (`lint`/`test`/`build`) had not yet surfaced in the checks API. The
authoritative, complete rollup came from `gh pr view 13 --json statusCheckRollup`, which showed the
CI run `40219052569` in flight (`lint` IN_PROGRESS, `test` IN_PROGRESS, `build` QUEUED) plus
`Vercel` PENDING. I polled `statusCheckRollup` every ~30 s:

- poll 1 @ 17:59:41Z — lint/test/build all in progress; Vercel PENDING.
- poll 2 @ 18:00:13Z — lint SUCCESS, test SUCCESS, build IN_PROGRESS; Vercel SUCCESS.
- poll 3 @ 18:00:46Z — all three CI jobs COMPLETED/SUCCESS; Vercel SUCCESS.

**3 polls over ~75 s** until terminal. The final `gh pr checks 13 --json` (above, 18:00:53Z)
returned all five checks with `bucket: "pass"`. A prior CI run `40219027285` on the same branch was
`cancelled` — the expected superseded-run artifact of `concurrency.cancel-in-progress: true`, not a
failure.

## Evidence: PR state / rollup (bounded re-query)

command: gh pr view 13 --json number,isDraft,state,headRefName,headRefOid,mergeable,statusCheckRollup
exit: 0
at: 2026-10-25T17:59:41Z

{"headRefName":"spec/002-advisor-scope-expansion","headRefOid":"c343e17d4c4a7efd5e942311a9891b81a57abd0c","isDraft":true,"mergeable":"MERGEABLE","number":13,"state":"OPEN","statusCheckRollup":[{"__typename":"CheckRun","completedAt":"0001-01-01T00:00:00Z","conclusion":"","detailsUrl":"https://github.com/RexiAI/tax-advisor/actions/runs/40219052569/job/121246544826","name":"lint","startedAt":"2026-10-25T17:59:30Z","status":"IN_PROGRESS","workflowName":"CI"},{"__typename":"CheckRun","completedAt":"0001-01-01T00:00:00Z","conclusion":"","detailsUrl":"https://github.com/RexiAI/tax-advisor/actions/runs/40219052569/job/121246544845","name":"test","startedAt":"2026-10-25T17:59:30Z","status":"IN_PROGRESS","workflowName":"CI"},{"__typename":"CheckRun","completedAt":"0001-01-01T00:00:00Z","conclusion":"","detailsUrl":"https://github.com/RexiAI/tax-advisor/actions/runs/40219052569/job/121246544677","name":"build","startedAt":"2026-10-25T17:59:29Z","status":"QUEUED","workflowName":"CI"},{"__typename":"StatusContext","context":"Vercel","startedAt":"2026-10-25T17:58:58Z","state":"PENDING","targetUrl":"https://vercel.com/danielbueno76-4270s-projects/tax-advisor/49KcnY72nvoS8cvtbXHiwG4W8Wwz"},{"__typename":"CheckRun","completedAt":"2026-10-25T17:58:59Z","conclusion":"SUCCESS","detailsUrl":"https://vercel.com/github","name":"Vercel Preview Comments","startedAt":"2026-10-25T17:58:59Z","status":"COMPLETED","workflowName":""}]}

---

### PR Opener flag — `check-specs-archived.sh` not wired (CONFIRMED)

The PR Opener claimed `.github/workflows/ci.yml` does not wire `check-specs-archived.sh`, so the
unarchived spec folder at this head does not fail CI. **Confirmed.** The only GitHub Actions
workflow in this repo is `.github/workflows/ci.yml` (`.github/dependabot.yml` is Dependabot config,
not a workflow), and it declares exactly three jobs — `lint`, `test`, `build` — with no spec,
archive, or `check-specs-archived` step:

```
jobs:
  lint:    … npm run lint; npx tsc --noEmit
  test:    … npm test
  build:   … npm run build
```

`grep -rn "check-specs-archived"` over the repo (excluding `.standards/` and `specs/`) returns
nothing; the gate lives only in the `.standards` submodule's own `self-ci.yml`, which is not
inherited by this child repo.

**Consequence for merge order.** Because no CI backstop in this repo refuses a finished-but-
unarchived spec, the discipline falls entirely on the pipeline: stage 5d (the Archiver) must run
`archive-spec.sh` as the final commit of this PR — so `main` lands with `docs/changes/002-…-md`
present and `specs/002-advisor-scope-expansion/` absent — **before** the PR is merged. A merge that
precedes stage 5d would carry the pipeline scratch (`specs/NNN-slug/`) onto `main` with nothing to
stop it. This is an observation for the PR Opener/Archiver to act on, not a defect in this round's
CI verdict (the CI is green; the archive gate is simply not a CI gate here).

---

### Round-1 outcome

PASS — every CI check green, no failing check IDs to record, no log-failure excerpt, no routing.
