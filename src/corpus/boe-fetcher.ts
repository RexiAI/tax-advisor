/**
 * Production `CorpusFetcher` (Task 4) — the only module in the codebase that
 * talks to BOE.
 *
 * BOE publishes consolidated legislation through its open-data API: a norm's
 * metadata (including `fecha_actualizacion`, which drives the incremental sync)
 * and its text (the `bloque`/`version` document the parser consumes) are separate
 * resources. Metadata is cheap and always fetched; the text is only fetched when
 * the update date says it changed.
 *
 * If BOE changes these two resources, this module is the single place to adapt —
 * see `docs/RUNBOOK.md` §BOE changed / parsing broke.
 */

import { textOfFirstElement } from './xml';

import type { CorpusFetcher, FetchedDocument, FetchedUpdate } from './fetcher';
import { fetchXmlDocument } from './fetcher';

export const BOE_CONSOLIDATED_API =
  'https://www.boe.es/datosabiertos/api/legislacion-consolidada';

export function metadatosUrl(normId: string): string {
  return `${BOE_CONSOLIDATED_API}/id/${encodeURIComponent(normId)}/metadatos`;
}

export function textoUrl(normId: string): string {
  return `${BOE_CONSOLIDATED_API}/id/${encodeURIComponent(normId)}/texto`;
}

/** Reads `<fecha_actualizacion>` out of the metadata document. */
export function readFechaActualizacion(xml: string): string | undefined {
  return textOfFirstElement(xml, 'fecha_actualizacion');
}

const DASHED_DATE = /^(\d{4})-(\d{2})-(\d{2})(?:$|[T\s])/;
/** The live BOE metadata form: `20261007T095616Z`. */
const COMPACT_TIMESTAMP = /^(\d{4})(\d{2})(\d{2})(?:T\d{6}Z)?$/;

function isCalendarDate(month: string, day: string): boolean {
  return Number(month) >= 1 && Number(month) <= 12 && Number(day) >= 1 && Number(day) <= 31;
}

function isoDate(year: string, month: string, day: string): string | undefined {
  if (!isCalendarDate(month, day)) return undefined;
  return `${year}-${month}-${day}`;
}

/**
 * The corpus records a calendar date, so both BOE forms normalise to
 * `YYYY-MM-DD`: the dashed form (`2026-03-17`, optionally with a timestamp) and
 * the compact one the live metadata endpoint actually returns
 * (`20261007T095616Z`). Anything unparsable returns `undefined` rather than a
 * guessed date.
 */
export function normalizeBoeDate(value: string): string | undefined {
  const trimmed = value.trim();

  const dashed = DASHED_DATE.exec(trimmed);
  if (dashed !== null) return isoDate(dashed[1] as string, dashed[2] as string, dashed[3] as string);

  const compact = COMPACT_TIMESTAMP.exec(trimmed);
  if (compact !== null) {
    return isoDate(compact[1] as string, compact[2] as string, compact[3] as string);
  }

  return undefined;
}

export interface BoeFetcherOptions {
  readonly fetchImpl?: typeof fetch;
}

export function createBoeFetcher(options: BoeFetcherOptions = {}): CorpusFetcher {
  const fetchImpl = options.fetchImpl ?? ((input, init) => globalThis.fetch(input, init));

  const fetchDocument = (normId: string, url: string): Promise<FetchedDocument> =>
    fetchXmlDocument(url, normId, fetchImpl);

  return {
    async getLastUpdated(normId: string): Promise<FetchedUpdate> {
      const document = await fetchDocument(normId, metadatosUrl(normId));
      if (!document.ok) return document;

      const raw = readFechaActualizacion(document.document);
      const updatedAt = raw === undefined ? undefined : normalizeBoeDate(raw);
      if (updatedAt === undefined) {
        return { ok: false, error: `fecha_actualizacion missing for ${normId}` };
      }
      return { ok: true, updatedAt };
    },
    fetchDocument: (normId: string) => fetchDocument(normId, textoUrl(normId)),
  };
}
