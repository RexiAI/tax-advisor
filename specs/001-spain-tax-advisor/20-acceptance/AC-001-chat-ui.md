# AC-001 / Task 15 — Chat UI: Spanish, citations, disclosure, accessibility, 360px

## AC-001-75 — The AI disclosure is visible on first load and in every answer footer

Given the chat screen rendered before any user action
Then the text `Esto es información general elaborada con IA, no asesoramiento fiscal personalizado.`
is visible
And it is not inside an element with `hidden`, `aria-hidden="true"`, a `title` attribute, or a
tooltip trigger
And the same string is rendered in the footer of every answer
And both render sites import one exported constant rather than repeating the literal

## AC-001-76 — Citations show norm, article, date and a real link

Given an answer with one citation for `Artículo 63` of Ley 35/2006
Then the rendered citation shows the norm title, `Artículo 63`, and the passage `boeUpdatedAt` date
And it contains an `<a>` whose `href` is the passage `sourceUrl`, with `target="_blank"` and
`rel="noopener noreferrer"`
And the link's visible text is a human label, not the raw URL
And two markers for the same passage render one entry

## AC-001-77 — The consolidated-text notice is rendered and claims nothing

Given any answer with citations
Then the rendered output contains the notice that the consolidated BOE text is informative and has
no legal value
And it states that the product is not an official BOE publication and does not imply BOE endorsement
And no text in `src/` claims the product is a registered advisor, gestor or Colaborador Social

## AC-001-78 — Corpus freshness is visible from artifact metadata

Given a corpus artifact with `taxYear: 2025` and a `generatedAt` date
When the screen renders
Then the header shows `2025` and that date
And the values are read from the loaded artifact metadata, not from a literal in the component
And changing the fixture artifact's date changes the rendered date in a test

## AC-001-79 — Non-answer states render their affordances

Given an `insufficient_evidence` response
Then the screen renders the explanation and a handoff link whose `href` is the `HANDOFF_URL`
constant, and renders no citation list
And given an `out_of_scope` response
Then the screen renders the topic, the official body name and the handoff link
And given an answer carrying `yearNotice`
Then the notice is rendered above the citation list
And given an answer carrying no `workedExample`
Then no worked-example block is rendered

## AC-001-80 — Keyboard and semantic structure

Given the rendered chat screen
Then there is exactly one `<h1>` and every section heading is `<h2>`
And the answer region carries `aria-live="polite"`
And the input is a `<textarea>` or `<input>` inside a `<form>` with a `<button type="submit">`
And no `onClick` handler is attached to a `div` or `span` lacking an interactive role
And every interactive element's class has a `:focus-visible` rule in the component's CSS module

## AC-001-81 — 360px layout and Spanish-only copy

Given the chat components' CSS modules
Then no rule sets a fixed `width` or `min-width` greater than `360px`
And no container uses `overflow-x: hidden` to mask overflow
And layout uses relative units or `max-width: 100%`
And every user-facing string under `src/app/` and `src/components/` comes from
`src/content/strings.ts` and is Spanish, with no English user-facing copy
