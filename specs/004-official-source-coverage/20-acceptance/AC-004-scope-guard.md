# AC-004: Scope guard, region-aware

## AC-004-36 — A covered (jurisdiction, tax) question reaches retrieval
Given the coverage matrix declares `(madrid, irpf)`
When a question resolves to jurisdiction `madrid` and tax `irpf` (e.g. "¿Qué deducciones autonómicas tengo en Madrid como autónomo?")
Then the guard does not refuse it
And the turn reaches retrieval

## AC-004-37 — An uncovered (jurisdiction, tax) is refused naming the competent body
Given the coverage matrix does not declare `(madrid, itp)`
When a question resolves to `madrid` and `itp`
Then the guard refuses it
And the refusal names the competent body

## AC-004-38 — An unknown jurisdiction asks the existing clarification, never guesses
Given a message that implicates regional competence without naming a community (e.g. "¿qué deducciones autonómicas me aplico?")
When the guard resolves jurisdiction
Then the resolution is unknown
And the turn routes to the "comunidad autónoma" clarification instead of assuming Madrid or answering from the state norm

## AC-004-39 — The IBI boundary note from spec 003 is preserved
Given the message "¿Cuánto es el IBI de mi vivienda?"
When `classifyScope` runs
Then the result is `{ reasonCode: 'ibi', officialBody: 'la autoridad tributaria de tu comunidad autónoma' }`

## AC-004-40 — The refusal is coverage-driven, not a hardcoded list
Given the guard reads coverage from the artifact via `isCovered`
When a test injects a matrix that declares an otherwise-refused pair (e.g. `(madrid, itp)`)
Then that pair's question is no longer refused
And the guard's own source does not hardcode which pairs are covered

## AC-004-50 — A named community outside the coverage matrix is refused, not clarified
Given the coverage matrix declares no regional pair beyond `(madrid, irpf)` and `(murcia, irpf)`
When a message names a community outside the matrix (e.g. "¿Qué deducciones autonómicas tengo en Galicia como autónomo?")
Then the turn is refused with `kind: 'out_of_scope'` and `reasonCode: 'uncovered_community'`
And the refusal's `officialBody` names that community's competent body (not the generic "tu comunidad autónoma" placeholder)
And the turn does not route to the "comunidad autónoma" clarification

## AC-004-51 — The uncovered-community refusal is deterministic, no model call
Given a message that names an uncovered community
When the guard runs
Then the refusal decision comes from the coverage lookup alone (the named community's jurisdiction is not a covered pair)
And no model call is made to decide it

## AC-004-52 — The refusal states that coverage does not extend to the named community
Given an uncovered-community refusal for a message naming "Galicia"
When its explanation is rendered
Then the explanation names that community's competent body
And it states that coverage does not extend to that community
