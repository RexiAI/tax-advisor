import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { loadConfig } from '@/config/env';
import { createChatRouteHandler } from '@/server/chat-route';

import { offlineFetchState } from '../support/offline-fetch';
import { clearLlmEnv, makeDeps, repoPath, restoreEnv, setEnv } from '../support/harness';

const originalEnv = { ...process.env };

afterEach(() => {
  restoreEnv(originalEnv);
});

describe('AC-001-01 configuration resolves from the environment', () => {
  it('AC-001-01: loadConfig returns the three LLM values supplied through the environment', () => {
    clearLlmEnv();
    setEnv({
      LLM_BASE_URL: 'https://llm.example.test/v1',
      LLM_API_KEY: 'k-test',
      LLM_MODEL: 'm-test',
    });

    const result = loadConfig();

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.config.llmBaseUrl).toBe('https://llm.example.test/v1');
    expect(result.config.llmApiKey).toBe('k-test');
    expect(result.config.llmModel).toBe('m-test');
  });

  it('AC-001-01: no provider hostname, vendor name or model id is a literal under src/', () => {
    const forbidden = [
      'api.openai.com',
      'openai.azure.com',
      'api.anthropic.com',
      'generativelanguage.googleapis.com',
      'gpt-4',
      'gpt-3.5',
      'claude-3',
      'gemini-pro',
    ];
    const offenders: string[] = [];
    for (const file of walk(repoPath('src'))) {
      const contents = readFileSync(file, 'utf8');
      for (const needle of forbidden) {
        if (contents.includes(needle)) offenders.push(`${file}: ${needle}`);
      }
    }
    expect(offenders).toEqual([]);
  });
});

describe('AC-001-02 a missing API key fails closed', () => {
  it('AC-001-02: an unset API key is reported and only that variable is missing', () => {
    clearLlmEnv();
    setEnv({ LLM_BASE_URL: 'https://llm.example.test/v1', LLM_MODEL: 'm-test' });

    const result = loadConfig();

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBe('missing_llm_config');
    expect(result.missing).toEqual(['LLM_API_KEY']);
  });

  it('AC-001-02: the chat route answers 503 and never builds an adapter', async () => {
    clearLlmEnv();
    setEnv({ LLM_BASE_URL: 'https://llm.example.test/v1', LLM_MODEL: 'm-test' });
    const createAdapter = vi.fn();
    const handler = createChatRouteHandler(makeDeps({ createAdapter }));

    const response = await handler(
      new Request('http://localhost/api/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ message: '¿Puedo deducirme el alquiler?' }),
      })
    );

    expect(response.status).toBe(503);
    expect(response.headers.get('content-type')).toContain('application/json');
    expect(createAdapter).not.toHaveBeenCalled();
    const body = (await response.json()) as { message: string; errorCode: string };
    expect(body.errorCode).toBe('missing_llm_config');
    expect(body.message).toBe(
      'El servicio no está configurado en este momento. Vuelve a intentarlo más tarde.'
    );
  });
});

describe('AC-001-03 no default model or base URL is ever substituted', () => {
  it('AC-001-03: both unset LLM variables are named and nothing is called', async () => {
    clearLlmEnv();
    setEnv({ LLM_API_KEY: 'k-test' });
    const createAdapter = vi.fn();
    const handler = createChatRouteHandler(makeDeps({ createAdapter }));

    const response = await handler(
      new Request('http://localhost/api/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ message: '¿Puedo deducirme el alquiler?' }),
      })
    );

    expect(response.status).toBe(503);
    const body = (await response.json()) as {
      errorCode: string;
      missing: string[];
    };
    expect(body.errorCode).toBe('missing_llm_config');
    expect(body.missing).toEqual(['LLM_BASE_URL', 'LLM_MODEL']);
    expect(offlineFetchState.attempts).toEqual([]);
    expect(createAdapter).not.toHaveBeenCalled();
  });
});

describe('AC-001-04 bound values come from configuration', () => {
  it('AC-001-04: documented defaults apply when the overrides are unset', () => {
    setEnv({
      LLM_BASE_URL: 'https://llm.example.test/v1',
      LLM_API_KEY: 'k-test',
      LLM_MODEL: 'm-test',
      CORPUS_TAX_YEAR: '',
      MIN_RETRIEVAL_SCORE: '',
      RETRIEVAL_TOP_K: '',
      MAX_MESSAGE_CHARS: '',
      RATE_LIMIT_MAX: '',
      RATE_LIMIT_WINDOW_MS: '',
      LLM_TIMEOUT_MS: '',
    });

    const result = loadConfig();

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.config.maxMessageChars).toBe(2000);
    expect(result.config.rateLimitMax).toBe(20);
    expect(result.config.rateLimitWindowMs).toBe(600000);
    expect(result.config.llmTimeoutMs).toBe(60000);
    expect(result.config.corpusTaxYear).toBe(2025);
    expect(result.config.retrievalTopK).toBeGreaterThanOrEqual(1);
    expect(result.config.minRetrievalScore).toBeGreaterThan(0);
  });

  it('AC-001-04: every bound is overridable through its environment variable', () => {
    setEnv({
      LLM_BASE_URL: 'https://llm.example.test/v1',
      LLM_API_KEY: 'k-test',
      LLM_MODEL: 'm-test',
      CORPUS_TAX_YEAR: '2031',
      MIN_RETRIEVAL_SCORE: '0.42',
      RETRIEVAL_TOP_K: '9',
      MAX_MESSAGE_CHARS: '1500',
      RATE_LIMIT_MAX: '7',
      RATE_LIMIT_WINDOW_MS: '120000',
      LLM_TIMEOUT_MS: '15000',
    });

    const result = loadConfig();

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.config.corpusTaxYear).toBe(2031);
    expect(result.config.minRetrievalScore).toBeCloseTo(0.42, 10);
    expect(result.config.retrievalTopK).toBe(9);
    expect(result.config.maxMessageChars).toBe(1500);
    expect(result.config.rateLimitMax).toBe(7);
    expect(result.config.rateLimitWindowMs).toBe(120000);
    expect(result.config.llmTimeoutMs).toBe(15000);
  });
});

describe('AC-001-05 the environment example is committed and no secret is', () => {
  it('AC-001-05: the example lists every variable with an empty value and a comment', () => {
    const example = readFileSync(repoPath('.env.example'), 'utf8');
    for (const name of [
      'LLM_BASE_URL',
      'LLM_API_KEY',
      'LLM_MODEL',
      'CORPUS_TAX_YEAR',
      'MIN_RETRIEVAL_SCORE',
      'RETRIEVAL_TOP_K',
      'MAX_MESSAGE_CHARS',
      'RATE_LIMIT_MAX',
      'RATE_LIMIT_WINDOW_MS',
      'LLM_TIMEOUT_MS',
    ]) {
      expect(example).toContain(`${name}=\n`);
    }
    expect(example).toMatch(/^#.*$/m);
  });

  it('AC-001-05: no committed file carries a real key and the ignore rules are right', () => {
    // Source, scripts and the committed corpus are what ships; tests set
    // variables on purpose and are not part of the artifact.
    const trackedish = [
      ...walk(repoPath('src')),
      ...walk(repoPath('scripts')),
      ...walk(repoPath('corpus')),
      ...walk(repoPath('docs')),
      repoPath('.env.example'),
      repoPath('package.json'),
    ];
    const offenders = trackedish.filter((file) => {
      const match = /LLM_API_KEY=[ \t]*(\S+)/.exec(readFileSync(file, 'utf8'));
      if (match === null) return false;
      // Ignore shell indirection and short test placeholders; real provider keys
      // are long opaque strings.
      const value = match[1] ?? '';
      return value.length >= 20 && !value.startsWith('$') && !value.startsWith('<');
    });
    expect(offenders).toEqual([]);

    const ignore = readFileSync(repoPath('.gitignore'), 'utf8').split('\n');
    expect(ignore).toContain('.env');
    expect(ignore).toContain('.env.*');
    expect(ignore).toContain('*.local.env');
    expect(ignore).toContain('!.env.example');
  });
});

function walk(dir: string, skip: string[] = []): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    if (skip.includes(entry)) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      out.push(...walk(full, skip));
    } else if (/\.(ts|tsx|json|md|mjs|css)$/.test(entry)) {
      out.push(full);
    }
  }
  return out;
}
