/**
 * The norms this product covers. Everything outside this set is refused rather
 * than guessed at.
 *
 * Each entry carries its provenance (spec 004): the publisher that issued the
 * norm, the jurisdiction whose rules it states, the publisher whose consolidated
 * text was actually ingested (`authorityUsed`), the stable identifier of that
 * text, the official URL, that source's own update date and its reuse note. A
 * norm missing any of them is not admitted. The `tax` tag exists only so the
 * coverage matrix can be derived from this list — there is no second list.
 *
 * The order is stable: the corpus sync walks this array, so the artifact's
 * `norms[]` order is a function of this list and nothing else.
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
 */

import { coverageOf, type CoveragePair } from './coverage';
import {
  BOE_LICENSE_NOTE,
  boeSourceUrl,
  type AuthorityUsed,
  type Jurisdiction,
  type Publisher,
  type Tax,
} from './source';

export interface AllowedNorm {
  readonly normId: string;
  readonly normTitle: string;
  /** The administration that issued the norm. */
  readonly publisher: Publisher;
  /** Whose rules the norm states. */
  readonly jurisdiction: Jurisdiction;
  /** The publisher whose consolidated text was ingested. */
  readonly authorityUsed: AuthorityUsed;
  /** The stable identifier of the text actually used. */
  readonly officialId: string;
  readonly sourceUrl: string;
  /** The source's own last-update date, `YYYY-MM-DD`. */
  readonly updatedAt: string;
  readonly licenseNote: string;
  /** The tax axis the coverage matrix is declared on. */
  readonly tax: Tax;
  /**
   * False for every norm outside the IRPF pair. The flag lives on the entry so
   * the registry stays the single list of what is covered: a norm added below is
   * outside the disclaimer's scope by default, and no second list can disagree
   * with this one.
   */
  readonly coversIrpf: boolean;
}

function boeNorm(
  normId: string,
  normTitle: string,
  updatedAt: string,
  tax: Tax,
  coversIrpf: boolean
): AllowedNorm {
  return {
    normId,
    normTitle,
    publisher: 'boe',
    jurisdiction: 'state',
    authorityUsed: 'boe',
    officialId: normId,
    sourceUrl: boeSourceUrl(normId),
    updatedAt,
    licenseNote: BOE_LICENSE_NOTE,
    tax,
    coversIrpf,
  };
}

/**
 * Pilot ingestion evidence (spec 004, Task 6), recorded per norm from the live
 * sources on 2026-10-28. Neither pilot bulletin publishes a stable, versioned
 * consolidated text with an update date:
 *
 * - Madrid. The BOCM's ELI record (`https://www.bocm.es/eli/es-md/dlg/2010/10/21/1`)
 *   links to the Community's consolidated database, which carries no per-norm
 *   update date. The BOCM's own XML is the original 2010 publication, not a
 *   consolidated version. The BOE consolidated text
 *   (`BOCM-m-2010-90068`, last update 2026-08-31) is therefore the authority used.
 *   The BOCM's reuse terms are its legal notice: intellectual-property rights are
 *   reserved, with no authorisation beyond personal and private use. The text
 *   actually ingested is the BOE's, so the norm records the BOE's reuse note.
 * - Murcia. The BORM's ELI record
 *   (`https://www.borm.es/eli/es-mc/dlg/2010/11/05/1`) offers only the initial
 *   legal resource; the Region's transparency portal states that law-rank norms
 *   are consolidated by the BOE. The BOE consolidated text (`BOE-A-2011-10542`,
 *   last update 2026-03-17) is therefore the authority used. The BORM's reuse
 *   conditions are the terms of use of its Sede Electrónica; the ingested text is
 *   the BOE's, so the norm records the BOE's reuse note.
 *
 * This record asserts no fact about the content of either community's rules. It
 * records only that an official consolidated text with a stable identifier and an
 * update date was found, which publisher supplied it, and under which reuse
 * conditions.
 */
export const ALLOWED_NORMS: readonly AllowedNorm[] = [
  boeNorm('BOE-A-2006-20764', 'Ley 35/2006 del Impuesto sobre la Renta', '2026-10-07', 'irpf', true),
  boeNorm(
    'BOE-A-2007-6820',
    'Real Decreto 439/2007, Reglamento del IRPF',
    '2026-10-07',
    'irpf',
    true
  ),
  boeNorm(
    'BOE-A-2003-23186',
    'Ley 58/2003, de 17 de diciembre, General Tributaria.',
    '2026-10-09',
    'autonomo',
    false
  ),
  boeNorm(
    'BOE-A-2007-15984',
    'Real Decreto 1065/2007, de 27 de julio, por el que se aprueba el Reglamento General de las actuaciones y los procedimientos de gestión e inspección tributaria y de desarrollo de las normas comunes de los procedimientos de aplicación de los tributos.',
    '2026-10-09',
    'autonomo',
    false
  ),
  boeNorm(
    'BOE-A-2015-11724',
    'Real Decreto Legislativo 8/2015, de 30 de octubre, por el que se aprueba el texto refundido de la Ley General de la Seguridad Social.',
    '2026-10-23',
    'autonomo',
    false
  ),
  boeNorm(
    'BOE-A-1996-4447',
    'Real Decreto 84/1996, de 26 de enero, por el que se aprueba el Reglamento General sobre inscripción de empresas y afiliación, altas, bajas y variaciones de datos de trabajadores en la Seguridad Social.',
    '2026-07-30',
    'autonomo',
    false
  ),
  boeNorm(
    'BOE-A-1992-28740',
    'Ley 37/1992, de 28 de diciembre, del Impuesto sobre el Valor Añadido.',
    '2026-10-07',
    'iva',
    false
  ),
  boeNorm(
    'BOE-A-1990-23930',
    'Real Decreto Legislativo 1175/1990, de 28 de septiembre, por el que se aprueban las tarifas y la instrucción del Impuesto sobre Actividades Económicas.',
    '2026-06-04',
    'iae',
    false
  ),
  {
    normId: 'BOCM-m-2010-90068',
    normTitle:
      'Decreto Legislativo 1/2010, de 21 de octubre, del Consejo de Gobierno, por el que se aprueba el Texto Refundido de las Disposiciones Legales de la Comunidad de Madrid en materia de tributos cedidos por el Estado.',
    publisher: 'bocm',
    jurisdiction: 'madrid',
    authorityUsed: 'boe',
    officialId: 'BOCM-m-2010-90068',
    sourceUrl: boeSourceUrl('BOCM-m-2010-90068'),
    updatedAt: '2026-08-31',
    licenseNote: BOE_LICENSE_NOTE,
    tax: 'irpf',
    coversIrpf: true,
  },
  {
    normId: 'BOE-A-2011-10542',
    normTitle:
      'Decreto Legislativo 1/2010, de 5 de noviembre, por el que se aprueba el Texto Refundido de las disposiciones legales vigentes en la Región de Murcia en materia de tributos cedidos.',
    publisher: 'borm',
    jurisdiction: 'murcia',
    authorityUsed: 'boe',
    officialId: 'BOE-A-2011-10542',
    sourceUrl: boeSourceUrl('BOE-A-2011-10542'),
    updatedAt: '2026-03-17',
    licenseNote: BOE_LICENSE_NOTE,
    tax: 'irpf',
    coversIrpf: true,
  },
];

/** The coverage the registry declares: the only producer of the pair list. */
export const REGISTRY_COVERAGE: readonly CoveragePair[] = coverageOf(ALLOWED_NORMS);

const ALLOWED_BY_ID = new Map(ALLOWED_NORMS.map((norm) => [norm.normId, norm]));

export function findAllowedNorm(normId: string): AllowedNorm | undefined {
  return ALLOWED_BY_ID.get(normId);
}

const ALLOWED_IDS = new Set(ALLOWED_BY_ID.keys());

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
