/**
 * Incremental, idempotent corpus sync (Task 4; spec 004 Tasks 4-5).
 *
 * A norm is re-fetched only when the publisher that supplied its text reports a
 * newer update date than the committed artifact records; otherwise its passages
 * and its `fetchedAt` are carried over untouched. Each registry entry is
 * dispatched to the adapter for its `authorityUsed` publisher, so a regional norm
 * whose consolidated text lives on the BOE and one served by its own bulletin are
 * both expressible. A failed fetch, an undated source or a parse that yields no
 * passages stops the whole sync, so a broken document can never ship a shrunken
 * corpus.
 */

import { coverageOf } from '../domain/coverage';
import { ALLOWED_NORMS, type AllowedNorm } from '../domain/allowed-norms';
import type { Passage } from '../domain/passage';

import {
  CORPUS_SCHEMA_VERSION,
  contentHashOf,
  type CorpusArtifact,
  type CorpusNorm,
} from './artifact';
import { adapterFor, type SourceAdapter } from './source-adapter';

export interface SyncInput {
  readonly adapters: readonly SourceAdapter[];
  readonly previous: CorpusArtifact | null;
  /** `YYYY-MM-DDTHH:MM:SSZ`, supplied by the caller so the sync reads no clock. */
  readonly generatedAt: string;
  readonly taxYear: number;
  /** Defaults to the registry. A test may pass a narrower list; production never does. */
  readonly norms?: readonly AllowedNorm[];
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

function provenanceComplete(norm: AllowedNorm): boolean {
  return [norm.publisher, norm.jurisdiction, norm.authorityUsed, norm.officialId, norm.sourceUrl, norm.updatedAt, norm.licenseNote].every(
    (value) => value.trim() !== ''
  );
}

function existingPassages(previous: CorpusArtifact | null, normId: string): readonly Passage[] {
  if (previous === null) return [];
  return previous.passages.filter((passage) => passage.normId === normId);
}

function existingNorm(previous: CorpusArtifact | null, normId: string): CorpusNorm | undefined {
  return previous?.norms.find((norm) => norm.normId === normId);
}

/** A changed provenance invalidates the reuse: the artifact must describe the registry. */
function sameProvenance(known: CorpusNorm, norm: AllowedNorm): boolean {
  return (
    known.publisher === norm.publisher &&
    known.jurisdiction === norm.jurisdiction &&
    known.authorityUsed === norm.authorityUsed &&
    known.officialId === norm.officialId &&
    known.sourceUrl === norm.sourceUrl &&
    known.licenseNote === norm.licenseNote
  );
}

function canReuse(
  known: CorpusNorm | undefined,
  norm: AllowedNorm,
  passages: readonly Passage[],
  updatedAt: string
): known is CorpusNorm {
  if (known === undefined) return false;
  if (known.updatedAt !== updatedAt) return false;
  if (!sameProvenance(known, norm)) return false;
  return passages.length > 0;
}

function corpusNormOf(norm: AllowedNorm, adapter: SourceAdapter, fetchedAt: string, updatedAt: string): CorpusNorm {
  return {
    normId: norm.normId,
    normTitle: norm.normTitle,
    publisher: norm.publisher,
    jurisdiction: norm.jurisdiction,
    authorityUsed: norm.authorityUsed,
    officialId: norm.officialId,
    sourceUrl: adapter.sourceUrl(norm),
    updatedAt,
    fetchedAt,
    licenseNote: norm.licenseNote,
  };
}

async function fetchAndParse(
  norm: AllowedNorm,
  adapter: SourceAdapter,
  input: SyncInput,
  updatedAt: string
): Promise<NormResult> {
  const document = await adapter.fetchDocument(norm);
  if (!document.ok) {
    return { ok: false, error: 'fetch_failed', normId: norm.normId, detail: document.error };
  }

  const parsed = adapter.parse(document.document, {
    norm,
    updatedAt,
    fetchedAt: input.generatedAt,
  });
  if (!parsed.ok) {
    return { ok: false, error: 'parse_failed', normId: norm.normId, detail: parsed.error };
  }
  if (parsed.passages.length === 0) {
    return { ok: false, error: 'parse_failed', normId: norm.normId, detail: 'no_passages' };
  }

  return {
    ok: true,
    reused: false,
    norm: corpusNormOf(norm, adapter, input.generatedAt, updatedAt),
    passages: parsed.passages,
  };
}

export async function syncNorm(norm: AllowedNorm, input: SyncInput): Promise<NormResult> {
  if (!provenanceComplete(norm)) {
    return {
      ok: false,
      error: 'fetch_failed',
      normId: norm.normId,
      detail: 'incomplete_provenance',
    };
  }

  const adapter = adapterFor(input.adapters, norm.authorityUsed);
  if (adapter === undefined) {
    return {
      ok: false,
      error: 'fetch_failed',
      normId: norm.normId,
      detail: `no_adapter for ${norm.authorityUsed}`,
    };
  }

  const update = await adapter.getLastUpdated(norm);
  if (!update.ok) {
    return { ok: false, error: 'fetch_failed', normId: norm.normId, detail: update.error };
  }

  const knownNorm = existingNorm(input.previous, norm.normId);
  const knownPassages = existingPassages(input.previous, norm.normId);
  if (canReuse(knownNorm, norm, knownPassages, update.updatedAt)) {
    return { ok: true, norm: knownNorm, passages: knownPassages, reused: true };
  }

  return fetchAndParse(norm, adapter, input, update.updatedAt);
}

export async function runCorpusSync(input: SyncInput): Promise<SyncResult> {
  const norms: CorpusNorm[] = [];
  const passages: Passage[] = [];
  const fetchedNormIds: string[] = [];
  const reusedNormIds: string[] = [];
  const registry = input.norms ?? ALLOWED_NORMS;

  for (const norm of registry) {
    const result = await syncNorm(norm, input);
    if (!result.ok) return result;
    norms.push(result.norm);
    passages.push(...result.passages);
    (result.reused ? reusedNormIds : fetchedNormIds).push(norm.normId);
  }

  const coverage = coverageOf(registry);
  const artifact: CorpusArtifact = {
    schemaVersion: CORPUS_SCHEMA_VERSION,
    taxYear: input.taxYear,
    generatedAt: input.generatedAt,
    contentHash: contentHashOf({ coverage, norms, passages }),
    coverage,
    norms,
    passages,
  };

  return { ok: true, artifact, fetchedNormIds, reusedNormIds };
}
