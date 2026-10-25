/**
 * Incremental, idempotent corpus sync (Task 4).
 *
 * A norm is re-fetched only when the BOE reports a newer `fecha_actualizacion`
 * than the previously committed artifact records; otherwise its passages and its
 * `fetchedAt` are carried over untouched. A failed parse stops the whole sync, so
 * a broken document can never ship a shrunken corpus.
 */

import { ALLOWED_NORMS } from '../domain/allowed-norms';
import type { Passage } from '../domain/passage';

import {
  BOE_LICENSE_NOTE,
  CORPUS_SCHEMA_VERSION,
  contentHashOf,
  type CorpusArtifact,
  type CorpusNorm,
} from './artifact';
import type { CorpusFetcher } from './fetcher';
import { boeSourceUrl, parseConsolidatedXml } from './parse-consolidated-xml';

export interface SyncInput {
  readonly fetcher: CorpusFetcher;
  readonly previous: CorpusArtifact | null;
  /** `YYYY-MM-DDTHH:MM:SSZ`, supplied by the caller so the sync reads no clock. */
  readonly generatedAt: string;
  readonly taxYear: number;
}

export interface SyncSuccess {
  readonly ok: true;
  readonly artifact: CorpusArtifact;
  readonly fetchedNormIds: readonly string[];
  readonly reusedNormIds: readonly string[];
}

export type SyncFailure =
  | {
      readonly ok: false;
      readonly error: 'fetch_failed';
      readonly normId: string;
      readonly detail: string;
    }
  | {
      readonly ok: false;
      readonly error: 'parse_failed';
      readonly normId: string;
      readonly detail: string;
    };

export type SyncResult = SyncSuccess | SyncFailure;

interface NormSuccess {
  readonly ok: true;
  readonly norm: CorpusNorm;
  readonly passages: readonly Passage[];
  readonly reused: boolean;
}

type NormResult = NormSuccess | SyncFailure;

function existingPassages(previous: CorpusArtifact | null, normId: string): readonly Passage[] {
  if (previous === null) return [];
  return previous.passages.filter((passage) => passage.normId === normId);
}

function existingNorm(previous: CorpusArtifact | null, normId: string): CorpusNorm | undefined {
  return previous?.norms.find((norm) => norm.normId === normId);
}

function canReuse(
  known: CorpusNorm | undefined,
  passages: readonly Passage[],
  fechaActualizacion: string
): known is CorpusNorm {
  if (known === undefined) return false;
  if (known.boeUpdatedAt !== fechaActualizacion) return false;
  return passages.length > 0;
}

async function fetchAndParse(
  normId: string,
  normTitle: string,
  update: SyncInput,
  fechaActualizacion: string
): Promise<NormResult> {
  const xml = await update.fetcher.fetchNormXml(normId);
  if (!xml.ok) return { ok: false, error: 'fetch_failed', normId, detail: xml.error };

  const parsed = parseConsolidatedXml(xml.xml, {
    normId,
    normTitle,
    boeUpdatedAt: fechaActualizacion,
    fetchedAt: update.generatedAt,
  });
  if (!parsed.ok) return { ok: false, error: 'parse_failed', normId, detail: parsed.error };
  if (parsed.passages.length === 0) {
    return { ok: false, error: 'parse_failed', normId, detail: 'no_passages' };
  }

  return {
    ok: true,
    reused: false,
    norm: {
      normId,
      normTitle,
      sourceUrl: boeSourceUrl(normId),
      boeUpdatedAt: fechaActualizacion,
      fetchedAt: update.generatedAt,
      licenseNote: BOE_LICENSE_NOTE,
    },
    passages: parsed.passages,
  };
}

async function syncNorm(normId: string, normTitle: string, input: SyncInput): Promise<NormResult> {
  const update = await input.fetcher.getLastUpdated(normId);
  if (!update.ok) return { ok: false, error: 'fetch_failed', normId, detail: update.error };

  const knownNorm = existingNorm(input.previous, normId);
  const knownPassages = existingPassages(input.previous, normId);
  if (canReuse(knownNorm, knownPassages, update.fechaActualizacion)) {
    return { ok: true, norm: knownNorm, passages: knownPassages, reused: true };
  }

  return fetchAndParse(normId, normTitle, input, update.fechaActualizacion);
}

export async function runCorpusSync(input: SyncInput): Promise<SyncResult> {
  const norms: CorpusNorm[] = [];
  const passages: Passage[] = [];
  const fetchedNormIds: string[] = [];
  const reusedNormIds: string[] = [];

  for (const norm of ALLOWED_NORMS) {
    const result = await syncNorm(norm.normId, norm.normTitle, input);
    if (!result.ok) return result;
    norms.push(result.norm);
    passages.push(...result.passages);
    (result.reused ? reusedNormIds : fetchedNormIds).push(norm.normId);
  }

  const artifact: CorpusArtifact = {
    schemaVersion: CORPUS_SCHEMA_VERSION,
    taxYear: input.taxYear,
    generatedAt: input.generatedAt,
    contentHash: contentHashOf(passages),
    norms,
    passages,
  };

  return { ok: true, artifact, fetchedNormIds, reusedNormIds };
}
