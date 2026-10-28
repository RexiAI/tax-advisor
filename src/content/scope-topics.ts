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

import type { Tax } from '../domain/source';

import { isFilingRequest } from './filing-request';

/**
 * `uncovered_community` is not a topic: it is the coverage verdict for a named
 * community outside the matrix (spec 004 decision 4). The ordered topic list
 * below never carries it.
 */
export type OutOfScopeReasonCode =
  | 'filing_request'
  | 'itp'
  | 'isd'
  | 'ibi'
  | 'non_residents'
  | 'company_tax'
  | 'uncovered_community';

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
  /** The coverage axis this refusal is checked against, when it has one. */
  readonly tax?: Tax;
  /** Tested against the accent-stripped, lowercased message. */
  readonly match: (normalizedText: string) => boolean;
}

/** The common case: a topic identified by any of a few patterns. */
function anyOf(patterns: readonly RegExp[]): (normalizedText: string) => boolean {
  return (normalizedText) => patterns.some((pattern) => pattern.test(normalizedText));
}

/** The tax itself, in either spelling. Tested against the normalized text. */
const IBI_PATTERNS: readonly RegExp[] = [/\bibi\b/, /impuesto sobre bienes inmuebles/];

export function mentionsIbi(normalizedText: string): boolean {
  return anyOf(IBI_PATTERNS)(normalizedText);
}

/**
 * The expense-deductibility stems: first and second person, where the taxpayer is
 * the subject of the verb (`deducirme`, `desgravar`, `deducción`, `deducible`).
 *
 * Third-person present forms are excluded on purpose — in `¿cuánto desgrava el
 * IBI en mi ayuntamiento?` the tax is the subject and the amount it is asked for
 * is the IBI's own rate, which is a question about the IBI, not about deducting
 * an expense. `descontar`, `descuento` and `restar` are not signals at all:
 * `descontar el IVA de una factura` is subtraction, not expense deductibility.
 * The irregular first person `deduzco` is not reachable by the stem and stays out
 * of the signal.
 */
const DEDUCTIBILITY_STEM = /\b(?:deduc|desgrav)\w*/;
const THIRD_PERSON_STEM = /\b(?:deduce|deduces|deducen|desgrava|desgravas|desgravan)\b/;

export function isDeductibilityQuestion(normalizedText: string): boolean {
  return DEDUCTIBILITY_STEM.test(normalizedText) && !THIRD_PERSON_STEM.test(normalizedText);
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
    tax: 'itp',
    match: anyOf([/\bitp\b/, /transmisiones patrimoniales/]),
  },
  {
    reasonCode: 'isd',
    label: 'el ISD',
    officialBody: COMUNIDAD_AUTONOMA,
    tax: 'isd',
    match: anyOf([/\bisd\b/, /sucesiones y donaciones/, /impuesto sobre sucesiones/]),
  },
  {
    reasonCode: 'ibi',
    label: 'el IBI',
    officialBody: COMUNIDAD_AUTONOMA,
    tax: 'ibi',
    // The tax itself, not the Spanish phrase for "real estate": a question about
    // "los rendimientos del alquiler de bienes inmuebles" is core IRPF (arts. 22-24
    // LIRPF) and must reach retrieval.
    //
    // Spec 003: naming the IBI inside an expense-deductibility question is not a
    // question about the IBI. That turn reaches retrieval, and the answer says
    // separately that the IBI's own rules are not covered (the boundary note).
    match: (normalizedText) =>
      mentionsIbi(normalizedText) && !isDeductibilityQuestion(normalizedText),
  },
  {
    reasonCode: 'non_residents',
    label: 'el impuesto sobre la renta de no residentes',
    officialBody: AEAT,
    tax: 'non_residents',
    match: anyOf([/\bno residentes?\b/, /renta de no residentes/]),
  },
  {
    reasonCode: 'company_tax',
    label: 'el Impuesto sobre Sociedades',
    officialBody: AEAT,
    tax: 'company_tax',
    match: anyOf([/impuesto sobre sociedades/]),
  },
];
