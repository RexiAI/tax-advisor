# Design Spec: 001-spain-tax-advisor

Mixed surface: only Task 1 (the design-bearing slice of the app shell) and Task 15 (the chat
UI) are in scope here. Tasks 2 to 14, 16 and 17 are backend, tooling or docs and are out of
scope for this document.

## Design Read

Reading this as: a single-screen consumer tax explainer for residents in Spain, with a calm
documentary / institutional language (paper and ink, one green accent, citation metadata in
monospace), leaning toward a hand-rolled CSS Modules token layer with no component-library
look and near-zero motion.

Why not the obvious defaults:

- It is not a chatbot surface. Chatbot conventions (avatar bubbles, typing dots, typewriter
  caret, "Asistente:" labels) actively undermine the product's one differentiator, which is
  that every claim carries a verifiable source. The answer is rendered as a short legal
  document with a sources block, not as a message from a persona.
- It is not fear-driven tax design. No red for abstention, no countdowns to the filing
  campaign, no refund estimate teasers, no Hacienda crest imagery, no BOE-like maroon. Using
  the gazette's red would imply official endorsement, which R1 and R6 forbid.
- Trust-first and regulated, so this sits in the skill's lowest-variance band, not the
  landing-page baseline. The differentiation is carried by information structure (freshness
  in the header, sources always visible, honest abstention), not by visual novelty.

## Dial Values

- **DESIGN_VARIANCE: 3** - Trust-first, regulated, accessibility-critical, single broadcast
  screen with no marketing job. Symmetry and predictable rhythm beat composition. The only
  permitted asymmetry is inside a citation entry's metadata stack, where label, norm and date
  are separate registers rather than a single sentence.
- **MOTION_INTENSITY: 2** - Feedback only: streaming text arrival, a 120ms fade on a state
  change, tactile `scale(0.98)` on press. No entrance choreography, no scrolltelling, no
  parallax, no spring physics. Every motion is justified by a state transition the user must
  perceive (answer arrived, answer was replaced by abstention, request failed). Static is the
  default state of the screen.
- **VISUAL_DENSITY: 4** - The answer body must breathe: 17px / 1.6 on a 360px screen, one
  idea per paragraph. The citation block is denser on purpose (four fields per source, mono
  dates), because density there reads as evidence rather than as clutter.

## Design System / Foundation

No official design system applies. GOV.UK Frontend and USWDS are jurisdictional and would be
a category error on a Spanish consumer product; Material, Fluent, Carbon and Primer all
import a visual language this brief must not have. Per the skill's honesty rule, this is a
hand-rolled token layer, not a re-skinned library:

- **CSS Modules + CSS custom properties.** Required by Task 15's acceptance criteria
  (`:focus-visible` rules live in the component's CSS module) and by
  `.standards/docs/CODING_CONVENTIONS.md` (one component per directory, `Component.module.css`,
  tokens via `var(--token)`, no inline `style` prop). Tailwind is therefore excluded: it
  cannot satisfy the CSS-module criterion and would put tokens in class strings the gates
  cannot audit.
- **No component library, no shadcn.** The screen is one form, one textarea, one button
  family, one list, one notice family. A library would be pure surface area.
- **Icons: `@phosphor-icons/react`**, imported per icon so only the used ones ship. Needed:
  `ArrowSquareOut` (external link on a citation), `ArrowUp` (submit), `Info` (consolidated
  text notice). Three icons. Do not hand-roll SVG paths (skill Section 9.E).
- **Token file layout:** `src/styles/tokens.css` (all custom properties, single source),
  `src/app/globals.css` (reset, base type, focus ring), then one `*.module.css` per component.
  Every colour, space, radius, font size and weight is a token. A bare hex or px in a
  `*.module.css` is a review finding (see `docs/CODING_CONVENTIONS.md` §CSS).

## Global Tokens

- **Font:** IBM Plex Sans (400 / 500 / 600) for UI and prose, IBM Plex Mono (400 / 500) for
  citation metadata, dates and the tax-year line. Self-hosted with `next/font/local` from
  commit-pinned woff2 files (or `@fontsource-variable/ibm-plex-sans`); no Google Fonts CDN
  request at runtime, because this product handles tax questions under RGPD/LOPDGDD and a
  third-party font request is an avoidable data transfer. Plex is chosen over Inter/Geist for
  full Spanish coverage (inverted `¿`/`¡`, accents, `ñ`) and because Plex Mono gives source
  metadata a documentary register that sans-serif cannot.
- **Accent color:** `#1B5E4B` (verde archivo). Desaturated deep green, ~7.6:1 against the page
  surface, so it works as link text, as primary button fill with white label, and as the
  2px `:focus-visible` ring. It is deliberately not a BOE/Hacienda red, not a fintech teal
  gradient, and not a purple. Used identically everywhere: links, primary button, focus ring,
  the left rule on informational notices, the "Fuentes" label. No second accent.
- **Neutral base:** cool graphite with a green undertone, one family, no warm paper.
  `--surface: #FBFCFB`, `--surface-raised: #FFFFFF`, `--surface-sunken: #F2F4F2`,
  `--hairline: #DDE1DE`, `--ink: #161A18`, `--ink-secondary: #5A625E`,
  `--ink-tertiary: #656D68`.
- **Semantic colors** (state only, never decoration): error `#8A3B2F` (muted brick),
  warning `#7A5A18` (dark amber). Rule: accent green = brand, links and "verified source";
  warning amber = privacy notice; brick red = transport or configuration failure only. Never
  red for `insufficient_evidence` or `clarification`.
- **Corner-radius system:** soft, one value, **8px**, applied to the user message, the sources
  block, notices, the textarea and every button. No pills, no 16px cards, no mixed scale. The
  only exception is the fully round `:focus-visible` ring, which is a ring, not a radius.
- **Theme:** light, locked for v1. `10-tasks.md` has no dark-mode criterion, and adding one
  would put unaccounted behaviour in front of the traceability gate. All colours are custom
  properties in one file, so a dark theme is a token-file change plus a
  `prefers-color-scheme` block in a follow-up, with no component edits. Recorded as a Watch
  item, not silently ignored.
- **Icon library:** Phosphor (see Foundation).
- **Type scale (360px first, no breakpoint scaling needed):** h1 22px/1.25 600;
  h2 15px/1.35 600 sentence case; answer body 17px/1.6 400; user message 16px/1.5 400;
  notice 14px/1.5 400; citation label 13px/1.4 500 mono; citation norm 14px/1.45 400;
  citation date 12px/1.4 400 mono; disclaimer 12.5px/1.45 400. Measure: `max-width: 62ch`,
  and on a 360px viewport the only width constraint is `max-width: 100%`.

## Per-Task Directives

### Task 1: App scaffold, typed configuration, fail-closed LLM env

Only the design-bearing slice of this task is in scope: `src/app/layout.tsx`, the font and
token wiring, and the document metadata. Everything else in Task 1 is backend configuration.

- **Layout:** Root document shell only. `<html lang="es-ES">`, no theme attribute, no
  client-side provider tree. `viewport` sets `width=device-width, initial-scale=1` and
  `viewport-fit=cover` (needed for `env(safe-area-inset-bottom)` on the sticky composer).
- **Components:** `layout.tsx` importing `globals.css`, `tokens.css`, and the two `next/font`
  loaders. No visual component here; the shell must render nothing above the page's own `<h1>`.
- **Typography:** Both font families loaded as CSS variables (`--font-sans`, `--font-mono`) and
  bound in `tokens.css`. `display: 'swap'`, subset `latin`, weights limited to the ones in the
  type scale. No third-party font host.
- **Motion:** none.
- **A11y:** `lang="es-ES"` is non-negotiable for screen-reader pronunciation of Spanish tax
  terms. Document `<title>` comes from the `APP_NAME` constant in `src/content/strings.ts`,
  never a literal in `layout.tsx`. `color-scheme: light` declared so form controls and
  scrollbars do not flip to the OS dark palette under the light-locked theme.
- **Anti-patterns to avoid:** no `next/font/google` (runtime CDN request), no font-family
  strings duplicated in modules (only `var(--font-sans)`), no second reset library bolted onto
  `globals.css`, no `--font-*` fallback stack that silently resolves to system sans and hides a
  failed font load.
- **Watch items (Coder must check):** a failed woff2 fetch must not fall back to a generic
  sans without at least documenting the fallback metric mismatch (CLS); confirm `lang` and
  `color-scheme` in the rendered HTML, not just in source.

### Task 15: Chat UI: Spanish, citations, disclosure, accessibility, 360px

This task carries the whole product surface. Directives are grouped by element and by
response state, because the six response kinds from Task 10 are six different renderings of
the same screen, not six screens.

#### Document anatomy (single column, top to bottom)

1. `<header>`: `<h1>` (product name from `APP_NAME`), then one metadata line with the tax year
   and the corpus generated date read from the artifact metadata, then the AI disclosure as
   visible text. Not sticky. At 360px this is three short lines; no logo mark, no nav, no
   hamburger (there is nowhere to go).
2. `<main>`: the thread. Empty state on first load, then turns in order.
3. Sticky composer dock: the privacy warning, the `<form>` with `<textarea>` and submit
   `<button>`, a character counter that appears only past 1,800 characters.
4. A visually hidden skip link "Saltar a la respuesta" as the first focusable element.

- **Layout:** Single-Column Reading Stream for the thread, Sticky Composer Dock at the bottom
  with `position: sticky; bottom: 0`, `padding-bottom: calc(12px + env(safe-area-inset-bottom))`
  and a solid `--surface` background plus a single top hairline (no blur, no glass). Container
  height uses `min-h-[100dvh]` logic in plain CSS (`min-height: 100dvh`), never `100vh`.
- **Components:** `Header`, `Thread`, `UserTurn`, `AnswerBlock` (with `AnswerSection` for the
  body parts and `SourcesList` + `SourceEntry` for citations), `Notice` (one component, three
  tones: info / warning / error, chosen by a `tone` prop), `StatusLine` (the "Buscando en el
  BOE" and "Comprobando fuentes" states), `Composer`, `ExampleQuestions` (empty state only).
  One component per directory with a barrel export, per the coding conventions.
- **Typography:** as in Global Tokens. Answer body paragraph spacing 12px, section gap 24px.
  Never center-align prose. Spanish quotation marks `«»` and inverted `¿` are used as typed;
  do not HTML-escape them into entities. Zero em-dashes in any string.

#### Answer rendering (the product's core surface)

The answer is a document, not a bubble, and it is not wrapped in a card. It sits directly on
`--surface`, separated from the previous turn by 40px of space.

- Order: optional `yearNotice` inset, then `explanation` under `<h2>En resumen</h2>`, then
  `rule` under `<h2>La norma dice</h2>`, then optional `workedExample` under
  `<h2>Ejemplo</h2>`, then the sources block under `<h2>Fuentes</h2>`, then the disclaimer.
  Section labels are sentence case 15px/600 in `--ink-secondary`: functional headings, not
  decorative uppercase eyebrows.
- **Sources block.** Always visible, never collapsed behind a `<details>`. Trust that needs a
  click is not trust. It is the one place a surface is justified: `--surface-raised`,
  `--hairline` border, 8px radius, 14px padding, titled `Fuentes` with the count, e.g.
  `Fuentes (3)`. Each `SourceEntry` is a three-line metadata stack, not a sentence: line 1 the
  `articleLabel` in mono 13px/500 `--ink`; line 2 the `normTitle` in 14px/400
  `--ink-secondary`, clamped to 2 lines; line 3 a `<a>` reading "Ver en el BOE" in accent green
  with the `ArrowSquareOut` icon and, after it, the BOE last-updated date in mono 12px
  `--ink-tertiary`, humanised to `17 de marzo de 2026`. `target="_blank"`,
  `rel="noopener noreferrer"`, and an `aria-label` that spells out the norm and article,
  because "Ver en el BOE" repeated three times is useless to a screen-reader user. Entries are
  separated by 16px of space, not by a hairline per row.
- Below the list, one line in 12.5px `--ink-secondary`: the consolidated-text notice constant
  (informative, no legal value, not an official BOE publication, no endorsement).
- Below that, the footer disclaimer constant, 12.5px `--ink-secondary`, `aria-label`-free
  plain text. It must be the same constant as the first-load disclosure (single export), and
  it must not be inside a `title`, `hidden`, or `aria-hidden` element.
- **Clarification.** Render the single question as a 17px body line in an inset block with an
  accent left rule, immediately above the composer. No quick-reply chips: the server sends a
  question string only, and inventing option buttons would be unaccounted behaviour. On
  arrival, move focus to the textarea (helpful here; see Watch items for why not on load).
- **Insufficient evidence.** The honest state, and the one most likely to be designed badly.
  Tone is `info`, not `error`: `--surface-sunken` block, no icon, no red, no warning triangle.
  Content: the `explanation` of what can and cannot be confirmed, then one sentence naming the
  boundary, then two actions in one row that wraps at 360px: primary `<a>` "Hablar con un
  asesor" using `HANDOFF_URL`, secondary text "Ver las normas relacionadas" only when the
  payload carries passages. No citations array is rendered, and no `Fuentes` heading appears,
  so the block cannot be mistaken for a cited answer.
- **Out of scope.** Same `info` block shape. Names the topic and the official body as plain
  text. Do not render the body name as a link unless the payload actually carries a URL; the
  UI must never invent a destination, for the same reason the model may not invent a citation.
- **Privacy warning.** `warning` tone: `--surface-sunken` with a 3px `#7A5A18` left rule,
  14px text, placed directly above the composer. Names the detected category only, never
  echoes the matched value, and never clears what the user typed.
- **Errors.** 400 `message_too_long`, 429, 503 configuration error, and transport failure all
  render in an `error` tone block immediately above the composer, with the Spanish message from
  the server verbatim. 429 additionally shows the `Retry-After` seconds as
  "Puedes volver a preguntar en N segundos". The user's text is preserved in the textarea in
  every failure case: losing a typed question is the worst thing this screen can do.
- **Streaming.** While `data:` frames arrive, the answer body renders as text with a 2px
  indeterminate hairline pinned to the top edge of the answer block and a `StatusLine` reading
  "Comprobando fuentes" where the sources block will appear. On the final frame the hairline is
  removed and the sources block fades in over 120ms. On `event: replace` the whole block
  cross-fades (160ms) to the insufficient-evidence rendering and the live region announces the
  replacement. No citation-shaped placeholder may appear before validation, because a source
  that might be withdrawn must never look established.
- **Empty state.** One `<h2>` in 17px/400 asking what the user wants to know, then the three
  example questions as `<button type="button">` items in a vertical stack (not a 3-up card
  grid), each populated into the composer on activation without auto-submitting. Buttons, not
  decorative text, so they are keyboard reachable. If the human gate rejects new surface, the
  fallback is the same three strings as static text; nothing in the acceptance criteria
  depends on them being interactive.
- **Composer.** `<form>` with a `<textarea>` (not a `div` with `contenteditable`), a submit
  `<button type="submit">` carrying `ArrowUp` plus "Preguntar", and no `onClick` on any
  non-interactive element. Textarea auto-grows from 2 to 6 lines then scrolls, `font-size: 16px`
  minimum on mobile so Safari does not zoom on focus. Submit sets `aria-busy` and disables the
  button without clearing the textarea. Enter sends, Shift+Enter newlines, and the
  `Enter`-sends behaviour is announced in a helper line above the composer.
- **Privacy warning placement.** Fixed Spanish string ("No escribas tu DNI, NIE, IBAN ni
  documentos personales"), 12.5px `--ink-secondary`, directly above the textarea and inside the
  dock so it is always visible with the input.
- **Motion:** 120ms opacity + 4px translate on state change only; `scale(0.98)` on `:active` for
  buttons; focus ring transition omitted (instant). Nothing animates on mount. All transitions
  are inside `@media (prefers-reduced-motion: no-preference)`, and the reduce block sets
  `transition: none` on every animated selector. Streaming still streams under reduced motion
  because it is content arrival, not decoration.
- **A11y:** answer region is `aria-live="polite"` with `aria-atomic="false"` so streaming does
  not re-read the whole answer on every frame; the region is the answer body only, never the
  sources block. Focus ring `2px solid #1B5E4B` at `2px` offset, never removed, defined in each
  component's CSS module. Contrast targets: body text AAA where the palette allows, AA (4.5:1)
  minimum for 12.5px metadata and for white-on-accent button labels. Tap targets 44x44 CSS px
  minimum. One `<h1>`, `<h2>` for each answer section and for `Fuentes`, no skipped levels. The
  composer never autofocuses on page load.
- **Anti-patterns to avoid (specific to this task):** chat bubbles with tails, avatar circles,
  "Asistente:" role labels, three-dot typing indicators, a blinking typewriter caret; a
  collapsing "Fuentes (3)" disclosure; red or amber for `insufficient_evidence`; a BOE-red
  accent, crest or seal artwork, or any shield/lock/award iconography implying a certified
  advisor or official status (R6 forbids the claim, the iconography makes it implicitly);
  countdown timers, "la campaña termina en", refund or "a devolver" figures of any kind;
  confetti or green checkmarks on a successful answer; glassmorphism, gradients or outer glows
  on the composer; full-page skeletons instead of the textual status line; a spinner where the
  status text belongs; raw source URLs as visible link text; `em`-based fixed widths over
  360px, `overflow-x: hidden` used to hide overflow, or any min-width that breaks 360px.
- **Watch items (Coder must check):** verify every contrast pair empirically with a checker
  rather than trusting the hex values above; confirm the same disclosure constant is used in
  the header and the answer footer (one export, asserted by the existing test); confirm the
  corpus date and tax year come from the artifact metadata and not a literal; confirm nothing
  renders a `Fuentes` block for `insufficient_evidence` or `out_of_scope`; confirm a `replace`
  frame cannot leave a stale citation node in the DOM; confirm the textarea keeps its value
  across 400/429/503 responses; confirm 360px is tested with long `normTitle` values (the full
  `Ley 35/2006, de 28 de noviembre, del Impuesto sobre la Renta de las Personas Físicas`),
  a 2,000-character message, and a three-entry sources list in the same viewport; confirm dark
  mode is not partially wired by the OS (see Theme lock).

#### Open-question defaults chosen here (reversible, single constant each)

- **OQ-1, display name:** default value `Renta Clara`. Rationale: it makes the plain-language
  promise the name, reads as a service rather than as a person or a chatbot persona, contains
  no officialdom, no English and no startup filler. It is one `APP_NAME` constant, so the gate
  can replace it in a single line. Needs a trademark and domain check before launch, which is
  outside this document's authority.
- **OQ-2, human handoff:** default `HANDOFF_URL = "mailto:asesoria@example.com"` with label
  "Hablar con un asesor". A `mailto:` is functional, needs no new route, cannot 404, and keeps
  the abstention state honest rather than pointing at a dead page. Replace with a real booking
  destination by editing one constant. If the gate supplies a real destination, no design work
  is required: the anchor and label are unchanged.
- **OQ-4, clarification continuity:** default is single-request clarification with no
  server-guaranteed continuity. Design consequence: the UI renders turns client-side only, has
  no "new chat" control, no history affordance, and no copy that implies the assistant
  remembers earlier questions. The clarification block therefore restates what it needs.
- **OQ-5, rate-limit scope:** default is the in-process fixed window. Design consequence: the
  429 copy promises only the `Retry-After` interval it is given, never a wall-clock time,
  because a cold start can reset the window early.
- **OQ-6, no sources page:** default is per-answer footer only, so the freshness metadata, the
  consolidated-text notice and the disclaimer must all fit on this one screen. That is why the
  header carries the corpus date rather than a "ver fuentes" link.
- **OQ-3, corpus extent:** default assumes full consolidated text. Design consequence:
  `blockTitle` and `normTitle` must tolerate long strings (2-line clamp, full value in the
  link's `aria-label`), and a single passage may be much longer than its rendered citation.

## Out-of-scope tasks

- **Task 2 to 6** (passage model, BOE parser, corpus sync, retrieval index, evidence bundle):
  no frontend surface. They expose data shapes the UI consumes, nothing renders from them
  directly.
- **Task 7 to 11** (LLM adapter, prompt assembly, citation validation, orchestration, scope
  guard): backend. They decide which of the six response kinds a turn produces; this document
  specifies only how each kind renders.
- **Task 12** (privacy guard, log redaction): backend. Its only design surface, the
  `privacy_warning` rendering, is specified under Task 15.
- **Task 13** (chat HTTP route): backend. Its error payloads surface through Task 15's error
  block.
- **Task 14** (`/health`): operational endpoint, not a screen. No design work, and no health
  UI is to be built.
- **Task 16** (offline test harness) and **Task 17** (runbook and ADRs): no frontend surface.
