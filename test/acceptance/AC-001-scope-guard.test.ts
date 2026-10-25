import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

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

describe('AC-001-55 a VAT question is answered with the IVA guide', () => {
  it('AC-001-55: IVA returns a guide and never calls the model', async () => {
    const { response, adapter } = await ask('¿Cuánto IVA tengo que pagar por mi factura?');

    expect(response.kind).toBe('guide');
    if (response.kind !== 'guide') return;
    expect(response.title).toContain('IVA');
    expect(response.steps.length).toBeGreaterThan(0);
    expect(response.links.length).toBeGreaterThan(0);
    expect(adapter.callCount).toBe(0);
    expect('citations' in response).toBe(false);
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

describe('AC-001-57 Social Security is routed; non-residents and company tax get guides', () => {
  it('AC-001-57: the remaining out-of-scope case names its body', async () => {
    const { response } = await ask('¿Cuánto pago a la Seguridad Social como autónomo?');
    expect(response.kind).toBe('out_of_scope');
    if (response.kind !== 'out_of_scope') return;
    expect(response.officialBody).toBe('Tesorería General de la Seguridad Social');
    expect('citations' in response).toBe(false);
  });

  it('AC-001-57: non-residents and company tax return guides', async () => {
    const nonResident = await ask('Soy no residente y tengo una casa en España, ¿qué impuesto pago?');
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

describe('RETA questions get a guide, not a bare refusal', () => {
  it('returns the quota guide with official links', async () => {
    const { response, adapter } = await ask('¿Cuánto es la cuota de autónomos este año?');

    expect(response.kind).toBe('guide');
    if (response.kind !== 'guide') return;
    expect(response.title).toContain('Cuota de autónomos');
    expect(response.steps.length).toBeGreaterThan(0);
    expect(adapter.callCount).toBe(0);
  });
});

describe('gestor models are answered with a guide, without the model', () => {
  it('returns the 303 card and never calls the LLM', async () => {
    const { response, adapter } = await ask('¿Cómo se presenta el modelo 303?');

    expect(response.kind).toBe('guide');
    if (response.kind !== 'guide') return;
    expect(response.title).toContain('303');
    expect(response.steps.length).toBeGreaterThan(0);
    expect(response.links.length).toBeGreaterThan(0);
    expect(adapter.callCount).toBe(0);
  });
});

describe('autónomo registration is routed with a checklist, not an IRPF abstention', () => {
  it('returns steps and official links without calling the model', async () => {
    const { response, adapter } = await ask('Me quiero dar de alta como autónomo en España. Dime pasos');

    expect(response.kind).toBe('out_of_scope');
    if (response.kind !== 'out_of_scope') return;
    expect(response.reasonCode).toBe('autonomo_registration');
    expect(response.steps?.length).toBeGreaterThanOrEqual(5);
    expect(response.links?.map((link) => link.href)).toEqual(
      expect.arrayContaining([expect.stringContaining('sede.agenciatributaria.gob.es')])
    );
    expect(adapter.callCount).toBe(0);
    expect('citations' in response).toBe(false);
  });
});

describe('AC-001-58 a filing request is out of scope, and IVA gets its own guide', () => {
  it('AC-001-58: filing is refused and a mixed IRPF/IVA message is answered by the IVA guide', async () => {
    const filing = await ask('Hazme la declaración de la renta de 2024');
    expect(filing.response.kind).toBe('out_of_scope');
    if (filing.response.kind !== 'out_of_scope') return;
    expect(filing.response.reasonCode).toBe('filing_request');
    expect(filing.adapter.callCount).toBe(0);
    expect(JSON.stringify(filing.response)).not.toMatch(/presentar|firmar|representar por/i);

    const mixed = await ask('¿Puedo deducir el alquiler y cuánto IVA pago?');
    expect(mixed.response.kind).toBe('guide');
    if (mixed.response.kind !== 'guide') return;
    expect(mixed.response.title).toContain('IVA');
  });

  it('AC-001-58: the guard imports the classification map instead of inlining strings', () => {
    const source = readFileSync(repoPath('src/service/scope-guard.ts'), 'utf8');
    expect(source).toContain("from '../content/scope-topics'");
    expect(source).not.toContain('Agencia Tributaria');
    expect(source).not.toContain('Tesorería General');
  });
});
