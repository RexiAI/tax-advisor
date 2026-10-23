import { describe, expect, it } from 'vitest';

import { canonicalJson, contentHashOf, parseCorpusArtifact } from '@/corpus/artifact';
import { loadCorpusFromText } from '@/server/corpus-loader';

import { makePassage } from '../support/factories';

describe('canonicalJson', () => {
  it('sorts keys at every level', () => {
    expect(canonicalJson({ b: 1, a: { d: 2, c: 3 } })).toBe('{"a":{"c":3,"d":2},"b":1}');
  });

  it('keeps array order', () => {
    expect(canonicalJson([{ b: 1, a: 2 }, 3])).toBe('[{"a":2,"b":1},3]');
  });

  it('drops undefined values so a missing field cannot change the hash', () => {
    expect(canonicalJson({ a: 1, b: undefined })).toBe(canonicalJson({ a: 1 }));
  });
});

describe('contentHashOf', () => {
  it('is stable across key insertion order', () => {
    const passage = makePassage();
    const reordered = { ...passage, text: passage.text, normTitle: passage.normTitle };
    expect(contentHashOf([passage])).toBe(contentHashOf([reordered]));
  });

  it('changes when any passage text changes', () => {
    const first = contentHashOf([makePassage()]);
    const second = contentHashOf([makePassage({ text: 'Texto distinto.' })]);
    expect(first).not.toBe(second);
  });

  it('is a hex sha-256 digest', () => {
    expect(contentHashOf([makePassage()])).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe('parseCorpusArtifact', () => {
  it('reports an empty file as empty', () => {
    expect(parseCorpusArtifact('   ')).toEqual({ ok: false, error: 'empty' });
  });

  it('reports unparsable JSON as unparsable', () => {
    expect(parseCorpusArtifact('{ not json')).toEqual({ ok: false, error: 'unparsable' });
  });

  it('reports a JSON body missing artifact fields as unparsable', () => {
    expect(parseCorpusArtifact('{"schemaVersion":1}')).toEqual({
      ok: false,
      error: 'unparsable',
    });
  });

  it('reports an artifact with no passages as empty', () => {
    const raw = JSON.stringify({
      schemaVersion: 1,
      taxYear: 2025,
      generatedAt: '2026-03-18T08:00:00Z',
      contentHash: 'abc',
      norms: [],
      passages: [],
    });
    expect(parseCorpusArtifact(raw)).toEqual({ ok: false, error: 'empty' });
  });
});

describe('loadCorpusFromText', () => {
  it('builds an index from a valid artifact', () => {
    const passage = makePassage();
    const raw = JSON.stringify({
      schemaVersion: 1,
      taxYear: 2025,
      generatedAt: '2026-03-18T08:00:00Z',
      contentHash: contentHashOf([passage]),
      norms: [],
      passages: [passage],
    });

    const loaded = loadCorpusFromText(raw);
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;
    expect(loaded.corpus.index.size).toBe(1);
    expect(loaded.corpus.artifact.taxYear).toBe(2025);
  });

  it('refuses an artifact whose passages repeat a passageId', () => {
    const passage = makePassage();
    const raw = JSON.stringify({
      schemaVersion: 1,
      taxYear: 2025,
      generatedAt: '2026-03-18T08:00:00Z',
      contentHash: 'abc',
      norms: [],
      passages: [passage, passage],
    });
    expect(loadCorpusFromText(raw)).toEqual({ ok: false, error: 'unparsable' });
  });
});
