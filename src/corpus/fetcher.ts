/**
 * The boundary between the sync script and the BOE (Task 4). Production uses the
 * real client; tests inject a fake. Nothing else in the codebase talks to BOE.
 */

export type FetchedXml = { readonly ok: true; readonly xml: string } | { readonly ok: false; readonly error: string };

export type FetchedUpdate =
  | { readonly ok: true; readonly fechaActualizacion: string }
  | { readonly ok: false; readonly error: string };

export interface CorpusFetcher {
  /** BOE's `fecha_actualizacion` for the norm, in `YYYY-MM-DD`. */
  getLastUpdated(normId: string): Promise<FetchedUpdate>;
  /** The norm's consolidated-text XML document. */
  fetchNormXml(normId: string): Promise<FetchedXml>;
}
