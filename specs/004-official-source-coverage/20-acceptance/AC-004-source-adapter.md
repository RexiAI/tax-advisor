# AC-004: Source-adapter interface; BOE adapter refactored onto it

## AC-004-17 — The adapter interface exposes the source's own update date and document
Given the `SourceAdapter` interface
When its contract is read
Then it exposes, per norm: the source's own last-updated date, the consolidated-text document, the official source URL, and a parse of the document into passages

## AC-004-18 — The BOE adapter satisfies the interface with unchanged behaviour
Given the BOE adapter (`src/corpus/boe-fetcher.ts` + `parse-consolidated-xml.ts`)
When a BOE fixture is fetched and parsed through the adapter
Then it returns the same `fecha_actualizacion`, passages and source URL as before the refactor
And `boeSourceUrl('BOE-A-2006-20764')` still resolves to `https://www.boe.es/buscar/act.php?id=BOE-A-2006-20764`

## AC-004-19 — The sync dispatches each norm to its publisher's adapter
Given a registry whose entries carry a `publisher`
When the sync runs with an adapter registered per publisher
Then every norm is fetched through its own publisher's adapter, never through a single hardcoded BOE fetcher

## AC-004-20 — The adapter-driven sync keeps incremental and idempotent behaviour
Given the adapter-driven sync
When it runs twice over unchanged sources
Then the second run fetches zero documents and the passages and hash are byte-identical to the first run
