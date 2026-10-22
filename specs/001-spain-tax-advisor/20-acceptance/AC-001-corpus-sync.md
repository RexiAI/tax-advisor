# AC-001 / Task 4 — Incremental, idempotent corpus sync + provenance artifact

## AC-001-15 — The artifact carries provenance for every norm and passage

Given the fake fetcher serves the two fixture norms
When `npm run corpus:sync` completes
Then the written artifact has `schemaVersion`, `taxYear === 2025`, `generatedAt` in
`YYYY-MM-DDTHH:MM:SSZ`, `contentHash`, and non-empty `passages`
And each `norms[]` entry has `normId`, `normTitle`, `sourceUrl`, `boeUpdatedAt`, `fetchedAt`,
`licenseNote`
And each `passages[]` entry matches the `Passage` shape from AC-001-06
And `licenseNote` states attribution, no distortion, and no implication of official endorsement

## AC-001-16 — An unchanged BOE causes zero fetches

Given a committed artifact whose recorded `boeUpdatedAt` equals the fetcher's `fecha_actualizacion`
for both norms
When sync runs
Then the fetcher's fetch count is `0`
And the artifact's `passages` array is unchanged

## AC-001-17 — Only changed norms are re-fetched

Given a committed artifact where `BOE-A-2007-6820` has an older `boeUpdatedAt` than the fetcher
reports
When sync runs
Then exactly one fetch is performed, for `BOE-A-2007-6820`
And the other norm's `fetchedAt` is not updated

## AC-001-18 — Re-running sync is byte-identical

Given a successful sync against unchanged fixture data
When sync is run a second time
Then the two artifacts' `passages` arrays are byte-identical (same length, order and `passageId`s)
And no `passageId` appears twice
And `contentHash` is equal across both runs
And `generatedAt` is excluded from the `contentHash` input

## AC-001-19 — A broken parse never ships a shrunken corpus

Given the fetcher returns an unparsable XML document for one norm
When sync runs
Then the process exits non-zero
And the previously committed artifact is not overwritten
And the stderr output names the failing norm and the parse error

## AC-001-20 — The corpus is built from official hosts only

Given the committed artifact
Then every `sourceUrl` host is `www.boe.es` or `sede.agenciatributaria.gob.es`
And no artifact field or passage text contains content attributed to a commercial product or blog
