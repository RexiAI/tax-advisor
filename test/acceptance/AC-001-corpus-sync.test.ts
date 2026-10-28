import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  canonicalJson,
  contentHashOf,
  CORPUS_SCHEMA_VERSION,
  toIsoUtcSeconds,
  type CorpusArtifact,
} from '@/corpus/artifact';
import { runCorpusSync } from '@/corpus/sync';
import { runCorpusSyncCli } from '@/corpus/sync-cli';
import { ALLOWED_NORMS } from '@/domain/allowed-norms';

import type { FakeCorpusFetcher } from '../support/fake-fetcher';
import { fixtureAdapters, fixtureCorpus, fixtureFetcher, readFixture } from '../support/harness';

const GENERATED_AT = '2026-03-18T08:00:00Z';

/**
 * One document per covered norm. The sync walks the whole registry, so a fetcher
 * that served only the IRPF pair would fail on every other norm.
 */
function fetcher(): FakeCorpusFetcher {
  return fixtureFetcher();
}

async function runCli(
  artifactPath: string,
  fakeFetcher: FakeCorpusFetcher
): Promise<{ exitCode: number; stdout: string[]; stderr: string[] }> {
  const stdout: string[] = [];
  const stderr: string[] = [];
  const exitCode = await runCorpusSyncCli({
    adapters: fixtureAdapters(fakeFetcher),
    artifactPath,
    taxYear: 2025,
    now: () => new Date('2026-03-18T08:00:00Z'),
    readFile: (path) => (existsSync(path) ? readFileSync(path, 'utf8') : null),
    writeFile: (path, contents) => writeFileSync(path, contents, 'utf8'),
    stdout: (line) => stdout.push(line),
    stderr: (line) => stderr.push(line),
  });
  return { exitCode, stdout, stderr };
}

async function sync(
  options: { previous?: CorpusArtifact | null; generatedAt?: string } = {}
): Promise<{ artifact: CorpusArtifact; fetcher: FakeCorpusFetcher }> {
  const fakeFetcher = fetcher();
  const result = await runCorpusSync({
    adapters: fixtureAdapters(fakeFetcher),
    previous: options.previous ?? null,
    generatedAt: options.generatedAt ?? GENERATED_AT,
    taxYear: 2025,
  });
  if (!result.ok) throw new Error(`sync failed: ${result.normId} ${result.detail}`);
  return { artifact: result.artifact, fetcher: fakeFetcher };
}

describe('AC-001-15 the artifact carries provenance for every norm and passage', () => {
  it('AC-001-15: the written artifact is complete and licensed', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'corpus-'));
    try {
      const path = join(dir, 'corpus.json');
      const cli = await runCli(path, fetcher());
      expect(cli.exitCode).toBe(0);
      expect(cli.stdout.join('\n')).toContain('passages');
      const written = JSON.parse(readFileSync(path, 'utf8')) as CorpusArtifact;

      expect(written.schemaVersion).toBe(CORPUS_SCHEMA_VERSION);
      expect(written.taxYear).toBe(2025);
      expect(written.generatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
      expect(written.contentHash).toMatch(/^[0-9a-f]{64}$/);
      expect(written.passages.length).toBeGreaterThan(0);

      for (const norm of written.norms) {
        expect(norm.normId).toMatch(/^(BOE-A-|BOCM-m-)/);
        expect(norm.normTitle).not.toBe('');
        expect(norm.sourceUrl).toContain('https://www.boe.es/');
        expect(norm.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(norm.fetchedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
        expect(norm.licenseNote).toContain('BOE');
      }

      for (const passage of written.passages) {
        expect(Object.keys(passage).sort()).toEqual(
          [
            'articleLabel',
            'blockId',
            'blockTitle',
            'updatedAt',
            'fetchedAt',
            'jurisdiction',
            'normId',
            'normTitle',
            'passageId',
            'publisher',
            'sourceUrl',
            'text',
          ].sort()
        );
      }

      const license = written.norms[0]!.licenseNote;
      expect(license).toMatch(/cita la fuente/i);
      expect(license).toMatch(/no se altera/i);
      expect(license).toMatch(/no se sugiere|respaldo/i);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('AC-001-16 an unchanged BOE causes zero fetches', () => {
  it('AC-001-16: nothing is fetched and the passages are unchanged', async () => {
    const first = await sync();
    const second = await sync({ previous: first.artifact });

    expect(second.fetcher.fetchCount).toBe(0);
    expect(second.artifact.passages).toEqual(first.artifact.passages);
  });
});

describe('AC-001-17 only changed norms are re-fetched', () => {
  it('AC-001-17: exactly one document is fetched and the other fetchedAt is untouched', async () => {
    const first = await sync();
    const stale: CorpusArtifact = {
      ...first.artifact,
      norms: first.artifact.norms.map((norm) =>
        norm.normId === 'BOE-A-2007-6820' ? { ...norm, updatedAt: '2025-01-01' } : norm
      ),
    };

    const fakeFetcher = fetcher();
    const result = await runCorpusSync({
      adapters: fixtureAdapters(fakeFetcher),
      previous: stale,
      generatedAt: '2026-04-01T10:00:00Z',
      taxYear: 2025,
    });
    if (!result.ok) throw new Error('sync failed');

    expect(fakeFetcher.fetchCount).toBe(1);
    expect(fakeFetcher.fetchedNormIds).toEqual(['BOE-A-2007-6820']);
    expect(result.fetchedNormIds).toEqual(['BOE-A-2007-6820']);
    expect(result.reusedNormIds).toHaveLength(ALLOWED_NORMS.length - 1);
    expect(result.reusedNormIds).not.toContain('BOE-A-2007-6820');

    const untouched = result.artifact.norms.find((norm) => norm.normId === 'BOE-A-2006-20764');
    expect(untouched?.fetchedAt).toBe(first.artifact.norms[0]!.fetchedAt);
  });
});

describe('AC-001-18 re-running sync is byte-identical', () => {
  it('AC-001-18: passages, order, ids and contentHash survive a second run', async () => {
    const first = await sync();
    const second = await sync({ previous: first.artifact, generatedAt: '2026-03-19T09:00:00Z' });

    expect(JSON.stringify(second.artifact.passages)).toBe(JSON.stringify(first.artifact.passages));
    expect(second.artifact.contentHash).toBe(first.artifact.contentHash);

    const ids = second.artifact.passages.map((passage) => passage.passageId);
    expect(new Set(ids).size).toBe(ids.length);

    // The hash covers the passages only: `generatedAt` cannot influence it.
    expect(contentHashOf(first.artifact)).toBe(first.artifact.contentHash);
    expect(canonicalJson(first.artifact.passages)).not.toContain('generatedAt');
    expect(contentHashOf(fixtureCorpus().artifact)).toBe(first.artifact.contentHash);
  });
});

describe('AC-001-19 a broken parse never ships a shrunken corpus', () => {
  it('AC-001-19: the process exits non-zero, names the norm and overwrites nothing', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'corpus-'));
    try {
      const path = join(dir, 'corpus.json');
      const healthy = await runCli(path, fetcher());
      expect(healthy.exitCode).toBe(0);
      const before = readFileSync(path, 'utf8');

      const broken = fixtureFetcher();
      broken.replaceDocument(
        'BOE-A-2006-20764',
        readFixture('boe', 'malformed-truncated.xml'),
        '2026-05-01'
      );
      const failed = await runCli(path, broken);

      expect(failed.exitCode).toBe(1);
      expect(readFileSync(path, 'utf8')).toBe(before);
      expect(failed.stderr.join('\n')).toContain('BOE-A-2006-20764');
      expect(failed.stderr.join('\n')).toContain('unparsable');

      const result = await runCorpusSync({
        adapters: fixtureAdapters(broken),
        previous: null,
        generatedAt: GENERATED_AT,
        taxYear: 2025,
      });
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error).toBe('parse_failed');
      expect(result.normId).toBe('BOE-A-2006-20764');
      expect(result.detail).toBe('unparsable');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('AC-001-20 the corpus is built from official hosts only', () => {
  it('AC-001-20: every source URL points at an official host', () => {
    const raw = readFileSync(new URL('../../corpus/corpus.json', import.meta.url), 'utf8');
    const artifact = JSON.parse(raw) as CorpusArtifact;

    const hosts = new Set(artifact.norms.map((norm) => new URL(norm.sourceUrl).hostname));
    expect([...hosts].sort()).toEqual(['www.boe.es']);
    for (const passage of artifact.passages) {
      const host = new URL(passage.sourceUrl).hostname;
      expect(['www.boe.es', 'sede.agenciatributaria.gob.es']).toContain(host);
    }
    expect(raw.toLowerCase()).not.toContain('blog');
    expect(raw.toLowerCase()).not.toContain('asesoria fiscal privada');
  });
});

describe('artifact timestamps', () => {
  it('toIsoUtcSeconds formats the artifact timestamp without milliseconds', () => {
    expect(toIsoUtcSeconds(new Date('2026-03-18T08:00:00.123Z'))).toBe('2026-03-18T08:00:00Z');
  });
});
