/**
 * The single place environment variables are read (Task 1).
 *
 * No provider hostname, vendor name or model id is a literal in this module: the
 * three LLM values must arrive from the environment, and a missing one is a
 * configured failure rather than a silent default. There is no fallback answer,
 * no default model and no default base URL anywhere in the codebase.
 */

export interface Config {
  readonly llmBaseUrl: string;
  readonly llmApiKey: string;
  readonly llmModel: string;
  readonly corpusTaxYear: number;
  readonly minRetrievalScore: number;
  readonly retrievalTopK: number;
  readonly maxMessageChars: number;
  readonly rateLimitMax: number;
  readonly rateLimitWindowMs: number;
  readonly llmTimeoutMs: number;
}

export type LlmVariable = 'LLM_BASE_URL' | 'LLM_API_KEY' | 'LLM_MODEL';

export const LLM_VARIABLES: readonly LlmVariable[] = ['LLM_BASE_URL', 'LLM_API_KEY', 'LLM_MODEL'];

export type ConfigResult =
  | { readonly ok: true; readonly config: Config }
  | {
      readonly ok: false;
      readonly error: 'missing_llm_config';
      readonly missing: readonly LlmVariable[];
    };

/** Documented defaults for the bounded values (AC-001-04). */
export const DEFAULT_BOUNDS = {
  corpusTaxYear: 2025,
  minRetrievalScore: 0.1,
  retrievalTopK: 5,
  maxMessageChars: 2000,
  rateLimitMax: 20,
  rateLimitWindowMs: 600000,
  llmTimeoutMs: 60000,
} as const;

export type Bounds = Omit<Config, 'llmBaseUrl' | 'llmApiKey' | 'llmModel'>;

function readString(name: string): string {
  const raw = process.env[name];
  return typeof raw === 'string' ? raw.trim() : '';
}

function readNumber(name: string, fallback: number): number {
  const raw = readString(name);
  if (raw === '') return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

/**
 * The bounded values always resolve — they have documented defaults. Used by the
 * retrieval layer for its default `k` and by the route for its limits, neither of
 * which needs the LLM configuration to exist.
 */
export function readBounds(): Bounds {
  return {
    corpusTaxYear: readNumber('CORPUS_TAX_YEAR', DEFAULT_BOUNDS.corpusTaxYear),
    minRetrievalScore: readNumber('MIN_RETRIEVAL_SCORE', DEFAULT_BOUNDS.minRetrievalScore),
    retrievalTopK: readNumber('RETRIEVAL_TOP_K', DEFAULT_BOUNDS.retrievalTopK),
    maxMessageChars: readNumber('MAX_MESSAGE_CHARS', DEFAULT_BOUNDS.maxMessageChars),
    rateLimitMax: readNumber('RATE_LIMIT_MAX', DEFAULT_BOUNDS.rateLimitMax),
    rateLimitWindowMs: readNumber('RATE_LIMIT_WINDOW_MS', DEFAULT_BOUNDS.rateLimitWindowMs),
    llmTimeoutMs: readNumber('LLM_TIMEOUT_MS', DEFAULT_BOUNDS.llmTimeoutMs),
  };
}

/**
 * Resolves the full configuration. Fails closed: when any of the three LLM
 * variables is unset or empty the result is an error carrying the names of the
 * variables that are missing, in a stable order.
 */
export function loadConfig(): ConfigResult {
  const llmBaseUrl = readString('LLM_BASE_URL');
  const llmApiKey = readString('LLM_API_KEY');
  const llmModel = readString('LLM_MODEL');

  const missing = LLM_VARIABLES.filter((name) => readString(name) === '');
  if (missing.length > 0) {
    return { ok: false, error: 'missing_llm_config', missing };
  }

  return {
    ok: true,
    config: { llmBaseUrl, llmApiKey, llmModel, ...readBounds() },
  };
}
