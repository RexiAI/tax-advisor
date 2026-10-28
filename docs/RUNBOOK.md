# Runbook — Renta Clara

Operational guide for the IRPF explainer. Every command here is meant to be copied and run
from the repository root.

## 1. Corpus sync

The corpus is a build-time artifact committed at `corpus/corpus.json`. It is produced by the
sync script: each covered norm is dispatched to the adapter of the publisher that supplied its
consolidated text (`authorityUsed`), the document is parsed into passages, and the artifact is
written with its provenance, its declared coverage and a `contentHash`.

The ten covered norms, in the fixed order the sync walks them:

| `normId`           | Norm                                                                          |
| ------------------ | ----------------------------------------------------------------------------- |
| `BOE-A-2006-20764` | Ley 35/2006, del Impuesto sobre la Renta de las Personas Físicas              |
| `BOE-A-2007-6820`  | Real Decreto 439/2007, Reglamento del IRPF                                    |
| `BOE-A-2003-23186` | Ley 58/2003, General Tributaria                                               |
| `BOE-A-2007-15984` | Real Decreto 1065/2007, Reglamento general de gestión e inspección tributaria |
| `BOE-A-2015-11724` | Real Decreto Legislativo 8/2015, Ley General de la Seguridad Social           |
| `BOE-A-1996-4447`  | Real Decreto 84/1996, inscripción de empresas y afiliación                    |
| `BOE-A-1992-28740` | Ley 37/1992, del Impuesto sobre el Valor Añadido                              |
| `BOE-A-1990-23930` | Real Decreto Legislativo 1175/1990, tarifas e instrucción del IAE             |
| `BOCM-m-2010-90068` | Comunidad de Madrid, Decreto Legislativo 1/2010, tributos cedidos (BOCM)     |
| `BOE-A-2011-10542` | Región de Murcia, Decreto Legislativo 1/2010, tributos cedidos (BORM)        |

The list lives in `src/domain/allowed-norms.ts`: adding or removing a norm is a change there,
followed by a sync. A passage of a norm outside that list is refused, never indexed.

```bash
npm run corpus:sync
```

- Success prints one line (`corpus:sync ok: … passages, … norms fetched, … reused, hash …`) and
  exits `0`.
- Failure prints `corpus:sync failed: <error> for <normId> (<detail>)` on stderr and exits `1`.
  The committed artifact is **not** modified.
- The sync is incremental on the source's own update date: a norm whose adapter reports the same
  `updatedAt` as the artifact is not re-fetched, and its `fetchedAt` is left untouched. Each
  registry entry also declares a `publisher`, a `jurisdiction`, an `officialId` and a
  `licenseNote`; a norm missing any of them is not admitted.
- The artifact's `coverage` is the canonical list of `(jurisdiction, tax)` pairs derived from
  the registry's tags. It is the only coverage list; the scope guard answers from it.
- The sync is idempotent: re-running it against unchanged data produces the same `passages`
  array and the same `contentHash`. Only `generatedAt` may differ.

## 2. Environment variables

| Variable                | Default         | Meaning                                                                                                     |
| ----------------------- | --------------- | ----------------------------------------------------------------------------------------------------------- |
| `LLM_BASE_URL`          | none — required | Base URL of the OpenAI-compatible endpoint                                                                  |
| `LLM_API_KEY`           | none — required | Bearer token for that endpoint                                                                              |
| `LLM_MODEL`             | none — required | Model id requested from that endpoint                                                                       |
| `LLM_DISABLE_REASONING` | `false`         | `true` sends `{"thinking":{"type":"disabled"}}`; skips chain-of-thought tokens on providers that support it |
| `CORPUS_TAX_YEAR`       | `2025`          | Tax year the corpus covers                                                                                  |
| `MIN_RETRIEVAL_SCORE`   | `0.1`           | Minimum top retrieval score for sufficient evidence                                                         |
| `RETRIEVAL_TOP_K`       | `5`             | Passages retrieved per query                                                                                |
| `MAX_MESSAGE_CHARS`     | `2000`          | Maximum accepted chat message length                                                                        |
| `RATE_LIMIT_MAX`        | `20`            | Requests per client IP per window                                                                           |
| `RATE_LIMIT_WINDOW_MS`  | `600000`        | Fixed window length (10 minutes)                                                                            |
| `LLM_TIMEOUT_MS`        | `60000`         | Upper bound on a single model call                                                                          |
| `AUTH_ALLOWED_EMAIL`    | none — required | The only email allowed to sign in                                                                           |
| `AUTH_PASSWORD`         | none — required | Login password; server-only, never committed                                                                |
| `AUTH_SECRET`           | none — required | 32+ random bytes for the session-cookie HMAC                                                                |
| `AUTH_SESSION_SECONDS`  | `28800`         | Session lifetime (8 hours)                                                                                  |

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

`/` and `/api/chat` require a session. Sign in at `/login` with
`AUTH_ALLOWED_EMAIL` / `AUTH_PASSWORD`; read the generated local password with
`grep '^AUTH_PASSWORD=' .env.local`. `/health` stays public for the platform probe.
The session cookie is HttpOnly, SameSite=Lax, and `Secure` when
`NODE_ENV=production`; `AUTH_SECRET` signs it.

## 4. Deploy

The frontend deploys through the hosting platform's Git integration: a push to a branch
produces a preview deployment, a merge to the default branch produces production. Do not run
`vercel deploy` from a workstation or CI — it double-builds the same commit.

1. Set the fifteen environment variables from §2 in the project's environment settings
   (Production, Preview, and Development). The Vercel project is already linked; `vercel.json`
   pins the Next.js framework preset.
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
  (`parse_failed … unparsable`, or `… no_passages`). Nothing was written: a failed parse of
  **any** of the eight norms must never ship a shrunken corpus, so the committed artifact is
  left exactly as it was. One broken norm stops the whole sync; there is no partial refresh.

How to fix it, in this order:

1. Add or extend a fixture that reproduces the new shape under `test/fixtures/boe/`. There is
   one fixture per covered norm, named after the norm, and the suite reads them through
   `FIXTURE_META` in `test/support/harness.ts`:
   `test/fixtures/boe/ley-35-2006.xml` (`BOE-A-2006-20764`),
   `test/fixtures/boe/rd-439-2007.xml` (`BOE-A-2007-6820`),
   `test/fixtures/boe/ley-58-2003.xml` (`BOE-A-2003-23186`),
   `test/fixtures/boe/rd-1065-2007.xml` (`BOE-A-2007-15984`),
   `test/fixtures/boe/rdleg-8-2015-lgss.xml` (`BOE-A-2015-11724`),
   `test/fixtures/boe/rd-84-1996.xml` (`BOE-A-1996-4447`),
   `test/fixtures/boe/ley-37-1992-iva.xml` (`BOE-A-1992-28740`) and
   `test/fixtures/boe/rdleg-1175-1990-iae.xml` (`BOE-A-1990-23930`). The live vocabulary is captured
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
