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
