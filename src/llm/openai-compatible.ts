/**
 * OpenAI-compatible chat-completions client (Task 7). URL, key and model come
 * from configuration; upstream error bodies collapse to a closed error code.
 */

import type { Config } from '../config/env';

import type {
  LlmAdapter,
  LlmCallOptions,
  LlmErrorCode,
  LlmResult,
  LlmStreamEvent,
  LlmUsage,
} from './types';
import { EMPTY_USAGE } from './types';

export interface OpenAiCompatibleOptions {
  readonly fetchImpl?: typeof fetch;
}

type OpenOutcome =
  | { readonly body: ReadableStream<Uint8Array> }
  | { readonly events: readonly LlmStreamEvent[] }
  | { readonly error: LlmErrorCode };

interface SseLineOutcome {
  readonly kind: 'skip' | 'done' | 'event' | 'malformed';
  readonly event?: LlmStreamEvent;
}

interface SseBufferOutcome {
  readonly events: LlmStreamEvent[];
  readonly rest: string;
  readonly done: boolean;
  readonly malformed: boolean;
}

export function isAbortError(error: unknown): boolean {
  return error instanceof Error && (error.name === 'AbortError' || error.name === 'TimeoutError');
}

export function mapStatusToError(status: number): LlmErrorCode {
  if (status === 401 || status === 403) return 'unauthorized';
  if (status === 429) return 'rate_limited';
  return 'upstream_error';
}

function toCount(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

type UsageChunk = { prompt_tokens?: unknown; completion_tokens?: unknown } | null | undefined;

function usageEvent(usage: UsageChunk): LlmStreamEvent | null {
  if (usage === undefined || usage === null) return null;
  return {
    type: 'usage',
    promptTokens: toCount(usage.prompt_tokens),
    completionTokens: toCount(usage.completion_tokens),
  };
}

function chunkToEvent(chunk: {
  choices?: { delta?: { content?: unknown } }[];
  usage?: UsageChunk;
}): LlmStreamEvent {
  const usage = usageEvent(chunk.usage);
  if (usage !== null) return usage;
  const content = chunk.choices?.[0]?.delta?.content;
  return { type: 'delta', text: typeof content === 'string' ? content : '' };
}

function parseSseLine(line: string): SseLineOutcome {
  const trimmed = line.trim();
  if (!trimmed.startsWith('data:')) return { kind: 'skip' };

  const payload = trimmed.slice('data:'.length).trim();
  if (payload === '[DONE]') return { kind: 'done' };

  try {
    return { kind: 'event', event: chunkToEvent(JSON.parse(payload)) };
  } catch {
    return { kind: 'malformed' };
  }
}

function isVisibleEvent(event: LlmStreamEvent | undefined): event is LlmStreamEvent {
  return event !== undefined && !(event.type === 'delta' && event.text === '');
}

function collectLine(
  outcome: SseLineOutcome,
  events: LlmStreamEvent[]
): { readonly done: boolean; readonly malformed: boolean } {
  if (isVisibleEvent(outcome.event)) events.push(outcome.event);
  return { done: outcome.kind === 'done', malformed: outcome.kind === 'malformed' };
}

function consumeSseBuffer(buffer: string): SseBufferOutcome {
  const lines = buffer.split('\n');
  const rest = lines.pop() ?? '';
  const events: LlmStreamEvent[] = [];
  let done = false;
  let malformed = false;

  for (const line of lines) {
    const flags = collectLine(parseSseLine(line), events);
    done = done || flags.done;
    malformed = malformed || flags.malformed;
  }

  return { events, rest, done, malformed };
}

interface JsonMessage {
  choices?: { message?: { content?: unknown }; delta?: { content?: unknown } }[];
}

function parseJsonObject(raw: string): JsonMessage | null {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
    return parsed as JsonMessage;
  } catch {
    return null;
  }
}

function firstChoice(parsed: JsonMessage): NonNullable<JsonMessage['choices']>[number] | null {
  const choices = parsed.choices;
  if (choices === undefined) return null;
  return choices[0] ?? null;
}

function completionContent(parsed: JsonMessage): string | null {
  const choice = firstChoice(parsed);
  if (choice === null) return null;
  const messageContent = choice.message?.content;
  if (typeof messageContent === 'string') return messageContent;
  const deltaContent = choice.delta?.content;
  return typeof deltaContent === 'string' ? deltaContent : null;
}

/** A non-SSE 200 body: either one JSON completion or an unparsable response. */
export function decodeJsonCompletion(raw: string): LlmStreamEvent[] | null {
  const parsed = parseJsonObject(raw);
  if (parsed === null) return null;
  const content = completionContent(parsed);
  return content === null ? null : [{ type: 'delta', text: content }];
}

function isEventStream(response: Response): boolean {
  return (response.headers.get('content-type') ?? '').includes('text/event-stream');
}

function eventStreamBody(response: Response): OpenOutcome {
  if (response.body === null) return { error: 'malformed_response' };
  return { body: response.body };
}

/** The error event a buffer outcome ends the stream with, if any. */
function stopEvent(outcome: SseBufferOutcome): LlmStreamEvent | null {
  return outcome.malformed ? { type: 'error', error: 'malformed_response' } : null;
}

interface StreamState {
  readonly buffer: string;
  readonly events: readonly LlmStreamEvent[];
  readonly finished: boolean;
}

function initialStreamState(): StreamState {
  return { buffer: '', events: [], finished: false };
}

type ChunkRead = ReadableStreamReadResult<Uint8Array>;

function nextStreamState(state: StreamState, read: ChunkRead, decoder: TextDecoder): StreamState {
  if (read.done) return { buffer: '', events: [], finished: true };

  const outcome = consumeSseBuffer(state.buffer + decoder.decode(read.value, { stream: true }));
  const stop = stopEvent(outcome);
  const events = stop === null ? outcome.events : [...outcome.events, stop];
  return { buffer: outcome.rest, events, finished: stop !== null || outcome.done };
}

export class OpenAiCompatibleAdapter implements LlmAdapter {
  private readonly endpointUrl: string;
  private readonly apiKey: string;
  private readonly model: string;
  private readonly timeoutMs: number;
  private readonly disableReasoning: boolean;
  private readonly fetchImpl: typeof fetch;

  constructor(config: Config, options: OpenAiCompatibleOptions = {}) {
    this.endpointUrl = `${config.llmBaseUrl.replace(/\/$/, '')}/chat/completions`;
    this.apiKey = config.llmApiKey;
    this.model = config.llmModel;
    this.timeoutMs = config.llmTimeoutMs;
    this.disableReasoning = config.llmDisableReasoning;
    this.fetchImpl = options.fetchImpl ?? ((input, init) => globalThis.fetch(input, init));
  }

  async *complete(
    request: Parameters<LlmAdapter['complete']>[0],
    options: LlmCallOptions = {}
  ): AsyncIterable<LlmStreamEvent> {
    const controller = new AbortController();
    const forwardAbort = () => controller.abort();
    options.signal?.addEventListener('abort', forwardAbort);
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const opened = await this.openStream(request, controller.signal);
      if ('error' in opened) {
        yield { type: 'error', error: opened.error };
        return;
      }
      if ('events' in opened) {
        yield* opened.events;
        return;
      }
      yield* this.parseStream(opened.body);
    } finally {
      clearTimeout(timer);
      options.signal?.removeEventListener('abort', forwardAbort);
    }
  }

  async completeAll(
    request: Parameters<LlmAdapter['completeAll']>[0],
    options: LlmCallOptions = {}
  ): Promise<LlmResult> {
    let text = '';
    let usage: LlmUsage = EMPTY_USAGE;

    for await (const event of this.complete(request, options)) {
      if (event.type === 'delta') text += event.text;
      if (event.type === 'usage') {
        usage = { promptTokens: event.promptTokens, completionTokens: event.completionTokens };
      }
      if (event.type === 'error') return { ok: false, error: event.error };
    }

    return { ok: true, text, usage };
  }

  private async openStream(
    request: Parameters<LlmAdapter['complete']>[0],
    signal: AbortSignal
  ): Promise<OpenOutcome> {
    let response: Response;
    try {
      response = await this.fetchImpl(this.endpointUrl, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          stream: true,
          stream_options: { include_usage: true },
          ...(this.disableReasoning ? { thinking: { type: 'disabled' } } : {}),
          messages: [{ role: 'system', content: request.system }, ...request.messages],
        }),
        signal,
      });
    } catch (error) {
      return { error: isAbortError(error) ? 'timeout' : 'upstream_error' };
    }

    try {
      return await this.readResponse(response);
    } catch (error) {
      return { error: isAbortError(error) ? 'timeout' : 'upstream_error' };
    }
  }

  private async readResponse(response: Response): Promise<OpenOutcome> {
    if (!response.ok) return { error: mapStatusToError(response.status) };
    if (isEventStream(response)) return eventStreamBody(response);

    const events = decodeJsonCompletion(await response.text());
    return events === null ? { error: 'malformed_response' } : { events };
  }

  private async *parseStream(body: ReadableStream<Uint8Array>): AsyncIterable<LlmStreamEvent> {
    const reader = body.getReader();
    const decoder = new TextDecoder();
    let state = initialStreamState();

    try {
      while (!state.finished) {
        const read = await reader.read();
        state = nextStreamState(state, read, decoder);
        yield* state.events;
      }
    } catch (error) {
      yield { type: 'error', error: isAbortError(error) ? 'timeout' : 'upstream_error' };
    }
  }
}
