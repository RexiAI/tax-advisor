# ADR 0004 — Official-source coverage: provenance, jurisdiction and the coverage matrix

## Context

V1 to v3 answered from the consolidated texts of eight state norms, every one of them fetched
from the BOE open-data API. The corpus artifact recorded a single provenance shape — norm id,
title, source URL, `boeUpdatedAt`, `fetchedAt` and a BOE reuse note — and the whole product
assumed the source was the BOE. That assumption is now false in two ways:

- The taxes that vary by autonomous community (the IRPF regional scale and deductions, ITP, ISD,
  IBI) are published by the community, not by the State. A Madrid or Murcia norm cited as
  "Ver en el BOE" is a citation a reader cannot verify at a glance.
- Coverage was implicit: the out-of-scope guard held a hardcoded list of refused taxes, so
  "what does this product cover?" had no machine-readable answer. Adding a community by editing
  a guard list would let the declared coverage and the actual corpus disagree.

The corpus stays a build-time artifact with no database and no writable filesystem at request
time (ADR 0002), and retrieval stays lexical (ADR 0001). Both constraints stay.

## Decision

### Source-registry data model

Every covered norm carries seven provenance fields, and a norm missing any of them is not
admitted to the registry:

| Field | Meaning |
|---|---|
| `publisher` | The administration that issued the norm and is responsible for it. |
| `jurisdiction` | Whose rules the norm states: `state`, `madrid` or `murcia`. |
| `authorityUsed` | The publisher whose consolidated text was actually ingested. |
| `officialId` | The stable identifier the authority assigned to that text. |
| `sourceUrl` | The official URL of the text actually used. |
| `updatedAt` | That source's own last-update date (`YYYY-MM-DD`). |
| `licenseNote` | The reuse conditions recorded verbatim from the publisher of the text. |

The passages and the citations project `publisher`, `jurisdiction`, `updatedAt` and `sourceUrl`,
so a source entry can render what a reader can verify by clicking. `officialId` and
`authorityUsed` stay norm-level facts; they are not rendered.

### Jurisdiction

A closed set: `state`, plus the communities the product covers. This spec admits `madrid` and
`murcia`; the remaining communities arrive with spec 005. Municipal taxes are out of scope and
are named only inside an honest-refusal string ("la autoridad tributaria de tu comunidad
autónoma"), never as a jurisdiction value. A municipal jurisdiction would imply coverage the
corpus does not have.

### Publisher-authority rule

The community bulletin is the source of record for a regional norm. The BOE consolidated text is
used only when the publisher offers no stable, versioned consolidated text of its own.
`authorityUsed` records which publisher was used. When both a publisher's versioned consolidated
text and an authority's exist, the per-norm verification record carries both references and both
dates. A norm does not switch authority between syncs without an explicit migration note: a
silent switch would change the cited text under a reader who verified yesterday's citation.

The two pilot norms are the rule's first application. Neither the BOCM nor the BORM publishes a
stable, versioned consolidated text with an update date for its tax code — the BOCM's ELI page
links to the Community's consolidated database, which carries no per-norm update date, and the
BORM's ELI record offers only the initial legal resource. The BOE does publish both consolidated
texts with a stable identifier and an update date, so `authorityUsed` is `boe` for both while
`publisher` stays the issuing community. The per-norm evidence is recorded in the registry.

### License per publisher

Each publisher's reuse terms are stored per norm, verbatim, in `licenseNote`. The product cites
the source, does not alter the meaning of the text and does not imply that any publisher
endorses the product. No licence is invented: where the text used is the BOE's, the note is the
BOE's; where a community's own text is used, that community's terms are recorded.

### Coverage matrix

Coverage is declared per `(jurisdiction, tax)` pair, as a machine-readable list in the corpus
artifact. The sync derives it from the registry's `jurisdiction` and `tax` tags, which are the
only place a pair is declared. One lookup, `isCovered(coverage, jurisdiction, tax)`, answers
whether a pair is covered. There is no second list in a guard, a component or a string: a second
list would drift the moment spec 005 adds a community, and a refusal that names the covered
pairs would be that list in disguise.

This spec declares six pairs: `(state, irpf)`, `(state, iva)`, `(state, autonomo)`, `(state, iae)`,
`(madrid, irpf)` and `(murcia, irpf)`. The IRPF pilot covers the communities' IRPF deductions for
autónomos, not the whole regional tax system; finer granularity is a later spec's decision.

### Pilot pair and ordered fallback

The pilot pair is the Comunidad de Madrid (BOCM) and the Región de Murcia (BORM). If a pilot norm
cannot be verified — no stable consolidated text, identifier or update date — the ordered
fallback is Castilla y León (BOCYL), then Aragón (BOA), then Extremadura (DOE). The substitution
and its reason must be recorded. An unofficial copy is never a fallback.

### Incremental sync and fail-closed behaviour

The sync is incremental on the source's own update date, not on a BOE date: a norm whose recorded
`updatedAt` matches its adapter's current date is reused, not re-fetched. Every adapter fails
closed. An unreadable document, a missing or unparsable update date, or a parse that yields zero
passages fails the whole sync, names the norm, and writes nothing. A guessed date or a silently
shrunken corpus is never shipped.

### What stays out

- The remaining autonomous communities: spec 005 owns the full community data.
- The Impuesto sobre Sociedades: spec 006.
- Municipal taxes, including the IBI.
- DGT consultations and AEAT manuals: they are interpretation, not the consolidated norm the
  citation contract requires.

## Alternatives considered

- **Keep the single BOE provenance shape.** Rejected: it cannot express a regional norm, and it
  makes "Ver en el BOE" the only possible label. A citation that misnames its publisher is not
  verifiable, which is the product's core claim.
- **Treat the community bulletin as the only admissible authority.** Rejected: neither pilot
  bulletin publishes a versioned consolidated text, so the product would either ship the 2010/2011
  original text as current or refuse two communities the human gate selected. Using the BOE's
  consolidated text with `authorityUsed` recording it is the honest middle.
- **A hardcoded covered-pairs list in the guard.** Rejected: it duplicates the registry, drifts
  from the artifact and makes a coverage change a code change in two places.
- **A coverage screen or a "ver coberturas" page.** Rejected: a coverage table is a second copy of
  the artifact's data and invites the reader to audit the matrix instead of the citation.
  Coverage is stated pair by pair — an answer names the administration it cited, a refusal names
  the administration that has competence.
- **Silently substituting a different community when a pilot cannot be verified.** Rejected: the
  substitution must be visible in the registry and in the verification record.

## Consequences

- **Corpus schema v2.** The artifact, the passages and the citations carry the new provenance.
  The parser rejects a v1 artifact and a v2 artifact with missing or malformed provenance or
  coverage, so a coverage change cannot ship silently. The committed artifact is regenerated.
- **Source adapters.** The sync dispatches each registry entry to the adapter for the publisher
  that supplied its text, so a BOE-supplied regional norm and a bulletin-supplied one can coexist.
  The BOE adapter is the old fetcher and parser behind the interface; a regional-bulletin adapter
  reads the bulletin's own document shape.
- **Region-aware guard.** A covered `(jurisdiction, tax)` reaches retrieval. An uncovered pair is
  refused naming the competent body. A community outside the matrix is refused, not looped back
  into a clarification; only a message that names no community is clarified. The decision comes
  from the coverage lookup, not from a hardcoded list.
- **Jurisdiction-aware answering.** A regional question is answered only from that region's
  passages. A state passage never stands in for a regional rule the corpus does not hold; when
  the region's corpus is silent the turn abstains.
- **Citation rendering.** A source entry shows the publisher and the jurisdiction beside the
  date and the link. A regional norm is never labelled "BOE". The pilot citations name the
  issuing community (`Ver en el BOCM`, `Ver en el BORM`) while their `sourceUrl` is the BOE
  consolidated text that supplied the passages: the design's link-label-versus-host question
  (15-design flagged uncertainty 2) is recorded as an open question, not silently resolved.
- **Open question carried forward.** If a community later publishes its own versioned
  consolidated text, the publisher-authority rule allows switching `authorityUsed`, with the
  migration note this ADR requires and a re-sync of that norm.

## Sources

- BOE consolidated legislation, open-data API:
  <https://www.boe.es/datosabiertos/api/legislacion-consolidada>
- Comunidad de Madrid, Decreto Legislativo 1/2010 (consolidated text):
  <https://www.boe.es/buscar/act.php?id=BOCM-m-2010-90068>
- Comunidad de Madrid, ELI record for the same norm:
  <https://www.bocm.es/eli/es-md/dlg/2010/10/21/1>
- Región de Murcia, Decreto Legislativo 1/2010 (consolidated text):
  <https://www.boe.es/buscar/act.php?id=BOE-A-2011-10542>
- Región de Murcia, ELI record for the same norm:
  <https://www.borm.es/eli/es-mc/dlg/2010/11/05/1>
- Región de Murcia, Boletín Oficial (BORM):
  <https://www.borm.es/>
- Repository decisions: `docs/adr/0001-lexical-retrieval.md`,
  `docs/adr/0002-no-server-persistence.md`, `docs/adr/0003-advisor-scope-expansion.md`,
  `docs/RUNBOOK.md`
