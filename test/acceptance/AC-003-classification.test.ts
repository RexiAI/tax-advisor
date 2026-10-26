import { describe, expect, it } from 'vitest';

import { search } from '@/retrieval/index';
import { answerQuestion } from '@/service/answer-question';
import { createConversationStore } from '@/service/conversation-store';
import { classifyScope } from '@/service/scope-guard';
import { createTurnTelemetry } from '@/service/types';

import { FakeLlmAdapter } from '../support/fake-llm-adapter';
import { fixtureCorpus } from '../support/harness';

/** The sentence the informal ask quotes verbatim: a deductibility question that names IBI. */
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

/** A model turn that cites one passage the turn really retrieved. */
function citingAdapter(message: string): FakeLlmAdapter {
  const [top] = search(fixtureCorpus().index, message);
  if (top === undefined) throw new Error(`fixture corpus has no match for ${message}`);
  return new FakeLlmAdapter({ deltas: [`Según la norma [^p:${top.passage.passageId}].`] });
}

async function ask(message: string, adapter: FakeLlmAdapter = new FakeLlmAdapter({ deltas: [] })) {
  const response = await answerQuestion({ message }, deps(adapter));
  return { response, adapter };
}

describe('AC-003-01 the verbatim sentence is not refused', () => {
  it('AC-003-01: classifyScope is null, the turn is not refused and the model is called', async () => {
    expect(classifyScope(VERBATIM)).toBeNull();

    const { response, adapter } = await ask(VERBATIM, citingAdapter(VERBATIM));

    expect(response.kind).not.toBe('out_of_scope');
    expect(response.kind).not.toBe('guide');
    expect(adapter.callCount).toBe(1);
  });
});

describe('AC-003-02 a question about the IBI itself is still refused', () => {
  it('AC-003-02: the IBI question keeps its reason code, label and official body', async () => {
    const message = '¿Cuánto es el IBI de mi vivienda?';

    const match = classifyScope(message);
    expect(match?.reasonCode).toBe('ibi');
    expect(match?.label).toBe('el IBI');
    expect(match?.officialBody).toBe('la autoridad tributaria de tu comunidad autónoma');

    const { response, adapter } = await ask(message);
    expect(response.kind).toBe('out_of_scope');
    if (response.kind !== 'out_of_scope') return;
    expect(response.reasonCode).toBe('ibi');
    expect(adapter.callCount).toBe(0);
  });
});

describe('AC-003-03 an IBI-deductibility-only question is not refused', () => {
  it('AC-003-03: «¿Puedo deducirme el IBI?» classifies as in scope', () => {
    expect(classifyScope('¿Puedo deducirme el IBI?')).toBeNull();
  });
});

describe('AC-003-04 the rest of the guard is unchanged', () => {
  it('AC-003-04: the other subjects classify exactly as before', () => {
    // The filing request comes first in the ordered map, so a filing request that
    // happens to name the IBI stays a filing request.
    expect(
      classifyScope('¿Puedes presentarme la declaración y decirme cuánto es el IBI?')?.reasonCode
    ).toBe('filing_request');

    // Rental income from "bienes inmuebles" is core IRPF, not the IBI.
    expect(classifyScope('¿Cómo tributan los rendimientos del alquiler de bienes inmuebles?')).toBeNull();

    // The exemption keys on the IBI topic alone: it does not reach ITP or ISD.
    expect(classifyScope('¿Puedo deducirme el ITP?')?.reasonCode).toBe('itp');
    expect(classifyScope('¿Puedo deducirme el ISD?')?.reasonCode).toBe('isd');

    expect(classifyScope('Soy no residente y tengo una casa en España')?.reasonCode).toBe(
      'non_residents'
    );
    expect(classifyScope('¿Cómo tributa el Impuesto sobre Sociedades?')?.reasonCode).toBe(
      'company_tax'
    );
  });
});

describe('AC-003-12 the desgravar synonym is not refused', () => {
  it('AC-003-12: «¿Me puedo desgravar el IBI?» classifies as in scope', () => {
    expect(classifyScope('¿Me puedo desgravar el IBI?')).toBeNull();
  });
});

describe('AC-003-13 a third-person desgrava question is still about the IBI', () => {
  it('AC-003-13: the third-person form is not a deductibility signal and the turn is refused', async () => {
    const message = '¿Cuánto desgrava el IBI en mi ayuntamiento?';

    const match = classifyScope(message);
    expect(match?.reasonCode).toBe('ibi');
    expect(match?.label).toBe('el IBI');
    expect(match?.officialBody).toBe('la autoridad tributaria de tu comunidad autónoma');

    const { response, adapter } = await ask(message);
    expect(response.kind).toBe('out_of_scope');
    if (response.kind !== 'out_of_scope') return;
    expect(response.reasonCode).toBe('ibi');
    expect(adapter.callCount).toBe(0);
  });
});

describe('AC-003-14 descontar is not a deductibility signal', () => {
  it('AC-003-14: «descontar el IVA» does not exempt the IBI mention from the guard', () => {
    expect(
      classifyScope('¿Puedo descontar el IVA de una factura que incluye el IBI?')?.reasonCode
    ).toBe('ibi');
  });
});
