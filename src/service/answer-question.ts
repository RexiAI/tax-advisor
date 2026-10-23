/**
 * Answer orchestration (Task 10): retrieval → model → citation validation, with
 * one closed response kind per turn. No I/O; collaborators are injected. Response
 * shapes live in `./responses.ts`.
 */

import { stripCitationMarkers } from '../citations/extract';
import { validateCitations } from '../citations/validate';
import { toPlainText } from '../content/format';
import {
  AI_DISCLOSURE,
  HANDOFF_URL,
  PRIVACY_CATEGORY_LABELS,
  PRIVACY_WARNING_MESSAGE,
} from '../content/strings';
import type { Citation } from '../domain/citation';
import type { EvidenceBundle } from '../evidence/build-evidence';
import { buildEvidence } from '../evidence/build-evidence';
import type { LlmAdapter, LlmCallOptions, LlmErrorCode } from '../llm/types';
import { assembleRequest } from '../prompts/assemble';
import type { CorpusIndex } from '../retrieval/types';

import type { ConversationStore } from './conversation-store';
import { detectSensitiveData } from './privacy';
import { errorResponseFor, firstQuestion, insufficientResponse, yearNoticeFor } from './responses';
import { classifyScope } from './scope-guard';
import type { AnswerResponse, ChatRequest, ChatResponse, TurnFrame, TurnTelemetry } from './types';

export interface AnswerConfig {
  readonly minRetrievalScore: number;
  readonly retrievalTopK: number;
  readonly corpusTaxYear: number;
}

export interface AnswerDeps {
  readonly index: CorpusIndex;
  readonly adapter: LlmAdapter;
  readonly config: AnswerConfig;
  readonly conversations: ConversationStore;
  readonly telemetry: TurnTelemetry;
  readonly now: () => number;
  readonly signal?: AbortSignal;
}

const WORKED_EXAMPLE_PREFIX = /^ejemplo\s*:\s*/i;

function splitParagraphs(text: string): string[] {
  return text
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph !== '');
}

function workedExampleOf(paragraphs: readonly string[]): string | undefined {
  const paragraph = paragraphs.find((candidate) => WORKED_EXAMPLE_PREFIX.test(candidate));
  if (paragraph === undefined) return undefined;
  const stripped = paragraph.replace(WORKED_EXAMPLE_PREFIX, '').trim();
  return stripped === '' ? paragraph : stripped;
}

function privacyResponse(message: string): ChatResponse | null {
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

function scopeResponse(message: string): ChatResponse | null {
  const match = classifyScope(message);
  if (match === null) return null;
  return {
    kind: 'out_of_scope',
    reasonCode: match.reasonCode,
    topicLabel: match.label,
    officialBody: match.officialBody,
    explanation: `Las preguntas sobre ${match.label} quedan fuera del alcance de esta herramienta: aquí solo explico el IRPF. Para ${match.label}, la administración competente es ${match.officialBody}.`,
    handoffUrl: HANDOFF_URL,
    disclaimer: AI_DISCLOSURE,
  };
}

function callOptions(deps: AnswerDeps): LlmCallOptions {
  return deps.signal === undefined ? {} : { signal: deps.signal };
}

type PreModel = { readonly response: ChatResponse } | { readonly bundle: EvidenceBundle };

function preModel(input: ChatRequest, deps: AnswerDeps): PreModel {
  const blocked = privacyResponse(input.message) ?? scopeResponse(input.message);
  if (blocked !== null) return { response: blocked };

  const bundle = buildEvidence(input.message, deps.index, {
    minRetrievalScore: deps.config.minRetrievalScore,
    topK: deps.config.retrievalTopK,
  });
  deps.telemetry.retrievalHitCount = bundle.passages.length;

  if (bundle.status === 'insufficient') {
    deps.telemetry.citationValidation = 'not_applicable';
    return {
      response: insufficientResponse(
        bundle.reason,
        yearNoticeFor(input.message, deps.config.corpusTaxYear)
      ),
    };
  }

  return { bundle };
}

function answerResponse(
  input: ChatRequest,
  citations: readonly Citation[],
  answerText: string,
  deps: AnswerDeps
): ChatResponse {
  const paragraphs = splitParagraphs(toPlainText(answerText));
  const workedExample = workedExampleOf(paragraphs);
  const body = paragraphs.filter((paragraph) => !WORKED_EXAMPLE_PREFIX.test(paragraph));
  const explanation = body[0] ?? answerText.trim();
  const rule = body.slice(1).join('\n\n') || explanation;
  const yearNotice = yearNoticeFor(input.message, deps.config.corpusTaxYear);

  const response: AnswerResponse = {
    kind: 'answer',
    explanation,
    rule,
    citedPassages: citations,
    citations,
    disclaimer: AI_DISCLOSURE,
    ...(workedExample === undefined ? {} : { workedExample }),
    ...(yearNotice === undefined ? {} : { yearNotice }),
  };
  return response;
}

function clarificationOrAbstain(
  input: ChatRequest,
  answerText: string,
  deps: AnswerDeps
): ChatResponse {
  const question = firstQuestion(answerText);
  const conversationId = input.conversationId;
  const yearNotice = yearNoticeFor(input.message, deps.config.corpusTaxYear);

  if (question === null) return insufficientResponse('no_citations', yearNotice);
  if (conversationId === undefined)
    return { kind: 'clarification', question, disclaimer: AI_DISCLOSURE };
  if (deps.conversations.hasClarified(conversationId)) {
    return insufficientResponse('no_citations', yearNotice);
  }
  deps.conversations.markClarified(conversationId);
  return { kind: 'clarification', question, disclaimer: AI_DISCLOSURE };
}

function resolveOutcome(
  input: ChatRequest,
  bundle: EvidenceBundle,
  modelText: string,
  deps: AnswerDeps
): ChatResponse {
  const validation = validateCitations(modelText, bundle);

  if (validation.status === 'fail') {
    deps.telemetry.citationValidation = 'fail';
    return insufficientResponse(
      'unverified_citation',
      yearNoticeFor(input.message, deps.config.corpusTaxYear)
    );
  }

  if (validation.status === 'insufficient') {
    deps.telemetry.citationValidation = 'insufficient';
    return clarificationOrAbstain(input, validation.text, deps);
  }

  deps.telemetry.citationValidation = 'pass';
  return answerResponse(input, validation.citations, validation.text, deps);
}

export async function answerQuestion(input: ChatRequest, deps: AnswerDeps): Promise<ChatResponse> {
  const pre = preModel(input, deps);
  if ('response' in pre) return pre.response;

  const startedAt = deps.now();
  const request = assembleRequest({ message: input.message, passages: pre.bundle.passages });
  const result = await deps.adapter.completeAll(request, callOptions(deps));
  deps.telemetry.firstTokenMs = Math.max(0, deps.now() - startedAt);

  if (!result.ok) return errorResponseFor(result.error);

  deps.telemetry.promptTokens = result.usage.promptTokens;
  deps.telemetry.completionTokens = result.usage.completionTokens;
  return resolveOutcome(input, pre.bundle, result.text, deps);
}

interface CollectedTurn {
  readonly text: string;
  readonly error?: LlmErrorCode;
}

/**
 * Emits one sanitized `delta` frame per model delta. Citation markers are held
 * back until they are complete and then removed, so a passage id that is not in
 * the bundle can never reach the client even transiently.
 */
async function* collectModelStream(
  input: ChatRequest,
  bundle: EvidenceBundle,
  deps: AnswerDeps
): AsyncGenerator<TurnFrame, CollectedTurn, void> {
  const startedAt = deps.now();
  let text = '';
  let carry = '';

  const request = assembleRequest({ message: input.message, passages: bundle.passages });
  for await (const event of deps.adapter.complete(request, callOptions(deps))) {
    if (event.type === 'error') return { text, error: event.error };
    if (event.type === 'usage') {
      deps.telemetry.promptTokens = event.promptTokens;
      deps.telemetry.completionTokens = event.completionTokens;
      continue;
    }
    if (text === '') deps.telemetry.firstTokenMs = Math.max(0, deps.now() - startedAt);
    text += event.text;
    const redacted = redactPartialMarker(carry + event.text);
    carry = redacted.carry;
    if (redacted.emit !== '') yield { event: 'delta', text: redacted.emit };
  }

  return { text };
}

function redactPartialMarker(combined: string): { emit: string; carry: string } {
  const open = combined.lastIndexOf('[^');
  const suffix = open === -1 ? '' : combined.slice(open);
  const isMarkerPrefix = '[^p:'.startsWith(suffix) || suffix.startsWith('[^p:');
  if (open !== -1 && combined.indexOf(']', open) === -1 && isMarkerPrefix) {
    return { emit: stripCitationMarkers(combined.slice(0, open)), carry: suffix };
  }
  return { emit: stripCitationMarkers(combined), carry: '' };
}

export async function* streamAnswer(
  input: ChatRequest,
  deps: AnswerDeps
): AsyncGenerator<TurnFrame, void, void> {
  const pre = preModel(input, deps);
  if ('response' in pre) {
    yield { event: 'final', payload: pre.response };
    return;
  }

  const collected = yield* collectModelStream(input, pre.bundle, deps);
  const payload =
    collected.error === undefined
      ? resolveOutcome(input, pre.bundle, collected.text, deps)
      : errorResponseFor(collected.error);

  yield { event: payload.kind === 'answer' ? 'final' : 'replace', payload };
}
