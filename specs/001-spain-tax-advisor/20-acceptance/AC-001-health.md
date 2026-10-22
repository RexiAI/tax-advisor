# AC-001 / Task 14 — `/health` endpoint

## AC-001-71 — Healthy when configuration and corpus are present

Given all three LLM variables set and a corpus artifact with at least one passage
When `GET /health` is called
Then the response is `200`
And the body is `{status: 'ok', checks: {llmConfig: 'ok', corpusIndex: 'ok'}}`

## AC-001-72 — A missing LLM variable degrades only its own check

Given `LLM_MODEL` unset and a valid corpus
When `GET /health` is called
Then the response is `503`
And `status` is `'error'`
And `checks.llmConfig` is `'error'` while `checks.corpusIndex` is `'ok'`

## AC-001-73 — A missing or empty corpus degrades the corpus check

Given a valid LLM configuration and a corpus artifact that is absent, empty, or unparsable — one per
case
When `GET /health` is called
Then each response is `503` with `checks.corpusIndex === 'error'`
And `checks.llmConfig` remains `'ok'`

## AC-001-74 — Health never leaks a secret and never calls out

Given the configured API key value `k-test-secret`
When `GET /health` is called in any of the states above
Then the serialized body contains no `k-test-secret` and no corpus passage text
And the fake adapter and the corpus fetcher record zero calls
And the endpoint performs no outbound network request
