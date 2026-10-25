/**
 * Out-of-scope topics (Task 11, narrowed by spec 002): one ordered map from topic
 * to reason code and official body. The first match wins, so a mixed message is
 * deterministic.
 *
 * VAT, Social Security contributions and autónomo registration are not in this
 * map any more: the corpus covers them, so those questions reach retrieval and
 * get a citation like any other. What stays out is what the corpus cannot ground
 * — a request to file, and the taxes of other administrations (ITP, ISD, IBI,
 * non-residents, company tax).
 *
 * `filing_request` delegates to `./filing-request.ts`; the rest are patterns over
 * the normalized message.
 */

import { isFilingRequest } from './filing-request';

export type OutOfScopeReasonCode =
  'filing_request' | 'itp' | 'isd' | 'ibi' | 'non_residents' | 'company_tax';

export interface OfficialLink {
  readonly href: string;
  readonly label: string;
}

export const AEAT = 'Agencia Tributaria';
export const COMUNIDAD_AUTONOMA = 'la autoridad tributaria de tu comunidad autónoma';

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
];
