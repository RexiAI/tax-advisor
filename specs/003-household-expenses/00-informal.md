# 00-informal — Household utilities + IBI question must not refuse the turn

## Original ask (verbatim)

> dime si me puedo deducir la luz, agua e ibi si me doy de alta de autonomo

The tool answered:

> Fuera del alcance de esta herramienta
> Las preguntas sobre el IBI quedan fuera de mi alcance: la administración
> competente es la autoridad tributaria de tu comunidad autónoma. Lo que sí
> cubro, con la norma del BOE citada, es el IRPF, el IVA y el ciclo fiscal del
> autónomo.

The user then said: "we need to support this in a small feature."

## What happens today

`src/content/scope-topics.ts` maps the `ibi` topic to `anyOf([/\bibi\b/,
/impuesto sobre bienes inmuebles/])`. `classifyScope` runs before retrieval, so
any message that contains the token `ibi` — whatever the question is about — is
refused with `reasonCode: 'ibi'` and the model is never called.

That rule was right for "¿Cuánto es el IBI de mi vivienda?" (a question about
the tax itself). It is wrong for the sentence above: the question is about the
IRPF deductibility of household costs when registering as autónomo, and `IBI`
appears only as one expense in a list. The refusal discards the part the corpus
does ground.

## Why the grounded part matters

The corpus already answers the utilities half. LIRPF art. 30.2.5ª.b, present in
`corpus/corpus.json`, makes water, gas, electricity, telephone and Internet
deductible when the taxpayer partially allocates the habitual dwelling to the
activity, at 30 % of the proportion of square metres used for the activity
(unless a different percentage is proven). RD 439/2007 art. 22 (also in the
corpus) states the partial-allocation rule.

The corpus contains no literal mention of `IBI` at all — checked across all
1,961 passages. So the IBI's own rules, and its deductibility as an IRPF
expense, are not grounded anywhere the product can cite. Answering that part
would mean inventing it.

## Desired behaviour

1. **A question about expense deductibility that merely mentions IBI is not
   refused.** The sentence above reaches retrieval and the model, and is
   answered for the part the corpus grounds: utilities under LIRPF art.
   30.2.5ª.b, with the 30 % allocation rule, cited to the real passage.
2. **A question about the IBI itself keeps today's refusal** — same
   `reasonCode`, same topic label, same official body ("la autoridad tributaria
   de tu comunidad autónoma"). The existing representative case
   `¿Cuánto es el IBI de mi vivienda?` must stay out of scope and must still
   not call the model.
3. **The IBI part is never asserted.** When a turn is answered and the message
   mentioned an out-of-scope tax that was not the subject of the question, the
   response carries a deterministic, user-visible boundary note: the tax is
   named and it is said that its own rules are not covered by the corpus. This
   note is decided from the message and the response, not left to the model to
   remember. No citation may be invented or borrowed for the IBI.
4. **The guard stays a pure function of the normalized message.** Same input,
   same classification. No model call, no network, no I/O added to the
   classification path.
5. **Everything else in the guard is unchanged**: ITP, ISD, non-residents,
   company tax and filing requests keep their current classification and
   ordering (`filing_request` still wins over a tax mention in the same
   sentence), and `los rendimientos del alquiler de bienes inmuebles` still
   reaches IRPF retrieval.

## Non-goals

- Adding the IBI — or the regional finance law that hosts it — to
  `ALLOWED_NORMS` or to the corpus. The BOE text of that tax is a different
  feature, and this one must not touch `corpus/` or the norm registry.
- Answering whether the IBI is deductible, or at what percentage. The chosen
  behaviour is to say it is not covered, not to reason about it.
- Changing the wording of the existing out-of-scope refusal beyond what the new
  boundary note needs.
- Broadening the fix to ITP/ISD mentions in expense questions. Same failure
  class, different spec: record it as a follow-up, do not fix it here.

## Decision taken before the spec was written

The IBI part could have been (a) answered by adding a grounding source, (b)
answered with a boundary note, or (c) left refusing the whole turn. The user
chose (b) on 2026-10-26: answer luz/agua, scope the IBI out. This is a small
feature — no corpus change, no new dependency, no new model.

## Constraints for whoever implements this

- Spanish copy, same voice as the rest of the product; no new jargon.
- Existing tests that pin the six remaining out-of-scope topics must keep
  passing (they encode the contract this feature preserves).
- Acceptance scenarios must cover at least: the verbatim sentence above, the
  IBI-as-subject refusal, an IBI-deductibility-only question (no utilities, so
  the answer must not claim corpus support), the filing-request ordering, and
  the unchanged "bienes inmuebles" rental question.
- A model that ignores the boundary instruction must not be able to turn the
  feature into an unsourced IBI answer: the note's presence is deterministic.
