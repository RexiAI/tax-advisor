/**
 * Provenance vocabulary (spec 004): which administration issued a norm, whose
 * rules it states, and which publisher supplied the text that was ingested.
 *
 * A closed set on purpose. A jurisdiction is a value the coverage matrix can be
 * keyed on, so a string that is not in the set can never make a pair look
 * covered; a municipality is not a jurisdiction value here — municipal taxes are
 * out of scope and appear only inside a refusal string.
 */

export type Jurisdiction = 'state' | 'madrid' | 'murcia';

/** Canonical order: the state first, then the pilot communities in registry order. */
export const JURISDICTIONS: readonly Jurisdiction[] = ['state', 'madrid', 'murcia'];

export function isJurisdiction(value: unknown): value is Jurisdiction {
  return typeof value === 'string' && (JURISDICTIONS as readonly string[]).includes(value);
}

export type Publisher = 'boe' | 'bocm' | 'borm';

export type AuthorityUsed = Publisher;

export interface PublisherInfo {
  /** The acronym a citation link names: BOE, BOCM, BORM. */
  readonly code: string;
  readonly displayName: string;
  /** The official host the publisher's documents live on. */
  readonly officialHost: string;
  /**
   * The publisher's reuse conditions, recorded from the publisher. Never an
   * invented open licence: a publisher that reserves its rights says so.
   */
  readonly licenseNote: string;
}

export const BOE_LICENSE_NOTE =
  'Reutilización de textos del BOE: se cita la fuente (BOE), no se altera el sentido del texto y no se sugiere que el BOE respalde este producto.';

export const PUBLISHERS: Readonly<Record<Publisher, PublisherInfo>> = {
  boe: {
    code: 'BOE',
    displayName: 'Boletín Oficial del Estado',
    officialHost: 'www.boe.es',
    licenseNote: BOE_LICENSE_NOTE,
  },
  bocm: {
    code: 'BOCM',
    displayName: 'Boletín Oficial de la Comunidad de Madrid',
    officialHost: 'www.bocm.es',
    licenseNote:
      'Reutilización de textos del BOCM: el aviso legal de la Comunidad de Madrid reserva los derechos de propiedad intelectual y no autoriza la reproducción, distribución, comercialización o transformación salvo uso personal y privado.',
  },
  borm: {
    code: 'BORM',
    displayName: 'Boletín Oficial de la Región de Murcia',
    officialHost: 'www.borm.es',
    licenseNote:
      'Reutilización de textos del BORM: las condiciones aplicables son las publicadas en los términos de uso de la Sede Electrónica del BORM; se cita la fuente y no se sugiere que el BORM respalde este producto.',
  },
};

export const PUBLISHER_IDS: readonly Publisher[] = ['boe', 'bocm', 'borm'];

export function isPublisher(value: unknown): value is Publisher {
  return typeof value === 'string' && (PUBLISHER_IDS as readonly string[]).includes(value);
}

export function publisherCode(publisher: Publisher): string {
  return PUBLISHERS[publisher].code;
}

export function publisherHost(publisher: Publisher): string {
  return PUBLISHERS[publisher].officialHost;
}

/** The tax axis a norm is declared under. The coverage matrix is keyed on it. */
export type Tax =
  | 'irpf'
  | 'iva'
  | 'autonomo'
  | 'iae'
  | 'itp'
  | 'isd'
  | 'ibi'
  | 'non_residents'
  | 'company_tax';

/** Registry order, which is also the canonical coverage order per jurisdiction. */
export const TAXES: readonly Tax[] = [
  'irpf',
  'iva',
  'autonomo',
  'iae',
  'itp',
  'isd',
  'ibi',
  'non_residents',
  'company_tax',
];

export function isTax(value: unknown): value is Tax {
  return typeof value === 'string' && (TAXES as readonly string[]).includes(value);
}

/**
 * What a source entry prints for a jurisdiction. `state` reads
 * "Administración estatal" rather than "Estado": beside "Actualizado" on the
 * same metadata row, "Estado" would read as "status".
 */
export const JURISDICTION_DISPLAY_NAMES: Readonly<Record<Jurisdiction, string>> = {
  state: 'Administración estatal',
  madrid: 'Comunidad de Madrid',
  murcia: 'Región de Murcia',
};

export function jurisdictionDisplayName(jurisdiction: Jurisdiction): string {
  return JURISDICTION_DISPLAY_NAMES[jurisdiction];
}

/** The consolidated-text URL of a BOE-hosted norm. */
export function boeSourceUrl(normId: string): string {
  return `https://www.boe.es/buscar/act.php?id=${normId}`;
}
