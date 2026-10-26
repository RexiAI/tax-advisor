# ADR 0001 — Lexical retrieval instead of embeddings

## Context

Every substantive answer must carry a citation to a BOE passage, and citations are validated
server-side against exactly the passages retrieved for that turn. The corpus is small and
fully known at build time: the consolidated text of two norms, Ley 35/2006
(`BOE-A-2006-20764`) and Real Decreto 439/2007 (`BOE-A-2007-6820`), chunked at `bloque` level
and committed as `corpus/corpus.json`. The product runs with no database and no writable
filesystem at request time, and the test suite must run offline.

## Decision

Retrieval is deterministic lexical search — term-frequency / inverse-document-frequency over
accent-stripped, case-folded, stopword-filtered Spanish terms, computed in an in-memory index
built at startup from the committed artifact (`src/retrieval/`).

Consequences of the choice that the rest of the system depends on:

- `buildIndex(passages)` returns an immutable value and refuses duplicate `passageId`s.
- `search(index, query, k)` sorts by score descending and breaks ties by `passageId`
  ascending, so the same index and query always produce the same array.
- An empty or stopword-only query returns `[]`, never an error.
- The evidence bundle is the single source of citable passages; a citation outside it fails
  validation regardless of what the index contains.

## Alternatives considered

- **Embeddings + a vector store.** Rejected for v1. It would add a second model dependency, a
  vector database (or a serialized index) and non-deterministic ranking, while the corpus is
  small enough that lexical matching over Spanish legal terms is both sufficient and fully
  reproducible offline. Determinism also matters for the citation contract: the same question
  must produce the same evidence set in a test and in production.
- **A hosted search API.** Rejected: an external service at request time, a data transfer the
  privacy posture does not need, and a network dependency in an offline test suite.
- **SQLite full-text (FTS5).** Rejected: it reintroduces a database file and a native
  dependency for a corpus that fits comfortably in memory.
- **No retrieval (prompt the whole corpus).** Rejected: the consolidated text of both norms
  does not fit a prompt budget, and "cite only what was supplied" becomes untestable.

## Consequences

- Recall is lower than embedding search for paraphrases that share no vocabulary with the
  statute. The abstention path (`insufficient_evidence`) is the honest output in that case, and
  the acceptance suite asserts it rather than hiding it.
- The index is rebuilt at startup from the artifact, so a corpus change needs a redeploy —
  which is already true of the artifact being committed.
- Ranking is explainable: a score is a sum of per-term contributions, which makes threshold
  behaviour testable (score equal to `MIN_RETRIEVAL_SCORE` counts as sufficient).

## Revisit condition

Revisit this decision when measurement shows the lexical layer is the binding constraint, not
the corpus: specifically, if a labelled evaluation set of at least 100 real IRPF questions
(kept outside this repository, in the operator's own tooling) shows top-5 retrieval recall
below 70% while the same set shows the correct passage is present in the corpus, then evaluate
embeddings against that baseline. Revisit earlier only if the corpus grows past roughly
50,000 passages, where an in-memory index stops being cheap.

### Volume note (spec 002)

The corpus grew from 2 to 8 norms and from 396 to several thousand passages when the product
widened its scope from the IRPF to the autónomo's fiscal cycle; the scope decision itself is
`docs/adr/0003-advisor-scope-expansion.md`. The revisit threshold above is unchanged: several
thousand passages are still far from 50,000, so the argument for an in-memory lexical index
over embeddings still holds, and nothing here obliges anyone to measure recall.

The risk of that wider corpus is accepted, not measured: lexical retrieval may fail to
discriminate between norms that share vocabulary (a question about the contribution base and a
question about the IRPF base), so a question can retrieve the wrong norm's passages. The honest
output in that case is `insufficient_evidence`, and spec 002 sets no recall-measurement gate on
top of that. Re-opening recall measurement is a separate decision, taken with the labelled set
the section above describes — not a gate this repository runs.

## Sources

- BOE consolidated text of Ley 35/2006: <https://www.boe.es/buscar/act.php?id=BOE-A-2006-20764>
- BOE consolidated text of Real Decreto 439/2007: <https://www.boe.es/buscar/act.php?id=BOE-A-2007-6820>
- Repository standards: `docs/TESTING.md`, `docs/CODING_CONVENTIONS.md` in the engineering
  standards this repository consumes.
