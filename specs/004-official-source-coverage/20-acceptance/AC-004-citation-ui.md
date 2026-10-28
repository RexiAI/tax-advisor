# AC-004: Citations & UI — publisher + jurisdiction + date + link; source-agnostic copy

## AC-004-31 — A source entry renders publisher and jurisdiction
Given a `SourceEntry` receiving a citation with `publisher: 'bocm'`, `jurisdiction: 'madrid'`, `updatedAt: '2026-10-07'`
When it renders
Then the entry shows the publisher and the jurisdiction
And the date shown is `updatedAt` formatted with `formatSpanishDate`

## AC-004-32 — The link label names the text's real host, not the issuing publisher
Given a citation with `publisher: 'bocm'`, `jurisdiction: 'madrid'`, and `authorityUsed: 'boe'`
When the source entry renders its link and metadata
Then the link label reads "Ver en el BOE" (the host that actually serves the consolidated text, not "Ver en el BOCM")
And the accessible label matches the visible label
And the metadata row still shows the issuing publisher `bocm` and the jurisdiction `madrid`
And a citation with `publisher: 'boe'` reads "Ver en el BOE"

## AC-004-33 — The link label follows authorityUsed and never contradicts sourceUrl
Given a citation whose `authorityUsed` is `bocm`
When the source entry renders its link
Then the link label reads "Ver en el BOCM"
And for any citation, the label never names a host different from the host of its `sourceUrl`

## AC-004-34 — The named identity and refusal copy no longer hardcodes "del BOE"
Given the strings module (`src/content/strings.ts`) and the system policy (`src/prompts/system-policy.ts`)
When `CONSOLIDATED_TEXT_NOTICE`, `INSUFFICIENT_TITLE`, `OUT_OF_SCOPE_EXPLANATION`, `STATUS_SEARCHING`, `INSUFFICIENT_EXPLANATIONS.{no_results, below_threshold, no_citations, corpus_unavailable}`, `INSUFFICIENT_BOUNDARY`, `YEAR_NOTICE_BODY` and the identity sentence in `SYSTEM_POLICY` are read
Then none asserts the source is the BOE where the source must be generic
And each refers to the official source(s) in a publisher-agnostic way

## AC-004-35 — A regional citation shows the consolidated-version date, not a BOE date
Given a citation with `publisher: 'borm'` and `updatedAt: '2026-11-02'`
When the source entry renders the date
Then it shows the value of `updatedAt`
And the field named `boeUpdatedAt` no longer exists on the citation

## AC-004-53 — The link label's host token matches the sourceUrl host for every citation
Given every citation in the committed artifact and every citation fixture
When each citation's link label is compared to `new URL(citation.sourceUrl).hostname`
Then the label's host token matches the host of `sourceUrl` for every citation
And `boe.es` renders "BOE", `bocm.es` renders "BOCM", and `borm.es` renders "BORM"
