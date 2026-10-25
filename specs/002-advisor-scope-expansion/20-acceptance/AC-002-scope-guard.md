# AC-002: Recortar el guard de alcance

## AC-002-08 — Las tres materias salen de fuera-de-alcance
Given the ordered topic map `OUT_OF_SCOPE_TOPICS` and the `OutOfScopeReasonCode` union
When `classifyScope` is called with a message that previously matched `iva`, `social_security` or `autonomo_registration`
Then it returns `null` for each of «¿cuánto IVA pago?», «¿cuánto es la cuota de autónomos?», and «me quiero dar de alta como autónomo»
And the `OutOfScopeReasonCode` union no longer contains `'iva' | 'social_security' | 'autonomo_registration'`

## AC-002-09 — Las seis materias restantes siguen clasificando igual
Given the narrowed topic map
When `classifyScope` is called with a representative message for each remaining topic
Then `filing_request`, `itp`, `isd`, `ibi`, `non_residents`, and `company_tax` each still return their unchanged `reasonCode` and `officialBody`

## AC-002-10 — Un mensaje mixto IVA+autónomo alcanza recuperación
Given the narrowed topic map and the answer orchestration
When the user asks «¿cuánto IVA pago siendo autónomo?»
Then `classifyScope` returns `null`
And the turn is not refused as `out_of_scope` and not answered by a hardcoded guide
And the turn reaches retrieval (the fake adapter is invoked)

## AC-002-11 — Una petición de presentación sigue siendo handoff
Given the narrowed topic map where `filing_request` is first
When the user asks «preséntame el 303»
Then `classifyScope` returns `{reasonCode:'filing_request'}`
And the turn produces `out_of_scope` with `reasonCode 'filing_request'` and does not call the model
