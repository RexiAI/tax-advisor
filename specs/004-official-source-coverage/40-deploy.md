# 40-deploy.md — 004-official-source-coverage

Stage 5c deploy verification for PR #17.

> Written on 2026-10-28 after the deploy-verifier subagent could not be invoked
> (model access denied for that agent). The evidence below is the same commands
> that stage would have run, executed directly. Nothing here is inferred.

## Deployment

- Project: `tax-advisor` (`prj_WDoYUNdHoRHw6lOuxNz3WxMTTllo`, scope `danielbueno76-4270s-projects`)
- Deployment: `dpl_EE3mxaMUEJPDjm62AxC7tBWuz68P`
- URL: `https://tax-advisor-q5x0ynupg-danielbueno76-4270s-projects.vercel.app`
- Target: `preview` · readyState: `READY` · created `2026-10-28T16:47:59Z`
- Linked head: `3212a1f1b3064c8f825cfc85ce0fa1855543567d` (the `Vercel` commit
  status on that SHA points at this deployment id; CI run `40730415574` on the
  same SHA is green)

## Evidence: build status

command: vercel inspect EE3mxaMUEJPDjm62AxC7tBWuz68P --scope danielbueno76-4270s-projects
exit: 0
at: 2026-10-28T16:55:40Z

```
Fetching deployment "dpl_EE3mxaMUEJPDjm62AxC7tBWuz68P" in danielbueno76-4270s-projects
> Fetched deployment "tax-advisor-q5x0ynupg-danielbueno76-4270s-projects.vercel.app"
  id      dpl_EE3mxaMUEJPDjm62AxC7tBWuz68P
  name    tax-advisor
  target  preview
  status  ● Ready
  url     https://tax-advisor-q5x0ynupg-danielbueno76-4270s-projects.vercel.app
```

## Evidence: health check

command: curl -sS -o /dev/null -w 'http=%{http_code} redirect=%{redirect_url} time=%{time_total}\n' --max-time 20 https://tax-advisor-q5x0ynupg-danielbueno76-4270s-projects.vercel.app
exit: 0
at: 2026-10-28T16:56:16Z

```
http=302 redirect=https://vercel.com/sso-api?url=https%3A%2F%2Ftax-advisor-q5x0ynupg-danielbueno76-4270s-projects.vercel.app%2F&nonce=… time=0.318255
```

Status: **BLOCKED — Vercel Deployment Protection.** The 302 targets
`vercel.com/sso-api`, i.e. Vercel Authentication, not the app's own `/login`
redirect. No `VERCEL_AUTOMATION_BYPASS_SECRET` (`x-vercel-protection-bypass`) is
configured in this environment, so an unauthenticated health check cannot reach
the app. Same condition recorded for spec 003 (`docs` / PR #14 `40-deploy.md`).

## Evidence: E2E

command: ls -d e2e .maestro; grep -n '"e2e"' package.json
exit: 2 / 1
at: 2026-10-28T16:56:19Z

```
ls: cannot access 'e2e': No such file or directory
ls: cannot access '.maestro': No such file or directory
(no "e2e" script in package.json)
```

E2E verdict: **SKIPPED — no agentic E2E suite configured in this repo.**

## Verdict

Phase-3 attempt: **1**
Timestamp: `2026-10-28T16:56:19Z`

**Verdict: SKIPPED — preview protected by Vercel Deployment Protection; health
check and E2E not evaluable without a protection-bypass secret.**

Escalation for the human (not a code defect): enable *Protection Bypass for
Automation* on the `tax-advisor` Vercel project and export
`VERCEL_AUTOMATION_BYPASS_SECRET` in the per-machine `config/agent.local.env`, or
accept this artifact as the deploy record. The build itself is `READY` for the
PR head; re-running the health check after a bypass exists is a single `curl`.
