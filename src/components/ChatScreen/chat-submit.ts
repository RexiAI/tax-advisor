/**
 * Browser → `/api/chat` client. Streams when the route streams (SSE), falls back
 * to a single JSON body, and turns every failure into the same `SubmitOutcome`
 * shape the screen renders. It never renders anything itself.
 */

import { ERROR_MESSAGES, type ErrorCode } from '@/content/strings';
import type { ChatResponse } from '@/service/types';

export interface ClientError {
  readonly errorCode: ErrorCode;
  readonly message: string;
  readonly retryAfterSeconds?: number;
}

export type SubmitOutcome =
  | { readonly kind: 'response'; readonly response: ChatResponse }
  | { readonly kind: 'error'; readonly error: ClientError };

export type DeltaListener = (text: string) => void;

export type Submit = (
  message: string,
  conversationId: string,
  onDelta?: DeltaListener
) => Promise<SubmitOutcome>;

interface WireError {
  readonly errorCode?: string;
  readonly message?: string;
}

function asErrorCode(value: string | undefined): ErrorCode {
  if (value !== undefined && value in ERROR_MESSAGES) return value as ErrorCode;
  return 'llm_upstream_error';
}

function errorOutcome(errorCode: ErrorCode, retryAfterSeconds?: number): SubmitOutcome {
  const error: ClientError = {
    errorCode,
    message: ERROR_MESSAGES[errorCode],
    ...(retryAfterSeconds === undefined ? {} : { retryAfterSeconds }),
  };
  return { kind: 'error', error };
}

async function readErrorResponse(response: Response): Promise<SubmitOutcome> {
  let payload: WireError = {};
  try {
    payload = (await response.json()) as WireError;
  } catch {
    payload = {};
  }
  const retryAfter = Number(response.headers.get('retry-after'));
  const retryAfterSeconds = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : undefined;
  return errorOutcome(asErrorCode(payload.errorCode), retryAfterSeconds);
}

interface SseFrame {
  readonly event: string;
  readonly data: string;
}

function parseFrame(block: string): SseFrame | null {
  const lines = block.split('\n');
  const event = lines
    .find((line) => line.startsWith('event:'))
    ?.slice('event:'.length)
    .trim();
  const data = lines
    .filter((line) => line.startsWith('data:'))
    .map((line) => line.slice('data:'.length).trim())
    .join('\n');
  if (data === '') return null;
  return { event: event ?? 'message', data };
}

function emitDelta(frame: SseFrame, onDelta: DeltaListener | undefined): void {
  const delta = JSON.parse(frame.data) as { text?: string };
  if (delta.text === undefined) return;
  onDelta?.(delta.text);
}

/** A frame either carries a delta (streamed text) or the final payload. */
function handleFrame(block: string, onDelta: DeltaListener | undefined): ChatResponse | null {
  const frame = parseFrame(block);
  if (frame === null) return null;
  if (frame.data === '[DONE]') return null;
  if (frame.event === 'message') {
    emitDelta(frame, onDelta);
    return null;
  }
  return JSON.parse(frame.data) as ChatResponse;
}

async function collectFrames(
  body: ReadableStream<Uint8Array>,
  onDelta: DeltaListener | undefined
): Promise<ChatResponse | null> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let final: ChatResponse | null = null;

  while (final === null) {
    const read = await reader.read();
    if (read.done) break;
    buffer += decoder.decode(read.value, { stream: true });
    const blocks = buffer.split('\n\n');
    buffer = blocks.pop() ?? '';
    for (const block of blocks) final = handleFrame(block, onDelta) ?? final;
  }

  return final;
}

async function readStream(
  response: Response,
  onDelta: DeltaListener | undefined
): Promise<SubmitOutcome> {
  const body = response.body;
  if (body === null) return errorOutcome('llm_malformed_response');

  const final = await collectFrames(body, onDelta);
  if (final === null) return errorOutcome('llm_malformed_response');
  return { kind: 'response', response: final };
}

async function postChat(message: string, conversationId: string): Promise<Response | null> {
  try {
    return await fetch('/api/chat', {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'text/event-stream' },
      body: JSON.stringify({ message, conversationId }),
    });
  } catch {
    return null;
  }
}

async function readJsonResponse(response: Response): Promise<SubmitOutcome> {
  try {
    return { kind: 'response', response: (await response.json()) as ChatResponse };
  } catch {
    return errorOutcome('llm_malformed_response');
  }
}

function isEventStreamResponse(response: Response): boolean {
  return (response.headers.get('content-type') ?? '').includes('text/event-stream');
}

export const submitQuestion: Submit = async (message, conversationId, onDelta) => {
  const response = await postChat(message, conversationId);
  if (response === null) return errorOutcome('llm_upstream_error');
  if (!response.ok) return readErrorResponse(response);
  if (isEventStreamResponse(response)) return readStream(response, onDelta);
  return readJsonResponse(response);
};
