import { describe, expect, it } from 'vitest';

import { formatSpanishDate } from '@/content/format';
import { runCorpusSync } from '@/corpus/sync';
import { ALLOWED_NORMS } from '@/domain/allowed-norms';

import { FakeCorpusFetcher } from '../support/fake-fetcher';
import { fixtureFetcher, fixtureMeta } from '../support/harness';

describe('formatSpanishDate', () => {
  it('formats an ISO date in Spanish', () => {
    expect(formatSpanishDate('2026-03-17')).toBe('17 de marzo de 2026');
  });

  it('ignores the time part of a UTC timestamp', () => {
    expect(formatSpanishDate('2026-03-18T23:30:00Z')).toBe('18 de marzo de 2026');
  });

  it('returns the input unchanged when it is not a date', () => {
    expect(formatSpanishDate('sin fecha')).toBe('sin fecha');
  });
});

function fetcherWith(xmlByNorm: Record<string, string>): FakeCorpusFetcher {
  const fetcher = fixtureFetcher();
  for (const [normId, xml] of Object.entries(xmlByNorm)) {
    fetcher.replaceXml(normId, xml, fixtureMetaFor(normId).boeUpdatedAt);
  }
  return fetcher;
}

function fixtureMetaFor(normId: string) {
  const meta = fixtureMeta().find((candidate) => candidate.normId === normId);
  if (meta === undefined) throw new Error(`no fixture for ${normId}`);
  return meta;
}

/** Serves nothing: every norm fails the metadata read. */
function emptyFetcher(): FakeCorpusFetcher {
  return new FakeCorpusFetcher({});
}

describe('runCorpusSync guards', () => {
  it('fails when every block of a norm is skipped, so the corpus cannot shrink silently', async () => {
    const empty =
      '<documento><texto><bloque id="x" tipo="preambulo" titulo="Preámbulo"><version><p>T</p></version></bloque></texto></documento>';
    const result = await runCorpusSync({
      fetcher: fetcherWith({ 'BOE-A-2006-20764': empty }),
      previous: null,
      generatedAt: '2026-03-18T08:00:00Z',
      taxYear: 2025,
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBe('parse_failed');
    expect(result.detail).toBe('no_passages');
  });

  it('fails when the fetcher cannot serve a document', async () => {
    const fetcher = emptyFetcher();
    const result = await runCorpusSync({
      fetcher,
      previous: null,
      generatedAt: '2026-03-18T08:00:00Z',
      taxYear: 2025,
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBe('fetch_failed');
    expect(result.detail).toContain('unknown norm');
  });

  it('refuses to reuse an artifact whose recorded update date is not the BOE date', async () => {
    const fetcher = fetcherWith({});
    const first = await runCorpusSync({
      fetcher,
      previous: null,
      generatedAt: '2026-03-18T08:00:00Z',
      taxYear: 2025,
    });
    if (!first.ok) throw new Error('first sync failed');

    const stale = {
      ...first.artifact,
      norms: first.artifact.norms.map((norm) => ({ ...norm, boeUpdatedAt: '2025-01-01' })),
    };
    const second = await runCorpusSync({
      fetcher,
      previous: stale,
      generatedAt: '2026-03-19T08:00:00Z',
      taxYear: 2025,
    });

    expect(second.ok).toBe(true);
    if (!second.ok) return;
    expect(second.fetchedNormIds).toEqual(ALLOWED_NORMS.map((norm) => norm.normId));
  });
});
