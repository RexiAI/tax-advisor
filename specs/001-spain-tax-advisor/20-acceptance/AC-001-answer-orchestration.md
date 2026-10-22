# AC-001 / Task 10 — Answer orchestration service (turn → validated response)

## AC-001-48 — A supported turn produces an answer with at least one citation

Given fixture evidence above the threshold and a fake adapter that answers with one valid marker
When `answerQuestion({message})` runs
Then `kind` is `'answer'`
And `explanation`, `rule` and `disclaimer` are non-empty strings
And `citations.length >= 1`
And `citedPassages` ids are a subset of the bundle's ids

## AC-001-49 — Insufficient evidence offers the documented handoff

Given evidence below `minRetrievalScore`
When `answerQuestion` runs
Then `kind` is `'insufficient_evidence'`
And `explanation` is non-empty and states what cannot be confirmed
And `handoffUrl` equals the `HANDOFF_URL` constant used by the UI
And `disclaimer` is present
And the response has no `citations` field

## AC-001-50 — At most one clarifying question, ever

Given a model output containing two questions addressed to the user and no citation
When the turn resolves
Then `kind` is `'clarification'`
And `question` is a single string equal to the first question, and the response has no `questions`
array
And given the same conversation id where the previous turn was a clarification
When a second turn still lacks the missing fact
Then the second response is not `'clarification'`

## AC-001-51 — A different tax year triggers the notice, 2025 does not

Given a message containing `2024`
When the turn resolves
Then `yearNotice` is present, names `2025` as the covered year, and says the rule may have changed
for the year asked about
And given a message containing `2025` the response has no `yearNotice`
And given a message with no four-digit year the response has no `yearNotice`
And the notice is added by the service even when the model output contains no year reference

## AC-001-52 — A replaced stream never emits an invalid citation

Given a streaming turn whose model text cites an id that is not in the bundle
When the stream completes
Then the final frame is `event: replace` carrying the `insufficient_evidence` payload
And no emitted frame contains the unknown `passageId`
And a successful streaming turn ends with a `final` frame carrying the same payload the
non-streaming call returns

## AC-001-53 — A worked example is rendered only when the answer carries one

Given a fake adapter answer without a worked example
Then the response has no `workedExample` key
And given an answer with one
Then `workedExample` is a non-empty string and appears in the rendered answer structure

## AC-001-54 — The service performs no I/O of its own

Given the source of `src/service/`
Then no module imports `fs`, `node:fs`, `child_process`, or a database client
And no module calls `fetch` directly
And a turn completed without a `conversationId` leaves no entry in the conversation store
