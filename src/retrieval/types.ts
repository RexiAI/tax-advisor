import type { Passage } from '../domain/passage';

export interface CorpusIndex {
  readonly size: number;
  readonly passages: readonly Passage[];
  /** Per-passage normalized term counts, aligned with `passages` by position. */
  readonly termFrequency: readonly ReadonlyMap<string, number>[];
  /** Number of passages each normalized term appears in. */
  readonly documentFrequency: ReadonlyMap<string, number>;
}

export interface SearchResult {
  readonly passage: Passage;
  readonly score: number;
}

export type BuildIndexResult =
  | { readonly ok: true; readonly index: CorpusIndex }
  | { readonly ok: false; readonly error: 'duplicate_passage_id' };
