# Renta Clara

A Spanish IRPF explainer that answers from the consolidated BOE text and shows
the article, link, and last-updated date behind every substantive answer.

- **Scope:** IRPF, tax year 2025, resident individuals. No filing, signing,
  representation, numeric estimator, IVA, ISD, ITP, or non-residents.
- **Grounding:** BOE consolidated legislation (`BOE-A-2006-20764`,
  `BOE-A-2007-6820`) and AEAT Renta 2025 manual pages.
- **Privacy:** no accounts, no persistence, no document upload, no DNI/NIE/IBAN
  accepted, no question or answer text in logs.

## Run locally

```bash
npm ci
cp .env.example .env.local     # fill the three LLM values
npm run dev                    # http://localhost:3000
```

Required environment variables:

| Variable | Purpose |
|---|---|
| `LLM_BASE_URL` | OpenAI-compatible base URL, e.g. `https://api.deepseek.com/v1` |
| `LLM_API_KEY` | Provider key |
| `LLM_MODEL` | Model id, e.g. `deepseek-flash` |
| `LLM_DISABLE_REASONING` | Optional; `true` sends `{"thinking":{"type":"disabled"}}` |

Bounded defaults live in `src/config/env.ts`; every one can be overridden with
`CORPUS_TAX_YEAR`, `MIN_RETRIEVAL_SCORE`, `RETRIEVAL_TOP_K`, `MAX_MESSAGE_CHARS`,
`RATE_LIMIT_MAX`, `RATE_LIMIT_WINDOW_MS`, and `LLM_TIMEOUT_MS`.

## Commands

```bash
npm test               # offline suite; no network or paid API
npm run lint           # ESLint, complexity <= 6
npx tsc --noEmit       # types
npm run build          # production build
npm run corpus:sync    # fetch BOE changes and rewrite corpus/corpus.json
```

The corpus sync is incremental: re-running it with no BOE update leaves
`passages[]` byte-identical and only moves `generatedAt`.

## Layout

```
src/app/            Next.js routes (chat UI, /api/chat, /health)
src/components/     one component per directory, CSS Modules
src/config/         the only process.env reader
src/corpus/         BOE parser, fetcher, sync, provenance artifact
src/retrieval/      deterministic lexical index
src/evidence/       sufficiency decision
src/llm/            provider-agnostic adapter behind an interface
src/prompts/        fixed system policy + delimited untrusted data
src/citations/      marker extraction and server-side validation
src/service/        turn orchestration, guards, rate limit, responses
src/server/         composition root and HTTP handlers
```

## Docs

- `docs/RUNBOOK.md` — corpus sync, envs, deploy, BOE shape changes.
- `docs/adr/0001-lexical-retrieval.md` — why lexical before embeddings.
- `docs/adr/0002-no-server-persistence.md` — why no conversation storage.
- `docs/research/2026-10-spain-tax-ai-landscape.md` — BOE/competitor research.
- `docs/changes/001-spain-tax-advisor.md` — archived spec and verification.
