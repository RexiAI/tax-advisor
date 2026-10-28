import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { contentHashOf, type CorpusArtifact } from '@/corpus/artifact';
import { runCorpusSync } from '@/corpus/sync';
import { runCorpusSyncCli } from '@/corpus/sync-cli';
import { ALLOWED_NORMS } from '@/domain/allowed-norms';

import { FakeCorpusFetcher } from '../support/fake-fetcher';
import {
  fixtureAdapters,
  fixtureCorpus,
  fixtureFetcher,
  fixtureMeta,
  fixturePassages,
  readFixture,
  repoPath,
} from '../support/harness';
import { offlineFetchState } from '../support/offline-fetch';

const NEW_NORM_IDS = ALLOWED_NORMS.slice(2).map((norm) => norm.normId);

/** Parses, but every block is non-normative: the corpus would be empty. */
const PREAMBLE_ONLY = `<?xml version="1.0" encoding="UTF-8"?>
<documento>
  <texto>
    <bloque id="preambulo" tipo="preambulo" titulo="Preámbulo">
      <version id="v-1"><p>Texto de preámbulo.</p></version>
    </bloque>
  </texto>
</documento>`;
const GENERATED_AT = '2026-03-18T08:00:00Z';

async function sync(
  fetcher: FakeCorpusFetcher,
  previous: CorpusArtifact | null = null
): Promise<Awaited<ReturnType<typeof runCorpusSync>>> {
  return runCorpusSync({
    adapters: fixtureAdapters(fetcher),
    previous,
    generatedAt: GENERATED_AT,
    taxYear: 2025,
  });
}

async function firstArtifact(): Promise<CorpusArtifact> {
  const result = await sync(fixtureFetcher());
  if (!result.ok) throw new Error(`sync failed: ${result.normId} ${result.detail}`);
  return result.artifact;
}

async function runCli(
  artifactPath: string,
  fetcher: FakeCorpusFetcher
): Promise<{ exitCode: number; stderr: string[] }> {
  const stderr: string[] = [];
  const exitCode = await runCorpusSyncCli({
    adapters: fixtureAdapters(fetcher),
    artifactPath,
    taxYear: 2025,
    now: () => new Date(GENERATED_AT),
    readFile: (path) => (existsSync(path) ? readFileSync(path, 'utf8') : null),
    writeFile: (path, contents) => writeFileSync(path, contents, 'utf8'),
    stdout: () => undefined,
    stderr: (line) => stderr.push(line),
  });
  return { exitCode, stderr };
}

describe('AC-002-04 the sync walks exactly the allowed norms', () => {
  it('AC-002-04: one metadata read per allowed norm and every norm fetched once', async () => {
    const fetcher = fixtureFetcher();
    const result = await sync(fetcher);

    expect(ALLOWED_NORMS).toHaveLength(10);
    expect(fetcher.metadataCount).toBe(ALLOWED_NORMS.length);
    expect(fetcher.fetchedNormIds).toEqual(ALLOWED_NORMS.map((norm) => norm.normId));

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.fetchedNormIds).toHaveLength(ALLOWED_NORMS.length);
    expect(result.reusedNormIds).toHaveLength(0);
    expect(result.artifact.norms.map((norm) => norm.normId)).toEqual(
      ALLOWED_NORMS.map((norm) => norm.normId)
    );
  });
});

describe('AC-002-05 an unchanged norm is reused and only the changed one is re-fetched', () => {
  it('AC-002-05: one fetched norm, nine reused, the reused fetchedAt untouched', async () => {
    const previous = await firstArtifact();
    const changed = NEW_NORM_IDS[0] as string;
    const stale: CorpusArtifact = {
      ...previous,
      norms: previous.norms.map((norm) =>
        norm.normId === changed ? { ...norm, updatedAt: '2025-01-01' } : norm
      ),
    };

    const fetcher = fixtureFetcher();
    const result = await sync(fetcher, stale);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.fetchedNormIds).toEqual([changed]);
    expect(result.reusedNormIds).toHaveLength(ALLOWED_NORMS.length - 1);
    expect(fetcher.fetchCount).toBe(1);
    expect(fetcher.fetchedNormIds).toEqual([changed]);

    const untouched = result.artifact.norms.find((norm) => norm.normId !== changed);
    expect(untouched?.fetchedAt).toBe(previous.norms[0]?.fetchedAt);
  });

  it('AC-002-05: re-running over unchanged data is byte-identical, hash included', async () => {
    const first = await firstArtifact();
    const second = await sync(fixtureFetcher(), first);
    expect(second.ok).toBe(true);
    if (!second.ok) return;

    expect(JSON.stringify(second.artifact.passages)).toBe(JSON.stringify(first.passages));
    expect(second.artifact.contentHash).toBe(first.contentHash);
    expect(second.artifact.contentHash).toBe(contentHashOf(fixtureCorpus().artifact));
  });
});

describe('AC-002-06 a broken parse of a new norm stops the sync and writes nothing', () => {
  it('AC-002-06: parse_failed names the new norm, the CLI exits 1 and nothing is written', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'corpus-002-'));
    try {
      const path = join(dir, 'corpus.json');
      const healthy = await runCli(path, fixtureFetcher());
      expect(healthy.exitCode).toBe(0);
      const before = readFileSync(path, 'utf8');

      const brokenNorm = NEW_NORM_IDS[2] as string;
      const broken = fixtureFetcher();
      // A newer BOE update date is what makes the sync re-fetch instead of reuse.
      broken.replaceDocument(brokenNorm, readFixture('boe', 'malformed-truncated.xml'), '2026-11-01');

      const failed = await runCli(path, broken);
      expect(failed.exitCode).toBe(1);
      expect(failed.stderr.join('\n')).toContain(brokenNorm);
      expect(failed.stderr.join('\n')).toContain('parse_failed');
      expect(readFileSync(path, 'utf8')).toBe(before);

      const result = await sync(broken);
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error).toBe('parse_failed');
      expect(result.normId).toBe(brokenNorm);
      expect(result.detail).toBe('unparsable');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('AC-002-06: a norm that parses to zero passages fails instead of shrinking the corpus', async () => {
    const brokenNorm = NEW_NORM_IDS[1] as string;
    const broken = fixtureFetcher();
    broken.replaceDocument(brokenNorm, PREAMBLE_ONLY, '2026-11-01');

    const result = await sync(broken);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBe('parse_failed');
    expect(result.detail).toBe('no_passages');
  });
});

describe('AC-002-07 the offline fixtures cover the new norms and no test reaches BOE', () => {
  it('AC-002-07: one fixture per norm, in FIXTURE_META, and the fixture index exceeds 396', async () => {
    const dir = repoPath('test/fixtures/boe');
    for (const meta of fixtureMeta()) {
      const file = meta.file[1];
      const xml = readFileSync(join(dir, file), 'utf8');
      expect(xml, `${file} lost its bloque shape`).toContain('<bloque');
      expect(xml, `${file} lost its version shape`).toContain('<version');
    }

    expect(
      fixtureMeta()
        .map((meta) => meta.normId)
        .sort()
    ).toEqual(ALLOWED_NORMS.map((norm) => norm.normId).sort());

    const corpus = fixtureCorpus();
    expect(corpus.index.size).toBeGreaterThan(396);
    for (const normId of NEW_NORM_IDS) {
      expect(
        corpus.artifact.passages.some((passage) => passage.normId === normId),
        `no fixture passage for ${normId}`
      ).toBe(true);
    }

    await sync(fixtureFetcher());
    expect(offlineFetchState.attempts).toEqual([]);
  });
});

describe('AC-002-07 adding a norm changes the content hash', () => {
  it('AC-002-07: the IRPF-only passage set and the expanded one hash differently', () => {
    const all = fixturePassages();
    const irpfOnly = all.filter(
      (passage) =>
        passage.normId.startsWith('BOE-A-2006-20764') ||
        passage.normId.startsWith('BOE-A-2007-6820')
    );

    const hashOfPassages = (passages: readonly (typeof all)[number][]) =>
      contentHashOf({ coverage: [], norms: [], passages });

    expect(irpfOnly.length).toBeLessThan(all.length);
    expect(hashOfPassages(irpfOnly)).not.toBe(hashOfPassages(all));
  });
});
