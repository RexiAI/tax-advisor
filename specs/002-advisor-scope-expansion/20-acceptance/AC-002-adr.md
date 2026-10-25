# AC-002: Nuevo ADR 0003 — expansión de alcance

## AC-002-33 — El ADR registra la decisión, las alternativas y el riesgo aceptado
Given `docs/adr/0003-advisor-scope-expansion.md` (next free number, since `docs/adr/` only holds 0001 and 0002)
When it is read
Then it has the repo ADR structure (Context, Decision, Alternatives considered, Consequences)
And it records the decision to move from IRPF-only to the autónomo fiscal lifecycle (censal, LGSS/RETA, IVA, IAE) with retrieval + citations, while filing/ITP/ISD/IBI/non-residents/Sociedades stay out
And it lists and rejects the alternatives: handoff-only, and a cosmetic reframe
And its Consequences cover the corpus surface (8 norms), the legal liability posture (reinforced disclaimer + handoff), and the ADR 0001 volume note
And it records the accepted risk that lexical retrieval may not discriminate in the expanded corpus, with `insufficient_evidence` as the honest output and no recall-measurement gate
