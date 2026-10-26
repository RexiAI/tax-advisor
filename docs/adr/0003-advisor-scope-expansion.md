# ADR 0003 — From an IRPF explainer to the autónomo's fiscal cycle

## Context

V1 answered one tax: the IRPF. Every other subject — VAT, the Social Security contribution, the
censal registration of a self-employed worker, the IAE — was refused or replaced by a canned
guide held in the source code. Three of those refusals were wrong in the same way: the
consolidated text of the norm that governs them is public, official and openly licensed, so
the product could cite it exactly as it cites the IRPF.

Two consequences of the v1 posture were visible in the product itself:

- The refusal was built from a constant (`AUTONOMO_STEPS`) and asserted a scope it did not
  have ("aquí solo explico el IRPF"), which becomes false the moment any of the three subjects
  is answered.
- The guide matchers intercepted VAT and contribution questions before retrieval ran, so the
  only way to widen the scope was to delete them, not to add branches.

The corpus is a build-time artifact with no database and no writable filesystem at request
time (ADR 0002), and retrieval is lexical (ADR 0001). Both constraints stay.

## Decision

The product covers the autónomo's fiscal cycle with the same standard it applied to the IRPF:
retrieval over the BOE consolidated text, an answer only when at least one validated citation
supports every claim, and an honest abstention when it does not.

The registry of covered norms (`src/domain/allowed-norms.ts`) holds eight norms: the two IRPF
norms plus the General Tributaria law, the general regulation of tax procedures, the Social
Security law (LGSS), the regulation on registration and affiliation, the VAT law and the IAE
tariffs and instruction. Three subjects move from refused to answered: VAT, the Social
Security contribution (RETA) and the autónomo registration (the censal declaration and the RETA
alta). They are answered with the ordinary `answer` response — retrieval, model, citations —
not with a new response kind.

What stays out of scope is what the corpus cannot ground: a request to this product to file,
sign or represent (the presentation of a return), ITP, ISD, IBI, non-residents (IRNR) and
Impuesto sobre Sociedades. Each keeps its current routing: a handoff for a filing request, a
preserved guide for the regional and corporate taxes.

The Regional Finance Law text (RD Leg. 2/2004) is deliberately absent from the registry: it
hosts the IBI, which stays out.

## Alternatives considered

- **Handoff-only (keep every non-IRPF subject as a derivation).** Rejected. It is the v1
  behaviour with better copy: the product would still refuse a question whose answer is a
  public, official, citable text, and the user would still pay an advisor for a lookup. It also
  keeps the canned-procedure problem: the handoff does not replace a citation.
- **Cosmetic reframe (keep explaining only the IRPF, rewrite the refusal).** Rejected. It fixes
  the dishonest sentence and leaves the scope unchanged, so the product still refuses VAT, the
  contribution and the alta — the three questions an autónomo asks most. Rewriting the refusal
  is part of this decision (the copy no longer claims the product is IRPF-only), not a
  substitute for it.
- **A new response kind per new subject.** Rejected: it would add a shape per tax, duplicate
  the citation and disclaimer contract, and let a subject exist without a citation. The
  ordinary `answer` already carries what a grounded response needs.
- **Embeddings to handle the wider corpus.** Rejected for now, by ADR 0001: the corpus is
  small enough for lexical retrieval and determinism matters to the citation contract.

## Consequences

- **Corpus surface.** 8 norms, from 396 to several thousand passages, all of them quoted from
  the BOE consolidated text with the reuse conditions the artifact records. The sources block
  now shows much longer norm titles (the LGSS title is roughly twice the IRPF one), so the
  citation entry must still clamp at 360px with the full value in the link's `aria-label`.
  The volume note lives in `docs/adr/0001-lexical-retrieval.md`; its revisit threshold (about
  50,000 passages) is unchanged.
- **Legal posture.** The disclaimer and the handoff stay as they were, and get stronger where
  the new subjects need it: a reinforced boundary when a validated citation belongs to a norm
  other than the IRPF (derived from the cited norms, never from the user's wording), an
  abstention that names its own limit, and a refusal that names the competent body instead of
  claiming a scope the product does not have. The product still does not file, does not
  calculate a quota and does not substitute an advisor.
- **Removed surface.** `src/content/autonomo.ts` is deleted: no advisory answer comes from a
  source constant any more. The IVA, invoice, RETA, 303, 390, 036 and "which models do I file"
  guide matchers are withdrawn for the same reason: the corpus answers them with a citation.
  The procedural IRPF guides (models 130, 131, 100), the expense criteria and the guides for
  the taxes that stay out of scope are kept, and none of them may capture a question the corpus
  can answer.
- **Accepted risk.** Lexical retrieval may not discriminate in the expanded corpus: norms share
  vocabulary (base, cuota, cotización, devengo), so a question can retrieve another norm's
  passages, or retrieve enough to look sufficient without answering. The honest output in that
  case is `insufficient_evidence`, and this decision accepts the risk instead of gating on it:
  no recall-measurement gate is introduced, and the absence of measurement is recorded rather
  than hidden. Measuring recall later is a separate decision, taken with the labelled set ADR
  0001 describes.

## Sources

- BOE consolidated text, open-data API:
  <https://www.boe.es/datosabiertos/api/legislacion-consolidada>
- Ley 35/2006 (IRPF): <https://www.boe.es/buscar/act.php?id=BOE-A-2006-20764>
- Real Decreto 439/2007 (Reglamento del IRPF): <https://www.boe.es/buscar/act.php?id=BOE-A-2007-6820>
- Ley 58/2003 (General Tributaria): <https://www.boe.es/buscar/act.php?id=BOE-A-2003-23186>
- Real Decreto 1065/2007: <https://www.boe.es/buscar/act.php?id=BOE-A-2007-15984>
- Real Decreto Legislativo 8/2015 (LGSS): <https://www.boe.es/buscar/act.php?id=BOE-A-2015-11724>
- Real Decreto 84/1996: <https://www.boe.es/buscar/act.php?id=BOE-A-1996-4447>
- Ley 37/1992 (IVA): <https://www.boe.es/buscar/act.php?id=BOE-A-1992-28740>
- Real Decreto Legislativo 1175/1990 (IAE): <https://www.boe.es/buscar/act.php?id=BOE-A-1990-23930>
- Repository decisions: `docs/adr/0001-lexical-retrieval.md`,
  `docs/adr/0002-no-server-persistence.md`, `docs/RUNBOOK.md`
