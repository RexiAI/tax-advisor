/**
 * Loads the committed corpus artifact into the in-process index. Filesystem
 * access lives here and only here, so `src/service/` never touches `fs`.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  CORPUS_ARTIFACT_PATH,
  parseCorpusArtifact,
  type CorpusArtifact,
  type CorpusArtifactError,
} from '../corpus/artifact';
import { buildIndex } from '../retrieval/index';
import type { CorpusIndex } from '../retrieval/types';

export interface LoadedCorpus {
  readonly artifact: CorpusArtifact;
  readonly index: CorpusIndex;
}

export type CorpusProviderResult =
  | { readonly ok: true; readonly corpus: LoadedCorpus }
  | { readonly ok: false; readonly error: CorpusArtifactError };

export function loadCorpusFromText(raw: string): CorpusProviderResult {
  const parsed = parseCorpusArtifact(raw);
  if (!parsed.ok) return parsed;

  const built = buildIndex(parsed.artifact.passages);
  if (!built.ok) return { ok: false, error: 'unparsable' };

  return { ok: true, corpus: { artifact: parsed.artifact, index: built.index } };
}

export function loadCorpusFromFile(path: string): CorpusProviderResult {
  let raw: string;
  try {
    raw = readFileSync(path, 'utf8');
  } catch {
    return { ok: false, error: 'missing' };
  }
  return loadCorpusFromText(raw);
}

/**
 * Loads the artifact once and returns the same immutable value afterwards: the
 * request path never re-reads the filesystem, and the route holds no mutable
 * module state of its own.
 */
export function createCorpusLoader(
  path: string = join(process.cwd(), CORPUS_ARTIFACT_PATH)
): () => CorpusProviderResult {
  const loaded = loadCorpusFromFile(path);
  return () => loaded;
}

let shared: CorpusProviderResult | undefined;

/** Process-wide corpus, shared by the page metadata and the chat route. */
export function getSharedCorpus(): CorpusProviderResult {
  shared ??= loadCorpusFromFile(join(process.cwd(), CORPUS_ARTIFACT_PATH));
  return shared;
}
