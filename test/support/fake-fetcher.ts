/**
 * Fake `CorpusFetcher` (Task 4): serves committed fixture documents and counts
 * document fetches separately from metadata reads, so an unchanged corpus can be
 * asserted to cost zero fetches.
 */

import type { CorpusFetcher, FetchedUpdate, FetchedXml } from '@/corpus/fetcher';

export interface FakeDocument {
  readonly xml: string;
  readonly fechaActualizacion: string;
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
    return { ok: true, fechaActualizacion: document.fechaActualizacion };
  }

  async fetchNormXml(normId: string): Promise<FetchedXml> {
    this.fetchCount += 1;
    this.fetchedNormIds.push(normId);
    const document = this.documents[normId];
    if (document === undefined) return { ok: false, error: `unknown norm ${normId}` };
    return { ok: true, xml: document.xml };
  }

  replaceXml(normId: string, xml: string, fechaActualizacion: string): void {
    this.documents[normId] = { xml, fechaActualizacion };
  }
}
