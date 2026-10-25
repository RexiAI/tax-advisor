# AC-002: Prohibir cuantías hardcodeadas, aviso de año y abstención honesta

## AC-002-21 — Ninguna constante de consejo fija una cuantía vigente
Given the source tree under `src/`
When it is audited for hardcoded monetary or normative quantities (cuota, base de cotización, tramo, tipo de IVA, tarifa, importe o porcentaje numérico de un tributo)
Then no advisory constant in `src/` fixes such a figure
And the only numeric literals permitted in `src/` are model identifiers (303, 390, …), config bounds (`retrievalTopK`, `maxMessageChars`, …), and values read from the corpus
And `SYSTEM_POLICY` still instructs the model not to complete figures outside the supplied passages

## AC-002-22 — El aviso de año se aplica a las materias nuevas y no sin año distinto
Given the expanded fixture corpus and a fake adapter scripted to cite a retrieved passage
And the corpus tax year is 2025
When the user asks «¿cuánto IVA pago en 2024?»
Then the response `kind` is `'answer'` and its `yearNotice` is defined
And the `yearNotice` contains «2025» and «2024»
When the user asks «¿cuánto IVA pago?» (no year) or «¿cuánto IVA pago en 2025?»
Then the response carries no `yearNotice`

## AC-002-23 — Una pregunta sin respuesta en el corpus se abstiene, no inventa
Given the expanded fixture corpus
When the user asks a question whose answer is not in the corpus (a figure or procedure the corpus does not fix)
Then the response is `'insufficient_evidence'` with handoff, or `'clarification'`
And the response contains no invented figure or datum
And the risk of low lexical recall is accepted (no recall-measurement gate)
