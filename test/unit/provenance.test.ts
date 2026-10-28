import { describe, expect, it } from 'vitest';

import { syncNorm } from '@/corpus/sync';
import { coverageOf } from '@/domain/coverage';
import { findAllowedNorm } from '@/domain/allowed-norms';
import { citationOf } from '@/domain/citation';
import { selectVerifiedPilots } from '@/domain/pilot-ingestion';
import { isCovered } from '@/domain/coverage';

import { fakeBoeAdapter } from '../support/fake-fetcher';
import { makePassage } from '../support/factories';
import { fixtureFetcher } from '../support/harness';

const STATE = findAllowedNorm('BOE-A-2006-20764')!;

describe('coverageOf', () => {
  it('deduplicates and orders pairs canonically', () => {
    const pairs = coverageOf([
      { jurisdiction: 'murcia', tax: 'irpf' },
      { jurisdiction: 'state', tax: 'iae' },
      { jurisdiction: 'state', tax: 'irpf' },
      { jurisdiction: 'state', tax: 'irpf' },
      { jurisdiction: 'madrid', tax: 'irpf' },
    ]);
    expect(pairs).toEqual([
      { jurisdiction: 'state', tax: 'irpf' },
      { jurisdiction: 'state', tax: 'iae' },
      { jurisdiction: 'madrid', tax: 'irpf' },
      { jurisdiction: 'murcia', tax: 'irpf' },
    ]);
  });

  it('an unknown pair is not covered', () => {
    expect(isCovered(coverageOf([]), 'state', 'irpf')).toBe(false);
    expect(isCovered([{ jurisdiction: 'state', tax: 'irpf' }], 'State', 'irpf')).toBe(false);
  });
});

describe('selectVerifiedPilots', () => {
  it('walks the fallback order when both pilots fail verification', () => {
    const selection = selectVerifiedPilots([
      { id: 'extemadura-typo', label: 'unknown', verified: true },
      { id: 'madrid', label: 'Madrid', verified: false },
      { id: 'murcia', label: 'Murcia', verified: false },
      { id: 'castilla_y_leon', label: 'Castilla y León', verified: true },
      { id: 'aragon', label: 'Aragón', verified: true },
    ]);
    expect(selection.selected.map((candidate) => candidate.id)).toEqual([
      'castilla_y_leon',
      'aragon',
    ]);
    expect(selection.replaced.map((entry) => entry.id)).toEqual(['madrid', 'murcia']);
    expect(selection.replaced[0]?.reason).toMatch(/no stable consolidated text/);
  });
});

describe('citationOf provenance projection', () => {
  it('reads authorityUsed from the norm, never from the publisher', () => {
    const madrid = makePassage({
      normId: 'BOCM-m-2010-90068',
      normTitle: 'Decreto Legislativo 1/2010 de la Comunidad de Madrid',
      sourceUrl: 'https://www.boe.es/buscar/act.php?id=BOCM-m-2010-90068',
      updatedAt: '2026-08-31',
    });

    const citation = citationOf(madrid);
    expect(citation.publisher).toBe('bocm');
    expect(citation.jurisdiction).toBe('madrid');
    expect(citation.authorityUsed).toBe('boe');
  });

  it('refuses to invent a host for a passage outside the registry', () => {
    expect(() =>
      citationOf({
        passageId: 'BOE-A-0000-00000#a1',
        normTitle: 'Norma fuera del registro',
        articleLabel: 'Artículo 1',
        sourceUrl: 'https://www.boe.es/buscar/act.php?id=BOE-A-0000-00000',
        publisher: 'boe',
        jurisdiction: 'state',
        updatedAt: '2026-01-01',
      })
    ).toThrow(/outside the registry/);
  });
});

describe('syncNorm guards', () => {
  const base = {
    adapters: [fakeBoeAdapter(fixtureFetcher())],
    previous: null,
    generatedAt: '2026-03-18T08:00:00Z',
    taxYear: 2025,
  };

  it('refuses a norm with an empty provenance field', async () => {
    const result = await syncNorm({ ...STATE, officialId: '' }, base);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBe('fetch_failed');
    expect(result.detail).toBe('incomplete_provenance');
  });

  it('refuses a norm whose authority has no adapter', async () => {
    const result = await syncNorm({ ...STATE, authorityUsed: 'borm' }, base);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBe('fetch_failed');
    expect(result.detail).toContain('no_adapter');
  });
});
