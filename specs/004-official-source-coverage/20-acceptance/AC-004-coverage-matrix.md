# AC-004: Declared coverage matrix — machine-readable, single lookup

## AC-004-12 — The lookup answers true for a declared pair
Given an artifact whose `coverage` declares `(madrid, irpf)`
When `isCovered(coverage, 'madrid', 'irpf')` is called
Then the result is `true`

## AC-004-13 — The lookup answers false for an undeclared pair, unknown jurisdiction, or unknown tax
Given an artifact whose `coverage` declares only `(state, irpf)` and `(madrid, irpf)`
When `isCovered` is called for `(madrid, 'itp')`, for `(murcia, 'irpf')`, and for `('barcelona', 'irpf')`
Then each result is `false`

## AC-004-14 — The committed coverage declares exactly the six pilot pairs
Given the committed `corpus/corpus.json`
When its `coverage` list is read as a set
Then it equals `{ (state, irpf), (state, iva), (state, autonomo), (state, iae), (madrid, irpf), (murcia, irpf) }`

## AC-004-15 — Coverage is derived from the registry, not a second list
Given the norm registry is the only place `(jurisdiction, tax)` is declared per norm
When the sync runs
Then the artifact's `coverage` is exactly the set of `(jurisdiction, tax)` tags over the registry
And no other module hardcodes a covered/uncovered pair list

## AC-004-16 — A missing or malformed coverage field is rejected at parse time
Given a v2 artifact JSON whose `coverage` field is absent, empty, or contains an entry without `jurisdiction` or `tax`
When `parseCorpusArtifact` reads it
Then the result is `{ ok: false, error: 'unparsable' }`
