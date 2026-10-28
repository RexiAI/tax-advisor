import { describe, expect, it } from 'vitest';

import { deriveArticleLabel } from '@/corpus/article-label';
import { createPassage } from '@/domain/passage';

import { makePassage, PASSAGE_DEFAULTS } from '../support/factories';

describe('deriveArticleLabel', () => {
  it('keeps the article number and drops the descriptive tail', () => {
    expect(deriveArticleLabel('Artículo 63. Escala general del impuesto', 'fallback')).toBe(
      'Artículo 63'
    );
  });

  it('supports ordinal suffixes and irregular spacing', () => {
    expect(deriveArticleLabel('Artículo 63 bis. Deducción', 'fallback')).toBe('Artículo 63 bis');
    expect(deriveArticleLabel('Artículo   14   ter. Regla', 'fallback')).toBe('Artículo 14 ter');
  });

  it('is case-insensitive about the word and the accent', () => {
    expect(deriveArticleLabel('ARTICULO 5. Ámbito', 'fallback')).toBe('ARTICULO 5');
  });

  it('returns a non-article title verbatim', () => {
    expect(deriveArticleLabel('Disposición adicional primera', 'fallback')).toBe(
      'Disposición adicional primera'
    );
  });

  it('never returns an empty label', () => {
    expect(deriveArticleLabel('   ', 'block-1')).toBe('block-1');
  });
});

describe('createPassage', () => {
  it('falls back to the block title when no article label is supplied', () => {
    const withoutLabel = { ...PASSAGE_DEFAULTS };
    delete withoutLabel.articleLabel;
    const result = createPassage(withoutLabel);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.passage.articleLabel).toBe(PASSAGE_DEFAULTS.blockTitle);
  });

  it('reports the first failing rule when several apply', () => {
    expect(createPassage({ ...PASSAGE_DEFAULTS, text: '  ', blockId: '' })).toEqual({
      ok: false,
      error: 'empty_text',
    });
    expect(createPassage({ ...PASSAGE_DEFAULTS, blockId: '', normId: 'BOE-A-0000-00000' })).toEqual(
      {
        ok: false,
        error: 'empty_block_id',
      }
    );
  });

  it('rejects a source URL with no host even when it starts with https', () => {
    expect(createPassage({ ...PASSAGE_DEFAULTS, sourceUrl: 'https://' })).toEqual({
      ok: false,
      error: 'invalid_source_url',
    });
  });

  it('rejects a timestamp with the wrong separator or a missing Z', () => {
    expect(createPassage({ ...PASSAGE_DEFAULTS, fetchedAt: '2026-03-17 08:00:00Z' })).toEqual({
      ok: false,
      error: 'invalid_fetched_at',
    });
    expect(createPassage({ ...PASSAGE_DEFAULTS, updatedAt: '2026-3-7' })).toEqual({
      ok: false,
      error: 'invalid_updated_at',
    });
  });

  it('trims the text it stores', () => {
    expect(makePassage({ text: '  Hola.  ' }).text).toBe('Hola.');
  });

  it('keeps equality purely by passageId', () => {
    const first = makePassage();
    const second = makePassage({ text: 'Otro texto.', fetchedAt: '2026-04-01T00:00:00Z' });
    expect(first.passageId).toBe(second.passageId);
    expect(first.text).not.toBe(second.text);
  });
});
