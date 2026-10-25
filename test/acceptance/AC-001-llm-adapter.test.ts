import { readFileSync, readdirSync } from 'node:fs';

import { describe, expect, it, vi } from 'vitest';

import type { Config } from '@/config/env';
import { OpenAiCompatibleAdapter, mapStatusToError } from '@/llm/openai-compatible';
import type { LlmRequest, LlmStreamEvent } from '@/llm/types';
import { answerQuestion } from '@/service/answer-question';
import { createConversationStore } from '@/service/conversation-store';
import { createTurnTelemetry } from '@/service/types';
import { createChatRouteHandler } from '@/server/chat-route';

import { FakeLlmAdapter } from '../support/fake-llm-adapter';
import {
  hangingResponse,
  recordingFetch,
  sseChunk,
  sseResponse,
  sseUsage,
  upstreamError,
} from '../support/fake-upstream';
import { configureLlmEnv, fixtureCorpus, makeDeps, repoPath, testConfig } from '../support/harness';

const REQUEST: LlmRequest = {
  system: 'policy',
  messages: [{ role: 'user', content: '¿Puedo deducirme el alquiler?' }],
};

function config(overrides: Partial<Config> = {}): Config {
  return testConfig(overrides);
}

async function collect(stream: AsyncIterable<LlmStreamEvent>): Promise<LlmStreamEvent[]> {
  const events: LlmStreamEvent[] = [];
  for await (const event of stream) events.push(event);
  return events;
}

describe('AC-001-31 the request is built entirely from configuration', () => {
  it('AC-001-31: URL, bearer token and model come from config and no literal is hard-coded', async () => {
    const { fetchImpl, calls } = recordingFetch(
      sseResponse([sseChunk('Hola.'), 'data: [DONE]\n\n'])
    );
    const adapter = new OpenAiCompatibleAdapter(config(), { fetchImpl });

    await adapter.completeAll(REQUEST);

    expect(calls).toHaveLength(1);
    expect(calls[0]!.url).toBe('https://llm.example.test/v1/chat/completions');
    const headers = calls[0]!.init.headers as Record<string, string>;
    expect(headers.authorization).toBe('Bearer k-test');
    const body = JSON.parse(String(calls[0]!.init.body)) as {
      model: string;
      stream_options?: { include_usage?: boolean };
    };
    expect(body.model).toBe('m-test');
    expect(body.stream_options).toEqual({ include_usage: true });
    expect((body as { thinking?: unknown }).thinking).toBeUndefined();

    const moduleSource = readFileSync(repoPath('src/llm/openai-compatible.ts'), 'utf8');
    for (const literal of ['llm.example.test', 'k-test', 'm-test', 'api.openai.com']) {
      expect(moduleSource).not.toContain(literal);
    }
  });

  it('AC-001-31: reasoning can be disabled through configuration', async () => {
    const { fetchImpl, calls } = recordingFetch(
      sseResponse([sseChunk('Hola.'), 'data: [DONE]\n\n'])
    );
    const adapter = new OpenAiCompatibleAdapter(config({ llmDisableReasoning: true }), {
      fetchImpl,
    });

    await adapter.completeAll(REQUEST);

    const body = JSON.parse(String(calls[0]!.init.body)) as { thinking?: unknown };
    expect(body.thinking).toEqual({ type: 'disabled' });
  });
});

describe('AC-001-32 deltas stream in order and concatenate to the full answer', () => {
  it('AC-001-32: three SSE deltas arrive in order and completeAll joins them', async () => {
    const parts = ['El ', 'límite ', 'es 1.000 €.'];
    const { fetchImpl } = recordingFetch(
      sseResponse([
        sseChunk('El '),
        sseChunk('límite '),
        sseChunk('es 1.000 €.'),
        'data: [DONE]\n\n',
      ])
    );
    const adapter = new OpenAiCompatibleAdapter(config(), { fetchImpl });

    const events = await collect(adapter.complete(REQUEST));
    const deltas = events.filter((event) => event.type === 'delta');
    expect(deltas.map((event) => (event.type === 'delta' ? event.text : ''))).toEqual(parts);

    const result = await new OpenAiCompatibleAdapter(config(), {
      fetchImpl: recordingFetch(
        sseResponse([
          sseChunk('El '),
          sseChunk('límite '),
          sseChunk('es 1.000 €.'),
          'data: [DONE]\n\n',
        ])
      ).fetchImpl,
    }).completeAll(REQUEST);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.text).toBe('El límite es 1.000 €.');
  });

  it('AC-001-32: usage chunks are surfaced as a usage event', async () => {
    const { fetchImpl } = recordingFetch(
      sseResponse([sseChunk('Hola.'), sseUsage(11, 7), 'data: [DONE]\n\n'])
    );
    const result = await new OpenAiCompatibleAdapter(config(), { fetchImpl }).completeAll(REQUEST);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.usage).toEqual({ promptTokens: 11, completionTokens: 7 });
  });

  it('AC-001-32: a null usage field on every chunk is not a malformed response', async () => {
    const chunk = (text: string): string =>
      `data: ${JSON.stringify({
        choices: [{ delta: { content: text } }],
        usage: null,
      })}\n\n`;
    const { fetchImpl } = recordingFetch(
      sseResponse([chunk('Hola'), chunk('.'), 'data: [DONE]\n\n'])
    );
    const result = await new OpenAiCompatibleAdapter(config(), { fetchImpl }).completeAll(REQUEST);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.text).toBe('Hola.');
  });
});

describe('AC-001-33 exceeding the timeout returns a timeout error value', () => {
  it('AC-001-33: a silent upstream resolves to timeout and the signal reaches fetch', async () => {
    let receivedSignal: AbortSignal | null | undefined;

    const fetchImpl = ((input: RequestInfo | URL, init?: RequestInit) => {
      receivedSignal = init?.signal;
      return Promise.resolve(hangingResponse(init?.signal));
    }) as typeof fetch;

    const adapter = new OpenAiCompatibleAdapter(config({ llmTimeoutMs: 50 }), { fetchImpl });
    const result = await adapter.completeAll(REQUEST);

    expect(result).toEqual({ ok: false, error: 'timeout' });
    expect(receivedSignal).toBeInstanceOf(AbortSignal);
    expect(receivedSignal?.aborted).toBe(true);
  });
});

describe('AC-001-34 upstream status codes map to a closed error set', () => {
  it('AC-001-34: 401/403/429/500 and a non-JSON 200 map to the documented codes', async () => {
    const cases: [Response, string][] = [
      [upstreamError(401, 'nope'), 'unauthorized'],
      [upstreamError(403, 'nope'), 'unauthorized'],
      [upstreamError(429, 'slow down'), 'rate_limited'],
      [upstreamError(500, 'boom'), 'upstream_error'],
      [new Response('not json', { status: 200 }), 'malformed_response'],
    ];

    for (const [response, expected] of cases) {
      const adapter = new OpenAiCompatibleAdapter(config(), {
        fetchImpl: recordingFetch(response).fetchImpl,
      });
      const result = await adapter.completeAll(REQUEST);
      expect(result).toEqual({ ok: false, error: expected });
    }
  });

  it('AC-001-34: no status yields any code outside the closed set', () => {
    const allowed = new Set([
      'timeout',
      'unauthorized',
      'rate_limited',
      'upstream_error',
      'malformed_response',
    ]);
    for (let status = 100; status <= 599; status += 1) {
      expect(allowed.has(mapStatusToError(status))).toBe(true);
    }
  });
});

describe('AC-001-35 the upstream error body never reaches our client', () => {
  it('AC-001-35: a 401 body echo is replaced by a fixed Spanish message', async () => {
    const upstreamBody = 'upstream-secret-body-marker Bearer k-test';
    const { fetchImpl } = recordingFetch(upstreamError(401, upstreamBody));
    const handler = createChatRouteHandler(
      makeDeps({
        createAdapter: (runtimeConfig: Config) =>
          new OpenAiCompatibleAdapter(runtimeConfig, { fetchImpl }),
      })
    );

    configureLlmEnv();

    const response = await handler(
      new Request('http://localhost/api/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify({ message: '¿Puedo deducirme el alquiler?' }),
      })
    );

    expect(response.status).toBe(502);
    const raw = await response.text();
    expect(raw).not.toContain('upstream-secret-body-marker');
    expect(raw).not.toContain('k-test');
    const body = JSON.parse(raw) as { errorCode: string; message: string };
    expect(body.errorCode).toBe('llm_unauthorized');
    expect(body.message).toBe(
      'No hemos podido contactar con el servicio de respuestas. Vuelve a intentarlo más tarde.'
    );
  });
});

describe('AC-001-36 the adapter is injected, never constructed inside the service', () => {
  it('AC-001-36: a fake adapter receives exactly one request and the service imports no adapter', async () => {
    const adapter = new FakeLlmAdapter({ deltas: ['Sin cita suficiente.'] });
    const outcome = await answerQuestion(
      { message: '¿Puedo deducirme el alquiler de mi vivienda habitual?' },
      {
        index: fixtureCorpus().index,
        adapter,
        config: { minRetrievalScore: 0.01, retrievalTopK: 5, corpusTaxYear: 2025 },
        conversations: createConversationStore(),
        telemetry: createTurnTelemetry(),
        now: () => 1,
      }
    );

    expect(adapter.callCount).toBe(1);
    expect(outcome.kind).toBe('insufficient_evidence');

    const serviceDir = repoPath('src/service');
    for (const file of readdirSync(serviceDir)) {
      const source = readFileSync(`${serviceDir}/${file}`, 'utf8');
      expect(source).not.toContain('openai-compatible');
      expect(source).not.toContain('OpenAiCompatibleAdapter');
    }
  });
});

describe('adapter unit behaviour', () => {
  it('an external abort is forwarded to fetch', async () => {
    const controller = new AbortController();
    const fetchImpl = ((input: RequestInfo | URL, init?: RequestInit) => {
      setTimeout(() => controller.abort(), 5);
      return Promise.resolve(hangingResponse(init?.signal));
    }) as typeof fetch;

    const adapter = new OpenAiCompatibleAdapter(config({ llmTimeoutMs: 5000 }), { fetchImpl });
    const result = await adapter.completeAll(REQUEST, { signal: controller.signal });
    expect(result).toEqual({ ok: false, error: 'timeout' });
  });

  it('a transport failure maps to upstream_error', async () => {
    const fetchImpl = vi.fn(() =>
      Promise.reject(new Error('ECONNREFUSED'))
    ) as unknown as typeof fetch;
    const result = await new OpenAiCompatibleAdapter(config(), { fetchImpl }).completeAll(REQUEST);
    expect(result).toEqual({ ok: false, error: 'upstream_error' });
  });
});
