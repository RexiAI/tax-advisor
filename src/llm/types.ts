/**
 * The model boundary (Task 7). One streaming-capable method plus a convenience
 * `completeAll`. Errors are values from a closed set, never untyped throws, and
 * the request type has no field capable of carrying a tool definition.
 */

export type LlmErrorCode =
  'timeout' | 'unauthorized' | 'rate_limited' | 'upstream_error' | 'malformed_response';

export interface LlmMessage {
  readonly role: 'user';
  readonly content: string;
}

export interface LlmRequest {
  readonly system: string;
  readonly messages: readonly LlmMessage[];
}

export type LlmStreamEvent =
  | { readonly type: 'delta'; readonly text: string }
  | { readonly type: 'usage'; readonly promptTokens: number; readonly completionTokens: number }
  | { readonly type: 'error'; readonly error: LlmErrorCode };

export interface LlmUsage {
  readonly promptTokens: number;
  readonly completionTokens: number;
}

export type LlmResult =
  | { readonly ok: true; readonly text: string; readonly usage: LlmUsage }
  | { readonly ok: false; readonly error: LlmErrorCode };

export interface LlmCallOptions {
  readonly signal?: AbortSignal;
}

export interface LlmAdapter {
  complete(request: LlmRequest, options?: LlmCallOptions): AsyncIterable<LlmStreamEvent>;
  completeAll(request: LlmRequest, options?: LlmCallOptions): Promise<LlmResult>;
}

export const EMPTY_USAGE: LlmUsage = { promptTokens: 0, completionTokens: 0 };
