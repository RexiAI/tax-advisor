# AC-002: Disclaimer reforzado para respuestas no-IRPF

## AC-002-24 — La constante existe con el texto exacto
Given `src/content/strings.ts`
When it is read
Then it exports a single constant `REINFORCED_SCOPE_DISCLAIMER` whose value is exactly:
`Esta respuesta se apoya en una norma distinta del IRPF (IVA, Seguridad Social o el alta de autónomos). Es información general: confirma las cuantías y plazos vigentes con la administración competente.`

## AC-002-25 — El campo es separado y se deriva del conjunto de normas que respondieron
Given `AnswerResponse` in `src/service/types.ts`
Then it declares an optional `scopeDisclaimer?: string`
And there is a committed set of the six non-IRPF `normId` values (the Task 1 table) with a predicate to test membership
And the service sets `scopeDisclaimer` to `REINFORCED_SCOPE_DISCLAIMER` if and only if at least one validated citation's `normId` belongs to that non-IRPF set
And a response that cites only IRPF passages carries no `scopeDisclaimer`

## AC-002-26 — Se renderiza adyacente al disclaimer de IA y no traga la respuesta
Given `AnswerBlock` in `src/components/AnswerBlock/AnswerBlock.tsx`
When a response carries `scopeDisclaimer`
Then it is rendered in the answer footer adjacent to (immediately after) the AI disclaimer, both visible
And it does not replace or hide the AI disclaimer
And it does not appear before the answer body (it never swallows the answer)
