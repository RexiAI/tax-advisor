/**
 * Every user-facing string in the product (Task 15). Spanish only, one module,
 * one export per string. The product name and the handoff destination are single
 * constants so the human gate can change each in one line.
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

export const EMPTY_STATE_HEADING = '¿Qué quieres saber sobre tu IRPF?';
export const EMPTY_STATE_EXAMPLES: readonly string[] = [
  '¿Puedo deducirme el alquiler de mi vivienda habitual?',
  '¿Cómo tributan las ganancias por la venta de acciones?',
  '¿Qué gastos puedo deducirme siendo autónomo?',
];

export const OUT_OF_SCOPE_TITLE = 'Fuera del alcance de esta herramienta';
export const CLARIFICATION_TITLE = 'Necesito un dato más';

export const STATUS_SEARCHING = 'Buscando en el BOE';
export const STATUS_CHECKING_SOURCES = 'Comprobando fuentes';

export const COMPOSER_LABEL = 'Escribe tu pregunta';
export const COMPOSER_PLACEHOLDER = 'Pregunta sobre el IRPF';
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
  'Puedo explicar el texto consolidado del BOE, pero no sustituyo a un asesor fiscal.';

export const ERROR_MESSAGES = {
  missing_llm_config:
    'El servicio no está configurado en este momento. Vuelve a intentarlo más tarde.',
  message_too_long:
    'La pregunta es demasiado larga. El límite es de 2.000 caracteres: acórtala y vuelve a intentarlo.',
  unexpected_field: 'La solicitud contiene campos que no están permitidos.',
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

export const NOT_FOUND_TITLE = 'Página no encontrada';
