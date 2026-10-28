import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { buildEvidence } from '@/evidence/build-evidence';
import { search } from '@/retrieval/index';

import { fixtureCorpus, repoPath } from '../support/harness';

const fixture = fixtureCorpus();

describe('AC-001-27 a supported question yields a sufficient bundle with display fields', () => {
  it('AC-001-27: an alquiler question retrieves a sufficient bundle with display metadata', () => {
    const bundle = buildEvidence(
      '¿Puedo deducirme el alquiler de mi vivienda habitual?',
      fixture.index,
      {
        minRetrievalScore: 0.01,
      }
    );

    expect(bundle.status).toBe('sufficient');
    expect(bundle.passages.length).toBeGreaterThan(0);

    const retrieved = search(
      fixture.index,
      '¿Puedo deducirme el alquiler de mi vivienda habitual?'
    );
    expect(bundle.passages.map((passage) => passage.passageId)).toEqual(
      retrieved.map((result) => result.passage.passageId)
    );

    for (const passage of bundle.passages) {
      expect(passage.passageId).toContain('#');
      expect(passage.normTitle).not.toBe('');
      expect(passage.articleLabel).not.toBe('');
      expect(passage.sourceUrl).toContain('https://www.boe.es/');
      expect(passage.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });
});

describe('AC-001-28 no results is insufficient', () => {
  it('AC-001-28: an unmatched query yields no_results and no passages', () => {
    const bundle = buildEvidence('criptomonedas', fixture.index, { minRetrievalScore: 0.01 });
    expect(bundle.status).toBe('insufficient');
    if (bundle.status !== 'insufficient') return;
    expect(bundle.reason).toBe('no_results');
    expect(bundle.passages).toEqual([]);
  });
});

describe('AC-001-29 a score exactly at the threshold counts as sufficient', () => {
  it('AC-001-29: equality is sufficient and a hair below is below_threshold', () => {
    const query = 'alquiler vivienda habitual';
    const [top] = search(fixture.index, query);
    expect(top).toBeDefined();
    const score = top!.score;

    expect(buildEvidence(query, fixture.index, { minRetrievalScore: score }).status).toBe(
      'sufficient'
    );

    // The scenario subtracts 0.000001 from the top score, i.e. the threshold sits
    // a hair above it.
    const below = buildEvidence(query, fixture.index, { minRetrievalScore: score + 0.000001 });
    expect(below.status).toBe('insufficient');
    if (below.status !== 'insufficient') return;
    expect(below.reason).toBe('below_threshold');
  });
});

describe('AC-001-30 the threshold is configuration, not a call-site literal', () => {
  it('AC-001-30: raising the threshold flips the same query to insufficient', () => {
    const query = 'alquiler vivienda habitual';
    const [top] = search(fixture.index, query);

    const normal = buildEvidence(query, fixture.index, { minRetrievalScore: 0.01 });
    const strict = buildEvidence(query, fixture.index, { minRetrievalScore: top!.score + 1 });

    expect(normal.status).toBe('sufficient');
    expect(strict.status).toBe('insufficient');
  });

  it('AC-001-30: the module carries no numeric threshold literal', () => {
    const source = readFileSync(repoPath('src/evidence/build-evidence.ts'), 'utf8');
    expect(source).not.toMatch(/\d+\.\d+/);
    expect(source).not.toMatch(/minRetrievalScore\s*[?]{2}\s*\d/);
    expect(source).not.toMatch(/minRetrievalScore\s*=\s*\d/);
  });
});
