/**
 * Constructors for the closed response union (Task 10) — pure functions from an
 * error code or an insufficiency reason to the exact payload the client renders.
 *
 * They live apart from the turn orchestration in `answer-question.ts` because
 * they change for a different reason: this module changes when the shape or the
 * wording of a response changes, never when the retrieval/model order changes.
 */

import {
  AI_DISCLOSURE,
  ERROR_MESSAGES,
  HANDOFF_URL,
  INSUFFICIENT_BOUNDARY,
  INSUFFICIENT_EXPLANATIONS,
} from '../content/strings';
import type { LlmErrorCode } from '../llm/types';

import type { ErrorResponse, InsufficientEvidenceResponse } from './types';

export type InsufficientReason = keyof typeof INSUFFICIENT_EXPLANATIONS;

const ERROR_CODE_BY_LLM: Readonly<Record<LlmErrorCode, keyof typeof ERROR_MESSAGES>> = {
  timeout: 'llm_timeout',
  unauthorized: 'llm_unauthorized',
  rate_limited: 'llm_rate_limited',
  upstream_error: 'llm_upstream_error',
  malformed_response: 'llm_malformed_response',
};

const YEAR_IN_RANGE = /\b20(?:2\d|3[0-5])\b/g;
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

export function yearNoticeFor(message: string, corpusTaxYear: number): string | undefined {
  const years = [...message.matchAll(YEAR_IN_RANGE)].map((match) => Number(match[0]));
  const otherYear = years.find((year) => year !== corpusTaxYear);
  if (otherYear === undefined) return undefined;
  return `La respuesta se basa en el texto del BOE para el año ${corpusTaxYear}. La norma puede haber cambiado para el año ${otherYear} por el que preguntas.`;
}

export function firstQuestion(text: string): string | null {
  const interrogative = INTERROGATIVE.exec(text);
  if (interrogative !== null) return interrogative[0].trim();
  const trailing = TRAILING_QUESTION.exec(text);
  return trailing === null ? null : trailing[0].trim();
}
