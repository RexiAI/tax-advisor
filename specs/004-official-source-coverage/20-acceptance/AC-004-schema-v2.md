# AC-004: Provenance & jurisdiction domain model; corpus schema v2

## AC-004-06 — A v2 artifact with full provenance is accepted
Given an artifact JSON with `schemaVersion: 2`
And every norm carries non-empty `publisher`, `jurisdiction`, `authorityUsed`, `officialId`, `sourceUrl`, `updatedAt` (a `YYYY-MM-DD` date) and `licenseNote`
And every passage carries `publisher`, `jurisdiction`, `updatedAt` and `sourceUrl`
And the artifact carries a well-formed `coverage` list
When `parseCorpusArtifact` reads it
Then the result is `ok` and the artifact is returned

## AC-004-07 — A v1 artifact is rejected
Given an artifact JSON with `schemaVersion: 1` and v1 keys (`boeUpdatedAt`, no `coverage`, no `publisher`)
When `parseCorpusArtifact` reads it
Then the result is `{ ok: false, error: 'unparsable' }`

## AC-004-08 — A v2 artifact with missing or malformed provenance is rejected
Given a v2-shaped artifact
When a norm is missing `publisher`, `jurisdiction`, `authorityUsed`, `officialId` or a well-formed `updatedAt`
Or a passage is missing `publisher`, `jurisdiction` or a well-formed `updatedAt`
Or the `coverage` list is missing or malformed
Then `parseCorpusArtifact` returns `{ ok: false, error: 'unparsable' }`

## AC-004-09 — Provenance is part of the content hash
Given two artifacts differing only in a provenance field (`publisher`, `jurisdiction`, `authorityUsed`, `officialId`, `sourceUrl`, `updatedAt` or `licenseNote`)
When their content hashes are computed
Then the hashes differ
And two artifacts differing only in `generatedAt` hash identically

## AC-004-10 — The 8 existing norms migrate to `boe` / `state`
Given the committed `corpus/corpus.json`
When it is read as a v2 artifact
Then every norm has `publisher: 'boe'`, `jurisdiction: 'state'`, `authorityUsed: 'boe'`
And every norm's `officialId` equals its `BOE-A-*` id
And every norm's `updatedAt` equals the value formerly in `boeUpdatedAt`
And every passage's `publisher` is `boe` and `jurisdiction` is `state`

## AC-004-11 — The citation and passage projection carry publisher and jurisdiction
Given a passage built by `createPassage` with the v2 input
When `citationOf` projects it to a `Citation`
Then the citation carries `publisher`, `jurisdiction`, `updatedAt` and `sourceUrl`
And the citation does not carry `boeUpdatedAt` or the passage `text`
