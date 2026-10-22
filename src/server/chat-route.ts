/**
 * `POST /api/chat` (Task 13).
 *
 * Order of checks is deliberate and observable: client IP → rate limit →
 * configuration → body shape → message length → corpus → model. A rejected
 * request therefore never constructs the adapter and never touches retrieval.
 *
 * The only mutable state the route holds is the injected rate-limit store and the
 * injected conversation store.
 */

import type { Config, ConfigResult } from '../config/env';
import { ERROR_MESSAGES, type ErrorCode } from '../content/strings';
import type { LlmAdapter } from '../llm/types';
import { serializeLogRecord, statusForResponseKind, type LogRecord } from '../observability/log';
import type { AnswerDeps } from '../service/answer-question';
import { answerQuestion, streamAnswer } from '../service/answer-question';
import { insufficientResponse } from '../service/responses';
import type { ChatRequest, ChatResponse, TurnFrame, TurnTelemetry } from '../service/types';
import { createTurnTelemetry } from '../service/types';

import type { AppDeps } from './deps';

export const CHAT_ROUTE = '/api/chat';

const ALLOWED_BODY_KEYS = new Set(['message', 'conversationId']);

const STATUS_BY_ERROR: Readonly<Record<ErrorCode, number>> = {
  missing_llm_config: 503,
  message_too_long: 400,
  unexpected_field: 400,
  rate_limited: 429,
  llm_timeout: 504,
  llm_unauthorized: 502,
  llm_rate_limited: 503,
  llm_upstream_error: 502,
  llm_malformed_response: 502,
};

export interface TurnContext {
  readonly requestId: string;
  readonly startedAt: number;
}

interface ParsedBody {
  readonly ok: true;
  readonly request: ChatRequest;
}

interface Completion {
  readonly response: Response;
  readonly status: string;
  readonly telemetry?: TurnTelemetry;
}

function jsonResponse(
  payload: unknown,
  status = 200,
  headers: Record<string, string> = {}
): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json', ...headers },
  });
}

function errorPayload(errorCode: ErrorCode, extra: Record<string, unknown> = {}): unknown {
  return { kind: 'error', errorCode, message: ERROR_MESSAGES[errorCode], ...extra };
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function tryParseJson(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
}

function hasUnexpectedField(value: Record<string, unknown>): boolean {
  return Object.keys(value).some((key) => !ALLOWED_BODY_KEYS.has(key));
}

function isOptionalString(value: unknown): boolean {
  return value === undefined || typeof value === 'string';
}

export function parseChatBody(raw: string): ParsedBody | null {
  const value = tryParseJson(raw);
  if (!isPlainObject(value)) return null;
  if (hasUnexpectedField(value)) return null;

  const message = value.message;
  const conversationId = value.conversationId;
  if (typeof message !== 'string') return null;
  if (!isOptionalString(conversationId)) return null;

  if (conversationId === undefined) return { ok: true, request: { message } };
  return { ok: true, request: { message, conversationId: conversationId as string } };
}

function firstForwardedEntry(forwarded: string | null): string {
  if (forwarded === null) return '';
  return (forwarded.split(',')[0] ?? '').trim();
}

function present(value: string | undefined): value is string {
  return value !== undefined && value !== '';
}

/** Leftmost `x-forwarded-for` entry, else the socket address. */
export function resolveClientIp(headers: Headers, socketAddress?: string): string {
  const forwarded = firstForwardedEntry(headers.get('x-forwarded-for'));
  if (forwarded !== '') return forwarded;
  return present(socketAddress) ? socketAddress : 'unknown';
}

function wantsJson(headers: Headers): boolean {
  return (headers.get('accept') ?? '').includes('application/json');
}

function startContext(deps: AppDeps): TurnContext {
  return { requestId: deps.newRequestId(), startedAt: deps.now() };
}

function emitLog(
  context: TurnContext,
  telemetry: TurnTelemetry,
  status: string,
  deps: AppDeps
): void {
  const record: LogRecord = {
    requestId: context.requestId,
    route: CHAT_ROUTE,
    latencyMs: Math.max(0, deps.now() - context.startedAt),
    firstTokenMs: telemetry.firstTokenMs,
    promptTokens: telemetry.promptTokens,
    completionTokens: telemetry.completionTokens,
    retrievalHitCount: telemetry.retrievalHitCount,
    citationValidation: telemetry.citationValidation,
    status,
  };
  deps.log(serializeLogRecord(record));
}

function complete(context: TurnContext, completion: Completion, deps: AppDeps): Response {
  emitLog(context, completion.telemetry ?? createTurnTelemetry(), completion.status, deps);
  return completion.response;
}

function responseStatus(payload: ChatResponse): number {
  if (payload.kind !== 'error') return 200;
  return STATUS_BY_ERROR[payload.errorCode];
}

/**
 * The completion for a turn rejected before the model is reached: a JSON error
 * body, no telemetry, and the same `error` status on the log line. One place, so
 * every rejection logs and serializes identically.
 */
function errorCompletion(
  errorCode: ErrorCode,
  status: number,
  extra: {
    readonly values?: Record<string, unknown>;
    readonly headers?: Record<string, string>;
  } = {}
): Completion {
  return {
    response: jsonResponse(errorPayload(errorCode, extra.values), status, extra.headers),
    status: 'error',
  };
}

function sseFrame(frame: TurnFrame): string {
  if (frame.event === 'delta') {
    return `data: ${JSON.stringify({ type: 'delta', text: frame.text })}\n\n`;
  }
  return `event: ${frame.event}\ndata: ${JSON.stringify(frame.payload)}\n\n`;
}

function sseResponse(
  request: ChatRequest,
  answerDeps: AnswerDeps,
  context: TurnContext,
  deps: AppDeps
): Response {
  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    async start(controller): Promise<void> {
      let status = 'error';
      try {
        for await (const frame of streamAnswer(request, answerDeps)) {
          controller.enqueue(encoder.encode(sseFrame(frame)));
          if (frame.event !== 'delta') status = statusForResponseKind(frame.payload.kind);
        }
        controller.enqueue(encoder.encode('event: done\ndata: [DONE]\n\n'));
      } finally {
        controller.close();
        emitLog(context, answerDeps.telemetry, status, deps);
      }
    },
  });

  return new Response(body, {
    status: 200,
    headers: { 'content-type': 'text/event-stream', 'cache-control': 'no-cache' },
  });
}

function buildAnswerDeps(
  corpusIndex: AnswerDeps['index'],
  adapter: LlmAdapter,
  config: Config,
  deps: AppDeps
): AnswerDeps {
  return {
    index: corpusIndex,
    adapter,
    config,
    conversations: deps.conversations,
    telemetry: createTurnTelemetry(),
    now: deps.now,
  };
}

async function answerTurn(
  wantsStream: boolean,
  request: ChatRequest,
  config: Config,
  context: TurnContext,
  deps: AppDeps
): Promise<Response> {
  const corpus = deps.loadCorpus();
  if (!corpus.ok) {
    const payload = insufficientResponse('corpus_unavailable');
    return complete(context, { response: jsonResponse(payload), status: payload.kind }, deps);
  }

  const adapter = deps.createAdapter(config);
  const answerDeps = buildAnswerDeps(corpus.corpus.index, adapter, config, deps);

  if (wantsStream) return sseResponse(request, answerDeps, context, deps);

  const payload = await answerQuestion(request, answerDeps);
  return complete(
    context,
    {
      response: jsonResponse(payload, responseStatus(payload)),
      status: statusForResponseKind(payload.kind),
      telemetry: answerDeps.telemetry,
    },
    deps
  );
}

function guardPrefix(
  request: Request,
  context: TurnContext,
  deps: AppDeps
): { readonly completion: Completion } | { readonly config: Config } {
  const ip = resolveClientIp(request.headers, deps.socketAddress());
  const limit = deps.rateLimiter.check(ip, context.startedAt);
  if (!limit.allowed) {
    return {
      completion: errorCompletion('rate_limited', 429, {
        headers: { 'retry-after': String(limit.retryAfterSeconds) },
      }),
    };
  }

  const config: ConfigResult = deps.loadConfig();
  if (!config.ok) {
    return {
      completion: errorCompletion('missing_llm_config', 503, {
        values: { missing: config.missing },
      }),
    };
  }

  return { config: config.config };
}

export function createChatRouteHandler(deps: AppDeps): (request: Request) => Promise<Response> {
  return async function handleChatRequest(request: Request): Promise<Response> {
    const context = startContext(deps);
    const guard = guardPrefix(request, context, deps);
    if ('completion' in guard) return complete(context, guard.completion, deps);

    const body = parseChatBody(await request.text());
    if (body === null) return complete(context, errorCompletion('unexpected_field', 400), deps);

    const { config } = guard;
    if (body.request.message.length > config.maxMessageChars) {
      return complete(context, errorCompletion('message_too_long', 400), deps);
    }

    return answerTurn(wantsJson(request.headers) === false, body.request, config, context, deps);
  };
}
