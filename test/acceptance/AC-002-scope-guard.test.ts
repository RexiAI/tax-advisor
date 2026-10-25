import { describe, expect, it } from 'vitest';

import { OUT_OF_SCOPE_TOPICS } from '@/content/scope-topics';
import { search } from '@/retrieval/index';
import { answerQuestion } from '@/service/answer-question';
import { createConversationStore } from '@/service/conversation-store';
import { classifyScope } from '@/service/scope-guard';
import { createTurnTelemetry } from '@/service/types';

import { FakeLlmAdapter } from '../support/fake-llm-adapter';
import { fixtureCorpus } from '../support/harness';

const REMAINING_TOPICS: readonly (readonly [string, string, string])[] = [
  ['filing_request', 'la presentación de la declaración', 'Agencia Tributaria'],
  ['itp', 'el ITP', 'la autoridad tributaria de tu comunidad autónoma'],
  ['isd', 'el ISD', 'la autoridad tributaria de tu comunidad autónoma'],
  ['ibi', 'el IBI', 'la autoridad tributaria de tu comunidad autónoma'],
  ['non_residents', 'el impuesto sobre la renta de no residentes', 'Agencia Tributaria'],
  ['company_tax', 'el Impuesto sobre Sociedades', 'Agencia Tributaria'],
];

const REPRESENTATIVE: readonly (readonly [string, string])[] = [
  ['filing_request', 'Hazme la declaración de la renta de 2024'],
  ['itp', '¿Cuánto tengo que pagar de ITP por la compra de mi casa?'],
  ['isd', '¿Cuánto se paga de ISD por una herencia?'],
  ['ibi', '¿Cuánto es el IBI de mi vivienda?'],
  ['non_residents', 'Soy no residente y tengo una casa en España'],
  ['company_tax', '¿Cómo tributa el Impuesto sobre Sociedades?'],
];

function deps(adapter: FakeLlmAdapter) {
  return {
    index: fixtureCorpus().index,
    adapter,
    config: { minRetrievalScore: 0.01, retrievalTopK: 5, corpusTaxYear: 2025 },
    conversations: createConversationStore(),
    telemetry: createTurnTelemetry(),
    now: () => 1_000,
  };
}

function citingAdapter(message: string): FakeLlmAdapter {
  const [top] = search(fixtureCorpus().index, message);
  if (top === undefined) throw new Error(`fixture corpus has no match for ${message}`);
  return new FakeLlmAdapter({ deltas: [`Según la norma [^p:${top.passage.passageId}].`] });
}

async function ask(message: string, adapter = new FakeLlmAdapter({ deltas: [] })) {
  const response = await answerQuestion({ message }, deps(adapter));
  return { response, adapter };
}

describe('AC-002-08 the three newly answerable subjects leave the out-of-scope map', () => {
  it('AC-002-08: classifyScope returns null for IVA, quota and registration', () => {
    expect(classifyScope('¿cuánto IVA pago?')).toBeNull();
    expect(classifyScope('¿cuánto es la cuota de autónomos?')).toBeNull();
    expect(classifyScope('me quiero dar de alta como autónomo')).toBeNull();
  });

  it('AC-002-08: the map carries only the six remaining reason codes', () => {
    expect(OUT_OF_SCOPE_TOPICS.map((topic) => topic.reasonCode)).toEqual([
      'filing_request',
      'itp',
      'isd',
      'ibi',
      'non_residents',
      'company_tax',
    ]);
  });
});

describe('AC-002-09 the six remaining subjects classify exactly as before', () => {
  it('AC-002-09: every remaining topic keeps its reasonCode, label and official body', () => {
    for (const [reasonCode, label, officialBody] of REMAINING_TOPICS) {
      const topic = OUT_OF_SCOPE_TOPICS.find((candidate) => candidate.reasonCode === reasonCode);
      expect(topic, `missing ${reasonCode}`).toBeDefined();
      expect(topic?.label).toBe(label);
      expect(topic?.officialBody).toBe(officialBody);
    }

    for (const [reasonCode, message] of REPRESENTATIVE) {
      expect(classifyScope(message)?.reasonCode, message).toBe(reasonCode);
    }
  });

  it('AC-002-09: first match wins, so a filing request that names IVA stays a filing request', () => {
    const match = classifyScope('Preséntame la declaración del IVA de este trimestre');
    expect(match?.reasonCode).toBe('filing_request');
    expect(match?.label).toBe('la presentación de la declaración');
  });
});

describe('AC-002-10 a mixed IVA + autónomo question reaches retrieval', () => {
  it('AC-002-10: classifyScope is null, the turn is not refused and the model is called', async () => {
    const message = '¿cuánto IVA pago siendo autónomo?';
    expect(classifyScope(message)).toBeNull();

    const { response, adapter } = await ask(message, citingAdapter(message));

    expect(response.kind).not.toBe('out_of_scope');
    expect(response.kind).not.toBe('guide');
    expect(adapter.callCount).toBe(1);
  });
});

describe('AC-002-11 a filing request is still a handoff', () => {
  it('AC-002-11: «preséntame el 303» classifies as filing_request and never calls the model', async () => {
    expect(classifyScope('preséntame el 303')?.reasonCode).toBe('filing_request');

    const { response, adapter } = await ask('preséntame el 303');
    expect(response.kind).toBe('out_of_scope');
    if (response.kind !== 'out_of_scope') return;
    expect(response.reasonCode).toBe('filing_request');
    expect(adapter.callCount).toBe(0);
  });
});
