/**
 * Shared test harness: a fixture corpus built from the committed fixture
 * documents, environment helpers, and the wiring used by the route tests.
 *
 * Everything here is offline: the fixture corpus is parsed from `test/fixtures/`
 * and the model is a fake.
 */

import { readFileSync } from 'node:fs';

import type { Config } from '@/config/env';
import { ALLOWED_NORMS } from '@/domain/allowed-norms';
import { coverageOf } from '@/domain/coverage';
import type { Passage } from '@/domain/passage';
import { CORPUS_SCHEMA_VERSION, contentHashOf } from '@/corpus/artifact';
import { parseConsolidatedXml } from '@/corpus/parse-consolidated-xml';
import type { SourceAdapter } from '@/corpus/source-adapter';
import { createDefaultDeps, type AppDeps } from '@/server/deps';
import type { LoadedCorpus, CorpusProviderResult } from '@/server/corpus-loader';
import { buildIndex } from '@/retrieval/index';

import { FakeCorpusFetcher, fakeBoeAdapter } from './fake-fetcher';
import { FakeLlmAdapter } from './fake-llm-adapter';
import { repoPath } from './paths';

export { REPO_ROOT, repoPath } from './paths';

export function readFixture(...parts: string[]): string {
  return readFileSync(repoPath('test/fixtures', ...parts), 'utf8');
}

const FIXTURE_META = [
  {
    file: ['boe', 'ley-35-2006.xml'],
    normId: 'BOE-A-2006-20764',
    updatedAt: '2026-10-07',
    fetchedAt: '2026-03-18T08:00:00Z',
  },
  {
    file: ['boe', 'rd-439-2007.xml'],
    normId: 'BOE-A-2007-6820',
    updatedAt: '2026-10-07',
    fetchedAt: '2026-03-18T08:00:00Z',
  },
  {
    file: ['boe', 'ley-58-2003.xml'],
    normId: 'BOE-A-2003-23186',
    updatedAt: '2026-10-09',
    fetchedAt: '2026-03-18T08:00:00Z',
  },
  {
    file: ['boe', 'rd-1065-2007.xml'],
    normId: 'BOE-A-2007-15984',
    updatedAt: '2026-10-09',
    fetchedAt: '2026-03-18T08:00:00Z',
  },
  {
    file: ['boe', 'rdleg-8-2015-lgss.xml'],
    normId: 'BOE-A-2015-11724',
    updatedAt: '2026-10-23',
    fetchedAt: '2026-03-18T08:00:00Z',
  },
  {
    file: ['boe', 'rd-84-1996.xml'],
    normId: 'BOE-A-1996-4447',
    updatedAt: '2026-07-30',
    fetchedAt: '2026-03-18T08:00:00Z',
  },
  {
    file: ['boe', 'ley-37-1992-iva.xml'],
    normId: 'BOE-A-1992-28740',
    updatedAt: '2026-10-07',
    fetchedAt: '2026-03-18T08:00:00Z',
  },
  {
    file: ['boe', 'rdleg-1175-1990-iae.xml'],
    normId: 'BOE-A-1990-23930',
    updatedAt: '2026-06-04',
    fetchedAt: '2026-03-18T08:00:00Z',
  },
  {
    file: ['boe', 'bocm-m-2010-90068.xml'],
    normId: 'BOCM-m-2010-90068',
    updatedAt: '2026-08-31',
    fetchedAt: '2026-03-18T08:00:00Z',
  },
  {
    file: ['boe', 'boe-a-2011-10542.xml'],
    normId: 'BOE-A-2011-10542',
    updatedAt: '2026-03-17',
    fetchedAt: '2026-03-18T08:00:00Z',
  },
] as const;

export type FixtureMeta = (typeof FIXTURE_META)[number];

/** The committed fixtures, one per covered norm, in registry order. */
export function fixtureMeta(): readonly FixtureMeta[] {
  return FIXTURE_META;
}

let cachedPassages: readonly Passage[] | null = null;

export function fixturePassages(): readonly Passage[] {
  if (cachedPassages !== null) return cachedPassages;

  const passages: Passage[] = [];
  for (const meta of FIXTURE_META) {
    const norm = ALLOWED_NORMS.find((candidate) => candidate.normId === meta.normId);
    const parsed = parseConsolidatedXml(readFixture(...meta.file), {
      normId: meta.normId,
      normTitle: norm?.normTitle ?? meta.normId,
      updatedAt: meta.updatedAt,
      fetchedAt: meta.fetchedAt,
    });
    if (!parsed.ok) throw new Error(`fixture ${meta.file.join('/')} did not parse`);
    passages.push(...parsed.passages);
  }

  cachedPassages = passages;
  return passages;
}

export function fixtureCorpus(): LoadedCorpus {
  const passages = fixturePassages();
  const built = buildIndex(passages);
  if (!built.ok) throw new Error('fixture corpus has duplicate passage ids');

  const norms = ALLOWED_NORMS.map((norm) => ({
    normId: norm.normId,
    normTitle: norm.normTitle,
    publisher: norm.publisher,
    jurisdiction: norm.jurisdiction,
    authorityUsed: norm.authorityUsed,
    officialId: norm.officialId,
    sourceUrl: norm.sourceUrl,
    updatedAt: FIXTURE_META.find((meta) => meta.normId === norm.normId)?.updatedAt ?? norm.updatedAt,
    fetchedAt: '2026-03-18T08:00:00Z',
    licenseNote: norm.licenseNote,
  }));
  const coverage = coverageOf(ALLOWED_NORMS);

  return {
    artifact: {
      schemaVersion: CORPUS_SCHEMA_VERSION,
      taxYear: 2025,
      generatedAt: '2026-03-18T08:00:00Z',
      contentHash: contentHashOf({ coverage, norms, passages }),
      coverage,
      norms,
      passages,
    },
    index: built.index,
  };
}

export function fixtureCorpusProvider(): CorpusProviderResult {
  return { ok: true, corpus: fixtureCorpus() };
}

/**
 * A fake BOE fetcher serving every committed fixture, keyed by its declared
 * metadata. `sync` tests use it so a sync over the whole registry never leaves
 * the fixtures.
 */
export function fixtureFetcher(): FakeCorpusFetcher {
  return new FakeCorpusFetcher(
    Object.fromEntries(
      FIXTURE_META.map((meta) => [
        meta.normId,
        { document: readFixture(...meta.file), updatedAt: meta.updatedAt },
      ])
    )
  );
}

/** The adapters the fixture registry needs: every authority in it is the BOE. */
export function fixtureAdapters(fetcher: FakeCorpusFetcher = fixtureFetcher()): readonly SourceAdapter[] {
  return [fakeBoeAdapter(fetcher)];
}

export function setEnv(values: Record<string, string | undefined>): void {
  for (const [key, value] of Object.entries(values)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
}

export function clearLlmEnv(): void {
  delete process.env.LLM_BASE_URL;
  delete process.env.LLM_API_KEY;
  delete process.env.LLM_MODEL;
}

export function restoreEnv(original: NodeJS.ProcessEnv): void {
  for (const key of Object.keys(process.env)) {
    if (!(key in original)) delete process.env[key];
  }
  for (const [key, value] of Object.entries(original)) {
    if (value !== undefined) process.env[key] = value;
  }
}

export function configureLlmEnv(): void {
  setEnv({
    LLM_BASE_URL: 'https://llm.example.test/v1',
    LLM_API_KEY: 'k-test',
    LLM_MODEL: 'm-test',
  });
}

let requestCounter = 0;

export function sequentialRequestIds(): () => string {
  return () => {
    requestCounter += 1;
    return `00000000-0000-4000-8000-${String(requestCounter).padStart(12, '0')}`;
  };
}

export interface HarnessOptions extends Partial<AppDeps> {
  readonly logs?: string[];
  readonly adapter?: FakeLlmAdapter;
}

/**
 * Production wiring with the model, corpus, clock and log sink pointed at test
 * doubles. The rate limiter is the real one, built from configuration, so its
 * limits come from the same place production reads them.
 */
export function makeDeps(overrides: HarnessOptions = {}): AppDeps {
  const { logs = [], adapter, ...rest } = overrides;
  const base = createDefaultDeps({
    loadCorpus: fixtureCorpusProvider,
    log: (line: string) => logs.push(line),
    newRequestId: sequentialRequestIds(),
    now: () => 1_000_000,
    ...(adapter === undefined ? {} : { createAdapter: () => adapter }),
    ...rest,
  });
  return base;
}

export function testConfig(overrides: Partial<Config> = {}): Config {
  return {
    llmBaseUrl: 'https://llm.example.test/v1',
    llmApiKey: 'k-test',
    llmModel: 'm-test',
    llmDisableReasoning: false,
    corpusTaxYear: 2025,
    minRetrievalScore: 0.01,
    retrievalTopK: 5,
    maxMessageChars: 2000,
    rateLimitMax: 20,
    rateLimitWindowMs: 600000,
    llmTimeoutMs: 60000,
    ...overrides,
  };
}

export function chatRequest(
  body: unknown,
  init: { headers?: Record<string, string> } = {}
): Request {
  return new Request('http://localhost/api/chat', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...(init.headers ?? {}) },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

export function jsonChatRequest(body: unknown, headers: Record<string, string> = {}): Request {
  return chatRequest(body, { headers: { accept: 'application/json', ...headers } });
}
