/**
 * The boundary between an adapter and its publisher. Production uses a real
 * client; tests inject a fake. Nothing else in the codebase talks to a bulletin.
 *
 * Spec 004 generalized the old BOE-only shape: a document is a string (XML, JSON
 * or HTML — the adapter owns the shape) and the update is the source's own date.
 */

export type FetchedDocument =
  | { readonly ok: true; readonly document: string }
  | { readonly ok: false; readonly error: string };

export type FetchedUpdate =
  | { readonly ok: true; readonly updatedAt: string }
  | { readonly ok: false; readonly error: string };

export interface CorpusFetcher {
  /** The publisher's own last-update date for the norm, in `YYYY-MM-DD`. */
  getLastUpdated(normId: string): Promise<FetchedUpdate>;
  /** The norm's document, in whatever shape the publisher serves. */
  fetchDocument(normId: string): Promise<FetchedDocument>;
}

/**
 * The one HTTP request shape every publisher adapter uses: an XML `accept` header,
 * the status in the error message, the transport failure as its own message. An
 * adapter owns its URLs and document format; the contract on failure is shared, so
 * it lives here rather than once per adapter.
 */
export async function fetchXmlDocument(
  url: string,
  normId: string,
  fetchImpl: typeof fetch
): Promise<FetchedDocument> {
  try {
    const response = await fetchImpl(url, { headers: { accept: 'application/xml' } });
    if (!response.ok) return { ok: false, error: `HTTP ${response.status} for ${normId}` };
    return { ok: true, document: await response.text() };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'fetch failed' };
  }
}
