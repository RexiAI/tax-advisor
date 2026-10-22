# AC-001 / Task 13 — Chat HTTP route: 2,000-char cap, per-IP rate limit, streaming

## AC-001-65 — The message length boundary is exact

Given a message of exactly `2000` characters
When `POST /api/chat` is called
Then the response is not `400`
And given a message of `2001` characters
Then the response is `400` with `errorCode: 'message_too_long'` and a Spanish message
And the adapter call count remains `0` for the rejected request
And the accepted request forwards the full 2,000-character message unmodified

## AC-001-66 — The 21st request in a window is rate limited

Given 20 completed requests from the same client IP inside one 10-minute window
When the 21st request arrives with the same IP and a valid body
Then the response is `429`
And it carries a `Retry-After` header holding a positive integer number of seconds
And the body is a Spanish message explaining the limit
And a request from a different IP in the same window is answered normally
And advancing the injected clock past the window resets the counter

## AC-001-67 — Client IP resolution is explicit

Given a request with `x-forwarded-for: 203.0.113.7, 10.0.0.1`
Then the rate-limit key is `203.0.113.7`
And given a request with no `x-forwarded-for` header
Then the key is the socket address
And the same resolved key is used for a request that is later rejected by the length check

## AC-001-68 — Streaming and non-streaming return the same final payload

Given a request accepting `text/event-stream`
Then the response `Content-Type` is `text/event-stream`
And one `data:` frame is emitted per delta, followed by a `final` frame and a terminating event
And given the same turn with `Accept: application/json`
Then the JSON body is deeply equal to the `final` frame's payload
And in both modes the citation set is identical

## AC-001-69 — Every error path returns JSON with a closed error code

Given a missing key (`503`), an over-long message (`400`), a rate limit (`429`) and an adapter timeout
(`504`) — one per case
Then each response body is JSON with `kind`, `errorCode` and a Spanish `message`
And `Content-Type` is `application/json`, never `text/html`
And every `errorCode` belongs to the closed set
`{missing_llm_config, message_too_long, unexpected_field, rate_limited, llm_timeout,
llm_unauthorized, llm_rate_limited, llm_upstream_error, llm_malformed_response}`

## AC-001-70 — Route error handling leaks nothing and holds no stray state

Given an adapter error of each mapped kind
Then the response message comes from a fixed Spanish constant and never from the upstream body
And the route module's only module-level mutable state is the injected rate-limit store and the
injected conversation store
And a turn that fails produces the same structured log line shape as a successful one, with
`status` set to `'error'`
