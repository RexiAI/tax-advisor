# AC-004: State-surface non-regression

## AC-004-45 — The 8 state norms still answer with a citation
Given the fixture corpus with the 8 migrated state norms
When an IRPF, IVA, RETA/autónomo or IAE question is asked with a citing adapter
Then the response is an `answer` (or reaches retrieval) with at least one validated citation, as before this spec

## AC-004-46 — The five refusals keep their reason codes and bodies
Given the coverage matrix, which does not cover ITP, ISD, IBI, non-residents or company tax for any jurisdiction
When `classifyScope` runs on each representative message
Then ITP → `itp`, ISD → `isd`, IBI → `ibi`, non-residents → `non_residents`, company tax → `company_tax`
And each keeps its existing `officialBody`

## AC-004-47 — The IBI note text is unchanged
Given `OUT_OF_SCOPE_EXPLANATION` and the IBI topic entry
When they are read
Then the IBI refusal still names "la autoridad tributaria de tu comunidad autónoma" exactly as in spec 003

## AC-004-48 — Every source URL still points at an official host
Given the committed artifact (now including the pilots)
When every norm and passage `sourceUrl` host is extracted
Then every host is an official host (`www.boe.es`, the BOCM host, or the BORM host)
And the artifact contains no unofficial mirror or blog

## AC-004-49 — The corpus remains intact and de-duplicated
Given the fixture corpus including the pilots
When the index is built
Then it has more than 396 passages
And no `passageId` is duplicated
And the corpus still loads and answers offline with no network
