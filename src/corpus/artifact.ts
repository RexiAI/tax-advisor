/**
 * The committed corpus artifact (Task 4): provenance, a content hash and the
 * passages themselves. The artifact is a build-time product; nothing at request
 * time writes it.
 */

import { createHash } from 'node:crypto';

import type { Passage } from '../domain/passage';

export const CORPUS_SCHEMA_VERSION = 1;
export const CORPUS_ARTIFACT_PATH = 'corpus/corpus.json';

export const BOE_LICENSE_NOTE =
  'Reutilización de textos del BOE: se cita la fuente (BOE), no se altera el sentido del texto y no se sugiere que el BOE respalde este producto.';

export interface CorpusNorm {
  readonly normId: string;
  readonly normTitle: string;
  readonly sourceUrl: string;
  readonly boeUpdatedAt: string;
  readonly fetchedAt: string;
  readonly licenseNote: string;
}

export interface CorpusArtifact {
  readonly schemaVersion: number;
  readonly taxYear: number;
  readonly generatedAt: string;
  readonly contentHash: string;
  readonly norms: readonly CorpusNorm[];
  readonly passages: readonly Passage[];
}

export type CorpusArtifactError = 'missing' | 'empty' | 'unparsable';

export type CorpusArtifactResult =
  | { readonly ok: true; readonly artifact: CorpusArtifact }
  | { readonly ok: false; readonly error: CorpusArtifactError };

/**
 * Canonical JSON: keys sorted at every level, arrays kept in their existing
 * order. `generatedAt` is not part of the hashed value, so re-running a sync
 * against unchanged data produces the same hash.
 */
export function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (value !== null && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, entryValue]) => entryValue !== undefined)
      .sort(([left], [right]) => (left < right ? -1 : 1));
    const rendered = entries.map(([key, entryValue]) => `${JSON.stringify(key)}:${canonicalJson(entryValue)}`);
    return `{${rendered.join(',')}}`;
  }
  return JSON.stringify(value);
}

export function contentHashOf(passages: readonly Passage[]): string {
  return createHash('sha256').update(canonicalJson(passages), 'utf8').digest('hex');
}

/** `YYYY-MM-DDTHH:MM:SSZ`, the artifact timestamp format. */
export function toIsoUtcSeconds(date: Date): string {
  return date.toISOString().replace(/\.\d{3}Z$/, 'Z');
}

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function looksLikeArtifact(value: Record<string, unknown>): boolean {
  return (
    typeof value.schemaVersion === 'number' &&
    typeof value.taxYear === 'number' &&
    typeof value.generatedAt === 'string' &&
    typeof value.contentHash === 'string' &&
    Array.isArray(value.norms) &&
    Array.isArray(value.passages)
  );
}

export function parseCorpusArtifact(raw: string): CorpusArtifactResult {
  if (raw.trim() === '') return { ok: false, error: 'empty' };

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, error: 'unparsable' };
  }

  if (!isObject(parsed) || !looksLikeArtifact(parsed)) return { ok: false, error: 'unparsable' };
  const passages = parsed.passages as readonly Passage[];
  if (passages.length === 0) return { ok: false, error: 'empty' };

  return { ok: true, artifact: parsed as unknown as CorpusArtifact };
}
