import { describe, expect, it } from 'vitest';

import { IBI_BOUNDARY_NOTE } from '@/content/strings';
import { ALLOWED_NORMS } from '@/domain/allowed-norms';
import { normIdOfPassageId } from '@/domain/passage';
import { buildEvidence } from '@/evidence/build-evidence';
import { search } from '@/retrieval/index';
import { answerQuestion } from '@/service/answer-question';
import { createConversationStore } from '@/service/conversation-store';
import { createTurnTelemetry } from '@/service/types';

import { FakeLlmAdapter } from '../support/fake-llm-adapter';
import { fixtureCorpus } from '../support/harness';

const VERBATIM = 'dime si me puedo deducir la luz, agua e ibi si me doy de alta de autonomo';
const CONFIG = { minRetrievalScore: 0.01, retrievalTopK: 5, corpusTaxYear: 2025 };

function deps(adapter: FakeLlmAdapter) {
  return {
    index: fixtureCorpus().index,
    adapter,
    config: CONFIG,
    conversations: createConversationStore(),
    telemetry: createTurnTelemetry(),
    now: () => 1_000,
  };
}

async function ask(message: string, adapter: FakeLlmAdapter) {
  return answerQuestion({ message }, deps(adapter));
}

function retrievedPassageIds(message: string): readonly string[] {
  const bundle = buildEvidence(message, fixtureCorpus().index, CONFIG);
  return bundle.passages.map((passage) => passage.passageId);
}

function citingAdapter(message: string, text?: (passageId: string) => string): FakeLlmAdapter {
  const [top] = search(fixtureCorpus().index, message);
  if (top === undefined) throw new Error(`fixture corpus has no match for ${message}`);
  const passageId = top.passage.passageId;
  return new FakeLlmAdapter({
    deltas: [text === undefined ? `Según la norma [^p:${passageId}].` : text(passageId)],
  });
}

describe('AC-003-05 the constant names IBI and cites nothing', () => {
  it('AC-003-05: the note is pinned, names the tax and carries no figure, article or marker', () => {
    expect(IBI_BOUNDARY_NOTE).toBe(
      'Tu pregunta menciona el IBI. Sus normas propias no están cubiertas por el corpus que este asesor cita, así que no puedo confirmar nada sobre él.'
    );
    expect(IBI_BOUNDARY_NOTE).toContain('IBI');
    expect(IBI_BOUNDARY_NOTE).toMatch(/no están cubiert|no puedo confirmar/);
    expect(IBI_BOUNDARY_NOTE).not.toContain('[^p:');
    expect(IBI_BOUNDARY_NOTE).not.toMatch(/%\s*\d|\d\s*%/);
    expect(IBI_BOUNDARY_NOTE).not.toMatch(/art(?:ículo|\.)\s*\d/i);
  });
});

describe('AC-003-06 an answered turn with an IBI mention carries the note', () => {
  it('AC-003-06: the answer carries the constant and cites only retrieved passages', async () => {
    const response = await ask(VERBATIM, citingAdapter(VERBATIM));

    expect(response.kind).toBe('answer');
    if (response.kind !== 'answer') return;
    expect(response.boundaryNote).toBe(IBI_BOUNDARY_NOTE);

    const retrieved = retrievedPassageIds(VERBATIM);
    expect(response.citations.length).toBeGreaterThan(0);
    for (const citation of response.citations) {
      expect(retrieved).toContain(citation.passageId);
    }
  });
});

describe('AC-003-07 the note is deterministic and model-independent', () => {
  it('AC-003-07: a model that never names IBI and one that does both carry the same note', async () => {
    const silent = await ask(
      VERBATIM,
      citingAdapter(VERBATIM, (passageId) => `Puedes deducir la luz y el agua [^p:${passageId}].`)
    );
    const talkative = await ask(
      VERBATIM,
      citingAdapter(
        VERBATIM,
        (passageId) => `El IBI lo fija cada ayuntamiento; la luz y el agua no [^p:${passageId}].`
      )
    );

    expect(silent.kind).toBe('answer');
    expect(talkative.kind).toBe('answer');
    if (silent.kind !== 'answer' || talkative.kind !== 'answer') return;
    expect(silent.boundaryNote).toBe(IBI_BOUNDARY_NOTE);
    expect(talkative.boundaryNote).toBe(IBI_BOUNDARY_NOTE);
    expect(silent.boundaryNote).toBe(talkative.boundaryNote);
  });
});

describe('AC-003-08 IBI-deductibility-only is not refused and claims no corpus support', () => {
  it('AC-003-08: the turn is answered or abstains, never refused, and the note is present', async () => {
    const message = '¿Puedo deducirme el IBI?';
    const response = await ask(message, citingAdapter(message));

    expect(response.kind).not.toBe('out_of_scope');
    expect(response.kind).not.toBe('guide');
    if (response.kind !== 'answer' && response.kind !== 'insufficient_evidence') {
      throw new Error(`unexpected kind ${response.kind}`);
    }
    expect(response.boundaryNote).toBe(IBI_BOUNDARY_NOTE);

    if (response.kind !== 'answer') return;
    const allowed = new Set(ALLOWED_NORMS.map((norm) => norm.normId));
    for (const citation of response.citations) {
      expect(allowed).toContain(normIdOfPassageId(citation.passageId));
    }
  });
});

describe('AC-003-09 the note is absent on a plain answer and on a refusal', () => {
  it('AC-003-09: a question that never names IBI has no note, and a refusal has no field at all', async () => {
    const plain = '¿Puedo deducirme el alquiler de mi vivienda habitual?';
    const answer = await ask(plain, citingAdapter(plain));

    expect(answer.kind).toBe('answer');
    if (answer.kind !== 'answer') return;
    expect(answer.boundaryNote).toBeUndefined();
    expect('boundaryNote' in answer).toBe(false);

    const refusal = await ask(
      '¿Cuánto es el IBI de mi vivienda?',
      new FakeLlmAdapter({ deltas: [] })
    );
    expect(refusal.kind).toBe('out_of_scope');
    expect('boundaryNote' in refusal).toBe(false);
  });
});
