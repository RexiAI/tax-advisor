# 40-deploy.md — Deploy verification (stage 5c, phase 3)

Spec: `002-advisor-scope-expansion`
Repo: `RexiAI/tax-advisor` — classified **frontend**. Signals: `vercel.json` (`"framework": "nextjs"`),
Next.js 15 dependency in `package.json`, linked Vercel project in `.vercel/project.json`
(`projectName: tax-advisor`, `projectId: prj_WDoYUNdHoRHw6lOuxNz3WxMTTllo`).
PR: #13 (draft) · branch `spec/002-advisor-scope-expansion` · HEAD
`c343e17d4c4a7efd5e942311a9891b81a57abd0c` · **working tree dirty** (see §Tree under test)
Phase-3 attempt: **2 of 3** · fix rounds consumed: **0** · written at `2026-10-26T06:54:30Z`
Attempt 1 verdict `ESCALATED` (Vercel preview behind Vercel Authentication) — **superseded** by this
attempt, whose evidence is below.

## Summary

| Field | Value |
|---|---|
| Deploy URL (canonical, the deployment under test) | `https://tax-advisor-j4phqcxjy-danielbueno76-4270s-projects.vercel.app` |
| Deploy URL (branch alias) | `https://tax-advisor-git-spec-002-ad-acc3be-danielbueno76-4270s-projects.vercel.app` |
| Deployment id | `dpl_49KcnY72nvoS8cvtbXHiwG4W8Wwz` |
| Preview reachability | **still behind Vercel Authentication** — attempt 1 evidence, superseded, not re-litigated here (see §Preview lane) |
| Endpoint actually exercised | `http://localhost:3124` — the already-running server for this working tree (HTTP-level run) |
| Built from commit | `c343e17d4c4a7efd5e942311a9891b81a57abd0c` + uncommitted working-tree changes |
| Build status | **PASS** — attempt 1: `READY`, 44 s build, 17 s post-build. No build was triggered by this attempt. |
| Health check (`GET /health`, local run) | **PASS** — `200`, `{"status":"ok","checks":{"llmConfig":"ok","corpusIndex":"ok"}}` in 3.4 ms |
| Behaviour probes (`POST /api/chat` ×3) | **PASS** — 3 of 3 questions satisfy their judging rule (see §Per-question verdicts) |
| E2E verdict | **SKIPPED** — no suite wired in this repo; the HTTP-level run carried verification |
| Fix-routing class | none — no failure to route |
| Phase-3 budget | **2 of 3** attempts used; 0 fix rounds consumed; `Phase-3 budget exhausted` does **not** apply |

**Verdict: PASS**

## Claim boundary (explicit)

**This artifact proves the HEAD-tree code run locally at `http://localhost:3124` — it does not prove
the Vercel preview URL serves that code.** The three behavioural questions and the health check were
answered by a process on this machine, not by `tax-advisor-j4phqcxjy-…vercel.app`. The preview lane
remains unverified for the reason attempt 1 recorded: the deployment sits behind Vercel
Authentication (`vercel_auth_enabled: true`), no `VERCEL_AUTOMATION_BYPASS_SECRET` exists in the
`preview` environment, and `POST /api/chat` additionally requires an `AUTH_SECRET`-signed session
whose `AUTH_PASSWORD` cannot be pulled. Nothing in this attempt changes that. Reading this as "the
preview deploy is green" would be reading a claim this artifact does not make.

What is established: the shipped behaviour of spec 002 — scope expansion to the censal/IVA/autónomo
cycle — is present and correct in the code as it exists on disk at HEAD `c343e17` plus the dirty tree,
when that code is actually executed and asked real questions.

No `vercel deploy` / `vercel deploy --prod` was run at any point; the Git integration is the source of
truth for builds. No commit, push, tag, or production-code change was made. No service was started,
stopped, built, or restarted by this stage — the server on `:3124` was already running when the stage
began.

## Tree under test

command: git rev-parse HEAD; git status --porcelain
exit: 0
at: 2026-10-26T06:52:57Z

```
c343e17d4c4a7efd5e942311a9891b81a57abd0c
 M runs.jsonl
 M specs/002-advisor-scope-expansion/10-tasks.md
 M specs/002-advisor-scope-expansion/25-verification.md
 M src/prompts/system-policy.ts
 M src/retrieval/expand.ts
?? .playwright-mcp/
?? specs/002-advisor-scope-expansion/20-acceptance/AC-002-policy-scope.md
?? specs/002-advisor-scope-expansion/20-acceptance/AC-002-retrieval-vocabulary.md
?? specs/002-advisor-scope-expansion/40-deploy.md
?? test/acceptance/AC-002-policy-scope.test.ts
?? test/acceptance/AC-002-retrieval-vocabulary.test.ts
```

HEAD is the same commit the preview deployment was built from, but **the tree is dirty**: the two
source files carrying this spec's behaviour change — `src/prompts/system-policy.ts` (+16/−1) and
`src/retrieval/expand.ts` (+39) — are modified and uncommitted. The run below therefore exercises
`c343e17` **plus** those uncommitted changes, not the commit alone. Per the Stop-and-Ask decision
matrix this stage did not stash, revert, or commit anything; it records the state.

Corroboration that the running process includes the dirty-tree changes (not merely HEAD): the observed
behaviour matches exactly what the uncommitted diff introduces — the censal vocabulary in
`expand.ts` (`censo`, `censal`, `empresarios`, `profesionales`, `retenedores`, `036`, `037`) is what
surfaces `BOE-A-2007-15984#a9` for "darme de alta de autónomo", and the IVA filing terms
(`devengo`, `sujeto pasivo`, `liquidacion`) are what surface `BOE-A-1992-28740#a167/#a85` for the
IVA-timing question. On unmodified HEAD those questions resolve to LGSS cese passages instead. The
`system-policy.ts` diff adds the ALCANCE/PREGUNTAS DE PROCEDIMIENTO sections whose effect is visible
in the Q1 answer's grounded four-step explanation and in `scopeDisclaimer` being present.

## Evidence: health check (local run)

command: curl -sS -w '\nHTTP %{http_code} in %{time_total}s\n' --max-time 20 http://localhost:3124/health
exit: 0
at: 2026-10-26T06:53:59Z

```
{"status":"ok","checks":{"llmConfig":"ok","corpusIndex":"ok"}}
HTTP 200 in 0.003379s
```

`200` with the application's real `HealthBody`: both external dependencies the health route checks —
`llmConfig` and `corpusIndex` — report `ok`. Health check status **PASS** for the local run.

## Evidence: session established

command: curl -sS -X POST http://localhost:3124/api/auth/login -H 'content-type: application/json' -c jar.txt -d '{"email":"$AUTH_ALLOWED_EMAIL","password":"$AUTH_PASSWORD"}'
exit: 0
at: 2026-10-26T06:53:07Z

```
login HTTP 200
{"ok":true}
cookie received: rc_session (HttpOnly)
```

Credentials were read from `.env.local` into the shell environment only. No credential value appears
in this artifact, in any log line, or on any command line argument.

## Evidence: behaviour probes — three `POST /api/chat` calls

command: curl -sS -X POST http://localhost:3124/api/chat -H 'content-type: application/json' -b jar.txt --data-binary '{"message":"<question>"}'
exit: 0
at: 2026-10-26T06:53:21Z (Q1) · 2026-10-26T06:53:24Z (Q2) · 2026-10-26T06:53:24Z (Q3)

All three returned `HTTP 200` with a server-sent-event stream: `data: {"type":"delta",…}` chunks
followed by one `event: final` record carrying the structured response, then `event: done`.

### Per-question verdicts

| # | Question | HTTP | `kind` | `reasonCode` | Cited passage ids | `scopeDisclaimer` | Verdict |
|---|---|---|---|---|---|---|---|
| Q1 | `Quiero darme de alta de autónomo. Guíame` | 200 | `answer` | — (absent) | `BOE-A-2007-15984#a9`, `BOE-A-2007-15984#a6`, `BOE-A-2007-15984#a10`, `BOE-A-2007-15984#a11` | **present** | PASS |
| Q2 | `¿Cuándo empiezo a presentar el IVA si soy autónomo?` | 200 | `answer` | — (absent) | `BOE-A-2003-23186#a36`, `BOE-A-1992-28740#a167`, `BOE-A-1992-28740#a85`, `BOE-A-1992-28740#a163sexiesdecies`, `BOE-A-1990-23930#regla2` | **present** | PASS |
| Q3 | `¿Cuánto es el IBI de mi vivienda?` | 200 | `out_of_scope` | `ibi` | — (none; out-of-scope responses cite nothing) | absent | PASS |

Verbatim opening sentence of each response:

- **Q1** — «Para darte de alta como autónomo tienes que presentar una declaración de alta en el Censo de Empresarios, Profesionales y Retenedores, y hacerlo antes de empezar la actividad.»
- **Q2** — «No puedo confirmar cuándo empieza a presentarse el IVA siendo autónomo con los pasajes facilitados.»
- **Q3** — «Las preguntas sobre el IBI quedan fuera de mi alcance: la administración competente es la autoridad tributaria de tu comunidad autónoma.» (`explanation` field; `out_of_scope` responses carry no delta stream)

### Q1 — alta de autónomo: passes the judging rule

- **Starts the real procedure**: names the *declaración de alta en el Censo de Empresarios,
  Profesionales y Retenedores* in the first sentence, and the body explains the obligation, the census
  data required, and what the same declaration is used to communicate (NIF, IVA regime, IRPF
  estimation-method waivers).
- **Cites `BOE-A-2007-15984#a9`**: yes — both in the citation list and as an inline marker
  (`[^p:BOE-A-2007-15984#a9]`, 13 occurrences across the stream).
- **States the timing**: «hacerlo antes de empezar la actividad» in the summary, and the regulation's
  own rule — «con anterioridad al inicio de las correspondientes actividades … a la realización de las
  operaciones … al nacimiento de la obligación de retener o ingresar a cuenta» — plus the cese
  deadlines (one month; six months for heirs) from `#a11`.
- **Cites at least one other passage**: three others — `#a6`, `#a10`, `#a11`.
- **Contains none of the forbidden strings**: `Fuera del alcance` — absent; `no es una cuestión de
  IRPF` — absent; `fuera del alcance` — absent (case-insensitive check).
- **No six-step canned procedure**: the answer is not the old refusal-with-steps. It is a grounded
  four-part explanation (`Primero` / `Segundo` / `Tercero` / `Cuarto`, no bold headings, no asterisk
  bullets), each part carrying its own inline passage marker from `BOE-A-2007-15984`, and it is
  explicitly a partial answer — its closing line names what it cannot cover: «Con estos pasajes puedo
  explicarte el alta censal, pero no puedo confirmarte las cotizaciones al RETA ni las obligaciones
  periódicas de declaración del IRPF y del IVA, porque no aparecen en los textos facilitados.»

This is the "partial answer that delivers the censal procedure and names what it cannot cover" case,
which the rule admits as a pass; it is not a bare abstention.

### Q2 — IVA filing timing: passes as an honest partial grounded in `BOE-A-1992-28740`

`kind: answer`, and the answer is candid about the gap it cannot close: the corpus passages do not fix
the moment the IVA filing obligation arises or its deadlines. It still grounds what it does say in the
IVA law itself — `BOE-A-1992-28740#a167` (sujeto pasivo determines and pays the debt in the manner and
periods set by the Minister) and `#a85` (intra-community acquisitions) — and states the general
obligation to file the alta declaration for merely carrying on an economic activity
(`BOE-A-1990-23930#regla2`), plus `BOE-A-2003-23186#a36` for who the taxpayer is. It closes by naming
the passage class it would need and offers to narrow by income type.

Named-gap partial grounded in `BOE-A-1992-28740` → **PASS** under the stated rule. It is not a
fabricated deadline and not a hallucinated article.

### Q3 — IBI: passes

`kind: out_of_scope` with `reasonCode: ibi`, `topicLabel: el IBI`, `officialBody: la autoridad
tributaria de tu comunidad autónoma`, a `handoffUrl`, and the standard `disclaimer`. The scope
boundary is declared rather than answered, and the reason code is exactly `ibi` as required.

## Evidence: E2E suite wiring

command: ls -d playwright.config.ts playwright.config.js maestro.yml .maestro e2e; grep -n '"e2e"' package.json; grep -nE '"(playwright|@playwright/test|maestro)"' package.json
exit: 0
at: 2026-10-26T06:53:59Z

```
ls: cannot access 'playwright.config.ts': No such file or directory
ls: cannot access 'playwright.config.js': No such file or directory
ls: cannot access 'maestro.yml': No such file or directory
ls: cannot access '.maestro': No such file or directory
ls: cannot access 'e2e': No such file or directory
no e2e npm script
no playwright/maestro dep
```

No Playwright config, no Maestro flow directory, no `e2e` npm script, and no `playwright` /
`@playwright/test` / `maestro` dependency in `package.json`. The repo's test layer is Vitest
(`"test": "vitest run"`) under `test/`; `.playwright-mcp/` in the working tree holds browser-session
artifacts only (a console log and a page snapshot), not a suite.

**E2E verdict: `skipped — no suite wired`.**

Disclosure, because it changes what the pass above rests on: the agentic browser E2E path (the
`e2e-runner` standard) **could not complete in this harness** — no `e2e` framework, no suite, and no
browser session that reached a judged journey for this spec. Verification was therefore carried by
the HTTP-level run recorded above: live HTTP calls to a running instance of this tree, with the real
corpus, the real retrieval path, the real model configuration, and a real authenticated session. That
is a genuine live-system check of the application's behaviour; it is not a browser E2E, and it does
not exercise rendering, the `scopeDisclaimer` UI in `AnswerBlock.tsx`, or client-side wiring.

## Preview lane (attempt 1 evidence, superseded but not revoked)

Attempt 1 of this phase verified the Vercel build and found the preview unreachable:

| Check | Attempt 1 result |
|---|---|
| Build (`vercel inspect`, `vercel ls -m githubCommitSha=c343e17…`) | **PASS** — exactly one deployment for the head SHA, `READY`, `44 s` build `+17 s` post-build |
| Health check against the preview URL | **FAIL** — `302` to Vercel SSO (`Protected by Vercel Authentication`) |
| `POST /api/chat` against the preview URL | **BLOCKED** — `401 {"error":{"message":"Protected deployment","code":"401"},"protection":{"vercel_auth_enabled":true}}` |
| Runtime logs for the deployment | 0 records in the 30-minute probe window — no request reached the app |

Those measurements stand; this attempt did not re-run them and does not contradict them. The one line
that matters, restated: **the preview deployment stays behind Vercel Authentication, so no probe
issued by this stage can reach the application through the preview URL.** Attempt 1's `ESCALATED`
verdict for that lane is what a human must still resolve (Project Settings → Deployment Protection →
*Protection Bypass for Automation*, or disable *Vercel Authentication* for previews), and that
requirement is unchanged. This attempt supersedes attempt 1 only in the sense that the behavioural
questions now have an answer measured on real code — not in the sense that the preview became
verifiable.

## Fix-routing outcome

No branch of the fix-routing rule fires, because no check failed:

| Branch | Applies? | Reasoning |
|---|---|---|
| E2E runner exits non-zero → spec-coder | **No** | No suite is wired; the runner never ran, so no exit code exists |
| Vercel configuration-classified error → self-retry after repair | **No** | No Vercel API call was made by this attempt, and no configuration error was returned |
| Structural/complexity gate failure → spec-refactorer | **No** | No structural gate is in play in phase 3 |
| Ambiguous build or health failure → STOP and escalate | **No** | Health check returned `200` with both dependencies `ok`; build status is `PASS` |

## Phase-3 budget state

- Attempt: **2 of 3** (max 3 fix-and-redeploy rounds; counter independent of phase 1 and phase 2).
- Fix rounds consumed: **0**, cumulative. No redeploy was triggered by attempt 1 or attempt 2 — the
  build under test is the Git integration's single build of `c343e17`, and the run under test is the
  already-running local server for this tree.
- Attempt 1 (`ESCALATED`, preview behind Vercel Authentication) is superseded by this record; it is
  retained in summary form above because its diagnosis is still the open human action for the preview
  lane, not because it still governs the verdict.
- Phase-2 precondition: satisfied — CI on PR #13 head `c343e17` is terminal and green (`lint`, `test`,
  `build` SUCCESS; Vercel SUCCESS; Vercel Preview Comments SUCCESS), recorded in
  `25-verification.md §Phase 2 — round 1`. Phase 3 started only after that, so the two loops did not race.
- The marker line `Phase-3 budget exhausted` does **not** apply: this is a pass on attempt 2 of 3.
- One attempt remains unused. It is not needed for this phase's verdict; it remains available if a
  human later unblocks the preview lane and wants that lane measured too.

## Deliberate non-actions, for the record

- **No `vercel deploy` / `vercel deploy --prod`** was run, and none would be: a CLI deploy alongside
  the Git integration double-builds `c343e17`, races the integration, and orphans a deployment no PR
  owns.
- **`vercel curl` was not run** in this attempt either, for the reason attempt 1 recorded: a green
  result obtained through a channel no other consumer (CI, an E2E runner, a reviewer) can reproduce is
  not evidence about the deployed system as delivered.
- **No service was built, started, stopped, or restarted.** The server on `:3124` was already running.
- **No protection setting was changed, no `vercel env add` was issued.** The missing pieces are a
  protection policy decision and a credential, not an environment variable this stage may invent.
- **This artifact is the only file this stage writes.** `25-verification.md` and `30-report.md` were
  not touched.

Verdict: PASS
