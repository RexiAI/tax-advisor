import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { createBocmAdapter, normalizeBulletinDate, readBocmPublicationDate } from '@/corpus/bocm-adapter';
import { syncNorm } from '@/corpus/sync';
import { runCorpusSync } from '@/corpus/sync';
import { runCorpusSyncCli } from '@/corpus/sync-cli';
import { findAllowedNorm, type AllowedNorm } from '@/domain/allowed-norms';

import { fakeBoeAdapter } from '../support/fake-fetcher';
import { fixtureFetcher, readFixture, repoPath } from '../support/harness';

const BASE_MADRID = findAllowedNorm('BOCM-m-2010-90068') as AllowedNorm;
const REGIONAL: AllowedNorm = {
  ...BASE_MADRID,
  authorityUsed: 'bocm',
  sourceUrl: 'https://www.bocm.es/boletin/CM_Orden_BOCM/2010/10/25/BOCM-20101025-1.xml',
};

const BOCM_FIXTURE = readFixture('bocm', 'disposicion-20101025-1.xml');

interface FetchState {
  readonly urls: string[];
  count: number;
}

function fixtureFetch(
  body: string,
  status = 200
): { fetchImpl: typeof fetch; state: FetchState } {
  const state: FetchState = { urls: [], count: 0 };
  const fetchImpl = ((input: RequestInfo | URL) => {
    state.urls.push(String(input));
    state.count += 1;
    return Promise.resolve(new Response(body, { status }));
  }) as typeof fetch;
  return { fetchImpl, state };
}

function undatedFixture(): string {
  return BOCM_FIXTURE.replace(/\s*<fecha_publicacion>[^<]*<\/fecha_publicacion>/, '');
}

const NO_ARTICLES = `<?xml version="1.0" encoding="UTF-8"?>
<documento>
  <metadatos>
    <fecha_publicacion>2010/10/25</fecha_publicacion>
  </metadatos>
  <texto>Texto sin artículos reconocibles.</texto>
</documento>`;

function syncInput(adapters: readonly ReturnType<typeof createBocmAdapter>[]) {
  return {
    adapters,
    previous: null,
    generatedAt: '2026-03-18T08:00:00Z',
    taxYear: 2025,
    norms: [REGIONAL],
  };
}

describe('AC-004-21 a regional adapter reads its bulletin fixture offline', () => {
  it('AC-004-21: the bulletin date and the passages come from the injected document', async () => {
    const { fetchImpl, state } = fixtureFetch(BOCM_FIXTURE);
    const adapter = createBocmAdapter({ fetchImpl });

    expect(await adapter.getLastUpdated(REGIONAL)).toEqual({ ok: true, updatedAt: '2010-10-25' });

    const document = await adapter.fetchDocument(REGIONAL);
    expect(document.ok).toBe(true);
    if (!document.ok) return;

    const parsed = adapter.parse(document.document, {
      norm: REGIONAL,
      updatedAt: '2010-10-25',
      fetchedAt: '2026-03-18T08:00:00Z',
    });
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.passages.length).toBeGreaterThan(0);
    for (const passage of parsed.passages) {
      expect(passage.publisher).toBe('bocm');
      expect(passage.jurisdiction).toBe('madrid');
      expect(passage.updatedAt).toBe('2010-10-25');
    }
    expect(state.urls).toEqual([REGIONAL.sourceUrl, REGIONAL.sourceUrl]);
  });

  it('AC-004-21: the date normalizer never guesses', () => {
    expect(normalizeBulletinDate('2010/10/25')).toBe('2010-10-25');
    expect(normalizeBulletinDate('2010-10-25')).toBe('2010-10-25');
    expect(normalizeBulletinDate('25/10/2010')).toBeUndefined();
    expect(normalizeBulletinDate('')).toBeUndefined();
    expect(readBocmPublicationDate(undatedFixture())).toBeUndefined();
  });
});

describe('AC-004-22 incremental sync is keyed on the source own update date', () => {
  it('AC-004-22: the second run reuses the regional norm untouched', async () => {
    const firstFetch = fixtureFetch(BOCM_FIXTURE);
    const first = await runCorpusSync(syncInput([createBocmAdapter({ fetchImpl: firstFetch.fetchImpl })]));
    if (!first.ok) throw new Error(`first sync failed: ${first.normId} ${first.detail}`);
    expect(first.fetchedNormIds).toEqual([REGIONAL.normId]);

    const secondFetch = fixtureFetch(BOCM_FIXTURE);
    const second = await runCorpusSync({
      ...syncInput([createBocmAdapter({ fetchImpl: secondFetch.fetchImpl })]),
      previous: first.artifact,
    });
    if (!second.ok) throw new Error('second sync failed');

    expect(second.reusedNormIds).toEqual([REGIONAL.normId]);
    expect(second.artifact.passages).toEqual(first.artifact.passages);
    expect(second.artifact.norms[0]?.fetchedAt).toBe(first.artifact.norms[0]?.fetchedAt);
    // Metadata is read every run; the document is only read when the date moved.
    expect(secondFetch.state.count).toBe(1);
  });
});

describe('AC-004-23 an unreadable regional source fails closed', () => {
  it('AC-004-23: the sync names the norm as fetch_failed', async () => {
    const { fetchImpl } = fixtureFetch('error', 500);
    const result = await runCorpusSync(syncInput([createBocmAdapter({ fetchImpl })]));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBe('fetch_failed');
    expect(result.normId).toBe(REGIONAL.normId);
  });

  it('AC-004-23: the CLI exits non-zero and writes nothing', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'corpus-004-'));
    try {
      const path = join(dir, 'corpus.json');
      const fetcher = fixtureFetcher();
      const write = (contents: string): void => writeFileSync(path, contents, 'utf8');
      const runCli = async (): Promise<number> =>
        runCorpusSyncCli({
          adapters: [fakeBoeAdapter(fetcher)],
          artifactPath: path,
          taxYear: 2025,
          now: () => new Date('2026-03-18T08:00:00Z'),
          readFile: (input) => (existsSync(input) ? readFileSync(input, 'utf8') : null),
          writeFile: write,
          stdout: () => undefined,
          stderr: () => undefined,
        });

      expect(await runCli()).toBe(0);
      const before = readFileSync(path, 'utf8');

      // A newer date makes the sync re-fetch the pilot document, which is now broken.
      fetcher.replaceDocument('BOCM-m-2010-90068', 'not xml', '2026-09-01');
      expect(await runCli()).toBe(1);
      expect(readFileSync(path, 'utf8')).toBe(before);
      expect(existsSync(repoPath('corpus/corpus.json'))).toBe(true);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('AC-004-24 an undated regional source fails closed', () => {
  it('AC-004-24: no date means fetch_failed, never a guessed date', async () => {
    const { fetchImpl } = fixtureFetch(undatedFixture());
    const result = await runCorpusSync(syncInput([createBocmAdapter({ fetchImpl })]));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBe('fetch_failed');
    expect(result.normId).toBe(REGIONAL.normId);
    expect(result.detail).toContain('fecha_publicacion missing');
  });

  it('AC-004-24: syncNorm does not substitute the norm recorded date', async () => {
    const { fetchImpl } = fixtureFetch(undatedFixture());
    const result = await syncNorm({
      ...REGIONAL,
      updatedAt: '2026-03-17',
    }, syncInput([createBocmAdapter({ fetchImpl })]));
    expect(result.ok).toBe(false);
  });
});

describe('AC-004-25 zero passages fails instead of shrinking the corpus', () => {
  it('AC-004-25: parse_failed with detail no_passages', async () => {
    const { fetchImpl } = fixtureFetch(NO_ARTICLES);
    const result = await runCorpusSync(syncInput([createBocmAdapter({ fetchImpl })]));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBe('parse_failed');
    expect(result.detail).toBe('no_passages');
  });
});
