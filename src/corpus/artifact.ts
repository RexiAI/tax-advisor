/**
 * The committed corpus artifact (Task 4): provenance, a content hash, the
 * declared coverage and the passages themselves. The artifact is a build-time
 * product; nothing at request time writes it.
 *
 * Schema v1 recorded a single BOE shape. Schema v2 (spec 004) carries the
 * publisher, the jurisdiction and the authority that supplied each text, plus
 * the declared coverage matrix. The parser rejects v1 outright: a v1 artifact has
 * no provenance to render and no coverage to consult, so admitting it would ship
 * a citation that cannot say where it came from.
 */

import { createHash } from 'node:crypto';

import { parseCoverage, type CoveragePair } from '../domain/coverage';
import type { Passage } from '../domain/passage';
import { DATE_ONLY, UTC_TIMESTAMP } from '../domain/passage';
import { isJurisdiction, isPublisher, type Jurisdiction, type Publisher } from '../domain/source';

export const CORPUS_SCHEMA_VERSION = 2;
export const CORPUS_ARTIFACT_PATH = 'corpus/corpus.json';

export { BOE_LICENSE_NOTE } from '../domain/source';

export interface CorpusNorm {
  readonly normId: string;
  readonly normTitle: string;
  readonly publisher: Publisher;
  readonly jurisdiction: Jurisdiction;
  readonly authorityUsed: Publisher;
  readonly officialId: string;
  readonly sourceUrl: string;
  readonly updatedAt: string;
  readonly fetchedAt: string;
  readonly licenseNote: string;
}

export interface CorpusArtifact {
  readonly schemaVersion: number;
  readonly taxYear: number;
  readonly generatedAt: string;
  readonly contentHash: string;
  readonly coverage: readonly CoveragePair[];
  readonly norms: readonly CorpusNorm[];
  readonly passages: readonly Passage[];
}

/** Everything the content hash covers: provenance, coverage and the passages. */
export interface CorpusHashInput {
  readonly coverage: readonly CoveragePair[];
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

/**
 * The hash covers the norms (including every provenance field), the declared
 * coverage and the passages. `generatedAt` is excluded by construction: it is
 * not in the hashed value.
 */
export function contentHashOf(input: CorpusHashInput): string {
  return createHash('sha256')
    .update(
      canonicalJson({
        coverage: input.coverage,
        norms: input.norms,
        passages: input.passages,
      }),
      'utf8'
    )
    .digest('hex');
}

/** `YYYY-MM-DDTHH:MM:SSZ`, the artifact timestamp format. */
export function toIsoUtcSeconds(date: Date): string {
  return date.toISOString().replace(/\.\d{3}Z$/, 'Z');
}

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim() !== '';
}

function isDateOnly(value: unknown): boolean {
  return typeof value === 'string' && DATE_ONLY.test(value);
}

function isUtcTimestamp(value: unknown): boolean {
  return typeof value === 'string' && UTC_TIMESTAMP.test(value);
}

function allTruthy(...checks: readonly boolean[]): boolean {
  return checks.every((check) => check);
}

function allEntriesValid(values: readonly unknown[], isValid: (value: unknown) => boolean): boolean {
  return values.every(isValid);
}

function normIsValid(value: unknown): boolean {
  if (!isObject(value)) return false;
  return allTruthy(
    isNonEmptyString(value.normId),
    isNonEmptyString(value.normTitle),
    isPublisher(value.publisher),
    isJurisdiction(value.jurisdiction),
    isPublisher(value.authorityUsed),
    isNonEmptyString(value.officialId),
    isNonEmptyString(value.sourceUrl),
    isDateOnly(value.updatedAt),
    isUtcTimestamp(value.fetchedAt),
    isNonEmptyString(value.licenseNote)
  );
}

function passageIsValid(value: unknown): boolean {
  if (!isObject(value)) return false;
  return allTruthy(
    isNonEmptyString(value.passageId),
    isNonEmptyString(value.normId),
    isNonEmptyString(value.normTitle),
    isNonEmptyString(value.blockId),
    isNonEmptyString(value.blockTitle),
    isNonEmptyString(value.articleLabel),
    isNonEmptyString(value.text),
    isNonEmptyString(value.sourceUrl),
    isPublisher(value.publisher),
    isJurisdiction(value.jurisdiction),
    isDateOnly(value.updatedAt),
    isUtcTimestamp(value.fetchedAt)
  );
}

function looksLikeArtifact(value: unknown): value is Record<string, unknown> {
  if (!isObject(value)) return false;
  return allTruthy(
    value.schemaVersion === CORPUS_SCHEMA_VERSION,
    typeof value.taxYear === 'number',
    typeof value.generatedAt === 'string',
    typeof value.contentHash === 'string',
    Array.isArray(value.coverage),
    Array.isArray(value.norms),
    Array.isArray(value.passages)
  );
}

function parseJsonObject(raw: string): Record<string, unknown> | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    return isObject(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function parseArtifactObject(parsed: Record<string, unknown>): CorpusArtifactResult {
  if (!looksLikeArtifact(parsed)) return { ok: false, error: 'unparsable' };
  if (parseCoverage(parsed.coverage) === null) return { ok: false, error: 'unparsable' };

  const norms = parsed.norms as readonly unknown[];
  if (!allEntriesValid(norms, normIsValid)) return { ok: false, error: 'unparsable' };

  const passages = parsed.passages as readonly unknown[];
  if (!allEntriesValid(passages, passageIsValid)) return { ok: false, error: 'unparsable' };
  if (passages.length === 0) return { ok: false, error: 'empty' };

  // The validators above prove every field the typed shape needs; the cast
  // records that proof rather than re-deriving it.
  return { ok: true, artifact: parsed as unknown as CorpusArtifact };
}

export function parseCorpusArtifact(raw: string): CorpusArtifactResult {
  if (raw.trim() === '') return { ok: false, error: 'empty' };
  const parsed = parseJsonObject(raw);
  if (parsed === null) return { ok: false, error: 'unparsable' };
  return parseArtifactObject(parsed);
}
