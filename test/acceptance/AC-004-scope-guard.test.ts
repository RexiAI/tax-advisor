import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { OUT_OF_SCOPE_EXPLANATION, UNCOVERED_COMMUNITY_EXPLANATION } from '@/content/strings';
import { REGISTRY_COVERAGE } from '@/domain/allowed-norms';
import type { CoveragePair } from '@/domain/coverage';
import { search } from '@/retrieval/index';
import { answerQuestion } from '@/service/answer-question';
import { createConversationStore } from '@/service/conversation-store';
import { classifyScope } from '@/service/scope-guard';
import { createTurnTelemetry } from '@/service/types';

import { FakeLlmAdapter } from '../support/fake-llm-adapter';
import { fixtureCorpus, repoPath } from '../support/harness';

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

function madridPassageId(message: string): string {
  const [top] = search(fixtureCorpus().index, message, undefined, (passage) => passage.jurisdiction === 'madrid');
  if (top === undefined) throw new Error(`fixture corpus has no Madrid match for ${message}`);
  return top.passage.passageId;
}

describe('AC-004-36 a covered (jurisdiction, tax) question reaches retrieval', () => {
  it('AC-004-36: Madrid IRPF deductions are not refused and the model is called', async () => {
    const message = '¿Qué deducciones autonómicas tengo en Madrid como autónomo?';
    expect(classifyScope(message)).toBeNull();

    const adapter = new FakeLlmAdapter({
      deltas: [`Según la norma [^p:${madridPassageId(message)}].`],
    });
    const response = await answerQuestion({ message }, deps(adapter));

    expect(response.kind).not.toBe('out_of_scope');
    expect(response.kind).not.toBe('clarification');
    expect(adapter.callCount).toBe(1);
  });
});

describe('AC-004-37 an uncovered (jurisdiction, tax) is refused naming the body', () => {
  it('AC-004-37: Madrid ITP is refused and names the Community of Madrid', () => {
    const match = classifyScope('¿Cuánto pago de ITP en Madrid?');
    expect(match).not.toBeNull();
    expect(match?.reasonCode).toBe('itp');
    expect(match?.officialBody).toBe('la autoridad tributaria de la Comunidad de Madrid');
  });
});

describe('AC-004-38 an unknown jurisdiction asks the clarification, never guesses', () => {
  it('AC-004-38: a nameless regional question routes to the comunidad autónoma clarification', async () => {
    const message = '¿Qué deducciones autonómicas me aplico?';
    const adapter = new FakeLlmAdapter({ deltas: ['No debería llamarse.'] });
    const response = await answerQuestion({ message }, deps(adapter));

    expect(response.kind).toBe('clarification');
    if (response.kind !== 'clarification') return;
    expect(response.question).toMatch(/comunidad autónoma/i);
    expect(adapter.callCount).toBe(0);
    expect(response.question).not.toMatch(/madrid/i);
  });
});

describe('AC-004-39 the IBI boundary note from spec 003 is preserved', () => {
  it('AC-004-39: the IBI question keeps its reason code and official body', () => {
    const match = classifyScope('¿Cuánto es el IBI de mi vivienda?');
    expect(match?.reasonCode).toBe('ibi');
    expect(match?.officialBody).toBe('la autoridad tributaria de tu comunidad autónoma');
  });
});

describe('AC-004-40 the refusal is coverage-driven, not a hardcoded list', () => {
  it('AC-004-40: injecting (madrid, itp) makes the ITP refusal disappear', () => {
    const message = '¿Cuánto pago de ITP en Madrid?';
    expect(classifyScope(message)).not.toBeNull();

    const expanded: readonly CoveragePair[] = [
      ...REGISTRY_COVERAGE,
      { jurisdiction: 'madrid', tax: 'itp' },
    ];
    expect(classifyScope(message, expanded)).toBeNull();
  });

  it('AC-004-40: the guard source consults the lookup and hardcodes no covered pair list', () => {
    const source = readFileSync(repoPath('src/service/scope-guard.ts'), 'utf8');
    expect(source).toContain('isCovered');
    expect(source).not.toMatch(/jurisdiction:\s*'(?:state|madrid|murcia)'\s*,\s*tax:/);
    expect(source).not.toMatch(/covered\s*[:=]\s*\[/i);
  });
});

describe('AC-004-50 a named community outside the matrix is refused, not clarified', () => {
  it('AC-004-50: Galicia is refused with uncovered_community and its competent body', async () => {
    const message = '¿Qué deducciones autonómicas tengo en Galicia como autónomo?';
    const adapter = new FakeLlmAdapter({ deltas: ['No debería llamarse.'] });
    const response = await answerQuestion({ message }, deps(adapter));

    expect(response.kind).toBe('out_of_scope');
    if (response.kind !== 'out_of_scope') return;
    expect(response.reasonCode).toBe('uncovered_community');
    expect(response.officialBody).toBe('la autoridad tributaria de Galicia');
    expect(response.officialBody).not.toContain('tu comunidad autónoma');
    expect(adapter.callCount).toBe(0);
  });
});

describe('AC-004-51 the uncovered-community refusal is deterministic, no model call', () => {
  it('AC-004-51: the decision comes from the coverage lookup alone', async () => {
    const message = '¿Qué deducciones autonómicas tengo en Galicia como autónomo?';
    const adapter = new FakeLlmAdapter({ deltas: ['No debería llamarse.'] });
    const first = await answerQuestion({ message }, deps(adapter));
    const second = await answerQuestion({ message }, deps(adapter));

    expect(first).toEqual(second);
    expect(adapter.callCount).toBe(0);

    // The same message in a community the matrix knows is not refused by the
    // coverage lookup: the difference is the pair, not the wording.
    const madrid = await answerQuestion(
      { message: '¿Qué deducciones autonómicas tengo en Madrid como autónomo?' },
      deps(new FakeLlmAdapter({ deltas: [] }))
    );
    expect(madrid.kind).not.toBe('out_of_scope');
  });
});

describe('AC-004-52 the refusal states that coverage does not extend', () => {
  it('AC-004-52: the explanation names Galicia and its body, with no placeholder left', async () => {
    const response = await answerQuestion(
      { message: '¿Qué deducciones autonómicas tengo en Galicia como autónomo?' },
      deps(new FakeLlmAdapter({ deltas: [] }))
    );
    if (response.kind !== 'out_of_scope') throw new Error('expected a refusal');

    expect(response.explanation).toContain(UNCOVERED_COMMUNITY_EXPLANATION.slice(0, 40));
    expect(response.explanation).toContain('Galicia');
    expect(response.explanation).toContain('la autoridad tributaria de Galicia');
    expect(response.explanation).toMatch(/no cubre la normativa/i);
    expect(response.explanation).not.toContain('{');
    expect(response.explanation).not.toContain('}');
  });

  it('AC-004-52: the refusal keeps the existing outline and does not use the generic template', async () => {
    const response = await answerQuestion(
      { message: '¿Qué deducciones autonómicas tengo en Galicia como autónomo?' },
      deps(new FakeLlmAdapter({ deltas: [] }))
    );
    if (response.kind !== 'out_of_scope') throw new Error('expected a refusal');
    expect(response.explanation).not.toMatch(/Lo que sí cubro/);
    expect(response.explanation).not.toContain(OUT_OF_SCOPE_EXPLANATION.slice(0, 20));
  });
});

describe('the named-community recognizer is deterministic', () => {
  it('resolves pilot communities and refuses the rest', () => {
    expect(classifyScope('¿Qué deducciones autonómicas tengo en Murcia?')).toBeNull();
    expect(classifyScope('¿Qué deducciones autonómicas tengo en Galicia?')?.reasonCode).toBe(
      'uncovered_community'
    );
    expect(classifyScope('¿Qué deducciones autonómicas tengo en el País Vasco?')?.officialBody).toBe(
      'la autoridad tributaria del País Vasco'
    );
    expect(classifyScope('¿Qué deducciones autonómicas tengo en Castilla y León?')?.officialBody).toBe(
      'la autoridad tributaria de la Comunidad de Castilla y León'
    );
  });

  it('does not treat an autónomo as a region', () => {
    expect(classifyScope('¿Cuánto IVA pago siendo autónomo?')).toBeNull();
  });
});
