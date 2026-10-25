import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { gestorGuide } from '@/content/gestor-guides';
import { search } from '@/retrieval/index';
import { answerQuestion } from '@/service/answer-question';
import { createConversationStore } from '@/service/conversation-store';
import { createTurnTelemetry } from '@/service/types';

import { FakeLlmAdapter } from '../support/fake-llm-adapter';
import { fixtureCorpus, repoPath } from '../support/harness';

const PRESERVED: readonly (readonly [string, string])[] = [
  ['¿Cuánto tengo que pagar de ITP por la compra de mi casa?', 'ITP'],
  ['¿Cuánto se paga de ISD por una herencia?', 'Sucesiones'],
  ['Soy no residente y tengo una casa en España', 'No residentes'],
  ['¿Cómo tributa el Impuesto sobre Sociedades?', 'Sociedades'],
  ['Soy de Bizkaia, ¿dónde presento el IRPF?', 'forales'],
  ['¿Cómo se presenta el modelo 130?', '130'],
  ['¿Cómo se presenta el modelo 131?', '131'],
  ['¿Cómo se presenta el modelo 100?', '100'],
  ['¿Qué gastos puedo deducirme como autónomo?', 'Gastos deducibles'],
  ['¿Cómo hago una nómina?', 'Nóminas'],
  ['¿Tengo que depositar las cuentas anuales?', 'Contabilidad'],
  ['¿Cómo presento con certificado digital?', 'Presentación'],
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
  return new FakeLlmAdapter({ deltas: [`La norma lo regula [^p:${top.passage.passageId}].`] });
}

function sourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...sourceFiles(full));
    else if (/\.(ts|tsx)$/.test(entry)) out.push(full);
  }
  return out;
}

describe('AC-002-16 to AC-002-18 the VAT, RETA and censal matchers no longer intercept', () => {
  it('AC-002-16: gestorGuide is null for a VAT question', () => {
    expect(gestorGuide('¿cuánto IVA pago?')).toBeNull();
  });

  it('AC-002-17: gestorGuide is null for a quota / RETA question', () => {
    expect(gestorGuide('¿cuánto es la cuota de autónomos?')).toBeNull();
    expect(gestorGuide('¿cuál es la base de cotización que me corresponde?')).toBeNull();
  });

  it('AC-002-18: gestorGuide is null for the censal and VAT models', () => {
    for (const message of [
      '¿cómo se presenta el modelo 303?',
      'modelo 390',
      'modelo 036',
      '¿qué modelos presenta un autónomo?',
      '¿cómo hago una factura con IVA?',
    ]) {
      expect(gestorGuide(message), message).toBeNull();
    }
  });

  it('AC-002-18: the withdrawn constants are gone from src/', () => {
    const offenders: string[] = [];
    for (const file of sourceFiles(repoPath('src'))) {
      const source = readFileSync(file, 'utf8');
      if (
        /IVA_GUIDE|FACTURA_GUIDE|RETA_GUIDE|MODELS_OVERVIEW|MODEL_303|MODEL_390|MODEL_036/.test(
          source
        )
      ) {
        offenders.push(file);
      }
    }
    expect(offenders).toEqual([]);
  });

  it('AC-002-16 and AC-002-17: the turn reaches retrieval and never renders a guide', async () => {
    for (const message of ['¿cuánto IVA pago?', '¿cuánto es la cuota de autónomos?']) {
      const adapter = citingAdapter(message);
      const response = await answerQuestion({ message }, deps(adapter));

      expect(response.kind, message).not.toBe('guide');
      expect(['answer', 'insufficient_evidence', 'clarification'], message).toContain(
        response.kind
      );
      expect(adapter.callCount, message).toBe(1);
      if (response.kind === 'answer') expect(response.citations.length).toBeGreaterThan(0);
    }
  });
});

describe('AC-002-19 the preserved guides keep answering', () => {
  it('AC-002-19: every preserved guide still returns its title and steps', () => {
    for (const [message, expectedTitle] of PRESERVED) {
      const guide = gestorGuide(message);
      expect(guide, message).not.toBeNull();
      expect(guide?.title, message).toContain(expectedTitle);
      expect(guide?.steps.length, message).toBeGreaterThan(0);
      expect(guide?.links.length, message).toBeGreaterThan(0);
    }
  });

  it('AC-002-19: «preséntame el 303» is still a filing handoff with no model call', async () => {
    const adapter = new FakeLlmAdapter({ deltas: [] });
    const response = await answerQuestion({ message: 'preséntame el 303' }, deps(adapter));

    expect(response.kind).toBe('out_of_scope');
    if (response.kind !== 'out_of_scope') return;
    expect(response.reasonCode).toBe('filing_request');
    expect(adapter.callCount).toBe(0);
  });
});

describe('AC-002-20 a preserved guide never shadows an answerable question', () => {
  it('AC-002-20: the VAT expenses question falls through to retrieval, not the IRPF guide', async () => {
    const message = '¿qué gastos son deducibles en el IVA?';
    expect(gestorGuide(message)).toBeNull();

    const adapter = citingAdapter(message);
    const response = await answerQuestion({ message }, deps(adapter));

    expect(response.kind).not.toBe('guide');
    expect(adapter.callCount).toBe(1);
  });
});
