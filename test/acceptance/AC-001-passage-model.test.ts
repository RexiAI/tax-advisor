import { describe, expect, it } from 'vitest';

import { ALLOWED_NORMS } from '@/domain/allowed-norms';
import {
  buildPassageCollection,
  createPassage,
  passageIdOf,
  passagesEqual,
  type PassageInput,
} from '@/domain/passage';

const BASE: PassageInput = {
  normId: 'BOE-A-2006-20764',
  normTitle: 'Ley 35/2006 del Impuesto sobre la Renta',
  blockId: 'a63',
  blockTitle: 'Artículo 63. Escala general del impuesto',
  articleLabel: 'Artículo 63',
  text: 'Escala general del impuesto.',
  sourceUrl: 'https://www.boe.es/buscar/act.php?id=BOE-A-2006-20764',
  updatedAt: '2026-03-17',
  fetchedAt: '2026-03-18T08:00:00Z',
};

describe('AC-001-06 passage identity is derived from norm and block only', () => {
  it('AC-001-06: two builds with different fetchedAt share identity and compare equal', () => {
    const first = createPassage({ ...BASE, fetchedAt: '2026-03-18T08:00:00Z' });
    const second = createPassage({ ...BASE, fetchedAt: '2026-05-01T09:30:00Z' });

    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    if (!first.ok || !second.ok) return;

    expect(first.passage.passageId).toBe('BOE-A-2006-20764#a63');
    expect(second.passage.passageId).toBe('BOE-A-2006-20764#a63');
    expect(passageIdOf('BOE-A-2006-20764', 'a63')).toBe('BOE-A-2006-20764#a63');
    expect(passagesEqual(first.passage, second.passage)).toBe(true);
  });

  it('AC-001-06: the passage exposes exactly the documented fields', () => {
    const result = createPassage(BASE);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(Object.keys(result.passage).sort()).toEqual(
      [
        'articleLabel',
        'blockId',
        'blockTitle',
        'updatedAt',
        'fetchedAt',
        'jurisdiction',
        'normId',
        'normTitle',
        'passageId',
        'publisher',
        'sourceUrl',
        'text',
      ].sort()
    );
  });
});

describe('AC-001-07 invalid timestamps are rejected, not coerced', () => {
  it('AC-001-07: a non-ISO date, a non-UTC timestamp and a valid UTC timestamp behave as specified', () => {
    const badDate = createPassage({ ...BASE, updatedAt: '17/03/2026' });
    expect(badDate).toEqual({ ok: false, error: 'invalid_updated_at' });

    const offsetTimestamp = createPassage({ ...BASE, fetchedAt: '2026-03-17T10:00:00+02:00' });
    expect(offsetTimestamp).toEqual({ ok: false, error: 'invalid_fetched_at' });

    const good = createPassage({ ...BASE, fetchedAt: '2026-03-17T08:00:00Z' });
    expect(good.ok).toBe(true);
  });
});

describe('AC-001-08 empty text, empty block id and non-https sources are rejected', () => {
  it('AC-001-08: each invalid input returns its own error value without throwing', () => {
    expect(createPassage({ ...BASE, text: '   ' })).toEqual({ ok: false, error: 'empty_text' });
    expect(createPassage({ ...BASE, blockId: '' })).toEqual({
      ok: false,
      error: 'empty_block_id',
    });
    expect(
      createPassage({
        ...BASE,
        sourceUrl: 'http://www.boe.es/buscar/act.php?id=BOE-A-2006-20764',
      })
    ).toEqual({ ok: false, error: 'invalid_source_url' });
  });
});

describe('AC-001-09 the in-scope norms are accepted, duplicates refused', () => {
  it('AC-001-09: the allowed-norm set holds the covered norms and nothing else', () => {
    expect(ALLOWED_NORMS.map((norm) => norm.normId).sort()).toEqual(
      [
        'BOE-A-2006-20764',
        'BOE-A-2007-6820',
        'BOE-A-2003-23186',
        'BOE-A-2007-15984',
        'BOE-A-2015-11724',
        'BOE-A-1996-4447',
        'BOE-A-1992-28740',
        'BOE-A-1990-23930',
        'BOCM-m-2010-90068',
        'BOE-A-2011-10542',
      ].sort()
    );
  });

  it('AC-001-09: an unknown norm is refused and duplicate ids cannot both enter a collection', () => {
    expect(createPassage({ ...BASE, normId: 'BOE-A-0000-00000' })).toEqual({
      ok: false,
      error: 'unsupported_norm',
    });

    const first = createPassage(BASE);
    const second = createPassage({ ...BASE, fetchedAt: '2026-04-01T00:00:00Z' });
    if (!first.ok || !second.ok) throw new Error('fixture passage must build');

    expect(buildPassageCollection([first.passage, second.passage])).toEqual({
      ok: false,
      error: 'duplicate_passage_id',
    });
  });
});
