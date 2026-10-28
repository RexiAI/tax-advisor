/**
 * The community recognizer (spec 004, Task 8 risk 7).
 *
 * Used only to *refuse* and to name a competent body — never to ingest a norm or
 * declare coverage. The coverage matrix is the only thing that says what is
 * covered; this list says what a message is talking about.
 *
 * Two renderings come from one record:
 * - `locative` follows "en": "en Galicia", "en la Comunidad de Castilla y León",
 *   "en el País Vasco". No contraction problem after "en".
 * - `prepositional` follows "de", with the contraction already resolved in the
 *   data: "de Galicia", "de la Comunidad de Castilla y León", "del País Vasco".
 *   Building it at render time would produce "de el País Vasco".
 *
 * The two pilot communities are in the set: their records render the same way, so
 * a refusal and an answer name the same administration in the same words.
 */

import type { Jurisdiction } from '../domain/source';
import { normalizeText } from '../retrieval/normalize';

export interface CommunityRecord {
  readonly id: string;
  /** Determiner-led, locative-safe: the `{community}` of the refusal template. */
  readonly locative: string;
  /** The prepositional phrase: the tail of `la autoridad tributaria …`. */
  readonly prepositional: string;
  /** Accent-stripped, lowercase, space-separated forms matched against the message. */
  readonly aliases: readonly string[];
  /** Present only for a community the coverage matrix knows. */
  readonly jurisdiction?: Jurisdiction;
}

export const COMMUNITIES: readonly CommunityRecord[] = [
  {
    id: 'andalucia',
    locative: 'Andalucía',
    prepositional: 'de Andalucía',
    aliases: ['andalucia'],
  },
  {
    id: 'aragon',
    locative: 'Aragón',
    prepositional: 'de Aragón',
    aliases: ['aragon'],
  },
  {
    id: 'asturias',
    locative: 'el Principado de Asturias',
    prepositional: 'del Principado de Asturias',
    aliases: ['asturias', 'principado de asturias'],
  },
  {
    id: 'baleares',
    locative: 'las Islas Baleares',
    prepositional: 'de las Islas Baleares',
    aliases: ['baleares', 'islas baleares', 'illes balears', 'balears'],
  },
  {
    id: 'canarias',
    locative: 'Canarias',
    prepositional: 'de Canarias',
    aliases: ['canarias', 'islas canarias'],
  },
  {
    id: 'cantabria',
    locative: 'Cantabria',
    prepositional: 'de Cantabria',
    aliases: ['cantabria'],
  },
  {
    id: 'castilla_la_mancha',
    locative: 'Castilla-La Mancha',
    prepositional: 'de Castilla-La Mancha',
    aliases: ['castilla la mancha', 'castilla-la mancha'],
  },
  {
    id: 'castilla_y_leon',
    locative: 'la Comunidad de Castilla y León',
    prepositional: 'de la Comunidad de Castilla y León',
    aliases: ['castilla y leon', 'castilla leon'],
  },
  {
    id: 'cataluna',
    locative: 'Cataluña',
    prepositional: 'de Cataluña',
    aliases: ['cataluna', 'catalunya'],
  },
  {
    id: 'comunidad_valenciana',
    locative: 'la Comunidad Valenciana',
    prepositional: 'de la Comunidad Valenciana',
    aliases: ['comunidad valenciana', 'valenciana'],
  },
  {
    id: 'extremadura',
    locative: 'Extremadura',
    prepositional: 'de Extremadura',
    aliases: ['extremadura'],
  },
  {
    id: 'galicia',
    locative: 'Galicia',
    prepositional: 'de Galicia',
    aliases: ['galicia'],
  },
  {
    id: 'la_rioja',
    locative: 'La Rioja',
    prepositional: 'de La Rioja',
    aliases: ['la rioja', 'rioja'],
  },
  {
    id: 'madrid',
    locative: 'la Comunidad de Madrid',
    prepositional: 'de la Comunidad de Madrid',
    aliases: ['madrid', 'comunidad de madrid'],
    jurisdiction: 'madrid',
  },
  {
    id: 'murcia',
    locative: 'la Región de Murcia',
    prepositional: 'de la Región de Murcia',
    aliases: ['murcia', 'region de murcia'],
    jurisdiction: 'murcia',
  },
  {
    id: 'navarra',
    locative: 'la Comunidad Foral de Navarra',
    prepositional: 'de la Comunidad Foral de Navarra',
    aliases: ['navarra', 'comunidad foral de navarra'],
  },
  {
    id: 'pais_vasco',
    locative: 'el País Vasco',
    prepositional: 'del País Vasco',
    aliases: ['pais vasco', 'euskadi', 'comunidad autonoma del pais vasco'],
  },
];

/** The message form the aliases are written in: lowercased, accent-free, spaces. */
export function normalizeForCommunityMatch(text: string): string {
  return normalizeText(text).replace(/[^a-z0-9]+/g, ' ').trim();
}

function matchesAlias(text: string, alias: string): boolean {
  return new RegExp(`(?:^| )${alias}(?: |$)`).test(text);
}

/** The first community named in the message, or `undefined`. */
export function findCommunity(normalizedMessage: string): CommunityRecord | undefined {
  return COMMUNITIES.find((community) =>
    community.aliases.some((alias) => matchesAlias(normalizedMessage, alias))
  );
}

export function communityOfficialBody(community: CommunityRecord): string {
  return `la autoridad tributaria ${community.prepositional}`;
}
