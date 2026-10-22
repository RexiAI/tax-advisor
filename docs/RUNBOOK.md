# Runbook — Renta Clara

Operational guide for the IRPF explainer. Every command here is meant to be copied and run
from the repository root.

## 1. Corpus sync

The corpus is a build-time artifact committed at `corpus/corpus.json`. It is produced by the
sync script, which fetches the BOE consolidated text for the two covered norms
(`BOE-A-2006-20764`, `BOE-A-2007-6820`), parses `bloque` units into passages, and writes the
artifact with a `contentHash`.

```bash
npm run corpus:sync
```

- Success prints one line (`corpus:sync ok: … passages, … norms fetched, … reused, hash …`) and
  exits `0`.
- Failure prints `corpus:sync failed: <error> for <normId> (<detail>)` on stderr and exits `1`.
  The committed artifact is **not** modified.
- The sync is incremental: a norm whose BOE `fecha_actualizacion` matches the artifact's
  `boeUpdatedAt` is not re-fetched, and its `fetchedAt` is left untouched.
- The sync is idempotent: re-running it against unchanged data produces the same `passages`
  array and the same `contentHash`. Only `generatedAt` may differ.

## 2. Environment variables

| Variable               | Default         | Meaning                                             |
| ---------------------- | --------------- | --------------------------------------------------- |
| `LLM_BASE_URL`         | none — required | Base URL of the OpenAI-compatible endpoint          |
| `LLM_API_KEY`          | none — required | Bearer token for that endpoint                      |
| `LLM_MODEL`            | none — required | Model id requested from that endpoint               |
| `CORPUS_TAX_YEAR`      | `2025`          | Tax year the corpus covers                          |
| `MIN_RETRIEVAL_SCORE`  | `0.1`           | Minimum top retrieval score for sufficient evidence |
| `RETRIEVAL_TOP_K`      | `5`             | Passages retrieved per query                        |
| `MAX_MESSAGE_CHARS`    | `2000`          | Maximum accepted chat message length                |
| `RATE_LIMIT_MAX`       | `20`            | Requests per client IP per window                   |
| `RATE_LIMIT_WINDOW_MS` | `600000`        | Fixed window length (10 minutes)                    |
| `LLM_TIMEOUT_MS`       | `60000`         | Upper bound on a single model call                  |

Copy `.env.example` to `.env.local` and fill it in; `.env.local` is gitignored and must never
be committed. A missing LLM variable is a configuration error: `POST /api/chat` answers `503`
and no model call is attempted. There is no default model and no default base URL.

## 3. Local run

```bash
npm install
cp .env.example .env.local
npm run dev
```

Other local commands:

```bash
npm test
npm run lint
npm run build
npm start
```

`npm test` runs entirely offline: a global test setup replaces `fetch` with a stub that throws,
the model is a fake, and BOE access is a fake fetcher over `test/fixtures/boe/`.

## 4. Deploy

The frontend deploys through the hosting platform's Git integration: a push to a branch
produces a preview deployment, a merge to the default branch produces production. Do not run
`vercel deploy` from a workstation or CI — it double-builds the same commit.

1. Set the ten environment variables from §2 in the project's environment settings.
2. Push the branch and let the platform build.
3. Verify liveness:

```bash
curl -fsS https://<deployment-host>/health
```

The endpoint returns `200` with `{"status":"ok","checks":{"llmConfig":"ok","corpusIndex":"ok"}}`
when the configuration is complete and the corpus loaded, and `503` with the failing check
marked `"error"` otherwise. It performs no outbound request and never returns the API key or
passage text.

Two v1 limitations, by design (`docs/adr/0002-no-server-side-persistence.md`):

- Rate limiting is an in-process fixed window: it is per server instance and resets on a cold
  start. A 429 response promises only its `Retry-After` interval, never a wall-clock time.
- Conversation state is a bounded in-memory map with a TTL, so a clarification cap is only
  remembered while the same instance serves the conversation.

## 5. BOE changed / parsing broke

What breaks: the BOE changes the consolidated-text document shape (a `bloque` without
`<version>`, renamed attributes, entities the parser no longer decodes, or a document that is
no longer well-formed XML). Passages then reduce to empty text or the parse fails outright.

How to detect it: run the sync and read the exit code.

```bash
npm run corpus:sync; echo "exit=$?"
```

- `exit=0` — corpus refreshed.
- `exit=1` — the script printed the failing norm and the parse detail
  (`parse_failed … unparsable`, or `… no_passages`). Nothing was written: a failed parse must
  never ship a shrunken corpus, so the committed artifact is left exactly as it was.

How to fix it, in this order:

1. Add or extend a fixture that reproduces the new shape under `test/fixtures/boe/` — start
   with `test/fixtures/boe/ley-35-2006.xml` for `BOE-A-2006-20764` and
   `test/fixtures/boe/rd-439-2007.xml` for `BOE-A-2007-6820`. The live vocabulary is captured
   in `test/fixtures/boe/live-shapes.xml` (a `nota_inicial`, a `preambulo`, an `encabezado`, a
   `precepto` with two versions and a table, and a `firma`); extend that one when BOE introduces
   another `tipo`.
2. Write a failing test in `test/acceptance/AC-001-boe-parser.test.ts` (or
   `test/unit/xml-and-parser.test.ts` for a shape no acceptance scenario covers), run with
   `npm test`.
3. Fix the parser in `src/corpus/parse-consolidated-xml.ts` (tree walking and text reduction
   live in `src/corpus/xml.ts`); if BOE changed the open-data resource we read (metadata for
   `fecha_actualizacion`, text for the `bloque` document — both under
   `https://www.boe.es/datosabiertos/api/legislacion-consolidada`), adapt
   `src/corpus/boe-fetcher.ts`.
4. Re-run `npm test`, then `npm run corpus:sync`, and commit the refreshed
   `corpus/corpus.json` together with the parser change.

Two live shapes worth knowing, because the fixtures did not always have them and both are
silent-corruption risks rather than loud failures:

- **`fecha_actualizacion` is compact.** The metadata endpoint returns
  `20261007T095616Z`, not `2026-10-07`. `normalizeBoeDate()` in
  `src/corpus/boe-fetcher.ts` accepts both the compact and the dashed form and returns
  `YYYY-MM-DD`; an unparsable value fails the sync with
  `fetch_failed … fecha_actualizacion missing` instead of guessing a date.
- **Not every `bloque` is normative.** The live text uses `tipo="precepto"` for rule text and
  `nota_inicial`, `preambulo`, `encabezado`, `firma` for non-normative blocks. The
  non-normative set lives in `NON_NORMATIVE_TIPOS` in `src/corpus/parse-consolidated-xml.ts`;
  a block type missing from that set becomes a citable passage, and headings have no `titulo`,
  so their label degrades to an internal block id. When BOE adds a `tipo`, add it there and
  extend `test/fixtures/boe/live-shapes.xml`.

Never "fix" a broken sync by deleting passages or by writing a smaller artifact by hand. The
sync refuses to write on a failed parse for exactly that reason.
