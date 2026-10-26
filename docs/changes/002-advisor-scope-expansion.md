# 002-advisor-scope-expansion

> Spec pipeline archive. Original source: `specs/002-advisor-scope-expansion/` (deleted by this script).
> Archived: 2026-10-26

## Original ask

# 002 — De explicador de IRPF a asesor fiscal

## Lo que pasó

Pregunté a la app:

> Quiero darme de alta de autónomo. Guíame

y me contestó:

> **Fuera del alcance de esta herramienta**
> Darse de alta como autónomo no es una cuestión de IRPF: es un trámite censal en Hacienda y de afiliación en la Seguridad Social. Estos son los pasos habituales; confirma tu caso con la AEAT y la Tesorería General de la Seguridad Social.
> 1. Comprueba los requisitos…
> 2. Presenta el alta censal en Hacienda con el modelo 036 (o el 037)…
> 3. Solicita el alta en el RETA…
> 4. Licencia municipal de apertura…
> 5. Presenta el IVA (modelo 303) y el IRPF (modelo 130/131) trimestralmente…
> 6. Revisa la tarifa plana y las bonificaciones…

Sigue demasiado centrada en IRPF como para ser un asesor fiscal. No me está asesorando: me está leyendo un folleto.

## Qué está mal, exactamente

1. **Corta antes de razonar.** El guard de alcance decide por primera coincidencia de patrón y devuelve la respuesta sin consultar el corpus ni el modelo. Ninguna cita, ninguna norma, ningún razonamiento.
2. **El contenido es una constante.** Los seis pasos son texto fijo en el código. No dependen de la pregunta, ni del año, ni de la norma vigente. Eso no es asesoramiento: es un aviso con formato de respuesta.
3. **Se contradice a sí misma.** El encabezado dice «aquí solo explico el IRPF» y, tres líneas después, me manda presentar el **modelo 303 (IVA)** y elegir **base de cotización** — las dos materias que el propio guard rechaza por separado (`iva`, `social_security`).
4. **No responde a la pregunta.** Quien empieza de autónomo no necesita seis generalidades: necesita saber qué decisiones tiene que tomar, en qué orden, y qué consecuencias fiscales tiene cada una.

## Qué quiero

Que la app pueda guiar el alta de autónomo y las materias conexas con el mismo estándar que ya aplica al IRPF: respuesta fundamentada en norma del BOE, citada, sin inventar nada, y derivación a un asesor humano cuando la respuesta dependa de mis datos o de cuantías que caducan cada año.

En concreto, una pregunta de alta de autónomo debería poder responderme, con cita:

- **Alta censal (036/037)**: qué declara, cuándo se presenta y qué implicaciones tiene (epígrafe de IAE, alta a efectos de IVA y de IRPF).
- **RETA**: obligación de alta, ventana temporal, y que la cuota es gasto deducible del IRPF.
- **IVA**: cuándo nace la obligación de presentar el 303 y qué supone repercutir.
- **Consecuencias en IRPF**, que es lo que la app ya sabe hacer: pago fraccionado 130 vs 131, retención sobre facturas de actividad profesional, estimación directa vs módulos.

Y que me diga **qué decisión me toca a mí**, no solo qué trámite existe.

## Alcance decidido

Alcance asesor completo: la app deja de ser un explicador de IRPF y pasa a cubrir el ciclo fiscal del autónomo.

1. **Ampliar el corpus** más allá de Ley 35/2006 + RD 439/2007: normas censales (LGT y reglamento censal), Seguridad Social/RETA (LGSS y su desarrollo), IVA (Ley 37/1992) e IAE.
2. **Recortar el guard**: `iva`, `social_security` y `autonomo_registration` dejan de ser `out_of_scope` y pasan a responderse con recuperación + citas, como cualquier pregunta de IRPF.
3. **Sigue fuera de alcance**: la presentación efectiva de la declaración (handoff), ITP, ISD, IBI, no residentes e Impuesto sobre Sociedades — contribuyentes y tributos distintos del IRPF de una persona física. Confirmar en la revisión humana.
4. **Eliminar la plantilla fija** de alta de autónomo: ninguna respuesta de asesoramiento puede salir de una constante del código.

## Límites que no se cruzan

- **Ninguna cuantía vigente hardcodeada** (cuota, tramos, tipos): o sale del corpus del ejercicio, o se remite a la fuente oficial. El corpus es de 2025 y ya existe el aviso de año.
- **El epígrafe de IAE concreto** depende de la actividad: se explica el criterio de clasificación, no se adivina el epígrafe.
- **La app no presenta modelos ni tramita**: sigue informando, no actuando.
- **El disclaimer de IA se mantiene** en toda respuesta.

## Preguntas abiertas

- Lista exacta de normas a incorporar: nombres propuestos arriba; los identificadores BOE se verifican contra boe.es antes de añadirlos a la lista permitida.
- Volumen: hoy son 396 pasajes con dos normas. Multiplicar por cinco o diez normas exige comprobar que la recuperación léxica sigue discriminando y que el prompt no se desborda.
- Riesgo legal de explicar IVA y cotización sin ser asesoría: mismo régimen de responsabilidad que ya asume hoy con el IRPF, con el disclaimer y el handoff intactos.

## Evidencia en el repositorio

- `src/content/scope-topics.ts:92` — patrón `autonomo_registration`, primera coincidencia gana.
- `src/service/answer-question.ts:75-95` — la respuesta de alcance se construye antes de retrieval y sin modelo.
- `src/content/autonomo.ts:3-19` — la constante con la explicación y los seis pasos que recibí.
- `src/domain/allowed-norms.ts:11` — solo dos normas permitidas.
- `corpus/corpus.json` — 396 pasajes, ejercicio 2025.
- `test/acceptance/AC-001-scope-guard.test.ts:129` y `test/unit/text-and-guards.test.ts:59` — la conducta actual está fijada por tests.

## Tasks

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
| 12 | Recuperación: vocabulario coloquial → vocabulario normativo | AC-002-34 – AC-002-35 |
| 13 | Política del sistema: identidad ampliada y preguntas de procedimiento | AC-002-36 |

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

---

## Task 12 — Recuperación: vocabulario coloquial → vocabulario normativo

**Scope:** `src/retrieval/expand.ts` (la capa de sinónimos léxicos). Corrige que la recuperación
léxica no encontrara la norma que gobierna el trámite porque el BOE redacta el procedimiento con
vocabulario normativo («declaración de alta en el Censo de Empresarios, Profesionales y
Retenedores», «sujetos pasivos», «devengo», «declaraciones-liquidaciones») y el contribuyente
pregunta con el suyo («darme de alta de autónomo», «empezar a presentar el IVA»).

**Fallo medido (fase 3 — verificación en despliegue).** En una ejecución end-to-end real (app,
LLM y corpus reales), las preguntas que motivan esta spec devolvían abstenciones honestas porque la
recuperación léxica clasificaba la norma que gobierna el procedimiento por debajo del corte:

- `BOE-A-2007-15984#a9` (declaración censal de alta) estaba en el **puesto 95** para «Quiero darme
  de alta de autónomo. Guíame»; tras el arreglo pasa al **puesto 2**.
- El artículo de obligación de IVA estaba en el **puesto 84** para «¿Cuándo empiezo a presentar el
  IVA si soy autónomo?» (por debajo del `retrievalTopK`, por lo que nunca entraba en el bundle);
  tras el arreglo pasa al **puesto 2**.

**Alcance del arreglo.** El arreglo está confinado a la capa de expansión (`PHRASE_SYNONYMS` en
`expand.ts`): se añaden entradas que mapean el vocabulario coloquial del alta y del inicio de
obligación de IVA al vocabulario normativo del BOE. **No** se baja `minRetrievalScore` ni se sube
`retrievalTopK`; el corte y el umbral quedan como estaban.

**Acceptance criteria**

- La capa de expansión mapea «darme de alta / darse de alta / alta como autónomo / empezar como
  autónomo / iniciar actividad» a los términos censales del BOE (censo, censal, empresarios,
  profesionales, retenedores, declaración, alta, 036, 037), de modo que la pregunta de alta
  recupera `BOE-A-2007-15984#a9` en el bundle.
- La capa de expansión mapea, **solo** cuando el mensaje nombra IVA y un verbo de presentación/
  obligación, los términos normativos de la obligación (devengo, sujeto/sujetos pasivo/pasivos,
  autoliquidación, liquidación, declaración, obligaciones, comienzo, actividades, plazos, 303), de
  modo que la pregunta de inicio de IVA recupera un pasaje de Ley 37/1992 redactado como obligación.
- `minRetrievalScore` y `retrievalTopK` no cambian de valor (un test de configuración o lectura del
  diff lo confirma): el arreglo no baja el umbral ni sube el corte.
- Los escenarios AC-002-34 y AC-002-35 (que corren contra `corpus/corpus.json`, no el fixture)
  pasan: el bundle contiene el pasaje gobernante y el turno lo cita (AC-002-34), y el turno responde
  con la norma de IVA y su `scopeDisclaimer` (AC-002-35).

**Limitación aceptada.** `BOE-A-1992-28740#a164` permanece en el **puesto 13**, por debajo del
corte. Llevarlo al bundle exigiría un cambio de scoring (no de vocabulario), que se difiere a una
spec posterior. No se persigue en esta tarea.

**Procedencia.** Ronda de remediación 1, dentro del intento 2 de la fase 3 (verificación en despliegue):
el fallo se detectó en una ejecución live del sistema ya desplegado, no en los tests de la spec original.

**Scenarios:** AC-002-34 – AC-002-35 → `20-acceptance/AC-002-retrieval-vocabulary.md`

---

---

## Task 13 — Política del sistema: identidad ampliada y preguntas de procedimiento

**Scope:** `src/prompts/system-policy.ts` (la única constante de política del sistema, situada en
el rol `system` y en ningún otro sitio). Corrige que la política del modelo se hubiera quedado en
la identidad v1 mientras el corpus, el guard y la unión ya se habían ampliado.

**Defecto.** `SYSTEM_POLICY` seguía presentando al asistente como explicador solo-IRPF
(«…la normativa del IRPF español…»), de modo que el modelo leía un pasaje censal o de IVA como
fuera de dominio y rechazaba una respuesta que el corpus, el guard y la unión ya habían puesto en
alcance. La ejecución end-to-end live lo expuso: preguntas de IVA y de alta censal obtenían
abstenciones pese a que la recuperación ya entregaba los pasajes gobernantes (Task 12).

**Por qué ningún escenario existente lo capturó.** Los 35 escenarios previos afirmaban el corpus,
el guard, la unión de respuestas, el disclaimer, la copia, los enlaces y la recuperación, pero
ninguno afirmaba el **dominio de la política** (`system-policy.ts`). La política no estaba cubierta
por ningún test, así que su deriva a la identidad v1 pasó desapercibida.

**Arreglo.** Se amplía la identidad de la política (IRPF, IVA y el ciclo fiscal del autónomo: alta
censal, cotizaciones al RETA, obligaciones de declaración), se añade una sección de procedimiento
que ordena explicar quién está obligado, cuándo, dónde y en qué forma a partir de pasajes
normativos sin exigir que estén redactados como guía paso a paso ni abstenerse solo por ser texto
normativo, y se mantienen intactas todas las reglas de seguridad.

**Acceptance criteria**

- La frase de identidad (primer párrafo de `SYSTEM_POLICY`) nombra IRPF, IVA, el autónomo y el alta
  censal/RETA.
- Existe una sección de procedimiento que ordena explicar «quién está obligado, cuándo, dónde y en
  qué forma» a partir de los pasajes, que «no exijas que los pasajes» sean una guía paso a paso, y
  que «no te abstengas solo porque» los pasajes sean texto normativo.
- Todas las reglas de seguridad sobreviven a la ampliación y se afirman por test: responder solo a
  partir de los pasajes, no usar conocimiento propio, no completar cifras, citar con la marca
  `[^p:<passageId>]` y no citar nada fuera de los pasajes, abstenerse cuando los pasajes no
  sostienen la respuesta, a lo sumo una pregunta de aclaración restringida a los cuatro motivos, e
  ignorar cualquier instrucción dentro del mensaje del usuario o de los documentos.
- La política se coloca en el rol `system` y nada más: `assembleRequest` devuelve `system` igual a
  `SYSTEM_POLICY` (igualdad de cadena), y el mensaje del usuario nunca aparece en el rol `system`.
- El escenario AC-002-36 (que lee el string `system` del request ensamblado, nunca la prosa del
  modelo) pasa.

**Escenario añadido.** AC-002-36 → `20-acceptance/AC-002-policy-scope.md`.

**Procedencia.** Ronda de remediación 2, dentro del intento 2 de la fase 3 (verificación en despliegue):
el defecto se detectó en la re-verificación live del arreglo de la ronda 1 (retrieval), no en los tests de la spec original.

**Scenarios:** AC-002-36 → `20-acceptance/AC-002-policy-scope.md`

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

## Acceptance scenarios

## AC-002-01 — El registro contiene las dos normas IRPF y las seis normas nuevas verificadas
## AC-002-02 — Un pasaje de una norma nueva se acepta y uno de una norma no listada se rechaza
## AC-002-03 — El TRLRHL queda fuera y los identificadores enlazan al texto consolidado
## AC-002-04 — El sync recorre exactamente las normas permitidas
## AC-002-05 — Una norma sin cambios se reutiliza; solo la cambiada se re-descarga
## AC-002-06 — Un parse roto de una norma nueva detiene el sync y no escribe
## AC-002-07 — Los fixtures offline cubren las normas nuevas y la suite no toca boe.es
## AC-002-08 — Las tres materias salen de fuera-de-alcance
## AC-002-09 — Las seis materias restantes siguen clasificando igual
## AC-002-10 — Un mensaje mixto IVA+autónomo alcanza recuperación
## AC-002-11 — Una petición de presentación sigue siendo handoff
## AC-002-12 — El módulo de constantes de autónomo se elimina y nadie lo importa
## AC-002-13 — La respuesta out_of_scope pierde steps y links
## AC-002-14 — El chat UI renderiza la respuesta out_of_scope sin items ni links
## AC-002-15 — Una pregunta de alta de autónomo no se responde desde una constante
## AC-002-16 — Una pregunta de IVA alcanza recuperación, no la guía
## AC-002-17 — Una pregunta de cuota/RETA alcanza recuperación, no la guía
## AC-002-18 — Los modelos censales y de IVA dejan de interceptar
## AC-002-19 — Las guías de materias fuera de alcance y las IRPF conservadas siguen funcionando
## AC-002-20 — Una guía conservada no sombrea una pregunta respondible
## AC-002-21 — Ninguna constante de consejo fija una cuantía vigente
## AC-002-22 — El aviso de año se aplica a las materias nuevas y no sin año distinto
## AC-002-23 — Una pregunta sin respuesta en el corpus se abstiene, no inventa
## AC-002-24 — La constante existe con el texto exacto
## AC-002-25 — El campo es separado y se deriva del conjunto de normas que respondieron
## AC-002-26 — Se renderiza adyacente al disclaimer de IA y no traga la respuesta
## AC-002-27 — La copia de rechazo deja de decir «aquí solo explico el IRPF»
## AC-002-28 — Los enlaces externos de Notice llevan target/rel y el mailto no
## AC-002-29 — Los tests de 001 que fijaban la conducta vieja se actualizan conservando su ID
## AC-002-30 — El fixture reasonCode 'iva' se sustituye por uno todavía válido
## AC-002-31 — El runbook describe el corpus ampliado
## AC-002-32 — La nota de ADR 0001 recoge el crecimiento y no impone medir recall
## AC-002-33 — El ADR registra la decisión, las alternativas y el riesgo aceptado
## AC-002-34 — La pregunta de alta recupera el artículo censal y el turno lo cita
## AC-002-35 — La pregunta de inicio de IVA recupera la obligación y el turno responde con el disclaimer
## AC-002-36 — La identidad ampliada, la instrucción de procedimiento y las reglas de seguridad conviven en la política

## Verification

# 25-verification — spec 002 (advisor scope expansion)

Verifier stage 4, attempt 1, phase 1 (no remediation rounds yet).
Branch: `spec/002-advisor-scope-expansion` (dirty working tree, nothing committed).
Conformance tier: **mvp** (property tests and mutation testing are out of tier).

Information barrier respected: `00-informal.md` was not read. Verification is against
`10-tasks.md`, `20-acceptance/`, and `15-design.md` only.

## Overall verdict

**PASS** — every runnable gate ran and produced no findings in this spec's diff.

The two design-principles FAILs in the whole-repo run are pre-existing and **byte-identical
to `main`** (confirmed by empty `git diff main -- <path>` for each), so they are out of scope
for this spec; the diff-scoped gate (`-BaseRef main`) is clean (exit 0, 0 FAIL, 0 WARN). No
gate BLOCKed, no in-diff finding was produced.

---

## Evidence: scenario traceability

command: .standards/scripts/check-scenario-traceability.sh
exit: 0
at: 2026-10-25T17:40:30Z

Scenario IDs found: 33 live, 88 archived

PASS AC-002-01 — traced to a test
PASS AC-002-02 — traced to a test
PASS AC-002-03 — traced to a test
PASS AC-002-04 — traced to a test
PASS AC-002-05 — traced to a test
PASS AC-002-06 — traced to a test
PASS AC-002-07 — traced to a test
PASS AC-002-08 — traced to a test
PASS AC-002-09 — traced to a test
PASS AC-002-10 — traced to a test
PASS AC-002-11 — traced to a test
PASS AC-002-12 — traced to a test
PASS AC-002-13 — traced to a test
PASS AC-002-14 — traced to a test
PASS AC-002-15 — traced to a test
PASS AC-002-16 — traced to a test
PASS AC-002-17 — traced to a test
PASS AC-002-18 — traced to a test
PASS AC-002-19 — traced to a test
PASS AC-002-20 — traced to a test
PASS AC-002-21 — traced to a test
PASS AC-002-22 — traced to a test
PASS AC-002-23 — traced to a test
PASS AC-002-24 — traced to a test
PASS AC-002-25 — traced to a test
PASS AC-002-26 — traced to a test
PASS AC-002-27 — traced to a test
PASS AC-002-28 — traced to a test
PASS AC-002-29 — traced to a test
PASS AC-002-30 — traced to a test
PASS AC-002-31 — traced to a test
PASS AC-002-32 — traced to a test
PASS AC-002-33 — traced to a test

✔ Scenario traceability check: every scenario traced, every reference resolves.

---

## Evidence: full test suite

command: npm test
exit: 0
at: 2026-10-25T17:40:45Z

...
✓ test/acceptance/AC-002-corpus-sync.test.ts (7 tests) 1457ms
✓ test/acceptance/AC-001-answer-orchestration.test.ts (9 tests) 1487ms
✓ test/acceptance/AC-001-corpus-sync.test.ts (7 tests) 1668ms
✓ test/acceptance/AC-001-app-scaffold-and-config.test.ts (9 tests) 99ms
✓ test/acceptance/AC-001-citation-validation.test.ts (6 tests) 539ms
✓ test/acceptance/AC-002-scope-guard.test.ts (6 tests) 550ms
✓ test/unit/text-and-guards.test.ts (84 tests) 479ms
✓ test/unit/sync-and-format.test.ts (6 tests) 655ms
✓ test/acceptance/AC-001-health.test.ts (4 tests) 569ms
✓ test/unit/xml-and-parser.test.ts (12 tests) 64ms
✓ test/unit/format.test.ts (5 tests) 40ms
✓ test/unit/auth.test.ts (11 tests) 69ms
✓ test/unit/boe-fetcher.test.ts (12 tests) 37ms
✓ test/acceptance/AC-001-evidence-sufficiency.test.ts (5 tests) 96ms
✓ test/unit/gestor-guide.test.ts (10 tests) 22ms
✓ test/acceptance/AC-001-boe-parser.test.ts (5 tests) 51ms
✓ test/unit/chat-submit.test.ts (5 tests) 29ms
✓ test/acceptance/AC-001-chat-route.test.ts (8 tests) 2703ms
✓ test/acceptance/AC-001-lexical-retrieval.test.ts (6 tests) 31ms
✓ test/unit/config.test.ts (6 tests) 15ms
✓ test/unit/boundaries.test.ts (4 tests) 18ms
✓ test/acceptance/AC-001-docs.test.ts (8 tests) 22ms
✓ test/unit/corpus-artifact.test.ts (12 tests) 16ms
✓ test/acceptance/AC-002-allowed-norms.test.ts (3 tests) 12ms
✓ test/unit/normalize.test.ts (8 tests) 22ms
✓ test/unit/stores.test.ts (7 tests) 9ms
✓ test/unit/allowed-norms.test.ts (3 tests) 15ms
✓ test/acceptance/AC-002-adr.test.ts (6 tests) 16ms
✓ test/acceptance/AC-001-passage-model.test.ts (6 tests) 14ms
✓ test/unit/passage.test.ts (11 tests) 14ms
✓ test/acceptance/AC-002-docs.test.ts (6 tests) 13ms
✓ test/acceptance/AC-001-prompt-assembly.test.ts (5 tests) 8ms
✓ test/unit/composer.test.tsx (3 tests) 187ms
✓ test/acceptance/AC-002-copy-and-links.test.ts (6 tests) 498ms
✓ test/acceptance/AC-002-registration-path.test.ts (8 tests) 696ms
✓ test/acceptance/AC-002-reinforced-disclaimer.test.ts (9 tests) 1195ms
✓ test/acceptance/AC-001-chat-ui.test.ts (21 tests) 2213ms

 Test Files  44 passed (44)
      Tests  405 passed (405)
   Start at  18:40:25
   Duration  9.91s (transform 2.06s, setup 934ms, collect 23.13s, tests 22.14s, environment 2.66s, prepare 5.88s)

---

## Evidence: type-check

command: npx tsc --noEmit
exit: 0
at: 2026-10-25T17:41:20Z

(no output — clean)

---

## Evidence: production build

command: npm run build
exit: 0
at: 2026-10-25T17:42:00Z

> renta-clara@0.1.0 build
> next build

   ▲ Next.js 15.5.28
   - Environments: .env.local

   Creating an optimized production build ...
 ✓ Compiled successfully in 8.8s
   Linting and checking validity of types ...

 ⚠ The Next.js plugin was not detected in your ESLint configuration. See https://nextjs.org/docs/app/api-reference/config/eslint#migrating-existing-config
   Collecting page data ...
   Generating static pages (0/7) ...
 ✓ Generating static pages (7/7)
   Finalizing page optimization ...
   Collecting build traces ...

Route (app)                                 Size  First Load JS
┌ ○ /                                    7.73 kB         110 kB
├ ○ /_not-found                            995 B         104 kB
├ ƒ /api/auth/login                        133 B         103 kB
├ ƒ /api/auth/logout                       133 B         103 kB
├ ƒ /api/chat                              133 B         103 kB
├ ƒ /health                                133 B         103 kB
└ ƒ /login                               2.33 kB         105 kB
+ First Load JS shared by all             103 kB

(The build succeeds; the ESLint-plugin warning is a pre-existing config notice, not a
failure — `npm run lint` below is the authority for lint.)

---

## Evidence: complexity gate

command: npm run lint
exit: 0
at: 2026-10-25T17:41:20Z

> renta-clara@0.1.0 lint
> eslint .

(no output — zero violations; `complexity: [error,6]` and `no-explicit-any` pass)

---

## Evidence: design-principles gate

command: .standards/scripts/check-code-principles.sh .
exit: 1
at: 2026-10-25T17:42:40Z
scope: whole repo

Checking design principles in: . (tier: mvp)

PASS Complexity/KISS (java): no violations found
WARN Method body >20 lines (go): ./.standards/ci/templates/go-saga-lint.go:45:71:main:KISS_LINES=28
WARN Method body >20 lines (go): ./.standards/ci/templates/go-saga-lint.go:101:124:checkCompensationPairs:KISS_LINES=25
FAIL Cyclomatic complexity >6 (node): ./.standards/skills/hallmark/site/examples/cobalt-01/script.js:7:90::CC=10
WARN Method body >20 lines (node): ./.standards/skills/hallmark/site/examples/cobalt-01/script.js:7:90::KISS_LINES=41
WARN Method body >20 lines (node): ./.standards/skills/hallmark/site/examples/cobalt-01/script.js:93:225::KISS_LINES=43
WARN Method body >20 lines (node): ./src/components/SourceEntry/SourceEntry.tsx:17:41:SourceEntry:KISS_LINES=26
FAIL Cyclomatic complexity >6 (node): ./src/components/LoginForm/LoginForm.tsx:17:100:LoginForm:CC=8
WARN Method body >20 lines (node): ./src/components/LoginForm/LoginForm.tsx:17:100:LoginForm:KISS_LINES=79
WARN Method body >20 lines (node): ./src/components/Composer/Composer.tsx:27:64:Composer:KISS_LINES=31
WARN Method body >20 lines (node): ./src/components/Header/Header.tsx:14:35:Header:KISS_LINES=23

--- DRY ---
WARN Possible duplication (56x identical 4-line block, first at ./.next/types/app/api/auth/login/route.ts:122): >() /checkFields< /Diff< />
WARN Possible duplication (28x identical 4-line block, first at ./.next/types/app/api/auth/login/route.ts:123): checkFields< /Diff< /ParamCheck<RouteContext>, />()
WARN Possible duplication (12x identical 4-line block, first at ./.next/types/app/api/auth/login/route.ts:276): 'PATCH' /> />() /},
WARN Possible duplication (12x identical 4-line block, first at ./.next/types/app/api/auth/login/route.ts:120): 'OPTIONS' /> />() /},
WARN Possible duplication (12x identical 4-line block, first at ./.next/types/app/api/auth/login/route.ts:237): 'DELETE' /> />() /},
WARN Possible duplication (8x identical 4-line block, first at ./.next/types/app/api/auth/login/route.ts:199): > />() /checkFields< /'PUT'
WARN Possible duplication (8x identical 4-line block, first at ./.next/types/app/api/auth/login/route.ts:160): > />() /checkFields< /'POST'
WARN Possible duplication (8x identical 4-line block, first at ./.next/types/app/api/auth/login/route.ts:277): > />() /checkFields< /'PATCH'
WARN Possible duplication (8x identical 4-line block, first at ./.next/types/app/api/auth/login/route.ts:121): > />() /checkFields< /'OPTIONS'
WARN Possible duplication (8x identical 4-line block, first at ./.next/types/app/api/auth/login/route.ts:82): > />() /checkFields< /'HEAD'

--- YAGNI ---
WARN Empty method body (java): ./.standards/ci/templates/archunit/OutboxArchRules.java:30
WARN Empty method body (java): ./.standards/ci/templates/archunit/SagaArchRules.java:33
PASS YAGNI (go): no premature abstractions detected
WARN YAGNI: interface CorpusFetcher has exactly one implementation (premature abstraction) — ./src/corpus/fetcher.ts:12

--- SOLID ---
PASS SOLID-SRP (java): no oversized files
PASS SOLID-SRP (go): no oversized files
PASS SOLID-SRP (node): no oversized files
PASS SOLID-OCP (java): no large type-dispatch chains
PASS SOLID-OCP (go): no large type-dispatch chains
PASS SOLID-OCP (node): no large type-dispatch chains
PASS SOLID-LSP (java): no heavy instanceof dispatch
WARN LSP: 4 instanceof checks in one file (node) — ./.next/server/chunks/714.js (suggests broken substitutability or type dispatch)
PASS SOLID-ISP (java): no fat interfaces
PASS SOLID-ISP (node): no fat interfaces
PASS SOLID-DIP (java): no domain→infrastructure imports
PASS SOLID-DIP (go): no domain→infrastructure imports
PASS SOLID-DIP (node): no domain→infrastructure imports
PASS SOLID-DIP (python): no domain→infrastructure imports
PASS SOLID-DIP (rust): no domain→infrastructure imports

--- Component-per-file ---
PASS Component-per-file: no violations

--- Property tests ---
Property tests: skipped (project tier is mvp — production+ required)

---------------------------------------------
✘ Design-principles check: 2 FAIL(s), 22 WARN(s).
  Reference: docs/CODING_CONVENTIONS.md §Design Principles, docs/ARCHITECTURE.md, docs/TESTING.md

### Whole-repo FAIL disposition (pre-existing, out of scope)

Both FAILs are **byte-identical to `main`** — confirmed by empty diff, so neither is in
this spec's diff and neither blocks it:

- `./.standards/skills/hallmark/site/examples/cobalt-01/script.js:7:90::CC=10` — vendored example
  inside the `.standards` submodule. `git diff main -- <path>` → empty.
- `./src/components/LoginForm/LoginForm.tsx:17:100:LoginForm:CC=8` — pre-existing.
  `git diff main -- src/components/LoginForm/LoginForm.tsx` → empty.

---

## Evidence: design-principles gate (diff-scoped)

command: .standards/scripts/check-code-principles.sh . -BaseRef main
exit: 0
at: 2026-10-25T17:43:00Z

Checking design principles in: . (tier: mvp)

PASS Complexity/KISS (java): no violations found

--- DRY ---

--- YAGNI ---
PASS YAGNI (go): no premature abstractions detected

--- SOLID ---
PASS SOLID-SRP (java): no oversized files
PASS SOLID-SRP (go): no oversized files
PASS SOLID-SRP (node): no oversized files
PASS SOLID-OCP (java): no large type-dispatch chains
PASS SOLID-OCP (go): no large type-dispatch chains
PASS SOLID-OCP (node): no large type-dispatch chains
PASS SOLID-LSP (java): no heavy instanceof dispatch
PASS SOLID-ISP (java): no fat interfaces
PASS SOLID-ISP (node): no fat interfaces
PASS SOLID-DIP (java): no domain→infrastructure imports
PASS SOLID-DIP (go): no domain→infrastructure imports
PASS SOLID-DIP (node): no domain→infrastructure imports
PASS SOLID-DIP (python): no domain→infrastructure imports
PASS SOLID-DIP (rust): no domain→infrastructure imports

--- Component-per-file ---
PASS Component-per-file: no violations

--- Property tests ---
Property tests: skipped (project tier is mvp — production+ required)

---------------------------------------------
✔ Design-principles check: 0 FAIL(s), 0 WARN(s).

---

## Evidence: scenario-to-behavior spot check

command: (manual read of test + source + scenario; no shell command)
exit: 0
at: 2026-10-25T17:43:40Z

Six scenarios across five tasks were opened and matched test assertion → scenario text:

1. **AC-002-01/02/03 (Task 1)** — `test/acceptance/AC-002-allowed-norms.test.ts`. The test
   pins the six new `normId`/`normTitle` pairs verbatim (matching `10-tasks.md` Task 1 table),
   asserts `ALLOWED_NORMS.length === 8`, `isAllowedNorm` true for new norms, `createPassage`
   returns `{ok:false, error:'unsupported_norm'}` for `BOE-A-2004-4214`, and `boeSourceUrl`
   resolves per entry. Real, not vacuous. Confirmed `src/domain/allowed-norms.ts` carries the
   same 8 ids in the same order, and `corpus/corpus.json` agrees exactly (8 norms, same ids).

2. **AC-002-08/09/10/11 (Task 3)** — `test/acceptance/AC-002-scope-guard.test.ts`. Asserts
   `classifyScope` returns `null` for the three newly answerable messages, that
   `OUT_OF_SCOPE_TOPICS` holds exactly the six remaining reason codes in order, that a filing
   request naming IVA still resolves to `filing_request` (first-match-wins), and that
   «preséntame el 303» is `out_of_scope` with `adapter.callCount === 0`. Matches the scenario
   and the narrowed `OutOfScopeReasonCode` union in `src/content/scope-topics.ts` verbatim.

3. **AC-002-12/13/14/15 (Task 4)** — `test/acceptance/AC-002-registration-path.test.ts`.
   Asserts `src/content/autonomo.ts` no longer exists and no `src/` module references its
   constants; the `out_of_scope` payload has exactly the seven fields (no `steps`/`links`);
   `OutOfScopeResponse` declares no `steps`/`links` (confirmed in `src/service/types.ts`); and
   the alta end-to-end reaches retrieval and calls the model once, never returning
   `out_of_scope` with fixed steps. Real.

4. **AC-002-22/23 (Task 6)** — `test/acceptance/AC-002-no-hardcoded-quantities.test.ts`.
   Asserts the year notice on «¿cuánto IVA pago en 2024?» contains «2025» and «2024», and that
   «¿cuánto IVA pago?»/«en 2025?» carry none; an invented figure backed by an unretrieved
   citation is dropped to `insufficient_evidence` and the payload contains no `312`/`art-inventado`.
   Real.

5. **AC-002-24/25 (Task 7)** — `test/acceptance/AC-002-reinforced-disclaimer.test.ts`.
   Asserts `REINFORCED_SCOPE_DISCLAIMER` equals the verbatim string (confirmed byte-identical in
   `src/content/strings.ts`), that `NON_IRPF_NORM_IDS` has six members with a membership
   predicate, and that an answer citing a non-IRPF norm carries the field while an IRPF-only
   answer does not (confirmed `AnswerResponse.scopeDisclaimer?: string` in `types.ts`). Real.

6. **AC-002-27 (Task 8)** — refusal copy: `OUT_OF_SCOPE_EXPLANATION` in `strings.ts` now reads
   «Lo que sí cubro… es el IRPF, el IVA y el ciclo fiscal del autónomo» and no longer contains
   «solo explico el IRPF» / «explico el IRPF»; `test/acceptance/AC-002-copy-and-links.test.ts`
   asserts the string is absent from an `out_of_scope` payload. Real.

### Load-bearing spot checks (adjudicated)

**AC-002-26 ordering — real, not a tautology.** `test/acceptance/AC-002-reinforced-disclaimer.test.ts`
asserts `scopeIndex === aiIndex + 1`, where `aiIndex = indexOf(withScope.disclaimer)` and
`scopeIndex = indexOf(EXPECTED_DISCLAIMER)` over the `article`'s paragraph order. The AI
disclaimer and the reinforced scope line are two distinct strings; `indexOf` finds the first
occurrence of each, and the equality requires the scope paragraph to sit *immediately* after
the AI-disclaimer paragraph. `AnswerBlock` renders `AnswerDisclaimers` as `<p>{disclaimer}</p>`
then `<p>{scopeDisclaimer}</p>` (footer order: AI disclosure → reinforced line), after the
`[aria-live]` body. Reordering the scope line ahead of the AI line, or interposing any paragraph
between them, breaks the assertion; a missing scope line yields `scopeIndex === -1`, which can
never equal `aiIndex + 1` (with `aiIndex >= 0` asserted). Not a tautology. The companion
`the answer body still comes first` test verifies the body (`[aria-live]`) precedes the
reinforced line via `compareDocumentPosition`, matching the adjudication (15-design §Reinforced
disclaimer, item 3) which dropped the unconditional `ANSWER_BOUNDARY` paragraph and left the
footer at `AI_DISCLOSURE` → `scopeDisclaimer`. The `ANSWER_BOUNDARY` constant survives, composed
into `GUIDE_FOOTER` only, with its doc comment updated exactly as item 5 required.

**AC-002-21 no-hardcoded-quantities — a real but heuristic gate, with one scope limitation.**
`test/acceptance/AC-002-no-hardcoded-quantities.test.ts` extracts *string literals only*
(`STRING_LITERAL` matches `'…'`/`"…"`/backtick; regex literals like `/modelo (303|390|036)/`
are never extracted, so model-identifier *matchers* are excluded by construction, not by an
explicit whitelist) from `src/content` + `src/prompts` and fails on any literal matching
`/\d+\s*%/`, `/€/`, or a quantity phrase (`cuota|base de cotizacion|tramo|tarifa|tipo de iva|importe`)
followed by a digit within 24 chars. It is **not** self-fulfilling: a hardcoded «cuota de 312
euros», «21%», or «€40» in content/prompts would fail it. Limitations, recorded not suppressed:
(a) it covers only `src/content` + `src/prompts`, not all of `src/` that AC-002-21's scenario
text names, so a figure hardcoded in `src/components`/`src/service` would not be caught by this
test (only by the human read-audit); (b) the patterns are heuristics — a spelled-out figure
without `%`/`€`/a quantity keyword would slip through. Both are acceptable for the gate's intent
(no *advisory* constant fixes a figure), and the test passes today because the tree genuinely
carries no such literals.

---

## No unaccounted behavior (finding, not a command)

Every changed file traces to a task. New/notable pieces beyond the obvious scenario wiring:

- `src/domain/passage.ts` adds `normIdOfPassageId()` — inverse of `passageIdOf`, used by
  `scopeDisclaimerFor` (`src/service/answer-question.ts:103-105`) to test a cited passage's
  `normId` against the non-IRPF set. Traces to Task 7 (derivation from cited norms). Legitimate
  helper.
- `src/service/responses.ts` now hosts `privacyResponse`, `scopeResponse`, `guideResponse`
  alongside the pre-existing constructors (moved from `answer-question.ts`), and `yearNoticeFor`
  was refactored to use the `YEAR_NOTICE_BODY` template (logic unchanged). Traces to the Task 4/7/8
  response-shape change; the module doc comment states the single-home intent. Legitimate refactor.
- `src/components/ChatScreen/ChatScreen.tsx` extracts `StreamingRegion`/`Announcer`/`TurnFeedback`/
  `Dock`/`SkipLink` and adds an `Announcer` live region for `turn.announcement` (screen-reader
  announcement of refusals/abstentions), with the `--sr-only-size` token and `.announcer` CSS.
  Accompanies the Task 4/8 refusal/abstention rendering change (a refusal appended silently would
  otherwise never be announced). Legitimate, small a11y addition.
- `corpus/corpus.json` regenerated: 8 norms (ids match Task 1 exactly, in registry order), 1961
  passages, `taxYear` 2025, `contentHash` present. `git diff main -- corpus/corpus.json` shows the
  artifact change (Task 2). `src/domain/allowed-norms.ts` and `corpus/corpus.json` agree exactly.

No logic found that does not trace to a task or scenario.

---

## Out-of-scope findings (recorded, not fixed)

1. **`OfficialLink` type — correct-as-is (not orphaned).** The orchestrator's brief flagged it
   "orphaned"; my read disagrees. `OfficialLink` is defined in `src/content/scope-topics.ts:21`
   and is still imported and used: `src/service/types.ts:8,53` (`GuideResponse.links`) and
   `src/content/gestor-guides.ts:2,10,17,20` (`GuideContent.links`, `AEAT_MODELOS`). It lost its
   `OutOfScopeResponse` use (Task 4) but retains its guide-link use. Not dead. Minor naming hint:
   the type now describes guide links yet lives in the scope-topics module — a cohesion smell,
   not a defect, and not worth a follow-up spec on its own.

2. **`abstentionNotice` exported — correct-as-is, minor hint.** Exported from
   `use-chat-turn.ts:71`, consumed in production at `use-chat-turn.ts:133`, and additionally
   imported directly by `test/acceptance/AC-002-registration-path.test.ts:13`. It is not "only"
   a test seam — it is a production function whose export also enables direct unit testing.
   Acceptable; a pure seam would be a smell.

3. **Pre-existing design-principles FAILs (2) — out of scope, not a block.** See the whole-repo
   evidence block: `LoginForm.tsx` CC=8 and the vendored `.standards` cobalt example CC=10. Both
   byte-identical to `main`. Recorded for the Architect; not introduced by this spec.

4. **`shadowsAnswerableSubject` left per-matcher — correct-as-is.** The guard
   (`gestor-guides.ts:295`) is applied individually at each colliding predicate (`gastosGuide:308`,
   `laborGuide:322`, `presentationGuide:359`), not as a single early gate. This is defensible: only
   three of the retained guides can collide with an answerable subject, and each call site makes
   its own decision explicit. Centralizing would be a mild DRY win at the cost of hiding which
   guides are affected. Not a defect.

---

## Verification attempt log

- attempt 1, phase 1 — full run. `SPEC_LOOP_COUNT=0`, `SPEC_PHASE1_RETRIES=0`,
  `SPEC_PHASE2_RETRIES=0`.
- attempt 2, phase 1 — scoped re-verification (audit-trail heading fix only).
  `SPEC_LOOP_COUNT=1`, `SPEC_PHASE1_RETRIES=1`, `SPEC_PHASE2_RETRIES=0`.

---

## Re-verification (attempt 2, phase 1) — audit-trail heading fix

**Cause of the re-trigger.** The Mutation Runner ran the stage-5b pre-push gate
`.standards/scripts/check-audit-trail.sh 002-advisor-scope-expansion`, which matches the five
contract check names exactly (case-insensitive) via `evidence_block()`. Two of this report's
headings were qualified, so neither matched:

- `## Evidence: complexity gate (ESLint)` → renamed to `## Evidence: complexity gate`
- `## Evidence: design-principles gate (whole repo)` → renamed to `## Evidence: design-principles gate`

The whole-repo qualifier was preserved inside the block body as a `scope: whole repo` line under
the markers (the diff-scoped block stays a clearly-qualified supplemental `## Evidence:
design-principles gate (diff-scoped)` and is ignored by the gate, which returns the first
exact-match block). No measurement, exit code, or timestamp was changed.

## Evidence: audit-trail gate (re-verification, attempt 2)

command: .standards/scripts/check-audit-trail.sh 002-advisor-scope-expansion
exit: 0
at: 2026-10-25T17:52:30Z

PASS 002-advisor-scope-expansion: 10-tasks.md present and non-empty
PASS 002-advisor-scope-expansion: 20-acceptance/ has an AC-*.md with a '## AC-NNN-NN' heading (AC-015-10)
PASS 002-advisor-scope-expansion: 25-verification.md present and non-empty
PASS 002-advisor-scope-expansion: 30-report.md present and non-empty
PASS 002-advisor-scope-expansion: 15-design.md present and non-empty (AC-015-13)
PASS 002-advisor-scope-expansion: 40-deploy.md absent — tolerated pre-5c (stage 5d re-runs with --require-deploy, AC-031-21)
PASS 002-advisor-scope-expansion: evidence block 'scenario traceability' — command: .standards/scripts/check-scenario-traceability.sh, exit: 0, at: 2026-10-25T17:40:30Z
PASS 002-advisor-scope-expansion: evidence block 'full test suite' — command: npm test, exit: 0, at: 2026-10-25T17:40:45Z
PASS 002-advisor-scope-expansion: evidence block 'complexity gate' — command: npm run lint, exit: 0, at: 2026-10-25T17:41:20Z
PASS 002-advisor-scope-expansion: evidence block 'design-principles gate' — command: .standards/scripts/check-code-principles.sh ., exit: 1, at: 2026-10-25T17:42:40Z
PASS 002-advisor-scope-expansion: evidence block 'scenario-to-behavior spot check' — command: (manual read of test + source + scenario; no shell command), exit: 0, at: 2026-10-25T17:43:40Z
✔ Audit-trail check: specs/002-advisor-scope-expansion complete, verifier evidence recorded.

---

## Evidence: scenario traceability (re-verification, attempt 2)

command: .standards/scripts/check-scenario-traceability.sh
exit: 0
at: 2026-10-25T17:52:30Z

... (33 live scenarios, all PASS) ...
PASS AC-002-31 — traced to a test
PASS AC-002-32 — traced to a test
PASS AC-002-33 — traced to a test

✔ Scenario traceability check: every scenario traced, every reference resolves.

The heading rename in 25-verification.md does not touch the trace scan (it greps test files and
scenario files, not the verifier report), so the scan is unchanged and still exit 0.

---

## Verdict (unchanged after re-verification)

**PASS.** The audit-trail gate now exits 0; the five contract evidence blocks parse; traceability
still exit 0. No measurement, exit code, or timestamp in the five blocks was altered — only two
headings were renamed to the contract literals and a `scope:` qualifier line added to the body.
No gate revealed any other deficiency (no missing check, no unrecorded command, no malformed
block).

---

## Phase 2 — round 1 (post-PR CI)

PR #13, draft, head `c343e17d4c4a7efd5e942311a9891b81a57abd0c`, branch `spec/002-advisor-scope-expansion`,
repo RexiAI/tax-advisor. Round 1 of the phase-2 CI check-and-remediate loop
(`SPEC_LOOP_COUNT=2`, `SPEC_PHASE1_RETRIES=1`, `SPEC_PHASE2_RETRIES=0`).

### Verdict: PASS

All CI checks terminal and green; no FAIL, no BLOCK. No remediation needed, no routing.

## Evidence: PR checks query (terminal)

command: gh pr checks 13 --json name,state,bucket,workflow,link
exit: 0
at: 2026-10-25T18:00:53Z

[{"bucket":"pass","link":"https://vercel.com/github","name":"Vercel Preview Comments","state":"SUCCESS","workflow":""},
 {"bucket":"pass","link":"https://github.com/RexiAI/tax-advisor/actions/runs/40219052569/job/121246544826","name":"lint","state":"SUCCESS","workflow":"CI"},
 {"bucket":"pass","link":"https://github.com/RexiAI/tax-advisor/actions/runs/40219052569/job/121246544845","name":"test","state":"SUCCESS","workflow":"CI"},
 {"bucket":"pass","link":"https://github.com/RexiAI/tax-advisor/actions/runs/40219052569/job/121246544677","name":"build","state":"SUCCESS","workflow":"CI"},
 {"bucket":"pass","link":"https://vercel.com/danielbueno76-4270s-projects/tax-advisor/49KcnY72nvoS8cvtbXHiwG4W8Wwz","name":"Vercel","state":"SUCCESS","workflow":""}]

Per-check parse (`bucket` field → PASS/FAIL):

| Check | bucket | state | Round-1 verdict |
|---|---|---|---|
| Vercel Preview Comments | pass | SUCCESS | PASS |
| lint (CI) | pass | SUCCESS | PASS |
| test (CI) | pass | SUCCESS | PASS |
| build (CI) | pass | SUCCESS | PASS |
| Vercel | pass | SUCCESS | PASS |

### Polling

The first `gh pr checks 13 --json` (≈17:59:40Z) returned only the two Vercel statuses — the three
GitHub Actions jobs (`lint`/`test`/`build`) had not yet surfaced in the checks API. The
authoritative, complete rollup came from `gh pr view 13 --json statusCheckRollup`, which showed the
CI run `40219052569` in flight (`lint` IN_PROGRESS, `test` IN_PROGRESS, `build` QUEUED) plus
`Vercel` PENDING. I polled `statusCheckRollup` every ~30 s:

- poll 1 @ 17:59:41Z — lint/test/build all in progress; Vercel PENDING.
- poll 2 @ 18:00:13Z — lint SUCCESS, test SUCCESS, build IN_PROGRESS; Vercel SUCCESS.
- poll 3 @ 18:00:46Z — all three CI jobs COMPLETED/SUCCESS; Vercel SUCCESS.

**3 polls over ~75 s** until terminal. The final `gh pr checks 13 --json` (above, 18:00:53Z)
returned all five checks with `bucket: "pass"`. A prior CI run `40219027285` on the same branch was
`cancelled` — the expected superseded-run artifact of `concurrency.cancel-in-progress: true`, not a
failure.

## Evidence: PR state / rollup (bounded re-query)

command: gh pr view 13 --json number,isDraft,state,headRefName,headRefOid,mergeable,statusCheckRollup
exit: 0
at: 2026-10-25T17:59:41Z

{"headRefName":"spec/002-advisor-scope-expansion","headRefOid":"c343e17d4c4a7efd5e942311a9891b81a57abd0c","isDraft":true,"mergeable":"MERGEABLE","number":13,"state":"OPEN","statusCheckRollup":[{"__typename":"CheckRun","completedAt":"0001-01-01T00:00:00Z","conclusion":"","detailsUrl":"https://github.com/RexiAI/tax-advisor/actions/runs/40219052569/job/121246544826","name":"lint","startedAt":"2026-10-25T17:59:30Z","status":"IN_PROGRESS","workflowName":"CI"},{"__typename":"CheckRun","completedAt":"0001-01-01T00:00:00Z","conclusion":"","detailsUrl":"https://github.com/RexiAI/tax-advisor/actions/runs/40219052569/job/121246544845","name":"test","startedAt":"2026-10-25T17:59:30Z","status":"IN_PROGRESS","workflowName":"CI"},{"__typename":"CheckRun","completedAt":"0001-01-01T00:00:00Z","conclusion":"","detailsUrl":"https://github.com/RexiAI/tax-advisor/actions/runs/40219052569/job/121246544677","name":"build","startedAt":"2026-10-25T17:59:29Z","status":"QUEUED","workflowName":"CI"},{"__typename":"StatusContext","context":"Vercel","startedAt":"2026-10-25T17:58:58Z","state":"PENDING","targetUrl":"https://vercel.com/danielbueno76-4270s-projects/tax-advisor/49KcnY72nvoS8cvtbXHiwG4W8Wwz"},{"__typename":"CheckRun","completedAt":"2026-10-25T17:58:59Z","conclusion":"SUCCESS","detailsUrl":"https://vercel.com/github","name":"Vercel Preview Comments","startedAt":"2026-10-25T17:58:59Z","status":"COMPLETED","workflowName":""}]}

---

### PR Opener flag — `check-specs-archived.sh` not wired (CONFIRMED)

The PR Opener claimed `.github/workflows/ci.yml` does not wire `check-specs-archived.sh`, so the
unarchived spec folder at this head does not fail CI. **Confirmed.** The only GitHub Actions
workflow in this repo is `.github/workflows/ci.yml` (`.github/dependabot.yml` is Dependabot config,
not a workflow), and it declares exactly three jobs — `lint`, `test`, `build` — with no spec,
archive, or `check-specs-archived` step:

```
jobs:
  lint:    … npm run lint; npx tsc --noEmit
  test:    … npm test
  build:   … npm run build
```

`grep -rn "check-specs-archived"` over the repo (excluding `.standards/` and `specs/`) returns
nothing; the gate lives only in the `.standards` submodule's own `self-ci.yml`, which is not
inherited by this child repo.

**Consequence for merge order.** Because no CI backstop in this repo refuses a finished-but-
unarchived spec, the discipline falls entirely on the pipeline: stage 5d (the Archiver) must run
`archive-spec.sh` as the final commit of this PR — so `main` lands with `docs/changes/002-…-md`
present and `specs/002-advisor-scope-expansion/` absent — **before** the PR is merged. A merge that
precedes stage 5d would carry the pipeline scratch (`specs/NNN-slug/`) onto `main` with nothing to
stop it. This is an observation for the PR Opener/Archiver to act on, not a defect in this round's
CI verdict (the CI is green; the archive gate is simply not a CI gate here).

---

### Round-1 outcome

PASS — every CI check green, no failing check IDs to record, no log-failure excerpt, no routing.

---

## Phase 2 — round 2 (post-PR CI)

PR #13, draft, head `a36b435785992b9def0c9fa29e46f60df447f911` ("docs(spec-002): record the
phase-3 remediation and the deploy verdict"), branch `spec/002-advisor-scope-expansion`, repo
RexiAI/tax-advisor. Round 2 of the phase-2 CI check-and-remediate loop. Round 1 was green at
`c343e17`. Budget: `SPEC_LOOP_COUNT=3`, `SPEC_PHASE1_RETRIES=1`, `SPEC_PHASE2_RETRIES=1`.

### Verdict: PASS

All CI checks terminal and green at the new head; no FAIL, no BLOCK, no routing.

## Evidence: PR checks query (terminal, round 2)

command: gh pr checks 13 --json name,state,bucket,workflow,link
exit: 0
at: 2026-10-26T07:03:28Z

[{"bucket":"pass","link":"https://vercel.com/github","name":"Vercel Preview Comments","state":"SUCCESS","workflow":""},
 {"bucket":"pass","link":"https://github.com/RexiAI/tax-advisor/actions/runs/40283358247/job/121441335133","name":"lint","state":"SUCCESS","workflow":"CI"},
 {"bucket":"pass","link":"https://github.com/RexiAI/tax-advisor/actions/runs/40283358247/job/121441335318","name":"test","state":"SUCCESS","workflow":"CI"},
 {"bucket":"pass","link":"https://github.com/RexiAI/tax-advisor/actions/runs/40283358247/job/121441334680","name":"build","state":"SUCCESS","workflow":"CI"},
 {"bucket":"pass","link":"https://vercel.com/danielbueno76-4270s-projects/tax-advisor/7zFRYALu1hqTxRBLQCJt1dK1RAhn","name":"Vercel","state":"SUCCESS","workflow":""}]

Per-check parse (`bucket` → PASS/FAIL):

| Check | bucket | state | Round-2 verdict |
|---|---|---|---|
| Vercel Preview Comments | pass | SUCCESS | PASS |
| lint (CI) | pass | SUCCESS | PASS |
| test (CI) | pass | SUCCESS | PASS |
| build (CI) | pass | SUCCESS | PASS |
| Vercel | pass | SUCCESS | PASS |

### Polling

**1 poll, ~0 s waited** — the run (`40283358247`) had already completed when first queried
(`completed success`, start `07:02:30Z`, end ≈`07:03:24Z`). The `statusCheckRollup` re-query at
`07:03:35Z` confirmed every check terminal (0 IN_PROGRESS/QUEUED): lint SUCCESS, test SUCCESS,
build SUCCESS, Vercel SUCCESS, Vercel Preview Comments SUCCESS.

## Evidence: CI test job log (suite contents + count)

command: gh run view 40283358247 --log | grep -aE 'Test Files|Tests |AC-002-retrieval|AC-002-policy'
exit: 0
at: 2026-10-26T07:04:04Z

test	Run npm test	… ✓ test/acceptance/AC-002-retrieval-vocabulary.test.ts (5 tests)  226ms
test	Run npm test	… ✓ AC-002-29 the 001 tests that fixed the old routing are updated, ids kept > AC-002-29: the end-to-end flow reaches retrieval for VAT, RETA and registration  443ms
test	Run npm test	… ✓ test/acceptance/AC-002-policy-scope.test.ts (3 tests)  5ms
test	Run npm test	…  Test Files  46 passed (46)
test	Run npm test	…       Tests  413 passed (413)
test	Run npm test	…    Duration  17.50s (transform 1.29s, setup 499ms, collect 19.70s, tests 16.30s, environment 2.54s, prepare 4.19s)

### Confirmation 1 — new acceptance files ran in CI; 413 matches local

Both new acceptance files are present locally and were executed by the CI `test` job:
`test/acceptance/AC-002-retrieval-vocabulary.test.ts` (5 tests) and
`test/acceptance/AC-002-policy-scope.test.ts` (3 tests). CI reports **46 files / 413 tests passed**,
matching the expected local count of 413. No discrepancy.

### Confirmation 2 — `check-specs-archived.sh` false green (REAL; out of scope, not fixed)

**Mechanism verified.** `.standards/scripts/check-specs-archived.sh` walks
`git ls-files 'specs/*/30-report.md'`, and for an unarchived finished spec reads the INDEX copy of
`40-deploy.md` (`git show ":specs/$slug/40-deploy.md"`) and fires its spec-031 exception when:

```
grep -qE 'Phase-3 budget exhausted|Verdict:[[:space:]]*ESCALATED'
```

The **substring** `Phase-3 budget exhausted` matches unconditionally — including in text that
*denies* exhaustion. This spec's `40-deploy.md` has exactly two such negating lines:

- line 28: ``| Phase-3 budget | **2 of 3** attempts used; 0 fix rounds consumed; `Phase-3 budget exhausted` does **not** apply |``
- line 258: ``- The marker line `Phase-3 budget exhausted` does **not** apply: this is a pass on attempt 2 of 3.``

Both contain the literal `Phase-3 budget exhausted`, so the regex matches and the exception fires.
The `Verdict: ESCALATED` alternative is irrelevant: the final line is line 276 `Verdict: PASS`, and
`grep -nE 'Verdict:[[:space:]]*ESCALATED'` returns nothing.

**It is a real false green.** The spec is finished (`30-report.md` tracked) and **not** archived
(`git ls-files --error-unmatch docs/changes/002-advisor-scope-expansion.md` → "did not match any
file(s)"; only `docs/changes/001-spain-tax-advisor.md` is tracked), yet the script exits 0 treating
it as an escalation-deferred archive:

```
$ .standards/scripts/check-specs-archived.sh ; echo $?
  [OK] 002-advisor-scope-expansion phase-3 budget exhausted (40-deploy.md records escalation) — archival deferred to the human
All finished specs archived.
0
```

So an unarchived, PASS-verdict spec reads as "archived-ok". **Out-of-scope finding, recorded not
fixed** (the script is off-limits to the Verifier): the exception should match the *marker/value*
(e.g. a `Phase-3 budget exhausted` value in the budget table, or a bare `Verdict: ESCALATED` line),
not the bare phrase appearing in prose that negates it. Consequence: this repo's CI has no
archive backstop for spec 002 (see round 1's merge-order note), and the archive gate that *is* run
locally reports a false pass — stage 5d must still archive `specs/002-advisor-scope-expansion/` into
`docs/changes/` before merge, and the human/pipeline must not rely on this gate's green here.

---

### Round-2 outcome

PASS — every CI check green at `a36b435`; the two new acceptance files ran (413 tests, 46 files);
no failing check IDs, no log-failure excerpt, no routing. The `check-specs-archived.sh` false green
is recorded as an out-of-scope finding, not a round failure.

## Quality gates

# 30-report — spec 002 (advisor scope expansion)

Stage 5a (Mutation Runner), attempt 1; revised after the phase-1 audit-trail fix, and again on
2026-10-26 after the phase-2 CI round and the two phase-3 remediation rounds closed.
Branch: `spec/002-advisor-scope-expansion` — the report was written pre-PR; PR #13 is now open.
Conformance tier: **mvp**.
Information barrier respected: `00-informal.md` was not read. This report reasons from
`10-tasks.md`, `20-acceptance/`, `25-verification.md`, and the committed test suite only.

Nothing was committed, pushed, or opened as a PR. No production code and no test was modified.

## Verdict summary

| Item | Result |
|---|---|
| Verifier verdict (carried forward) | **PASS** (`25-verification.md`; unchanged after the phase-1 re-verification) |
| Mutation score | **skipped — `mvp` tier** (mutation testing is `production`+) |
| Equivalent mutants | **none** — no mutation engine ran, so the category does not arise |
| Complexity / structure, in-diff | **0 FAIL, 0 WARN** (`-BaseRef main`, re-run after the phase-3 rounds) |
| Scenarios | **36 live `AC-002-NN` ids** (was 33 at stage 5a) |
| Final full suite | **413 passed / 46 files, exit 0** — re-run after the phase-3 remediation rounds (was 405 / 44 at stage 5a) |
| Type-check / production build / lint | **exit 0** each — re-run with the suite |
| `check-audit-trail.sh` (stage 5b's pre-push gate) | **exit 0** — resolved in phase 1, attempt 1 (heading format corrected by stage 4; gate re-run at `2026-10-25T17:52:30Z`) |
| Live behaviour (phase 3) | **PASS, scoped** — the alta and IVA questions now answer from the governing passages, IBI still `out_of_scope`; proved on the HEAD tree **run locally**, not on the Vercel preview URL |
| Remediation | **Phase 1: 1 attempt, resolved. Phase 2: 1 round, CI green. Phase 3: 2 of 3 attempts (1 `ESCALATED` superseded, 1 PASS), 1 remaining, not exhausted.** |

The Verifier's PASS **is** supported by what I can see: I independently re-ran the full suite,
the type-check, the build, the lint, and the diff-scoped design-principles gate, and all are
green at the tree the Verifier checked. One figure in the orchestrator's brief could not be
reproduced and is recorded as unverifiable below rather than asserted.

The folder is pushable: the audit-trail gate that stage 5b runs before pushing exits 0. On my
first run it did not — a heading-format defect in the Verifier's artifact, fixed by stage 4 in
phase 1, attempt 1. The diagnosis is kept below because the failure mode is non-obvious and will
recur; it is no longer an open item.

After the PR opened, two behavioural defects surfaced that no gate in this report could see —
one in retrieval ranking, one in the system policy. Both are recorded in
§Phase 3 — deploy verification and remediation, together with why a 33-scenario gate passed a
spec that did not answer its founding question.

---

## Resolved in phase 1 — audit-trail gate heading format

`scripts/check-audit-trail.sh 002-advisor-scope-expansion` is the gate
`docs/SPEC_PIPELINE.md §The gate` has the PR Opener run before pushing. It exits **0** now. It
exited **1** on my first run, and it is kept here as a resolved item because the failure mode is
non-obvious, recurs easily, and says nothing about the quality of the work.

**Cause.** Two evidence headings in the Verifier's `25-verification.md` did not match the
contract's literal heading form. `docs/SPEC_PIPELINE.md §Evidence block format` specifies
`## Evidence: <check name>` and names the five checks exactly; the script (`evidence_block`, awk,
line ~207) compares the heading text after `## Evidence:` for **exact** case-insensitive equality.
Qualified headings therefore miss:

| Heading as first written | Contract name | Match |
|---|---|---|
| `## Evidence: complexity gate (ESLint)` | `complexity gate` | **missed** |
| `## Evidence: design-principles gate (whole repo)` | `design-principles gate` | **missed** |
| `## Evidence: scenario traceability`, `full test suite`, `scenario-to-behavior spot check` | as written | matched |

This was a **formatting** nonconformance, never a substantive one: every check the Verifier
recorded still passed and its evidence content was intact, so its PASS verdict stood throughout.
The mechanical gate is nonetheless what gates the push, and it was red.

**Resolution.** Stage 4 renamed the two headings to the contract literals in a scoped
re-verification (`25-verification.md` §Re-verification (attempt 2, phase 1)); the whole-repo
qualifier moved into the block body as a `scope:` line. No measurement, exit code, or timestamp
was altered. The `(diff-scoped)` heading stays as a clearly-qualified supplemental block — the
lookup returns the first exact match, so it is ignored. The gate accepts the whole-repo block's
`exit: 1` because the contract requires the markers plus verbatim output, and a whole-repo run
that records pre-existing, out-of-diff FAILs is conformant.

Stage 5a did not edit the artifact itself — rewriting another stage's recorded evidence, even its
headings, is not this stage's call. I proved the failure and the two-line fix on a `/tmp` copy,
then escalated; that escalation is what closed it, in one attempt, consuming one phase-1 slot.

### Evidence: audit-trail gate (after the phase-1 fix)

command: .standards/scripts/check-audit-trail.sh 002-advisor-scope-expansion
exit: 0
at: 2026-10-25T17:52:30Z

```
PASS 002-advisor-scope-expansion: 10-tasks.md present and non-empty
PASS 002-advisor-scope-expansion: 20-acceptance/ has an AC-*.md with a '## AC-NNN-NN' heading (AC-015-10)
PASS 002-advisor-scope-expansion: 25-verification.md present and non-empty
PASS 002-advisor-scope-expansion: 30-report.md present and non-empty
PASS 002-advisor-scope-expansion: 15-design.md present and non-empty (AC-015-13)
PASS 002-advisor-scope-expansion: 40-deploy.md absent — tolerated pre-5c (stage 5d re-runs with --require-deploy, AC-031-21)
PASS 002-advisor-scope-expansion: evidence block 'scenario traceability' — command: .standards/scripts/check-scenario-traceability.sh, exit: 0, at: 2026-10-25T17:40:30Z
PASS 002-advisor-scope-expansion: evidence block 'full test suite' — command: npm test, exit: 0, at: 2026-10-25T17:40:45Z
PASS 002-advisor-scope-expansion: evidence block 'complexity gate' — command: npm run lint, exit: 0, at: 2026-10-25T17:41:20Z
PASS 002-advisor-scope-expansion: evidence block 'design-principles gate' — command: .standards/scripts/check-code-principles.sh ., exit: 1, at: 2026-10-25T17:42:40Z
PASS 002-advisor-scope-expansion: evidence block 'scenario-to-behavior spot check' — command: (manual read of test + source + scenario; no shell command), exit: 0, at: 2026-10-25T17:43:40Z
✔ Audit-trail check: specs/002-advisor-scope-expansion complete, verifier evidence recorded.
```

---

## Mutation score

**Skipped.** `docs/SPEC_PIPELINE.md §Conformance tiers` places mutation testing at
`production` and above; the project is `mvp`. No mutation engine was installed, no partial
pass was run, and no score was invented. At `mvp` the Architect role still runs — it runs as
this report — but the mutation *test* does not.

I established the tier two ways: the repo's own gate script auto-detects it, and no
human-authored tier declaration exists anywhere the standards say to look
(`docs/CONFORMANCE_TIERS.md`: an `AGENTS_*.md` "Conformance tier:" line; the stop-and-ask
matrix's fallback is the harness default `mvp`).

### Evidence: conformance tier resolution

command: .standards/scripts/check-code-principles.sh . --json
exit: 0
at: 2026-10-25T17:48:41Z

```
{
  "tier": "mvp",
  "gates": ["complexity", "dry", "yagni", "solid", "component-per-file", "property-tests"],
```

### Evidence: no human-authored tier declaration (harness default `mvp` applies)

command: for f in README.md docs/RUNBOOK.md docs/adr/0001-lexical-retrieval.md docs/adr/0002-no-server-persistence.md docs/adr/0003-advisor-scope-expansion.md; do printf "%-45s " "$f"; grep -ci "conformance tier" "$f" || true; done; ls AGENTS_*.md; grep -ci "conformance" package.json
exit: 0
at: 2026-10-25T17:48:59Z

```
README.md                                     0
docs/RUNBOOK.md                               0
docs/adr/0001-lexical-retrieval.md            0
docs/adr/0002-no-server-persistence.md        0
docs/adr/0003-advisor-scope-expansion.md      0
--- no AGENTS_*.md at repo root: ---
ls: cannot access 'AGENTS_*.md': No such file or directory
--- tier declaration in package.json? ---
0
```

### Evidence: no mutation tooling installed or configured

command: ls -1 stryker.conf.json stryker.config.json .strykerrc.json; grep -c "stryker" package.json; ls -d node_modules/@stryker-mutator
exit: 2
at: 2026-10-25T17:48:41Z

```
0
ls: cannot access 'node_modules/@stryker-mutator': No such file or directory
```

(`package.json` scripts are `dev`, `build`, `start`, `test`, `test:watch`, `lint`, `format`,
`corpus:sync` — no `mutation` script. Exit 2 is `ls` reporting the absent Stryker directory.)
Nothing was installed to change this. If the project later moves to `production` tier, the
`docs/SPEC_PIPELINE.md §Tooling by language` row for JS/TS (`npx stryker run`, ≥80%) is the
entry point and `ci/templates/stryker.conf.json` is the config template.

### Equivalent mutants

**None.** Per the audit contract this row must be explicit: equivalent mutants are the
survivors a mutation engine reports that no test can kill. No engine ran, so no survivor set
exists and no mutant was classified. This is not a claim that the suite is mutation-clean —
it is a recorded absence of measurement, which is exactly the `mvp` tier's documented state.

---

## Complexity / structure, carried forward from stage 3

`spec-refactorer` deliberately leaves no report artifact (audit contract, §What each stage
leaves behind) — its claims are audited because the Verifier re-executes them. So there is no
stage-3 document to transcribe. What follows is (a) the numbers the Verifier re-recorded, and
(b) numbers I measured myself, this run, at both tree states.

**Where the "4 FAIL → 0" figure stands.** The orchestrator's brief cites a diff-scoped
baseline→final of 4 FAIL → 0. I could confirm the **final** half and not the **baseline**
half:

- Final, diff-scoped: `-BaseRef main` → **exit 0, 0 FAIL, 0 WARN** — reconfirmed below.
- The baseline half is the Coder's working tree *before* stage 3 refactored it. That state was
  never committed and never stashed, so it is not recoverable from any artifact (no stage-3
  report exists by design, `runs.jsonl` carries only per-run gate outcomes, and the working
  tree has moved past it). **The 4 is therefore unverified, not disputed.** I did not
  substitute a guess for it.

To give the row real numbers anyway, I measured `main` (@`76c0a61`) against the working tree
directly, in a detached worktree so the spec branch's tree was never touched.

### Evidence: design-principles baseline (`main` @ 76c0a61), src/test-scoped

command: git worktree add --detach /tmp/opencode/spec002-baseline main && .standards/scripts/check-code-principles.sh /tmp/opencode/spec002-baseline --json
exit: 1
at: 2026-10-25T17:48:51Z

```
tier: mvp fails: 1 warns: 20
src/test-scoped fails: 1
src/test-scoped warns: 20

FAIL  src/components/LoginForm/LoginForm.tsx:17:100:LoginForm:CC=8
WARN  src/components/SourceEntry/SourceEntry.tsx:17:41:SourceEntry:KISS_LINES=26
WARN  src/components/ChatScreen/ChatScreen.tsx:41:85:ChatScreen:KISS_LINES=46
WARN  src/components/LoginForm/LoginForm.tsx:17:100:LoginForm:KISS_LINES=79
WARN  src/components/Composer/Composer.tsx:27:64:Composer:KISS_LINES=31
WARN  src/components/Notice/Notice.tsx:26:59:Notice:KISS_LINES=35
WARN  src/components/Notice/Notice.tsx:26:59:Notice:KISS_PARAMS=7
WARN  src/components/Header/Header.tsx:14:35:Header:KISS_LINES=23
WARN  src/components/AnswerBlock/AnswerBlock.tsx:20:46:AnswerBlock:KISS_LINES=28
WARN  (10x DRY) identical 4-line blocks — links/AEAT_MODELOS/readonly summary+steps+links shape
WARN  YAGNI: interface CorpusFetcher has exactly one implementation — src/corpus/fetcher.ts:12
WARN  possible god file (node) — src/content/gestor-guides.ts: 499 lines, 1 methods
```

### Evidence: design-principles final (working tree), src/test-scoped

command: .standards/scripts/check-code-principles.sh . --json
exit: 1
at: 2026-10-25T17:47:12Z

```
src/test-scoped FAILS: 1
  FAIL src/components/LoginForm/LoginForm.tsx:17:100:LoginForm:CC=8
src/test-scoped WARNS: 5
  WARN Method body >20 lines (node): ./src/components/SourceEntry/SourceEntry.tsx:17:41:SourceEntry:KISS_LINES=26
  WARN Method body >20 lines (node): ./src/components/LoginForm/LoginForm.tsx:17:100:LoginForm:KISS_LINES=79
  WARN Method body >20 lines (node): ./src/components/Composer/Composer.tsx:27:64:Composer:KISS_LINES=31
  WARN Method body >20 lines (node): ./src/components/Header/Header.tsx:14:35:Header:KISS_LINES=23
  WARN YAGNI: interface CorpusFetcher has exactly one implementation (premature abstraction) — ./src/corpus/fetcher.ts:12
```

The whole-repo invocation also reports the vendored `.standards` submodule demo asset
(`cobalt-01/script.js:7:90::CC=10`); it is not in this spec's diff and is excluded from the
scoped count above. Both whole-repo FAILs at final are **byte-identical to `main`** and
untouched by this spec — consistent with the Verifier's disposition.

### Per-file baseline → final, for the files this spec touched

The gate reports only files that *exceed* a threshold; it emits no CC or KISS number for a
compliant file. So the honest per-file series is "finding present" → "finding absent", not a
numeric CC curve.

| File (touched by this spec) | Baseline (`main`) | Final (working tree) |
|---|---|---|
| `src/content/gestor-guides.ts` | WARN god file — 499 lines | clean |
| `src/components/AnswerBlock/AnswerBlock.tsx` | WARN KISS_LINES=28 | clean |
| `src/components/ChatScreen/ChatScreen.tsx` | WARN KISS_LINES=46 | clean |
| `src/components/Notice/Notice.tsx` | WARN KISS_LINES=35 | clean |
| `src/components/Notice/Notice.tsx` | WARN KISS_PARAMS=7 | clean |
| `src/service/{answer-question,responses,types}.ts`, `src/domain/{allowed-norms,passage}.ts`, `src/content/{scope-topics,strings}.ts`, `src/components/ChatScreen/use-chat-turn.ts` | clean | clean |
| DRY (identical 4-line blocks in content/types shape) | 10 WARN | clean |

**Touched-file findings: 5 → 0. src/test-scoped WARNs overall: 20 → 5. src/test-scoped FAILs:
1 → 1 (unchanged: `LoginForm` CC=8, pre-existing, not in this diff).** No file this spec
touched carries a cyclomatic-complexity or KISS finding at final.

### Evidence: design-principles diff-scoped (`-BaseRef main`)

command: .standards/scripts/check-code-principles.sh . -BaseRef main --json
exit: 0
at: 2026-10-25T17:47:12Z

```
tier=mvp fails=0 warns=0
```

Matches the Verifier's `-BaseRef main` evidence block (exit 0, 0 FAIL, 0 WARN).

The measurement worktree was removed afterwards (`git worktree remove --force`, `git worktree
prune`); `git worktree list` shows only the spec branch checkout. No git state was left behind.

---

## Final test status — full suite (stage 5a)

The Verifier confirmed this once. I re-confirm it because my stage added no code but the tree
is the same tree that will be pushed, and because a green suite after someone else's last edit
is not evidence about the tree a PR Opener is about to commit.

### Evidence: full test suite

command: npm test
exit: 0
at: 2026-10-25T17:47:42Z

```
 Test Files  44 passed (44)
      Tests  405 passed (405)
   Start at  18:47:43
   Duration  9.70s (transform 2.09s, setup 1.06s, collect 22.46s, tests 21.18s, environment 2.72s, prepare 5.47s)
```

### Evidence: type-check

command: npx tsc --noEmit
exit: 0
at: 2026-10-25T17:47:55Z

```
(no output — clean)
```

### Evidence: production build

command: npm run build
exit: 0
at: 2026-10-25T17:48:02Z

```
Route (app)                                 Size  First Load JS
┌ ○ /                                    7.73 kB         110 kB
├ ○ /_not-found                            995 B         104 kB
├ ƒ /api/auth/login                        133 B         103 kB
├ ƒ /api/auth/logout                       133 B         103 kB
├ ƒ /api/chat                              133 B         103 kB
├ ƒ /health                                133 B         103 kB
└ ƒ /login                               2.33 kB         105 kB
+ First Load JS shared by all             103 kB
ƒ Middleware                               35 kB
```

### Evidence: lint (also the complexity gate — `complexity: [error,6]`)

command: npm run lint
exit: 0
at: 2026-10-25T17:47:57Z

```
> renta-clara@0.1.0 lint
> eslint .
```

(no violations reported)

Test count is unchanged from the Verifier's run (405), as expected: this stage wrote no tests,
because at `mvp` tier there is no mutation survivor set to write them from. The count moved to
413 later, when the phase-3 remediation rounds added the three scenarios described below.

### Evidence: post-remediation re-run (2026-10-26)

Asks the same four gates against the tree as it stands after the phase-3 rounds.

command: npm test
exit: 0
at: 2026-10-26T06:55:18Z

```
 Test Files  46 passed (46)
      Tests  413 passed (413)
   Start at  07:55:18
   Duration  15.23s (transform 3.36s, setup 1.44s, collect 33.92s, tests 29.60s, environment 6.50s, prepare 9.42s)
```

command: npx tsc --noEmit
exit: 0
at: 2026-10-26T06:55:38Z

```
(no output — clean)
```

command: npm run lint
exit: 0
at: 2026-10-26T06:55:40Z

```
> renta-clara@0.1.0 lint
> eslint .
```

command: npm run build
exit: 0
at: 2026-10-26T06:55:43Z

```
 ✓ Compiled successfully in 7.1s
   Generating static pages (0/7) ... → (7/7)
```

command: .standards/scripts/check-code-principles.sh . -BaseRef main --json
exit: 0
at: 2026-10-26T06:56:07Z

```
tier=mvp fails=0 warns=0
```

The delta is +8 tests / +2 files over the 405, all from `AC-002-retrieval-vocabulary.test.ts`
(5 tests) and `AC-002-policy-scope.test.ts` (3 tests). Nothing else in the suite changed; no
pre-existing test was edited to accommodate the remediation.

---

## Phase 3 — deploy verification and remediation

Stage 5b opened **PR #13** (draft). Phase 2's first CI round was green — 5 of 5 checks `pass`,
recorded in `25-verification.md` §Phase 2 — round 1 — so phase 3 began. It took two attempts and,
between them, two remediation rounds, each found by **running the product**, not by a gate.

### Attempt 1 — ESCALATED (infrastructure, not code)

The Vercel preview sits behind Vercel Authentication: a 302 to `sso-api`, `/api/chat` answering
401 `Protected deployment`, and no `VERCEL_AUTOMATION_BYPASS_SECRET` available to bypass it.
Nothing code-diagnosable was returned, so the fix-routing rule had nothing to route. Recorded in
`40-deploy.md` (attempt 1), **superseded** by attempt 2. This attempt implies no code defect.

### Remediation round 1 — retrieval ranked the governing passage out of sight

Found by a live end-to-end run against the built tree: real auth, real LLM, real
`corpus/corpus.json`, server on `localhost:3124`.

`Quiero darme de alta de autónomo. Guíame` returned `retrievalHitCount: 5` and cited `IAE
Regla 2`, `LIRPF art. 29`, `RIRPF art. 22` — then abstained from the procedure. The passage that
governs the *trámite*, `BOE-A-2007-15984#a9` (art. 9 RD 1065/2007, declaración censal de alta),
sat at **rank 95**. The IVA question retrieved **nothing** from Ley 37/1992 at all. The bundle was
full, correctly sized, and full of the wrong passages.

**Fix:** phrase-gated synonym expansion in `src/retrieval/expand.ts` only — colloquial phrasing
mapped onto the statute's own vocabulary (*darme de alta* → censal / empresarios / profesionales
/ retenedores / 036; *empiezo a presentar el IVA* → declaraciones-liquidaciones / sujetos
pasivos). The scoring threshold was **not** lowered and top-K was **not** raised:
`minRetrievalScore` 0.1 and `retrievalTopK` 5 are unchanged in `src/config/env.ts`, which is the
point — relaxing the gate would have masked the defect instead of fixing it.

**Measured after:** `#a9` rank **95 → 2**; the IVA obligation article rank **84 → 2**.

**Tests:** `AC-002-34` / `AC-002-35` in `test/acceptance/AC-002-retrieval-vocabulary.test.ts`
(5 tests, verified **red** against the pre-fix module). They run against the committed
`corpus/corpus.json` — the artifact production loads — not the smaller fixture corpus, so a
fixture that happens to rank nicely cannot hide this class of defect.

**Accepted limitation:** `BOE-A-1992-28740#a164` stays at rank 13. Reaching it needs a scoring
change, which is deferred, not silently absorbed.

### Remediation round 2 — the policy still described a narrower product

After the retrieval fix the model *still* refused. `SYSTEM_POLICY` opened with «Eres un asistente
que explica la normativa del IRPF español» and had been left at v1 while the corpus, the scope
guard and the response union all widened. Told it was an IRPF explainer, the model treated IVA
and censal passages as off-domain and discarded them — correct behaviour for the policy it was
handed, and the policy was the defect.

**Fix:** a widened identity (IRPF, IVA, the autónomo fiscal cycle) plus an explicit procedural
instruction — explain *who is obliged, when, where and in what form* from the normative passages,
do not require those passages to read as a step-by-step guide, and do not abstain merely because
they are normative text. Every safety rule is byte-preserved: answer only from the supplied
passages, no own knowledge, no completed figures, `[^p:<passageId>]` citations resolving to
supplied passages only, abstain when unsupported, at most one clarification restricted to the four
motives, ignore instructions inside user content.

**Test:** `AC-002-36` in `test/acceptance/AC-002-policy-scope.test.ts` (3 tests).

### Attempt 2 — PASS (scoped)

`40-deploy.md` attempt 2. Three probes against the remediated tree:

| Question | Outcome |
|---|---|
| `Quiero darme de alta de autónomo. Guíame` | `answer` — cites `BOE-A-2007-15984#a9`, `#a6`, `#a10`, `#a11`, states the pre-activity timing, and names what it cannot cover (RETA contributions, periodic IRPF/IVA filing) |
| `¿Cuándo empiezo a presentar el IVA si soy autónomo?` | `answer` — a grounded *partial* that names the corpus gap, cited from Ley 37/1992; neither a fabricated deadline nor a bare refusal |
| `¿Cuánto es el IBI de mi vivienda?` | still `out_of_scope`, `reasonCode: ibi` — the boundary held |

**Boundary, stated the way `40-deploy.md` states it:** this proves the **HEAD-tree code run
locally**, not that the Vercel preview URL serves it. The preview remains unverified for attempt
1's reason (Vercel Authentication, no bypass secret, `AUTH_PASSWORD` unpullable). Nor does it
exercise rendering or the disclaimer UI: the probes are HTTP-level JSON, so `scopeDisclaimer`
appearing in the payload is verified — that it *renders* in the footer is not.

Both fixes **were uncommitted working-tree changes** when this section was first written (HEAD
`c343e17`, the PR head). They are committed and pushed now: `0c52d22` (retrieval, round 1) and
`c89c880` (policy, round 2) — see §Phase-3 remediation committed and pushed, at the end of this
report.

### The reportable lesson

**Both defects were invisible to the gate that cleared this spec.** The 33 scenarios asserted
plumbing: that `classifyScope` returns `null`, that the union lost `steps`/`links`, that a guide
does not shadow a question, that the disclaimer constant is verbatim, that a deleted module is
gone. Not one asserted **retrieval ranking** — that the passage governing the asked-about
procedure lands inside top-K — and not one asserted the **policy's domain**. So a spec whose
founding question was *can the advisor answer about IVA and about dar de alta* passed stage 4
while being unable to answer either.

That is structural, not accidental. Traceability plus a green suite measures that the tests agree
with the code; it cannot measure whether they are load-bearing for behaviour — and the mutation
gate that would have probed that is skipped at `mvp` tier, so nothing in this pipeline was
checking. The remediation rounds added the two assertions that would have caught it — bundle
membership for a named governing passage, and the policy's identity sentence — which gives the
suite a class of test it did not have before. But they were written *after* a human ran the
product.

The generalizable rule: **a spec that widens what a retrieval-grounded product covers needs at
least one scenario asserting retrieval output for a real question against the real corpus, and
one asserting the prompt's stated scope.** Neither is a plumbing assertion, and neither existed
here.

---

## Remediation record

`docs/SPEC_PIPELINE.md §Remediation budget` requires the phase and attempt count at which each
BLOCK was resolved. Sources: `25-verification.md`'s attempt log (§Phase 2 — round 1) and the
orchestrator's loop summary in `runs.jsonl`, `specSlug: "002-advisor-scope-expansion"` — three
records, in run order.

| Phase | Budget | Consumed | Outcome | State |
|---|---|---|---|---|
| Phase 1 — pre-PR (local + design gates) | max 3 | **1 attempt** | 1 gate failure observed (audit-trail heading format), 1 resolved | **closed**, 0 outstanding |
| Phase 2 — post-PR CI | max 3 | **1 round** | CI green on the first round — 5 of 5 checks `pass`, 0 fix rounds | **closed**, no routing needed |
| Phase 3 — deploy verification | max 3 | **2 attempts** | attempt 1 `ESCALATED` (Vercel Authentication, superseded); attempt 2 **PASS (scoped)** | **closed on the PASS verdict** — 1 attempt unused, 0 fix rounds consumed |

Per-phase detail:

- **Phase 1** — Verifier passed attempt 1 with no gate failure. Stage 5a's audit-trail run then
  found the heading-format defect; stage 4 fixed it in one scoped re-verification
  (`25-verification.md` §Re-verification (attempt 2, phase 1)) and the gate re-ran exit 0. One
  attempt consumed of three.
- **Phase 2** — PR #13, round 1: `lint`, `test`, `build`, `Vercel`, `Vercel Preview Comments` all
  `bucket: pass`, terminal at `2026-10-25T18:00:53Z` after 3 polls over ~75 s. No FAIL, no
  remediation, no routing. One round consumed of three.
- **Phase 3** — attempt 1 `ESCALATED` on preview unreachability (infrastructure, superseded);
  attempt 2 **PASS, scoped**. Two attempts consumed of three; `Phase-3 budget exhausted` does
  **not** apply. Between the two attempts, two **behaviour** remediation rounds were applied
  (retrieval ranking, then prompt policy), each found by a live run rather than by a gate. Note
  the accounting: `40-deploy.md` records **0 fix rounds consumed**, because a "fix round" in that
  counter is a *fix-and-redeploy*, and no redeploy was triggered — the build under test is the Git
  integration's single build of `c343e17`, and the run under test is the local server for this
  tree. The loop therefore advanced by attempts (1 → 2), not by fix rounds. Do not recompute the
  budget as "2 attempts plus 2 remediation rounds".

Orchestrator counters, verbatim, across the three spec-002 runs — the progression is the record:

```
{"specSlug":"002-advisor-scope-expansion","gatesFailed":[],"outcome":"pass","loopCount":0,"phase1Retries":0,"phase2Retries":0}
{"specSlug":"002-advisor-scope-expansion","gatesFailed":[],"outcome":"pass","loopCount":1,"phase1Retries":1,"phase2Retries":0}
{"specSlug":"002-advisor-scope-expansion","gatesFailed":[],"outcome":"pass","loopCount":2,"phase1Retries":1,"phase2Retries":0}
```

`25-verification.md` agrees on the latest: `SPEC_LOOP_COUNT=2`, `SPEC_PHASE1_RETRIES=1`,
`SPEC_PHASE2_RETRIES=0`.

**On the phase-1 round this report itself raised.** The first record (`loopCount 0`) is the state
the Verifier saw and is correct for it: no gate FAILed during its own run, so it consumed nothing
then. The audit-trail defect was invisible at stage 4 — the Verifier does not run that gate; it is
stage 5b's pre-push gate, and stage 5a ran it first. It closed in a single further round, recorded
as attempt 2 in `25-verification.md`, and appears as `phase1Retries: 1` from the second record on.

**Phase 3 is not in `runs.jsonl` at all.** The orchestrator's record schema carries only
`phase1Retries` and `phase2Retries`; the phase-3 attempt counter lives in `40-deploy.md` and is the
authority for that row. Do not read the absence of a phase-3 field as zero attempts — it is two of
three, per that artifact.

No budget is exhausted: phase 3 retains one attempt, and phases 1 and 2 retain two each.

> Note on provenance: `runs.jsonl` also holds four records for spec **001** with
> `phase1Retries: 3` (a different spec, whose phase-1 budget was exhausted and which was
> resolved by a human-authorized fourth round). Those counters belong to spec 001 and are **not**
> carried into this report.

---

## Test-quality judgment without a mutation engine

With no mutation run, I can still read the tests and ask the question a mutant would ask:
*if this implementation were wrong, would the assertion fail?* At stage 5a I read **every** AC-002
test file that then existed — all 33 scenarios (11 files) — plus `test/unit/allowed-norms.test.ts`
and the two test doubles that every behavioral assertion routes through
(`test/support/fake-llm-adapter.ts`, `test/support/ui-harness.tsx`).

The three scenarios added later by the phase-3 rounds (`AC-002-34`, `35`, `36` — 8 tests in 2
files) were reviewed afterwards, to the depth recorded in the strengths list below. Their counts
are reflected in this report; their assertions were not audited with the same scenario-by-scenario
rigour as the original 33. The findings in this section are unchanged by them.

I fixed nothing. This section is a report.

### Where the suite would catch a wrong implementation

Worth stating, so the weak spots below are read as exceptions rather than the rule:

- **`AC-002-06`** writes a real artifact to a temp directory, breaks one new norm's parse,
  re-runs the CLI, and asserts the file on disk is **byte-identical** afterwards (`expect(readFileSync(path,'utf8')).toBe(before)`). Plus a second case where a norm parses to zero passages and must fail rather than shrink the corpus. A mutant that writes on failure, or that tolerates a partially-parsed norm, dies here.
- **`AC-002-12` / `AC-002-18`** walk the real `src/` tree and grep for the withdrawn constants
  (`AUTONOMO_*`, `IVA_GUIDE`, `RETA_GUIDE`, `MODEL_303/390/036`, `MODELS_OVERVIEW`). A constant
  that survives anywhere in `src/` fails these.
- **`AC-002-04` / `AC-002-05`** assert against `ALLOWED_NORMS` itself and re-derive the hash
  independently (`expect(second.artifact.contentHash).toBe(contentHashOf(fixturePassages()))`),
  so the hash is not compared to a copy of itself.
- **`AC-002-26`'s ordering assertion** (`scopeIndex === aiIndex + 1`) is real, matching the Verifier's adjudication: a missing scope line yields `-1`, which cannot equal `aiIndex + 1`; reordering or interposing a paragraph breaks it.
- **`callCount` assertions are trustworthy**: `FakeLlmAdapter.callCount` is `requests.length`, incremented in both `complete` and `completeAll`, so `callCount === 0` on a refusal and `=== 1` on an answer are genuine ordering/latency claims, not decoration.
- **`AC-002-34` / `AC-002-35`** (added after the phase-3 retrieval defect) run against the
  committed `corpus/corpus.json` — the production artifact, not the fixture corpus — and assert
  that a *named governing passage is inside the bundle* under the unchanged `retrievalTopK`. That
  is the right granularity: the bundle is what the model sees, so membership is the behavioural
  claim, while 95 → 2 is measurement rather than an assertion (a hard rank assertion would be
  brittle against future corpus growth). These are the tests that would have caught the retrieval
  defect, and they are the reason that class of defect is no longer invisible — see §Phase 3.
- **`AC-002-36`** pins the policy to the widened scope by regex over the assembled `system` string
  (identity names IRPF/IVA/autónomo/alta censal; the procedural instruction is present; every
  safety rule survives). It cannot assert model behaviour — the constant is the strongest thing a
  test can guarantee here — so it guards against the *policy* drifting back, not against the model
  ignoring it.

### Weak or tautological assertions found (named, not fixed)

1. **`test/unit/allowed-norms.test.ts:15` — a pure tautology.** `expect(ids).toEqual([...ids])`
   compares an array with a shallow copy of itself; it cannot fail for any implementation. The
   test is named "keeps a stable order", which this assertion does not establish. **No coverage
   gap**, because order stability is genuinely covered behaviorally by `AC-002-04`
   (`fetcher.fetchedNormIds` must equal `ALLOWED_NORMS.map(n => n.normId)`, and
   `result.artifact.norms` must be in the same order). The assertion is dead weight only. This
   file carries no `AC-002-NN` id — it is an untagged unit test, so it is outside the 33
   scenarios' contract.

2. **`AC-002-13`, third test (`the payload type itself has no optional steps or links`) —
   self-constructed literal.** It builds an object literal typed `OutOfScopeResponse` and
   asserts `Object.keys(response)).toHaveLength(7)` on the literal the test itself wrote. No
   production value is read. If `OutOfScopeResponse` gained an optional `steps?: string[]`, this
   test still passes (the field is simply absent from the literal); a *required* added field
   fails `tsc`, not this assertion. **No coverage gap** — the scenario is held by the two
   siblings in the same file: the real `answerQuestion` payload's exact key set, and the
   interface source slice that must not contain `steps`/`links`.

3. **`AC-002-25`, first test (`AnswerResponse declares an optional scopeDisclaimer`)** — matches
   `/scopeDisclaimer\?: string;/` against the whole of `src/service/types.ts`, so it asserts the
   text exists *somewhere in the file*, not that it sits on `AnswerResponse`. Moving the line
   onto another interface would keep it green. **No coverage gap** — the sibling behavioral test
   reads `response.scopeDisclaimer` off a real `answer` response citing a non-IRPF norm.

4. **`AC-002-27`, third test (`the explanation names the topic and the competent body`)** —
   self-referential: `expect(response.explanation).toContain(response.topicLabel)` takes both
   sides from the same response object, so a wrong label/body pair passes as long as the template
   interpolates it consistently. Only the independent `toMatch(/Lo que sí cubro/)` is
   non-circular here. **Mostly covered elsewhere** — `AC-002-09` pins the six remaining
   `label`/`officialBody` pairs verbatim in another file.

5. **`AC-002-07`, second test (`adding a norm changes the content hash`)** —
   `expect(contentHashOf(irpfOnly)).not.toBe(contentHashOf(all))` would only fail if the hash
   ignored content entirely; for any non-degenerate hash of distinct inputs it is close to
   unfalsifiable. Weak but not vacuous, and the stronger guarantee is covered by `AC-002-05`.

**Assessment:** four of the five are redundant-but-weak rather than coverage holes — each
scenario is held by a stronger sibling assertion in the same or an adjacent file — and the fifth
(AC-002-07) is a genuinely thin assertion for a requirement that a second test already carries.
**None of them is a defect in the implementation, and none is worth a follow-up spec**: items 1–3
are one-line cleanups that belong in whatever next touches those files, not in their own spec.

### Recorded limitation (not a weak assertion — a real gate with a named blind spot)

`AC-002-21`'s no-hardcoded-quantities audit covers **only** `src/content` + `src/prompts`, and
only **string literals** matched against three heuristic patterns. A figure hardcoded in
`src/components` or `src/service` is not caught by it, and a spelled-out amount without `%`,
`€`, or a quantity keyword slips through. The Verifier recorded this; I confirm it and carry it
forward unchanged. This is the one item here with genuine gap shape — see the follow-up judgment
below.

### What I did not inspect

My reading judgment covers all 33 AC-002 scenarios and their doubles. I did **not** read the
bodies of the pre-existing spec-001 regression tests (`AC-001-scope-guard.test.ts`,
`test/unit/text-and-guards.test.ts`, `AC-001-chat-ui.test.ts`, `AC-001-corpus-sync.test.ts`,
`AC-001-passage-model.test.ts`) — I saw them only through `AC-002-29`/`AC-002-30`'s structural
assertions about their contents. So no claim in this section extends to the 001 suite's
assertion quality.

### Follow-up judgment

The tautologies do not warrant a spec. If a follow-up is ever raised, the candidate is widening
`AC-002-21` from `src/content + src/prompts` to all of `src/` with an explicit model-identifier
allowlist — and it should ride along with a future content change rather than earn a spec of its
own, since the current blind spot is covered by the human read-audit the task describes.

---

## Out-of-scope findings carried forward from `25-verification.md` (unchanged)

Recorded, not fixed. Carried forward verbatim in substance; none was re-litigated, and none
blocks.

1. **`OfficialLink` type — correct-as-is (not orphaned).** Defined in
   `src/content/scope-topics.ts:21`; still imported and used by `src/service/types.ts:8,53`
   (`GuideResponse.links`) and `src/content/gestor-guides.ts:2,10,17,20` (`GuideContent.links`,
   `AEAT_MODELOS`). It lost its `OutOfScopeResponse` use (Task 4) but keeps its guide-link use.
   Naming hint only: the type now describes guide links yet lives in the scope-topics module — a
   cohesion smell, not a defect, and not worth a follow-up spec on its own.

2. **`abstentionNotice` exported — correct-as-is, minor hint.** Exported from
   `use-chat-turn.ts:71`, consumed in production at `use-chat-turn.ts:133`, and additionally
   imported directly by `test/acceptance/AC-002-registration-path.test.ts:13`. A production
   function whose export also enables direct unit testing; a pure seam would be the smell.

3. **Pre-existing design-principles FAILs (2) — out of scope, not a block.**
   `LoginForm.tsx` CC=8 and the vendored `.standards` cobalt example CC=10. Both byte-identical
   to `main` (confirmed again this run: the `LoginForm` FAIL appears at identical coordinates
   in the `main` worktree measurement and in the working tree), therefore neither is in this
   spec's diff and neither blocks it.

4. **`shadowsAnswerableSubject` left per-matcher — correct-as-is.** The guard
   (`gestor-guides.ts:295`) is applied individually at each colliding predicate
   (`gastosGuide:308`, `laborGuide:322`, `presentationGuide:359`), not as a single early gate.
   Defensible: only three retained guides can collide with an answerable subject, and each call
   site makes its own decision explicit. Centralizing would be a mild DRY win at the cost of
   hiding which guides are affected. Not a defect.

Also carried forward as recorded warnings (orchestrator summary, unchanged): the whole-repo
design-principles 2 pre-existing FAILs; the YAGNI `CorpusFetcher` single-implementation WARN
(`src/corpus/fetcher.ts`, pre-existing); and the AC-002-21 scope limitation.

---

## Handoff — current state and next stage

Stage 5b's part is done: **PR #13** (draft) is open on `spec/002-advisor-scope-expansion` — at head
`c343e17` when this section was written, and at the remediation head after §Phase-3 remediation
committed and pushed. Phase 2 is green (5 of 5 checks pass). Phase 3 ran to **PASS, scoped** on
attempt 2 of 3. Stage 5d (the Archiver) is next; it runs `check-audit-trail.sh --require-deploy`,
which this spec now satisfies — `40-deploy.md` exists and carries a verdict.

Three things must travel with the PR:

- **Two fixes are committed and pushed** (`0c52d22` retrieval, `c89c880` policy), alongside the two
  new scenario files, their tests, `40-deploy.md` and this report. The PR head now contains the
  behaviour attempt 2 verified; see §Phase-3 remediation committed and pushed.
- **The preview lane is unresolved, by design.** The Vercel deployment sits behind Vercel
  Authentication with no bypass secret; `40-deploy.md` records that as an open human action, not a
  code defect. Phase 3's PASS is a local-run PASS, and the artifact says so in those words.
- **The "4 FAIL → 0" baseline figure** remains unverified (the Coder-state tree is unrecoverable).
  It blocks nothing.

Every gate is green at the tree as it stands: suite 413 / 46, type-check, lint, build, diff-scoped
design-principles 0 FAIL / 0 WARN, audit-trail exit 0. The mutation gate is still skipped by tier,
not by failure — which is worth remembering the next time a defect slips through, as two did here.

Stage 5a itself committed and pushed nothing and modified no production code or test. The
measurement worktree used for the baseline numbers was removed (`git worktree list` shows only the
spec branch checkout).

---

## PR — appended by stage 5b (PR Opener)

PR: https://github.com/RexiAI/tax-advisor/pull/13
commit-count: 16
at: 2026-10-25T17:58:44Z
amended: 2026-10-26 — commit-count 13 → 16 after the phase-3 remediation commits; the block's
original `at:` timestamp is left as written, because that is when the PR was opened.
fix-commits: 0c52d22 (round 1, retrieval), c89c880 (round 2, policy), plus the stage-5b docs commit
pushed-head: recorded in the PR body of #13 and in §Phase-3 remediation committed and pushed. A tip
commit cannot embed its own SHA — writing it changes the SHA — so the sha of the pushed head lives
in the mutable PR body, which is where a reviewer reads it anyway.

Draft PR, base `main`, head `spec/002-advisor-scope-expansion`. One conventional commit per task
in `10-tasks.md` (11), plus `docs(spec-002)` for the artifacts and this amendment. Files that
span tasks were grouped in the task that owns them (`allowed-norms.ts` → Task 1,
`responses.ts`/`answer-question.ts`/`types.ts`/`use-chat-turn.ts` → Task 4, `strings.ts` →
Task 7) and the grouping is stated in each commit body; no file was split across commits.

Archive state, recorded so the next stage does not misread the red gate: this PR deliberately
carries `specs/002-advisor-scope-expansion/` and no `docs/changes/` one-pager.
`check-specs-archived.sh` therefore exits 1 at this head — stage 5d (the Archiver) resolves it as
the pipeline's final act, after stage 5c writes `40-deploy.md` into this folder
(`docs/SPEC_PIPELINE.md` §Archive in the PR). Archiving at 5b would delete the folder stage 5c
needs. This repo's CI (`.github/workflows/ci.yml`) does not wire that gate, so CI is unaffected;
the PR is simply not mergeable until 5d runs.

*Updated at the remediation head (2026-10-26):* the gate no longer exits 1 — it exits 0 for a
**spurious** reason, not because the spec was archived. The evidence and the mechanism are at the
end of this report (§Phase-3 remediation committed and pushed); nothing was archived, and stage 5d
still owns that move.

### Evidence: draft PR opened

command: gh pr create --draft --base main --head spec/002-advisor-scope-expansion --title "feat: expand the advisor from IRPF explainer to autónomo fiscal cycle" --body-file /tmp/opencode/pr-body-002.md
exit: 0
at: 2026-10-25T17:58:44Z

```
https://github.com/RexiAI/tax-advisor/pull/13
```

### Evidence: PR is a draft against main

command: gh pr view 13 --json number,url,isDraft,baseRefName,headRefName,state
exit: 0
at: 2026-10-25T17:58:44Z

```
{"baseRefName":"main","headRefName":"spec/002-advisor-scope-expansion","isDraft":true,"number":13,"state":"OPEN","url":"https://github.com/RexiAI/tax-advisor/pull/13"}
```

### Evidence: audit-trail gate, re-run at the committed tree

command: .standards/scripts/check-audit-trail.sh 002-advisor-scope-expansion
exit: 0
at: 2026-10-25T17:57:20Z

```
✔ Audit-trail check: specs/002-advisor-scope-expansion complete, verifier evidence recorded.
```

### Evidence: archive gate at this head (expected red until stage 5d)

command: .standards/scripts/check-specs-archived.sh
exit: 1
at: 2026-10-25T17:57:20Z

```
  [FAIL] 002-advisor-scope-expansion is finished (has 30-report.md) but not archived — missing docs/changes/002-advisor-scope-expansion.md
         Run: scripts/archive-spec.sh 002-advisor-scope-expansion (stage 5d does this automatically)
1 finished spec(s) not archived!
```

---

## Phase-3 remediation committed and pushed — stage 5b, second invocation

The phase-3 PASS above was earned on a working tree, not on the PR head. This invocation closes that
gap: the two fixes, their two scenario files and their tests, `40-deploy.md`, the phase-2 record in
`25-verification.md`, Tasks 12–13 in `10-tasks.md`, the `runs.jsonl` record and this report were
committed in three conventional commits and pushed to `origin/spec/002-advisor-scope-expansion`.

| Commit | Subject | Concern |
|---|---|---|
| `0c52d22` | `fix(retrieval): reach the norm that governs a procedure from colloquial wording` | Task 12 — `src/retrieval/expand.ts` + `AC-002-retrieval-vocabulary` scenario + test |
| `c89c880` | `fix(prompts): stop telling the model this is an IRPF-only assistant` | Task 13 — `src/prompts/system-policy.ts` + `AC-002-policy-scope` scenario + test |
| (this commit) | `docs(spec-002): record the phase-3 remediation and the deploy verdict` | the spec-folder record, `40-deploy.md`, `runs.jsonl`, this amendment |

Commit count on the branch: **16** (13 at PR open + 3 here). Each commit body names its phase-3
provenance (remediation round 1, round 2) and why no gate in this report could see the defect it
fixes — the same question `§The reportable lesson` answers structurally.

Staging was by explicit path in both fix commits; `.env.local` was never staged and
`config/agent.local.env` is untracked and gitignored. `.playwright-mcp/` (browser-automation scratch
from the live runs) is left untracked deliberately — it is not part of this spec.

### Evidence: audit-trail gate before this push

command: .standards/scripts/check-audit-trail.sh 002-advisor-scope-expansion
exit: 0
at: 2026-10-26T07:01:16Z

```
PASS 002-advisor-scope-expansion: 10-tasks.md present and non-empty
PASS 002-advisor-scope-expansion: 20-acceptance/ has an AC-*.md with a '## AC-NNN-NN' heading (AC-015-10)
PASS 002-advisor-scope-expansion: 25-verification.md present and non-empty
PASS 002-advisor-scope-expansion: 30-report.md present and non-empty
PASS 002-advisor-scope-expansion: 15-design.md present and non-empty (AC-015-13)
PASS 002-advisor-scope-expansion: 40-deploy.md present and non-empty (AC-031-18)
PASS 002-advisor-scope-expansion: evidence block 'scenario traceability' — command: .standards/scripts/check-scenario-traceability.sh, exit: 0, at: 2026-10-25T17:40:30Z
PASS 002-advisor-scope-expansion: evidence block 'full test suite' — command: npm test, exit: 0, at: 2026-10-25T17:40:45Z
PASS 002-advisor-scope-expansion: evidence block 'complexity gate' — command: npm run lint, exit: 0, at: 2026-10-25T17:41:20Z
PASS 002-advisor-scope-expansion: evidence block 'design-principles gate' — command: .standards/scripts/check-code-principles.sh ., exit: 1, at: 2026-10-25T17:42:40Z
PASS 002-advisor-scope-expansion: evidence block 'scenario-to-behavior spot check' — command: (manual read of test + source + scenario; no shell command), exit: 0, at: 2026-10-25T17:43:40Z
✔ Audit-trail check: specs/002-advisor-scope-expansion complete, verifier evidence recorded.
```

`40-deploy.md` now resolves its line to `PASS` (it was `absent — tolerated pre-5c` in the block
above, recorded at PR-open time). That is the artifact stage 5d's `--require-deploy` gate needs, and
it is present.

### Evidence: archive gate — red while `40-deploy.md` was untracked, a spurious pass once tracked

Both runs below are the same script on the same tree; the only difference is that `40-deploy.md`
became a tracked file in the commit that precedes this section.

command: .standards/scripts/check-specs-archived.sh
exit: 1
at: 2026-10-26T07:01:16Z

```
  [FAIL] 002-advisor-scope-expansion is finished (has 30-report.md) but not archived — missing docs/changes/002-advisor-scope-expansion.md
         Run: scripts/archive-spec.sh 002-advisor-scope-expansion (stage 5d does this automatically)
1 finished spec(s) not archived!
```

command: .standards/scripts/check-specs-archived.sh
exit: 0
at: 2026-10-26T07:02:02Z

```
  [OK] 002-advisor-scope-expansion phase-3 budget exhausted (40-deploy.md records escalation) — archival deferred to the human
All finished specs archived.
```

**The exit 0 is spurious, and must not be read as "no archive needed".** The script reads the
*index* copy of the deploy artifact (`git show ":specs/<slug>/40-deploy.md"`, lines 45–48 of
`check-specs-archived.sh`) and takes the spec-031 exception when that text matches
`Phase-3 budget exhausted` or `Verdict:[[:space:]]*ESCALATED`. While the file was untracked the
`git show` failed, control fell to the FAIL branch, and the gate was honest. Now that it is
tracked, the match fires on the two lines that say the marker does **not** apply
(`40-deploy.md:28`, `:258`) — the artifact's final verdict is `Verdict: PASS` (§Verdict summary) —
so the gate concludes the pipeline stopped and escalated before stage 5d, which it did not.

Consequence, stated plainly: **this pass does not license a merge and does not discharge the
archive.** Archiving stays stage 5d's act (`docs/SPEC_PIPELINE.md` §Archive in the PR,
§Definition of done item 6) and nothing was archived in this invocation — `specs/002-advisor-scope-expansion/`
is still in the tree, `docs/changes/002-advisor-scope-expansion.md` does not exist, and stage 5d
still has to run `archive-spec.sh` and then `check-audit-trail.sh --require-deploy`. Archiving here
would delete the `40-deploy.md` that 5d's gate exists to read, so this invocation deliberately does
not do it.

**Out-of-scope finding (recorded, not fixed — gate scripts are off-limits to pipeline agents, and
this one lives in the `.standards` submodule).** The ESCALATED exception is matched as a substring
over the whole artifact, so an artifact that *discusses* the marker satisfies it. A gate that reads
the final `Verdict:` line, rather than any mention of a verdict anywhere in the prose, would not
have this hole. Proposed follow-up against `.standards`: anchor the check to the verdict row and
keep the marker-text branch separate, with a negative case in its selftest for an artifact that
negates the marker. Until then, this exit code should not be trusted as evidence of archival state.

## 15-design.md

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

## 40-deploy.md

# 40-deploy.md — Deploy verification (stage 5c, phase 3)

Spec: `002-advisor-scope-expansion`
Repo: `RexiAI/tax-advisor` — classified **frontend**. Signals: `vercel.json` (`"framework": "nextjs"`),
Next.js 15 dependency in `package.json`, linked Vercel project in `.vercel/project.json`
(`projectName: tax-advisor`, `projectId: prj_WDoYUNdHoRHw6lOuxNz3WxMTTllo`).
PR: #13 (draft) · branch `spec/002-advisor-scope-expansion` · HEAD
`c343e17d4c4a7efd5e942311a9891b81a57abd0c` · **working tree dirty** (see §Tree under test)
Phase-3 attempt: **2 of 3** · fix rounds consumed: **0** · written at `2026-10-26T06:54:30Z`
Attempt 1 verdict `ESCALATED` (Vercel preview behind Vercel Authentication) — **superseded** by this
attempt, whose evidence is below.

## Summary

| Field | Value |
|---|---|
| Deploy URL (canonical, the deployment under test) | `https://tax-advisor-j4phqcxjy-danielbueno76-4270s-projects.vercel.app` |
| Deploy URL (branch alias) | `https://tax-advisor-git-spec-002-ad-acc3be-danielbueno76-4270s-projects.vercel.app` |
| Deployment id | `dpl_49KcnY72nvoS8cvtbXHiwG4W8Wwz` |
| Preview reachability | **still behind Vercel Authentication** — attempt 1 evidence, superseded, not re-litigated here (see §Preview lane) |
| Endpoint actually exercised | `http://localhost:3124` — the already-running server for this working tree (HTTP-level run) |
| Built from commit | `c343e17d4c4a7efd5e942311a9891b81a57abd0c` + uncommitted working-tree changes |
| Build status | **PASS** — attempt 1: `READY`, 44 s build, 17 s post-build. No build was triggered by this attempt. |
| Health check (`GET /health`, local run) | **PASS** — `200`, `{"status":"ok","checks":{"llmConfig":"ok","corpusIndex":"ok"}}` in 3.4 ms |
| Behaviour probes (`POST /api/chat` ×3) | **PASS** — 3 of 3 questions satisfy their judging rule (see §Per-question verdicts) |
| E2E verdict | **SKIPPED** — no suite wired in this repo; the HTTP-level run carried verification |
| Fix-routing class | none — no failure to route |
| Phase-3 budget | **2 of 3** attempts used; 0 fix rounds consumed; `Phase-3 budget exhausted` does **not** apply |

**Verdict: PASS**

## Claim boundary (explicit)

**This artifact proves the HEAD-tree code run locally at `http://localhost:3124` — it does not prove
the Vercel preview URL serves that code.** The three behavioural questions and the health check were
answered by a process on this machine, not by `tax-advisor-j4phqcxjy-…vercel.app`. The preview lane
remains unverified for the reason attempt 1 recorded: the deployment sits behind Vercel
Authentication (`vercel_auth_enabled: true`), no `VERCEL_AUTOMATION_BYPASS_SECRET` exists in the
`preview` environment, and `POST /api/chat` additionally requires an `AUTH_SECRET`-signed session
whose `AUTH_PASSWORD` cannot be pulled. Nothing in this attempt changes that. Reading this as "the
preview deploy is green" would be reading a claim this artifact does not make.

What is established: the shipped behaviour of spec 002 — scope expansion to the censal/IVA/autónomo
cycle — is present and correct in the code as it exists on disk at HEAD `c343e17` plus the dirty tree,
when that code is actually executed and asked real questions.

No `vercel deploy` / `vercel deploy --prod` was run at any point; the Git integration is the source of
truth for builds. No commit, push, tag, or production-code change was made. No service was started,
stopped, built, or restarted by this stage — the server on `:3124` was already running when the stage
began.

## Tree under test

command: git rev-parse HEAD; git status --porcelain
exit: 0
at: 2026-10-26T06:52:57Z

```
c343e17d4c4a7efd5e942311a9891b81a57abd0c
 M runs.jsonl
 M specs/002-advisor-scope-expansion/10-tasks.md
 M specs/002-advisor-scope-expansion/25-verification.md
 M src/prompts/system-policy.ts
 M src/retrieval/expand.ts
?? .playwright-mcp/
?? specs/002-advisor-scope-expansion/20-acceptance/AC-002-policy-scope.md
?? specs/002-advisor-scope-expansion/20-acceptance/AC-002-retrieval-vocabulary.md
?? specs/002-advisor-scope-expansion/40-deploy.md
?? test/acceptance/AC-002-policy-scope.test.ts
?? test/acceptance/AC-002-retrieval-vocabulary.test.ts
```

HEAD is the same commit the preview deployment was built from, but **the tree is dirty**: the two
source files carrying this spec's behaviour change — `src/prompts/system-policy.ts` (+16/−1) and
`src/retrieval/expand.ts` (+39) — are modified and uncommitted. The run below therefore exercises
`c343e17` **plus** those uncommitted changes, not the commit alone. Per the Stop-and-Ask decision
matrix this stage did not stash, revert, or commit anything; it records the state.

Corroboration that the running process includes the dirty-tree changes (not merely HEAD): the observed
behaviour matches exactly what the uncommitted diff introduces — the censal vocabulary in
`expand.ts` (`censo`, `censal`, `empresarios`, `profesionales`, `retenedores`, `036`, `037`) is what
surfaces `BOE-A-2007-15984#a9` for "darme de alta de autónomo", and the IVA filing terms
(`devengo`, `sujeto pasivo`, `liquidacion`) are what surface `BOE-A-1992-28740#a167/#a85` for the
IVA-timing question. On unmodified HEAD those questions resolve to LGSS cese passages instead. The
`system-policy.ts` diff adds the ALCANCE/PREGUNTAS DE PROCEDIMIENTO sections whose effect is visible
in the Q1 answer's grounded four-step explanation and in `scopeDisclaimer` being present.

## Evidence: health check (local run)

command: curl -sS -w '\nHTTP %{http_code} in %{time_total}s\n' --max-time 20 http://localhost:3124/health
exit: 0
at: 2026-10-26T06:53:59Z

```
{"status":"ok","checks":{"llmConfig":"ok","corpusIndex":"ok"}}
HTTP 200 in 0.003379s
```

`200` with the application's real `HealthBody`: both external dependencies the health route checks —
`llmConfig` and `corpusIndex` — report `ok`. Health check status **PASS** for the local run.

## Evidence: session established

command: curl -sS -X POST http://localhost:3124/api/auth/login -H 'content-type: application/json' -c jar.txt -d '{"email":"$AUTH_ALLOWED_EMAIL","password":"$AUTH_PASSWORD"}'
exit: 0
at: 2026-10-26T06:53:07Z

```
login HTTP 200
{"ok":true}
cookie received: rc_session (HttpOnly)
```

Credentials were read from `.env.local` into the shell environment only. No credential value appears
in this artifact, in any log line, or on any command line argument.

## Evidence: behaviour probes — three `POST /api/chat` calls

command: curl -sS -X POST http://localhost:3124/api/chat -H 'content-type: application/json' -b jar.txt --data-binary '{"message":"<question>"}'
exit: 0
at: 2026-10-26T06:53:21Z (Q1) · 2026-10-26T06:53:24Z (Q2) · 2026-10-26T06:53:24Z (Q3)

All three returned `HTTP 200` with a server-sent-event stream: `data: {"type":"delta",…}` chunks
followed by one `event: final` record carrying the structured response, then `event: done`.

### Per-question verdicts

| # | Question | HTTP | `kind` | `reasonCode` | Cited passage ids | `scopeDisclaimer` | Verdict |
|---|---|---|---|---|---|---|---|
| Q1 | `Quiero darme de alta de autónomo. Guíame` | 200 | `answer` | — (absent) | `BOE-A-2007-15984#a9`, `BOE-A-2007-15984#a6`, `BOE-A-2007-15984#a10`, `BOE-A-2007-15984#a11` | **present** | PASS |
| Q2 | `¿Cuándo empiezo a presentar el IVA si soy autónomo?` | 200 | `answer` | — (absent) | `BOE-A-2003-23186#a36`, `BOE-A-1992-28740#a167`, `BOE-A-1992-28740#a85`, `BOE-A-1992-28740#a163sexiesdecies`, `BOE-A-1990-23930#regla2` | **present** | PASS |
| Q3 | `¿Cuánto es el IBI de mi vivienda?` | 200 | `out_of_scope` | `ibi` | — (none; out-of-scope responses cite nothing) | absent | PASS |

Verbatim opening sentence of each response:

- **Q1** — «Para darte de alta como autónomo tienes que presentar una declaración de alta en el Censo de Empresarios, Profesionales y Retenedores, y hacerlo antes de empezar la actividad.»
- **Q2** — «No puedo confirmar cuándo empieza a presentarse el IVA siendo autónomo con los pasajes facilitados.»
- **Q3** — «Las preguntas sobre el IBI quedan fuera de mi alcance: la administración competente es la autoridad tributaria de tu comunidad autónoma.» (`explanation` field; `out_of_scope` responses carry no delta stream)

### Q1 — alta de autónomo: passes the judging rule

- **Starts the real procedure**: names the *declaración de alta en el Censo de Empresarios,
  Profesionales y Retenedores* in the first sentence, and the body explains the obligation, the census
  data required, and what the same declaration is used to communicate (NIF, IVA regime, IRPF
  estimation-method waivers).
- **Cites `BOE-A-2007-15984#a9`**: yes — both in the citation list and as an inline marker
  (`[^p:BOE-A-2007-15984#a9]`, 13 occurrences across the stream).
- **States the timing**: «hacerlo antes de empezar la actividad» in the summary, and the regulation's
  own rule — «con anterioridad al inicio de las correspondientes actividades … a la realización de las
  operaciones … al nacimiento de la obligación de retener o ingresar a cuenta» — plus the cese
  deadlines (one month; six months for heirs) from `#a11`.
- **Cites at least one other passage**: three others — `#a6`, `#a10`, `#a11`.
- **Contains none of the forbidden strings**: `Fuera del alcance` — absent; `no es una cuestión de
  IRPF` — absent; `fuera del alcance` — absent (case-insensitive check).
- **No six-step canned procedure**: the answer is not the old refusal-with-steps. It is a grounded
  four-part explanation (`Primero` / `Segundo` / `Tercero` / `Cuarto`, no bold headings, no asterisk
  bullets), each part carrying its own inline passage marker from `BOE-A-2007-15984`, and it is
  explicitly a partial answer — its closing line names what it cannot cover: «Con estos pasajes puedo
  explicarte el alta censal, pero no puedo confirmarte las cotizaciones al RETA ni las obligaciones
  periódicas de declaración del IRPF y del IVA, porque no aparecen en los textos facilitados.»

This is the "partial answer that delivers the censal procedure and names what it cannot cover" case,
which the rule admits as a pass; it is not a bare abstention.

### Q2 — IVA filing timing: passes as an honest partial grounded in `BOE-A-1992-28740`

`kind: answer`, and the answer is candid about the gap it cannot close: the corpus passages do not fix
the moment the IVA filing obligation arises or its deadlines. It still grounds what it does say in the
IVA law itself — `BOE-A-1992-28740#a167` (sujeto pasivo determines and pays the debt in the manner and
periods set by the Minister) and `#a85` (intra-community acquisitions) — and states the general
obligation to file the alta declaration for merely carrying on an economic activity
(`BOE-A-1990-23930#regla2`), plus `BOE-A-2003-23186#a36` for who the taxpayer is. It closes by naming
the passage class it would need and offers to narrow by income type.

Named-gap partial grounded in `BOE-A-1992-28740` → **PASS** under the stated rule. It is not a
fabricated deadline and not a hallucinated article.

### Q3 — IBI: passes

`kind: out_of_scope` with `reasonCode: ibi`, `topicLabel: el IBI`, `officialBody: la autoridad
tributaria de tu comunidad autónoma`, a `handoffUrl`, and the standard `disclaimer`. The scope
boundary is declared rather than answered, and the reason code is exactly `ibi` as required.

## Evidence: E2E suite wiring

command: ls -d playwright.config.ts playwright.config.js maestro.yml .maestro e2e; grep -n '"e2e"' package.json; grep -nE '"(playwright|@playwright/test|maestro)"' package.json
exit: 0
at: 2026-10-26T06:53:59Z

```
ls: cannot access 'playwright.config.ts': No such file or directory
ls: cannot access 'playwright.config.js': No such file or directory
ls: cannot access 'maestro.yml': No such file or directory
ls: cannot access '.maestro': No such file or directory
ls: cannot access 'e2e': No such file or directory
no e2e npm script
no playwright/maestro dep
```

No Playwright config, no Maestro flow directory, no `e2e` npm script, and no `playwright` /
`@playwright/test` / `maestro` dependency in `package.json`. The repo's test layer is Vitest
(`"test": "vitest run"`) under `test/`; `.playwright-mcp/` in the working tree holds browser-session
artifacts only (a console log and a page snapshot), not a suite.

**E2E verdict: `skipped — no suite wired`.**

Disclosure, because it changes what the pass above rests on: the agentic browser E2E path (the
`e2e-runner` standard) **could not complete in this harness** — no `e2e` framework, no suite, and no
browser session that reached a judged journey for this spec. Verification was therefore carried by
the HTTP-level run recorded above: live HTTP calls to a running instance of this tree, with the real
corpus, the real retrieval path, the real model configuration, and a real authenticated session. That
is a genuine live-system check of the application's behaviour; it is not a browser E2E, and it does
not exercise rendering, the `scopeDisclaimer` UI in `AnswerBlock.tsx`, or client-side wiring.

## Preview lane (attempt 1 evidence, superseded but not revoked)

Attempt 1 of this phase verified the Vercel build and found the preview unreachable:

| Check | Attempt 1 result |
|---|---|
| Build (`vercel inspect`, `vercel ls -m githubCommitSha=c343e17…`) | **PASS** — exactly one deployment for the head SHA, `READY`, `44 s` build `+17 s` post-build |
| Health check against the preview URL | **FAIL** — `302` to Vercel SSO (`Protected by Vercel Authentication`) |
| `POST /api/chat` against the preview URL | **BLOCKED** — `401 {"error":{"message":"Protected deployment","code":"401"},"protection":{"vercel_auth_enabled":true}}` |
| Runtime logs for the deployment | 0 records in the 30-minute probe window — no request reached the app |

Those measurements stand; this attempt did not re-run them and does not contradict them. The one line
that matters, restated: **the preview deployment stays behind Vercel Authentication, so no probe
issued by this stage can reach the application through the preview URL.** Attempt 1's `ESCALATED`
verdict for that lane is what a human must still resolve (Project Settings → Deployment Protection →
*Protection Bypass for Automation*, or disable *Vercel Authentication* for previews), and that
requirement is unchanged. This attempt supersedes attempt 1 only in the sense that the behavioural
questions now have an answer measured on real code — not in the sense that the preview became
verifiable.

## Fix-routing outcome

No branch of the fix-routing rule fires, because no check failed:

| Branch | Applies? | Reasoning |
|---|---|---|
| E2E runner exits non-zero → spec-coder | **No** | No suite is wired; the runner never ran, so no exit code exists |
| Vercel configuration-classified error → self-retry after repair | **No** | No Vercel API call was made by this attempt, and no configuration error was returned |
| Structural/complexity gate failure → spec-refactorer | **No** | No structural gate is in play in phase 3 |
| Ambiguous build or health failure → STOP and escalate | **No** | Health check returned `200` with both dependencies `ok`; build status is `PASS` |

## Phase-3 budget state

- Attempt: **2 of 3** (max 3 fix-and-redeploy rounds; counter independent of phase 1 and phase 2).
- Fix rounds consumed: **0**, cumulative. No redeploy was triggered by attempt 1 or attempt 2 — the
  build under test is the Git integration's single build of `c343e17`, and the run under test is the
  already-running local server for this tree.
- Attempt 1 (`ESCALATED`, preview behind Vercel Authentication) is superseded by this record; it is
  retained in summary form above because its diagnosis is still the open human action for the preview
  lane, not because it still governs the verdict.
- Phase-2 precondition: satisfied — CI on PR #13 head `c343e17` is terminal and green (`lint`, `test`,
  `build` SUCCESS; Vercel SUCCESS; Vercel Preview Comments SUCCESS), recorded in
  `25-verification.md §Phase 2 — round 1`. Phase 3 started only after that, so the two loops did not race.
- The marker line `Phase-3 budget exhausted` does **not** apply: this is a pass on attempt 2 of 3.
- One attempt remains unused. It is not needed for this phase's verdict; it remains available if a
  human later unblocks the preview lane and wants that lane measured too.

## Deliberate non-actions, for the record

- **No `vercel deploy` / `vercel deploy --prod`** was run, and none would be: a CLI deploy alongside
  the Git integration double-builds `c343e17`, races the integration, and orphans a deployment no PR
  owns.
- **`vercel curl` was not run** in this attempt either, for the reason attempt 1 recorded: a green
  result obtained through a channel no other consumer (CI, an E2E runner, a reviewer) can reproduce is
  not evidence about the deployed system as delivered.
- **No service was built, started, stopped, or restarted.** The server on `:3124` was already running.
- **No protection setting was changed, no `vercel env add` was issued.** The missing pieces are a
  protection policy decision and a credential, not an environment variable this stage may invent.
- **This artifact is the only file this stage writes.** `25-verification.md` and `30-report.md` were
  not touched.

Verdict: PASS
