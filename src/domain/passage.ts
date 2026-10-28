/**
 * The unit of the knowledge base (Task 2).
 *
 * `passageId` is a pure function of the norm and the block, so a passage keeps
 * the same identity across runs, processes and re-syncs. Construction returns an
 * error value for every rejection: nothing here throws for bad input.
 *
 * Spec 004: a passage carries the provenance a citation renders — publisher,
 * jurisdiction and the source's own update date. Publisher and jurisdiction are
 * read from the registry entry for the norm, never passed in by a parser, so a
 * passage cannot disagree with the norm it belongs to.
 */

import { findAllowedNorm, isAllowedNorm } from './allowed-norms';
import type { Jurisdiction, Publisher } from './source';

export interface Passage {
  readonly normId: string;
  readonly normTitle: string;
  readonly blockId: string;
  readonly blockTitle: string;
  readonly articleLabel: string;
  readonly text: string;
  readonly sourceUrl: string;
  readonly publisher: Publisher;
  readonly jurisdiction: Jurisdiction;
  readonly updatedAt: string;
  readonly fetchedAt: string;
  readonly passageId: string;
}

export type PassageError =
  | 'empty_text'
  | 'empty_block_id'
  | 'unsupported_norm'
  | 'invalid_source_url'
  | 'invalid_updated_at'
  | 'invalid_fetched_at';

export type PassageResult =
  | { readonly ok: true; readonly passage: Passage }
  | { readonly ok: false; readonly error: PassageError };

export type PassageCollectionResult =
  | { readonly ok: true; readonly passages: readonly Passage[] }
  | { readonly ok: false; readonly error: 'duplicate_passage_id' };

export interface PassageInput {
  readonly normId: string;
  readonly normTitle: string;
  readonly blockId: string;
  readonly blockTitle: string;
  readonly articleLabel?: string;
  readonly text: string;
  readonly sourceUrl: string;
  readonly updatedAt: string;
  readonly fetchedAt: string;
}

/** The corpus's two date encodings, shared with the artifact validator. */
export const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;
export const UTC_TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;

export function passageIdOf(normId: string, blockId: string): string {
  return `${normId}#${blockId}`;
}

/**
 * The inverse of `passageIdOf`: the norm a passage id belongs to. Block ids in
 * the BOE consolidated text never contain `#`, and every id this codebase builds
 * goes through `passageIdOf`, so the first separator is the boundary.
 */
export function normIdOfPassageId(passageId: string): string {
  const separator = passageId.indexOf('#');
  return separator === -1 ? passageId : passageId.slice(0, separator);
}

function isHttpsUrl(value: string): boolean {
  if (!value.startsWith('https://')) return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname !== '';
  } catch {
    return false;
  }
}

type Rule = (input: PassageInput) => PassageError | null;

/**
 * Validation rules in a fixed order, so a passage breaking several rules always
 * reports the same error: text, block id, norm, source URL, then the timestamps.
 */
const RULES: readonly Rule[] = [
  (input) => (input.text.trim() === '' ? 'empty_text' : null),
  (input) => (input.blockId.trim() === '' ? 'empty_block_id' : null),
  (input) => (isAllowedNorm(input.normId) ? null : 'unsupported_norm'),
  (input) => (isHttpsUrl(input.sourceUrl) ? null : 'invalid_source_url'),
  (input) => (DATE_ONLY.test(input.updatedAt) ? null : 'invalid_updated_at'),
  (input) => (UTC_TIMESTAMP.test(input.fetchedAt) ? null : 'invalid_fetched_at'),
];

function firstError(input: PassageInput): PassageError | null {
  for (const rule of RULES) {
    const error = rule(input);
    if (error !== null) return error;
  }
  return null;
}

function articleLabelOf(input: PassageInput): string {
  const declared = input.articleLabel?.trim() ?? '';
  return declared === '' ? input.blockTitle : declared;
}

export function createPassage(input: PassageInput): PassageResult {
  const error = firstError(input);
  if (error !== null) return { ok: false, error };

  const norm = findAllowedNorm(input.normId);
  if (norm === undefined) return { ok: false, error: 'unsupported_norm' };

  return {
    ok: true,
    passage: {
      normId: input.normId,
      normTitle: input.normTitle,
      blockId: input.blockId,
      blockTitle: input.blockTitle,
      articleLabel: articleLabelOf(input),
      text: input.text.trim(),
      sourceUrl: input.sourceUrl,
      publisher: norm.publisher,
      jurisdiction: norm.jurisdiction,
      updatedAt: input.updatedAt,
      fetchedAt: input.fetchedAt,
      passageId: passageIdOf(input.normId, input.blockId),
    },
  };
}

/** Passage equality is identity equality: same `passageId` means the same passage. */
export function passagesEqual(left: Passage, right: Passage): boolean {
  return left.passageId === right.passageId;
}

/**
 * The first repeated `passageId`, or `null` when every id is unique. A duplicate
 * is refused, never silently overwritten: dropping a passage would shrink the
 * corpus without anyone noticing.
 */
export function findDuplicatePassageId(passages: readonly Passage[]): string | null {
  const seen = new Set<string>();
  for (const passage of passages) {
    if (seen.has(passage.passageId)) return passage.passageId;
    seen.add(passage.passageId);
  }
  return null;
}

export function buildPassageCollection(passages: readonly Passage[]): PassageCollectionResult {
  if (findDuplicatePassageId(passages) !== null)
    return { ok: false, error: 'duplicate_passage_id' };
  return { ok: true, passages };
}
