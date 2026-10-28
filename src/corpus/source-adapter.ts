/**
 * The source-adapter interface (spec 004, Task 4).
 *
 * The sync dispatches each registry entry to the adapter for the publisher that
 * supplied its consolidated text (`authorityUsed`), so a BOE-supplied regional
 * norm and a bulletin-supplied one can coexist. An adapter owns three things:
 * where the norm's page is, when the publisher last updated the text, and how
 * that publisher's document becomes passages.
 */

import type { AllowedNorm } from '../domain/allowed-norms';
import type { Passage, PassageError } from '../domain/passage';
import type { Publisher } from '../domain/source';

import type { FetchedDocument, FetchedUpdate } from './fetcher';

export type SkipReason = 'non_normative_block' | 'empty_text' | 'invalid_metadata';

export interface SkippedBlock {
  readonly blockId: string;
  readonly reason: SkipReason;
}

/**
 * Which skip reason a rejected passage reports. Every adapter's parser maps the
 * passage's own error codes, so the mapping lives on the contract both parsers
 * answer to rather than once per parser.
 */
const SKIP_REASON_BY_PASSAGE_ERROR: Readonly<Record<PassageError, SkipReason>> = {
  empty_text: 'empty_text',
  empty_block_id: 'invalid_metadata',
  unsupported_norm: 'invalid_metadata',
  invalid_source_url: 'invalid_metadata',
  invalid_updated_at: 'invalid_metadata',
  invalid_fetched_at: 'invalid_metadata',
};

export function skipReasonFor(error: PassageError): SkipReason {
  return SKIP_REASON_BY_PASSAGE_ERROR[error];
}

export interface SourceParseMeta {
  readonly norm: AllowedNorm;
  /** The source's own update date, `YYYY-MM-DD`. */
  readonly updatedAt: string;
  /** `YYYY-MM-DDTHH:MM:SSZ`, supplied by the caller so a parse reads no clock. */
  readonly fetchedAt: string;
}

export type SourceParseResult =
  | {
      readonly ok: true;
      readonly passages: readonly Passage[];
      readonly skipped: readonly SkippedBlock[];
    }
  | { readonly ok: false; readonly error: 'unparsable' };

export interface SourceAdapter {
  /** The publisher whose text this adapter reads. */
  readonly publisher: Publisher;
  getLastUpdated(norm: AllowedNorm): Promise<FetchedUpdate>;
  fetchDocument(norm: AllowedNorm): Promise<FetchedDocument>;
  /** The official URL the adapter's document came from. */
  sourceUrl(norm: AllowedNorm): string;
  parse(document: string, meta: SourceParseMeta): SourceParseResult;
}

export function adapterFor(
  adapters: readonly SourceAdapter[],
  publisher: Publisher
): SourceAdapter | undefined {
  return adapters.find((adapter) => adapter.publisher === publisher);
}
