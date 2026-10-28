# AC-004: ADR for official-source coverage, provenance model and jurisdiction

## AC-004-01 — The ADR exists with the repository structure
Given the repository follows the ADR convention from `docs/adr/0003-*.md`
When the file `docs/adr/0004-official-source-coverage.md` is read
Then it contains the sections `## Context`, `## Decision`, `## Alternatives considered`, `## Consequences` and `## Sources`

## AC-004-02 — It records the source-registry data model and the jurisdiction concept
Given the ADR's `## Decision` section
When the section is read
Then it names the per-norm fields `publisher`, `jurisdiction`, `authorityUsed`, `officialId`, `sourceUrl`, `updatedAt` and `licenseNote`
And it states that a norm missing any of them is not admitted
And it names the jurisdiction values `state` and the two pilot communities (Madrid, Murcia)
And it states municipal taxes are named only as a refusal string, not a jurisdiction value

## AC-004-03 — It records the publisher-authority rule and the license-per-publisher model
Given the ADR's `## Decision` section
When the section is read
Then it states the community bulletin is the source of record for a regional norm
And it states BOE's consolidated text is used only when the publisher offers no stable, versioned consolidated text
And it states `authorityUsed` records which publisher was used, with both URLs and dates when both exist
And it states a norm does not switch authority between syncs without a migration note
And it records that each publisher's reuse terms are stored per norm and the product does not imply endorsement

## AC-004-04 — It records the coverage matrix, the pilot pair and the fallback order
Given the ADR's `## Decision` and `## Consequences` sections
When both are read
Then the coverage decision names per-(jurisdiction, tax) pairs, machine-readable in the artifact, single lookup, no second list
And it names the pilot pair Madrid (BOCM) and Región de Murcia (BORM)
And it names the ordered fallback Castilla y León (BOCYL), Aragón (BOA), Extremadura (DOE)
And it states the sync is incremental on the source's own update date and fails closed
And it names what stays out: the remaining communities (005), Impuesto sobre Sociedades (006), municipal taxes, and DGT consultations / AEAT manuals

## AC-004-05 — Its sources cite only official hosts
Given the ADR's `## Sources` section
When every URL in the ADR is extracted
Then every host is an official bulletin or BOE host (BOCM, BORM, or `boe.es`)
And the ADR does not cite a competitor or a commercial mirror
