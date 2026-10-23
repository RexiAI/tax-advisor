/**
 * Server-side citation validation (Task 9) — the enforcement point for "no
 * citation, no claim" and "no invented citations".
 *
 * The validator receives the answer text and the evidence bundle only. It has no
 * index parameter and no lookup function, so it cannot reach a passage that was
 * not retrieved for this turn.
 */

import { citationOf, type Citation } from '../domain/citation';

import { extractCitations } from './extract';

export type CitationValidation =
  | {
      readonly status: 'pass';
      readonly citations: readonly Citation[];
      readonly text: string;
    }
  | { readonly status: 'fail'; readonly unknownIds: readonly string[]; readonly text: string }
  | { readonly status: 'insufficient'; readonly reason: 'no_citations'; readonly text: string };

export function validateCitations(
  answerText: string,
  bundle: { readonly passages: readonly Citation[] }
): CitationValidation {
  const extraction = extractCitations(answerText);

  if (extraction.ids.length === 0) {
    return { status: 'insufficient', reason: 'no_citations', text: extraction.text };
  }

  const retrieved = new Map(bundle.passages.map((passage) => [passage.passageId, passage]));
  const unknownIds = extraction.ids.filter((id) => !retrieved.has(id));
  if (unknownIds.length > 0) {
    return { status: 'fail', unknownIds, text: extraction.text };
  }

  // `citationOf` re-projects rather than passing the bundle entry through: the
  // bundle carries the passage text, and a citation must never carry it.
  const citations = extraction.ids.map((id) => citationOf(retrieved.get(id) as Citation));

  return { status: 'pass', citations, text: extraction.text };
}
