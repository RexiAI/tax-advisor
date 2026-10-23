/**
 * Out-of-scope topics (Task 11): one ordered map from topic to reason code and
 * official body. The first match wins, so a mixed message is deterministic.
 * `filing_request` delegates to `./filing-request.ts`; the rest are patterns over
 * the normalized message.
 */

import { isFilingRequest } from './filing-request';

export type OutOfScopeReasonCode =
  | 'filing_request'
  | 'iva'
  | 'itp'
  | 'isd'
  | 'ibi'
  | 'non_residents'
  | 'company_tax'
  | 'social_security'
  | 'autonomo_registration';

export interface OfficialLink {
  readonly href: string;
  readonly label: string;
}

export const AEAT = 'Agencia Tributaria';
export const COMUNIDAD_AUTONOMA = 'la autoridad tributaria de tu comunidad autónoma';
export const TESORERIA_SEGURIDAD_SOCIAL = 'Tesorería General de la Seguridad Social';

export interface OutOfScopeTopic {
  readonly reasonCode: OutOfScopeReasonCode;
  /** Spanish name of the topic, as shown to the user. */
  readonly label: string;
  readonly officialBody: string;
  /** Tested against the accent-stripped, lowercased message. */
  readonly match: (normalizedText: string) => boolean;
}

/** The common case: a topic identified by any of a few patterns. */
function anyOf(patterns: readonly RegExp[]): (normalizedText: string) => boolean {
  return (normalizedText) => patterns.some((pattern) => pattern.test(normalizedText));
}

export const OUT_OF_SCOPE_TOPICS: readonly OutOfScopeTopic[] = [
  {
    reasonCode: 'filing_request',
    label: 'la presentación de la declaración',
    officialBody: AEAT,
    // Defined by direct address (six forms), not by vocabulary — see the module.
    match: isFilingRequest,
  },
  {
    reasonCode: 'iva',
    label: 'el IVA',
    officialBody: AEAT,
    match: anyOf([/\biva\b/]),
  },
  {
    reasonCode: 'itp',
    label: 'el ITP',
    officialBody: COMUNIDAD_AUTONOMA,
    match: anyOf([/\bitp\b/, /transmisiones patrimoniales/]),
  },
  {
    reasonCode: 'isd',
    label: 'el ISD',
    officialBody: COMUNIDAD_AUTONOMA,
    match: anyOf([/\bisd\b/, /sucesiones y donaciones/, /impuesto sobre sucesiones/]),
  },
  {
    reasonCode: 'ibi',
    label: 'el IBI',
    officialBody: COMUNIDAD_AUTONOMA,
    // The tax itself, not the Spanish phrase for "real estate": a question about
    // "los rendimientos del alquiler de bienes inmuebles" is core IRPF (arts. 22-24
    // LIRPF) and must reach retrieval.
    match: anyOf([/\bibi\b/, /impuesto sobre bienes inmuebles/]),
  },
  {
    reasonCode: 'non_residents',
    label: 'el impuesto sobre la renta de no residentes',
    officialBody: AEAT,
    match: anyOf([/\bno residentes?\b/, /renta de no residentes/]),
  },
  {
    reasonCode: 'company_tax',
    label: 'el Impuesto sobre Sociedades',
    officialBody: AEAT,
    match: anyOf([/impuesto sobre sociedades/]),
  },
  {
    reasonCode: 'autonomo_registration',
    label: 'el alta de autónomos',
    officialBody: 'Agencia Tributaria y Tesorería General de la Seguridad Social',
    // Registration intent, not an IRPF deduction question. "¿Qué gastos puedo
    // deducirme siendo autónomo?" must stay in scope.
    match: anyOf([
      /\b(dar|darme|darse|quiero|empezar|iniciar|alta|registro)\b[^.]{0,40}\bautonom/,
      /\bautonom[oa]s?\b[^.]{0,30}\b(alta|empezar|iniciar|ser|darse)\b/,
      /\balta\b[^.]{0,30}\breta\b/,
    ]),
  },
  {
    reasonCode: 'social_security',
    label: 'la cuota de autónomos y la Seguridad Social',
    officialBody: TESORERIA_SEGURIDAD_SOCIAL,
    // The contribution quota and the payment/affiliation sense, not the IRPF
    // deductibility of contributions: "¿son deducibles las cotizaciones a la
    // Seguridad Social?" is an IRPF question and stays in scope, while "¿cuánto
    // pago a la Seguridad Social?" is the quota and is routed.
    match: anyOf([
      /cuota de autonomos?/,
      /\b(pagar|pago|pagando|cuota|alta|baja|afiliacion)\b[^.]*\bseguridad social\b/,
      /\bseguridad social\b[^.]*\b(pagar|pago|cuota|alta|baja|afiliacion)\b/,
    ]),
  },
];
