# AC-002: Eliminar la plantilla fija de alta de autónomo y el cambio de contrato

## AC-002-12 — El módulo de constantes de autónomo se elimina y nadie lo importa
Given the file `src/content/autonomo.ts`
When the source tree is read
Then `src/content/autonomo.ts` no longer exists
And no module in `src/` imports `AUTONOMO_EXPLANATION`, `AUTONOMO_STEPS` or `AUTONOMO_LINKS`
And `src/service/answer-question.ts` contains no reference to `../content/autonomo`

## AC-002-13 — La respuesta out_of_scope pierde steps y links
Given the response union in `src/service/types.ts`
When `OutOfScopeResponse` is inspected
Then it declares `reasonCode`, `topicLabel`, `officialBody`, `explanation`, `handoffUrl` and `disclaimer`
And it does not declare `steps` nor `links`
And `scopeResponse` in `answer-question.ts` builds the payload without a `steps` or `links` field

## AC-002-14 — El chat UI renderiza la respuesta out_of_scope sin items ni links
Given the turn state in `src/components/ChatScreen/use-chat-turn.ts`
When an `out_of_scope` response arrives
Then the resulting `Notice` carries `tone`, `title`, `body` and `action` (handoff)
And it does not carry `items` nor `links`
And a remaining out-of-scope topic such as `ibi` still renders with `title`, `body` and the handoff action

## AC-002-15 — Una pregunta de alta de autónomo no se responde desde una constante
Given the expanded fixture corpus and a fake adapter scripted to cite a retrieved passage
When the user asks «Me quiero dar de alta como autónomo»
Then the turn reaches retrieval and the adapter is invoked exactly once
And the response `kind` is `'answer'` with at least one citation, or `'insufficient_evidence'`/`'clarification'` when the corpus does not support it
And the response is never `out_of_scope` carrying fixed steps
