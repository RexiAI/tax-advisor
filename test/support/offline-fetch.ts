/**
 * Offline test policy (Task 16 / AC-001-82).
 *
 * The suite must be runnable with no network access and no paid API. Every test
 * therefore runs against a `fetch` that refuses to perform a request and records
 * the attempt, so an accidental real call fails loudly instead of hitting BOE or
 * an LLM provider.
 */

export interface OfflineFetchState {
  attempts: string[];
}

export const offlineFetchState: OfflineFetchState = { attempts: [] };

export const OFFLINE_FETCH_MESSAGE =
  'Offline test policy: the test suite performs no HTTP requests. Inject a fake instead.';

export function installOfflineFetch(): void {
  offlineFetchState.attempts = [];
  globalThis.fetch = ((input: unknown) => {
    offlineFetchState.attempts.push(String(input));
    return Promise.reject(new Error(OFFLINE_FETCH_MESSAGE));
  }) as typeof fetch;
}
