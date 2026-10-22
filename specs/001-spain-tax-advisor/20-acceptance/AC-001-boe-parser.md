# AC-001 / Task 3 — BOE consolidated-XML parser (`bloque` → passage)

## AC-001-10 — Each bloque becomes one passage built from its last version

Given the fixture `test/fixtures/boe/ley-35-2006.xml` containing a `bloque` with id `a63` and two
`version` nodes, the second one newer
When `parseConsolidatedXml(fixture, {normId: 'BOE-A-2006-20764', normTitle: 'Ley 35/2006', ...})`
returns
Then the result contains exactly one passage for `blockId === 'a63'`
And its `text` is the reduced text of the **second** version node
And its `sourceUrl` is `https://www.boe.es/buscar/act.php?id=BOE-A-2006-20764`
And its `boeUpdatedAt` equals the timestamp supplied in the parser metadata

## AC-001-11 — HTML is reduced to readable text

Given a fixture block whose version HTML contains `<p>`, `<strong>`, an `&amp;` entity and a
`<table>` with two rows of two cells
When the block is parsed
Then `text` contains no `<` or `>` characters
And `&` appears where `&amp;` was
And each table row is one line with its cells separated by `' | '`
And runs of whitespace are collapsed to a single space and the text is trimmed

## AC-001-12 — The article label is derived, never invented

Given a bloque whose `titulo` is `Artículo 63. Escala general del impuesto`
Then `articleLabel` is `Artículo 63`
And given a bloque whose `titulo` is `Disposición adicional primera`
Then `articleLabel` equals that `titulo` verbatim
And no parsed passage has an empty `articleLabel`

## AC-001-13 — Non-normative and empty blocks are skipped with a reason

Given a fixture containing one normative bloque, one `tipo` preamble bloque, and one bloque whose
versions reduce to empty text
When it is parsed
Then `passages` has length 1
And `skipped` has length 2 with reason codes `'non_normative_block'` and `'empty_text'` respectively
And the parse result is `ok: true`

## AC-001-14 — Malformed XML fails without touching the network

Given a fixture whose XML is truncated before the root closes, and a fixture with no `bloque` at all
When either is parsed
Then the result is `{ok: false, error: 'unparsable'}` for both
And the test suite's `fetch` stub records zero calls during the parse
