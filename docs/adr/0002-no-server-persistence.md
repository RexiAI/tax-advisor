# ADR 0002 — No server-side persistence in v1

## Context

The product answers questions about personal income tax, which means users type things they
believe are private. The one thing the server genuinely needs to remember is small: whether a
conversation has already used its single clarifying question. Everything else — the question,
the answer, the retrieved passages — is derived per request from the committed corpus and the
model call.

The deployment target is a serverless/edge-style host where instances are ephemeral and can be
frozen or replaced at any time.

## Decision

v1 stores nothing durable. There is no database, no cache service, no filesystem write, and no
log of user content.

The rationale is data minimisation: what is never written cannot be leaked, subpoenaed,
retained past its purpose, or exported by mistake. A tax question contains personal
circumstances by nature, so the cheapest correct answer is to keep none of it.

- The only server-side state is an injected in-memory conversation store holding a
  clarification flag per client-supplied `conversationId`, bounded by a TTL and a maximum
  entry count (`src/service/conversation-store.ts`).
- The structured log line carries counters and a random request identifier only — no message,
  answer, question, or client IP (`src/observability/log.ts`).
- Quotes, refusals and clarifications are rendered from the response payload the request
  produced; the client holds the thread.

## Alternatives considered

- **Persist conversations in a database.** Rejected: it would create a store of tax questions
  and personal circumstances that the product does not need to answer, turning a stateless
  explainer into a data controller with retention, deletion and breach obligations. The
  product's value does not depend on remembering earlier turns.
- **Persist in a cache with a short TTL (Redis or similar).** Rejected for the same reason at
  smaller scale: a short retention window is still retention, and it adds an operational
  dependency for state that is one boolean per conversation.
- **Persist nothing at all, including the clarification flag.** Rejected: without the flag the
  service cannot enforce "at most one clarifying question per conversation", which is an
  acceptance requirement. The flag is the minimum state that satisfies it.
- **Cookie-based session state.** Rejected: it moves the same data to the client, where it is
  readable and replayable, without removing the need for a server-side cap.

## Consequences

- Restarting or scaling out loses clarification continuity: a different instance does not know
  the conversation already asked a question. This is documented in `docs/RUNBOOK.md` and the
  UI never promises continuity.
- The rate limiter is likewise per instance (fixed window, in-process), so a cold start resets
  the counter. The 429 copy promises only the `Retry-After` interval it is given.
- Deleting a deployment deletes all state the product ever held. There is no export, no
  deletion request, and no retention policy to maintain.
- Log-based debugging is limited to counters and identifiers. That is accepted: the product
  cannot debug individual questions from its own logs, by design.

## Sources

- BOE consolidated text of Ley 35/2006 (the corpus this service explains):
  <https://www.boe.es/buscar/act.php?id=BOE-A-2006-20764>
- Repository standards: `docs/SECURITY.md` (secrets, log redaction) and `docs/OBSERVABILITY.md`
  in the engineering standards this repository consumes.
