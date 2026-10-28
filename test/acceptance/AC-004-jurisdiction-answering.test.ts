import { describe, expect, it } from 'vitest';

import { INSUFFICIENT_EXPLANATIONS, sourceLinkLabel } from '@/content/strings';
import type { Passage } from '@/domain/passage';
import { buildIndex } from '@/retrieval/index';
import { search } from '@/retrieval/index';
import { answerQuestion } from '@/service/answer-question';
import { createConversationStore } from '@/service/conversation-store';
import { createTurnTelemetry } from '@/service/types';

import { FakeLlmAdapter } from '../support/fake-llm-adapter';
import { fixtureCorpus, fixturePassages } from '../support/harness';

const CONFIG = { minRetrievalScore: 0.01, retrievalTopK: 5, corpusTaxYear: 2025 };
const MADRID_QUESTION = '¿Qué deducciones autonómicas tengo en Madrid como autónomo?';

function deps(adapter: FakeLlmAdapter, index = fixtureCorpus().index) {
  return {
    index,
    adapter,
    config: CONFIG,
    conversations: createConversationStore(),
    telemetry: createTurnTelemetry(),
    now: () => 1_000,
  };
}

function topPassageId(message: string, accept?: (passage: Passage) => boolean): string {
  const [top] = search(fixtureCorpus().index, message, undefined, accept);
  if (top === undefined) throw new Error(`fixture corpus has no match for ${message}`);
  return top.passage.passageId;
}

describe('AC-004-41 a regional question cites only that jurisdiction passages', () => {
  it('AC-004-41: every Madrid citation is madrid/bocm, served by the BOE', async () => {
    const id = topPassageId(MADRID_QUESTION, (passage) => passage.jurisdiction === 'madrid');
    const response = await answerQuestion(
      { message: MADRID_QUESTION },
      deps(new FakeLlmAdapter({ deltas: [`Según la norma [^p:${id}].`] }))
    );

    expect(response.kind).toBe('answer');
    if (response.kind !== 'answer') return;
    expect(response.citations.length).toBeGreaterThan(0);
    for (const citation of response.citations) {
      expect(citation.jurisdiction).toBe('madrid');
      expect(citation.publisher).toBe('bocm');
      // The link names the host serving the consolidated text, not the publisher.
      expect(citation.authorityUsed).toBe('boe');
      expect(sourceLinkLabel(citation.authorityUsed)).toBe('Ver en el BOE');
    }
  });
});

describe('AC-004-42 a state citation for a regional question fails validation', () => {
  it('AC-004-42: the turn abstains instead of returning an answer', async () => {
    const stateId = topPassageId(MADRID_QUESTION, (passage) => passage.jurisdiction === 'state');
    const response = await answerQuestion(
      { message: MADRID_QUESTION },
      deps(new FakeLlmAdapter({ deltas: [`Según la norma [^p:${stateId}].`] }))
    );

    expect(response.kind).toBe('insufficient_evidence');
    if (response.kind !== 'insufficient_evidence') return;
    expect(response.explanation).toContain(INSUFFICIENT_EXPLANATIONS.unverified_citation);
    expect('citations' in response).toBe(false);
  });
});

describe('AC-004-43 no matching regional passage means abstention', () => {
  it('AC-004-43: a state-only index cannot answer a Madrid question', async () => {
    const stateOnly = buildIndex(
      fixturePassages().filter((passage) => passage.jurisdiction === 'state')
    );
    if (!stateOnly.ok) throw new Error('state-only index failed');

    const response = await answerQuestion(
      { message: MADRID_QUESTION },
      deps(new FakeLlmAdapter({ deltas: ['No debería llamarse.'] }), stateOnly.index)
    );

    expect(response.kind).toBe('insufficient_evidence');
    if (response.kind !== 'insufficient_evidence') return;
    expect(response.explanation).toContain(INSUFFICIENT_EXPLANATIONS.no_results);
  });
});

describe('AC-004-44 state jurisdiction is unchanged', () => {
  it('AC-004-44: a state question cites state passages as before', async () => {
    const message = '¿Puedo deducirme el alquiler de mi vivienda habitual?';
    const id = topPassageId(message);
    const response = await answerQuestion(
      { message },
      deps(new FakeLlmAdapter({ deltas: [`Según la norma [^p:${id}].`] }))
    );

    expect(response.kind).toBe('answer');
    if (response.kind !== 'answer') return;
    expect(response.citations.length).toBeGreaterThan(0);
    for (const citation of response.citations) {
      expect(citation.jurisdiction).toBe('state');
      expect(citation.publisher).toBe('boe');
    }
  });
});
