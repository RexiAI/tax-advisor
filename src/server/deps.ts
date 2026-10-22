/**
 * Composition root. Everything the request path collaborates with is injected
 * here, so tests can replace the model, the corpus and the clock without the
 * production wiring being different code.
 */

import { loadConfig, readBounds, type Config, type ConfigResult } from '../config/env';
import { OpenAiCompatibleAdapter } from '../llm/openai-compatible';
import type { LlmAdapter } from '../llm/types';
import { newRequestId, type LogSink } from '../observability/log';
import { createConversationStore, type ConversationStore } from '../service/conversation-store';
import { createRateLimiter, type RateLimiter } from '../service/rate-limit';

import { createCorpusLoader, type CorpusProviderResult } from './corpus-loader';

export interface AppDeps {
  readonly loadConfig: () => ConfigResult;
  readonly loadCorpus: () => CorpusProviderResult;
  readonly createAdapter: (config: Config) => LlmAdapter;
  readonly rateLimiter: RateLimiter;
  readonly conversations: ConversationStore;
  readonly log: LogSink;
  readonly now: () => number;
  readonly socketAddress: () => string | undefined;
  readonly newRequestId: () => string;
}

export function createDefaultDeps(overrides: Partial<AppDeps> = {}): AppDeps {
  const bounds = readBounds();

  const defaults: AppDeps = {
    loadConfig,
    loadCorpus: createCorpusLoader(),
    createAdapter: (config: Config) => new OpenAiCompatibleAdapter(config),
    rateLimiter: createRateLimiter({
      max: bounds.rateLimitMax,
      windowMs: bounds.rateLimitWindowMs,
    }),
    conversations: createConversationStore(),
    log: (line: string) => {
      process.stdout.write(`${line}\n`);
    },
    now: () => Date.now(),
    socketAddress: () => undefined,
    newRequestId,
  };

  return { ...defaults, ...overrides };
}
