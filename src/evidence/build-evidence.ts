/**
 * Evidence bundle and sufficiency decision (Task 6).
 *
 * The bundle is the whole of what the turn is allowed to cite: the same array is
 * handed to the citation validator, and the validator has no other source. The
 * sufficiency threshold arrives from configuration; this module holds no numeric
 * literal of its own.
 */

import { citationOf, type Citation } from '../domain/citation';
import type { Passage } from '../domain/passage';
import type { Jurisdiction } from '../domain/source';
import { search } from '../retrieval/index';
import type { CorpusIndex } from '../retrieval/types';

export type InsufficiencyReason = 'no_results' | 'below_threshold';

/** Everything a citation needs to render without a second lookup. */
export interface EvidencePassage extends Citation {
  /** The passage text, so the prompt can carry exactly what may be cited. */
  readonly text: string;
}

export interface SufficientEvidence {
  readonly status: 'sufficient';
  readonly passages: readonly EvidencePassage[];
}

export interface InsufficientEvidence {
  readonly status: 'insufficient';
  readonly passages: readonly EvidencePassage[];
  readonly reason: InsufficiencyReason;
}

export type EvidenceBundle = SufficientEvidence | InsufficientEvidence;

export interface EvidenceOptions {
  readonly minRetrievalScore: number;
  readonly topK?: number;
  /** When set, only passages of this jurisdiction are eligible. */
  readonly jurisdiction?: Jurisdiction;
}

function toEvidencePassage(passage: Passage): EvidencePassage {
  return { ...citationOf(passage), text: passage.text };
}

export function buildEvidence(
  query: string,
  index: CorpusIndex,
  options: EvidenceOptions
): EvidenceBundle {
  const results = search(
    index,
    query,
    options.topK,
    options.jurisdiction === undefined
      ? undefined
      : (passage) => passage.jurisdiction === options.jurisdiction
  );
  const passages = results.map((result) => toEvidencePassage(result.passage));

  if (passages.length === 0) {
    return { status: 'insufficient', passages, reason: 'no_results' };
  }

  const topScore = results[0]?.score ?? 0;
  if (topScore < options.minRetrievalScore) {
    return { status: 'insufficient', passages, reason: 'below_threshold' };
  }

  return { status: 'sufficient', passages };
}
