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
import {
  AI_DISCLOSURE,
  ERROR_MESSAGES,
  FILING_REQUEST_EXPLANATION,
  HANDOFF_URL,
  INSUFFICIENT_BOUNDARY,
  INSUFFICIENT_EXPLANATIONS,
  OUT_OF_SCOPE_EXPLANATION,
  PRIVACY_CATEGORY_LABELS,
  PRIVACY_WARNING_MESSAGE,
  YEAR_NOTICE_BODY,
} from '../content/strings';
import type { LlmErrorCode } from '../llm/types';

import { detectSensitiveData } from './privacy';
import { classifyScope } from './scope-guard';
import type {
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

export function insufficientResponse(
  reason: InsufficientReason,
  yearNotice?: string
): InsufficientEvidenceResponse {
  const explanation = `${INSUFFICIENT_EXPLANATIONS[reason]} ${INSUFFICIENT_BOUNDARY}`;
  const response: InsufficientEvidenceResponse = {
    kind: 'insufficient_evidence',
    explanation,
    handoffUrl: HANDOFF_URL,
    disclaimer: AI_DISCLOSURE,
  };
  return yearNotice === undefined ? response : { ...response, yearNotice };
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

export function scopeResponse(message: string): OutOfScopeResponse | null {
  const match = classifyScope(message);
  if (match === null) return null;
  // Two templates, no nesting: a filing request must not read as if the user had
  // asked about the tax its message happened to mention.
  const template =
    match.reasonCode === 'filing_request' ? FILING_REQUEST_EXPLANATION : OUT_OF_SCOPE_EXPLANATION;
  return {
    kind: 'out_of_scope',
    reasonCode: match.reasonCode,
    topicLabel: match.label,
    officialBody: match.officialBody,
    explanation: template.replace('{topic}', match.label).replace('{body}', match.officialBody),
    handoffUrl: HANDOFF_URL,
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

export function firstQuestion(text: string): string | null {
  const interrogative = INTERROGATIVE.exec(text);
  if (interrogative !== null) return interrogative[0].trim();
  const trailing = TRAILING_QUESTION.exec(text);
  return trailing === null ? null : trailing[0].trim();
}
