/**
 * Deterministic lexical retrieval (Task 5). No embeddings, no vector store, no
 * SQL: a term-frequency / inverse-document-frequency index held in memory.
 *
 * The same index and query always produce the same array, and ties break on
 * `passageId` ascending, so results are reproducible across runs and processes.
 */

import { readBounds } from '../config/env';
import { findDuplicatePassageId } from '../domain/passage';
import type { Passage } from '../domain/passage';

import { expandTerms } from './expand';
import { normalizeTerms } from './normalize';
import type { BuildIndexResult, CorpusIndex, SearchResult } from './types';

export type { BuildIndexResult, CorpusIndex, SearchResult } from './types';

function countTerms(terms: readonly string[]): ReadonlyMap<string, number> {
  const counts = new Map<string, number>();
  for (const term of terms) {
    counts.set(term, (counts.get(term) ?? 0) + 1);
  }
  return counts;
}

function buildDocumentFrequency(
  termFrequency: readonly ReadonlyMap<string, number>[]
): ReadonlyMap<string, number> {
  const documentFrequency = new Map<string, number>();
  for (const counts of termFrequency) {
    for (const term of counts.keys()) {
      documentFrequency.set(term, (documentFrequency.get(term) ?? 0) + 1);
    }
  }
  return documentFrequency;
}

export function buildIndex(passages: readonly Passage[]): BuildIndexResult {
  if (findDuplicatePassageId(passages) !== null)
    return { ok: false, error: 'duplicate_passage_id' };

  const termFrequency = passages.map((passage) => countTerms(normalizeTerms(passage.text)));
  const documentFrequency = buildDocumentFrequency(termFrequency);
  const documentLength = termFrequency.map(totalTerms);

  const index: CorpusIndex = Object.freeze({
    size: passages.length,
    passages: Object.freeze([...passages]),
    termFrequency: Object.freeze(termFrequency),
    documentLength: Object.freeze(documentLength),
    documentFrequency,
  });

  return { ok: true, index };
}

function totalTerms(counts: ReadonlyMap<string, number>): number {
  let total = 0;
  for (const count of counts.values()) total += count;
  return total;
}

function inverseDocumentFrequency(term: string, index: CorpusIndex): number {
  const documentsWithTerm = index.documentFrequency.get(term) ?? 0;
  if (documentsWithTerm === 0) return 0;
  return 1 + Math.log(index.size / documentsWithTerm);
}

function titleBoost(passage: Passage, terms: readonly string[]): number {
  // BOE `blockTitle` is often just "Artículo 103"; the actual heading is the
  // first line of the text ("Artículo 103. Devolución derivada…").
  const heading = `${passage.articleLabel} ${passage.blockTitle} ${passage.text.slice(0, 160)}`;
  const titleTerms = new Set(normalizeTerms(heading));
  let matches = 0;
  for (const term of terms) if (titleTerms.has(term)) matches += 1;
  return matches * 0.3;
}

function scorePassage(
  passage: Passage,
  counts: ReadonlyMap<string, number>,
  total: number,
  terms: readonly string[],
  index: CorpusIndex
): number {
  if (total === 0) return 0;
  let score = titleBoost(passage, terms);
  for (const term of terms) {
    const occurrences = counts.get(term) ?? 0;
    if (occurrences === 0) continue;
    score += (occurrences / total) * inverseDocumentFrequency(term, index);
  }
  return score;
}

function compareResults(left: SearchResult, right: SearchResult): number {
  if (right.score !== left.score) return right.score - left.score;
  return left.passage.passageId < right.passage.passageId ? -1 : 1;
}

/**
 * Returns at most `k` scored passages, best first. `k` defaults to the
 * configured `retrievalTopK`. An empty or stopword-only query returns `[]`.
 * `accept` scopes the eligible passages (spec 004, Task 9): a regional question
 * must not be answered from another jurisdiction's text.
 */
export function search(
  index: CorpusIndex,
  query: string,
  k?: number,
  accept?: (passage: Passage) => boolean
): SearchResult[] {
  const terms = [...new Set([...normalizeTerms(query), ...expandTerms(query)])];
  if (terms.length === 0) return [];

  const limit = k ?? readBounds().retrievalTopK;
  const results: SearchResult[] = [];
  const eligible = (passage: Passage): boolean => accept === undefined || accept(passage);

  index.passages.forEach((passage, position) => {
    if (!eligible(passage)) return;
    const counts = index.termFrequency[position];
    if (counts === undefined) return;
    const score = scorePassage(
      passage,
      counts,
      index.documentLength[position] ?? 0,
      terms,
      index
    );
    if (score > 0) results.push({ passage, score });
  });

  results.sort(compareResults);
  return results.slice(0, limit);
}
