/**
 * Answer orchestration (Task 10): retrieval → model → citation validation, with
 * one closed response kind per turn. No I/O; collaborators are injected. Response
 * shapes live in `./responses.ts`.
 */

import { stripCitationMarkers } from '../citations/extract';
import { validateCitations } from '../citations/validate';
import { toPlainText } from '../content/format';
import { gestorGuide } from '../content/gestor-guides';
import { AI_DISCLOSURE, REINFORCED_SCOPE_DISCLAIMER } from '../content/strings';
import { isNonIrpfNorm } from '../domain/allowed-norms';
import type { Citation } from '../domain/citation';
import { normIdOfPassageId } from '../domain/passage';
import type { EvidenceBundle } from '../evidence/build-evidence';
import { buildEvidence } from '../evidence/build-evidence';
import type { LlmAdapter, LlmCallOptions, LlmErrorCode } from '../llm/types';
import { assembleRequest } from '../prompts/assemble';
import type { CorpusIndex } from '../retrieval/types';

import type { ConversationStore } from './conversation-store';
import {
  errorResponseFor,
  firstQuestion,
  guideResponse,
  insufficientResponse,
  privacyResponse,
  scopeResponse,
  yearNoticeFor,
} from './responses';
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

function callOptions(deps: AnswerDeps): LlmCallOptions {
  return deps.signal === undefined ? {} : { signal: deps.signal };
}

type PreModel = { readonly response: ChatResponse } | { readonly bundle: EvidenceBundle };

function preModel(input: ChatRequest, deps: AnswerDeps): PreModel {
  const guide = gestorGuide(input.message);
  const blocked =
    privacyResponse(input.message) ??
    (guide === null ? null : guideResponse(guide)) ??
    scopeResponse(input.message);
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

/**
 * The reinforced disclaimer is derived from the norms that actually answered:
 * a validated citation of a non-IRPF norm turns it on, and only then. Deriving
 * it from the message would classify risk by vocabulary the spec deletes.
 */
function scopeDisclaimerFor(citations: readonly Citation[]): string | undefined {
  const nonIrpf = citations.some((citation) =>
    isNonIrpfNorm(normIdOfPassageId(citation.passageId))
  );
  return nonIrpf ? REINFORCED_SCOPE_DISCLAIMER : undefined;
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
  const scopeDisclaimer = scopeDisclaimerFor(citations);

  const response: AnswerResponse = {
    kind: 'answer',
    explanation,
    rule,
    citations,
    disclaimer: AI_DISCLOSURE,
    ...(scopeDisclaimer === undefined ? {} : { scopeDisclaimer }),
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
