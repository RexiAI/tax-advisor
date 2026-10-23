/**
 * Small Spanish tax synonym layer for lexical retrieval. BOE text says
 * "devolución" and "cuota diferencial"; taxpayers say "me sale a pagar o a
 * devolver". Without this, the exact words never meet and the answer abstains.
 *
 * Keep this list short and tax-specific; it is not a general thesaurus.
 */

import { normalizeTerms, normalizeText } from './normalize';

const PHRASE_SYNONYMS: readonly (readonly [RegExp, readonly string[]])[] = [
  [
    /\b(sale a pagar|a pagar o a devolver|me sale a pagar|tengo que pagar|me devuelven)\b/,
    ['cuota', 'diferencial', 'devolucion'],
  ],
  [/\ba devolver\b/, ['devolucion', 'devoluciones']],
  [/\bdevolver\b/, ['devolucion']],
  [/\bdeclaracion de la renta\b/, ['autoliquidacion', 'declaracion']],
  [/\bborrador\b/, ['autoliquidacion']],
  [/\bcuota de autonomos\b/, ['cotizacion', 'seguridad social']],
];

const TERM_SYNONYMS: Readonly<Record<string, readonly string[]>> = {
  devolver: ['devolucion'],
  devolucion: ['devolver'],
  devoluciones: ['devolucion'],
  pagar: ['cuota', 'ingreso'],
  pago: ['cuota', 'ingreso'],
  retencion: ['retenciones'],
  retenciones: ['retencion'],
  autonomo: ['autonomos', 'actividad economica'],
  autonomos: ['autonomo', 'actividad economica'],
  alquiler: ['arrendamiento'],
  arrendamiento: ['alquiler'],
  acciones: ['participaciones', 'transmision'],
  vivienda: ['inmueble'],
  nomina: ['rendimientos del trabajo'],
};

export function expandTerms(query: string): string[] {
  const normalized = normalizeText(query);
  const extra: string[] = [];

  for (const [pattern, terms] of PHRASE_SYNONYMS) {
    if (pattern.test(normalized)) extra.push(...terms);
  }
  for (const term of normalizeTerms(query)) {
    extra.push(...(TERM_SYNONYMS[term] ?? []));
  }

  return normalizeTerms(extra.join(' '));
}
