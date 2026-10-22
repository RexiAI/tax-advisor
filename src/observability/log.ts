/**
 * Structured logging (Task 12). One serializer, one whitelist: the record can only
 * ever carry operational counters and a random request identifier, so a message,
 * an answer, or a client IP cannot reach the log line even by accident.
 */

import { randomUUID } from 'node:crypto';

export type CitationValidationStatus = 'pass' | 'fail' | 'insufficient' | 'not_applicable';

export interface LogRecord {
  readonly requestId: string;
  readonly route: string;
  readonly latencyMs: number;
  readonly firstTokenMs: number;
  readonly promptTokens: number;
  readonly completionTokens: number;
  readonly retrievalHitCount: number;
  readonly citationValidation: CitationValidationStatus;
  readonly status: string;
}

export type LogSink = (line: string) => void;

const FIELD_ORDER: readonly (keyof LogRecord)[] = [
  'requestId',
  'route',
  'latencyMs',
  'firstTokenMs',
  'promptTokens',
  'completionTokens',
  'retrievalHitCount',
  'citationValidation',
  'status',
];

/** The single serializer: only whitelisted keys are copied into the output. */
export function serializeLogRecord(record: LogRecord): string {
  const serialized: Record<string, string | number> = {};
  for (const field of FIELD_ORDER) {
    serialized[field] = record[field];
  }
  return JSON.stringify(serialized);
}

export function newRequestId(): string {
  return randomUUID();
}

export function statusForResponseKind(kind: string): string {
  return kind === 'answer' ? 'ok' : kind;
}
