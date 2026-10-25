/**
 * Every user-facing string (Task 15). Spanish only; name and handoff destination
 * are single constants.
 */

export const APP_NAME = 'Renta Clara';

export const HANDOFF_URL = 'mailto:asesoria@example.com';
export const HANDOFF_LABEL = 'Hablar con un asesor';

export const AI_DISCLOSURE =
  'Esto es información general elaborada con IA, no asesoramiento fiscal personalizado.';

export const CONSOLIDATED_TEXT_NOTICE =
  'El texto consolidado del BOE es informativo y no tiene valor legal. Este producto no es una publicación oficial del BOE ni cuenta con su respaldo.';

export const PRIVACY_WARNING = 'No escribas tu DNI, NIE, IBAN ni documentos personales.';

export const CORPUS_FRESHNESS_LABEL = 'Corpus';
export const TAX_YEAR_LABEL = 'Año fiscal';

export const SOURCES_TITLE = 'Fuentes';
export const SOURCE_LINK_LABEL = 'Ver en el BOE';
export const SOURCE_LINK_ARIA_PREFIX = 'Ver en el BOE';
export const SOURCE_UPDATED_LABEL = 'Actualizado';

export const ANSWER_SUMMARY_HEADING = 'En resumen';
export const ANSWER_RULE_HEADING = 'La norma dice';
export const ANSWER_EXAMPLE_HEADING = 'Ejemplo';

export const SKIP_LINK_LABEL = 'Saltar a la respuesta';

export const EMPTY_STATE_HEADING = '¿Qué quieres saber sobre tus impuestos?';
export const EMPTY_STATE_EXAMPLES: readonly string[] = [
  '¿Qué pasos tiene el alta de autónomo?',
  '¿Cuándo empiezo a presentar el IVA?',
  '¿Puedo deducirme el alquiler de mi vivienda habitual?',
];

export const OUT_OF_SCOPE_TITLE = 'Fuera del alcance de esta herramienta';
export const CLARIFICATION_TITLE = 'Necesito un dato más';
export const INSUFFICIENT_TITLE = 'No puedo confirmarlo con el BOE';
export const YEAR_NOTICE_TITLE = 'Sobre el año de la pregunta';

/**
 * The refusal body. The second clause answers "what IS in scope" inside the same
 * field, so a refusal never reads as a dead end and needs no extra payload.
 */
export const OUT_OF_SCOPE_EXPLANATION =
  'Las preguntas sobre {topic} quedan fuera de mi alcance: la administración competente es {body}. Lo que sí cubro, con la norma del BOE citada, es el IRPF, el IVA y el ciclo fiscal del autónomo.';

/**
 * A filing request names no topic: the ordered guard may have matched a message
 * that also mentions a covered tax, and the refusal must not read as if the user
 * had asked about it.
 */
export const FILING_REQUEST_EXPLANATION =
  'No presento declaraciones ni tramito modelos en tu nombre. Para presentar, la administración competente es {body}. Lo que sí hago es explicarte la norma en la que se basa el trámite, con la cita del BOE.';

export const STATUS_SEARCHING = 'Buscando en el BOE';

export const COMPOSER_LABEL = 'Escribe tu pregunta';
export const COMPOSER_PLACEHOLDER = 'Pregunta sobre IRPF, IVA o autónomos';
export const COMPOSER_SUBMIT_LABEL = 'Preguntar';
export const COMPOSER_HELPER = 'Pulsa Enter para enviar y Mayús+Enter para una línea nueva.';
export const COMPOSER_THREAD_HEADING = 'Conversación';

export const PRIVACY_WARNING_MESSAGE =
  'No puedo procesar datos personales. He detectado un dato de tipo {category}. Reformula la pregunta sin incluirlo.';

export const PRIVACY_CATEGORY_LABELS = {
  dni: 'DNI',
  nie: 'NIE',
  iban: 'IBAN',
} as const;

export const INSUFFICIENT_EXPLANATIONS = {
  no_results:
    'No he encontrado en el texto del BOE pasajes que respondan a esta pregunta, así que no puedo confirmar ningún dato sobre ella.',
  below_threshold:
    'Lo que he encontrado en el BOE no se ajusta lo suficiente a esta pregunta, así que no puedo confirmar la respuesta.',
  no_citations:
    'La respuesta no se apoya en ningún pasaje del BOE que haya recuperado para esta pregunta, así que no puedo confirmarla.',
  unverified_citation:
    'La respuesta citaba normas que no forman parte de los pasajes recuperados para esta pregunta, así que no puedo confirmarla.',
  corpus_unavailable:
    'No puedo consultar el texto del BOE en este momento, así que no puedo confirmar la respuesta.',
} as const;

export const INSUFFICIENT_BOUNDARY =
  'Puedo explicar el texto consolidado del BOE, pero no sustituyo a un asesor fiscal ni presento nada en tu nombre.';

/**
 * The product boundary, rendered only on a guide footer: it names the acts the
 * product does not perform rather than a tax, so it reads correctly whatever
 * subject the guide covers. Composed into `GUIDE_FOOTER` here, never in a
 * component: `Notice` has one footer slot and user-facing copy belongs to this
 * module.
 */
export const ANSWER_BOUNDARY =
  'Explico la norma, no tramito altas ni declaraciones y no calculo cuotas ni importes: eso depende de tus datos y del año.';

export const GUIDE_FOOTER = `${AI_DISCLOSURE} ${ANSWER_BOUNDARY}`;

/**
 * Shown when the answer leans on a norm that is not the IRPF. Derived from the
 * cited norms by the service, never from the user's wording.
 */
export const REINFORCED_SCOPE_DISCLAIMER =
  'Esta respuesta se apoya en una norma distinta del IRPF (IVA, Seguridad Social o el alta de autónomos). Es información general: confirma las cuantías y plazos vigentes con la administración competente.';

export const ERROR_MESSAGES = {
  missing_llm_config:
    'El servicio no está configurado en este momento. Vuelve a intentarlo más tarde.',
  message_too_long: 'La pregunta es demasiado larga. Acórtala y vuelve a intentarlo.',
  invalid_request: 'La solicitud no tiene el formato esperado.',
  unexpected_field: 'La solicitud contiene campos que no están permitidos.',
  unauthorized: 'Tu sesión ha caducado. Vuelve a entrar.',
  missing_auth_config: 'El acceso no está configurado en este momento.',
  corpus_unavailable:
    'No puedo consultar el texto del BOE en este momento. Vuelve a intentarlo más tarde.',
  rate_limited:
    'Has hecho demasiadas preguntas seguidas. Espera unos segundos antes de volver a preguntar.',
  llm_timeout: 'La respuesta ha tardado demasiado. Vuelve a intentarlo.',
  llm_unauthorized:
    'No hemos podido contactar con el servicio de respuestas. Vuelve a intentarlo más tarde.',
  llm_rate_limited: 'El servicio de respuestas está ocupado. Vuelve a intentarlo en un momento.',
  llm_upstream_error:
    'No hemos podido contactar con el servicio de respuestas. Vuelve a intentarlo más tarde.',
  llm_malformed_response:
    'No hemos podido interpretar la respuesta del servicio. Vuelve a intentarlo más tarde.',
} as const;

export type ErrorCode = keyof typeof ERROR_MESSAGES;

export const RETRY_AFTER_LABEL = 'Puedes volver a preguntar en {seconds} segundos.';

/**
 * The corpus year and the asked year are the only numbers allowed in a string:
 * they identify a corpus year, they are not a quantity. A question can name a
 * year incidentally ("me di de alta en 2019"), so the wording must not claim the
 * norm changed *because of* that year.
 */
export const YEAR_NOTICE_BODY =
  'El texto del BOE que cito corresponde al año {corpusYear}. Si tu caso se rige por {askedYear}, la norma puede haber cambiado y el criterio no tiene por qué ser el mismo.';
