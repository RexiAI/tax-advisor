/**
 * What a citation carries (Task 9). A citation is a projection of a passage: only
 * the fields a source entry renders, never the passage text, so the answer
 * response cannot leak the retrieved chunks into the client.
 *
 * Spec 004: the projection carries the provenance a reader verifies — the
 * issuing publisher, the jurisdiction whose rules the norm states, the publisher
 * whose consolidated text was actually ingested (`authorityUsed`) and that
 * source's own update date. The link label names `authorityUsed`, not the
 * publisher, so the two facts travel separately.
 *
 * `authorityUsed` has exactly one source of truth: the norm registry entry. It is
 * projected here, from the norm the passage id belongs to, so it can never be
 * derived from `publisher` or duplicated as a second mapping. `officialId` stays
 * norm-level: a citation shows what clicking proves.
 *
 * One definition for the whole codebase — the evidence bundle, the citation
 * validator and the source list all build from it, so they cannot drift apart.
 */

import { findAllowedNorm } from './allowed-norms';
import { normIdOfPassageId } from './passage';
import type { AuthorityUsed, Jurisdiction, Publisher } from './source';

export interface Citation {
  readonly passageId: string;
  readonly normTitle: string;
  readonly articleLabel: string;
  readonly sourceUrl: string;
  readonly publisher: Publisher;
  readonly jurisdiction: Jurisdiction;
  readonly authorityUsed: AuthorityUsed;
  readonly updatedAt: string;
}

/**
 * Anything the projection can be built from: a `Passage`, an `EvidencePassage`,
 * or a literal citation. `authorityUsed` is deliberately absent — it is read from
 * the registry, never taken from the caller.
 */
export type CitationSource = Omit<Citation, 'authorityUsed'>;

/**
 * The host that serves a passage's consolidated text, read from the norm the
 * passage belongs to. A passage outside the registry cannot exist — `createPassage`
 * refuses an unsupported norm and the sync only walks the registry — so reaching
 * this branch is a programming error, not a data condition: it fails loudly
 * rather than inventing a host that the link would point away from.
 */
export function authorityUsedOfPassage(passageId: string): AuthorityUsed {
  const norm = findAllowedNorm(normIdOfPassageId(passageId));
  if (norm === undefined) {
    throw new Error(`citation for a norm outside the registry: ${passageId}`);
  }
  return norm.authorityUsed;
}

/**
 * Narrows anything carrying the citation fields (a `Passage`, an
 * `EvidencePassage`) down to exactly those fields, adding the norm-level
 * `authorityUsed`.
 */
export function citationOf(source: CitationSource): Citation {
  return {
    passageId: source.passageId,
    normTitle: source.normTitle,
    articleLabel: source.articleLabel,
    sourceUrl: source.sourceUrl,
    publisher: source.publisher,
    jurisdiction: source.jurisdiction,
    authorityUsed: authorityUsedOfPassage(source.passageId),
    updatedAt: source.updatedAt,
  };
}
