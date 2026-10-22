import { readFileSync } from 'node:fs';

import { beforeEach, describe, expect, it } from 'vitest';

import { ERROR_MESSAGES, type ErrorCode } from '@/content/strings';
import type { Config } from '@/config/env';
import { mapStatusToError, OpenAiCompatibleAdapter } from '@/llm/openai-compatible';
import type { LlmErrorCode } from '@/llm/types';
import { search } from '@/retrieval/index';
import { createChatRouteHandler, resolveClientIp } from '@/server/chat-route';
import type { RateLimitDecision, RateLimiter } from '@/service/rate-limit';

import { FakeLlmAdapter, answerScript } from '../support/fake-llm-adapter';
import { recordingFetch, upstreamError } from '../support/fake-upstream';
import {
  chatRequest,
  configureLlmEnv,
  fixtureCorpus,
  jsonChatRequest,
  makeDeps,
  repoPath,
  sequentialRequestIds,
  setEnv,
  testConfig,
} from '../support/harness';

interface SseFrame {
  readonly event: string;
  readonly data: string;
}

function parseSse(raw: string): SseFrame[] {
  return raw
    .split('\n\n')
    .filter((block) => block.trim() !== '')
    .map((block) => {
      const lines = block.split('\n');
      const event =
        lines
          .find((line) => line.startsWith('event:'))
          ?.slice(6)
          .trim() ?? 'message';
      const data = lines
        .filter((line) => line.startsWith('data:'))
        .map((line) => line.slice(5).trim())
        .join('\n');
      return { event, data };
    });
}

const QUERY = '¿Puedo deducir el alquiler de mi vivienda habitual?';

function topPassageId(): string {
  const [top] = search(
    fixtureCorpus().index,
    '¿Puedo deducirme el alquiler de mi vivienda habitual?'
  );
  return top!.passage.passageId;
}

function citingAdapter(text = 'Respuesta con fuente'): FakeLlmAdapter {
  return new FakeLlmAdapter(answerScript(`${text} [^p:${topPassageId()}].`));
}

beforeEach(() => {
  configureLlmEnv();
});

describe('AC-001-65 the message length boundary is exact', () => {
  it('AC-001-65: 2000 characters pass through untouched and 2001 is rejected', async () => {
    const adapter = citingAdapter();
    const handler = createChatRouteHandler(
      makeDeps({ adapter, newRequestId: sequentialRequestIds() })
    );
    // A real query padded to exactly the cap, so retrieval still matches.
    const accepted = `${QUERY} ${'x'.repeat(2000)}`.slice(0, 2000);
    expect(accepted).toHaveLength(2000);

    const ok = await handler(jsonChatRequest({ message: accepted }));
    expect(ok.status).not.toBe(400);
    await ok.text();
    expect(adapter.callCount).toBe(1);
    const sent = adapter.requests[0]!.messages[0]!.content;
    expect(sent).toContain(accepted);

    const rejected = await handler(jsonChatRequest({ message: 'a'.repeat(2001) }));
    expect(rejected.status).toBe(400);
    const body = (await rejected.json()) as { errorCode: string; message: string };
    expect(body.errorCode).toBe('message_too_long');
    expect(body.message).toBe(ERROR_MESSAGES.message_too_long);
    expect(adapter.callCount).toBe(1);
  });
});

describe('AC-001-66 the 21st request in a window is rate limited', () => {
  it('AC-001-66: the limit holds per IP and resets when the window rolls over', async () => {
    let clock = 1_000_000;
    const handler = createChatRouteHandler(
      makeDeps({
        adapter: citingAdapter(),
        now: () => clock,
        newRequestId: sequentialRequestIds(),
      })
    );
    const ip = { 'x-forwarded-for': '198.51.100.4' };

    for (let index = 0; index < 20; index += 1) {
      const response = await handler(
        jsonChatRequest({ message: '¿Puedo deducir el alquiler?' }, ip)
      );
      expect(response.status).not.toBe(429);
      await response.text();
    }

    const limited = await handler(jsonChatRequest({ message: '¿Puedo deducir el alquiler?' }, ip));
    expect(limited.status).toBe(429);
    const retryAfter = Number(limited.headers.get('retry-after'));
    expect(Number.isInteger(retryAfter)).toBe(true);
    expect(retryAfter).toBeGreaterThan(0);
    const body = (await limited.json()) as { message: string; errorCode: string };
    expect(body.errorCode).toBe('rate_limited');
    expect(body.message).toBe(ERROR_MESSAGES.rate_limited);

    const otherIp = await handler(
      jsonChatRequest(
        { message: '¿Puedo deducir el alquiler?' },
        { 'x-forwarded-for': '198.51.100.5' }
      )
    );
    expect(otherIp.status).not.toBe(429);
    await otherIp.text();

    clock += 600_000;
    const afterWindow = await handler(
      jsonChatRequest({ message: '¿Puedo deducir el alquiler?' }, ip)
    );
    expect(afterWindow.status).not.toBe(429);
    await afterWindow.text();
  });
});

describe('AC-001-67 client IP resolution is explicit', () => {
  it('AC-001-67: leftmost forwarded entry wins, the socket address is the fallback', async () => {
    const keys: string[] = [];
    const spy: RateLimiter = {
      check(key: string): RateLimitDecision {
        keys.push(key);
        return { allowed: true, retryAfterSeconds: 0 };
      },
    };
    const handler = createChatRouteHandler(
      makeDeps({
        adapter: citingAdapter(),
        rateLimiter: spy,
        socketAddress: () => '10.1.2.3',
        newRequestId: sequentialRequestIds(),
      })
    );

    await (
      await handler(
        jsonChatRequest(
          { message: '¿Puedo deducir el alquiler?' },
          { 'x-forwarded-for': '203.0.113.7, 10.0.0.1' }
        )
      )
    ).text();
    await (await handler(jsonChatRequest({ message: '¿Puedo deducir el alquiler?' }))).text();

    expect(keys).toEqual(['203.0.113.7', '10.1.2.3']);

    expect(resolveClientIp(new Headers({ 'x-forwarded-for': '203.0.113.7, 10.0.0.1' }))).toBe(
      '203.0.113.7'
    );
    expect(resolveClientIp(new Headers(), '192.0.2.9')).toBe('192.0.2.9');

    // A request rejected by the length check uses the same resolved key.
    await (
      await handler(
        jsonChatRequest({ message: 'b'.repeat(2001) }, { 'x-forwarded-for': '203.0.113.7' })
      )
    ).text();
    expect(keys[2]).toBe('203.0.113.7');
  });
});

describe('AC-001-68 streaming and non-streaming return the same final payload', () => {
  it('AC-001-68: SSE frames end with final and the JSON body matches that payload', async () => {
    const handler = createChatRouteHandler(
      makeDeps({ adapter: citingAdapter(), newRequestId: sequentialRequestIds() })
    );

    const streamed = await handler(
      chatRequest(
        { message: '¿Puedo deducirme el alquiler de mi vivienda habitual?' },
        { headers: { accept: 'text/event-stream' } }
      )
    );
    expect(streamed.headers.get('content-type')).toContain('text/event-stream');
    const frames = parseSse(await streamed.text());

    const deltaFrames = frames.filter((frame) => frame.event === 'message');
    expect(deltaFrames.length).toBeGreaterThan(0);
    const finalFrame = frames.find((frame) => frame.event === 'final');
    expect(finalFrame).toBeDefined();
    expect(frames[frames.length - 1]!.event).toBe('done');

    const jsonResponse = await handler(
      jsonChatRequest({ message: '¿Puedo deducirme el alquiler de mi vivienda habitual?' })
    );
    const payload = (await jsonResponse.json()) as { kind: string; citations: unknown[] };

    expect(JSON.parse(finalFrame!.data)).toEqual(payload);
    expect(payload.kind).toBe('answer');
    expect(payload.citations.length).toBeGreaterThan(0);
  });
});

describe('AC-001-69 every error path returns JSON with a closed error code', () => {
  const closedSet = new Set<ErrorCode>([
    'missing_llm_config',
    'message_too_long',
    'unexpected_field',
    'rate_limited',
    'llm_timeout',
    'llm_unauthorized',
    'llm_rate_limited',
    'llm_upstream_error',
    'llm_malformed_response',
  ]);

  it('AC-001-69: 503, 400, 429 and 504 all answer JSON with a closed code', async () => {
    setEnv({ LLM_API_KEY: '', LLM_BASE_URL: '', LLM_MODEL: '' });
    const missingKeyHandler = createChatRouteHandler(
      makeDeps({ adapter: citingAdapter(), newRequestId: sequentialRequestIds() })
    );
    const missingKey = await missingKeyHandler(jsonChatRequest({ message: 'Hola' }));
    expect(missingKey.status).toBe(503);

    configureLlmEnv();
    const handler = createChatRouteHandler(
      makeDeps({ adapter: citingAdapter(), newRequestId: sequentialRequestIds() })
    );
    const tooLong = await handler(jsonChatRequest({ message: 'c'.repeat(2001) }));
    expect(tooLong.status).toBe(400);

    let clock = 5_000;
    const limitedHandler = createChatRouteHandler(
      makeDeps({
        adapter: citingAdapter(),
        now: () => clock,
        rateLimiter: { check: () => ({ allowed: false, retryAfterSeconds: 42 }) },
        newRequestId: sequentialRequestIds(),
      })
    );
    const limited = await limitedHandler(jsonChatRequest({ message: 'Hola' }));
    expect(limited.status).toBe(429);
    expect(limited.headers.get('retry-after')).toBe('42');
    clock += 1;

    const timeoutConfig: Config = testConfig({ llmTimeoutMs: 5 });
    const timingOut = createChatRouteHandler(
      makeDeps({
        createAdapter: (runtimeConfig: Config) =>
          new OpenAiCompatibleAdapter(
            { ...runtimeConfig, ...timeoutConfig },
            { fetchImpl: recordingFetch(upstreamError(504, 'gateway timeout')).fetchImpl }
          ),
        newRequestId: sequentialRequestIds(),
      })
    );
    const timeoutResponse = await timingOut(jsonChatRequest({ message: QUERY }));
    expect(timeoutResponse.status).toBe(502);

    for (const response of [missingKey, tooLong, limited, timeoutResponse]) {
      expect(response.headers.get('content-type')).toContain('application/json');
      const body = (await response.json()) as {
        kind: string;
        errorCode: ErrorCode;
        message: string;
      };
      expect(body.kind).toBe('error');
      expect(closedSet.has(body.errorCode)).toBe(true);
      expect(body.message.length).toBeGreaterThan(0);
    }

    const adapterTimeout = createChatRouteHandler(
      makeDeps({
        adapter: new FakeLlmAdapter({ error: 'timeout' }),
        newRequestId: sequentialRequestIds(),
      })
    );
    const timedOut = await adapterTimeout(jsonChatRequest({ message: QUERY }));
    expect(timedOut.status).toBe(504);
    const timedOutBody = (await timedOut.json()) as { errorCode: ErrorCode };
    expect(timedOutBody.errorCode).toBe('llm_timeout');
  });
});

describe('AC-001-70 route error handling leaks nothing and holds no stray state', () => {
  it('AC-001-70: every adapter error maps to its fixed Spanish message', async () => {
    const cases: [LlmErrorCode, ErrorCode, number][] = [
      ['timeout', 'llm_timeout', 504],
      ['unauthorized', 'llm_unauthorized', 502],
      ['rate_limited', 'llm_rate_limited', 503],
      ['upstream_error', 'llm_upstream_error', 502],
      ['malformed_response', 'llm_malformed_response', 502],
    ];

    for (const [llmError, errorCode, status] of cases) {
      const handler = createChatRouteHandler(
        makeDeps({
          adapter: new FakeLlmAdapter({ error: llmError }),
          newRequestId: sequentialRequestIds(),
        })
      );
      const response = await handler(jsonChatRequest({ message: '¿Puedo deducir el alquiler?' }));
      expect(response.status).toBe(status);
      const body = (await response.json()) as { message: string; errorCode: string };
      expect(body.errorCode).toBe(errorCode);
      expect(body.message).toBe(ERROR_MESSAGES[errorCode]);
    }
  });

  it('AC-001-70: a failing turn logs the same shape with status error', async () => {
    const logs: string[] = [];
    const handler = createChatRouteHandler(
      makeDeps({
        logs,
        adapter: new FakeLlmAdapter({ error: 'upstream_error' }),
        newRequestId: sequentialRequestIds(),
      })
    );

    await (await handler(jsonChatRequest({ message: QUERY }))).text();

    expect(logs).toHaveLength(1);
    const record = JSON.parse(logs[0]!) as Record<string, unknown>;
    expect(Object.keys(record).sort()).toEqual(
      [
        'citationValidation',
        'completionTokens',
        'firstTokenMs',
        'latencyMs',
        'promptTokens',
        'requestId',
        'retrievalHitCount',
        'route',
        'status',
      ].sort()
    );
    expect(record.citationValidation).toBe('not_applicable');
    expect(record.status).toBe('error');
  });

  it('AC-001-70: the route module has no top-level mutable state', () => {
    const source = readFileSync(repoPath('src/app/api/chat/route.ts'), 'utf8');
    expect(source).not.toMatch(/^let /m);
    expect(source).not.toMatch(/^var /m);
    expect(source).toContain('createChatRouteHandler');
    expect(source).toContain('createDefaultDeps');
    expect(mapStatusToError(503)).toBe('upstream_error');
  });
});
