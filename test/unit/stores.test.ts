import { describe, expect, it } from 'vitest';

import { createConversationStore } from '@/service/conversation-store';
import { createRateLimiter } from '@/service/rate-limit';

describe('createRateLimiter', () => {
  it('allows exactly `max` requests in a window and then denies', () => {
    const limiter = createRateLimiter({ max: 3, windowMs: 1000 });

    expect(limiter.check('ip', 0).allowed).toBe(true);
    expect(limiter.check('ip', 1).allowed).toBe(true);
    expect(limiter.check('ip', 2).allowed).toBe(true);
    expect(limiter.check('ip', 3).allowed).toBe(false);
  });

  it('reports the remaining window in whole seconds, at least one', () => {
    const limiter = createRateLimiter({ max: 1, windowMs: 60_000 });
    limiter.check('ip', 0);
    const denied = limiter.check('ip', 30_500);
    expect(denied.allowed).toBe(false);
    expect(denied.retryAfterSeconds).toBe(30);

    const almost = createRateLimiter({ max: 1, windowMs: 60_000 });
    almost.check('ip', 0);
    expect(almost.check('ip', 59_999).retryAfterSeconds).toBe(1);
  });

  it('resets when the window boundary is reached', () => {
    const limiter = createRateLimiter({ max: 1, windowMs: 1000 });
    limiter.check('ip', 0);
    expect(limiter.check('ip', 999).allowed).toBe(false);
    expect(limiter.check('ip', 1000).allowed).toBe(true);
  });

  it('counts each key independently', () => {
    const limiter = createRateLimiter({ max: 1, windowMs: 1000 });
    expect(limiter.check('a', 0).allowed).toBe(true);
    expect(limiter.check('b', 0).allowed).toBe(true);
    expect(limiter.check('a', 1).allowed).toBe(false);
  });
});

describe('createConversationStore', () => {
  it('remembers only that a conversation clarified once', () => {
    const store = createConversationStore({ now: () => 0 });
    expect(store.hasClarified('c1')).toBe(false);
    store.markClarified('c1');
    expect(store.hasClarified('c1')).toBe(true);
    expect(store.size()).toBe(1);
  });

  it('evicts an entry once its TTL has passed', () => {
    let now = 0;
    const store = createConversationStore({ ttlMs: 1000, now: () => now });
    store.markClarified('c1');

    now = 999;
    expect(store.hasClarified('c1')).toBe(true);
    now = 1000;
    expect(store.hasClarified('c1')).toBe(false);
  });

  it('keeps at most the configured number of entries, dropping the oldest', () => {
    let now = 0;
    const store = createConversationStore({ ttlMs: 10_000, maxEntries: 2, now: () => now });

    store.markClarified('c1');
    now += 1;
    store.markClarified('c2');
    now += 1;
    store.markClarified('c3');

    expect(store.size()).toBe(2);
    expect(store.hasClarified('c1')).toBe(false);
    expect(store.hasClarified('c3')).toBe(true);
  });
});
