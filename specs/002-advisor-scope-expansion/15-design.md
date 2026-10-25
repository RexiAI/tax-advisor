# Design Spec: advisor-scope-expansion

Mixed surface. Only the tasks that change what the screen renders are in scope here: **Task 3**
(which refusals still exist), **Task 4** (the `Notice` contract change, `out_of_scope` and
`insufficient_evidence` rendering), **Task 5** (which questions stop rendering as a canned guide)
and **Task 6** (`yearNotice` placement, and no figure invented in UI copy). Tasks 1, 2, 7 and 8 are
backend, corpus or docs and are listed under Out-of-scope tasks.

This is not a redesign. `10-tasks.md` explicitly defers UI work to this stage, so the design
surface is the minimum set of rendering consequences the new contract forces, plus the copy
corrections the widened scope forces with it. Nothing in v1's visual system is re-opened.

Two human-gate resolutions land here as appended sections: **OQ-3** (reinforced disclaimer) and
**OQ-4** (procedural IRPF guides stay). The OQ-3 section carries a post-build adjudication that
supersedes its own pre-gate draft, because the gate chose a payload field and the build ended up
carrying both mechanisms at once. Both sections are rendering decisions inside the existing visual
system, not changes to it.

## Design Read

Reading this as: a scope extension of a single-screen consumer tax explainer for residents and
autónomos in Spain, keeping v1's calm documentary / institutional language (paper and ink, one
archive-green accent, mono citation metadata), leaning toward the existing hand-rolled CSS Modules
token layer with near-zero motion, because this spec changes what the product is willing to answer,
not how it looks.

Why the design work must stay this small:

- The screen already carries the product's differentiator (sources always visible, honest
  abstention). The failure this spec fixes is a **content and contract** failure: a refusal made of
  a hardcoded procedure, and three topics refused that should have been answered. Restyling the
  screen would hide the real change instead of explaining it.
- The v1 design deliberately refused chatbot conventions (bubbles, avatars, typing dots). Nothing
  in the widened scope argues for them; a tax question about IVA is still a document request, not a
  chat with a persona.
- `insufficient_evidence` moves from edge case to a **common path** (the corpus is 2025 and a
  question about a specific quarter or amount may simply not be covered). A state that readers meet
  often must be designed as a normal outcome, not as an error.

## Dial Values

- **DESIGN_VARIANCE: 3** - Unchanged from v1, and now load-bearing for a new reason: the refusal
  loses its numbered list and its link row, so the one place with visible internal structure
  disappears from the most frequent non-answer state. The abstention states must stay structurally
  identical to each other (one block, one title, one paragraph, one affordance) so that a shorter
  block reads as a narrower product, not as a broken layout. Do not compensate for the missing list
  with new decoration, a bigger title, or a wider block.
- **MOTION_INTENSITY: 2** - Unchanged. This spec adds no animation. The only new frequency is
  `insufficient_evidence` arriving as a thread entry, which already inherits v1's 120ms opacity +
  4px state-change transition and the 160ms cross-fade on a stream `replace` frame. Explicitly
  rejected: animating the year notice into view, a shimmer on the sources block while more norms
  are searched, and any accordion.
- **VISUAL_DENSITY: 4** - Unchanged and explicitly defended. The corpus goes from 2 to 8 norms, so
  the same question now retrieves more passages, and norm titles get much longer (the LGSS title is
  roughly twice the length of the LIRPF one). The answer to that is not a denser citation entry or
  a collapsed list: the citation stays a three-register stack (article label / norm / link + date),
  the sources list stays fully visible, and the block keeps `--space-4` gaps. Density rises only
  where it means evidence. The answer footer gains at most one line, the conditional scope line, and
  it stays inside the existing 12.5px small-print register rather than opening a new density tier.

## Design System / Foundation

Unchanged from v1. No official design system applies (GOV.UK and USWDS are jurisdictional, and
Material / Fluent / Carbon / Primer import a visual language this brief must not have). The
foundation stays:

- **CSS Modules plus CSS custom properties.** Required by
  `.standards/docs/CODING_CONVENTIONS.md` (one component per directory, `Component.module.css`,
  `var(--token)`, no inline `style` prop). No Tailwind, no shadcn, no component library.
- **Icons: `@phosphor-icons/react`, imported per icon.** V1 ships `ArrowSquareOut`, `ArrowUp`. This
  spec adds **no icon**. A warning triangle, a broom, a shield, a gavel or a "handshake for the
  advisor" would each import an implication the product does not have.
- **No new component.** `Notice` already covers all four non-answer shapes (refusal, abstention,
  guide, privacy/error) through `tone` + optional `title` / `items` / `links` / `action` / `footer`.
  Adding `AbstentionBlock` or `ScopeNotice` for one call site is a YAGNI violation and would
  duplicate the tone and radius rules. Extend the call sites, not the component set.
- **No new dependency.** No animation library, no icon set, no headless UI package.

Honesty note on the skill's scope: the hero, bento, image-asset, marquee, eyebrow and CTA-density
rules in `design-taste-frontend` describe landing pages and do not transfer to this surface. What
transfers, and is applied below: the copy self-audit, the em-dash ban, the shape and colour
consistency locks, the interactive-state requirements, the contrast checks, and the reduced-motion
rule.

## Global Tokens

Locked. This spec adds **one** token and nothing else:

- **Font:** `--font-sans` IBM Plex Sans (400 / 500 / 600), `--font-mono` IBM Plex Mono (400 / 500).
  Unchanged. Mono stays reserved for citation metadata and dates.
- **Accent color:** `#1B5E4B` (verde archivo), single accent, used identically for links, the focus
  ring, the primary button and the left rule on an `info` Notice. No second accent, no new semantic
  colour. `--error` and `--warning` remain reserved for transport/configuration failure and the
  privacy warning. **Never** for `out_of_scope` or `insufficient_evidence`.
- **Neutral base:** the existing cool graphite family (`--surface`, `--surface-raised`,
  `--surface-sunken`, `--hairline`, `--ink`, `--ink-secondary`, `--ink-tertiary`). Unchanged.
- **Corner-radius system:** soft, one value, `--radius` (8px), everywhere. No pills, no mixed scale.
- **Theme:** light, locked (`color-scheme: light` in `tokens.css`). Unchanged. A dark theme remains
  a token-file change plus a `prefers-color-scheme` block, not a per-component concern.
- **Icon library:** Phosphor (see Foundation). No additions.
- **New token (the only one):** `--sr-only-size: 1px` in `src/styles/tokens.css`, used only by the
  visually hidden announcement region (§ Task 4, A11y). It exists so the hidden-region CSS does not
  introduce a bare `1px` in a module, which
  `.standards/docs/CODING_CONVENTIONS.md` §CSS flags as a review finding.
- **Type registers used by the touched elements, and no others:** Notice title `--font-size-h2` /
  `--line-h2` / `--weight-semibold` / `--ink-secondary`; Notice body `--font-size-notice` /
  `--line-notice`; Notice footer `--font-size-disclaimer` / `--line-metadata`; answer body
  `--font-size-body` / `--line-body`; measure `--measure`.
- **Copy rules for every new string:** Spanish (Spain) only, no em-dash or en-dash, no figure of any
  kind (no amount, no percentage, no rate, no deadline count), guillemets `«»` and inverted `¿` as
  typed (never HTML entities), and every string lives in `src/content/strings.ts`. A Spanish
  literal in a `.tsx` file fails `AC-001-81`.

## Per-Task Directives

### Task 3: Recortar el guard de alcance

The guard change is backend, but it changes which refusals the screen can produce and what their
copy may claim, which is a rendering concern.

- **Layout:** unchanged. A remaining refusal (`filing_request`, `itp`, `isd`, `ibi`,
  `non_residents`, `company_tax`) still renders as one `info` Notice appended to the thread, in the
  conversation, not in the composer dock. It stays a durable turn: after the refusal the user can
  ask again immediately and the refusal remains readable above the new question.
- **Components:** `Notice` with `tone: 'info'`, `title: OUT_OF_SCOPE_TITLE`, `body: explanation`,
  `action: { href: handoffUrl, label: HANDOFF_LABEL }`. Nothing else (§ Task 4 for the exact shape).
- **Typography:** unchanged (title 15px/600 `--ink-secondary`, body 14px/1.5 `--ink`). The body is
  now three sentences instead of a paragraph plus six steps, so it must not be promoted to
  `--font-size-body` to fill the space.
- **Motion:** none beyond v1's state-change fade.
- **Copy correction (settled at the human gate; two templates in `src/content/strings.ts`).** Today
  the refusal body says `... aquí solo explico el IRPF`. After this spec that sentence is false, and
  it is the same self-contradiction the informal spec complains about. Replace the inline template in
  `scopeResponse` with two constants:

  ```
  OUT_OF_SCOPE_EXPLANATION =
    'Las preguntas sobre {topic} quedan fuera de mi alcance: la administración competente es {body}. Lo que sí cubro, con la norma del BOE citada, es el IRPF, el IVA y el ciclo fiscal del autónomo.'

  FILING_REQUEST_EXPLANATION =
    'No presento declaraciones ni tramito modelos en tu nombre. Para presentar, la administración competente es {body}. Lo que sí hago es explicarte la norma en la que se basa el trámite, con la cita del BOE.'
  ```

  `scopeResponse` selects `FILING_REQUEST_EXPLANATION` when `reasonCode === 'filing_request'` and
  `OUT_OF_SCOPE_EXPLANATION` otherwise, substituting with the existing `.replace('{x}', ...)` pattern
  already used by `PRIVACY_WARNING_MESSAGE` and `RETRY_AFTER_LABEL`. Two branches, no new nesting.
  The second clause of each template is the answer to "does it show what IS in scope": it lands
  inside the payload's existing `explanation` field, so it costs zero new payload fields and cannot
  break `AC-002-14`. This also fixes the mixed-message case from `AC-002-11`
  (`filing_request` wins a message that mentions IVA): the filing template never names the topic, so
  a refusal triggered by the ordered-first match cannot read as if the user had asked about IVA.
- **A11y:** unchanged. The refusal is an `<aside>` with an `<h2>`; it must not become an `<h1>`, an
  `<h3>`, or a `role="alert"` (an alert role interrupts; a refusal is not an emergency).
- **Anti-patterns to avoid (specific):** do not render the official body as a link or invent a URL
  for it (v1 rule: the UI never invents a destination); do not add a second action next to the
  handoff; do not append example questions as `items` to recover from the refusal (that is exactly
  the `items` field this task deletes, and `AC-002-14` asserts its absence); do not use red or amber;
  do not write "no puedo ayudarte" (the product can still help, with a different question).
- **Watch items (Coder must check):** the two templates must not contain `€`, `%`, or any digit;
  confirm `officialBody` values read grammatically in both templates (`la autoridad tributaria de tu
  comunidad autónoma` and `Agencia Tributaria` both do); confirm no test asserts the old
  `aquí solo explico el IRPF` sentence (none does today); **artifact sync:** the gate accepted this
  copy, but the acceptance set in this folder as of this revision
  (`20-acceptance/AC-002-*.md`, AC-002-01 to AC-002-25) does not cite it yet. When the updated
  scenario lands, cite its ID here. The templates are binding either way.

### Task 4: Eliminar la plantilla fija y el cambio de contrato

This is the task with real rendering surface. Everything below is DOM-level.

#### Response kind to rendering map (the whole state machine, unchanged except where marked)

| `kind` | Where it renders | DOM shape |
|---|---|---|
| `answer` | thread entry | `article` > body region (`h2 En resumen`, `h2 La norma dice`, optional `h2 Ejemplo`) > **year notice (moved, Task 6)** > `Fuentes` block > disclaimer > **scope line, only when a non-IRPF norm was cited (§ Adjudication, OQ-3)** |
| `insufficient_evidence` | thread entry | `aside.info` > `h2` **`INSUFFICIENT_TITLE` (new)** > `p.body` (carries the strengthened `INSUFFICIENT_BOUNDARY`, § OQ-3) > `a` handoff > `p.footer` **`yearNotice` (new, today dropped)** |
| `out_of_scope` | thread entry | `aside.info` > `h2 OUT_OF_SCOPE_TITLE` > `p.body` > `a` handoff. **No `ol`, no link list, no footer** |
| `guide` | thread entry | `aside.info` > `h2` payload `title` > `p.body` > `ol` steps > `ul` links > `p.footer` **`disclaimer` (new)** |
| `clarification` | dock, above composer | unchanged |
| `privacy_warning`, `error` | dock, above composer | unchanged |

#### The refusal (`out_of_scope`)

- **Layout family:** Single-Column Reading Stream entry (unchanged family). The block is now three
  lines of text and one link. It is not a card, has no shadow, and sits directly on `--surface`
  with `--space-4` padding and `--radius`, exactly as v1's `info` Notice.
- **Component:** `abstentionNotice` in `use-chat-turn.ts` returns **exactly**:

  ```ts
  { tone: 'info', title: OUT_OF_SCOPE_TITLE, body: response.explanation,
    action: { href: response.handoffUrl, label: HANDOFF_LABEL } }
  ```

  No `items`, no `links`, no `footer`. The `steps`/`links` spreads are deleted, not left unused,
  because the fields no longer exist on `OutOfScopeResponse`. `Notice` keeps `items` and `links`
  props: the `guide` branch still uses them.
- **How the refusal avoids reading like a dead end, given it carries no procedure.** Four
  deliberate levers, none of which adds a payload field:
  1. The body names the competent body and then states what the product **does** cover (Task 3
     copy). The last thing the user reads is a scope statement, not a wall.
  2. The refusal is a thread entry above a sticky composer that never goes away, so the next
     question is one keystroke away and the refusal does not erase the conversation.
  3. The only affordance is a real one: the handoff `mailto:` link. One action, clearly the exit.
  4. The composer placeholder is always visible and now names the covered subjects (below), so the
     boundary is learnable before the first refusal rather than only after it.
- **Typography:** title `--font-size-h2` / `--weight-semibold` / `--ink-secondary`; body
  `--font-size-notice` / `--line-notice`; action `--font-size-notice` / `--weight-medium` /
  `--accent` with `min-height: var(--tap-target)`. Unchanged; do not scale the body up to fill the
  space the steps used to occupy.
- **Motion:** none added.
- **A11y:** the `<aside>` stays outside any live region; the announcement for screen readers is
  handled by the persistent region described below. The handoff anchor keeps
  `:focus-visible` (`Notice.module.css` already defines it).

#### The abstention (`insufficient_evidence`), now a common path

Design it as an ordinary outcome, not a failure:

- **Tone and materiality:** `info`. `--surface-sunken` plus the 3px `--accent` left rule. No icon,
  no red, no amber, no "!", no shake.
- **Title (new constant):** `INSUFFICIENT_TITLE = 'No puedo confirmarlo con el BOE'`. Rationale:
  today the block arrives as a bare paragraph plus a link, which reads as a shrug precisely because
  it has no name. A title that names the limit ("I cannot confirm it") is more trustworthy than a
  paragraph that trails off, and it is the same sentence the product would say out loud. It also
  stops the abstention from being visually indistinguishable from a `guide`, which now carries steps
  and links.
  The title is truth-preserving for every `InsufficientReason`, including `corpus_unavailable`.
- **Body:** `response.explanation` verbatim. It already ends with `INSUFFICIENT_BOUNDARY`, and OQ-3
  strengthens that constant rather than adding a second line in the component
  (see § Reinforced disclaimer), so the boundary is not duplicated in the UI. Do **not** split the
  explanation into paragraphs in the component: that would require a payload field this spec does
  not add.
- **Action:** the handoff anchor, unchanged (`HANDOFF_LABEL`, `HANDOFF_URL`).
- **Footer (bug fix, required by Task 6):** when `yearNotice` is present it renders as
  `footer`. Today `InsufficientEvidenceResponse.yearNotice` exists and the UI silently drops it, so
  a user asking about 2024 gets an abstention with no explanation of the corpus year. Use the same
  conditional-spread pattern already used for `out_of_scope`.
- **Typography:** footer renders at `--font-size-disclaimer` / `--ink-secondary` (existing
  `.footer` rule). The caveat is metadata; it must not compete with the abstention body.
- **Anti-patterns to avoid (specific):** a "¿Quieres intentarlo otra vez?" retry button (there is
  nothing to retry, the corpus is what it is); a list of "temas relacionados" invented in the UI;
  red or a warning icon; placing the abstention in the sticky dock (it is a turn, it belongs in the
  thread); repeating the disclaimer twice in one block.

#### The guide (`guide`), after Task 5 narrows it

- Shape unchanged: `title` (`h2`), `body`, `<ol>` steps with visible decimal numbering, `<ul>` of
  links. Numbering is the one place in this product where ordered numbers carry meaning (a
  procedure), so `list-style: decimal` stays.
- **One addition:** `footer: response.disclaimer`. A canned procedure is advisory content and must
  carry the AI disclosure in its own block, not rely on a header the user may have scrolled past.
  `GuideResponse.disclaimer` already exists; this is one prop at the call site. With OQ-3 resolved,
  the footer value is `GUIDE_FOOTER` (disclosure plus boundary in one paragraph), not the bare
  disclosure: see § Reinforced disclaimer (OQ-3).
- **External links (settled at the human gate).** The `links` branch of `Notice` renders
  `<a className={styles.action} href={link.href}>` with no `target` and no `rel`, so an AEAT page
  replaces the conversation. Add `target="_blank" rel="noopener noreferrer"` to the `links` anchors
  only, matching `SourceEntry`. The `action` anchor does not get them: the handoff is a `mailto:`
  and a new tab there is pointless. Nothing else in the `links` markup changes (no icon, no
  per-link description), and the guide's visible link text stays a description, never the URL.
- **Distinction rule the Coder must not blur:** a *guide* informs a procedure and offers official
  links, and is not a refusal. A *refusal* names a boundary and offers a human. Both use `info`, so
  the only signals separating them are the title and the trailing affordance. Do not add steps to a
  refusal, and do not add a handoff to a guide.

#### Copy changes that carry the widened scope (4 constants, no new surface)

`src/content/strings.ts` only. No component markup changes for these.

- `COMPOSER_PLACEHOLDER`: `'Pregunta sobre el IRPF'` becomes **`'Pregunta sobre IRPF, IVA o
  autónomos'`**. This is the permanent, always-visible statement of what the product covers, at the
  exact point where a question is typed. It is why no new header line is needed.
- `EMPTY_STATE_HEADING`: `'¿Qué quieres saber sobre tu IRPF?'` becomes **`'¿Qué quieres saber sobre
  tus impuestos?'`**.
- `EMPTY_STATE_EXAMPLES`: keep exactly three questions (the empty state is a vertical stack, not a
  card grid; three cells, no empty cell), spread across the widened scope so the first screen no
  longer advertises IRPF only:
  ```
  '¿Qué pasos tiene el alta de autónomo?'
  '¿Cuándo empiezo a presentar el IVA?'
  '¿Puedo deducirme el alquiler de mi vivienda habitual?'
  ```
  They are `<button type="button">` items that fill the composer and do not submit (unchanged
  behaviour), and each must stay short enough to wrap to at most two lines at 360px.
- `COMPOSER_LABEL` stays `'Escribe tu pregunta'`: `test/acceptance/AC-001-chat-ui.test.ts` selects
  the textarea by that accessible name.

#### A11y: announcing the common non-answer states

Today only the answer body and the streaming text sit in live regions, so an `insufficient_evidence`
or `out_of_scope` turn is appended silently: a screen-reader user asks, hears nothing, and cannot
tell the difference between "refused", "abstained" and "still loading". With abstention now a common
path, that is the most important a11y gap this spec creates.

The fix reuses the pattern the screen already relies on (a live region that exists **before** the
content arrives, because a region created together with its content is not announced):

- `ChatScreen.tsx`: add one persistent sibling of the existing `.liveRegion`:
  ```tsx
  <div className={styles.announcer} aria-live="polite" aria-atomic="true">
    {turn.announcement}
  </div>
  ```
  Always rendered, even when empty. It carries text only, never the Notice subtree, so the block is
  not read twice.
- `use-chat-turn.ts`: add `announcement: string` to `ChatTurn`, default `''`. In `applyOutcome`,
  when a thread `noticeEntry` is appended, set `announcement` to the notice's `title` when it has
  one, otherwise its `body`; reset it to `''` at the start of `handleSubmit`. With the directives
  above, all three thread-notice branches now have a title, so the announcement is one short
  sentence.
- `ChatScreen.module.css`: add the hidden class using the new token, no bare `1px`:
  ```css
  .announcer {
    position: absolute;
    width: var(--sr-only-size);
    height: var(--sr-only-size);
    margin: calc(var(--sr-only-size) * -1);
    padding: 0;
    border: 0;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }
  ```
- Keep the existing streaming region and the answer body region exactly as they are. This adds one
  region; it does not replace them.
- Focus behaviour is unchanged: the composer never autofocuses on load, and a refusal must not
  steal focus (moving focus away from the textarea on a refusal would punish the user for asking).

- **Anti-patterns to avoid (specific to this task):** an `aria-live="assertive"` region; rendering
  the whole Notice inside the announcer (double reading); putting the announcement into the streaming
  region so it becomes visible text; `display: none` for the hidden region (unhidden content is
  unannounced); inline `style={{...}}` anywhere; a new `AbstentionBlock` component.
- **Watch items (Coder must check):** `AC-002-14` is an exact-shape assertion, so any extra prop on
  the `out_of_scope` notice (`footer` included) fails it; `test/acceptance/AC-001-chat-ui.test.ts`
  builds an `out_of_scope` fixture with `reasonCode: 'iva'`, which after Task 3 no longer type-checks
  (change the fixture to `'ibi'`, keep the test's AC-001-79 ID and its assertions); confirm no
  `Fuentes` heading renders for a refusal or an abstention; confirm the refusal's only `a` is the
  handoff; confirm every heading the Notice renders is an `h2` (`AC-001-80` asserts no `h3`);
  confirm the new `.announcer` does not trip the 360px width audit (its width is a `var()`, not a px
  literal) and that it needs no `:focus-visible` rule (not interactive); confirm the placeholder and
  empty-state strings do not appear as literals in any `.tsx`.

### Task 5: Quitar la interceptación de guías

- **Layout:** nothing new is laid out. The questions that stop being guides (IVA, cuota/RETA,
  factura + IVA, 303, 390, 036, "qué modelos presenta un autónomo") now arrive as a normal
  `AnswerBlock` with a `Fuentes` block, or as an abstention notice. Both renderings already exist.
- **Components:** unchanged set. The `guide` branch of `abstentionNotice` survives only for the
  preserved guides (ITP, ISD, no residentes, Sociedades, foral, and the procedural IRPF guides the
  gate keeps per OQ-4). Do not delete the branch, and do not collapse `guide` into `answer` or into
  `out_of_scope`.
- **Consistency check that matters visually:** a canned guide and a grounded answer must not look
  interchangeable. A guide has no `Fuentes` block and no per-citation metadata; an answer always
  does. Keep the sources block as the visible mark of "this is backed by a retrieved norm".
- **Typography and motion:** unchanged.
- **A11y:** the guide's `<ol>` must keep real `<li>` elements (numbering announced by the screen
  reader, not by CSS-generated text), and its external AEAT links keep visible text that is not the
  raw URL.
- **Anti-patterns to avoid (specific):** do not turn the guides being removed into regex fallbacks
  or "if the corpus misses, show the old guide" behaviour in the UI (that reinstates the canned
  procedure Task 4 deletes); do not render a partial `Fuentes` block for a guide.
- **Watch items (Coder must check):** confirm nothing in `src/components/` imports a removed guide
  constant; confirm the `guide` footer addition (§ Task 4) does not break
  `AC-001-75` (it asserts the disclosure appears at least twice after an *answer*, and no guide is
  rendered in that test); **artifact sync:** the `target` / `rel` decision above is accepted at the
  gate but not yet cited in `20-acceptance/AC-002-*.md` as of this revision; cite the scenario ID
  here when it lands. Confirm the anchors are safe before shipping either way.

### Task 6: Prohibir cuantías hardcodeadas y aplicar el aviso de año

`yearNotice` will now fire for IVA, RETA and censal questions whenever the message names a year
other than 2025, so its placement and its wording stop being cosmetic.

- **Placement (decision):** inside `AnswerBlock`, **after** the answer body and **before**
  `<SourcesList>`. New DOM order:
  ```
  article.answer
    div.body [aria-live=polite, aria-atomic=false]   <- En resumen / La norma dice / Ejemplo
    aside.notice.info                                 <- year notice, title + body
    SourcesList (div.sources > h2 Fuentes (N) > ul > SourceEntry...)
    p.disclaimer
  ```
  Reasoning, in order of weight:
  1. The answer leads. With the notice at the top, the first thing every year-qualified question
     shows is a grey caveat, so the product hedges before it says anything. Now that three more
     subject areas trigger it, that would become the first impression of whole categories, not of an
     edge case.
  2. Adjacency to the evidence is semantically correct: the notice says which **corpus year** the
     cited text belongs to, and `Fuentes` is where the BOE "Actualizado" dates live. The caveat and
     the proof belong next to each other.
  3. `AC-001-79`'s positional assertion (the notice precedes the `Fuentes` heading) still holds.
- **Title (new constant):** `YEAR_NOTICE_TITLE = 'Sobre el año de la pregunta'`. Without a title,
  an untitled grey block sitting between the answer and the sources reads as part of the answer. An
  `h2` at `--font-size-h2` / `--ink-secondary` marks it as a qualification of the answer without
  inventing a second visual register.
- **Copy correction (required, becomes visible at new frequency).** Today's string ends
  `... la norma puede haber cambiado para el año 2024 por el que preguntas.` That is false whenever
  the year is incidental, for example "me di de alta en 2019" or "cobro 25.000 € desde 2021", both
  of which now trigger the notice for IVA/RETA/censal questions. Replace the template in
  `src/content/strings.ts`:
  ```
  YEAR_NOTICE_BODY =
    'El texto del BOE que cito corresponde al año {corpusYear}. Si tu caso se rige por {askedYear}, la norma puede haber cambiado y el criterio no tiene por qué ser el mismo.'
  ```
  `yearNoticeFor` keeps its signature and its year-detection logic and only interpolates the two
  years into this constant. `AC-002-21` (notice contains 2025 and the asked year) and
  `AC-001-51`'s regex `/puede haber cambiado/i` both still pass.
- **`insufficient_evidence`:** the same `yearNotice` field must reach the notice `footer` (§ Task 4).
  Do not render a year notice on a `guide`, a `clarification`, a `privacy_warning` or an `error`:
  those payloads have no such field, and inventing one would be unaccounted behaviour.
- **Typography:** notice body `--font-size-notice` / `--line-notice` on `--surface-sunken`; footer
  variant (in the abstention) `--font-size-disclaimer`. One caveat per answer, never two notices: if
  a year notice and an abstention year notice would both apply, only the one belonging to the
  rendered response exists in the tree, because the two response kinds are exclusive. The scope line
  (§ Adjudication, OQ-3) is a plain paragraph below the sources block, not a `Notice`, so it never
  competes with this block for the same visual slot. Do not promote it to a `Notice` "to match".
- **Motion:** none. The notice arrives as part of the answer's single commit; it must not slide,
  fade separately, or pulse. Under a stream `replace` frame it participates in the existing 160ms
  cross-fade and nothing more.
- **A11y:** the notice stays **outside** the answer's live region, so it is not re-read on every
  streamed frame; its position immediately after the body puts it next in reading order for a
  screen-reader user moving through the article. Do not move it inside `.body`.
- **No figures in copy (hard rule for this task):** none of the strings above contains a digit other
  than the interpolated years, which are identifiers of a corpus year, not a quantity. Do not add a
  worked figure, a rate, a threshold or a "por ejemplo, unos 80 €" to any new string. If a quantity
  is what the user needs, the answer either cites the passage or abstains; the UI never supplies it.
- **Anti-patterns to avoid (specific):** a dismissible ("x") year notice; a `details` disclosure
  around it; mounting it in the sticky dock as a global banner; colouring it `warning`; duplicating
  it into the header (freshness there already names the tax year from artifact metadata).
- **Watch items (Coder must check):** confirm the notice is not rendered twice when
  `rule === explanation` (that path already collapses a section, do not collapse the notice);
  confirm `Fuentes (N)` still renders after it; confirm the moved notice does not enter the answer
  live region (`AC-001-80` asserts the region holds no `Fuentes` and no `Artículo` text); confirm
  360px with the longest new `normTitle` (`Real Decreto Legislativo 8/2015, de 30 de octubre, por el
  que se aprueba el texto refundido de la Ley General de la Seguridad Social`) still clamps to two
  lines with the full value in the link's `aria-label`; confirm a five-entry sources list at 360px
  does not force horizontal scroll; re-verify the contrast of `--ink-secondary` at 12.5px on
  `--surface-sunken` empirically rather than by eye.

## Reinforced disclaimer (OQ-3)

Resolved at the human gate as a **reinforced** disclaimer for the three newly answerable subjects
(IVA, RETA and cotización, alta de autónomo).

**ADJUDICATION (current, supersedes the pre-gate draft of this section).** The gate chose a
topic-conditional payload field, the specifier turned it into Task 7 plus AC-002-24 to AC-002-26,
and the build carries both that field and the universal line this section originally specified.
The two together repeat each other in the answer footer, so one has to go. **Decision: drop the
unconditional `ANSWER_BOUNDARY` paragraph from the answer state. The answer footer is
`AI_DISCLOSURE`, then `scopeDisclaimer` when the answer cites a non-IRPF norm. The guide footer
(`GUIDE_FOOTER`) and the abstention body (`INSUFFICIENT_BOUNDARY`) are unchanged.**

Why this way round, in two sentences: on an answer about IVA, RETA or alta the conditional line
already carries the subject-specific warning *and* the "confirma las cuantías y plazos" promise,
which is precisely what the boundary's arithmetic clause said, so keeping both stacks three
paragraphs and four caveat sentences under one answer, which is the wall this section was written
to prevent. Dropping the universal line costs nothing that is not covered elsewhere: the guide
footer keeps it verbatim, where procedures and deadlines actually appear, and the refusal and
abstention states carry the "no filing" promise in their own copy, so the only state that loses it
is the one that is answering rather than declining to act.

**What my earlier rejection got wrong, and what survives.** The rejection had two halves. The
architecture half is resolved in the implementation: derivation lives in the service
(`scopeDisclaimerFor`, `src/service/answer-question.ts:147`), reading the validated citations'
norms, and no presentational component classifies normative risk. The payload half is overruled by
the gate: `scopeDisclaimer?: string` exists, and AC-002-25 pins its derivation rule. The
reliability half stands as an accepted risk, recorded below. This is a reversal of a decision I
made before the gate answered, not a discovery that the field is harmless.

### Accepted risk (explicitly unresolved)

`scopeDisclaimerFor()` fires only on a validated citation whose `normId` is in the six-norm
non-IRPF set. With the universal line gone from the answer state, the reinforcement is now
derivation-dependent there. Accepted cases:

- **Under-fire, accepted:** a question about IVA, RETA or alta answered from IRPF passages alone
  ships with `AI_DISCLOSURE` only. Concrete: «¿cuánto IVA pago siendo autónomo?», where retrieval
  returns LIRPF material on estimación directa and the model cites only that; or a RETA question
  answered from the gastos deducibles articles. The answer still cites at least one real BOE
  passage and still carries the AI disclosure, so it is not uncited, only un-reinforced.
- **Under-fire, structural:** `insufficient_evidence` and `clarification` for those subjects carry
  no citations at all, so they never get `scopeDisclaimer`. They are covered by
  `INSUFFICIENT_BOUNDARY` and by their own abstention copy, which is why dropping the answer-state
  boundary does not leave a hole in those states.
- **Over-fire, accepted and cheap:** a genuinely IRPF question that cites LGSS incidentally (for
  example the deductibility of cotizaciones, which may cite the Social Security norm to establish
  the obligation) gets a line saying the answer leans on a norm that is not the IRPF. The
  parenthetical then lists three subjects when only one applies, so it can read broader than the
  answer. Fixing that means naming the actual cited norm family instead of the parenthetical set,
  which is a copy change to `REINFORCED_SCOPE_DISCLAIMER`, pinned verbatim by AC-002-24. Out of
  scope here: record it, do not smuggle it in.
- **Upgrade path if the under-fire case shows up in practice:** widen the derivation from "any
  cited non-IRPF passage" to "any retrieved non-IRPF passage". That is a change to AC-002-25's
  rule and to the service, not a UI change, and it must not be done inside this spec.

### Coder actions required by this adjudication (verbatim)

1. `src/components/AnswerBlock/AnswerBlock.tsx`: delete the final
   `<p className={styles.boundary}>{ANSWER_BOUNDARY}</p>` element and the `ANSWER_BOUNDARY` import.
   The footer ends at the conditional `scopeDisclaimer` paragraph.
2. `src/components/AnswerBlock/AnswerBlock.module.css`: delete the now unused `.boundary` rule
   (and its comment). `AnswerBlock.tsx` no longer references it, so it is dead CSS.
3. `test/acceptance/AC-002-reinforced-disclaimer.test.ts`, in the test named
   `AC-002-26: the answer body still comes first`: change the finder predicate at line 128 from
   `(paragraph.textContent ?? '').startsWith('Explico la norma')` to
   `paragraph.textContent === EXPECTED_DISCLAIMER`, and rename the local `boundary` to
   `reinforced` for truth. That is the one-line change; the assertion beside it (body precedes it)
   stays as written and still means what the scenario says. The companion edit is unavoidable and
   must be in the same test: line 122 becomes
   `renderScreen({ submit: submitReturning(withScope) })`, because the default `answerResponse()`
   now renders no footer line for the finder to find. There are two `renderScreen()` calls in the
   file; the other one, line 138 in `an answer without the field renders no reinforced line`, must
   keep no submit override. Do not delete the test and do not weaken the assertion.
4. No other test changes. `AC-002-26: both disclaimers are visible and the reinforced one follows
   the AI one` (`scopeIndex === aiIndex + 1`) now holds by construction, and both `AC-001-75`
   assertions are unaffected because the disclosure paragraph keeps exactly its own text.
5. `src/content/strings.ts`, the doc comment above `ANSWER_BOUNDARY`: it currently claims the
   constant is "true on an IRPF answer and on an IVA or RETA one", which is no longer where it
   renders. Replace that comment with:
   ```
   /**
    * The product boundary, rendered only on a guide footer: it names the acts the
    * product does not perform rather than a tax, so it reads correctly whatever
    * subject the guide covers. Composed into `GUIDE_FOOTER` here, never in a
    * component: `Notice` has one footer slot and user-facing copy belongs to this
    * module.
    */
   ```
6. `src/components/AnswerBlock/AnswerBlock.tsx`, the component doc comment: its last clause reads
   "(AI disclosure, the reinforced scope line when the answer leans on a non-IRPF norm, and the
   product boundary)". End it at "leans on a non-IRPF norm)".

### Copy strings, final (`src/content/strings.ts`)

**No string text changes.** Every string below is already correct in the tree and must stay
byte-identical; the decision is structural only, so the Coder edits no copy.

```
AI_DISCLOSURE =
  'Esto es información general elaborada con IA, no asesoramiento fiscal personalizado.'

REINFORCED_SCOPE_DISCLAIMER =
  'Esta respuesta se apoya en una norma distinta del IRPF (IVA, Seguridad Social o el alta de autónomos). Es información general: confirma las cuantías y plazos vigentes con la administración competente.'

ANSWER_BOUNDARY =
  'Explico la norma, no tramito altas ni declaraciones y no calculo cuotas ni importes: eso depende de tus datos y del año.'

INSUFFICIENT_BOUNDARY =
  'Puedo explicar el texto consolidado del BOE, pero no sustituyo a un asesor fiscal ni presento nada en tu nombre.'

GUIDE_FOOTER = `${AI_DISCLOSURE} ${ANSWER_BOUNDARY}`
```

- `ANSWER_BOUNDARY` survives as the reusable half that only `GUIDE_FOOTER` composes now. Do not
  rename it and do not delete it; the guide state depends on it. Its doc comment in `strings.ts`
  should lose the claim that it renders on answers.
- No string here contains a digit, a currency symbol, a percentage or an em-dash. Keep it that way:
  the numbers a user needs come from the cited passage or not at all.
- `REINFORCED_SCOPE_DISCLAIMER` is quoted verbatim by AC-002-24. Any rewording, including the
  over-fire fix above, is a new spec, not an edit in passing.

### Superseded reasoning (kept for the record, no longer the decision)

The pre-gate draft of this section specified only the unconditional line, and rejected a
topic-conditional field on four grounds. Two of them are now factually wrong and one is overruled
by the gate, so they are recorded rather than left to be re-litigated: the field exists
(overruled), the derivation is in the service and not in a component (resolved), and the claim that
universal copy "cannot drift out of sync with the scope guard" is beside the point now that the
guard and the disclaimer both derive from the cited norms. What remains valid is the reliability
objection, promoted to the accepted-risk section above.

- `AI_DISCLOSURE` is pinned by v1 R6 and by the EU AI Act Art. 50 sentence. It stays the first
  footer line and the whole of the header line; never edit it.
- `GUIDE_FOOTER` is composed in `strings.ts`, never in a component, because `Notice` has one
  `footer` slot and a concatenation inside a `.tsx` would be user-facing copy outside the strings
  module (`AC-001-81`).
- No string in this group contains a digit, a currency symbol, a percentage, a rate or a deadline.

### Where it renders, in the three states (plus guides)

| State | What renders | Exact position |
|---|---|---|
| grounded `answer` | `AI_DISCLOSURE` paragraph, then the `scopeDisclaimer` paragraph only when the answer cites a non-IRPF norm. No unconditional boundary | last one or two elements of `article.answer`, below the `Fuentes` block |
| `insufficient_evidence` | the boundary inside `INSUFFICIENT_BOUNDARY`, i.e. inside `response.explanation`; `yearNotice` still owns the footer | inside the notice body |
| `out_of_scope` | neither | nothing renders |
| `guide` (OQ-4) | `GUIDE_FOOTER` in one paragraph | the notice `footer` |

- **Grounded answer, DOM (final):** one or two sibling `<p>` elements, never a concatenated string.
  Two separate `<p>` is required, not stylistic: `test/support/ui-harness.tsx` asserts the
  disclosure with exact text matching (`findAllByText(DEFAULT_DISCLAIMER)` in `AC-001-75`), and a
  merged paragraph would stop matching. Markup:
  ```
  <SourcesList ... />
  <p className={styles.disclaimer}>{response.disclaimer}</p>
  {response.scopeDisclaimer === undefined ? null : (
    <p className={styles.disclaimer}>{response.scopeDisclaimer}</p>
  )}
  ```
  No third paragraph. `styles.boundary` is deleted: an unused CSS rule is the same defect as dead
  code, and it would invite the line back.
- **Visually distinct: no.** The scope line uses the same size, colour and weight as the
  disclosure, no border, no background, no rule, no icon, no uppercase, no `Notice`. Rationale: a
  boxed or tinted caveat reads as a warning about the answer directly above it, which invites
  skipping the answer, and at `DESIGN_VARIANCE: 3` hierarchy comes from weight and colour, not from
  a second surface. It must also not become a `Notice`, or an answer would end with two sunken
  blocks (year notice and scope line) suggesting two caveats.
- **Header: unchanged.** It keeps `AI_DISCLOSURE` only. Anything more above the fold is exactly the
  wall of legal text the gate forbade, and the header's job is disclosure plus corpus freshness.
  The reinforced line lives where it is read after the substance, never before it.
- **`insufficient_evidence`: no new element, one strengthened sentence.** The block ends with
  `INSUFFICIENT_BOUNDARY`, so it stays a three-sentence body and carries the "ni presento nada en tu
  nombre" half. Stacking a second disclosure under an abstention would be legal text standing in for
  an answer that was never given, and the footer is already spent on `yearNotice`. This is
  server-side composition inside the existing `explanation` field: no payload change, no scenario
  change beyond the wording.
- **`out_of_scope`: deliberately nothing, and it is a decision, not an omission.** `AC-002-14` fixes
  the notice to `tone` / `title` / `body` / `action`, so a footer would fail an exact-shape
  assertion; and a refusal asserts nothing about the law, so there is nothing to disclaim beyond the
  competent body it already names. What reinforces the refusal there is the Task 3 copy plus the
  handoff, not small print.
- **`guide`: one paragraph, both sentences.** A numbered procedure reads as instructions, which is
  precisely the reading `ANSWER_BOUNDARY` exists to bound. Since `Notice` takes one `footer` string,
  the pair travels as `GUIDE_FOOTER`. The `guide` branch therefore does not read
  `response.disclaimer`; that is safe because the server sets it from the same `AI_DISCLOSURE`
  constant, so the two agree by construction, and the boundary half has no payload field to come
  from. Do not "fix" this by concatenating inside `use-chat-turn.ts`.

### A11y and the parts that must not regress

- The footer sits outside the answer's live region, so neither the disclosure nor the scope line is
  re-read on every streamed token.
- Contrast: `--ink-secondary` on `--surface` at 12.5px is the pair already in production for the
  disclosure; re-verify it empirically rather than assuming, per v1's watch item.
- Do not mark either line `aria-hidden`, do not fold them into a `title` attribute, and do not make
  the scope line an `aria-label` on the answer.
- Anti-patterns to avoid (specific): an expandable "más información" wrapping the scope line (trust
  behind a click is not trust, same rule as the sources block); naming IVA or autónomos inside
  `ANSWER_BOUNDARY` (it now renders only on guides and would be stale the moment scope moves again);
  bolding or amber-tinting the scope line; a third footer paragraph; a per-topic disclaimer table in
  the UI.
- Watch items (Coder must check): `AC-001-75`'s exact-text assertion still finds two matches after
  an answer (header plus the unchanged disclosure paragraph); `AC-001-80`'s live-region checks still
  pass with the scope line present; at 360px the footer stack is at most three items (the
  consolidated-text notice inside `Fuentes`, the disclosure, the scope line when present) and the
  conditional line must not push the whole footer into looking like body copy; the over-fire case in
  the accepted-risk section above must not be "fixed" by rewording the constant.

## Guide retention (OQ-4)

Resolved at the human gate as **guides stay**: `MODEL_130`, `MODEL_131` and `MODEL_100` remain
procedural IRPF guides. They are not converted to retrieval, and Task 5's removal list stands as
written (`303`, `390`, `036`, `ivaGuide`, `facturaGuide`, `quotaGuide`, `modelsOverview`).

**Guide rendering needs no change beyond the OQ-3 footer.** Confirmed against the current
`Notice` / `abstentionNotice` / `gestor-guides.ts` shapes:

- Title, body, `<ol>` steps with visible decimal numbering, `<ul>` links: unchanged.
- `footer`: now `GUIDE_FOOTER` instead of nothing (§ Reinforced disclaimer).
- `target` / `rel` on the `links` anchors: the one markup fix (§ Task 5).
- Tone, radius, spacing, type register, motion: unchanged.

What the retention does require the Coder to keep straight, because the two shapes now sit closer
together than before:

- **The visible mark of "grounded" is the `Fuentes` block.** An answer always has one, a guide never
  does. Do not render a sources block for a guide, and do not render steps for an answer.
- **A guide is not a refusal.** It offers official links and no handoff; a refusal offers a handoff
  and no links. Both are `info`, so the title and the trailing affordance are the only signals.
  Keep them.
- **Precedence is already deterministic and the UI inherits it:** `gestorGuide` runs before the scope
  guard and before retrieval, so a `130` / `131` / `100` question can never arrive as an answer. No
  turn exists in which both shapes compete, so no visual tie-break is needed.
- **Cosmetic consequence worth naming:** the model family now splits (130/131/100 answered
  procedurally, 303/390/036 answered from the corpus). That asymmetry is acceptable because both
  renderings are honest and each carries its own boundary; it is not a layout problem and must not
  be "fixed" by turning 130/131/100 into retrieval answers inside this spec.
- Watch items (Coder must check): `AC-002-19` requires the preserved guides keep their existing
  title and steps verbatim, so do not re-word steps while adding the footer; confirm the longest
  preserved guide (`MODEL_130`: four steps, three links, plus the new footer) still fits 360px
  without horizontal scroll; confirm `AC-001-75` stays green, since no guide renders in it.

## Out-of-scope tasks

- **Task 1** (allowed-norms registry) and **Task 2** (corpus sync, fixtures, artifact): backend and
  data. No frontend surface. Their one visible consequence, longer and more numerous `normTitle`
  values in the sources block, is handled under Task 6's watch items.
- **Task 7** (legacy tests): no design work. One item crosses into UI code, recorded here so it is
  not missed: `test/acceptance/AC-001-chat-ui.test.ts` builds an `out_of_scope` fixture with
  `reasonCode: 'iva'`, which stops type-checking once Task 3 narrows the union. The fixture changes,
  the test's AC-001-79 scenario ID and assertions do not.
- **Task 8** (runbook and ADR note): documentation. No frontend surface.

Both defects flagged while grounding this spec are now settled at the human gate, and appear above as
directives rather than findings: the refusal copy (§ Task 3) and `target` / `rel` on the `Notice`
link list (§ Task 5). Neither is re-designed here beyond the rendering consequence of the decision.
The only thing left open in this document is the artifact-sync note: the acceptance set in this
folder as of this revision does not cite either change yet, so the scenario ID should be added to
those two bullets when it lands.
