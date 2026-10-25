/**
 * Fixed-window, per-key rate limiter (Task 13). The clock is injected so the
 * window boundary is testable, and the only state is one counter per key.
 */

export interface RateLimitDecision {
  readonly allowed: boolean;
  readonly retryAfterSeconds: number;
}

export interface RateLimiter {
  check(key: string, nowMs: number): RateLimitDecision;
}

interface Window {
  readonly startedAt: number;
  count: number;
}

export interface RateLimiterOptions {
  readonly max: number;
  readonly windowMs: number;
}

const MAX_WINDOWS = 10_000;

function evictExpired(windows: Map<string, Window>, nowMs: number, windowMs: number): void {
  for (const [key, window] of windows) {
    if (nowMs - window.startedAt >= windowMs) windows.delete(key);
  }
}

export function createRateLimiter(options: RateLimiterOptions): RateLimiter {
  const windows = new Map<string, Window>();

  return {
    check(key: string, nowMs: number): RateLimitDecision {
      if (windows.size > MAX_WINDOWS) evictExpired(windows, nowMs, options.windowMs);

      const existing = windows.get(key);
      const window =
        existing === undefined || nowMs - existing.startedAt >= options.windowMs
          ? { startedAt: nowMs, count: 0 }
          : existing;

      window.count += 1;
      windows.set(key, window);

      if (window.count > options.max) {
        const remainingMs = window.startedAt + options.windowMs - nowMs;
        return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil(remainingMs / 1000)) };
      }
      return { allowed: true, retryAfterSeconds: 0 };
    },
  };
}
