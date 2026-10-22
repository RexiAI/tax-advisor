import { describe, expect, it } from 'vitest';

import { parseConsolidatedXml } from '@/corpus/parse-consolidated-xml';
import { decodeEntities, parseXml, reduceElementTreeToText } from '@/corpus/xml';

import { readFixture } from '../support/harness';

const META = {
  normId: 'BOE-A-2006-20764',
  normTitle: 'Ley 35/2006',
  boeUpdatedAt: '2026-03-17',
  fetchedAt: '2026-03-18T08:00:00Z',
} as const;

function textOf(xml: string): string {
  const parsed = parseXml(`<root>${xml}</root>`);
  if (!parsed.ok) throw new Error('fixture did not parse');
  return reduceElementTreeToText(parsed.nodes);
}

describe('decodeEntities', () => {
  it('decodes named entities and leaves the ampersand for last', () => {
    expect(decodeEntities('a &amp; b')).toBe('a & b');
    expect(decodeEntities('&amp;lt;')).toBe('&lt;');
  });

  it('decodes numeric entities in both bases', () => {
    expect(decodeEntities('caf&#233;')).toBe('café');
    expect(decodeEntities('caf&#xE9;')).toBe('café');
  });
});

describe('reduceElementTreeToText', () => {
  it('turns block tags into line breaks and keeps inline text joined', () => {
    expect(textOf('<p>Hola <strong>mundo</strong>.</p><p>Otra línea.</p>')).toBe(
      'Hola mundo.\nOtra línea.'
    );
  });

  it('flattens table wrapper sections and joins cells with a pipe', () => {
    const text = textOf(
      '<table><thead><tr><th>Base</th><th>Cuota</th></tr></thead>' +
        '<tbody><tr><td>Hasta 12.450 €</td><td>9.500 €</td></tr></tbody></table>'
    );
    expect(text).toBe('Base | Cuota\nHasta 12.450 € | 9.500 €');
  });

  it('collapses whitespace runs and trims each line', () => {
    expect(textOf('<p>  uno    dos  </p><p> tres </p>')).toBe('uno dos\ntres');
  });

  it('returns an empty string for a block with no text', () => {
    expect(textOf('<p>   </p><p></p>')).toBe('');
  });
});

describe('parseConsolidatedXml edge cases', () => {
  it('uses the last version and skips a block with no version', () => {
    const xml =
      '<documento><texto>' +
      '<bloque id="a1" tipo="normativo" titulo="Artículo 1. A"><version><p>vieja</p></version>' +
      '<version><p>nueva</p></version></bloque>' +
      '<bloque id="a2" tipo="normativo" titulo="Artículo 2. B"></bloque>' +
      '</texto></documento>';

    const result = parseConsolidatedXml(xml, META);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.passages).toHaveLength(1);
    expect(result.passages[0]!.text).toBe('nueva');
    expect(result.skipped).toEqual([{ blockId: 'a2', reason: 'empty_text' }]);
  });

  it('keeps document order of passages', () => {
    const xml =
      '<documento><texto>' +
      '<bloque id="b" tipo="normativo" titulo="Artículo 2. B"><version><p>dos</p></version></bloque>' +
      '<bloque id="a" tipo="normativo" titulo="Artículo 1. A"><version><p>uno</p></version></bloque>' +
      '</texto></documento>';

    const result = parseConsolidatedXml(xml, META);
    if (!result.ok) throw new Error('expected a parse');
    expect(result.passages.map((passage) => passage.blockId)).toEqual(['b', 'a']);
  });

  it('reports an unsupported norm as invalid metadata rather than throwing', () => {
    const xml =
      '<documento><bloque id="a" titulo="X"><version><p>texto</p></version></bloque></documento>';
    const result = parseConsolidatedXml(xml, { ...META, normId: 'BOE-A-0000-00000' });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.passages).toHaveLength(0);
    expect(result.skipped[0]?.reason).toBe('invalid_metadata');
  });
});

describe('parseConsolidatedXml on the live BOE vocabulary', () => {
  const live = readFixture('boe', 'live-shapes.xml');

  it('emits only the normative `precepto` block and reports the rest as non-normative', () => {
    const result = parseConsolidatedXml(live, META);

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.passages.map((passage) => passage.blockId)).toEqual(['a20']);
    expect(result.skipped.map((skip) => skip.blockId)).toEqual([
      'no',
      'preambulo',
      'tpreliminar',
      'firma',
    ]);
    expect(result.skipped.every((skip) => skip.reason === 'non_normative_block')).toBe(true);
  });

  it('labels the article from its title and keeps the consolidated text citable', () => {
    const result = parseConsolidatedXml(live, META);
    if (!result.ok) throw new Error('expected a parse');
    const [passage] = result.passages;
    if (passage === undefined) throw new Error('expected one passage');

    expect(passage.articleLabel).toBe('Artículo 20');
    expect(passage.blockTitle).toBe('Artículo 20');
    expect(passage.normTitle).toBe(META.normTitle);
    expect(passage.text).toContain(
      'Artículo 20. Reducción por obtención de rendimientos del trabajo.'
    );
    expect(passage.text).not.toContain('Versión anterior');
    expect(passage.text).toContain('&');
    expect(passage.text).toContain('Hasta 14.852 € | 6.498 €');
    expect(passage.text).not.toMatch(/[<>]/);
  });

  it('never yields a label derived from an internal block id', () => {
    const result = parseConsolidatedXml(live, META);
    if (!result.ok) throw new Error('expected a parse');

    for (const passage of result.passages) {
      expect(passage.articleLabel.trim()).not.toBe('');
      expect(passage.articleLabel).not.toBe(passage.blockId);
    }
  });
});
