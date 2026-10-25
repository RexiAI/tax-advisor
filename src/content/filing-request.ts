/**
 * `filing_request` matcher (Task 11).
 *
 * Keys on direct address, not on filing vocabulary: "si presentas la declaración
 * conjunta" is a generic-tú question about the rules, while "preséntame la
 * declaración" is a request to this product. Every shape is anchored to the
 * message start or to a benefactive clitic. A polysemous verb such as "presentar"
 * also requires the filing as its object, so "¿me presentas el resumen?" stays in
 * scope.
 */

/** Where a message starts, once its opening punctuation is out of the way. */
function head(text: string): string {
  return text.replace(/^[\s¿¡"«»']+/, '');
}

const FILING_OBJECT = '(declaracion(?:es)?|renta|irpf|modelo|autoliquidacion|borrador)';
const FILING_VERB_STEM = '(present|firm|tramit|represent)';
const GENERIC_ACT_STEM = '(hac|prepar|gestion)';
const SECOND_PERSON_MODAL = '(puedes|podrias|podeis|podriais|quieres|querrias|sabrias|harias)';
const CLUSTER = '(?:la|lo|las|los|mela|melo)';
const BENEFACTIVE = '(me|mela|melo|melas|melos)';
/** Verbal forms listed explicitly so the `hac` stem cannot swallow "hacienda". */
const ACTION_VERB =
  '(?:(?:present|firm|tramit|represent|prepar|gestion)[a-z]*|hacer|haces|hace|hagas|haz)';

// Imperative with the speaker as object. A filing verb implies the filing by
// itself ("Preséntame"); a generic verb needs the filing as its object, so
// "hazme un resumen" stays in scope.
const IMPERATIVE_FILING_ATTACHED = new RegExp(
  `\\b(presenta|presente|firma|firme|tramita|tramite|representa|represente)${BENEFACTIVE}\\b`
);
const IMPERATIVE_FILING_SPACED = new RegExp(
  '\\b(presenta|presente|firma|firme|tramita|tramite|representa|represente)\\s+me\\b'
);
const IMPERATIVE_GENERIC = new RegExp(
  `\\b(haz|prepara|prepare|gestiona|gestione)${BENEFACTIVE}\\b[^.]{0,80}?\\b${FILING_OBJECT}\\b`
);

// The imperative that opens the message, with the user's own filing as object.
const IMPERATIVE_OWN_FILING = new RegExp(
  `^(presenta|firma|representa|prepara|tramita|gestiona|haz)\\s+(mi|mis)\\s+${FILING_OBJECT}\\b`
);

// Question-initial address with a modal: the modal governs the filing verb
// directly, so "¿puedes explicarme cómo presentar…?" (asking for information) is
// not a request to file.
const MODAL_FILING = new RegExp(
  `^${SECOND_PERSON_MODAL}\\s+(?:me\\s+)?${FILING_VERB_STEM}[a-z]*\\b`
);

// "me" + second-person filing verb. "presentar" is polysemous, so this shape
// needs the filing as its object unless the "me la/lo" cluster already names it.
const ME_WITH_FILING = new RegExp(
  '^me\\s+(?:(?:la|lo|las|los|mela|melo)\\s+)?' +
    '(presentas|presentes|firmas|firmes|tramitas|tramites|representas|representes)\\b' +
    `[^.]{0,80}?\\b${FILING_OBJECT}\\b`
);
const ME_CLUSTER_WITH_FILING = new RegExp(
  '^me\\s+(?:la|lo|las|los|mela|melo)\\s+' +
    '(presentas|presentes|firmas|firmes|tramitas|tramites|representas|representes)\\b'
);

// "me la/lo" names the user's declaration, so any action verb will do, with or
// without a modal: "¿me la puedes preparar tú?", "¿me la preparas?", "¿me lo haces?".
const ME_CLUSTER_WITH_ACTION = new RegExp(
  `^me\\s+${CLUSTER}\\s+(?:${SECOND_PERSON_MODAL}\\s+)?[^.]{0,60}?\\b${ACTION_VERB}\\b`
);
// The cluster attached to the verb, after a modal: "¿Puedes preparármela?".
const MODAL_WITH_GENERIC_CLUSTER = new RegExp(
  `^${SECOND_PERSON_MODAL}\\s+${GENERIC_ACT_STEM}[a-z]*(mela|melo|melas|melos)\\b`
);
// A generic second-person verb whose object is the user's filing:
// "¿Me haces la declaración?", "¿Podrías hacerme el borrador?".
const ME_WITH_GENERIC = new RegExp(
  `^me\\s+(?:(?:la|lo|las|los)\\s+)?(preparas|prepares|haces|hagas|gestionas|gestiones)\\b` +
    `[^.]{0,80}?\\b${FILING_OBJECT}\\b`
);
const MODAL_WITH_GENERIC_ME = new RegExp(
  `^${SECOND_PERSON_MODAL}\\s+${GENERIC_ACT_STEM}[a-z]*me\\b[^.]{0,80}?\\b${FILING_OBJECT}\\b`
);

// An explicit wish whose subject is the product.
const WISH_FOR_YOU = new RegExp(
  '^(?:por favor,?\\s+)?(quiero|necesito|prefiero|quisiera|me gustaria|me interesaria)\\s+que\\s+' +
    '(?:me\\s+)?(presentes|firmes|tramites|representes|prepares|hagas|gestiones)\\b'
);

// Representation. "por mí mismo" / "por mi cuenta" / "por mi parte" is the
// taxpayer acting, and "el contrato está en mi nombre" is ownership: neither is a
// request, so the phrase must sit next to a filing verb (or, for a generic verb,
// next to the filing itself).
const NOT_SELF = '(?!\\s+(mismo|cuenta|parte))';
const REPRESENTATION_BY_ME = new RegExp(
  `\\b${FILING_VERB_STEM}[a-z]*\\b[^.]{0,40}?\\bpor\\s+mi\\b${NOT_SELF}`
);
const REPRESENTATION_IN_MY_NAME = new RegExp(
  `\\b${FILING_VERB_STEM}[a-z]*\\b[^.]{0,40}?\\ben\\s+mi\\s+nombre\\b`
);
const REPRESENTATION_WITH_GENERIC_ACT = new RegExp(
  `\\b${GENERIC_ACT_STEM}[a-z]*\\b[^.]{0,30}?\\b${FILING_OBJECT}\\b[^.]{0,20}?\\bpor\\s+mi\\b${NOT_SELF}`
);

function imperativeRequest(text: string): boolean {
  const filing = IMPERATIVE_FILING_ATTACHED.test(text) || IMPERATIVE_FILING_SPACED.test(text);
  return filing || IMPERATIVE_GENERIC.test(text);
}

function imperativeOwnFilingRequest(text: string): boolean {
  return IMPERATIVE_OWN_FILING.test(head(text));
}

function modalRequest(text: string): boolean {
  return MODAL_FILING.test(head(text));
}

function benefactiveFilingRequest(text: string): boolean {
  const start = head(text);
  return ME_WITH_FILING.test(start) || ME_CLUSTER_WITH_FILING.test(start);
}

function benefactiveActionRequest(text: string): boolean {
  const start = head(text);
  return ME_CLUSTER_WITH_ACTION.test(start) || MODAL_WITH_GENERIC_CLUSTER.test(start);
}

function benefactiveGenericRequest(text: string): boolean {
  const start = head(text);
  return ME_WITH_GENERIC.test(start) || MODAL_WITH_GENERIC_ME.test(start);
}

function wishRequest(text: string): boolean {
  return WISH_FOR_YOU.test(head(text));
}

function representationRequest(text: string): boolean {
  const filing = REPRESENTATION_BY_ME.test(text) || REPRESENTATION_IN_MY_NAME.test(text);
  return filing || REPRESENTATION_WITH_GENERIC_ACT.test(text);
}

const ADDRESS_FORMS: readonly ((text: string) => boolean)[] = [
  imperativeRequest,
  imperativeOwnFilingRequest,
  modalRequest,
  benefactiveFilingRequest,
  benefactiveActionRequest,
  benefactiveGenericRequest,
  wishRequest,
  representationRequest,
];

/**
 * `true` when the message asks this product to file, sign, prepare or represent.
 * The argument is the normalized message (lowercased, accents stripped); opening
 * punctuation is preserved and handled by `head()`.
 */
export function isFilingRequest(normalizedText: string): boolean {
  return ADDRESS_FORMS.some((form) => form(normalizedText));
}
