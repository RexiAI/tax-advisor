import { afterEach, describe, expect, it, vi } from 'vitest';

import { submitQuestion } from '@/components/ChatScreen/chat-submit';

const ANSWER = {
  kind: 'answer',
  explanation: 'Resumen',
  rule: 'Norma',
  citations: [],
  disclaimer: 'Aviso',
} as const;

function streamResponse(body: string): Response {
  const encoder = new TextEncoder();
  return new Response(
    new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(body));
        controller.close();
      },
    }),
    { status: 200, headers: { 'content-type': 'text/event-stream' } }
  );
}

function stubFetch(response: Response | Error): void {
  vi.stubGlobal(
    'fetch',
    vi.fn(() => (response instanceof Error ? Promise.reject(response) : Promise.resolve(response)))
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('submitQuestion', () => {
  it('streams deltas and returns the final frame', async () => {
    stubFetch(
      streamResponse(
        `data: {"type":"delta","text":"Hola "}\n\nevent: final\ndata: ${JSON.stringify(ANSWER)}\n\nevent: done\ndata: [DONE]\n\n`
      )
    );
    const deltas: string[] = [];

    const outcome = await submitQuestion('pregunta', 'c-1', (text) => deltas.push(text));

    expect(deltas).toEqual(['Hola ']);
    expect(outcome).toEqual({ kind: 'response', response: ANSWER });
  });

  it('accepts a plain JSON response', async () => {
    stubFetch(
      new Response(JSON.stringify(ANSWER), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    );

    await expect(submitQuestion('pregunta', 'c-1')).resolves.toEqual({
      kind: 'response',
      response: ANSWER,
    });
  });

  it('maps a 429 and its retry-after header', async () => {
    stubFetch(
      new Response(JSON.stringify({ errorCode: 'rate_limited', message: 'Espera' }), {
        status: 429,
        headers: { 'content-type': 'application/json', 'retry-after': '42' },
      })
    );

    const outcome = await submitQuestion('pregunta', 'c-1');

    expect(outcome.kind).toBe('error');
    if (outcome.kind !== 'error') return;
    expect(outcome.error.errorCode).toBe('rate_limited');
    expect(outcome.error.retryAfterSeconds).toBe(42);
  });

  it('maps a network failure to a closed error', async () => {
    stubFetch(new TypeError('offline'));

    const outcome = await submitQuestion('pregunta', 'c-1');

    expect(outcome.kind).toBe('error');
    if (outcome.kind !== 'error') return;
    expect(outcome.error.errorCode).toBe('llm_upstream_error');
  });

  it('rejects a stream that ends without a final frame', async () => {
    stubFetch(streamResponse('data: {"type":"delta","text":"Hola"}\n\n'));

    const outcome = await submitQuestion('pregunta', 'c-1');

    expect(outcome.kind).toBe('error');
    if (outcome.kind !== 'error') return;
    expect(outcome.error.errorCode).toBe('llm_malformed_response');
  });
});
