# AC-004: Jurisdiction-aware answering — never borrow a state citation

## AC-004-41 — A regional question cites only that jurisdiction's passages
Given a question resolved to jurisdiction `madrid`
When the model cites passages
Then every validated citation has `jurisdiction: 'madrid'`, `publisher: 'bocm'` (the issuing body), and `authorityUsed: 'boe'` (the host serving the consolidated text)
And the jurisdiction renders as Madrid and the publisher stays recorded as metadata, while the link label follows `authorityUsed` ("Ver en el BOE")
And no citation to a state passage is accepted as support

## AC-004-42 — A state citation for a regional question fails validation
Given a question resolved to jurisdiction `madrid`
When the model cites a passage whose `jurisdiction` is `state`
Then citation validation fails (the turn abstains with `insufficient_evidence` / `unverified_citation`), it is not returned as an `answer`

## AC-004-43 — No matching regional passage means abstention, not a state answer
Given a question resolved to `madrid` but the index holds no `madrid` passage for it
When the turn runs
Then the response is `insufficient_evidence` (or clarification), never an answer built from the state corpus

## AC-004-44 — State jurisdiction is unchanged
Given a question with no regional resolution (jurisdiction `state`)
When the turn runs
Then all state passages are eligible and state answers behave exactly as before this spec
