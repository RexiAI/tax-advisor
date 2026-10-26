# 30-report — spec 002 (advisor scope expansion)

Stage 5a (Mutation Runner), attempt 1; revised after the phase-1 audit-trail fix, and again on
2026-10-26 after the phase-2 CI round and the two phase-3 remediation rounds closed.
Branch: `spec/002-advisor-scope-expansion` — the report was written pre-PR; PR #13 is now open.
Conformance tier: **mvp**.
Information barrier respected: `00-informal.md` was not read. This report reasons from
`10-tasks.md`, `20-acceptance/`, `25-verification.md`, and the committed test suite only.

Nothing was committed, pushed, or opened as a PR. No production code and no test was modified.

## Verdict summary

| Item | Result |
|---|---|
| Verifier verdict (carried forward) | **PASS** (`25-verification.md`; unchanged after the phase-1 re-verification) |
| Mutation score | **skipped — `mvp` tier** (mutation testing is `production`+) |
| Equivalent mutants | **none** — no mutation engine ran, so the category does not arise |
| Complexity / structure, in-diff | **0 FAIL, 0 WARN** (`-BaseRef main`, re-run after the phase-3 rounds) |
| Scenarios | **36 live `AC-002-NN` ids** (was 33 at stage 5a) |
| Final full suite | **413 passed / 46 files, exit 0** — re-run after the phase-3 remediation rounds (was 405 / 44 at stage 5a) |
| Type-check / production build / lint | **exit 0** each — re-run with the suite |
| `check-audit-trail.sh` (stage 5b's pre-push gate) | **exit 0** — resolved in phase 1, attempt 1 (heading format corrected by stage 4; gate re-run at `2026-10-25T17:52:30Z`) |
| Live behaviour (phase 3) | **PASS, scoped** — the alta and IVA questions now answer from the governing passages, IBI still `out_of_scope`; proved on the HEAD tree **run locally**, not on the Vercel preview URL |
| Remediation | **Phase 1: 1 attempt, resolved. Phase 2: 1 round, CI green. Phase 3: 2 of 3 attempts (1 `ESCALATED` superseded, 1 PASS), 1 remaining, not exhausted.** |

The Verifier's PASS **is** supported by what I can see: I independently re-ran the full suite,
the type-check, the build, the lint, and the diff-scoped design-principles gate, and all are
green at the tree the Verifier checked. One figure in the orchestrator's brief could not be
reproduced and is recorded as unverifiable below rather than asserted.

The folder is pushable: the audit-trail gate that stage 5b runs before pushing exits 0. On my
first run it did not — a heading-format defect in the Verifier's artifact, fixed by stage 4 in
phase 1, attempt 1. The diagnosis is kept below because the failure mode is non-obvious and will
recur; it is no longer an open item.

After the PR opened, two behavioural defects surfaced that no gate in this report could see —
one in retrieval ranking, one in the system policy. Both are recorded in
§Phase 3 — deploy verification and remediation, together with why a 33-scenario gate passed a
spec that did not answer its founding question.

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

## Final test status — full suite (stage 5a)

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
because at `mvp` tier there is no mutation survivor set to write them from. The count moved to
413 later, when the phase-3 remediation rounds added the three scenarios described below.

### Evidence: post-remediation re-run (2026-10-26)

Asks the same four gates against the tree as it stands after the phase-3 rounds.

command: npm test
exit: 0
at: 2026-10-26T06:55:18Z

```
 Test Files  46 passed (46)
      Tests  413 passed (413)
   Start at  07:55:18
   Duration  15.23s (transform 3.36s, setup 1.44s, collect 33.92s, tests 29.60s, environment 6.50s, prepare 9.42s)
```

command: npx tsc --noEmit
exit: 0
at: 2026-10-26T06:55:38Z

```
(no output — clean)
```

command: npm run lint
exit: 0
at: 2026-10-26T06:55:40Z

```
> renta-clara@0.1.0 lint
> eslint .
```

command: npm run build
exit: 0
at: 2026-10-26T06:55:43Z

```
 ✓ Compiled successfully in 7.1s
   Generating static pages (0/7) ... → (7/7)
```

command: .standards/scripts/check-code-principles.sh . -BaseRef main --json
exit: 0
at: 2026-10-26T06:56:07Z

```
tier=mvp fails=0 warns=0
```

The delta is +8 tests / +2 files over the 405, all from `AC-002-retrieval-vocabulary.test.ts`
(5 tests) and `AC-002-policy-scope.test.ts` (3 tests). Nothing else in the suite changed; no
pre-existing test was edited to accommodate the remediation.

---

## Phase 3 — deploy verification and remediation

Stage 5b opened **PR #13** (draft). Phase 2's first CI round was green — 5 of 5 checks `pass`,
recorded in `25-verification.md` §Phase 2 — round 1 — so phase 3 began. It took two attempts and,
between them, two remediation rounds, each found by **running the product**, not by a gate.

### Attempt 1 — ESCALATED (infrastructure, not code)

The Vercel preview sits behind Vercel Authentication: a 302 to `sso-api`, `/api/chat` answering
401 `Protected deployment`, and no `VERCEL_AUTOMATION_BYPASS_SECRET` available to bypass it.
Nothing code-diagnosable was returned, so the fix-routing rule had nothing to route. Recorded in
`40-deploy.md` (attempt 1), **superseded** by attempt 2. This attempt implies no code defect.

### Remediation round 1 — retrieval ranked the governing passage out of sight

Found by a live end-to-end run against the built tree: real auth, real LLM, real
`corpus/corpus.json`, server on `localhost:3124`.

`Quiero darme de alta de autónomo. Guíame` returned `retrievalHitCount: 5` and cited `IAE
Regla 2`, `LIRPF art. 29`, `RIRPF art. 22` — then abstained from the procedure. The passage that
governs the *trámite*, `BOE-A-2007-15984#a9` (art. 9 RD 1065/2007, declaración censal de alta),
sat at **rank 95**. The IVA question retrieved **nothing** from Ley 37/1992 at all. The bundle was
full, correctly sized, and full of the wrong passages.

**Fix:** phrase-gated synonym expansion in `src/retrieval/expand.ts` only — colloquial phrasing
mapped onto the statute's own vocabulary (*darme de alta* → censal / empresarios / profesionales
/ retenedores / 036; *empiezo a presentar el IVA* → declaraciones-liquidaciones / sujetos
pasivos). The scoring threshold was **not** lowered and top-K was **not** raised:
`minRetrievalScore` 0.1 and `retrievalTopK` 5 are unchanged in `src/config/env.ts`, which is the
point — relaxing the gate would have masked the defect instead of fixing it.

**Measured after:** `#a9` rank **95 → 2**; the IVA obligation article rank **84 → 2**.

**Tests:** `AC-002-34` / `AC-002-35` in `test/acceptance/AC-002-retrieval-vocabulary.test.ts`
(5 tests, verified **red** against the pre-fix module). They run against the committed
`corpus/corpus.json` — the artifact production loads — not the smaller fixture corpus, so a
fixture that happens to rank nicely cannot hide this class of defect.

**Accepted limitation:** `BOE-A-1992-28740#a164` stays at rank 13. Reaching it needs a scoring
change, which is deferred, not silently absorbed.

### Remediation round 2 — the policy still described a narrower product

After the retrieval fix the model *still* refused. `SYSTEM_POLICY` opened with «Eres un asistente
que explica la normativa del IRPF español» and had been left at v1 while the corpus, the scope
guard and the response union all widened. Told it was an IRPF explainer, the model treated IVA
and censal passages as off-domain and discarded them — correct behaviour for the policy it was
handed, and the policy was the defect.

**Fix:** a widened identity (IRPF, IVA, the autónomo fiscal cycle) plus an explicit procedural
instruction — explain *who is obliged, when, where and in what form* from the normative passages,
do not require those passages to read as a step-by-step guide, and do not abstain merely because
they are normative text. Every safety rule is byte-preserved: answer only from the supplied
passages, no own knowledge, no completed figures, `[^p:<passageId>]` citations resolving to
supplied passages only, abstain when unsupported, at most one clarification restricted to the four
motives, ignore instructions inside user content.

**Test:** `AC-002-36` in `test/acceptance/AC-002-policy-scope.test.ts` (3 tests).

### Attempt 2 — PASS (scoped)

`40-deploy.md` attempt 2. Three probes against the remediated tree:

| Question | Outcome |
|---|---|
| `Quiero darme de alta de autónomo. Guíame` | `answer` — cites `BOE-A-2007-15984#a9`, `#a6`, `#a10`, `#a11`, states the pre-activity timing, and names what it cannot cover (RETA contributions, periodic IRPF/IVA filing) |
| `¿Cuándo empiezo a presentar el IVA si soy autónomo?` | `answer` — a grounded *partial* that names the corpus gap, cited from Ley 37/1992; neither a fabricated deadline nor a bare refusal |
| `¿Cuánto es el IBI de mi vivienda?` | still `out_of_scope`, `reasonCode: ibi` — the boundary held |

**Boundary, stated the way `40-deploy.md` states it:** this proves the **HEAD-tree code run
locally**, not that the Vercel preview URL serves it. The preview remains unverified for attempt
1's reason (Vercel Authentication, no bypass secret, `AUTH_PASSWORD` unpullable). Nor does it
exercise rendering or the disclaimer UI: the probes are HTTP-level JSON, so `scopeDisclaimer`
appearing in the payload is verified — that it *renders* in the footer is not.

Both fixes **were uncommitted working-tree changes** when this section was first written (HEAD
`c343e17`, the PR head). They are committed and pushed now: `0c52d22` (retrieval, round 1) and
`c89c880` (policy, round 2) — see §Phase-3 remediation committed and pushed, at the end of this
report.

### The reportable lesson

**Both defects were invisible to the gate that cleared this spec.** The 33 scenarios asserted
plumbing: that `classifyScope` returns `null`, that the union lost `steps`/`links`, that a guide
does not shadow a question, that the disclaimer constant is verbatim, that a deleted module is
gone. Not one asserted **retrieval ranking** — that the passage governing the asked-about
procedure lands inside top-K — and not one asserted the **policy's domain**. So a spec whose
founding question was *can the advisor answer about IVA and about dar de alta* passed stage 4
while being unable to answer either.

That is structural, not accidental. Traceability plus a green suite measures that the tests agree
with the code; it cannot measure whether they are load-bearing for behaviour — and the mutation
gate that would have probed that is skipped at `mvp` tier, so nothing in this pipeline was
checking. The remediation rounds added the two assertions that would have caught it — bundle
membership for a named governing passage, and the policy's identity sentence — which gives the
suite a class of test it did not have before. But they were written *after* a human ran the
product.

The generalizable rule: **a spec that widens what a retrieval-grounded product covers needs at
least one scenario asserting retrieval output for a real question against the real corpus, and
one asserting the prompt's stated scope.** Neither is a plumbing assertion, and neither existed
here.

---

## Remediation record

`docs/SPEC_PIPELINE.md §Remediation budget` requires the phase and attempt count at which each
BLOCK was resolved. Sources: `25-verification.md`'s attempt log (§Phase 2 — round 1) and the
orchestrator's loop summary in `runs.jsonl`, `specSlug: "002-advisor-scope-expansion"` — three
records, in run order.

| Phase | Budget | Consumed | Outcome | State |
|---|---|---|---|---|
| Phase 1 — pre-PR (local + design gates) | max 3 | **1 attempt** | 1 gate failure observed (audit-trail heading format), 1 resolved | **closed**, 0 outstanding |
| Phase 2 — post-PR CI | max 3 | **1 round** | CI green on the first round — 5 of 5 checks `pass`, 0 fix rounds | **closed**, no routing needed |
| Phase 3 — deploy verification | max 3 | **2 attempts** | attempt 1 `ESCALATED` (Vercel Authentication, superseded); attempt 2 **PASS (scoped)** | **closed on the PASS verdict** — 1 attempt unused, 0 fix rounds consumed |

Per-phase detail:

- **Phase 1** — Verifier passed attempt 1 with no gate failure. Stage 5a's audit-trail run then
  found the heading-format defect; stage 4 fixed it in one scoped re-verification
  (`25-verification.md` §Re-verification (attempt 2, phase 1)) and the gate re-ran exit 0. One
  attempt consumed of three.
- **Phase 2** — PR #13, round 1: `lint`, `test`, `build`, `Vercel`, `Vercel Preview Comments` all
  `bucket: pass`, terminal at `2026-10-25T18:00:53Z` after 3 polls over ~75 s. No FAIL, no
  remediation, no routing. One round consumed of three.
- **Phase 3** — attempt 1 `ESCALATED` on preview unreachability (infrastructure, superseded);
  attempt 2 **PASS, scoped**. Two attempts consumed of three; `Phase-3 budget exhausted` does
  **not** apply. Between the two attempts, two **behaviour** remediation rounds were applied
  (retrieval ranking, then prompt policy), each found by a live run rather than by a gate. Note
  the accounting: `40-deploy.md` records **0 fix rounds consumed**, because a "fix round" in that
  counter is a *fix-and-redeploy*, and no redeploy was triggered — the build under test is the Git
  integration's single build of `c343e17`, and the run under test is the local server for this
  tree. The loop therefore advanced by attempts (1 → 2), not by fix rounds. Do not recompute the
  budget as "2 attempts plus 2 remediation rounds".

Orchestrator counters, verbatim, across the three spec-002 runs — the progression is the record:

```
{"specSlug":"002-advisor-scope-expansion","gatesFailed":[],"outcome":"pass","loopCount":0,"phase1Retries":0,"phase2Retries":0}
{"specSlug":"002-advisor-scope-expansion","gatesFailed":[],"outcome":"pass","loopCount":1,"phase1Retries":1,"phase2Retries":0}
{"specSlug":"002-advisor-scope-expansion","gatesFailed":[],"outcome":"pass","loopCount":2,"phase1Retries":1,"phase2Retries":0}
```

`25-verification.md` agrees on the latest: `SPEC_LOOP_COUNT=2`, `SPEC_PHASE1_RETRIES=1`,
`SPEC_PHASE2_RETRIES=0`.

**On the phase-1 round this report itself raised.** The first record (`loopCount 0`) is the state
the Verifier saw and is correct for it: no gate FAILed during its own run, so it consumed nothing
then. The audit-trail defect was invisible at stage 4 — the Verifier does not run that gate; it is
stage 5b's pre-push gate, and stage 5a ran it first. It closed in a single further round, recorded
as attempt 2 in `25-verification.md`, and appears as `phase1Retries: 1` from the second record on.

**Phase 3 is not in `runs.jsonl` at all.** The orchestrator's record schema carries only
`phase1Retries` and `phase2Retries`; the phase-3 attempt counter lives in `40-deploy.md` and is the
authority for that row. Do not read the absence of a phase-3 field as zero attempts — it is two of
three, per that artifact.

No budget is exhausted: phase 3 retains one attempt, and phases 1 and 2 retain two each.

> Note on provenance: `runs.jsonl` also holds four records for spec **001** with
> `phase1Retries: 3` (a different spec, whose phase-1 budget was exhausted and which was
> resolved by a human-authorized fourth round). Those counters belong to spec 001 and are **not**
> carried into this report.

---

## Test-quality judgment without a mutation engine

With no mutation run, I can still read the tests and ask the question a mutant would ask:
*if this implementation were wrong, would the assertion fail?* At stage 5a I read **every** AC-002
test file that then existed — all 33 scenarios (11 files) — plus `test/unit/allowed-norms.test.ts`
and the two test doubles that every behavioral assertion routes through
(`test/support/fake-llm-adapter.ts`, `test/support/ui-harness.tsx`).

The three scenarios added later by the phase-3 rounds (`AC-002-34`, `35`, `36` — 8 tests in 2
files) were reviewed afterwards, to the depth recorded in the strengths list below. Their counts
are reflected in this report; their assertions were not audited with the same scenario-by-scenario
rigour as the original 33. The findings in this section are unchanged by them.

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
- **`AC-002-34` / `AC-002-35`** (added after the phase-3 retrieval defect) run against the
  committed `corpus/corpus.json` — the production artifact, not the fixture corpus — and assert
  that a *named governing passage is inside the bundle* under the unchanged `retrievalTopK`. That
  is the right granularity: the bundle is what the model sees, so membership is the behavioural
  claim, while 95 → 2 is measurement rather than an assertion (a hard rank assertion would be
  brittle against future corpus growth). These are the tests that would have caught the retrieval
  defect, and they are the reason that class of defect is no longer invisible — see §Phase 3.
- **`AC-002-36`** pins the policy to the widened scope by regex over the assembled `system` string
  (identity names IRPF/IVA/autónomo/alta censal; the procedural instruction is present; every
  safety rule survives). It cannot assert model behaviour — the constant is the strongest thing a
  test can guarantee here — so it guards against the *policy* drifting back, not against the model
  ignoring it.

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

## Handoff — current state and next stage

Stage 5b's part is done: **PR #13** (draft) is open on `spec/002-advisor-scope-expansion` — at head
`c343e17` when this section was written, and at the remediation head after §Phase-3 remediation
committed and pushed. Phase 2 is green (5 of 5 checks pass). Phase 3 ran to **PASS, scoped** on
attempt 2 of 3. Stage 5d (the Archiver) is next; it runs `check-audit-trail.sh --require-deploy`,
which this spec now satisfies — `40-deploy.md` exists and carries a verdict.

Three things must travel with the PR:

- **Two fixes are committed and pushed** (`0c52d22` retrieval, `c89c880` policy), alongside the two
  new scenario files, their tests, `40-deploy.md` and this report. The PR head now contains the
  behaviour attempt 2 verified; see §Phase-3 remediation committed and pushed.
- **The preview lane is unresolved, by design.** The Vercel deployment sits behind Vercel
  Authentication with no bypass secret; `40-deploy.md` records that as an open human action, not a
  code defect. Phase 3's PASS is a local-run PASS, and the artifact says so in those words.
- **The "4 FAIL → 0" baseline figure** remains unverified (the Coder-state tree is unrecoverable).
  It blocks nothing.

Every gate is green at the tree as it stands: suite 413 / 46, type-check, lint, build, diff-scoped
design-principles 0 FAIL / 0 WARN, audit-trail exit 0. The mutation gate is still skipped by tier,
not by failure — which is worth remembering the next time a defect slips through, as two did here.

Stage 5a itself committed and pushed nothing and modified no production code or test. The
measurement worktree used for the baseline numbers was removed (`git worktree list` shows only the
spec branch checkout).

---

## PR — appended by stage 5b (PR Opener)

PR: https://github.com/RexiAI/tax-advisor/pull/13
commit-count: 16
at: 2026-10-25T17:58:44Z
amended: 2026-10-26 — commit-count 13 → 16 after the phase-3 remediation commits; the block's
original `at:` timestamp is left as written, because that is when the PR was opened.
fix-commits: 0c52d22 (round 1, retrieval), c89c880 (round 2, policy), plus the stage-5b docs commit
pushed-head: recorded in the PR body of #13 and in §Phase-3 remediation committed and pushed. A tip
commit cannot embed its own SHA — writing it changes the SHA — so the sha of the pushed head lives
in the mutable PR body, which is where a reviewer reads it anyway.

Draft PR, base `main`, head `spec/002-advisor-scope-expansion`. One conventional commit per task
in `10-tasks.md` (11), plus `docs(spec-002)` for the artifacts and this amendment. Files that
span tasks were grouped in the task that owns them (`allowed-norms.ts` → Task 1,
`responses.ts`/`answer-question.ts`/`types.ts`/`use-chat-turn.ts` → Task 4, `strings.ts` →
Task 7) and the grouping is stated in each commit body; no file was split across commits.

Archive state, recorded so the next stage does not misread the red gate: this PR deliberately
carries `specs/002-advisor-scope-expansion/` and no `docs/changes/` one-pager.
`check-specs-archived.sh` therefore exits 1 at this head — stage 5d (the Archiver) resolves it as
the pipeline's final act, after stage 5c writes `40-deploy.md` into this folder
(`docs/SPEC_PIPELINE.md` §Archive in the PR). Archiving at 5b would delete the folder stage 5c
needs. This repo's CI (`.github/workflows/ci.yml`) does not wire that gate, so CI is unaffected;
the PR is simply not mergeable until 5d runs.

*Updated at the remediation head (2026-10-26):* the gate no longer exits 1 — it exits 0 for a
**spurious** reason, not because the spec was archived. The evidence and the mechanism are at the
end of this report (§Phase-3 remediation committed and pushed); nothing was archived, and stage 5d
still owns that move.

### Evidence: draft PR opened

command: gh pr create --draft --base main --head spec/002-advisor-scope-expansion --title "feat: expand the advisor from IRPF explainer to autónomo fiscal cycle" --body-file /tmp/opencode/pr-body-002.md
exit: 0
at: 2026-10-25T17:58:44Z

```
https://github.com/RexiAI/tax-advisor/pull/13
```

### Evidence: PR is a draft against main

command: gh pr view 13 --json number,url,isDraft,baseRefName,headRefName,state
exit: 0
at: 2026-10-25T17:58:44Z

```
{"baseRefName":"main","headRefName":"spec/002-advisor-scope-expansion","isDraft":true,"number":13,"state":"OPEN","url":"https://github.com/RexiAI/tax-advisor/pull/13"}
```

### Evidence: audit-trail gate, re-run at the committed tree

command: .standards/scripts/check-audit-trail.sh 002-advisor-scope-expansion
exit: 0
at: 2026-10-25T17:57:20Z

```
✔ Audit-trail check: specs/002-advisor-scope-expansion complete, verifier evidence recorded.
```

### Evidence: archive gate at this head (expected red until stage 5d)

command: .standards/scripts/check-specs-archived.sh
exit: 1
at: 2026-10-25T17:57:20Z

```
  [FAIL] 002-advisor-scope-expansion is finished (has 30-report.md) but not archived — missing docs/changes/002-advisor-scope-expansion.md
         Run: scripts/archive-spec.sh 002-advisor-scope-expansion (stage 5d does this automatically)
1 finished spec(s) not archived!
```

---

## Phase-3 remediation committed and pushed — stage 5b, second invocation

The phase-3 PASS above was earned on a working tree, not on the PR head. This invocation closes that
gap: the two fixes, their two scenario files and their tests, `40-deploy.md`, the phase-2 record in
`25-verification.md`, Tasks 12–13 in `10-tasks.md`, the `runs.jsonl` record and this report were
committed in three conventional commits and pushed to `origin/spec/002-advisor-scope-expansion`.

| Commit | Subject | Concern |
|---|---|---|
| `0c52d22` | `fix(retrieval): reach the norm that governs a procedure from colloquial wording` | Task 12 — `src/retrieval/expand.ts` + `AC-002-retrieval-vocabulary` scenario + test |
| `c89c880` | `fix(prompts): stop telling the model this is an IRPF-only assistant` | Task 13 — `src/prompts/system-policy.ts` + `AC-002-policy-scope` scenario + test |
| (this commit) | `docs(spec-002): record the phase-3 remediation and the deploy verdict` | the spec-folder record, `40-deploy.md`, `runs.jsonl`, this amendment |

Commit count on the branch: **16** (13 at PR open + 3 here). Each commit body names its phase-3
provenance (remediation round 1, round 2) and why no gate in this report could see the defect it
fixes — the same question `§The reportable lesson` answers structurally.

Staging was by explicit path in both fix commits; `.env.local` was never staged and
`config/agent.local.env` is untracked and gitignored. `.playwright-mcp/` (browser-automation scratch
from the live runs) is left untracked deliberately — it is not part of this spec.

### Evidence: audit-trail gate before this push

command: .standards/scripts/check-audit-trail.sh 002-advisor-scope-expansion
exit: 0
at: 2026-10-26T07:01:16Z

```
PASS 002-advisor-scope-expansion: 10-tasks.md present and non-empty
PASS 002-advisor-scope-expansion: 20-acceptance/ has an AC-*.md with a '## AC-NNN-NN' heading (AC-015-10)
PASS 002-advisor-scope-expansion: 25-verification.md present and non-empty
PASS 002-advisor-scope-expansion: 30-report.md present and non-empty
PASS 002-advisor-scope-expansion: 15-design.md present and non-empty (AC-015-13)
PASS 002-advisor-scope-expansion: 40-deploy.md present and non-empty (AC-031-18)
PASS 002-advisor-scope-expansion: evidence block 'scenario traceability' — command: .standards/scripts/check-scenario-traceability.sh, exit: 0, at: 2026-10-25T17:40:30Z
PASS 002-advisor-scope-expansion: evidence block 'full test suite' — command: npm test, exit: 0, at: 2026-10-25T17:40:45Z
PASS 002-advisor-scope-expansion: evidence block 'complexity gate' — command: npm run lint, exit: 0, at: 2026-10-25T17:41:20Z
PASS 002-advisor-scope-expansion: evidence block 'design-principles gate' — command: .standards/scripts/check-code-principles.sh ., exit: 1, at: 2026-10-25T17:42:40Z
PASS 002-advisor-scope-expansion: evidence block 'scenario-to-behavior spot check' — command: (manual read of test + source + scenario; no shell command), exit: 0, at: 2026-10-25T17:43:40Z
✔ Audit-trail check: specs/002-advisor-scope-expansion complete, verifier evidence recorded.
```

`40-deploy.md` now resolves its line to `PASS` (it was `absent — tolerated pre-5c` in the block
above, recorded at PR-open time). That is the artifact stage 5d's `--require-deploy` gate needs, and
it is present.

### Evidence: archive gate — red while `40-deploy.md` was untracked, a spurious pass once tracked

Both runs below are the same script on the same tree; the only difference is that `40-deploy.md`
became a tracked file in the commit that precedes this section.

command: .standards/scripts/check-specs-archived.sh
exit: 1
at: 2026-10-26T07:01:16Z

```
  [FAIL] 002-advisor-scope-expansion is finished (has 30-report.md) but not archived — missing docs/changes/002-advisor-scope-expansion.md
         Run: scripts/archive-spec.sh 002-advisor-scope-expansion (stage 5d does this automatically)
1 finished spec(s) not archived!
```

command: .standards/scripts/check-specs-archived.sh
exit: 0
at: 2026-10-26T07:02:02Z

```
  [OK] 002-advisor-scope-expansion phase-3 budget exhausted (40-deploy.md records escalation) — archival deferred to the human
All finished specs archived.
```

**The exit 0 is spurious, and must not be read as "no archive needed".** The script reads the
*index* copy of the deploy artifact (`git show ":specs/<slug>/40-deploy.md"`, lines 45–48 of
`check-specs-archived.sh`) and takes the spec-031 exception when that text matches
`Phase-3 budget exhausted` or `Verdict:[[:space:]]*ESCALATED`. While the file was untracked the
`git show` failed, control fell to the FAIL branch, and the gate was honest. Now that it is
tracked, the match fires on the two lines that say the marker does **not** apply
(`40-deploy.md:28`, `:258`) — the artifact's final verdict is `Verdict: PASS` (§Verdict summary) —
so the gate concludes the pipeline stopped and escalated before stage 5d, which it did not.

Consequence, stated plainly: **this pass does not license a merge and does not discharge the
archive.** Archiving stays stage 5d's act (`docs/SPEC_PIPELINE.md` §Archive in the PR,
§Definition of done item 6) and nothing was archived in this invocation — `specs/002-advisor-scope-expansion/`
is still in the tree, `docs/changes/002-advisor-scope-expansion.md` does not exist, and stage 5d
still has to run `archive-spec.sh` and then `check-audit-trail.sh --require-deploy`. Archiving here
would delete the `40-deploy.md` that 5d's gate exists to read, so this invocation deliberately does
not do it.

**Out-of-scope finding (recorded, not fixed — gate scripts are off-limits to pipeline agents, and
this one lives in the `.standards` submodule).** The ESCALATED exception is matched as a substring
over the whole artifact, so an artifact that *discusses* the marker satisfies it. A gate that reads
the final `Verdict:` line, rather than any mention of a verdict anywhere in the prose, would not
have this hole. Proposed follow-up against `.standards`: anchor the check to the verdict row and
keep the marker-text branch separate, with a negative case in its selftest for an artifact that
negates the marker. Until then, this exit code should not be trusted as evidence of archival state.

