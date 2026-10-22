# AC-001 / Task 12 — Privacy guard, no-persistence, log redaction

## AC-001-59 — A DNI stops the turn before retrieval or the model

Given the message `Mi DNI es 12345678Z, ¿puedo deducir el alquiler?`
When the turn resolves
Then `kind` is `'privacy_warning'`
And the message names the category `DNI` in Spanish
And the fake adapter's call count is `0`
And the response body contains neither `12345678Z` nor any substring of it

## AC-001-60 — NIE and IBAN are detected too

Given `Mi NIE es X1234567L` and `Mi cuenta es ES91 2100 0418 4502 0005 1332`, one per case
When each turn resolves
Then both return `kind: 'privacy_warning'` naming `NIE` and `IBAN` respectively
And neither raw value appears in the response or in the emitted log line

## AC-001-61 — Fields the product must never accept are rejected

Given a request body `{message: "...", dni: "12345678Z"}`
When the route handles it
Then the response is `400` with `errorCode: 'unexpected_field'`
And the adapter call count is `0` and the retrieval layer was not invoked
And a body with only `message` and `conversationId` is accepted

## AC-001-62 — Nothing is persisted

Given a completed turn with a `conversationId`
Then the conversation store contains only a clarification flag keyed by that id — no message text
and no answer text
And the store evicts entries older than its TTL
And no filesystem write or database connection occurs during the turn

## AC-001-63 — Each request emits one structured log line with the required fields

Given a completed turn
When the log sink is inspected
Then exactly one JSON record was emitted for the request
And it has `requestId`, `route`, `latencyMs`, `firstTokenMs`, `promptTokens`,
`completionTokens`, `retrievalHitCount`, `citationValidation`, `status`
And `citationValidation` is one of `'pass' | 'fail' | 'insufficient' | 'not_applicable'`

## AC-001-64 — The log line carries no content and a single random identifier

Given a message containing the distinctive string `marcador-unico-123`
When the turn completes
Then the serialized log record does not contain `marcador-unico-123`, the answer text, or any
question text
And it contains no `ip`, `message`, `answer`, `text` or `question` keys
And `requestId` matches a UUID v4 pattern and differs between two consecutive requests
