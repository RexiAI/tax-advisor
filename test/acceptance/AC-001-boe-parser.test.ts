import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { parseConsolidatedXml, type ParserMeta } from '@/corpus/parse-consolidated-xml';

import { offlineFetchState } from '../support/offline-fetch';
import { repoPath } from '../support/harness';

const META: ParserMeta = {
  normId: 'BOE-A-2006-20764',
  normTitle: 'Ley 35/2006 del Impuesto sobre la Renta',
  updatedAt: '2026-03-17',
  fetchedAt: '2026-03-18T08:00:00Z',
};

function fixture(name: string): string {
  return readFileSync(repoPath('test/fixtures/boe', name), 'utf8');
}

describe('AC-001-10 each bloque becomes one passage built from its last version', () => {
  it('AC-001-10: the a63 passage carries the consolidated text and the BOE source URL', () => {
    const result = parseConsolidatedXml(fixture('ley-35-2006.xml'), META);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const a63 = result.passages.filter((passage) => passage.blockId === 'a63');
    expect(a63).toHaveLength(1);
    const passage = a63[0]!;
    expect(passage.text).toContain('Escala general del impuesto vigente');
    expect(passage.text).not.toContain('Versión anterior');
    expect(passage.sourceUrl).toBe('https://www.boe.es/buscar/act.php?id=BOE-A-2006-20764');
    expect(passage.updatedAt).toBe('2026-03-17');
  });
});

describe('AC-001-11 HTML is reduced to readable text', () => {
  it('AC-001-11: tags disappear, entities decode and table rows flatten', () => {
    const result = parseConsolidatedXml(fixture('ley-35-2006.xml'), META);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const passage = result.passages.find((entry) => entry.blockId === 'a63');
    expect(passage).toBeDefined();
    const text = passage!.text;

    expect(text).not.toContain('<');
    expect(text).not.toContain('>');
    expect(text).toContain(' & ');
    expect(text).toContain('Hasta 12.450 € | 9.500 €');
    expect(text).toContain('Resto de base liquidable | 22.000 €');
    expect(text).not.toMatch(/\s{2,}/);
    expect(text).toBe(text.trim());
  });
});

describe('AC-001-12 the article label is derived, never invented', () => {
  it('AC-001-12: article titles yield the article label, other titles stay verbatim', () => {
    const result = parseConsolidatedXml(fixture('ley-35-2006.xml'), META);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const article = result.passages.find((entry) => entry.blockId === 'a63');
    expect(article?.articleLabel).toBe('Artículo 63');

    const disposicion = result.passages.find((entry) => entry.blockId === 'da-primera');
    expect(disposicion?.articleLabel).toBe('Disposición adicional primera');

    expect(result.passages.every((entry) => entry.articleLabel.trim() !== '')).toBe(true);
  });
});

describe('AC-001-13 non-normative and empty blocks are skipped with a reason', () => {
  it('AC-001-13: one passage survives, two blocks are reported, and the parse still succeeds', () => {
    const result = parseConsolidatedXml(fixture('mixed-skip.xml'), META);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.passages).toHaveLength(1);
    expect(result.skipped).toHaveLength(2);
    expect(result.skipped.map((entry) => entry.reason)).toEqual([
      'non_normative_block',
      'empty_text',
    ]);
  });
});

describe('AC-001-14 malformed XML fails without touching the network', () => {
  it('AC-001-14: truncated XML and a document with no bloque are both unparsable', () => {
    expect(parseConsolidatedXml(fixture('malformed-truncated.xml'), META)).toEqual({
      ok: false,
      error: 'unparsable',
    });
    expect(parseConsolidatedXml(fixture('no-bloque.xml'), META)).toEqual({
      ok: false,
      error: 'unparsable',
    });
    expect(offlineFetchState.attempts).toEqual([]);
  });
});
