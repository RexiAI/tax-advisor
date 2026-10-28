/**
 * Out-of-scope guard (Task 11; region-aware since spec 004).
 *
 * Two deterministic decisions, kept apart:
 *
 * 1. `resolveJurisdiction` says whose rules the message is about: a named
 *    community, `state`, or `unknown` when the message implies regional
 *    competence without naming a community.
 * 2. `classifyScope` refuses a topic only when the coverage lookup says its
 *    `(jurisdiction, tax)` pair is not covered. The refusal is a coverage verdict,
 *    not a hardcoded list; a matrix that declares the pair makes the refusal
 *    disappear.
 *
 * A named community outside the coverage matrix is refused (`uncovered_community`)
 * rather than looped back into a clarification. Only a message that names no
 * community is clarified.
 */

import { findCommunity, normalizeForCommunityMatch, communityOfficialBody } from '../content/communities';
import { OUT_OF_SCOPE_TOPICS, type OutOfScopeReasonCode } from '../content/scope-topics';
import { REGISTRY_COVERAGE } from '../domain/allowed-norms';
import { isCovered, type CoveragePair } from '../domain/coverage';
import type { Jurisdiction } from '../domain/source';
import { normalizeText } from '../retrieval/normalize';

import type { CommunityRecord } from '../content/communities';

export interface ScopeMatch {
  readonly reasonCode: OutOfScopeReasonCode;
  readonly label: string;
  readonly officialBody: string;
}

export type JurisdictionResolution =
  | { readonly kind: 'resolved'; readonly jurisdiction: Jurisdiction; readonly community?: CommunityRecord }
  | { readonly kind: 'uncovered'; readonly community: CommunityRecord }
  | { readonly kind: 'unknown' };

/**
 * A question whose answer depends on the community, with no community named:
 * "deducciones autonómicas", "mi comunidad", "la comunidad autónoma". `autónomo`
 * does not match: it is a worker, not a jurisdiction.
 */
const REGIONAL_IMPLICATION =
  /\b(?:deducciones? autonomicas?|autonomic[oa]s?|comunidad autonoma|mi comunidad|normativa autonomica)\b/;

export function resolveJurisdiction(message: string): JurisdictionResolution {
  const text = normalizeForCommunityMatch(message);
  const community = findCommunity(text);
  if (community !== undefined) {
    return community.jurisdiction === undefined
      ? { kind: 'uncovered', community }
      : { kind: 'resolved', jurisdiction: community.jurisdiction, community };
  }
  if (REGIONAL_IMPLICATION.test(text)) return { kind: 'unknown' };
  return { kind: 'resolved', jurisdiction: 'state' };
}

function uncoveredMatch(community: CommunityRecord): ScopeMatch {
  return {
    reasonCode: 'uncovered_community',
    label: community.locative,
    officialBody: communityOfficialBody(community),
  };
}

function bodyFor(
  topicBody: string,
  resolution: JurisdictionResolution
): string {
  if (resolution.kind === 'resolved' && resolution.jurisdiction !== 'state' && resolution.community !== undefined) {
    return communityOfficialBody(resolution.community);
  }
  return topicBody;
}

function decide(
  topic: (typeof OUT_OF_SCOPE_TOPICS)[number],
  coverage: readonly CoveragePair[],
  resolution: JurisdictionResolution
): ScopeMatch | null {
  if (topic.reasonCode === 'filing_request') {
    return { reasonCode: topic.reasonCode, label: topic.label, officialBody: topic.officialBody };
  }
  if (resolution.kind === 'uncovered') return uncoveredMatch(resolution.community);

  const jurisdiction = resolution.kind === 'resolved' ? resolution.jurisdiction : 'state';
  if (topic.tax !== undefined && isCovered(coverage, jurisdiction, topic.tax)) return null;

  return {
    reasonCode: topic.reasonCode,
    label: topic.label,
    officialBody: bodyFor(topic.officialBody, resolution),
  };
}

export function classifyScope(
  message: string,
  coverage: readonly CoveragePair[] = REGISTRY_COVERAGE,
  resolution: JurisdictionResolution = resolveJurisdiction(message)
): ScopeMatch | null {
  const normalized = normalizeText(message);
  const topic = OUT_OF_SCOPE_TOPICS.find((candidate) => candidate.match(normalized));
  if (topic !== undefined) return decide(topic, coverage, resolution);
  if (resolution.kind === 'uncovered') return uncoveredMatch(resolution.community);
  return null;
}
