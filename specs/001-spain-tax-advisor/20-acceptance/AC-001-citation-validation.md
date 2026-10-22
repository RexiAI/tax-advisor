# AC-001 / Task 9 — Citation extraction and server-side validation

## AC-001-42 — Valid markers produce ordered, de-duplicated citations

Given an answer text citing `[^p:BOE-A-2006-20764#a63]`, then `[^p:BOE-A-2007-6820#a1]`, then
`[^p:BOE-A-2006-20764#a63]` again, and a bundle containing both passages
When extraction and validation run
Then `status` is `'pass'`
And `citations` has length `2`, in order of first appearance
And each citation exposes `normTitle`, `articleLabel`, `sourceUrl`, `boeUpdatedAt` from the bundle
And the displayed answer text contains no `[^p:` markers

## AC-001-43 — A citation to a non-retrieved passage fails validation

Given an answer citing `[^p:BOE-A-2006-20764#a999]` and a bundle that does not contain `a999`
When validation runs
Then `status` is `'fail'`
And `unknownIds` is `['BOE-A-2006-20764#a999']`

## AC-001-44 — An answer with no citation is insufficient, not an answer

Given an answer text with no `[^p:` markers
When validation runs
Then `status` is `'insufficient'` and `reason` is `'no_citations'`
And the service never labels such a turn `kind: 'answer'`

## AC-001-45 — An invalid citation is never rendered

Given a model answer that cites one valid and one unknown passage
When the turn is completed
Then the response `kind` is `'insufficient_evidence'`
And the serialized response does not contain the unknown `passageId`
And it contains no `citations` array at all

## AC-001-46 — Malformed markers count as unknown

Given an answer citing `[^p:]` and `[^p:BOE A 2006]`
When validation runs
Then `status` is `'fail'` and both strings are reported in `unknownIds`
And given an answer citing only `[^p:BOE-A-2006-20764#a63]` with that passage in the bundle
Then `status` is `'pass'`

## AC-001-47 — The validator cannot reach beyond the bundle

Given an index containing passage `BOE-A-2006-20764#a70` and a bundle for this turn that does not
contain it
When the model cites `a70`
Then validation fails
And the validator's signature accepts only the answer text and the bundle — it has no index
parameter and no lookup function
