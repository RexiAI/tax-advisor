import { describe, expect, it } from 'vitest';

import { createBoeAdapter } from '@/corpus/boe-adapter';
import type { FakeCorpusFetcher } from '../support/fake-fetcher';
import { FakeCorpusFetcher as FakeFetcher } from '../support/fake-fetcher';
import { boeSourceUrl, parseConsolidatedXml } from '@/corpus/parse-consolidated-xml';
import type { SourceAdapter } from '@/corpus/source-adapter';
import { runCorpusSync } from '@/corpus/sync';
import { findAllowedNorm, type AllowedNorm } from '@/domain/allowed-norms';

import { fixtureFetcher, readFixture } from '../support/harness';

const MADRID = findAllowedNorm('BOCM-m-2010-90068') as AllowedNorm;

function boeOnlyFetcher(): FakeCorpusFetcher {
  return new FakeFetcher({
    [MADRID.normId]: {
      document: readFixture('boe', 'bocm-m-2010-90068.xml'),
      updatedAt: MADRID.updatedAt,
    },
  });
}

function spyAdapter(publisher: SourceAdapter['publisher']): SourceAdapter & { calls: number } {
  const adapter = {
    publisher,
    calls: 0,
    async getLastUpdated() {
      adapter.calls += 1;
      return { ok: false as const, error: 'spy adapter must not be used' };
    },
    async fetchDocument() {
      adapter.calls += 1;
      return { ok: false as const, error: 'spy adapter must not be used' };
    },
    sourceUrl: (norm: AllowedNorm) => norm.sourceUrl,
    parse() {
      adapter.calls += 1;
      return { ok: false as const, error: 'unparsable' as const };
    },
  };
  return adapter;
}

describe('AC-004-17 the adapter interface exposes date, document, URL and parse', () => {
  it('AC-004-17: the BOE adapter implements the whole contract', () => {
    const adapter = createBoeAdapter({ fetcher: boeOnlyFetcher() });
    expect(adapter.publisher).toBe('boe');
    expect(typeof adapter.getLastUpdated).toBe('function');
    expect(typeof adapter.fetchDocument).toBe('function');
    expect(typeof adapter.sourceUrl).toBe('function');
    expect(typeof adapter.parse).toBe('function');
    expect(adapter.sourceUrl(MADRID)).toBe(boeSourceUrl(MADRID.normId));
  });
});

describe('AC-004-18 the BOE adapter keeps the old behaviour', () => {
  it('AC-004-18: the same update date, passages and source URL', async () => {
    const fetcher = boeOnlyFetcher();
    const adapter = createBoeAdapter({ fetcher });

    expect(await adapter.getLastUpdated(MADRID)).toEqual({
      ok: true,
      updatedAt: MADRID.updatedAt,
    });

    const document = await adapter.fetchDocument(MADRID);
    expect(document.ok).toBe(true);
    if (!document.ok) return;

    const parsed = adapter.parse(document.document, {
      norm: MADRID,
      updatedAt: MADRID.updatedAt,
      fetchedAt: '2026-03-18T08:00:00Z',
    });
    const direct = parseConsolidatedXml(document.document, {
      normId: MADRID.normId,
      normTitle: MADRID.normTitle,
      updatedAt: MADRID.updatedAt,
      fetchedAt: '2026-03-18T08:00:00Z',
    });
    expect(parsed).toEqual(direct);

    expect(boeSourceUrl('BOE-A-2006-20764')).toBe(
      'https://www.boe.es/buscar/act.php?id=BOE-A-2006-20764'
    );
  });
});

describe('AC-004-19 the sync dispatches each norm to its authority adapter', () => {
  it('AC-004-19: a bocm-published norm whose text came from the BOE uses the BOE adapter', async () => {
    const fetcher = boeOnlyFetcher();
    const bocmSpy = spyAdapter('bocm');

    const result = await runCorpusSync({
      adapters: [createBoeAdapter({ fetcher }), bocmSpy],
      previous: null,
      generatedAt: '2026-03-18T08:00:00Z',
      taxYear: 2025,
      norms: [MADRID],
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(fetcher.fetchedNormIds).toEqual([MADRID.normId]);
    expect(bocmSpy.calls).toBe(0);
    expect(result.artifact.norms[0]?.publisher).toBe('bocm');
    expect(result.artifact.norms[0]?.authorityUsed).toBe('boe');
  });
});

describe('AC-004-20 the adapter-driven sync stays incremental and idempotent', () => {
  it('AC-004-20: the second run fetches nothing and produces the same bytes', async () => {
    const firstFetcher = fixtureFetcher();
    const first = await runCorpusSync({
      adapters: [createBoeAdapter({ fetcher: firstFetcher })],
      previous: null,
      generatedAt: '2026-03-18T08:00:00Z',
      taxYear: 2025,
    });
    if (!first.ok) throw new Error('first sync failed');

    const secondFetcher = fixtureFetcher();
    const second = await runCorpusSync({
      adapters: [createBoeAdapter({ fetcher: secondFetcher })],
      previous: first.artifact,
      generatedAt: '2026-04-01T10:00:00Z',
      taxYear: 2025,
    });
    if (!second.ok) throw new Error('second sync failed');

    expect(secondFetcher.fetchCount).toBe(0);
    expect(JSON.stringify(second.artifact.passages)).toBe(
      JSON.stringify(first.artifact.passages)
    );
    expect(second.artifact.contentHash).toBe(first.artifact.contentHash);
  });
});
