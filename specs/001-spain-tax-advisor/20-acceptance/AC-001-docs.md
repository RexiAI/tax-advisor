# AC-001 / Task 17 — Runbook and the two ADRs

## AC-001-86 — The runbook covers the five operational paths with real commands

Given `docs/RUNBOOK.md`
Then it has sections for corpus sync, the environment-variable table, local run, deploy, and
"BOE changed / parsing broke"
And each section contains at least one runnable command
And the "parsing broke" section states that a failed parse exits non-zero and must never ship a
shrunken corpus, and names the fixture file to extend before fixing the parser
And every path and script named in the runbook exists in the repository

## AC-001-87 — The retrieval ADR records the alternative and the revisit condition

Given the ADR for lexical retrieval
Then it follows the repository ADR structure: Context, Decision, Alternatives considered,
Consequences
And the alternatives list includes embeddings and a vector database
And it states the measurable condition under which the decision would be revisited
And it cites the BOE/AEAT sources it relies on and no commercial competitor content

## AC-001-88 — The no-persistence ADR records the privacy rationale

Given the ADR for "no server-side persistence in v1"
Then it follows the same structure
And it covers the in-memory session state, what breaks on a serverless host, and the data-minimisation
rationale
And it names the alternative of storing conversations and why it was rejected
And no ADR cites a commercial product's marketing content as a source
