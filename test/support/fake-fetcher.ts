/**
 * Fake `CorpusFetcher` (Task 4): serves committed fixture documents and counts
 * document fetches separately from metadata reads, so an unchanged corpus can be
 * asserted to cost zero fetches.
 */

import { createBoeAdapter } from '@/corpus/boe-adapter';
import type { CorpusFetcher, FetchedDocument, FetchedUpdate } from '@/corpus/fetcher';
import type { SourceAdapter } from '@/corpus/source-adapter';

export interface FakeDocument {
  readonly document: string;
  readonly updatedAt: string;
}

export class FakeCorpusFetcher implements CorpusFetcher {
  fetchCount = 0;
  metadataCount = 0;
  readonly fetchedNormIds: string[] = [];

  constructor(private readonly documents: Record<string, FakeDocument>) {}

  async getLastUpdated(normId: string): Promise<FetchedUpdate> {
    this.metadataCount += 1;
    const document = this.documents[normId];
    if (document === undefined) return { ok: false, error: `unknown norm ${normId}` };
    return { ok: true, updatedAt: document.updatedAt };
  }

  async fetchDocument(normId: string): Promise<FetchedDocument> {
    this.fetchCount += 1;
    this.fetchedNormIds.push(normId);
    const document = this.documents[normId];
    if (document === undefined) return { ok: false, error: `unknown norm ${normId}` };
    return { ok: true, document: document.document };
  }

  replaceDocument(normId: string, document: string, updatedAt: string): void {
    this.documents[normId] = { document, updatedAt };
  }
}

/** The BOE adapter backed by a fake fetcher, for sync tests. */
export function fakeBoeAdapter(fetcher: CorpusFetcher = new FakeCorpusFetcher({})): SourceAdapter {
  return createBoeAdapter({ fetcher });
}
