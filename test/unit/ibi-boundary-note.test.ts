/**
 * Unit coverage for Task 2's derivation: which responses carry the IBI boundary
 * note, which never do, and the proof that the note stays out of the model
 * request. The acceptance scenarios cover the two terminal shapes end to end;
 * these cover every abstention reason and every kind the note must skip.
 */

import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { IBI_BOUNDARY_NOTE } from '@/content/strings';
import { search } from '@/retrieval/index';
import { answerQuestion } from '@/service/answer-question';
import { createConversationStore } from '@/service/conversation-store';
import { ibiBoundaryNoteFor } from '@/service/responses';
import { createTurnTelemetry } from '@/service/types';

import { FakeLlmAdapter } from '../support/fake-llm-adapter';
import { fixtureCorpus, repoPath } from '../support/harness';

const VERBATIM = 'dime si me puedo deducir la luz, agua e ibi si me doy de alta de autonomo';

function deps(adapter: FakeLlmAdapter, minRetrievalScore = 0.01) {
  return {
    index: fixtureCorpus().index,
    adapter,
    config: { minRetrievalScore, retrievalTopK: 5, corpusTaxYear: 2025 },
    conversations: createConversationStore(),
    telemetry: createTurnTelemetry(),
    now: () => 1_000,
  };
}

async function ask(
  message: string,
  adapter: FakeLlmAdapter = new FakeLlmAdapter({ deltas: [] }),
  minRetrievalScore = 0.01
) {
  return answerQuestion({ message }, deps(adapter, minRetrievalScore));
}

function citingAdapter(message: string, text?: string): FakeLlmAdapter {
  const [top] = search(fixtureCorpus().index, message);
  if (top === undefined) throw new Error(`fixture corpus has no match for ${message}`);
  return new FakeLlmAdapter({
    deltas: [text ?? `Según la norma [^p:${top.passage.passageId}].`],
  });
}

describe('ibiBoundaryNoteFor', () => {
  it('returns the constant for both IBI forms, whatever the case and accents', () => {
    expect(ibiBoundaryNoteFor('¿Cuánto es el IBI de mi vivienda?')).toBe(IBI_BOUNDARY_NOTE);
    expect(ibiBoundaryNoteFor('pago el IMPUESTO SOBRE BIENES INMUEBLES')).toBe(IBI_BOUNDARY_NOTE);
    expect(ibiBoundaryNoteFor(VERBATIM)).toBe(IBI_BOUNDARY_NOTE);
  });

  it('is undefined when the message does not mention the IBI', () => {
    expect(ibiBoundaryNoteFor('¿Puedo deducirme el alquiler de mi vivienda habitual?')).toBeUndefined();
    expect(ibiBoundaryNoteFor('me voy a ibiza')).toBeUndefined();
  });

  it('is a pure function of the message', () => {
    expect(ibiBoundaryNoteFor(VERBATIM)).toBe(ibiBoundaryNoteFor(VERBATIM));
  });
});

describe('every abstention reason carries the note when the message mentions the IBI', () => {
  it('no_results: the note rides along with the abstention', async () => {
    // No fixture passage scores for this message, so the bundle is empty.
    const response = await ask('¿Me puedo desgravar el IBI?');

    expect(response.kind).toBe('insufficient_evidence');
    if (response.kind !== 'insufficient_evidence') return;
    expect(response.explanation).toContain('No he encontrado');
    expect(response.boundaryNote).toBe(IBI_BOUNDARY_NOTE);
  });

  it('below_threshold: the note survives a pessimistic threshold', async () => {
    const response = await ask(VERBATIM, new FakeLlmAdapter({ deltas: [] }), 999);

    expect(response.kind).toBe('insufficient_evidence');
    if (response.kind !== 'insufficient_evidence') return;
    expect(response.explanation).toContain('no se ajusta lo suficiente');
    expect(response.boundaryNote).toBe(IBI_BOUNDARY_NOTE);
  });

  it('unverified_citation: the note survives a citation that was never retrieved', async () => {
    const response = await ask(VERBATIM, new FakeLlmAdapter({ deltas: ['Cita [^p:BOE-A-2004-4214#a1].'] }));

    expect(response.kind).toBe('insufficient_evidence');
    if (response.kind !== 'insufficient_evidence') return;
    expect(response.explanation).toContain('citaba normas');
    expect(response.boundaryNote).toBe(IBI_BOUNDARY_NOTE);
  });

  it('no_citations: the note survives an answer with no marker', async () => {
    const response = await ask(VERBATIM, new FakeLlmAdapter({ deltas: ['No lo se.'] }));

    expect(response.kind).toBe('insufficient_evidence');
    if (response.kind !== 'insufficient_evidence') return;
    expect(response.explanation).toContain('no se apoya en ningún pasaje');
    expect(response.boundaryNote).toBe(IBI_BOUNDARY_NOTE);
  });

  it('carries the year notice and the boundary note side by side', async () => {
    const message = `${VERBATIM} en 2019`;
    const response = await ask(message, citingAdapter(message));

    expect(response.kind).toBe('answer');
    if (response.kind !== 'answer') return;
    expect(response.yearNotice).toBeDefined();
    expect(response.boundaryNote).toBe(IBI_BOUNDARY_NOTE);
  });
});

describe('the note is kind-exclusive', () => {
  it('is not attached to a clarification', async () => {
    const response = await ask(VERBATIM, new FakeLlmAdapter({ deltas: ['¿Me das más datos?'] }));

    expect(response.kind).toBe('clarification');
    expect('boundaryNote' in response).toBe(false);
  });

  it('is not attached to a guide', async () => {
    const response = await ask('¿Cómo llevo la contabilidad si pago el IBI?');

    expect(response.kind).toBe('guide');
    expect('boundaryNote' in response).toBe(false);
  });

  it('is not attached to a privacy warning', async () => {
    const response = await ask('Mi DNI es 12345678Z y pago el IBI');

    expect(response.kind).toBe('privacy_warning');
    expect('boundaryNote' in response).toBe(false);
  });

  it('is not attached to an error', async () => {
    const response = await ask(VERBATIM, new FakeLlmAdapter({ error: 'timeout' }));

    expect(response.kind).toBe('error');
    expect('boundaryNote' in response).toBe(false);
  });
});

describe('the note never reaches the model', () => {
  it('leaves the assembled system and user messages untouched', async () => {
    const adapter = citingAdapter(VERBATIM);
    await ask(VERBATIM, adapter);

    const [request] = adapter.requests;
    expect(request).toBeDefined();
    if (request === undefined) return;
    const userContent = request.messages.map((message) => message.content).join('\n');
    expect(request.system).not.toContain(IBI_BOUNDARY_NOTE);
    expect(userContent).not.toContain(IBI_BOUNDARY_NOTE);
    expect(request.system).not.toContain('corpus que este asesor cita');
    expect(userContent).not.toContain('corpus que este asesor cita');
  });
});

describe('the field is declared on both response shapes and nowhere else', () => {
  it('types.ts adds boundaryNote to answer and insufficient_evidence only', () => {
    const source = readFileSync(repoPath('src/service/types.ts'), 'utf8');
    const declarations = source.match(/boundaryNote\?: string;/g) ?? [];
    expect(declarations).toHaveLength(2);
  });
});
