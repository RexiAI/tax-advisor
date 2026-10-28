/**
 * Constructors for the closed response union (Task 10) — pure functions from a
 * classified input (an error code, an insufficiency reason, a guard match, a
 * guide) to the exact payload the client renders. One module writes every
 * response kind, so a shape or a wording change has a single home.
 *
 * They live apart from the turn orchestration in `answer-question.ts` because
 * they change for a different reason: this module changes when the shape or the
 * wording of a response changes, never when the retrieval/model order changes.
 */

import type { GuideContent } from '../content/gestor-guides';
import { mentionsIbi } from '../content/scope-topics';
import {
  AI_DISCLOSURE,
  ERROR_MESSAGES,
  FILING_REQUEST_EXPLANATION,
  HANDOFF_URL,
  IBI_BOUNDARY_NOTE,
  INSUFFICIENT_BOUNDARY,
  INSUFFICIENT_EXPLANATIONS,
  JURISDICTION_CLARIFICATION_QUESTION,
  OUT_OF_SCOPE_EXPLANATION,
  PRIVACY_CATEGORY_LABELS,
  PRIVACY_WARNING_MESSAGE,
  UNCOVERED_COMMUNITY_EXPLANATION,
  YEAR_NOTICE_BODY,
} from '../content/strings';
import { REGISTRY_COVERAGE } from '../domain/allowed-norms';
import type { CoveragePair } from '../domain/coverage';
import type { LlmErrorCode } from '../llm/types';
import { normalizeText } from '../retrieval/normalize';

import { detectSensitiveData } from './privacy';
import { classifyScope, resolveJurisdiction, type JurisdictionResolution, type ScopeMatch } from './scope-guard';
import type {
  ClarificationResponse,
  ErrorResponse,
  GuideResponse,
  InsufficientEvidenceResponse,
  OutOfScopeResponse,
  PrivacyWarningResponse,
} from './types';

export type InsufficientReason = keyof typeof INSUFFICIENT_EXPLANATIONS;

const ERROR_CODE_BY_LLM: Readonly<Record<LlmErrorCode, keyof typeof ERROR_MESSAGES>> = {
  timeout: 'llm_timeout',
  unauthorized: 'llm_unauthorized',
  rate_limited: 'llm_rate_limited',
  upstream_error: 'llm_upstream_error',
  malformed_response: 'llm_malformed_response',
};

const YEAR_IN_RANGE = /\b20(?:1[5-9]|2\d|3[0-5])\b/g;
const INTERROGATIVE = /¿[^?]*\?/;
const TRAILING_QUESTION = /[^.?!\n]*\?/;

export function errorResponseFor(error: LlmErrorCode): ErrorResponse {
  const errorCode = ERROR_CODE_BY_LLM[error];
  return { kind: 'error', errorCode, message: ERROR_MESSAGES[errorCode] };
}

/**
 * The two deterministic notes a turn may carry. Both are derived from the message
 * and stay separate payload fields; neither is ever merged into the prose.
 */
export interface TurnNotes {
  readonly yearNotice?: string;
  readonly boundaryNote?: string;
}

/**
 * Spreads only the notes a turn actually has, so an absent note leaves no key in
 * the payload instead of an `undefined` value or an empty field.
 */
export function noteFields(notes: TurnNotes): TurnNotes {
  const fields: { yearNotice?: string; boundaryNote?: string } = {};
  if (notes.yearNotice !== undefined) fields.yearNotice = notes.yearNotice;
  if (notes.boundaryNote !== undefined) fields.boundaryNote = notes.boundaryNote;
  return fields;
}

export function insufficientResponse(
  reason: InsufficientReason,
  notes: TurnNotes = {}
): InsufficientEvidenceResponse {
  return {
    kind: 'insufficient_evidence',
    explanation: `${INSUFFICIENT_EXPLANATIONS[reason]} ${INSUFFICIENT_BOUNDARY}`,
    handoffUrl: HANDOFF_URL,
    disclaimer: AI_DISCLOSURE,
    ...noteFields(notes),
  };
}

export function privacyResponse(message: string): PrivacyWarningResponse | null {
  const [category] = detectSensitiveData(message);
  if (category === undefined) return null;
  const label = PRIVACY_CATEGORY_LABELS[category];
  return {
    kind: 'privacy_warning',
    category,
    categoryLabel: label,
    message: PRIVACY_WARNING_MESSAGE.replace('{category}', label),
    disclaimer: AI_DISCLOSURE,
  };
}

/**
 * One template per reason code, no nesting: a filing request must not read as if
 * the user had asked about the tax its message happened to mention, and an
 * uncovered community is about the community, not the tax.
 */
function refusalExplanation(match: ScopeMatch): string {
  if (match.reasonCode === 'filing_request') {
    return FILING_REQUEST_EXPLANATION.replace('{body}', match.officialBody);
  }
  if (match.reasonCode === 'uncovered_community') {
    return UNCOVERED_COMMUNITY_EXPLANATION.replace('{community}', match.label).replace(
      '{body}',
      match.officialBody
    );
  }
  return OUT_OF_SCOPE_EXPLANATION.replace('{topic}', match.label).replace(
    '{body}',
    match.officialBody
  );
}

export function scopeResponse(
  message: string,
  coverage: readonly CoveragePair[] = REGISTRY_COVERAGE,
  resolution: JurisdictionResolution = resolveJurisdiction(message)
): OutOfScopeResponse | null {
  const match = classifyScope(message, coverage, resolution);
  if (match === null) return null;
  return {
    kind: 'out_of_scope',
    reasonCode: match.reasonCode,
    topicLabel: match.label,
    officialBody: match.officialBody,
    explanation: refusalExplanation(match),
    handoffUrl: HANDOFF_URL,
    disclaimer: AI_DISCLOSURE,
  };
}

/**
 * The clarification for a message that depends on the community but names none.
 * The decision is the guard's, before any model call, so a state passage can never
 * stand in for a regional rule (spec 004, AC-004-38).
 */
export function jurisdictionClarification(
  resolution: JurisdictionResolution
): ClarificationResponse | null {
  if (resolution.kind !== 'unknown') return null;
  return {
    kind: 'clarification',
    question: JURISDICTION_CLARIFICATION_QUESTION,
    disclaimer: AI_DISCLOSURE,
  };
}

export function guideResponse(guide: GuideContent): GuideResponse {
  return {
    kind: 'guide',
    title: guide.title,
    explanation: guide.summary,
    steps: guide.steps,
    links: guide.links,
    disclaimer: AI_DISCLOSURE,
  };
}

export function yearNoticeFor(message: string, corpusTaxYear: number): string | undefined {
  const years = [...message.matchAll(YEAR_IN_RANGE)].map((match) => Number(match[0]));
  const otherYear = years.find((year) => year !== corpusTaxYear);
  if (otherYear === undefined) return undefined;
  return YEAR_NOTICE_BODY.replace('{corpusYear}', String(corpusTaxYear)).replace(
    '{askedYear}',
    String(otherYear)
  );
}

/**
 * The IBI boundary note (spec 003). Like `yearNoticeFor`, it is called only after
 * the scope guard has passed, so "the message mentioned IBI but that was not the
 * question" is guaranteed by call ordering rather than re-derived here. The value
 * is the committed constant: no model output reaches it.
 */
export function ibiBoundaryNoteFor(message: string): string | undefined {
  return mentionsIbi(normalizeText(message)) ? IBI_BOUNDARY_NOTE : undefined;
}

export function firstQuestion(text: string): string | null {
  const interrogative = INTERROGATIVE.exec(text);
  if (interrogative !== null) return interrogative[0].trim();
  const trailing = TRAILING_QUESTION.exec(text);
  return trailing === null ? null : trailing[0].trim();
}
