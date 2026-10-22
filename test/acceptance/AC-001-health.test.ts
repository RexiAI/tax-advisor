import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createHealthHandler } from '@/server/health-route';

import { FakeCorpusFetcher } from '../support/fake-fetcher';
import {
  configureLlmEnv,
  fixtureCorpusProvider,
  makeDeps,
  readFixture,
  setEnv,
} from '../support/harness';

beforeEach(() => {
  configureLlmEnv();
});

describe('AC-001-71 healthy when configuration and corpus are present', () => {
  it('AC-001-71: a complete configuration and a loaded corpus answer 200 with ok checks', async () => {
    const health = createHealthHandler(makeDeps());
    const response = await health();

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/json');
    expect(await response.json()).toEqual({
      status: 'ok',
      checks: { llmConfig: 'ok', corpusIndex: 'ok' },
    });
  });
});

describe('AC-001-72 a missing LLM variable degrades only its own check', () => {
  it('AC-001-72: an unset model is 503 with llmConfig error and corpusIndex ok', async () => {
    setEnv({ LLM_MODEL: undefined });
    const health = createHealthHandler(makeDeps());

    const response = await health();
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      status: 'error',
      checks: { llmConfig: 'error', corpusIndex: 'ok' },
    });
  });
});

describe('AC-001-73 a missing or empty corpus degrades the corpus check', () => {
  it('AC-001-73: absent, empty and unparsable corpora each fail only the corpus check', async () => {
    const errors = ['missing', 'empty', 'unparsable'] as const;

    for (const error of errors) {
      const health = createHealthHandler(makeDeps({ loadCorpus: () => ({ ok: false, error }) }));
      const response = await health();
      expect(response.status).toBe(503);
      expect(await response.json()).toEqual({
        status: 'error',
        checks: { llmConfig: 'ok', corpusIndex: 'error' },
      });
    }
  });
});

describe('AC-001-74 health never leaks a secret and never calls out', () => {
  it('AC-001-74: no key, no passage text, and no adapter or fetcher activity', async () => {
    setEnv({ LLM_API_KEY: 'k-test-secret' });
    const createAdapter = vi.fn();
    const fetcher = new FakeCorpusFetcher({
      'BOE-A-2006-20764': {
        xml: readFixture('boe', 'ley-35-2006.xml'),
        fechaActualizacion: '2026-03-17',
      },
    });
    const corpus = fixtureCorpusProvider();
    const health = createHealthHandler(makeDeps({ loadCorpus: () => corpus, createAdapter }));

    const raw = await (await health()).text();

    expect(raw).not.toContain('k-test-secret');
    for (const passage of corpus.ok ? corpus.corpus.artifact.passages : []) {
      expect(raw).not.toContain(passage.text.slice(0, 40));
    }
    expect(createAdapter).not.toHaveBeenCalled();
    expect(fetcher.fetchCount).toBe(0);
    expect(fetcher.metadataCount).toBe(0);
  });
});
