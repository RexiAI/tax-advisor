# AC-004: Pilot ingestion — Madrid (BOCM) + Región de Murcia (BORM)

## AC-004-26 — The pilot norms enter the registry with complete provenance
Given the norm registry
When it is read
Then it contains one Madrid (BOCM) and one Murcia (BORM) entry for the IRPF autónomo deductions
And each entry has non-empty `publisher`, `jurisdiction`, `authorityUsed`, `officialId`, `sourceUrl`, `updatedAt`, `licenseNote`
And each entry declares `tax: 'irpf'`

## AC-004-27 — Per-norm verification evidence is recorded
Given the pilot ingestion task
When its verification record is read
Then for each pilot norm it states that an official consolidated text with a stable identifier and an update date was found
And it records `authorityUsed` and the publisher's reuse conditions
And it asserts no fact about the content of either community's rules

## AC-004-28 — The fallback order is applied and recorded when a pilot norm cannot be verified
Given a pilot norm whose publisher offers no stable consolidated text, identifier or date
When ingestion runs
Then the norm is replaced per the order Castilla y León (BOCYL) → Aragón (BOA) → Extremadura (DOE)
And the substitution and its reason are recorded
And no unofficial copy is used

## AC-004-29 — The pilot fixtures are committed and offline
Given the test fixtures directory
When the harness builds the fixture corpus
Then there is one fixture per pilot norm under `test/fixtures/`
And `fixtureMeta()` and `fixtureCorpus()` include the pilot norms
And the suite makes no network call

## AC-004-30 — The committed artifact reflects the pilots
Given the committed `corpus/corpus.json`
When it is read
Then its `coverage` includes `(madrid, irpf)` and `(murcia, irpf)`
And it carries passages whose `publisher` is `bocm` and `borm` respectively with `jurisdiction` `madrid` and `murcia`
And each pilot norm's `authorityUsed` is `boe` (BOE serves the consolidated text), so its link label reads "Ver en el BOE" while the publisher stays recorded and the jurisdiction renders as Madrid / Murcia
