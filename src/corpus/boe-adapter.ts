/**
 * The BOE source adapter (spec 004, Task 4).
 *
 * The old `CorpusFetcher` plus the consolidated-text parser, behind the
 * `SourceAdapter` interface. Behaviour is unchanged: the update date comes from
 * the metadata resource and the document from the text resource, and the parser
 * is the one the eight state norms have always used.
 */

import type { AllowedNorm } from '../domain/allowed-norms';
import { createBoeFetcher } from './boe-fetcher';
import type { CorpusFetcher } from './fetcher';
import { parseConsolidatedXml } from './parse-consolidated-xml';
import type {
  SourceAdapter,
  SourceParseMeta,
  SourceParseResult,
} from './source-adapter';

export interface BoeAdapterOptions {
  readonly fetchImpl?: typeof fetch;
  /** Inject a fake fetcher (tests); production builds the real one. */
  readonly fetcher?: CorpusFetcher;
}

export function createBoeAdapter(options: BoeAdapterOptions = {}): SourceAdapter {
  const fetcher =
    options.fetcher ??
    createBoeFetcher(options.fetchImpl === undefined ? {} : { fetchImpl: options.fetchImpl });

  return {
    publisher: 'boe',
    getLastUpdated: (norm: AllowedNorm) => fetcher.getLastUpdated(norm.normId),
    fetchDocument: (norm: AllowedNorm) => fetcher.fetchDocument(norm.normId),
    sourceUrl: (norm: AllowedNorm) => norm.sourceUrl,
    parse: (document: string, meta: SourceParseMeta): SourceParseResult =>
      parseConsolidatedXml(document, {
        normId: meta.norm.normId,
        normTitle: meta.norm.normTitle,
        updatedAt: meta.updatedAt,
        fetchedAt: meta.fetchedAt,
      }),
  };
}
