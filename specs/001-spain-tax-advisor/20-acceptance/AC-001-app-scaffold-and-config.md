# AC-001 / Task 1 — App scaffold, typed configuration, fail-closed LLM env

## AC-001-01 — Configuration resolves from the environment

Given `LLM_BASE_URL=https://llm.example.test/v1`, `LLM_API_KEY=k-test`, `LLM_MODEL=m-test`
When `loadConfig()` is called
Then it returns `{ok: true}`
And `config.llmBaseUrl`, `config.llmApiKey`, `config.llmModel` equal those three values
And no provider hostname, vendor name, or model id appears as a literal anywhere under `src/`

## AC-001-02 — A missing API key fails closed

Given `LLM_API_KEY` is unset and `LLM_BASE_URL` and `LLM_MODEL` are set
When `loadConfig()` is called
Then it returns `{ok: false, error: 'missing_llm_config'}`
And `missing` contains `'LLM_API_KEY'` and not the two variables that are set
And a `POST /api/chat` request returns `503` with a Spanish configuration-error message
And the LLM adapter factory is never called

## AC-001-03 — No default model or base URL is ever substituted

Given `LLM_API_KEY=k-test` and both `LLM_BASE_URL` and `LLM_MODEL` unset
When the chat route is called
Then the response is `503` with `errorCode: 'missing_llm_config'`
And `missing` names both variables
And the `fetch` stub records zero calls

## AC-001-04 — Bound values come from configuration, with documented defaults

Given the optional overrides are unset
When `loadConfig()` returns successfully
Then `maxMessageChars` is `2000`, `rateLimitMax` is `20`, `rateLimitWindowMs` is `600000`,
`llmTimeoutMs` is `60000`, `corpusTaxYear` is `2025`
And `retrievalTopK` is a positive integer and `minRetrievalScore` is a positive number
And every one of those keys can be overridden by its environment variable

## AC-001-05 — The environment example is committed and no secret is

Given the repository tree
Then an env example file exists listing every configuration variable with an empty value and a
comment explaining it
And no tracked file contains a non-empty LLM API key value
And `.gitignore` ignores `.env`, `.env.local` and `*.local.env` and does not ignore the example file
