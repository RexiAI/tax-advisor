# AC-002: Actualizar tests que fijaban la conducta vieja (incl. fixture 'iva')

## AC-002-29 — Los tests de 001 que fijaban la conducta vieja se actualizan conservando su ID
Given `test/acceptance/AC-001-scope-guard.test.ts` and `test/unit/text-and-guards.test.ts`
When they are read
Then no assertion still expects `out_of_scope` or `guide` for `iva`, `social_security` or `autonomo_registration`
And each updated assertion keeps its `AC-001-NN` scenario id in the test name
And the updated assertions agree with AC-002-08 through AC-002-20 (classifyScope returns null for the three topics; the six remaining topics still classify; the end-to-end flow reaches retrieval for IVA/RETA/alta)
And `npm test` exits 0 with the updated assertions

## AC-002-30 — El fixture reasonCode 'iva' se sustituye por uno todavía válido
Given `test/acceptance/AC-001-chat-ui.test.ts`
When it is read
Then no payload under `test/` uses `reasonCode: 'iva'`, `reasonCode: 'social_security'` or `reasonCode: 'autonomo_registration'` as an `out_of_scope` value
And the out-of-scope fixture uses a still-valid `reasonCode` (e.g. `'ibi'`) with a coherent `topicLabel` and `officialBody`
And type-checking passes once the `OutOfScopeReasonCode` union is narrowed
