import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { parseCorpusArtifact } from '@/corpus/artifact';
import { runCorpusSync } from '@/corpus/sync';
import { ALLOWED_NORMS } from '@/domain/allowed-norms';
import { coverageOf, isCovered, type CoveragePair } from '@/domain/coverage';

import { fixtureAdapters, fixtureFetcher, repoPath } from '../support/harness';

function filesUnder(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...filesUnder(full));
    else files.push(full);
  }
  return files;
}

/** A literal pair list outside the registry/coverage module is a second source of truth. */
function declaresPairLiteral(file: string): boolean {
  if (!/\.(ts|tsx)$/.test(file)) return false;
  if (file.includes('/domain/allowed-norms.ts')) return false;
  if (file.includes('/domain/coverage.ts')) return false;
  return /jurisdiction:\s*'(?:state|madrid|murcia)'\s*,\s*tax:/.test(readFileSync(file, 'utf8'));
}

function committedCoverage(): readonly CoveragePair[] {
  const raw = readFileSync(repoPath('corpus/corpus.json'), 'utf8');
  const parsed = parseCorpusArtifact(raw);
  if (!parsed.ok) throw new Error(`committed corpus did not parse: ${parsed.error}`);
  return parsed.artifact.coverage;
}

describe('AC-004-12 the lookup answers true for a declared pair', () => {
  it('AC-004-12: (madrid, irpf) is covered', () => {
    expect(isCovered([{ jurisdiction: 'madrid', tax: 'irpf' }], 'madrid', 'irpf')).toBe(true);
  });
});

describe('AC-004-13 the lookup answers false for an undeclared pair or unknown values', () => {
  it('AC-004-13: undeclared pairs and unknown jurisdictions answer false', () => {
    const coverage: readonly CoveragePair[] = [
      { jurisdiction: 'state', tax: 'irpf' },
      { jurisdiction: 'madrid', tax: 'irpf' },
    ];
    expect(isCovered(coverage, 'madrid', 'itp')).toBe(false);
    expect(isCovered(coverage, 'murcia', 'irpf')).toBe(false);
    expect(isCovered(coverage, 'barcelona', 'irpf')).toBe(false);
    expect(isCovered(coverage, 'madrid', 'unknown_tax')).toBe(false);
  });
});

describe('AC-004-14 the committed coverage declares exactly the six pilot pairs', () => {
  it('AC-004-14: the coverage set is the six declared pairs', () => {
    const key = (pair: CoveragePair): string => `${pair.jurisdiction}:${pair.tax}`;
    expect(new Set(committedCoverage().map(key))).toEqual(
      new Set([
        'state:irpf',
        'state:iva',
        'state:autonomo',
        'state:iae',
        'madrid:irpf',
        'murcia:irpf',
      ])
    );
  });
});

describe('AC-004-15 coverage is derived from the registry, not a second list', () => {
  it('AC-004-15: the sync derives the artifact coverage from the registry tags', async () => {
    const expected = coverageOf(ALLOWED_NORMS);
    const result = await runCorpusSync({
      adapters: fixtureAdapters(),
      previous: null,
      generatedAt: '2026-03-18T08:00:00Z',
      taxYear: 2025,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.artifact.coverage).toEqual(expected);
    expect(committedCoverage()).toEqual(expected);
  });

  it('AC-004-15: no other module declares its own pair list', () => {
    const offenders = filesUnder(repoPath('src')).filter(declaresPairLiteral);
    expect(offenders).toEqual([]);
  });
});

describe('AC-004-16 a missing or malformed coverage field is rejected at parse time', () => {
  it('AC-004-16: absent, empty or malformed coverage is unparsable', async () => {
    const result = await runCorpusSync({
      adapters: fixtureAdapters(fixtureFetcher()),
      previous: null,
      generatedAt: '2026-03-18T08:00:00Z',
      taxYear: 2025,
    });
    if (!result.ok) throw new Error('fixture sync failed');
    const base = result.artifact as unknown as Record<string, unknown>;

    for (const coverage of [undefined, [], [{ jurisdiction: 'state' }]]) {
      const raw = JSON.stringify({ ...base, coverage });
      expect(parseCorpusArtifact(raw)).toEqual({ ok: false, error: 'unparsable' });
    }
  });
});
