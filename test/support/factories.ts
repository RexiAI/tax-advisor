/**
 * Passage factories for tests: valid-by-default values so each test can override
 * only the field it is about.
 */

import { createPassage, type Passage, type PassageInput } from '@/domain/passage';

export const PASSAGE_DEFAULTS: PassageInput = {
  normId: 'BOE-A-2006-20764',
  normTitle: 'Ley 35/2006 del Impuesto sobre la Renta',
  blockId: 'a63',
  blockTitle: 'Artículo 63. Escala general del impuesto',
  articleLabel: 'Artículo 63',
  text: 'Escala general del impuesto aplicable a la base liquidable.',
  sourceUrl: 'https://www.boe.es/buscar/act.php?id=BOE-A-2006-20764',
  boeUpdatedAt: '2026-03-17',
  fetchedAt: '2026-03-18T08:00:00Z',
};

export function makePassage(overrides: Partial<PassageInput> = {}): Passage {
  const result = createPassage({ ...PASSAGE_DEFAULTS, ...overrides });
  if (!result.ok) throw new Error(`factory passage rejected: ${result.error}`);
  return result.passage;
}
