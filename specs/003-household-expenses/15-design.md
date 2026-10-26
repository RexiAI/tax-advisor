# Design Spec: 003-household-expenses

Mixed surface. Only **Task 3** (render the boundary note) changes what the screen renders and is
in scope here. **Task 1** (classifier refinement) and **Task 2** (constant, response field,
derivation) are backend and copy, and are listed under Out-of-scope tasks.

This is not a redesign and it adds no surface area. The whole visual delta is: one more `info`
notice inside an existing answer document, and one appended statement inside the existing
abstention notice. Both reuse `Notice` unchanged. No component is added, no CSS rule is added,
no token is added, no icon is added, no dependency is added.

## Design Read

Reading this as: a deterministic scope qualification inside an existing single-screen consumer
tax explainer for residents and autónomos in Spain, keeping v1's calm documentary language (paper
and ink, one archive-green accent, mono citation metadata) and v2's "Sobre ..." qualifier-notice
family, leaning toward applying the existing `Notice` inset a second time with a different title
rather than designing anything new.

Why the design work must stay this small:

- The failure this spec fixes is a **classification** failure: a sentence the corpus can partly
  ground was refused whole. The UI consequence is an honesty requirement, not a feature surface:
  an answer that is given must say which part of the question it is not covering.
- The product's differentiator is that every claim carries a verifiable source. A new block that
  looked like a warning, a badge, or a second refusal would attack exactly that. The note is a
  scope statement and must read in the same register as the year caveat already in the answer.
- `out_of_scope` is a *turn-level* verdict and `scopeDisclaimer` is *legal small print about the
  cited norms*. The boundary note is neither: it is a *qualifier about the question*, inside a
  turn that was answered. Three similar-sounding statements, three deliberately different
  renderings, and the separation is the design work of this spec.

## Dial Values

- **DESIGN_VARIANCE: 3** - Unchanged from v1 and v2, and now the constraint that does the work.
  The note must be structurally identical to the year notice it sits beside: one inset, one
  `h2` title at 15px/600 in `--ink-secondary`, one body paragraph at 14px/1.5, the same 3px
  `--accent` left rule, the same `--radius` and `--space-4` padding. Its distinctness comes from
  its title and its words, never from a new shape, a wider block, a coloured fill, an icon or an
  asymmetric position. At this variance, hierarchy is carried by weight and colour, not by
  novelty, and two qualifiers stacked inside one document must look like siblings.
- **MOTION_INTENSITY: 2** - Unchanged, and unchanged on purpose. The note arrives in the same
  commit as the answer it qualifies. It must not fade in separately, slide, pulse, or shimmer.
  Under a stream `replace` frame it participates in the existing 160ms cross-fade and nothing
  more. Explicitly rejected: a reveal for the new note, a brief highlight to draw the eye to
  "IBI", a warning pulse, and any entrance animation that would make a caveat the most dynamic
  thing on the screen.
- **VISUAL_DENSITY: 4** - Unchanged and defended, with one new ceiling. The region between the
  answer body and `Fuentes` can now hold two stacked `info` notices when a message both mentions
  IBI and names another year. Accepted: each block is a title plus one short paragraph (the note
  is two sentences, roughly four to five lines at 360px/14px), the `--space-5` gap between them is
  the existing one, and nothing in the answer body, the citation stack, or the disclaimers gets
  denser. The ceiling is explicit: **two** qualifier blocks is the maximum this slot may carry.
  A third deterministic notice in a later spec must collapse the qualifier stack into one block
  rather than add a third inset. That is a follow-up, not this spec.

## Design System / Foundation

Unchanged from v1 and v2. No official design system applies (GOV.UK and USWDS are jurisdictional;
Material, Fluent, Carbon, Primer and shadcn import a visual language this brief must not have).
The foundation stays:

- **CSS Modules plus CSS custom properties**, tokens via `var(--token)`, no inline `style` prop.
  No Tailwind, no component library.
- **No new component.** `Notice` already renders exactly the shape this note needs: `aside` plus
  optional `h2` title plus a `p` body, tone-selected. A `BoundaryNote` or `ScopeNote` component
  for one call site is a YAGNI violation and would duplicate the tone, radius and padding rules
  that are already locked. Extend the call sites, not the component set.
- **No new prop on `Notice`.** The abstention case is the only place a second body register would
  be tempting; it is solved by composing the two strings into the existing `body` (see Task 3),
  not by widening the component's API.
- **No new CSS.** Not one rule, not one class, not one media query. Everything the note needs is
  already in `Notice.module.css` and `AnswerBlock.module.css`. If the Coder believes a CSS change
  is required, the design has been bypassed and should be raised rather than patched.
- **No icon and no new dependency.** A warning triangle, an info glyph, a shield, a gavel or a
  stamp would each import an implication the product does not have: this is a scope limit, not an
  alert and not an authority.
- **Honesty note on the skill's scope.** The hero, bento, image, marquee, eyebrow and CTA rules in
  `design-taste-frontend` describe landing pages and do not transfer here. What transfers and is
  applied below: the copy self-audit, the em-dash ban, the shape and colour consistency locks, the
  contrast checks, the reduced-motion rule, and the empty/error-state discipline.

## Global Tokens

Locked, and this spec adds **nothing**:

- **Font:** `--font-sans` IBM Plex Sans (400 / 500 / 600), `--font-mono` IBM Plex Mono (400 / 500).
  Unchanged. Mono stays reserved for citation metadata and dates; the note is prose and is never
  set in mono.
- **Accent color:** `#1B5E4B` (verde archivo), single accent. Used identically here as the left
  rule of the note's `info` tone. No second accent, no new semantic colour.
- **Neutral base:** the existing cool graphite family (`--surface`, `--surface-sunken`,
  `--hairline`, `--ink`, `--ink-secondary`, `--ink-tertiary`). Unchanged.
- **Corner-radius system:** soft, one value, `--radius` (8px), inherited from `Notice`. No pills,
  no mixed scale.
- **Theme:** light, locked (`color-scheme: light`). Unchanged. The note uses tokens only, so a
  future dark theme needs no component edit. The skill's dark-mode-mandatory rule is deliberately
  not honoured here: the theme lock is a v1 decision, and changing it would put unaccounted
  behaviour in front of the traceability gate.
- **Icon library:** Phosphor. **No addition.**
- **Semantic colours:** `--warning` and `--error` remain reserved for the privacy warning and for
  transport / configuration failure. Neither may be used for the IBI note, for the abstention, or
  for a refusal.
- **Type registers used by the touched elements, and no others:** notice title
  `--font-size-h2` / `--line-h2` / `--weight-semibold` / `--ink-secondary`; notice body
  `--font-size-notice` / `--line-notice` / `--ink`; notice footer `--font-size-disclaimer` /
  `--line-metadata` / `--ink-secondary`; answer measure `--measure`; inset `--space-4` padding and
  `--radius` from `Notice`; block gap `--space-5` from `.answer`.
- **Copy rules for every string (none of them are new in this spec):** Spanish (Spain) only, no
  em-dash or en-dash, no figure of any kind, guillemets and inverted `¿` as typed, and every
  user-facing string lives in `src/content/strings.ts`. The two constants are pinned by
  `AC-003-05` and are **not** editable at this stage.

## Per-Task Directives

### Task 3: Render the note (answer block + abstention notice)

Two surfaces, one note. Everything below is DOM-level and checkable by reading the committed
component and by rendering it.

- **Layout:** Single-Column Reading Stream entry, unchanged family. The note is an inset qualifier
  inside the answer document, not a card, not a banner, not a new column. In the answer it takes
  the same slot as the year notice (between the prose body and the sources block); in the
  abstention it is appended inside the existing notice body. No new layout family is introduced
  and no existing block moves.

- **Components:** `Notice` for the answer, the existing `abstentionNotice` mapping for the
  abstention. The exact contract:

  ```
  AnswerBlock (kind: 'answer')
  article.answer                                   .answer gap: --space-5
    div.body [aria-live=polite, aria-atomic=false]
      section > h2 'En resumen'   > p.explanation
      section > h2 'La norma dice'> p.rule        (only when rule !== explanation)
      section > h2 'Ejemplo'      > p.workedExample (only when present)
    aside.notice.info                              <- NEW: boundary note
      h2.IBI_BOUNDARY_TITLE
      p.body response.boundaryNote
    aside.notice.info                              <- year notice, unchanged
      h2.YEAR_NOTICE_TITLE
      p.body response.yearNotice
    div.sources > section > h2 'Fuentes (N)' > ul > SourceEntry ...
    p.disclaimer response.disclaimer
    p.disclaimer response.scopeDisclaimer         (only when present)

  Notice for kind: 'insufficient_evidence'         (abstentionNotice, unchanged shape)
  aside.notice.info
    h2 INSUFFICIENT_TITLE
    p.body  response.explanation                  (see C6 for the composed case)
    a.action 'Hablar con un asesor'
    p.footer response.yearNotice                  (only when present)
  ```

  Contract the Coder must satisfy, item by item:

  - **C1.** `AnswerBlock` renders the boundary note only when `response.boundaryNote` is defined.
    When it is undefined the DOM is identical to today: no empty `aside`, no empty `p`, no
    placeholder.
  - **C2.** When defined, it is `<Notice tone="info" title={IBI_BOUNDARY_TITLE}
    body={response.boundaryNote} />` and carries no `items`, no `links`, no `action`, no `footer`.
  - **C3.** Position: after `<AnswerBody>`, **before** the year-notice `Notice`, and therefore
    before `<SourcesList>`. Rationale: the year notice's placement argument in spec 002 was
    adjacency to `Fuentes`, where the BOE "Actualizado" dates live; putting the new note between
    that notice and the sources would break it. The resulting reading order is a narrowing
    sequence, subject scope then temporal scope then evidence: what this answer does not cover,
    which corpus year the cited text belongs to, the cited text.
  - **C4.** The year notice keeps its own conditional `Notice` with the same tone, title, body and
    position relative to `Fuentes`. It is not merged into the new note, not reordered below it,
    and not hidden when both apply.
  - **C5.** When both apply (a message mentions IBI *and* names another year), both render as
    sibling `aside` elements in the order above. Neither is nested inside the other and neither
    absorbs the other's text.
  - **C6.** `abstentionNotice` sets `body` to `response.explanation` when `boundaryNote` is
    undefined, and to `` `${response.explanation}\n\n${response.boundaryNote}` `` when it is
    defined. Both strings are payload fields, so no copy is created here: this is a mapping, which
    is why it belongs in `use-chat-turn.ts` (the module that already maps payload to `NoticeProps`)
    and not in `strings.ts`, which owns copy, and not in the service, which keeps `boundaryNote` a
    separate field by `AC-003-09`.
  - **C7.** The abstention keeps `tone: 'info'`, `title: INSUFFICIENT_TITLE`, the handoff
    `action`, and `footer` = `yearNotice` when present. No `items`, no `links`.
  - **C8.** `abstentionNotice`'s `out_of_scope` branch is untouched. The note is kind-exclusive:
    it never appears on a refusal (`AC-003-09`), nor on `guide`, `clarification`,
    `privacy_warning` or `error`.
  - **C9.** No new component, no new `Notice` prop, no new CSS class or rule, no token change, no
    icon, no dependency.
  - **C10.** The title comes from `IBI_BOUNDARY_TITLE` imported from `@/content/strings`; the body
    comes from the payload field. No Spanish literal is written in a `.tsx`.
  - **C11.** The note never renders inside an `[aria-live]` subtree (see A11y).
  - **C12.** The note adds no anchor, no `href`, no citation, and no source metadata on either
    surface.

  **Why the note sits above the year notice, and not below it.** Recorded as a decision because
  the mirror order is defensible: the note is about the question, the year notice is about the
  corpus. Above wins for two reasons. It preserves 002's invariant that the year notice is the
  last block before the dates it explains. And it orders the two limits from the more specific to
  the more general: the subject this answer does not cover, then the year the covered text belongs
  to. Do not reorder without re-opening 002's adjacency argument.

  **Visual distinction from the out-of-scope refusal and from `scopeDisclaimer`.** Three
  statements that all say "not covered", rendered three different ways on purpose:

  | Surface | What it means | DOM | Register | Affordance |
  |---|---|---|---|---|
  | `out_of_scope` refusal | the whole turn is refused; the model is never called | its own `aside.info`, `OUT_OF_SCOPE_TITLE`, a complete turn entry | title 15px/600 + body 14px/1.5 | handoff link, last in the block |
  | boundary note in an answer | this answer is given; one mentioned tax is not covered here | its own `aside.info`, `IBI_BOUNDARY_TITLE` | title 15px/600 + body 14px/1.5 | none |
  | boundary note in an abstention | this turn could not be confirmed, and one mentioned tax was never in play | second paragraph of the same `p.body`, no title | body 14px/1.5 | none; the block's own handoff remains, still last |
  | `scopeDisclaimer` | legal small print: the answer leans on a non-IRPF norm | `p.disclaimer`, 12.5px `--ink-secondary`, below `Fuentes` | small print | none |

  Rules the Coder must not blur: the note never carries an action, a link, an icon or a citation;
  it never reuses `OUT_OF_SCOPE_TITLE` (that title means the turn was refused, so reusing it on an
  answered turn is a lie); it is never merged with `scopeDisclaimer` or into `explanation` (three
  different derivations: the guard, the message, the cited norms); and `scopeDisclaimer` stays a
  plain paragraph below `Fuentes`, never promoted to a `Notice` "to match".

  **Why the abstention note has no title.** `Notice` renders one `h2`, and that slot is taken by
  `INSUFFICIENT_TITLE`, which is the truthful name of the block. A second `h2` inside one `aside`
  would read as two blocks and would compete with the block's own verdict. The separation inside
  `p.body` is the blank line from `\n\n`: `.body` is `white-space: pre-line`, so the two
  statements keep a paragraph break without a new node, a new prop, or a separator glyph. The note
  also stays in `body` rather than in `footer` because `footer` is the year-caveat slot at
  12.5px, and a scope statement belongs in the 14px reading register, not in metadata.

- **Typography:** notice title `--font-size-h2` / `--line-h2` / `--weight-semibold` /
  `--ink-secondary`; body `--font-size-notice` / `--line-notice` / `--ink`; footer, where the year
  caveat still lives, `--font-size-disclaimer` / `--line-metadata`. Unchanged from the components
  that already exist, and the reason no CSS is needed. Do not promote the note to
  `--font-size-body` to give it weight: it would then compete with the answer prose it qualifies.
  Do not centre it, do not set it in mono, do not italicise it. The title is sentence case, as
  every heading in this product is.

- **Motion:** none. The note commits with the answer, inherits the `--space-5` gap, and appears in
  the DOM in the same React commit as the prose. On a stream `replace` frame it participates in
  the existing 160ms opacity cross-fade already declared on `.notice`. No reveal, no stagger, no
  scroll-triggered anything, no state that needs `prefers-reduced-motion` handling beyond the
  `transition` that `Notice.module.css` already gates.

- **A11y:**
  - Heading level: `Notice` renders its title as `<h2>`. The answer therefore gains one more `h2`,
    flat with `En resumen`, `La norma dice`, `Ejemplo` and `Fuentes`. Nothing may be rendered as
    `h3` or `h1` (an existing test iterates every heading and requires `H2`).
  - The note is a sibling of `.body`, never inside it. `.body` is the answer's
    `aria-live="polite"` region; putting the note there would re-read it on every streamed frame
    and would put a scope caveat inside the region that the sources block is deliberately kept
    out of.
  - No `role="alert"`, no `aria-live` on the note itself, no focus management. This is not an
    emergency and it must not steal focus from the composer.
  - Announcement: `applyOutcome` sets the screen-reader announcement from the notice `title`, so
    an abstention is announced by `INSUFFICIENT_TITLE`. Do not switch that to the composed `body`,
    which would read the abstention and the note in one breath.
  - Contrast: the note uses the existing pair already in production (`--ink` 14px on
    `--surface-sunken`, `--ink-secondary` 15px title). No new pair is introduced, so no new
    contrast risk; verify empirically rather than by eye if the palette changes.
  - Reading order equals DOM order, and the note precedes `Fuentes`, so a screen-reader user hears
    the limit before the evidence, which is the point.
  - Tap targets and focus rings are untouched: the note adds no interactive element.

- **Responsive:** 360px first, single column, no breakpoint. The note inherits
  `max-width: var(--measure)` from `.answer` and `max-width: 100%` from `Notice`; it must not
  declare a width, a min-width, or an `overflow-x`. The two-sentence note wraps to roughly four to
  five lines at 14px/1.5 on a 360px viewport, inside the same inset padding as the year notice.
  When both notices apply, the stack is at most two blocks of title plus one paragraph; the
  `--space-5` gap between them is the existing one, so no per-block margin may be added to
  compensate. The abstention composition adds two lines to an existing paragraph and must not
  introduce a horizontal scrollbar or a wrapped link label. No `em`-based fixed width, no
  `overflow-x: hidden`.

- **Anti-patterns to avoid (specific to this task):**
  - A hand-built second notice (a `BoundaryNote` component, a bespoke `div` with a left border).
  - `warning` or `error` tone, amber or brick red, a warning triangle, an "!", a shake, a badge.
    The IBI gap is a scope fact, not a fault and not a risk.
  - A dismissible ("x"), collapsible, or `details`-wrapped note; an accordion; a "más información"
    toggle. A limit you can hide is a limit you did not state.
  - Mounting the note in the sticky composer dock as a global banner: it is a turn-level fact, not
    a session-level one.
  - Putting the note inside `.body` (the live region) or inside `SourcesList`.
  - A "Ver el IBI en el BOE" link or any invented destination. The corpus has no IBI passage, so a
    link here would be the UI-side twin of an invented citation.
  - Paraphrasing the constant inside the component, or "improving" it: the text is pinned by
    `AC-003-05`, and paraphrasing it is the one way this feature can silently stop being
    deterministic.
  - Reusing `OUT_OF_SCOPE_TITLE`, or any refusal wording, for the note.
  - Folding the note into `scopeDisclaimer`, into `explanation`, or into the AI disclosure.
  - A numbered `items` list for the note. Numbering means procedure in this product (the guide's
    steps), and a one-item list would claim an order that does not exist.
  - Adding a second disclosure paragraph to the abstention: the header already carries
    `AI_DISCLOSURE`, and the `footer` slot belongs to the year notice.
  - An em-dash in any string, including any future edit of these two. Neither pinned constant has
    one; keep it that way.
  - Any CSS change at all.

- **Watch items (Coder must check):**
  1. **The `AC-003-11` matcher.** The note shares `p.body` with the abstention explanation, so an
     exact `getByText(IBI_BOUNDARY_NOTE)` fails: React Testing Library matches the whole
     normalized text of an element. Assert the rendered output with a regex or a `textContent`
     predicate, and keep the assertion on the rendered `Notice`, not only on `NoticeProps`.
  2. **Conditional composition.** When `boundaryNote` is undefined, `body` must be exactly
     `response.explanation`: no trailing `\n\n`, no `'undefined'` in the string, no empty second
     paragraph. An unconditional template that ships either of those is the failure this task
     exists to avoid.
  3. **Heading levels.** Every heading in the tree must remain `H2`; an existing test iterates
     `h1, h2, h3` and requires `H2` on each.
  4. **No literals.** `IBI_BOUNDARY_TITLE` is imported from `@/content/strings`; no Spanish copy
     appears inline in `AnswerBlock.tsx` or `use-chat-turn.ts`.
  5. **Positional assertion.** `Fuentes` must still come after both notices; an existing test
     compares document position of the year notice against the `Fuentes` heading, and the new note
     must not disturb that relation.
  6. **Both visible together.** Add a fixture carrying `boundaryNote` and `yearNotice` and assert
     two distinct notices, in the order C3 and C5 state. Neither may replace, hide or absorb the
     other.
  7. **No `Fuentes` block on an abstention**, so the note there can never be read as
     citation-bearing. That existing assertion must keep passing.
  8. **Not in a live region.** Assert that no `[aria-live]` subtree contains the note text: a
     screen reader would otherwise hear the caveat twice, once via the announcement title and once
     via the region.
  9. **The paragraph break renders.** Confirm at 360px that the `\n\n` inside `p.body` reads as a
     paragraph break under `white-space: pre-line`. If a browser collapses it, accept the single
     break: do not add markup, a separator glyph, or a CSS rule to force it.
  10. **The `out_of_scope` branch is untouched.** No `footer`, no `items`, no `links`, and no note;
     an existing exact-shape assertion on that notice must keep passing.
  11. **Copy flag, recorded not fixed.** `IBI_BOUNDARY_NOTE` says "el corpus", and the rest of the
     UI never shows that word to a user (existing copy says "el texto del BOE"). It is a small
     jargon leak in an otherwise plain-language voice. The string is pinned by `AC-003-05`, so the
     Coder must ship it verbatim and the change, if wanted, goes back through the spec rather than
     through this task.

## Out-of-scope tasks

- **Task 1: refine the `ibi` classifier.** Backend only. It changes which turns reach the model,
  not what any component renders; the only UI consequence is that a sentence like the verbatim ask
  now produces an answer instead of a refusal, and that consequence is designed above.
- **Task 2: deterministic boundary note (constant, response field, derivation).** Backend and copy.
  Its only design-bearing output is the two pinned strings. One observation worth recording: the
  title `Sobre el IBI de tu pregunta` puts the note in the same "Sobre ..." family as
  `Sobre el año de la pregunta`, which is why it reads as a qualifier rather than as a warning.
  That family consistency is a happy consequence of the wording, not a licence to edit it.
- **Explicit non-goals for this UI change:**
  - No change to the refusal (`out_of_scope`) rendering, copy, tone, title or affordances.
  - No change to `scopeDisclaimer`, to the AI disclosure, to the sources block, to the citation
    entry, to the header, to the composer, to the empty state, or to the dock.
  - No change to `Notice`, to `AnswerSection`, to `SourcesList`, to `SourceEntry`, to `Thread`, or
    to any `.module.css`.
  - No new component, no new `Notice` prop, no new token, no new icon, no new dependency, no new
    response `kind`.
  - No dark theme, no theme toggle, no responsive breakpoint, no animation.
  - No new notice anywhere else in the product: this spec adds exactly one qualifier block, in one
    place, and one appended statement, in one place.
