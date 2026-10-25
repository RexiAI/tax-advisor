# 10-tasks — De explicador de IRPF a asesor fiscal

Stage 1 output (Specifier), revised after the human gate (OQ-1..OQ-5 resolved). Review at the
human gate before `/build`.

- Spec: `002-advisor-scope-expansion`, conformance tier **mvp**.
- Stack: TypeScript, Node 22+, Next.js App Router, npm. Tests: Vitest + React Testing Library.
- Corpus: build-time artifact (`corpus/corpus.json`, 396 passages, tax year 2025), loaded into an
  in-process lexical index. No database, no writable filesystem at request time.

## How to read a criterion

Every bullet is checkable by reading the committed code or by running the cited test — not by
judgment. Where a requirement is about what the *model* says, the criterion is split into two
checkable halves and never asserts model quality: the **policy** (a constant asserted by a test)
and the **shape** (a structural post-condition the server enforces). The BOE-A identifiers below
were verified against `boe.es` at spec time (HTTP 200 on the consolidated-text metadata endpoint)
and are recorded, not invented; the Coder writes them verbatim, no re-verification needed.

## Requirement coverage map

| Requirement (restated from 00-informal + gate decisions) | Tasks |
|---|---|
| Ampliar el corpus a censal, LGSS/RETA, IVA e IAE (ids verificados) | 1, 2 |
| Preservar invariantes del corpus: sync incremental, contentHash, tests offline, guard de norma | 2 |
| Recortar el guard: iva, social_security, autonomo_registration → recuperación + citas | 3, 5 |
| Siguen fuera: filing_request, itp, isd, ibi, non_residents, company_tax | 3 |
| Orden determinista en mensajes mixtos | 3 |
| Eliminar la plantilla fija de alta de autónomo (ninguna respuesta de asesoría desde una constante) | 4 |
| Cambio de contrato en la unión de respuestas (out_of_scope sin steps/links) | 4 |
| Corregir la copia de rechazo («aquí solo explico el IRPF») y los enlaces externos de Notice | 8 |
| Ninguna cuantía vigente hardcodeada; abstención honesta (no inventar) | 6 |
| El aviso de año se aplica a las materias nuevas | 6 |
| Disclaimer reforzado para respuestas no-IRPF (OQ-3) | 7 |
| Guías conservadas no sombrean una pregunta respondible (OQ-4) | 5 |
| Privacy, rate limit, disclaimer IA y handoff siguen funcionando igual | 3, 4, 5, 7 (no se tocan) |
| Tests actualizados que fijaban la conducta vieja (incl. fixture `'iva'`) | 9 |
| Runbook coherente; nota ADR 0001 sin medición de recall; ADR 0003 nuevo (OQ-5) | 10, 11 |

## Task list

| # | Task | Scenarios |
|---|---|---|
| 1 | Ampliar el registro de normas permitidas (ids verificados) | AC-002-01 – AC-002-03 |
| 2 | Sincronizar el corpus ampliado preservando invariantes | AC-002-04 – AC-002-07 |
| 3 | Recortar el guard de alcance | AC-002-08 – AC-002-11 |
| 4 | Eliminar la plantilla fija de alta de autónomo y el cambio de contrato | AC-002-12 – AC-002-15 |
| 5 | Quitar la interceptación de guías para materias ya respondibles (sin sombrear) | AC-002-16 – AC-002-20 |
| 6 | Prohibir cuantías hardcodeadas, aviso de año y abstención honesta | AC-002-21 – AC-002-23 |
| 7 | Disclaimer reforzado para respuestas no-IRPF | AC-002-24 – AC-002-26 |
| 8 | Corregir la copia de rechazo y los enlaces externos de Notice | AC-002-27 – AC-002-28 |
| 9 | Actualizar tests que fijaban la conducta vieja (incl. fixture `'iva'`) | AC-002-29 – AC-002-30 |
| 10 | Actualizar runbook y nota de volumen de ADR 0001 | AC-002-31 – AC-002-32 |
| 11 | Nuevo ADR 0003 — expansión de alcance | AC-002-33 |

---

## Task 1 — Ampliar el registro de normas permitidas (ids verificados)

**Scope:** `src/domain/allowed-norms.ts` — la única lista de normas que el producto cubre, y el
guard que rechaza cualquier pasaje de una norma fuera de ella. Requisito previo de todo lo demás.

**Normas aprobadas (OQ-1).** Los identificadores se verificaron contra boe.es (endpoint de
metadatos de texto consolidado, HTTP 200). El Coder los escribe tal cual, sin re-verificar. Para
cada norma se registra el `normId` verificado y el `normTitle` exacto devuelto por el BOE:

| `normId` | `normTitle` (exacto, como lo devuelve boe.es) |
|---|---|
| `BOE-A-2003-23186` | Ley 58/2003, de 17 de diciembre, General Tributaria. |
| `BOE-A-2007-15984` | Real Decreto 1065/2007, de 27 de julio, por el que se aprueba el Reglamento General de las actuaciones y los procedimientos de gestión e inspección tributaria y de desarrollo de las normas comunes de los procedimientos de aplicación de los tributos. |
| `BOE-A-2015-11724` | Real Decreto Legislativo 8/2015, de 30 de octubre, por el que se aprueba el texto refundido de la Ley General de la Seguridad Social. |
| `BOE-A-1996-4447` | Real Decreto 84/1996, de 26 de enero, por el que se aprueba el Reglamento General sobre inscripción de empresas y afiliación, altas, bajas y variaciones de datos de trabajadores en la Seguridad Social. |
| `BOE-A-1992-28740` | Ley 37/1992, de 28 de diciembre, del Impuesto sobre el Valor Añadido. |
| `BOE-A-1990-23930` | Real Decreto Legislativo 1175/1990, de 28 de septiembre, por el que se aprueban las tarifas y la instrucción del Impuesto sobre Actividades Económicas. |

**Sub-cuestión resuelta (derivada de OQ-1).** Para IAE se incorpora **solo** el RD Leg. 1175/1990
(tarifas e instrucción). El texto refundido de la Ley Reguladora de las Haciendas Locales
(RD Leg. 2/2004, `BOE-A-2004-4214`) **queda fuera** porque aloja el IBI, que sigue fuera de
alcance.

**Acceptance criteria**

- `ALLOWED_NORMS` contiene las dos normas IRPF actuales (`BOE-A-2006-20764`, `BOE-A-2007-6820`)
  más las seis normas de la tabla, cada una con su `normId` y su `normTitle` exactos de la tabla
  (los títulos se copian verbatim; un test compara por igualdad de cadena).
- `ALLOWED_NORMS` **no** contiene `BOE-A-2004-4214` (TRLRHL) ni ninguna otra norma fuera de la
  tabla.
- `isAllowedNorm(normId)` sigue siendo la única puerta de entrada: devuelve `true` para cada
  `normId` de `ALLOWED_NORMS` y `false` para cualquier otro. `createPassage` sigue rechazando con
  `unsupported_norm` un `normId` fuera de la lista (sin cambios en `passage.ts`).
- Un test enumera `ALLOWED_NORMS` y afirma que tiene 8 entradas, que cada `normId` es no vacío y
  distinto, y que el par `normId`/`normTitle` de las seis nuevas coincide con la tabla.
- El orden de `ALLOWED_NORMS` es estable (el mismo array, sin ordenar en caliente); el sync recorre
  ese orden (§ Task 2).

**Scenarios:** AC-002-01 – AC-002-03 → `20-acceptance/AC-002-allowed-norms.md`

---

## Task 2 — Sincronizar el corpus ampliado preservando invariantes

**Scope:** `npm run corpus:sync` → `corpus/corpus.json`, más los fixtures offline de las normas
nuevas. El código de sync (`src/corpus/sync.ts`) ya itera sobre `ALLOWED_NORMS`; esta tarea
verifica que sigue cumpliendo los invariantes cuando la lista pasa de 2 a 8 normas y añade los
fixtures que mantienen la suite offline.

**Acceptance criteria**

- El sync recorre exactamente las normas de `ALLOWED_NORMS` (8 entradas tras la Task 1). Un test
  con un fetcher fake afirma que el número de llamadas a `getLastUpdated` es igual a
  `ALLOWED_NORMS.length`.
- Incremental intacto: una norma cuyo `fecha_actualizacion` coincide con el `boeUpdatedAt` grabado
  en el artefacto anterior se reutiliza (sus pasajes y `fetchedAt` no cambian) y no se re-descarga.
  Un test con un artefacto anterior en el que solo una norma cambió afirma `fetchedNormIds.length === 1`
  y `reusedNormIds.length === ALLOWED_NORMS.length - 1`.
- Idempotente intacto: ejecutar el sync dos veces sobre datos fixture sin cambios produce un array
  `passages[]` byte-idéntico (misma longitud, mismo orden, mismos `passageId`) y el mismo
  `contentHash`; solo `generatedAt` puede diferir.
- Un parse roto de cualquier norma nueva detiene el sync completo: `runCorpusSync` devuelve
  `{ok:false, error:'parse_failed', normId, detail}` y el CLI sale `1` sin escribir el artefacto.
  Ninguna norma nueva se puede añadir parcialmente (nunca un corpus encogido).
- `contentHash` sigue siendo el SHA-256 de la forma canónica de `passages[]` y se recalcula en cada
  ejecución; un test afirma que añadir una norma cambia el hash.
- Fixtures offline: existe un fixture BOE por cada norma nueva bajo `test/fixtures/boe/` con la
  misma forma `bloque`/`version` que los existentes, de modo que `npm test` no toca `boe.es`. El
  harness de fixtures (`test/support/harness.ts`) incluye las normas nuevas en `FIXTURE_META` y el
  `fixtureCorpus()` resultante tiene pasajes de las nuevas normas (test: `fixtureCorpus().index.size > 396`).
- El artefacto commitado `corpus/corpus.json` se regenera con `npm run corpus:sync` e incluye las
  normas nuevas; `norms[]` y `passages[]` crecen en consecuencia.

**Scenarios:** AC-002-04 – AC-002-07 → `20-acceptance/AC-002-corpus-sync.md`

---

## Task 3 — Recortar el guard de alcance

**Scope:** `src/content/scope-topics.ts` y `src/service/scope-guard.ts`. Se quitan tres materias del
mapa ordenado de fuera-de-alcance; las seis restantes se quedan con su orden y su semántica
"primera coincidencia gana" intactas.

**Acceptance criteria**

- `OutOfScopeReasonCode` ya no contiene `'iva'`, `'social_security'` ni `'autonomo_registration'`.
  La unión queda exactamente `'filing_request' | 'itp' | 'isd' | 'ibi' | 'non_residents' | 'company_tax'`.
- `OUT_OF_SCOPE_TOPICS` ya no contiene entradas para esas tres materias. `classifyScope` devuelve
  `null` para los mensajes que antes las disparaban (p. ej. «¿cuánto IVA pago?», «¿cuánto es la cuota
  de autónomos?», «me quiero dar de alta como autónomo»).
- Las seis materias restantes se clasifican igual que antes: `filing_request` (primera), `itp`,
  `isd`, `ibi`, `non_residents`, `company_tax`, cada una con su `reasonCode` y `officialBody` sin
  cambios.
- El orden sigue siendo determinista y "primera coincidencia gana": el array está ordenado y
  `classifyScope` recorre en ese orden y devuelve la primera coincidencia. Un mensaje mixto de
  materias aún fuera-de-alcance se resuelve con el `reasonCode` de la primera del array (p. ej. una
  petición de presentación que además nombra IVA → `filing_request`).
- Un mensaje que mezcla una materia ahora respondible con IRPF alcanza recuperación: `classifyScope`
  devuelve `null` para «¿cuánto IVA pago siendo autónomo?» (y para «¿son deducibles las cotizaciones
  a la Seguridad Social de un autónomo en el IRPF?», que ya estaba en alcance).
- «preséntame el 303» sigue siendo `filing_request` (handoff), no recuperación.

**Scenarios:** AC-002-08 – AC-002-11 → `20-acceptance/AC-002-scope-guard.md`

---

## Task 4 — Eliminar la plantilla fija de alta de autónomo y el cambio de contrato

**Scope:** `src/content/autonomo.ts`, `src/service/answer-question.ts`, `src/service/types.ts`,
`src/components/ChatScreen/use-chat-turn.ts`. Ninguna respuesta de asesoramiento puede salir de una
constante del código; el único contenido de consejo es el texto del corpus citado por el modelo.

**Cambio de contrato especificado explícitamente.** La unión `ChatResponse` cambia de forma
compatible con un breaking change: `OutOfScopeResponse` **pierde** los campos opcionales `steps` y
`links`. No se añade un `kind` nuevo: las tres materias ahora respondibles (`iva`,
`social_security`, `autonomo_registration`) se responden con el `kind` ordinario `'answer'`
(recuperación → modelo → citas) o con `'insufficient_evidence'`/`'clarification'` cuando el corpus
no las sostiene. El chat UI recibe, para una respuesta `out_of_scope`, un `Notice` con `tone: 'info'`,
`title: OUT_OF_SCOPE_TITLE`, `body: explanation` y la acción de handoff — **sin** `items` ni `links`.

**Acceptance criteria**

- `src/content/autonomo.ts` se elimina. Ningún módulo de `src/` importa `AUTONOMO_EXPLANATION`,
  `AUTONOMO_STEPS` ni `AUTONOMO_LINKS`. Un test (o `tsc`) afirma que el import ya no existe y que
  `answer-question.ts` no referencia `../content/autonomo`.
- `scopeResponse` en `answer-question.ts` ya no tiene rama `autonomo_registration`; para toda
  coincidencia restante devuelve `out_of_scope` con `reasonCode`, `topicLabel`, `officialBody`,
  `explanation`, `handoffUrl` y `disclaimer` — sin `steps` ni `links`.
- `OutOfScopeResponse` en `src/service/types.ts` no declara `steps` ni `links`; el import de
  `OfficialLink` se retira de ese módulo si queda sin uso. La unión `ChatResponse` conserva sus
  demás miembros sin cambios de forma.
- El chat UI (`abstentionNotice` en `use-chat-turn.ts`) para `out_of_scope` no propaga `items` ni
  `links`; el `Notice` resultante lleva `tone`, `title`, `body` y `action` de handoff únicamente.
  Las materias aún fuera de alcance (p. ej. `ibi`) se siguen renderizando con `title` y `body` y la
  acción de handoff.
- Conducta end-to-end: una pregunta de alta de autónomo («Me quiero dar de alta como autónomo»)
  no produce una respuesta de consejo desde una constante. Con el corpus fixture ampliado, el turno
  alcanza recuperación y el modelo (adapter `callCount === 1`) y devuelve `'answer'` con al menos una
  cita, o `'insufficient_evidence'`/`'clarification'` si el corpus no sostiene el contenido — nunca
  `out_of_scope` con pasos fijos.

**Scenarios:** AC-002-12 – AC-002-15 → `20-acceptance/AC-002-registration-path.md`

---

## Task 5 — Quitar la interceptación de guías para materias ya respondibles (sin sombrear)

**Scope:** `src/content/gestor-guides.ts`. Los matchers de guía que interceptaban IVA, cuota/RETA,
factura y los modelos censales/IVA (303, 390, 036) dejan de interceptar, para que esas preguntas
alcancen recuperación + citas. Las guías de materias que siguen fuera de alcance se conservan
intactas, y ninguna guía conservada puede sombrear una pregunta respondible.

**Alcance exacto de la retirada (OQ-4).** Se retiran los siguientes matchers/constantes (y sus
constantes de contenido asociadas): `ivaGuide`/`IVA_GUIDE`, `facturaGuide`/`FACTURA_GUIDE`,
`quotaGuide`/`RETA_GUIDE`, las entradas `303`, `390`, `036` de `MODEL_GUIDES`/`modelGuide`, y
`modelsOverview`/`MODELS_OVERVIEW`. **Se conservan** `MODEL_130`, `MODEL_131`, `MODEL_100`
(guías procedimentales IRPF), `GASTOS_GUIDE`, `LABOR_GUIDE`, `ACCOUNTING_GUIDE`, `COMPANY_GUIDE`,
`FORAL_GUIDE`, `NON_RESIDENT_GUIDE`, `ISD_GUIDE`, `ITP_GUIDE`, `PRESENTATION_GUIDE`.

**No sombrear (OQ-4).** Una guía conservada no puede capturar una pregunta ahora respondible. En
concreto, `gastosGuide` (que dispara con `gastos` + `deduc`) no debe interceptar una pregunta de
IVA («¿qué gastos son deducibles en el IVA?»), que debe llegar a recuperación. La regla se aplica a
cualquier matcher conservado que pueda colisionar con IVA/RETA/censal.

**Acceptance criteria**

- `gestorGuide` devuelve `null` para un mensaje de IVA («¿cuánto IVA pago?»), de cuota/RETA
  («¿cuánto es la cuota de autónomos?»), de factura+IVA, de «modelo 303»/«modelo 390»/«modelo 036»
  y de «qué modelos presenta un autónomo» — de modo que la petición pasa al guard (que ya no las
  bloquea) y luego a recuperación.
- `gestorGuide` sigue devolviendo sus guías para las materias fuera de alcance: ITP, ISD, no
  residentes, Impuesto sobre Sociedades, régimen foral, y las guías procedimentales IRPF que se
  conservan. Un test por guía conservada afirma que `gestorGuide` no es `null` para un mensaje
  representativo.
- Ninguna guía conservada sombrea una materia respondible: `gestorGuide('¿qué gastos son deducibles
  en el IVA?')` devuelve `null` (no `GASTOS_GUIDE`), de modo que la pregunta llega a recuperación.
- End-to-end: «¿cuánto IVA pago?» con el corpus fixture ampliado produce `'answer'` (con cita) o
  `'insufficient_evidence'`/`'clarification'`, y **no** `'guide'`; el adapter `callCount === 1`
  cuando la evidencia es suficiente.
- End-to-end: «preséntame el 303» sigue produciendo `out_of_scope` con `reasonCode === 'filing_request'`
  y `adapter.callCount === 0` (la petición de presentación gana por delante de la guía y de la
  recuperación).
- Ninguna constante retirada queda referenciada en `src/`; `tsc`/eslint no reporta imports muertos.

**Scenarios:** AC-002-16 – AC-002-20 → `20-acceptance/AC-002-gestor-guides.md`

---

## Task 6 — Prohibir cuantías hardcodeadas, aviso de año y abstención honesta

**Scope:** todo `src/` (en particular `src/content/` y `src/prompts/`), más el comportamiento del
aviso de año ya existente en `src/service/responses.ts` (`yearNoticeFor`) y la abstención honesta
(OQ-2).

**Acceptance criteria**

- Ningún módulo de `src/` contiene una cuantía vigente hardcodeada (cuota de autónomos, base de
  cotización, tramo, tipo de IVA, tarifa, importe o porcentaje numérico de un tributo). La
  comprobación es una auditoría de lectura: `grep` sobre `src/` de patrones de cifra (`\d+ %`, `€`,
  `cuota de`, `tipo general`) no devuelve ninguna constante de consejo que fije una cifra. Las
  únicas cifras permitidas en `src/` son: identificadores de modelo (`303`, `390`, …), plazos que
  salen del corpus, y valores de configuración (`retrievalTopK`, `maxMessageChars`, etc.).
- La política del sistema (`SYSTEM_POLICY`) sigue prohibiendo completar cifras fuera de los pasajes
  («no completes cifras»); ninguna cifra se inyecta desde una constante de contenido.
- Aviso de año: `yearNoticeFor` sigue operando igual, y ahora se aplica también a las materias
  nuevas. Una pregunta de IVA/RETA/censal que nombre un año distinto de `corpusTaxYear` (2025)
  produce una respuesta cuyo `yearNotice` nombra 2025 y el año preguntado; y no aparece cuando la
  pregunta nombra solo 2025 o ningún año. Un test de servicio con el corpus fixture y un fake
  adapter que cita un pasaje recuperado afirma que «¿cuánto IVA pago en 2024?» devuelve `'answer'`
  con `yearNotice` definido que contiene «2025» y «2024», y que «¿cuánto IVA pago?» no lleva aviso.
- **Abstención honesta (OQ-2).** Una pregunta cuya respuesta no está en el corpus debe abstenerse,
  no inventar. Con el corpus fixture, un mensaje que no recupera evidencia suficiente (p. ej. una
  cuantía o un trámite que el corpus no fija) produce `'insufficient_evidence'` con handoff, o
  `'clarification'` — nunca una cifra o dato inventado. El riesgo de recall se acepta: el
  `insufficient_evidence` es la salida honesta, sin gate de medición de recall.

**Scenarios:** AC-002-21 – AC-002-23 → `20-acceptance/AC-002-no-hardcoded-quantities.md`

---

## Task 7 — Disclaimer reforzado para respuestas no-IRPF

**Scope:** `src/content/strings.ts`, `src/domain/allowed-norms.ts` (o módulo adyacente),
`src/service/answer-question.ts`, `src/service/types.ts`, `src/components/AnswerBlock/AnswerBlock.tsx`.
Decision OQ-3: cuando una respuesta se apoya en una norma distinta del IRPF (IVA, RETA/cotización,
alta de autónomo), se muestra un disclaimer reforzado además del disclaimer de IA estándar.

**Decisión de diseño especificada.** El disclaimer reforzado es un **campo separado y derivado**,
no un `kind` nuevo y no un valor que venga del usuario: `AnswerResponse` gana el campo opcional
`scopeDisclaimer?: string`, que el servicio rellena **solo** cuando al menos una cita validada tiene
un `normId` perteneciente a las seis normas no-IRPF (las de la Task 1). Se deriva del conjunto de
normas que respondieron, nunca del texto del usuario. El conjunto de normas no-IRPF es un conjunto
commitado (los seis `normId` de la tabla de la Task 1) en `allowed-norms.ts` o adyacente.

**Acceptance criteria**

- `src/content/strings.ts` exporta una única constante `REINFORCED_SCOPE_DISCLAIMER` con el texto
  exacto:

  `Esta respuesta se apoya en una norma distinta del IRPF (IVA, Seguridad Social o el alta de autónomos). Es información general: confirma las cuantías y plazos vigentes con la administración competente.`

- Existe un conjunto commitado de normas no-IRPF (los seis `normId` de la Task 1) y un predicado que
  dice si un `normId` pertenece a él.
- `AnswerResponse` declara `scopeDisclaimer?: string`. El servicio (`answerQuestion`/`resolveOutcome`)
  lo rellena con `REINFORCED_SCOPE_DISCLAIMER` **si y solo si** alguna de las citas validadas de la
  respuesta pertenece al conjunto no-IRPF. Una respuesta que cita solo IRPF no lleva el campo; una
  que cita una norma no-IRPF lo lleva.
- Render: `AnswerBlock` muestra `scopeDisclaimer` en el pie de la respuesta, adyacente al
  `disclaimer` de IA (justo después), ambos visibles. No sustituye ni oculta el disclaimer de IA, y
  no se antepone al cuerpo de la respuesta (no «traga» la respuesta). Es un texto honesto, no
  alarmista.
- El disclaimer de IA estándar y el handoff siguen intactos en toda respuesta (§ no se tocan).

**Scenarios:** AC-002-24 – AC-002-26 → `20-acceptance/AC-002-reinforced-disclaimer.md`

---

## Task 8 — Corregir la copia de rechazo y los enlaces externos de Notice

**Scope:** `src/service/answer-question.ts` (copia de rechazo) y `src/components/Notice/Notice.tsx`
(enlaces externos). Dos defectos señalados en la revisión del gate.

**Defecto A — copia de rechazo.** La plantilla de `scopeResponse` dice «aquí solo explico el IRPF»,
falso una vez que el producto cubre IVA/RETA/censal (Task 3). La copia se corrige para nombrar solo
el alcance sin afirmar que el producto es solo-IRPF.

**Defecto C — enlaces externos de Notice.** Los enlaces externos de `Notice` (la lista `links` de
guías y, en su caso, cualquier enlace http(s)) no llevan `target="_blank"` ni
`rel="noopener noreferrer"`. El enlace de handoff (`mailto:`) está exento: abre el cliente de
correo, no una pestaña nueva.

**Acceptance criteria**

- `scopeResponse` produce, para toda materia fuera de alcance, una `explanation` que **no** contiene
  «aquí solo explico el IRPF» (ni «solo explico el IRPF»). La plantilla pasa a nombrar la materia y
  el órgano competente sin la afirmación de solo-IRPF. Un test afirma que la cadena «explico el
  IRPF» no aparece en el payload de una respuesta `out_of_scope`.
- Todo `<a>` renderizado por `Notice` cuyo `href` es `http://` o `https://` lleva
  `target="_blank"` y `rel="noopener noreferrer"`; el `<a>` de handoff (`mailto:`) queda sin
  `target`/`rel`. Un test de componente (React Testing Library) afirma los atributos en un enlace
  externo y su ausencia en el enlace `mailto:`.

**Scenarios:** AC-002-27 – AC-002-28 → `20-acceptance/AC-002-copy-and-links.md`

---

## Task 9 — Actualizar tests que fijaban la conducta vieja (incl. fixture `'iva'`)

**Scope:** los tests de la especificación 001 que codificaban la conducta que esta spec cambia. No
se toca código de producción aquí; solo las aserciones que describían el comportamiento antiguo.

**Contexto (docs/TESTING.md §Tests That Encode a Defect).** Estos tests fijan la conducta que esta
spec corrige; cambiarlos es lo esperado. Las aserciones afectadas están en
`test/acceptance/AC-001-scope-guard.test.ts` (líneas ~28-39 IVA→guide, ~62-69 social_security→out_of_scope,
~123-137 autonomo_registration→out_of_scope con steps, ~139-152 IVA mixto→guide),
`test/unit/text-and-guards.test.ts` (líneas ~49-63 clasificación de social_security y
autonomo_registration, y la tabla `theProductIsAskedToAct` con entradas `social_security`), y
**`test/acceptance/AC-001-chat-ui.test.ts` línea 169** (fixture `reasonCode: 'iva'`, que deja de
compilar cuando la unión se estrecha). El procedimiento de autorización de docs/TESTING.md se
cumple documentando el cambio en el commit/PR; la spec 002 es la autorización.

**Acceptance criteria**

- `npm test` pasa en verde con las aserciones viejas reemplazadas por la conducta nueva (sin dejar
  ninguna aserción que espere `out_of_scope`/`guide` para IVA, social_security o
  autonomo_registration).
- Las aserciones nuevas de `AC-001-scope-guard.test.ts` y `text-and-guards.test.ts` coinciden con
  las de los escenarios AC-002-08..AC-002-20 (misma conducta, distinto archivo): `classifyScope`
  devuelve `null` para las tres materias; las seis restantes siguen clasificando; y el flujo
  end-to-end alcanza recuperación para IVA/RETA/alta.
- El fixture `reasonCode: 'iva'` de `AC-001-chat-ui.test.ts` se sustituye por un `reasonCode`
  todavía válido (p. ej. `'ibi'`) con su `topicLabel` y `officialBody` coherentes; ningún archivo
  bajo `test/` referencia ya `reasonCode: 'iva' | 'social_security' | 'autonomo_registration'` como
  valor de un payload `out_of_scope`.
- Ningún test existente de 001 pierde su ID de escenario (`AC-001-NN`) al actualizarse: el ID se
  conserva en el nombre del test, solo cambia la aserción. *(Si una aserción queda sin escenario
  equivalente, se documenta en el commit en lugar de borrarla en silencio.)*
- La cobertura de la conducta nueva vive en `test/acceptance/AC-002-*.test.ts` (con el ID
  `AC-002-NN` en el nombre del test), no solo en los tests de 001 corregidos.

**Scenarios:** AC-002-29 – AC-002-30 → `20-acceptance/AC-002-legacy-tests.md`

---

## Task 10 — Actualizar runbook y nota de volumen de ADR 0001

**Scope:** `docs/RUNBOOK.md` y la nota de volumen en `docs/adr/0001-lexical-retrieval.md`.

**Acceptance criteria**

- `docs/RUNBOOK.md` §1 ya no dice «the two covered norms» ni lista solo `BOE-A-2006-20764` y
  `BOE-A-2007-6820`: nombra el conjunto ampliado (las ocho normas por título) y conserva las mismas
  instrucciones de sync (mismo comando, misma semántica de exit code 0/1, mismos invariantes).
- La sección «BOE changed / parsing broke» sigue siendo correcta para el conjunto ampliado: un
  parse roto de cualquier norma detiene el sync y no escribe; los fixtures por norma nueva siguen
  la misma convención `test/fixtures/boe/`.
- `docs/adr/0001-lexical-retrieval.md` recoge que el corpus pasó de 2 a 8 normas (~396 → varios
  miles de pasajes), remite a `docs/adr/0003-advisor-scope-expansion.md` para la decisión de
  alcance, y **no** introduce ninguna obligación de medir recall (OQ-2: el riesgo se acepta, sin
  gate de medición). La condición de revisión existente (~50.000 pasajes) queda como está.

**Scenarios:** AC-002-31 – AC-002-32 → `20-acceptance/AC-002-docs.md`

---

## Task 11 — Nuevo ADR 0003 — expansión de alcance

**Scope:** `docs/adr/0003-advisor-scope-expansion.md` (el siguiente número libre; verificado:
`docs/adr/` solo contiene 0001 y 0002). Registra la decisión de pasar de explicador IRPF a cubrir
el ciclo fiscal del autónomo.

**Acceptance criteria**

- `docs/adr/0003-advisor-scope-expansion.md` existe con la estructura ADR del repo (Context,
  Decision, Alternatives considered, Consequences).
- Registra la **decisión**: el producto pasa de explicador solo-IRPF a cubrir censal, LGSS/RETA,
  IVA e IAE con el mismo estándar de recuperación + citas; y que filing/ITP/ISD/IBI/no residentes/
  Sociedades siguen fuera.
- **Alternativas consideradas** y rechazadas: (a) handoff-only (mantener todo no-IRPF como
  derivación), (b) reframe cosmético (seguir explicando solo IRPF y reescribir el rechazo).
- **Consecuencias**: superficie del corpus (8 normas, ~miles de pasajes), responsabilidad legal
  (OQ-3: disclaimer reforzado + handoff intactos), y la nota de volumen de ADR 0001.
- Registra el **riesgo aceptado** (OQ-2): la recuperación léxica puede no discriminar en el corpus
  ampliado; el `insufficient_evidence` es la salida honesta, sin gate de medición de recall.
- No cita contenido de competidores; las fuentes son boe.es y el repo.

**Scenarios:** AC-002-33 → `20-acceptance/AC-002-adr.md`

---

## Explicitly out of scope for this spec (non-goals)

No implementado, no testeado, no esbozado más allá de lo que un criterio exige:

- La presentación, firma o representación efectiva ante AEAT/TGSS — sigue `filing_request` →
  handoff, sin cambios.
- Expansión de ITP, ISD, IBI, no residentes ni Impuesto sobre Sociedades — siguen fuera de alcance
  con su guía/derivación actuales.
- El TRLRHL (RD Leg. 2/2004) — aloja el IBI, queda fuera (OQ-1).
- Cualquier cálculo numérico de impuestos (estimador IRPF, liquidación de IVA, cuota RETA).
- Una base de datos de deducciones autonómicas o escala autonómica.
- Un `kind` de respuesta nuevo — las materias nuevas usan el `kind 'answer'` ordinario.
- Embeddings o un vector store — se conserva la recuperación léxica (ADR 0001).
- Rediseño de UI o `15-design.md` — es la etapa 1.5, fuera de esta tarea.
- Cuentas de usuario, pagos, suscripciones, subida de documentos, voz.
- Medición de recall como gate (OQ-2: aceptado, sin medición).

## Open questions — resueltas en la human gate

Todas resueltas; se listan para dejar constancia y no reabrirlas:

| # | Decisión |
|---|---|
| OQ-1 | **GO** con las seis normas (ids verificados en la tabla de la Task 1). IAE = solo RD Leg. 1175/1990; TRLRHL fuera. |
| OQ-2 | **Riesgo aceptado**, sin gate de recall. `insufficient_evidence` es la salida honesta (aserciones en Task 6 y ADR 0003). |
| OQ-3 | **Disclaimer reforzado**: constante `REINFORCED_SCOPE_DISCLAIMER`, campo separado y derivado `scopeDisclaimer` en `AnswerResponse` (Task 7). |
| OQ-4 | **Guías se conservan** (`MODEL_130/131/100` y las de fuera de alcance); se retira solo IVA/factura/RETA/303/390/036/modelsOverview; ninguna guía conservada sombrea una materia respondible (Task 5). |
| OQ-5 | **ADR nuevo** `docs/adr/0003-advisor-scope-expansion.md` (Task 11); la nota de ADR 0001 remite a 0003 (Task 10). |

## Non-enforceable in code, recorded for the gate

- Los identificadores BOE-A se verificaron contra boe.es en tiempo de spec (HTTP 200); el Coder los
  escribe tal cual. Ninguna aserción automática puede probar que un `BOE-A-…` es el real; la
  verificación es previa a `/build`, no un gate de test.
- La discriminación de la recuperación léxica en el corpus ampliado no se mide en esta spec (OQ-2);
  se acepta el riesgo documentado en ADR 0003.
