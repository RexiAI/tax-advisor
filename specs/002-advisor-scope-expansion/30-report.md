# 30-report — spec 002 (advisor scope expansion)

Stage 5a (Mutation Runner), attempt 1; report revised after the phase-1 audit-trail fix closed.
Branch: `spec/002-advisor-scope-expansion` (dirty working tree, nothing committed).
Conformance tier: **mvp**.
Information barrier respected: `00-informal.md` was not read. This report reasons from
`10-tasks.md`, `20-acceptance/`, `25-verification.md`, and the committed test suite only.

Nothing was committed, pushed, or opened as a PR. No production code and no test was modified.

## Verdict summary

| Item | Result |
|---|---|
| Verifier verdict (carried forward) | **PASS** (`25-verification.md`; unchanged after the phase-1 re-verification, attempt 2) |
| Mutation score | **skipped — `mvp` tier** (mutation testing is `production`+) |
| Equivalent mutants | **none** — no mutation engine ran, so the category does not arise |
| Complexity / structure, in-diff | **0 FAIL, 0 WARN** (`-BaseRef main`) |
| Final full suite | **405 passed / 44 files, exit 0** |
| Type-check | **exit 0** |
| Production build | **exit 0** |
| Lint | **exit 0** |
| `check-audit-trail.sh` (stage 5b's pre-push gate) | **exit 0** — resolved in phase 1, attempt 1 (heading format corrected by stage 4; gate re-run at `2026-10-25T17:52:30Z`) |
| Remediation | **Phase 1: 1 attempt consumed, 1 gate failure observed and resolved, 0 BLOCKs outstanding. Phase 2 and Phase 3 not reached.** |

The Verifier's PASS **is** supported by what I can see: I independently re-ran the full suite,
the type-check, the build, the lint, and the diff-scoped design-principles gate, and all are
green at the tree the Verifier checked. One figure in the orchestrator's brief could not be
reproduced and is recorded as unverifiable below rather than asserted.

The folder is pushable: the audit-trail gate that stage 5b runs before pushing exits 0. On my
first run it did not — a heading-format defect in the Verifier's artifact, fixed by stage 4 in
phase 1, attempt 1. The diagnosis is kept below because the failure mode is non-obvious and will
recur; it is no longer an open item.

---

## Resolved in phase 1 — audit-trail gate heading format

`scripts/check-audit-trail.sh 002-advisor-scope-expansion` is the gate
`docs/SPEC_PIPELINE.md §The gate` has the PR Opener run before pushing. It exits **0** now. It
exited **1** on my first run, and it is kept here as a resolved item because the failure mode is
non-obvious, recurs easily, and says nothing about the quality of the work.

**Cause.** Two evidence headings in the Verifier's `25-verification.md` did not match the
contract's literal heading form. `docs/SPEC_PIPELINE.md §Evidence block format` specifies
`## Evidence: <check name>` and names the five checks exactly; the script (`evidence_block`, awk,
line ~207) compares the heading text after `## Evidence:` for **exact** case-insensitive equality.
Qualified headings therefore miss:

| Heading as first written | Contract name | Match |
|---|---|---|
| `## Evidence: complexity gate (ESLint)` | `complexity gate` | **missed** |
| `## Evidence: design-principles gate (whole repo)` | `design-principles gate` | **missed** |
| `## Evidence: scenario traceability`, `full test suite`, `scenario-to-behavior spot check` | as written | matched |

This was a **formatting** nonconformance, never a substantive one: every check the Verifier
recorded still passed and its evidence content was intact, so its PASS verdict stood throughout.
The mechanical gate is nonetheless what gates the push, and it was red.

**Resolution.** Stage 4 renamed the two headings to the contract literals in a scoped
re-verification (`25-verification.md` §Re-verification (attempt 2, phase 1)); the whole-repo
qualifier moved into the block body as a `scope:` line. No measurement, exit code, or timestamp
was altered. The `(diff-scoped)` heading stays as a clearly-qualified supplemental block — the
lookup returns the first exact match, so it is ignored. The gate accepts the whole-repo block's
`exit: 1` because the contract requires the markers plus verbatim output, and a whole-repo run
that records pre-existing, out-of-diff FAILs is conformant.

Stage 5a did not edit the artifact itself — rewriting another stage's recorded evidence, even its
headings, is not this stage's call. I proved the failure and the two-line fix on a `/tmp` copy,
then escalated; that escalation is what closed it, in one attempt, consuming one phase-1 slot.

### Evidence: audit-trail gate (after the phase-1 fix)

command: .standards/scripts/check-audit-trail.sh 002-advisor-scope-expansion
exit: 0
at: 2026-10-25T17:52:30Z

```
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
```

---

## Mutation score

**Skipped.** `docs/SPEC_PIPELINE.md §Conformance tiers` places mutation testing at
`production` and above; the project is `mvp`. No mutation engine was installed, no partial
pass was run, and no score was invented. At `mvp` the Architect role still runs — it runs as
this report — but the mutation *test* does not.

I established the tier two ways: the repo's own gate script auto-detects it, and no
human-authored tier declaration exists anywhere the standards say to look
(`docs/CONFORMANCE_TIERS.md`: an `AGENTS_*.md` "Conformance tier:" line; the stop-and-ask
matrix's fallback is the harness default `mvp`).

### Evidence: conformance tier resolution

command: .standards/scripts/check-code-principles.sh . --json
exit: 0
at: 2026-10-25T17:48:41Z

```
{
  "tier": "mvp",
  "gates": ["complexity", "dry", "yagni", "solid", "component-per-file", "property-tests"],
```

### Evidence: no human-authored tier declaration (harness default `mvp` applies)

command: for f in README.md docs/RUNBOOK.md docs/adr/0001-lexical-retrieval.md docs/adr/0002-no-server-persistence.md docs/adr/0003-advisor-scope-expansion.md; do printf "%-45s " "$f"; grep -ci "conformance tier" "$f" || true; done; ls AGENTS_*.md; grep -ci "conformance" package.json
exit: 0
at: 2026-10-25T17:48:59Z

```
README.md                                     0
docs/RUNBOOK.md                               0
docs/adr/0001-lexical-retrieval.md            0
docs/adr/0002-no-server-persistence.md        0
docs/adr/0003-advisor-scope-expansion.md      0
--- no AGENTS_*.md at repo root: ---
ls: cannot access 'AGENTS_*.md': No such file or directory
--- tier declaration in package.json? ---
0
```

### Evidence: no mutation tooling installed or configured

command: ls -1 stryker.conf.json stryker.config.json .strykerrc.json; grep -c "stryker" package.json; ls -d node_modules/@stryker-mutator
exit: 2
at: 2026-10-25T17:48:41Z

```
0
ls: cannot access 'node_modules/@stryker-mutator': No such file or directory
```

(`package.json` scripts are `dev`, `build`, `start`, `test`, `test:watch`, `lint`, `format`,
`corpus:sync` — no `mutation` script. Exit 2 is `ls` reporting the absent Stryker directory.)
Nothing was installed to change this. If the project later moves to `production` tier, the
`docs/SPEC_PIPELINE.md §Tooling by language` row for JS/TS (`npx stryker run`, ≥80%) is the
entry point and `ci/templates/stryker.conf.json` is the config template.

### Equivalent mutants

**None.** Per the audit contract this row must be explicit: equivalent mutants are the
survivors a mutation engine reports that no test can kill. No engine ran, so no survivor set
exists and no mutant was classified. This is not a claim that the suite is mutation-clean —
it is a recorded absence of measurement, which is exactly the `mvp` tier's documented state.

---

## Complexity / structure, carried forward from stage 3

`spec-refactorer` deliberately leaves no report artifact (audit contract, §What each stage
leaves behind) — its claims are audited because the Verifier re-executes them. So there is no
stage-3 document to transcribe. What follows is (a) the numbers the Verifier re-recorded, and
(b) numbers I measured myself, this run, at both tree states.

**Where the "4 FAIL → 0" figure stands.** The orchestrator's brief cites a diff-scoped
baseline→final of 4 FAIL → 0. I could confirm the **final** half and not the **baseline**
half:

- Final, diff-scoped: `-BaseRef main` → **exit 0, 0 FAIL, 0 WARN** — reconfirmed below.
- The baseline half is the Coder's working tree *before* stage 3 refactored it. That state was
  never committed and never stashed, so it is not recoverable from any artifact (no stage-3
  report exists by design, `runs.jsonl` carries only per-run gate outcomes, and the working
  tree has moved past it). **The 4 is therefore unverified, not disputed.** I did not
  substitute a guess for it.

To give the row real numbers anyway, I measured `main` (@`76c0a61`) against the working tree
directly, in a detached worktree so the spec branch's tree was never touched.

### Evidence: design-principles baseline (`main` @ 76c0a61), src/test-scoped

command: git worktree add --detach /tmp/opencode/spec002-baseline main && .standards/scripts/check-code-principles.sh /tmp/opencode/spec002-baseline --json
exit: 1
at: 2026-10-25T17:48:51Z

```
tier: mvp fails: 1 warns: 20
src/test-scoped fails: 1
src/test-scoped warns: 20

FAIL  src/components/LoginForm/LoginForm.tsx:17:100:LoginForm:CC=8
WARN  src/components/SourceEntry/SourceEntry.tsx:17:41:SourceEntry:KISS_LINES=26
WARN  src/components/ChatScreen/ChatScreen.tsx:41:85:ChatScreen:KISS_LINES=46
WARN  src/components/LoginForm/LoginForm.tsx:17:100:LoginForm:KISS_LINES=79
WARN  src/components/Composer/Composer.tsx:27:64:Composer:KISS_LINES=31
WARN  src/components/Notice/Notice.tsx:26:59:Notice:KISS_LINES=35
WARN  src/components/Notice/Notice.tsx:26:59:Notice:KISS_PARAMS=7
WARN  src/components/Header/Header.tsx:14:35:Header:KISS_LINES=23
WARN  src/components/AnswerBlock/AnswerBlock.tsx:20:46:AnswerBlock:KISS_LINES=28
WARN  (10x DRY) identical 4-line blocks — links/AEAT_MODELOS/readonly summary+steps+links shape
WARN  YAGNI: interface CorpusFetcher has exactly one implementation — src/corpus/fetcher.ts:12
WARN  possible god file (node) — src/content/gestor-guides.ts: 499 lines, 1 methods
```

### Evidence: design-principles final (working tree), src/test-scoped

command: .standards/scripts/check-code-principles.sh . --json
exit: 1
at: 2026-10-25T17:47:12Z

```
src/test-scoped FAILS: 1
  FAIL src/components/LoginForm/LoginForm.tsx:17:100:LoginForm:CC=8
src/test-scoped WARNS: 5
  WARN Method body >20 lines (node): ./src/components/SourceEntry/SourceEntry.tsx:17:41:SourceEntry:KISS_LINES=26
  WARN Method body >20 lines (node): ./src/components/LoginForm/LoginForm.tsx:17:100:LoginForm:KISS_LINES=79
  WARN Method body >20 lines (node): ./src/components/Composer/Composer.tsx:27:64:Composer:KISS_LINES=31
  WARN Method body >20 lines (node): ./src/components/Header/Header.tsx:14:35:Header:KISS_LINES=23
  WARN YAGNI: interface CorpusFetcher has exactly one implementation (premature abstraction) — ./src/corpus/fetcher.ts:12
```

The whole-repo invocation also reports the vendored `.standards` submodule demo asset
(`cobalt-01/script.js:7:90::CC=10`); it is not in this spec's diff and is excluded from the
scoped count above. Both whole-repo FAILs at final are **byte-identical to `main`** and
untouched by this spec — consistent with the Verifier's disposition.

### Per-file baseline → final, for the files this spec touched

The gate reports only files that *exceed* a threshold; it emits no CC or KISS number for a
compliant file. So the honest per-file series is "finding present" → "finding absent", not a
numeric CC curve.

| File (touched by this spec) | Baseline (`main`) | Final (working tree) |
|---|---|---|
| `src/content/gestor-guides.ts` | WARN god file — 499 lines | clean |
| `src/components/AnswerBlock/AnswerBlock.tsx` | WARN KISS_LINES=28 | clean |
| `src/components/ChatScreen/ChatScreen.tsx` | WARN KISS_LINES=46 | clean |
| `src/components/Notice/Notice.tsx` | WARN KISS_LINES=35 | clean |
| `src/components/Notice/Notice.tsx` | WARN KISS_PARAMS=7 | clean |
| `src/service/{answer-question,responses,types}.ts`, `src/domain/{allowed-norms,passage}.ts`, `src/content/{scope-topics,strings}.ts`, `src/components/ChatScreen/use-chat-turn.ts` | clean | clean |
| DRY (identical 4-line blocks in content/types shape) | 10 WARN | clean |

**Touched-file findings: 5 → 0. src/test-scoped WARNs overall: 20 → 5. src/test-scoped FAILs:
1 → 1 (unchanged: `LoginForm` CC=8, pre-existing, not in this diff).** No file this spec
touched carries a cyclomatic-complexity or KISS finding at final.

### Evidence: design-principles diff-scoped (`-BaseRef main`)

command: .standards/scripts/check-code-principles.sh . -BaseRef main --json
exit: 0
at: 2026-10-25T17:47:12Z

```
tier=mvp fails=0 warns=0
```

Matches the Verifier's `-BaseRef main` evidence block (exit 0, 0 FAIL, 0 WARN).

The measurement worktree was removed afterwards (`git worktree remove --force`, `git worktree
prune`); `git worktree list` shows only the spec branch checkout. No git state was left behind.

---

## Final test status — full suite, one final time

The Verifier confirmed this once. I re-confirm it because my stage added no code but the tree
is the same tree that will be pushed, and because a green suite after someone else's last edit
is not evidence about the tree a PR Opener is about to commit.

### Evidence: full test suite

command: npm test
exit: 0
at: 2026-10-25T17:47:42Z

```
 Test Files  44 passed (44)
      Tests  405 passed (405)
   Start at  18:47:43
   Duration  9.70s (transform 2.09s, setup 1.06s, collect 22.46s, tests 21.18s, environment 2.72s, prepare 5.47s)
```

### Evidence: type-check

command: npx tsc --noEmit
exit: 0
at: 2026-10-25T17:47:55Z

```
(no output — clean)
```

### Evidence: production build

command: npm run build
exit: 0
at: 2026-10-25T17:48:02Z

```
Route (app)                                 Size  First Load JS
┌ ○ /                                    7.73 kB         110 kB
├ ○ /_not-found                            995 B         104 kB
├ ƒ /api/auth/login                        133 B         103 kB
├ ƒ /api/auth/logout                       133 B         103 kB
├ ƒ /api/chat                              133 B         103 kB
├ ƒ /health                                133 B         103 kB
└ ƒ /login                               2.33 kB         105 kB
+ First Load JS shared by all             103 kB
ƒ Middleware                               35 kB
```

### Evidence: lint (also the complexity gate — `complexity: [error,6]`)

command: npm run lint
exit: 0
at: 2026-10-25T17:47:57Z

```
> renta-clara@0.1.0 lint
> eslint .
```

(no violations reported)

Test count is unchanged from the Verifier's run (405), as expected: this stage wrote no tests,
because at `mvp` tier there is no mutation survivor set to write them from.

---

## Remediation record

`docs/SPEC_PIPELINE.md §Remediation budget` requires the phase and attempt count at which each
BLOCK was resolved. Sources: `25-verification.md`'s attempt log and the orchestrator's loop
summary (`runs.jsonl`, entry `specSlug: "002-advisor-scope-expansion"`,
`runId aa4c74fc-7ee1-4119-889c-310ed604fbad`).

| Phase | Budget | Consumed | BLOCKs | State |
|---|---|---|---|---|
| Phase 1 — pre-PR (local + design gates) | max 3 | **1 attempt** | **1 gate failure observed, 1 resolved, 0 outstanding** | Verifier passed attempt 1 with no failure. Stage 5a's audit-trail run found the heading-format defect; stage 4 fixed it in one scoped re-verification (`25-verification.md` §Re-verification (attempt 2, phase 1)) and the gate re-ran exit 0. |
| Phase 2 — post-PR CI | max 3 | **0** | 0 | **not reached** (needs the PR that stage 5b opens) |
| Phase 3 — deploy verification | max 3 | **0** | 0 | **not reached**; stage 5c's territory, and only after a green phase 2 |

Verbatim from the orchestrator's loop summary for this spec:

```
"gatesFailed": [],
"outcome": "pass",
"loopCount": 0,
"phase1Retries": 0,
"phase2Retries": 0
```

`25-verification.md`'s attempt log agrees: "attempt 1, phase 1 — full run (this report). No
remediation rounds; `SPEC_LOOP_COUNT=0`, `SPEC_PHASE1_RETRIES=0`, `SPEC_PHASE2_RETRIES=0`."

**Reconciling that record with the audit-trail round.** The orchestrator's counters and the
Verifier's attempt log describe the state as of stage 4 and are correct for it: no gate FAILed
during the Verifier's own run, so it consumed nothing and re-delegated nothing then. The
audit-trail defect was not visible at stage 4 — the Verifier does not run that gate; it is stage
5b's pre-push gate, and stage 5a ran it first. It then closed in a single further round, recorded
as attempt 2 in `25-verification.md`. So:

- **Phase 1 attempts consumed: 1** — the one scoped re-verification that renamed the two headings.
  Neither the Verifier's attempt 1 nor its attempt 2 reported a gate FAIL; the re-verification
  confirmed the fix and left the verdict unchanged (PASS).
- **Phase 1 gate failures observed: 1, resolved: 1, outstanding: 0.**
- **Phase 2 and Phase 3: not reached.** The phase-2 counter starts at zero when the PR opens.

Budget exhaustion does not apply (1 of 3 consumed, 2 remaining). A note for stage 5b/5c: the
phase-2 counter starts at zero when the PR opens; do not inherit a count from this row.

> Note on provenance: `runs.jsonl` also holds four records for spec **001** with
> `phase1Retries: 3` (a different spec, whose phase-1 budget was exhausted and which was
> resolved by a human-authorized fourth round). Those counters belong to spec 001 and are **not**
> carried into this report.

---

## Test-quality judgment without a mutation engine

With no mutation run, I can still read the tests and ask the question a mutant would ask:
*if this implementation were wrong, would the assertion fail?* I read **every** AC-002 test
file — all 33 scenarios (11 files) — plus `test/unit/allowed-norms.test.ts` and the two test
doubles that every behavioral assertion routes through (`test/support/fake-llm-adapter.ts`,
`test/support/ui-harness.tsx`).

I fixed nothing. This section is a report.

### Where the suite would catch a wrong implementation

Worth stating, so the weak spots below are read as exceptions rather than the rule:

- **`AC-002-06`** writes a real artifact to a temp directory, breaks one new norm's parse,
  re-runs the CLI, and asserts the file on disk is **byte-identical** afterwards (`expect(readFileSync(path,'utf8')).toBe(before)`). Plus a second case where a norm parses to zero passages and must fail rather than shrink the corpus. A mutant that writes on failure, or that tolerates a partially-parsed norm, dies here.
- **`AC-002-12` / `AC-002-18`** walk the real `src/` tree and grep for the withdrawn constants
  (`AUTONOMO_*`, `IVA_GUIDE`, `RETA_GUIDE`, `MODEL_303/390/036`, `MODELS_OVERVIEW`). A constant
  that survives anywhere in `src/` fails these.
- **`AC-002-04` / `AC-002-05`** assert against `ALLOWED_NORMS` itself and re-derive the hash
  independently (`expect(second.artifact.contentHash).toBe(contentHashOf(fixturePassages()))`),
  so the hash is not compared to a copy of itself.
- **`AC-002-26`'s ordering assertion** (`scopeIndex === aiIndex + 1`) is real, matching the Verifier's adjudication: a missing scope line yields `-1`, which cannot equal `aiIndex + 1`; reordering or interposing a paragraph breaks it.
- **`callCount` assertions are trustworthy**: `FakeLlmAdapter.callCount` is `requests.length`, incremented in both `complete` and `completeAll`, so `callCount === 0` on a refusal and `=== 1` on an answer are genuine ordering/latency claims, not decoration.

### Weak or tautological assertions found (named, not fixed)

1. **`test/unit/allowed-norms.test.ts:15` — a pure tautology.** `expect(ids).toEqual([...ids])`
   compares an array with a shallow copy of itself; it cannot fail for any implementation. The
   test is named "keeps a stable order", which this assertion does not establish. **No coverage
   gap**, because order stability is genuinely covered behaviorally by `AC-002-04`
   (`fetcher.fetchedNormIds` must equal `ALLOWED_NORMS.map(n => n.normId)`, and
   `result.artifact.norms` must be in the same order). The assertion is dead weight only. This
   file carries no `AC-002-NN` id — it is an untagged unit test, so it is outside the 33
   scenarios' contract.

2. **`AC-002-13`, third test (`the payload type itself has no optional steps or links`) —
   self-constructed literal.** It builds an object literal typed `OutOfScopeResponse` and
   asserts `Object.keys(response)).toHaveLength(7)` on the literal the test itself wrote. No
   production value is read. If `OutOfScopeResponse` gained an optional `steps?: string[]`, this
   test still passes (the field is simply absent from the literal); a *required* added field
   fails `tsc`, not this assertion. **No coverage gap** — the scenario is held by the two
   siblings in the same file: the real `answerQuestion` payload's exact key set, and the
   interface source slice that must not contain `steps`/`links`.

3. **`AC-002-25`, first test (`AnswerResponse declares an optional scopeDisclaimer`)** — matches
   `/scopeDisclaimer\?: string;/` against the whole of `src/service/types.ts`, so it asserts the
   text exists *somewhere in the file*, not that it sits on `AnswerResponse`. Moving the line
   onto another interface would keep it green. **No coverage gap** — the sibling behavioral test
   reads `response.scopeDisclaimer` off a real `answer` response citing a non-IRPF norm.

4. **`AC-002-27`, third test (`the explanation names the topic and the competent body`)** —
   self-referential: `expect(response.explanation).toContain(response.topicLabel)` takes both
   sides from the same response object, so a wrong label/body pair passes as long as the template
   interpolates it consistently. Only the independent `toMatch(/Lo que sí cubro/)` is
   non-circular here. **Mostly covered elsewhere** — `AC-002-09` pins the six remaining
   `label`/`officialBody` pairs verbatim in another file.

5. **`AC-002-07`, second test (`adding a norm changes the content hash`)** —
   `expect(contentHashOf(irpfOnly)).not.toBe(contentHashOf(all))` would only fail if the hash
   ignored content entirely; for any non-degenerate hash of distinct inputs it is close to
   unfalsifiable. Weak but not vacuous, and the stronger guarantee is covered by `AC-002-05`.

**Assessment:** four of the five are redundant-but-weak rather than coverage holes — each
scenario is held by a stronger sibling assertion in the same or an adjacent file — and the fifth
(AC-002-07) is a genuinely thin assertion for a requirement that a second test already carries.
**None of them is a defect in the implementation, and none is worth a follow-up spec**: items 1–3
are one-line cleanups that belong in whatever next touches those files, not in their own spec.

### Recorded limitation (not a weak assertion — a real gate with a named blind spot)

`AC-002-21`'s no-hardcoded-quantities audit covers **only** `src/content` + `src/prompts`, and
only **string literals** matched against three heuristic patterns. A figure hardcoded in
`src/components` or `src/service` is not caught by it, and a spelled-out amount without `%`,
`€`, or a quantity keyword slips through. The Verifier recorded this; I confirm it and carry it
forward unchanged. This is the one item here with genuine gap shape — see the follow-up judgment
below.

### What I did not inspect

My reading judgment covers all 33 AC-002 scenarios and their doubles. I did **not** read the
bodies of the pre-existing spec-001 regression tests (`AC-001-scope-guard.test.ts`,
`test/unit/text-and-guards.test.ts`, `AC-001-chat-ui.test.ts`, `AC-001-corpus-sync.test.ts`,
`AC-001-passage-model.test.ts`) — I saw them only through `AC-002-29`/`AC-002-30`'s structural
assertions about their contents. So no claim in this section extends to the 001 suite's
assertion quality.

### Follow-up judgment

The tautologies do not warrant a spec. If a follow-up is ever raised, the candidate is widening
`AC-002-21` from `src/content + src/prompts` to all of `src/` with an explicit model-identifier
allowlist — and it should ride along with a future content change rather than earn a spec of its
own, since the current blind spot is covered by the human read-audit the task describes.

---

## Out-of-scope findings carried forward from `25-verification.md` (unchanged)

Recorded, not fixed. Carried forward verbatim in substance; none was re-litigated, and none
blocks.

1. **`OfficialLink` type — correct-as-is (not orphaned).** Defined in
   `src/content/scope-topics.ts:21`; still imported and used by `src/service/types.ts:8,53`
   (`GuideResponse.links`) and `src/content/gestor-guides.ts:2,10,17,20` (`GuideContent.links`,
   `AEAT_MODELOS`). It lost its `OutOfScopeResponse` use (Task 4) but keeps its guide-link use.
   Naming hint only: the type now describes guide links yet lives in the scope-topics module — a
   cohesion smell, not a defect, and not worth a follow-up spec on its own.

2. **`abstentionNotice` exported — correct-as-is, minor hint.** Exported from
   `use-chat-turn.ts:71`, consumed in production at `use-chat-turn.ts:133`, and additionally
   imported directly by `test/acceptance/AC-002-registration-path.test.ts:13`. A production
   function whose export also enables direct unit testing; a pure seam would be the smell.

3. **Pre-existing design-principles FAILs (2) — out of scope, not a block.**
   `LoginForm.tsx` CC=8 and the vendored `.standards` cobalt example CC=10. Both byte-identical
   to `main` (confirmed again this run: the `LoginForm` FAIL appears at identical coordinates
   in the `main` worktree measurement and in the working tree), therefore neither is in this
   spec's diff and neither blocks it.

4. **`shadowsAnswerableSubject` left per-matcher — correct-as-is.** The guard
   (`gestor-guides.ts:295`) is applied individually at each colliding predicate
   (`gastosGuide:308`, `laborGuide:322`, `presentationGuide:359`), not as a single early gate.
   Defensible: only three retained guides can collide with an answerable subject, and each call
   site makes its own decision explicit. Centralizing would be a mild DRY win at the cost of
   hiding which guides are affected. Not a defect.

Also carried forward as recorded warnings (orchestrator summary, unchanged): the whole-repo
design-principles 2 pre-existing FAILs; the YAGNI `CorpusFetcher` single-implementation WARN
(`src/corpus/fetcher.ts`, pre-existing); and the AC-002-21 scope limitation.

---

## Handoff to stage 5b (PR Opener)

**Green. Cleared to push.** Every gate stage 5b runs is green:

- `check-audit-trail.sh 002-advisor-scope-expansion` → **exit 0**, after stage 4's phase-1 heading
  fix (diagnosis and evidence in §Resolved in phase 1 above).
- Verifier verdict **PASS** (`25-verification.md`, unchanged through the re-verification).
- Full suite **405 passed**, type-check, build, lint → all exit 0.
- Diff-scoped design-principles (`-BaseRef main`) → 0 FAIL, 0 WARN.
- Mutation gate **skipped by tier** (`mvp`), not by failure.

The one unverified item remains the orchestrator's "4 FAIL → 0" baseline figure, recorded as
unrecoverable rather than asserted; it blocks nothing.

Stage 5b may commit, push, and open the draft PR on `spec/002-advisor-scope-expansion`, and must
append the `PR:` line to this file after the PR opens.

Nothing was committed or pushed by stage 5a. No production code and no test was modified. The
measurement worktree used for the baseline numbers was removed (`git worktree list` shows only
the spec branch checkout).
