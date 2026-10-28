# 40-deploy.md — 003-household-expenses

Stage 5c deploy verification for PR #14.

> Written on 2026-10-28 after the deploy-verifier subagent could not run (provider
> quota exhausted). The evidence below is the same commands that stage would have
> run, executed directly. Nothing here is inferred.

## Deployment

- Project: `tax-advisor` (`prj_WDoYUNdHoRHw6lOuxNz3WxMTTllo`, scope `danielbueno76-4270s-projects`)
- Deployment: `dpl_4g76Ly5YLLj5uNV1ncmGuuBQeudj`
- URL: `https://tax-advisor-ogp5r2ph8-danielbueno76-4270s-projects.vercel.app`
- Branch alias: `https://tax-advisor-git-spec-003-ho-cbc109-danielbueno76-4270s-projects.vercel.app`
- Target: `preview` · readyState: `READY`
- Linked commit: `c630cda973aa93fe43a6e814ce2c2ab01a9ee839` (the `Vercel` commit
  status on that SHA points at this deployment id; branch alias carries
  `spec-003`)

## Evidence: build status

command: vercel inspect 4g76Ly5YLLj5uNV1ncmGuuBQeudj --scope danielbueno76-4270s-projects --json
exit: 0
at: 2026-10-28T10:33:00Z

```
{"id":"dpl_4g76Ly5YLLj5uNV1ncmGuuBQeudj",
 "url":"tax-advisor-ogp5r2ph8-danielbueno76-4270s-projects.vercel.app",
 "readyState":"READY","target":"preview"}
```

Human-readable inspect also reported: `status ● Ready`, `build duration 18s`,
`post-build duration 21s`, `actual assigned cores 2 vCPU`.

## Evidence: health check

command: curl -sS -o /dev/null -w 'http=%{http_code} redirect=%{redirect_url} time=%{time_total}\n' --max-time 20 https://tax-advisor-ogp5r2ph8-danielbueno76-4270s-projects.vercel.app
exit: 0
at: 2026-10-28T10:34:00Z

```
http=302 redirect=https://vercel.com/sso-api?url=https%3A%2F%2Ftax-advisor-ogp5r2ph8-danielbueno76-4270s-projects.vercel.app%2F&nonce=… time=0.270255
```

Status: **BLOCKED — Vercel Deployment Protection.** The 302 goes to
`vercel.com/sso-api`, i.e. Vercel Authentication on the preview, not the app's
own `/login` redirect. The same 302 is returned by the branch alias. No
`VERCEL_AUTOMATION_BYPASS_SECRET` (`x-vercel-protection-bypass`) is configured in
this environment, so an unauthenticated health check (and any browser E2E) cannot
reach the app.

This is a configuration/access condition, not a product failure: the build is
`READY`, and the deployment was created at `2026-10-26T12:39:12Z` — the same
minute as the CI run for `c630cda`.

## Evidence: E2E

command: ls -d e2e .maestro; grep -n '"e2e"' package.json
exit: 1
at: 2026-10-28T10:34:30Z

```
ls: cannot access 'e2e': No such file or directory
ls: cannot access '.maestro': No such file or directory
(no "e2e" script in package.json)
```

E2E verdict: **SKIPPED — no agentic E2E suite configured in this repo.** No suite
was invented, and none was pointed at a local server.

## Verdict

Phase-3 attempt: **1**
Timestamp: `2026-10-28T10:35:04Z`

**Verdict: SKIPPED — preview protected by Vercel Deployment Protection; health
check and E2E not evaluable without a protection-bypass secret.**

Escalation for the human (not a code defect): either enable *Protection Bypass for
Automation* on the `tax-advisor` Vercel project and export
`VERCEL_AUTOMATION_BYPASS_SECRET` in the per-machine `config/agent.local.env`, or
accept this artifact as the deploy record for this feature. Re-running phase 3
after the bypass exists is a single `curl` + verdict update; the deployment is
already `READY` for the merged head.
