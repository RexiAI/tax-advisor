# AC-001 / Task 6 — Evidence bundle and sufficiency decision

## AC-001-27 — A supported question yields a sufficient bundle with display fields

Given an index built from the fixture corpus and a query whose top score is at or above
`minRetrievalScore`
When `buildEvidence` runs
Then `status` is `'sufficient'`
And `passages` is non-empty and ordered as the retrieval results were
And each entry exposes `passageId`, `normTitle`, `articleLabel`, `sourceUrl`, `boeUpdatedAt`

## AC-001-28 — No results is insufficient

Given a query with no matching term in the corpus
When `buildEvidence` runs
Then `status` is `'insufficient'`
And `reason` is `'no_results'`
And `passages` is `[]`

## AC-001-29 — A score exactly at the threshold counts as sufficient

Given a query whose top score is exactly `minRetrievalScore`
Then `status` is `'sufficient'`
And given a query whose top score is `minRetrievalScore - 0.000001`
Then `status` is `'insufficient'` and `reason` is `'below_threshold'`

## AC-001-30 — The threshold is configuration, not a call-site literal

Given config with `minRetrievalScore` raised above the fixture query's top score
When `buildEvidence` runs with the same query and index
Then `status` changes from `'sufficient'` to `'insufficient'`
And no numeric threshold literal appears in the `buildEvidence` module
