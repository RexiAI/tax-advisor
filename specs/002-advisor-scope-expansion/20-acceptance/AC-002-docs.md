# AC-002: Actualizar runbook y nota de volumen de ADR 0001

## AC-002-31 — El runbook describe el corpus ampliado
Given `docs/RUNBOOK.md`
When §1 (Corpus sync) is read
Then it no longer says «the two covered norms» nor lists only `BOE-A-2006-20764` and `BOE-A-2007-6820`
And it names the expanded norm set by title
And it keeps the same sync command, exit-code semantics (0/1) and incremental/idempotent invariants
And the «BOE changed / parsing broke» section still names every-norm-fixture convention under `test/fixtures/boe/`

## AC-002-32 — La nota de ADR 0001 recoge el crecimiento y no impone medir recall
Given `docs/adr/0001-lexical-retrieval.md`
When the "Revisit condition" section is read
Then it records that the corpus grew from 2 to 8 norms (from 396 to several thousand passages)
And it points to `docs/adr/0003-advisor-scope-expansion.md` for the scope decision
And it does not introduce any obligation to measure recall (the risk is accepted)
