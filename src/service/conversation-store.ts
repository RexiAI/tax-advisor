/**
 * In-memory conversation state (Task 10 / Task 12).
 *
 * The only thing stored is whether a conversation has already used its one
 * clarifying question. No message text, no answer text: there is nothing to leak
 * because nothing is kept. Entries expire on a TTL and the store is bounded.
 */

export interface ConversationStore {
  hasClarified(conversationId: string): boolean;
  markClarified(conversationId: string): void;
  size(): number;
}

export interface ConversationStoreOptions {
  readonly ttlMs?: number;
  readonly maxEntries?: number;
  readonly now?: () => number;
}

export const CONVERSATION_TTL_MS = 30 * 60 * 1000;
export const CONVERSATION_MAX_ENTRIES = 1000;

interface Entry {
  readonly clarifiedAt: number;
}

export function createConversationStore(options: ConversationStoreOptions = {}): ConversationStore {
  const ttlMs = options.ttlMs ?? CONVERSATION_TTL_MS;
  const maxEntries = options.maxEntries ?? CONVERSATION_MAX_ENTRIES;
  const now = options.now ?? (() => Date.now());
  const entries = new Map<string, Entry>();

  function evictExpired(): void {
    const current = now();
    for (const [id, entry] of entries) {
      if (current - entry.clarifiedAt >= ttlMs) entries.delete(id);
    }
    while (entries.size > maxEntries) {
      const oldest = entries.keys().next();
      if (oldest.done === true) return;
      entries.delete(oldest.value);
    }
  }

  return {
    hasClarified(conversationId: string): boolean {
      evictExpired();
      return entries.has(conversationId);
    },
    markClarified(conversationId: string): void {
      evictExpired();
      entries.set(conversationId, { clarifiedAt: now() });
    },
    size(): number {
      evictExpired();
      return entries.size;
    },
  };
}
