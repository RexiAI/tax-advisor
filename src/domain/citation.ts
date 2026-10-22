/**
 * What a citation carries (Task 9). A citation is a projection of a passage: only
 * the fields a source entry renders, never the passage text, so the answer
 * response cannot leak the retrieved chunks into the client.
 *
 * One definition for the whole codebase — the evidence bundle, the citation
 * validator and the source list all build from it, so they cannot drift apart.
 */

export interface Citation {
  readonly passageId: string;
  readonly normTitle: string;
  readonly articleLabel: string;
  readonly sourceUrl: string;
  readonly boeUpdatedAt: string;
}

/**
 * Narrows anything carrying the citation fields (a `Passage`, an
 * `EvidencePassage`) down to exactly those fields.
 */
export function citationOf(source: Citation): Citation {
  return {
    passageId: source.passageId,
    normTitle: source.normTitle,
    articleLabel: source.articleLabel,
    sourceUrl: source.sourceUrl,
    boeUpdatedAt: source.boeUpdatedAt,
  };
}
