# AC-001 / Task 7 — LLM adapter interface, OpenAI-compatible client, 60s timeout

## AC-001-31 — The request is built entirely from configuration

Given `llmBaseUrl = 'https://llm.example.test/v1'`, `llmApiKey = 'k-test'`,
`llmModel = 'm-test'`, and a stubbed `fetch`
When `OpenAiCompatibleAdapter.completeAll` is called with one message
Then the stub receives `${llmBaseUrl}/chat/completions`
And the request carries `Authorization: Bearer k-test`
And the JSON body's `model` is `'m-test'`
And no hostname or model id literal exists in the adapter module

## AC-001-32 — Deltas stream in order and concatenate to the full answer

Given a fake upstream that emits three deltas `'El '`, `'límite '`, `'es 1.000 €.'`
When the adapter's stream is consumed
Then the consumer observes the three deltas in that order
And `completeAll` returns `'El límite es 1.000 €.'`

## AC-001-33 — Exceeding the timeout returns a timeout error value

Given an upstream that never sends a token and `llmTimeoutMs = 50` in the test config
When the adapter is awaited
Then it resolves to `{ok: false, error: 'timeout'}`
And no exception escapes the adapter
And the abort signal is passed through to `fetch`

## AC-001-34 — Upstream status codes map to a closed error set

Given stub responses with status `401`, `403`, `429`, `500` and a `200` whose body is not JSON
When each is called
Then the returned errors are `'unauthorized'`, `'unauthorized'`, `'rate_limited'`,
`'upstream_error'`, `'malformed_response'` respectively
And no other error code exists in the adapter's returned union

## AC-001-35 — The upstream error body never reaches our client

Given an upstream `401` whose body is `upstream-secret-body-marker` and an echo of the sent key
When the chat route handles the turn
Then the HTTP response body contains neither `upstream-secret-body-marker` nor the key value
And the response carries a fixed Spanish message and `errorCode: 'llm_unauthorized'`

## AC-001-36 — The adapter is injected, never constructed inside the service

Given a `FakeLlmAdapter` instance
When the answer service is constructed with it and a turn is answered
Then the fake records exactly one request
And the service module does not import the production adapter module
And no module-level singleton adapter exists in `src/service/`
