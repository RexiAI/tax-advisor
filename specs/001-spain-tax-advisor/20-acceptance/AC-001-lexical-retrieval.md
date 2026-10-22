# AC-001 / Task 5 — Lexical Spanish retrieval index (deterministic)

## AC-001-21 — Accents and case do not matter

Given an index built from a passage containing the word `Deducción`
When searching for `deduccion`, `DEDUCCIÓN` and `deducción` separately
Then all three queries return that passage as the top result with the same score
And the normalized terms for all three inputs are identical
And a query for `nino` matches a passage containing `niño`

## AC-001-22 — Empty and stopword-only queries return no results

Given a built index
When searching for `''`, `'   '` and `'de la que el'`
Then each search returns `[]`
And no error value is returned

## AC-001-23 — A passage matching more query terms ranks higher

Given an index with passage A containing `alquiler vivienda habitual deduccion` and passage B
containing only `alquiler`
When searching for `deduccion alquiler vivienda habitual`
Then A precedes B
And every returned entry carries a numeric `score`
And a query term absent from the corpus contributes `0` (searching `criptomonedas` alone returns `[]`
when no passage contains it)

## AC-001-24 — Results are deterministic and ties break by passageId

Given an index where two passages have equal scores for a query
When the same search is executed twice
Then the two result arrays are deeply equal
And the equal-scored passages appear in ascending `passageId` order

## AC-001-25 — Results are truncated to the requested k

Given an index with 12 matching passages
When searching with `k = 8` and again with `k = 3`
Then the result lengths are `8` and `3`
And the first three entries are identical in both calls
And the default `k` is `retrievalTopK` from configuration

## AC-001-26 — The index reports its size and refuses duplicate passages

Given a passage collection containing a repeated `passageId`
When `buildIndex` is called
Then it returns `{ok: false, error: 'duplicate_passage_id'}`
And a valid build returns an index whose `size` equals the number of passages
And the returned index is frozen (mutating it throws or has no effect)
