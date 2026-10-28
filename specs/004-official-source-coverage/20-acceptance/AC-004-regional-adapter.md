# AC-004: Regional-bulletin adapter; fail-closed incremental sync

## AC-004-21 — A regional adapter reads its bulletin fixture offline
Given a committed BOCM (or BORM) fixture document
When the regional adapter fetches and parses it (with `fetchImpl` injected, no network)
Then it returns the norm's passages and the bulletin's own update date
And no test reaches the network

## AC-004-22 — Incremental sync is keyed on the source's own update date
Given a regional norm whose recorded `updatedAt` matches the adapter's current date
When the sync runs
Then the regional norm is reused, not re-fetched
And its passages and `fetchedAt` are carried over untouched

## AC-004-23 — An unreadable regional source fails closed
Given a regional adapter that returns an unreadable document (or a fetch error) for a norm
When the sync runs
Then the sync fails with `fetch_failed` (or `parse_failed`) naming that norm
And the CLI exits non-zero and writes nothing

## AC-004-24 — An undated regional source fails closed, never guessed
Given a regional adapter whose document carries no update date or an unparsable date
When the sync reads the norm's update date
Then the sync fails naming that norm
And it does not substitute a guessed date

## AC-004-25 — A regional document that parses to zero passages fails instead of shrinking the corpus
Given a regional fixture whose parse yields no passages
When the sync runs over it
Then the sync fails with `parse_failed` and detail `no_passages`
