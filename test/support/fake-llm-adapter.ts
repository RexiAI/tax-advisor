/**
 * `FakeLlmAdapter` (Task 7). Yields scripted deltas from a fixture queue and
 * records every request it receives. No test ever imports the production
 * adapter's network path.
 */

import type {
  LlmAdapter,
  LlmCallOptions,
  LlmErrorCode,
  LlmRequest,
  LlmResult,
  LlmStreamEvent,
} from '@/llm/types';
import { EMPTY_USAGE } from '@/llm/types';

export interface FakeScript {
  readonly deltas?: readonly string[];
  readonly usage?: { readonly promptTokens: number; readonly completionTokens: number };
  readonly error?: LlmErrorCode;
  /** Simulates an upstream that never yields a token. */
  readonly hang?: boolean;
}

function waitForAbort(signal: AbortSignal | undefined, maxHangMs: number): Promise<void> {
  return new Promise<void>((resolve) => {
    const timer = setTimeout(resolve, maxHangMs);
    signal?.addEventListener('abort', () => {
      clearTimeout(timer);
      resolve();
    });
  });
}

export class FakeLlmAdapter implements LlmAdapter {
  readonly requests: LlmRequest[] = [];
  private readonly scripts: FakeScript[];
  private readonly maxHangMs: number;

  constructor(scripts: FakeScript | readonly FakeScript[], options: { maxHangMs?: number } = {}) {
    this.scripts = Array.isArray(scripts) ? [...scripts] : [scripts as FakeScript];
    this.maxHangMs = options.maxHangMs ?? 50;
  }

  get callCount(): number {
    return this.requests.length;
  }

  private scriptFor(index: number): FakeScript {
    return this.scripts[Math.min(index, this.scripts.length - 1)] ?? { deltas: [] };
  }

  async *complete(
    request: LlmRequest,
    options: LlmCallOptions = {}
  ): AsyncIterable<LlmStreamEvent> {
    const script = this.takeScript();
    this.requests.push(request);

    if (script.error !== undefined) {
      yield { type: 'error', error: script.error };
      return;
    }
    if (script.hang === true) {
      await waitForAbort(options.signal, this.maxHangMs);
      yield { type: 'error', error: 'timeout' };
      return;
    }
    yield* this.eventsOf(script);
  }

  private takeScript(): FakeScript {
    return this.scriptFor(this.requests.length);
  }

  private *eventsOf(script: FakeScript): Iterable<LlmStreamEvent> {
    for (const delta of script.deltas ?? []) {
      yield { type: 'delta', text: delta };
    }
    if (script.usage === undefined) return;
    yield {
      type: 'usage',
      promptTokens: script.usage.promptTokens,
      completionTokens: script.usage.completionTokens,
    };
  }

  async completeAll(request: LlmRequest, options: LlmCallOptions = {}): Promise<LlmResult> {
    const script = this.takeScript();
    this.requests.push(request);

    if (script.error !== undefined) return { ok: false, error: script.error };
    if (script.hang === true) {
      await waitForAbort(options.signal, this.maxHangMs);
      return { ok: false, error: 'timeout' };
    }
    return {
      ok: true,
      text: (script.deltas ?? []).join(''),
      usage: script.usage ?? EMPTY_USAGE,
    };
  }
}

export function answerScript(text: string, extra: Partial<FakeScript> = {}): FakeScript {
  return { deltas: chunk(text), usage: { promptTokens: 120, completionTokens: 80 }, ...extra };
}

/** Splits an answer into a few deltas so streaming has more than one frame. */
export function chunk(text: string, size = 12): string[] {
  const parts: string[] = [];
  for (let index = 0; index < text.length; index += size) {
    parts.push(text.slice(index, index + size));
  }
  return parts.length === 0 ? [''] : parts;
}
