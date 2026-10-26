/**
 * The norms this product covers. Everything outside this set is refused rather
 * than guessed at.
 *
 * The IRPF pair came with v1. The six additions extend the covered surface to
 * the autónomo's fiscal cycle: the general tax law (LGT), the common procedural
 * regulation, Social Security (LGSS and the affiliation/registration
 * regulation), VAT, and the IAE tariffs and instruction. The identifiers and
 * titles are the ones the BOE consolidated-text metadata endpoint returns,
 * recorded from the source, never invented.
 *
 * The Regional Finance Law text (RD Leg. 2/2004, `BOE-A-2004-4214`) is
 * deliberately absent: it hosts the IBI, which stays out of scope.
 *
 * The order is stable: the corpus sync walks this array, so the artifact's
 * `norms[]` order is a function of this list and nothing else.
 */

export interface AllowedNorm {
  readonly normId: string;
  readonly normTitle: string;
  /**
   * False for every norm outside the IRPF pair. The flag lives on the entry so
   * the registry stays the single list of what is covered: a norm added below is
   * outside the disclaimer's scope by default, and no second list can disagree
   * with this one.
   */
  readonly coversIrpf: boolean;
}

export const ALLOWED_NORMS: readonly AllowedNorm[] = [
  {
    normId: 'BOE-A-2006-20764',
    normTitle: 'Ley 35/2006 del Impuesto sobre la Renta',
    coversIrpf: true,
  },
  {
    normId: 'BOE-A-2007-6820',
    normTitle: 'Real Decreto 439/2007, Reglamento del IRPF',
    coversIrpf: true,
  },
  {
    normId: 'BOE-A-2003-23186',
    normTitle: 'Ley 58/2003, de 17 de diciembre, General Tributaria.',
    coversIrpf: false,
  },
  {
    normId: 'BOE-A-2007-15984',
    normTitle:
      'Real Decreto 1065/2007, de 27 de julio, por el que se aprueba el Reglamento General de las actuaciones y los procedimientos de gestión e inspección tributaria y de desarrollo de las normas comunes de los procedimientos de aplicación de los tributos.',
    coversIrpf: false,
  },
  {
    normId: 'BOE-A-2015-11724',
    normTitle:
      'Real Decreto Legislativo 8/2015, de 30 de octubre, por el que se aprueba el texto refundido de la Ley General de la Seguridad Social.',
    coversIrpf: false,
  },
  {
    normId: 'BOE-A-1996-4447',
    normTitle:
      'Real Decreto 84/1996, de 26 de enero, por el que se aprueba el Reglamento General sobre inscripción de empresas y afiliación, altas, bajas y variaciones de datos de trabajadores en la Seguridad Social.',
    coversIrpf: false,
  },
  {
    normId: 'BOE-A-1992-28740',
    normTitle: 'Ley 37/1992, de 28 de diciembre, del Impuesto sobre el Valor Añadido.',
    coversIrpf: false,
  },
  {
    normId: 'BOE-A-1990-23930',
    normTitle:
      'Real Decreto Legislativo 1175/1990, de 28 de septiembre, por el que se aprueban las tarifas y la instrucción del Impuesto sobre Actividades Económicas.',
    coversIrpf: false,
  },
];

const ALLOWED_IDS = new Set(ALLOWED_NORMS.map((norm) => norm.normId));

/**
 * The norms that are not the IRPF, derived from the registry above. An answer
 * whose validated citations include any of them carries the reinforced scope
 * disclaimer: the reader is reading about VAT, contributions or registration,
 * and the boundary has to say so.
 */
export const NON_IRPF_NORM_IDS: readonly string[] = ALLOWED_NORMS.filter(
  (norm) => !norm.coversIrpf
).map((norm) => norm.normId);

const NON_IRPF_IDS = new Set(NON_IRPF_NORM_IDS);

export function isAllowedNorm(normId: string): boolean {
  return ALLOWED_IDS.has(normId);
}

export function isNonIrpfNorm(normId: string): boolean {
  return NON_IRPF_IDS.has(normId);
}
