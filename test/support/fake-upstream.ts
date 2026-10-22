/**
 * Fake upstream helpers for the OpenAI-compatible adapter tests: SSE bodies,
 * error responses, and a stream that only ends when the caller aborts — the
 * behaviour a real `fetch` exhibits when its signal fires.
 */

export function sseChunk(content: string): string {
  return `data: ${JSON.stringify({ choices: [{ delta: { content } }] })}\n\n`;
}

export function sseUsage(promptTokens: number, completionTokens: number): string {
  return `data: ${JSON.stringify({
    choices: [],
    usage: { prompt_tokens: promptTokens, completion_tokens: completionTokens },
  })}\n\n`;
}

export const SSE_DONE = 'data: [DONE]\n\n';

export function sseResponse(parts: readonly string[]): Response {
  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const part of parts) controller.enqueue(encoder.encode(part));
      controller.close();
    },
  });
  return new Response(body, { status: 200, headers: { 'content-type': 'text/event-stream' } });
}

function abortError(): Error {
  const error = new Error('The operation was aborted');
  error.name = 'AbortError';
  return error;
}

/**
 * A body that never yields a token. Aborting the signal rejects the pending read,
 * which is how a real `fetch` body behaves when its signal fires.
 */
export function hangingResponse(signal: AbortSignal | null | undefined): Response {
  const body = new ReadableStream<Uint8Array>({
    pull() {
      return new Promise<void>((_resolve, reject) => {
        if (signal?.aborted === true) {
          reject(abortError());
          return;
        }
        signal?.addEventListener('abort', () => {
          reject(abortError());
        });
      });
    },
  });
  return new Response(body, {
    status: 200,
    headers: { 'content-type': 'text/event-stream' },
  });
}

export function upstreamError(status: number, body: string): Response {
  return new Response(body, { status, headers: { 'content-type': 'text/plain' } });
}

export interface RecordedCall {
  readonly url: string;
  readonly init: RequestInit;
}

export function recordingFetch(response: Response): {
  fetchImpl: typeof fetch;
  calls: RecordedCall[];
} {
  const calls: RecordedCall[] = [];
  const fetchImpl = ((input: RequestInfo | URL, init?: RequestInit) => {
    calls.push({ url: String(input), init: init ?? {} });
    return Promise.resolve(response.clone());
  }) as typeof fetch;
  return { fetchImpl, calls };
}
