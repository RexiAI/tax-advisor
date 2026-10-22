# AC-001 / Task 16 — Offline test harness and end-to-end chat test

## AC-001-82 — The suite cannot reach the network

Given the global test setup
When any test calls the un-stubbed global `fetch`
Then it throws with a message naming the offline test policy
And a dedicated test asserts that this throwing behaviour is in place
And `npm test` completes with zero real HTTP requests

## AC-001-83 — BOE parsing and sync use committed fixtures

Given `test/fixtures/boe/`
Then it contains at least the file used by the parser test and the file used by the sync test, both
reproducing the `bloque`/`version` XML shape
And the sync test injects a fake `CorpusFetcher` instead of an HTTP client
And no test file references a `boe.es` URL as a retrieval target

## AC-001-84 — End-to-end: ask, retrieve, answer with a validation-passing citation

Given a fixture corpus index, the fake adapter scripted to answer with
`[^p:<passageId of a retrieved passage>]`
When the chat route handles `¿Puedo deducirme el alquiler de mi vivienda habitual?`
Then the response is `kind: 'answer'`
And the citation's `passageId` is one of the ids in the retrieval result for that turn
And `citationValidation` in the emitted log line is `'pass'`

## AC-001-85 — End-to-end: an unretrieved citation abstains

Given the fake adapter scripted to answer with a marker for a `passageId` that retrieval did not
return
When the chat route handles the same message
Then the response is `kind: 'insufficient_evidence'`
And the payload contains no citations
And the emitted log line records `citationValidation: 'fail'`
And the suite exits `0` with no `LLM_API_KEY` present in the environment
