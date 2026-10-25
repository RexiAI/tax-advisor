import { describe, expect, it } from 'vitest';

import { createPassage, type Passage } from '@/domain/passage';
import { buildIndex, search } from '@/retrieval/index';
import { normalizeTerms } from '@/retrieval/normalize';

import { setEnv } from '../support/harness';

function passage(blockId: string, text: string): Passage {
  const result = createPassage({
    normId: 'BOE-A-2006-20764',
    normTitle: 'Ley 35/2006 del Impuesto sobre la Renta',
    blockId,
    blockTitle: `Artículo ${blockId}. Prueba`,
    articleLabel: `Artículo ${blockId}`,
    text,
    sourceUrl: 'https://www.boe.es/buscar/act.php?id=BOE-A-2006-20764',
    boeUpdatedAt: '2026-03-17',
    fetchedAt: '2026-03-18T08:00:00Z',
  });
  if (!result.ok) throw new Error(`passage ${blockId} did not build: ${result.error}`);
  return result.passage;
}

function indexOf(...passages: readonly Passage[]) {
  const built = buildIndex(passages);
  if (!built.ok) throw new Error('index build failed');
  return built.index;
}

describe('AC-001-21 accents and case do not matter', () => {
  it('AC-001-21: three spellings of deducción normalize and score identically', () => {
    const index = indexOf(passage('a1', 'Deducción por alquiler de vivienda habitual.'));

    const lowercase = search(index, 'deduccion');
    const uppercase = search(index, 'DEDUCCIÓN');
    const accented = search(index, 'deducción');

    expect(lowercase).toHaveLength(1);
    expect(uppercase).toHaveLength(1);
    expect(accented).toHaveLength(1);
    expect(lowercase[0]!.passage.passageId).toBe('BOE-A-2006-20764#a1');
    expect(uppercase[0]!.score).toBe(lowercase[0]!.score);
    expect(accented[0]!.score).toBe(lowercase[0]!.score);

    expect(normalizeTerms('Deducción')).toEqual(normalizeTerms('deduccion'));
    expect(normalizeTerms('DEDUCCIÓN')).toEqual(normalizeTerms('deduccion'));

    const nino = indexOf(passage('a2', 'El niño tiene derecho a la deducción.'));
    expect(search(nino, 'nino')[0]!.passage.passageId).toBe('BOE-A-2006-20764#a2');
  });
});

describe('AC-001-22 empty and stopword-only queries return no results', () => {
  it('AC-001-22: blank and stopword-only queries return an empty array, not an error', () => {
    const index = indexOf(passage('a1', 'Deducción por alquiler de vivienda habitual.'));
    expect(search(index, '')).toEqual([]);
    expect(search(index, '   ')).toEqual([]);
    expect(search(index, 'de la que el')).toEqual([]);
  });
});

describe('AC-001-23 a passage matching more query terms ranks higher', () => {
  it('AC-001-23: more matching terms wins and an absent term contributes nothing', () => {
    const a = passage('a1', 'alquiler vivienda habitual deduccion');
    const b = passage('a2', 'alquiler');
    const index = indexOf(a, b);

    const results = search(index, 'deduccion alquiler vivienda habitual');
    expect(results.map((result) => result.passage.passageId)).toEqual([
      'BOE-A-2006-20764#a1',
      'BOE-A-2006-20764#a2',
    ]);
    for (const result of results) expect(typeof result.score).toBe('number');
    expect(results[0]!.score).toBeGreaterThan(results[1]!.score);

    expect(search(index, 'criptomonedas')).toEqual([]);
  });
});

describe('AC-001-24 results are deterministic and ties break by passageId', () => {
  it('AC-001-24: two identical searches deep-compare equal and ties sort by id', () => {
    const index = indexOf(
      passage('b2', 'alquiler vivienda'),
      passage('a9', 'alquiler vivienda'),
      passage('c1', 'alquiler vivienda')
    );

    const first = search(index, 'alquiler vivienda');
    const second = search(index, 'alquiler vivienda');

    expect(first).toEqual(second);
    const ids = first.map((result) => result.passage.passageId);
    expect([...ids].sort()).toEqual(ids);
    expect(new Set(first.map((result) => result.score)).size).toBe(1);
  });
});

describe('AC-001-25 results are truncated to the requested k', () => {
  it('AC-001-25: k=8 and k=3 truncate, share a prefix, and the default comes from config', () => {
    const passages = Array.from({ length: 12 }, (_, index) =>
      passage(`p${String(index).padStart(2, '0')}`, 'alquiler vivienda habitual')
    );
    const index = indexOf(...passages);

    const eight = search(index, 'alquiler', 8);
    const three = search(index, 'alquiler', 3);

    expect(eight).toHaveLength(8);
    expect(three).toHaveLength(3);
    expect(eight.slice(0, 3)).toEqual(three);

    setEnv({ RETRIEVAL_TOP_K: '3' });
    expect(search(index, 'alquiler')).toHaveLength(3);
    setEnv({ RETRIEVAL_TOP_K: undefined });
  });
});

describe('AC-001-26 the index reports its size and refuses duplicate passages', () => {
  it('AC-001-26: duplicates are refused, size is reported and the index is frozen', () => {
    const original = passage('a1', 'Deducción por alquiler.');
    const duplicate = passage('a1', 'Otro texto distinto.');

    expect(buildIndex([original, duplicate])).toEqual({
      ok: false,
      error: 'duplicate_passage_id',
    });

    const built = buildIndex([original, passage('a2', 'Otra cosa.')]);
    expect(built.ok).toBe(true);
    if (!built.ok) return;
    expect(built.index.size).toBe(2);

    expect(() => {
      (built.index as { size: number }).size = 99;
    }).toThrow();
    expect(built.index.size).toBe(2);
  });
});
