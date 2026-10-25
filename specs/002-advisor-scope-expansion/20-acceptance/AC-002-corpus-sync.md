# AC-002: Sincronizar el corpus ampliado preservando invariantes

## AC-002-04 — El sync recorre exactamente las normas permitidas
Given a fake `CorpusFetcher` and no previous artifact
When `runCorpusSync` runs with the expanded `ALLOWED_NORMS`
Then the number of `getLastUpdated` calls equals `ALLOWED_NORMS.length` (8)
And the success result lists `fetchedNormIds` of length `ALLOWED_NORMS.length`

## AC-002-05 — Una norma sin cambios se reutiliza; solo la cambiada se re-descarga
Given a previous artifact covering all eight norms
And the BOE `fecha_actualizacion` changed for exactly one norm
When `runCorpusSync` runs against that previous artifact
Then `fetchedNormIds` has length 1
And `reusedNormIds` has length `ALLOWED_NORMS.length - 1`
And the reused norm's `fetchedAt` is carried over untouched

## AC-002-06 — Un parse roto de una norma nueva detiene el sync y no escribe
Given a fake fetcher that returns unparsable XML for one new norm
When `runCorpusSync` runs
Then the result is `{ok:false, error:'parse_failed', normId, detail}`
And the CLI returns exit 1 without writing the artifact
And the committed artifact is not modified

## AC-002-07 — Los fixtures offline cubren las normas nuevas y la suite no toca boe.es
Given the offline test fixtures under `test/fixtures/boe/`
And the harness `FIXTURE_META` in `test/support/harness.ts`
When `fixtureCorpus()` builds the test index
Then the index contains passages from the new norms
And `fixtureCorpus().index.size` is greater than the 396 passages of the two IRPF norms
And no test performs network I/O to `boe.es`
