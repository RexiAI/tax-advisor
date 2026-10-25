# AC-002: Quitar la interceptación de guías para materias ya respondibles (sin sombrear)

## AC-002-16 — Una pregunta de IVA alcanza recuperación, no la guía
Given the narrowed guide matchers and the expanded fixture corpus
When the user asks «¿cuánto IVA pago?»
Then `gestorGuide` returns `null`
And the turn produces `'answer'` (with citation) or `'insufficient_evidence'`/`'clarification'`
And the turn does not produce a `'guide'`

## AC-002-17 — Una pregunta de cuota/RETA alcanza recuperación, no la guía
Given the narrowed guide matchers and the expanded fixture corpus
When the user asks «¿cuánto es la cuota de autónomos?»
Then `gestorGuide` returns `null`
And the turn produces `'answer'`, `'insufficient_evidence'` or `'clarification'`, never `'guide'`

## AC-002-18 — Los modelos censales y de IVA dejan de interceptar
Given the narrowed guide matchers
When the user asks «¿cómo se presenta el modelo 303?» or «modelo 036»
Then `gestorGuide` returns `null` for those messages (they fall through to the guard, then retrieval)
And the constants `IVA_GUIDE`, `FACTURA_GUIDE`, `RETA_GUIDE`, `MODEL_303`, `MODEL_390`, `MODEL_036` and `MODELS_OVERVIEW` are no longer referenced in `src/`

## AC-002-19 — Las guías de materias fuera de alcance y las IRPF conservadas siguen funcionando
Given the narrowed guide matchers
When `gestorGuide` is called with a representative message for ITP, ISD, no residentes, Impuesto sobre Sociedades, régimen foral, and modelo 130
Then each returns a non-null guide with its existing title and steps
And «preséntame el 303» still produces `out_of_scope` with `reasonCode 'filing_request'` and the model is not called

## AC-002-20 — Una guía conservada no sombrea una pregunta respondible
Given the narrowed guide matchers
When the user asks «¿qué gastos son deducibles en el IVA?»
Then `gestorGuide` returns `null` (not `GASTOS_GUIDE`)
And the turn reaches retrieval instead of returning the IRPF gastos guide
