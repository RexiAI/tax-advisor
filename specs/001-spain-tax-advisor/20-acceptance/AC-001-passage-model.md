# AC-001 / Task 2 — Passage value object and stable passage identity

## AC-001-06 — Passage identity is derived from norm and block only

Given `normId = 'BOE-A-2006-20764'` and `blockId = 'a63'`
When a passage is constructed for that block in two separate calls with different `fetchedAt` values
Then both results have `passageId === 'BOE-A-2006-20764#a63'`
And the two passages are equal under the equality function

## AC-001-07 — Invalid timestamps are rejected, not coerced

Given a passage whose `boeUpdatedAt` is `'17/03/2026'`
When it is constructed
Then the result is `{ok: false, error: 'invalid_boe_updated_at'}` and no exception is thrown
And constructing with `fetchedAt = '2026-03-17T10:00:00+02:00'` returns
`{ok: false, error: 'invalid_fetched_at'}`
And constructing with `fetchedAt = '2026-03-17T08:00:00Z'` succeeds

## AC-001-08 — Empty text, empty block id and non-https sources are rejected

Given a passage with `text = '   '`
When it is constructed
Then the result is `{ok: false, error: 'empty_text'}`
And `blockId = ''` returns `{ok: false, error: 'empty_block_id'}`
And `sourceUrl = 'http://www.boe.es/buscar/act.php?id=BOE-A-2006-20764'` returns
`{ok: false, error: 'invalid_source_url'}`

## AC-001-09 — Only the two in-scope norms are accepted, and duplicate ids are refused

Given the allowed-norm set
Then it contains exactly `BOE-A-2006-20764` and `BOE-A-2007-6820`
And constructing a passage with `normId = 'BOE-A-0000-00000'` returns
`{ok: false, error: 'unsupported_norm'}`
And building a collection from two passages sharing a `passageId` returns
`{ok: false, error: 'duplicate_passage_id'}`
