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
  [
    /\b(gastos? deducibles?|deducir.*gastos?|gastos?.*deducir|que gastos?)\b/,
    ['gasto', 'deducible', 'estimacion', 'directa', 'rendimiento', 'neto'],
  ],
  // The registration procedure is named after the census, not after the
  // taxpayer: BOE says "declaración de alta en el Censo de Empresarios,
  // Profesionales y Retenedores" and the taxpayer says "darme de alta de
  // autónomo". Without these terms "autónomo" only meets LGSS 333/336 (cese),
  // which outranks the article that governs the trámite.
  [
    /\b(darme de alta|darse de alta|dar de alta|me doy de alta|alta como autonomo|alta de autonomo|quiero ser autonomo|empezar como autonomo|iniciar actividad|inicio de actividad)\b/,
    ['censo', 'censal', 'empresarios', 'profesionales', 'retenedores', 'declaracion', 'alta', '036', '037'],
  ],
  // The VAT filing obligation is drafted as "sujetos pasivos", "devengo" and
  // "declaraciones-liquidaciones"; the taxpayer asks when they "start filing
  // VAT". Both plural and singular forms are listed because the index has no
  // stemming: BOE says "sujetos pasivos" and the singular would miss it.
  // Gated on the filing verbs *and* on VAT so other questions that merely name
  // the tax ("¿cuánto IVA pago?") keep their existing ranking.
  [
    /(?=.*\biva\b)(?=.*\b(empezar a presentar|empiezo|empieza|presentar|presento|obligacion|obligado|declaracion|liquidacion)\b)/,
    [
      'devengo',
      'sujeto',
      'sujetos',
      'pasivo',
      'pasivos',
      'autoliquidacion',
      'autoliquidaciones',
      'liquidacion',
      'liquidaciones',
      'declaracion',
      'declaraciones',
      'obligaciones',
      'comienzo',
      'actividades',
      'plazos',
      'impresos',
      'ingresar',
      'periodicamente',
      '303',
    ],
  ],
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
  gasto: ['gastos', 'deducible'],
  gastos: ['gasto', 'deducible'],
  deducir: ['deducible', 'deduccion'],
  deducirme: ['deducible', 'deduccion'],
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
