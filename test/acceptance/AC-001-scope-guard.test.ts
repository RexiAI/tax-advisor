import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { search } from '@/retrieval/index';
import { answerQuestion } from '@/service/answer-question';
import { createConversationStore } from '@/service/conversation-store';
import { createTurnTelemetry } from '@/service/types';

import { FakeLlmAdapter } from '../support/fake-llm-adapter';
import { fixtureCorpus, repoPath } from '../support/harness';

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

async function ask(message: string, adapter = new FakeLlmAdapter({ deltas: [] })) {
  const response = await answerQuestion({ message }, deps(adapter));
  return { response, adapter };
}

describe('AC-001-55 a VAT question is answered from the corpus, not from a guide', () => {
  // Spec 002 moved VAT into scope: the corpus covers it, so the question reaches
  // retrieval and comes back cited. Asserting a canned guide here would fix the
  // behaviour this spec corrects.
  it('AC-001-55: IVA reaches retrieval and never renders a fixed guide', async () => {
    const message = '¿Cuánto IVA tengo que pagar por mi factura?';
    const [top] = search(fixtureCorpus().index, message);
    if (top === undefined) throw new Error('fixture corpus has no match for the VAT question');

    const { response, adapter } = await ask(
      message,
      new FakeLlmAdapter({ deltas: [`La norma lo regula [^p:${top.passage.passageId}].`] })
    );

    expect(response.kind).not.toBe('guide');
    expect(response.kind).not.toBe('out_of_scope');
    expect(adapter.callCount).toBe(1);
    if (response.kind !== 'answer') return;
    expect(response.citations.length).toBeGreaterThan(0);
  });
});

describe('AC-001-56 regional taxes get guides or regional routing', () => {
  it('AC-001-56: ITP and ISD return guides; IBI still names the regional authority', async () => {
    const itp = await ask('¿Cuánto tengo que pagar de ITP por la compra de mi casa?');
    expect(itp.response.kind).toBe('guide');
    if (itp.response.kind === 'guide') expect(itp.response.title).toContain('ITP');
    expect(itp.adapter.callCount).toBe(0);

    const isd = await ask('¿Cuánto se paga de ISD por una herencia?');
    expect(isd.response.kind).toBe('guide');
    if (isd.response.kind === 'guide') expect(isd.response.title).toContain('Sucesiones');
    expect(isd.adapter.callCount).toBe(0);

    const ibi = await ask('¿Cuánto es el IBI de mi vivienda?');
    expect(ibi.response.kind).toBe('out_of_scope');
    if (ibi.response.kind !== 'out_of_scope') return;
    expect(ibi.response.officialBody).toContain('comunidad autónoma');
    expect(ibi.adapter.callCount).toBe(0);
  });
});

describe('AC-001-57 Social Security is in scope; non-residents and company tax get guides', () => {
  // Spec 002 moved the contribution quota (RETA) into scope: the LGSS is in the
  // corpus, so the question is answered with a citation instead of a refusal.
  it('AC-001-57: the contribution question reaches retrieval', async () => {
    const message = '¿Cuánto pago a la Seguridad Social como autónomo?';
    const [top] = search(fixtureCorpus().index, message);
    if (top === undefined) throw new Error('fixture corpus has no match for the quota question');

    const { response, adapter } = await ask(
      message,
      new FakeLlmAdapter({ deltas: [`La norma lo regula [^p:${top.passage.passageId}].`] })
    );

    expect(response.kind).not.toBe('out_of_scope');
    expect(adapter.callCount).toBe(1);
  });

  it('AC-001-57: non-residents and company tax return guides', async () => {
    const nonResident = await ask(
      'Soy no residente y tengo una casa en España, ¿qué impuesto pago?'
    );
    expect(nonResident.response.kind).toBe('guide');
    if (nonResident.response.kind === 'guide') {
      expect(nonResident.response.title).toContain('No residentes');
    }

    const company = await ask('¿Cómo tributa el Impuesto sobre Sociedades?');
    expect(company.response.kind).toBe('guide');
    if (company.response.kind === 'guide') {
      expect(company.response.title).toContain('Sociedades');
    }
  });
});

describe('autónomo expense questions get a deduction checklist', () => {
  it('returns the expenses guide with the BOE article 30 link', async () => {
    const { response, adapter } = await ask('¿Qué gastos puedo deducirme como autónomo?');

    expect(response.kind).toBe('guide');
    if (response.kind !== 'guide') return;
    expect(response.title).toContain('Gastos deducibles');
    expect(response.links.some((link) => link.href.includes('BOE-A-2006-20764'))).toBe(true);
    expect(adapter.callCount).toBe(0);
  });
});

describe('RETA questions reach retrieval, not a fixed guide', () => {
  it('answers the quota question from the corpus', async () => {
    const message = '¿Cuánto es la cuota de autónomos este año?';
    const [top] = search(fixtureCorpus().index, message);
    if (top === undefined) throw new Error('fixture corpus has no match for the quota question');

    const { response, adapter } = await ask(
      message,
      new FakeLlmAdapter({ deltas: [`La norma lo regula [^p:${top.passage.passageId}].`] })
    );

    expect(response.kind).not.toBe('guide');
    expect(adapter.callCount).toBe(1);
  });
});

describe('the censal and VAT models are answered from the corpus', () => {
  it('sends the 303 question to retrieval instead of a model card', async () => {
    const message = '¿Cómo se presenta el modelo 303?';
    const [top] = search(fixtureCorpus().index, message);
    if (top === undefined) throw new Error('fixture corpus has no match for the 303 question');

    const { response, adapter } = await ask(
      message,
      new FakeLlmAdapter({ deltas: [`La norma lo regula [^p:${top.passage.passageId}].`] })
    );

    expect(response.kind).not.toBe('guide');
    expect(adapter.callCount).toBe(1);
  });
});

describe('autónomo registration is answered from the corpus, not from a constant', () => {
  it('reaches retrieval and cites a retrieved passage', async () => {
    const message = 'Me quiero dar de alta como autónomo en España. Dime pasos';
    const [top] = search(fixtureCorpus().index, message);
    if (top === undefined)
      throw new Error('fixture corpus has no match for the registration question');

    const { response, adapter } = await ask(
      message,
      new FakeLlmAdapter({ deltas: [`La norma lo exige [^p:${top.passage.passageId}].`] })
    );

    expect(response.kind).not.toBe('out_of_scope');
    expect(adapter.callCount).toBe(1);
    if (response.kind !== 'answer') return;
    expect(response.citations.length).toBeGreaterThan(0);
  });
});

describe('AC-001-58 a filing request is out of scope, and IVA is answered from the corpus', () => {
  it('AC-001-58: filing is refused and a mixed IRPF/IVA message reaches retrieval', async () => {
    const filing = await ask('Hazme la declaración de la renta de 2024');
    expect(filing.response.kind).toBe('out_of_scope');
    if (filing.response.kind !== 'out_of_scope') return;
    expect(filing.response.reasonCode).toBe('filing_request');
    expect(filing.adapter.callCount).toBe(0);
    // The old regex (/presentar|firmar/) was written for copy that never used
    // those words at all; the corrected refusal explains where to file ("Para
    // presentar, la administración competente es..."), so the assertion now
    // checks the claim it was actually making: no promise to file on the user's
    // behalf.
    expect(filing.response.explanation).toMatch(/No presento declaraciones/i);
    expect(filing.response.explanation).not.toMatch(/puedo presentar|voy a presentar|te presento/i);
    expect(filing.response.explanation.toLowerCase()).not.toContain('explico el irpf');

    const message = '¿Puedo deducir el alquiler y cuánto IVA pago?';
    const [top] = search(fixtureCorpus().index, message);
    if (top === undefined) throw new Error('fixture corpus has no match for the mixed message');
    const mixed = await ask(
      message,
      new FakeLlmAdapter({ deltas: [`La norma lo regula [^p:${top.passage.passageId}].`] })
    );
    expect(mixed.response.kind).not.toBe('guide');
    expect(mixed.adapter.callCount).toBe(1);
  });

  it('AC-001-58: the guard imports the classification map instead of inlining strings', () => {
    const source = readFileSync(repoPath('src/service/scope-guard.ts'), 'utf8');
    expect(source).toContain("from '../content/scope-topics'");
    expect(source).not.toContain('Agencia Tributaria');
    expect(source).not.toContain('Tesorería General');
  });
});
