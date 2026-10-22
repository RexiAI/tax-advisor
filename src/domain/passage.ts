/**
 * The unit of the knowledge base (Task 2).
 *
 * `passageId` is a pure function of the norm and the block, so a passage keeps
 * the same identity across runs, processes and re-syncs. Construction returns an
 * error value for every rejection: nothing here throws for bad input.
 */

import { isAllowedNorm } from './allowed-norms';

export interface Passage {
  readonly normId: string;
  readonly normTitle: string;
  readonly blockId: string;
  readonly blockTitle: string;
  readonly articleLabel: string;
  readonly text: string;
  readonly sourceUrl: string;
  readonly boeUpdatedAt: string;
  readonly fetchedAt: string;
  readonly passageId: string;
}

export type PassageError =
  | 'empty_text'
  | 'empty_block_id'
  | 'unsupported_norm'
  | 'invalid_source_url'
  | 'invalid_boe_updated_at'
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
  readonly boeUpdatedAt: string;
  readonly fetchedAt: string;
}

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;
const UTC_TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;

export function passageIdOf(normId: string, blockId: string): string {
  return `${normId}#${blockId}`;
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
  (input) => (DATE_ONLY.test(input.boeUpdatedAt) ? null : 'invalid_boe_updated_at'),
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
      boeUpdatedAt: input.boeUpdatedAt,
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
