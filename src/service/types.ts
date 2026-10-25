/**
 * The closed set of shapes a turn can produce (Task 10). The union is
 * discriminated on `kind`; a response with zero validated citations is never
 * `'answer'`.
 */

import type { Citation } from '../domain/citation';
import type { OfficialLink, OutOfScopeReasonCode } from '../content/scope-topics';
import type { ErrorCode } from '../content/strings';
import type { CitationValidationStatus } from '../observability/log';
import type { SensitiveCategory } from './privacy';

export interface ChatRequest {
  readonly message: string;
  readonly conversationId?: string;
}

export interface AnswerResponse {
  readonly kind: 'answer';
  readonly explanation: string;
  readonly rule: string;
  readonly citations: readonly Citation[];
  readonly disclaimer: string;
  /** Present when a validated citation belongs to a non-IRPF norm. */
  readonly scopeDisclaimer?: string;
  readonly workedExample?: string;
  readonly yearNotice?: string;
}

export interface InsufficientEvidenceResponse {
  readonly kind: 'insufficient_evidence';
  readonly explanation: string;
  readonly handoffUrl: string;
  readonly disclaimer: string;
  readonly yearNotice?: string;
}

export interface OutOfScopeResponse {
  readonly kind: 'out_of_scope';
  readonly reasonCode: OutOfScopeReasonCode;
  readonly topicLabel: string;
  readonly officialBody: string;
  readonly explanation: string;
  readonly handoffUrl: string;
  readonly disclaimer: string;
}

export interface GuideResponse {
  readonly kind: 'guide';
  readonly title: string;
  readonly explanation: string;
  readonly steps: readonly string[];
  readonly links: readonly OfficialLink[];
  readonly disclaimer: string;
}

export interface PrivacyWarningResponse {
  readonly kind: 'privacy_warning';
  readonly category: SensitiveCategory;
  readonly categoryLabel: string;
  readonly message: string;
  readonly disclaimer: string;
}

export interface ClarificationResponse {
  readonly kind: 'clarification';
  readonly question: string;
  readonly disclaimer: string;
}

export interface ErrorResponse {
  readonly kind: 'error';
  readonly errorCode: ErrorCode;
  readonly message: string;
}

export type ChatResponse =
  | AnswerResponse
  | InsufficientEvidenceResponse
  | OutOfScopeResponse
  | GuideResponse
  | PrivacyWarningResponse
  | ClarificationResponse
  | ErrorResponse;

/** Mutable per-request collector for the structured log line. Never shared. */
export interface TurnTelemetry {
  retrievalHitCount: number;
  citationValidation: CitationValidationStatus;
  promptTokens: number;
  completionTokens: number;
  firstTokenMs: number;
}

export function createTurnTelemetry(): TurnTelemetry {
  return {
    retrievalHitCount: 0,
    citationValidation: 'not_applicable',
    promptTokens: 0,
    completionTokens: 0,
    firstTokenMs: 0,
  };
}

export type TurnFrame =
  | { readonly event: 'delta'; readonly text: string }
  | { readonly event: 'final'; readonly payload: ChatResponse }
  | { readonly event: 'replace'; readonly payload: ChatResponse };
