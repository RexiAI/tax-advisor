import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { SYSTEM_POLICY } from '@/prompts/system-policy';
import { search } from '@/retrieval/index';
import { answerQuestion } from '@/service/answer-question';
import { createConversationStore } from '@/service/conversation-store';
import { createTurnTelemetry } from '@/service/types';

import { FakeLlmAdapter } from '../support/fake-llm-adapter';
import { fixtureCorpus, repoPath } from '../support/harness';

const VAT_2024 = '¿cuánto IVA pago en 2024?';
const VAT_NO_YEAR = '¿cuánto IVA pago?';
const VAT_2025 = '¿cuánto IVA pago en 2025?';

/** Advisory constants only; the corpus supplies every figure in an answer. */
const ADVISORY_SOURCES = ['src/content', 'src/prompts'];

/**
 * The audit reads the copy a module ships, not its code: a pattern that names a
 * model (`/modelo (303|390|036)/`) is a matcher, while a string that states a
 * figure is advisory content. Only the second kind can hardcode a quantity.
 */
const STRING_LITERAL = /'(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*"|`(?:[^`\\]|\\.)*`/g;

function stringLiterals(source: string): string[] {
  return [...source.matchAll(STRING_LITERAL)].map((match) => match[0].slice(1, -1));
}

const FIGURE_PATTERNS: readonly (readonly [RegExp, string])[] = [
  [/\d+\s*%/, 'a percentage'],
  [/€/, 'a euro amount'],
  [
    /(cuota|base de cotizacion|tramo|tarifa|tipo de iva|importe)\D{0,24}\d/,
    'a quantity phrase with a number',
  ],
];

function sourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...sourceFiles(full));
    else if (/\.(ts|tsx)$/.test(entry)) out.push(full);
  }
  return out;
}

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

function citingAdapterFor(message: string): FakeLlmAdapter {
  const [top] = search(fixtureCorpus().index, message);
  if (top === undefined) throw new Error(`fixture corpus has no match for ${message}`);
  return new FakeLlmAdapter({
    deltas: [`El texto consolidado regula este punto [^p:${top.passage.passageId}].`],
  });
}

describe('AC-002-21 no advisory constant fixes a current quantity', () => {
  it('AC-002-21: content and prompt modules carry no amount, rate or quantity phrase', () => {
    const findings: string[] = [];
    for (const dir of ADVISORY_SOURCES) {
      for (const file of sourceFiles(repoPath(dir))) {
        for (const literal of stringLiterals(readFileSync(file, 'utf8'))) {
          for (const [pattern, description] of FIGURE_PATTERNS) {
            const hit = pattern.exec(literal);
            if (hit !== null) findings.push(`${file}: ${description} (${hit[0]})`);
          }
        }
      }
    }
    expect(findings).toEqual([]);
  });

  it('AC-002-21: the system policy still forbids completing figures', () => {
    expect(SYSTEM_POLICY).toMatch(/no completes cifras/i);
    expect(SYSTEM_POLICY).toMatch(/no uses conocimiento propio/i);
  });
});

describe('AC-002-22 the year notice reaches the new subjects and only with another year', () => {
  it('AC-002-22: a 2024 VAT question answers with a notice naming 2025 and 2024', async () => {
    const response = await answerQuestion({ message: VAT_2024 }, deps(citingAdapterFor(VAT_2024)));

    expect(response.kind).toBe('answer');
    if (response.kind !== 'answer') return;
    expect(response.yearNotice).toBeDefined();
    expect(response.yearNotice).toContain('2025');
    expect(response.yearNotice).toContain('2024');
    expect(response.yearNotice).toMatch(/puede haber cambiado/i);
  });

  it('AC-002-22: no year and the corpus year carry no notice', async () => {
    for (const message of [VAT_NO_YEAR, VAT_2025]) {
      const response = await answerQuestion({ message }, deps(citingAdapterFor(message)));
      expect(response.kind, message).toBe('answer');
      if (response.kind !== 'answer') return;
      expect('yearNotice' in response, message).toBe(false);
    }
  });
});

describe('AC-002-23 a question the corpus does not answer abstains instead of inventing', () => {
  it('AC-002-23: no evidence gives an abstention with the handoff and no figure', async () => {
    const response = await answerQuestion(
      { message: '¿Cuál es la cuota exacta que me toca pagar este trimestre?' },
      deps(new FakeLlmAdapter({ deltas: [] }))
    );

    expect(response.kind).toBe('insufficient_evidence');
    if (response.kind !== 'insufficient_evidence') return;
    expect(response.handoffUrl).toContain('mailto:');
    expect(response.explanation).toMatch(/no puedo confirmar/i);

    const payload = JSON.stringify(response);
    expect(payload).not.toMatch(/\d+\s*%/);
    expect(payload).not.toContain('€');
  });

  it('AC-002-23: an invented figure backed by an unretrieved citation is dropped', async () => {
    const message = '¿Cuánto es la cuota de autónomos que me corresponde?';
    const invented = 'BOE-A-2015-11724#art-inventado';
    const response = await answerQuestion(
      { message },
      deps(new FakeLlmAdapter({ deltas: [`La cuota son 312 euros al mes [^p:${invented}].`] }))
    );

    expect(response.kind).toBe('insufficient_evidence');
    expect(JSON.stringify(response)).not.toContain('312');
    expect(JSON.stringify(response)).not.toContain('art-inventado');
  });
});
