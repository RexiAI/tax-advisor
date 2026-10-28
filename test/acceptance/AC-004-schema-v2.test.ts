import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { canonicalJson, contentHashOf, parseCorpusArtifact } from '@/corpus/artifact';
import { citationOf } from '@/domain/citation';
import { createPassage, type PassageInput } from '@/domain/passage';

import { makePassage, PASSAGE_DEFAULTS } from '../support/factories';
import { repoPath } from '../support/harness';

const BASE: PassageInput = { ...PASSAGE_DEFAULTS, updatedAt: '2026-03-17' };

const NORM = {
  normId: 'BOE-A-2006-20764',
  normTitle: 'Ley 35/2006 del Impuesto sobre la Renta',
  publisher: 'boe',
  jurisdiction: 'state',
  authorityUsed: 'boe',
  officialId: 'BOE-A-2006-20764',
  sourceUrl: 'https://www.boe.es/buscar/act.php?id=BOE-A-2006-20764',
  updatedAt: '2026-03-17',
  fetchedAt: '2026-03-18T08:00:00Z',
  licenseNote: 'Reutilización de textos del BOE.',
} as const;

const COVERAGE = [{ jurisdiction: 'state', tax: 'irpf' }] as const;

function corpusText(overrides: Record<string, unknown> = {}): string {
  const passage = makePassage();
  return JSON.stringify({
    schemaVersion: 2,
    taxYear: 2025,
    generatedAt: '2026-03-18T08:00:00Z',
    contentHash: contentHashOf({ coverage: COVERAGE, norms: [NORM], passages: [passage] }),
    coverage: COVERAGE,
    norms: [NORM],
    passages: [passage],
    ...overrides,
  });
}

describe('AC-004-06 a v2 artifact with full provenance is accepted', () => {
  it('AC-004-06: the parser returns ok and the artifact', () => {
    const result = parseCorpusArtifact(corpusText());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.artifact.schemaVersion).toBe(2);
    expect(result.artifact.coverage).toEqual(COVERAGE);
    expect(result.artifact.norms[0]?.authorityUsed).toBe('boe');
  });
});

describe('AC-004-07 a v1 artifact is rejected', () => {
  it('AC-004-07: schemaVersion 1 with v1 keys is unparsable', () => {
    const v1 = JSON.stringify({
      schemaVersion: 1,
      taxYear: 2025,
      generatedAt: '2026-03-18T08:00:00Z',
      contentHash: 'abc',
      norms: [
        {
          normId: 'BOE-A-2006-20764',
          normTitle: 'Ley 35/2006',
          sourceUrl: 'https://www.boe.es/buscar/act.php?id=BOE-A-2006-20764',
          boeUpdatedAt: '2026-03-17',
          fetchedAt: '2026-03-18T08:00:00Z',
          licenseNote: 'Reutilización de textos del BOE.',
        },
      ],
      passages: [{ ...makePassage(), boeUpdatedAt: '2026-03-17', updatedAt: undefined }],
    });
    expect(parseCorpusArtifact(v1)).toEqual({ ok: false, error: 'unparsable' });
  });
});

describe('AC-004-08 missing or malformed provenance is rejected', () => {
  it('AC-004-08: a norm missing provenance fields is unparsable', () => {
    for (const field of ['publisher', 'jurisdiction', 'authorityUsed', 'officialId', 'updatedAt']) {
      const norm: Record<string, unknown> = { ...NORM };
      delete norm[field];
      expect(parseCorpusArtifact(corpusText({ norms: [norm] })), field).toEqual({
        ok: false,
        error: 'unparsable',
      });
    }
    expect(parseCorpusArtifact(corpusText({ norms: [{ ...NORM, updatedAt: '17/03/2026' }] }))).toEqual(
      { ok: false, error: 'unparsable' }
    );
  });

  it('AC-004-08: a passage missing publisher, jurisdiction or a valid updatedAt is unparsable', () => {
    for (const field of ['publisher', 'jurisdiction', 'updatedAt']) {
      const passage: Record<string, unknown> = { ...makePassage() };
      delete passage[field];
      expect(parseCorpusArtifact(corpusText({ passages: [passage] })), field).toEqual({
        ok: false,
        error: 'unparsable',
      });
    }
  });

  it('AC-004-08: missing or malformed coverage is unparsable', () => {
    for (const coverage of [undefined, [], [{ jurisdiction: 'state' }], [{ tax: 'irpf' }]]) {
      expect(parseCorpusArtifact(corpusText({ coverage }))).toEqual({
        ok: false,
        error: 'unparsable',
      });
    }
  });
});

describe('AC-004-09 provenance is part of the content hash', () => {
  const provenanceChanges: readonly [string, Record<string, unknown>][] = [
    ['publisher', { publisher: 'bocm' }],
    ['jurisdiction', { jurisdiction: 'madrid' }],
    ['authorityUsed', { authorityUsed: 'bocm' }],
    ['officialId', { officialId: 'BOCM-m-2010-90068' }],
    ['sourceUrl', { sourceUrl: 'https://www.boe.es/buscar/act.php?id=BOCM-m-2010-90068' }],
    ['updatedAt', { updatedAt: '2026-08-31' }],
    ['licenseNote', { licenseNote: 'Otra nota de reutilización.' }],
  ];

  it('AC-004-09: changing any provenance field changes the hash', () => {
    const base = contentHashOf({ coverage: COVERAGE, norms: [NORM], passages: [makePassage()] });
    for (const [field, change] of provenanceChanges) {
      const changed = contentHashOf({
        coverage: COVERAGE,
        norms: [{ ...NORM, ...change } as never],
        passages: [makePassage()],
      });
      expect(changed, field).not.toBe(base);
    }
  });

  it('AC-004-09: generatedAt is not part of the hash', () => {
    const first = corpusText({ generatedAt: '2026-03-18T08:00:00Z' });
    const second = corpusText({ generatedAt: '2026-05-01T09:00:00Z' });
    const hashOf = (text: string): string => {
      const parsed = JSON.parse(text) as { coverage: unknown; norms: unknown; passages: unknown };
      return contentHashOf({
        coverage: parsed.coverage as never,
        norms: parsed.norms as never,
        passages: parsed.passages as never,
      });
    };
    expect(hashOf(first)).toBe(hashOf(second));
    expect(canonicalJson({ generatedAt: 'x' })).not.toContain('contentHash');
  });
});

describe('AC-004-10 the 8 existing norms migrate to boe / state', () => {
  it('AC-004-10: every state norm carries boe/state/boe and the BOE-A id', () => {
    const raw = readFileSync(repoPath('corpus/corpus.json'), 'utf8');
    const parsed = parseCorpusArtifact(raw);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    // The v1 artifact's `boeUpdatedAt` values, preserved by the one-time migration.
    const V1_DATES: Readonly<Record<string, string>> = {
      'BOE-A-2006-20764': '2026-10-07',
      'BOE-A-2007-6820': '2026-10-07',
      'BOE-A-2003-23186': '2026-10-09',
      'BOE-A-2007-15984': '2026-10-09',
      'BOE-A-2015-11724': '2026-10-23',
      'BOE-A-1996-4447': '2026-07-30',
      'BOE-A-1992-28740': '2026-10-07',
      'BOE-A-1990-23930': '2026-06-04',
    };

    expect(contentHashOf(parsed.artifact)).toBe(parsed.artifact.contentHash);

    const stateNorms = parsed.artifact.norms.filter((norm) => norm.publisher === 'boe');
    expect(stateNorms).toHaveLength(8);
    for (const norm of stateNorms) {
      expect(norm.normId).toMatch(/^BOE-A-/);
      expect(norm.jurisdiction).toBe('state');
      expect(norm.authorityUsed).toBe('boe');
      expect(norm.officialId).toBe(norm.normId);
      expect(norm.updatedAt).toBe(V1_DATES[norm.normId]);
    }

    for (const passage of parsed.artifact.passages.filter((entry) => entry.publisher === 'boe')) {
      expect(passage.jurisdiction).toBe('state');
    }
  });
});

describe('AC-004-11 the citation and passage projection carry publisher and jurisdiction', () => {
  it('AC-004-11: citationOf projects the provenance and never the text', () => {
    const result = createPassage(BASE);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.passage.publisher).toBe('boe');
    expect(result.passage.jurisdiction).toBe('state');
    expect(result.passage.updatedAt).toBe('2026-03-17');

    const citation = citationOf(result.passage);
    expect(citation).toEqual({
      passageId: 'BOE-A-2006-20764#a63',
      normTitle: 'Ley 35/2006 del Impuesto sobre la Renta',
      articleLabel: 'Artículo 63',
      sourceUrl: 'https://www.boe.es/buscar/act.php?id=BOE-A-2006-20764',
      publisher: 'boe',
      jurisdiction: 'state',
      authorityUsed: 'boe',
      updatedAt: '2026-03-17',
    });
    expect('text' in citation).toBe(false);
    expect('boeUpdatedAt' in citation).toBe(false);
  });
});
