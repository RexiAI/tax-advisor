import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { search } from '@/retrieval/index';
import { createChatRouteHandler } from '@/server/chat-route';

import { FakeLlmAdapter } from '../support/fake-llm-adapter';
import { OFFLINE_FETCH_MESSAGE, offlineFetchState } from '../support/offline-fetch';
import {
  configureLlmEnv,
  fixtureCorpus,
  jsonChatRequest,
  makeDeps,
  repoPath,
  sequentialRequestIds,
} from '../support/harness';

const QUERY = '¿Puedo deducirme el alquiler de mi vivienda habitual?';

// Captured before any test in this file configures the fake model: the suite
// must start with no LLM credentials in the environment.
const llmKeyAtSuiteStart = process.env.LLM_API_KEY;

function retrievedIds(): string[] {
  return search(fixtureCorpus().index, QUERY).map((result) => result.passage.passageId);
}

function testFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...testFiles(full));
    else if (/\.(ts|tsx)$/.test(entry)) out.push(full);
  }
  return out;
}

describe('AC-001-82 the suite cannot reach the network', () => {
  it('AC-001-82: the global fetch throws with the offline test policy', async () => {
    await expect(globalThis.fetch('https://example.test/')).rejects.toThrow(OFFLINE_FETCH_MESSAGE);
    expect(offlineFetchState.attempts).toEqual(['https://example.test/']);
  });

  it('AC-001-82: a full turn performs no HTTP request', async () => {
    configureLlmEnv();
    const id = retrievedIds()[0]!;
    const handler = createChatRouteHandler(
      makeDeps({
        adapter: new FakeLlmAdapter({ deltas: [`Respuesta [^p:${id}].`] }),
        newRequestId: sequentialRequestIds(),
      })
    );

    await (await handler(jsonChatRequest({ message: QUERY }))).text();

    expect(offlineFetchState.attempts).toEqual([]);
  });
});

describe('AC-001-83 BOE parsing and sync use committed fixtures', () => {
  it('AC-001-83: the fixtures exist and reproduce the bloque/version shape', () => {
    const dir = repoPath('test/fixtures/boe');
    const files = readdirSync(dir).filter((file) => file.endsWith('.xml'));
    expect(files).toContain('ley-35-2006.xml');
    expect(files).toContain('rd-439-2007.xml');

    for (const file of ['ley-35-2006.xml', 'rd-439-2007.xml']) {
      const xml = readFileSync(join(dir, file), 'utf8');
      expect(xml).toContain('<bloque');
      expect(xml).toContain('<version');
    }
  });

  it('AC-001-83: the sync test injects a fake fetcher and no test fetches from BOE', () => {
    const syncTest = readFileSync(repoPath('test/acceptance/AC-001-corpus-sync.test.ts'), 'utf8');
    expect(syncTest).toContain('FakeCorpusFetcher');

    for (const file of testFiles(repoPath('test'))) {
      const source = readFileSync(file, 'utf8');
      expect(source).not.toMatch(/fetch\([^)]*boe\.es/);
      expect(source).not.toMatch(/fetchImpl[^;]*boe\.es/);
    }
  });
});

describe('AC-001-84 end-to-end: ask, retrieve, answer with a validation-passing citation', () => {
  it('AC-001-84: the answer cites a retrieved passage and the log records a passing validation', async () => {
    configureLlmEnv();
    const ids = retrievedIds();
    const cited = ids[0]!;
    const logs: string[] = [];
    const handler = createChatRouteHandler(
      makeDeps({
        logs,
        adapter: new FakeLlmAdapter({
          deltas: [`Sí, con los límites del texto consolidado [^p:${cited}].`],
        }),
        newRequestId: sequentialRequestIds(),
      })
    );

    const response = await handler(jsonChatRequest({ message: QUERY }));
    const body = (await response.json()) as {
      kind: string;
      citations: { passageId: string }[];
    };

    expect(body.kind).toBe('answer');
    expect(body.citations.length).toBeGreaterThan(0);
    expect(ids).toContain(body.citations[0]!.passageId);

    const record = JSON.parse(logs[0]!) as { citationValidation: string; status: string };
    expect(record.citationValidation).toBe('pass');
    expect(record.status).toBe('ok');
  });
});

describe('AC-001-85 end-to-end: an unretrieved citation abstains', () => {
  it('AC-001-85: an invented citation yields insufficient_evidence and a failing log', async () => {
    expect(llmKeyAtSuiteStart).toBeUndefined();
    configureLlmEnv();

    const ids = new Set(retrievedIds());
    const invented = 'BOE-A-2006-20764#zz99';
    expect(ids.has(invented)).toBe(false);

    const logs: string[] = [];
    const handler = createChatRouteHandler(
      makeDeps({
        logs,
        adapter: new FakeLlmAdapter({ deltas: [`Según la norma [^p:${invented}].`] }),
        newRequestId: sequentialRequestIds(),
      })
    );

    const response = await handler(jsonChatRequest({ message: QUERY }));
    const raw = await response.text();
    const body = JSON.parse(raw) as { kind: string; citations?: unknown };

    expect(body.kind).toBe('insufficient_evidence');
    expect(body.citations).toBeUndefined();
    expect(raw).not.toContain('zz99');

    const record = JSON.parse(logs[0]!) as { citationValidation: string };
    expect(record.citationValidation).toBe('fail');
  });
});
