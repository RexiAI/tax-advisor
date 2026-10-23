import { afterEach, describe, expect, it } from 'vitest';

import { DEFAULT_BOUNDS, loadConfig, readBounds } from '@/config/env';

import { clearLlmEnv, restoreEnv, setEnv } from '../support/harness';

const originalEnv = { ...process.env };

afterEach(() => {
  restoreEnv(originalEnv);
});

describe('loadConfig', () => {
  it('treats a whitespace-only variable as missing', () => {
    clearLlmEnv();
    setEnv({ LLM_BASE_URL: '   ', LLM_API_KEY: 'k', LLM_MODEL: 'm' });
    const result = loadConfig();
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.missing).toEqual(['LLM_BASE_URL']);
  });

  it('trims surrounding whitespace from the values it accepts', () => {
    clearLlmEnv();
    setEnv({ LLM_BASE_URL: ' https://llm.example.test/v1 ', LLM_API_KEY: ' k ', LLM_MODEL: ' m ' });
    const result = loadConfig();
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.config.llmBaseUrl).toBe('https://llm.example.test/v1');
    expect(result.config.llmApiKey).toBe('k');
    expect(result.config.llmModel).toBe('m');
  });

  it('reports the missing variables in a stable order', () => {
    clearLlmEnv();
    const result = loadConfig();
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.missing).toEqual(['LLM_BASE_URL', 'LLM_API_KEY', 'LLM_MODEL']);
  });

  it('falls back to documented bounds when a numeric override is not a number', () => {
    clearLlmEnv();
    setEnv({
      LLM_BASE_URL: 'https://llm.example.test/v1',
      LLM_API_KEY: 'k',
      LLM_MODEL: 'm',
      RETRIEVAL_TOP_K: 'not-a-number',
    });
    const result = loadConfig();
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.config.retrievalTopK).toBe(DEFAULT_BOUNDS.retrievalTopK);
  });
});

describe('readBounds', () => {
  it('resolves without any LLM configuration', () => {
    clearLlmEnv();
    setEnv({ MAX_MESSAGE_CHARS: '123' });
    const bounds = readBounds();
    expect(bounds.maxMessageChars).toBe(123);
    expect(bounds.llmTimeoutMs).toBe(DEFAULT_BOUNDS.llmTimeoutMs);
  });

  it('accepts a fractional retrieval threshold', () => {
    setEnv({ MIN_RETRIEVAL_SCORE: '0.0375' });
    expect(readBounds().minRetrievalScore).toBeCloseTo(0.0375, 10);
    setEnv({ MIN_RETRIEVAL_SCORE: undefined });
  });
});
