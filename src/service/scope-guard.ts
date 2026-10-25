/**
 * Out-of-scope guard (Task 11). A match means the turn is refused with a scope
 * statement and an official body, without calling the model. Out-of-scope wins
 * over an in-scope IRPF term in the same message: the map order decides.
 */

import { OUT_OF_SCOPE_TOPICS, type OutOfScopeReasonCode } from '../content/scope-topics';
import { normalizeText } from '../retrieval/normalize';

export interface ScopeMatch {
  readonly reasonCode: OutOfScopeReasonCode;
  readonly label: string;
  readonly officialBody: string;
}

export function classifyScope(message: string): ScopeMatch | null {
  const normalized = normalizeText(message);
  for (const topic of OUT_OF_SCOPE_TOPICS) {
    if (!topic.match(normalized)) continue;
    return {
      reasonCode: topic.reasonCode,
      label: topic.label,
      officialBody: topic.officialBody,
    };
  }
  return null;
}
