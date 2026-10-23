import { readFileSync, readdirSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { HANDOFF_URL } from '@/content/strings';
import { search } from '@/retrieval/index';
import { answerQuestion, streamAnswer, type AnswerDeps } from '@/service/answer-question';
import { createConversationStore } from '@/service/conversation-store';
import { createTurnTelemetry, type TurnFrame } from '@/service/types';

import { FakeLlmAdapter, answerScript, chunk } from '../support/fake-llm-adapter';
import { fixtureCorpus, repoPath } from '../support/harness';

const QUERY = '¿Puedo deducirme el alquiler de mi vivienda habitual?';

function topPassageId(query = QUERY): string {
  const [top] = search(fixtureCorpus().index, query);
  if (top === undefined) throw new Error(`fixture corpus has no match for ${query}`);
  return top.passage.passageId;
}

function deps(adapter: FakeLlmAdapter, overrides: Partial<AnswerDeps> = {}): AnswerDeps {
  return {
    index: fixtureCorpus().index,
    adapter,
    config: { minRetrievalScore: 0.01, retrievalTopK: 5, corpusTaxYear: 2025 },
    conversations: createConversationStore(),
    telemetry: createTurnTelemetry(),
    now: () => 1_000,
    ...overrides,
  };
}

async function collectFrames(iterable: AsyncIterable<TurnFrame>): Promise<TurnFrame[]> {
  const frames: TurnFrame[] = [];
  for await (const frame of iterable) frames.push(frame);
  return frames;
}

describe('AC-001-48 a supported turn produces an answer with at least one citation', () => {
  it('AC-001-48: the answer is complete and cites only retrieved passages', async () => {
    const id = topPassageId();
    const adapter = new FakeLlmAdapter(
      answerScript(`El alquiler se deduce con límites [^p:${id}].`)
    );

    const response = await answerQuestion({ message: QUERY }, deps(adapter));

    expect(response.kind).toBe('answer');
    if (response.kind !== 'answer') return;
    expect(response.explanation.length).toBeGreaterThan(0);
    expect(response.rule.length).toBeGreaterThan(0);
    expect(response.disclaimer.length).toBeGreaterThan(0);
    expect(response.citations.length).toBeGreaterThanOrEqual(1);
    expect(response.citations.map((citation) => citation.passageId)).toContain(id);
    expect(adapter.callCount).toBe(1);
  });
});

describe('AC-001-49 insufficient evidence offers the documented handoff', () => {
  it('AC-001-49: no evidence means the documented handoff and no citations field', async () => {
    const response = await answerQuestion(
      { message: 'criptomonedas' },
      deps(new FakeLlmAdapter({ deltas: ['No debería llamarse.'] }))
    );

    expect(response.kind).toBe('insufficient_evidence');
    if (response.kind !== 'insufficient_evidence') return;
    expect(response.explanation.length).toBeGreaterThan(0);
    expect(response.explanation).toMatch(/no puedo confirmar/i);
    expect(response.handoffUrl).toBe(HANDOFF_URL);
    expect(response.disclaimer.length).toBeGreaterThan(0);
    expect('citations' in response).toBe(false);
  });
});

describe('AC-001-50 at most one clarifying question, ever', () => {
  it('AC-001-50: two questions collapse to the first, and a second turn cannot clarify again', async () => {
    const script = { deltas: ['¿En qué año fiscal? ¿En qué comunidad autónoma resides?'] };
    const adapter = new FakeLlmAdapter(script);
    const conversations = createConversationStore();
    const shared = deps(adapter, { conversations });

    const first = await answerQuestion({ message: QUERY, conversationId: 'conv-1' }, shared);
    expect(first.kind).toBe('clarification');
    if (first.kind !== 'clarification') return;
    expect(typeof first.question).toBe('string');
    expect(first.question).toBe('¿En qué año fiscal?');
    expect('questions' in first).toBe(false);

    const second = await answerQuestion(
      { message: QUERY, conversationId: 'conv-1' },
      deps(new FakeLlmAdapter(script), { conversations })
    );
    expect(second.kind).not.toBe('clarification');
  });
});

describe('AC-001-51 a different tax year triggers the notice, 2025 does not', () => {
  it('AC-001-51: 2024 adds the notice, 2025 and no-year messages do not', async () => {
    const id = topPassageId();

    const withOtherYear = await answerQuestion(
      { message: '¿Puedo deducir el alquiler en 2024?' },
      deps(new FakeLlmAdapter(answerScript(`Sí, con límites [^p:${id}].`)))
    );
    expect(withOtherYear.kind).toBe('answer');
    if (withOtherYear.kind !== 'answer') return;
    expect(withOtherYear.yearNotice).toBeDefined();
    expect(withOtherYear.yearNotice).toContain('2025');
    expect(withOtherYear.yearNotice).toMatch(/puede haber cambiado/i);

    const sameYear = await answerQuestion(
      { message: '¿Puedo deducir el alquiler en 2025?' },
      deps(new FakeLlmAdapter(answerScript(`Sí, con límites [^p:${id}].`)))
    );
    expect(sameYear.kind).toBe('answer');
    if (sameYear.kind !== 'answer') return;
    expect(sameYear.yearNotice).toBeUndefined();
    expect('yearNotice' in sameYear).toBe(false);

    const noYear = await answerQuestion(
      { message: QUERY },
      deps(new FakeLlmAdapter(answerScript(`Sí, con límites [^p:${id}].`)))
    );
    expect(noYear.kind).toBe('answer');
    if (noYear.kind !== 'answer') return;
    expect('yearNotice' in noYear).toBe(false);
  });
});

describe('AC-001-52 a replaced stream never emits an invalid citation', () => {
  it('AC-001-52: an unretrieved id ends the stream with a replace frame and never leaks', async () => {
    const adapter = new FakeLlmAdapter({
      deltas: ['Ver [^p:BOE-A-2006-2076', '4#a999].'],
    });

    const frames = await collectFrames(streamAnswer({ message: QUERY }, deps(adapter)));
    const last = frames[frames.length - 1]!;

    expect(last.event).toBe('replace');
    if (last.event === 'delta') return;
    expect(last.payload.kind).toBe('insufficient_evidence');

    for (const frame of frames) {
      expect(JSON.stringify(frame)).not.toContain('a999');
      expect(JSON.stringify(frame)).not.toContain('BOE-A-2006-20764#a999');
    }
  });

  it('AC-001-52: a successful stream ends with the same payload as the non-streaming call', async () => {
    const id = topPassageId();
    const answer = `El alquiler se deduce con límites [^p:${id}].`;

    const streamed = await collectFrames(
      streamAnswer({ message: QUERY }, deps(new FakeLlmAdapter({ deltas: chunk(answer) })))
    );
    const lastFrame = streamed[streamed.length - 1]!;
    expect(lastFrame.event).toBe('final');

    const direct = await answerQuestion(
      { message: QUERY },
      deps(new FakeLlmAdapter({ deltas: chunk(answer) }))
    );

    if (lastFrame.event === 'delta') throw new Error('unexpected delta');
    expect(lastFrame.payload).toEqual(direct);
    expect(streamed.some((frame) => frame.event === 'delta')).toBe(true);
  });
});

describe('AC-001-53 a worked example is rendered only when the answer carries one', () => {
  it('AC-001-53: the key is absent without an example and present with one', async () => {
    const id = topPassageId();

    const without = await answerQuestion(
      { message: QUERY },
      deps(new FakeLlmAdapter(answerScript(`Sí, con límites [^p:${id}].`)))
    );
    expect(without.kind).toBe('answer');
    expect('workedExample' in without).toBe(false);

    const withExample = await answerQuestion(
      { message: QUERY },
      deps(
        new FakeLlmAdapter(
          answerScript(`Sí, con límites [^p:${id}].\n\nEjemplo: con 1.000 € de alquiler, 150 €.`)
        )
      )
    );
    expect(withExample.kind).toBe('answer');
    if (withExample.kind !== 'answer') return;
    expect(withExample.workedExample).toBeDefined();
    expect((withExample.workedExample ?? '').length).toBeGreaterThan(0);
  });
});

describe('AC-001-54 the service performs no I/O of its own', () => {
  it('AC-001-54: no fs, child_process, database client or fetch in src/service', () => {
    const dir = repoPath('src/service');
    for (const file of readdirSync(dir)) {
      const source = readFileSync(`${dir}/${file}`, 'utf8');
      expect(source).not.toMatch(/from\s+['"](node:)?fs['"]/);
      expect(source).not.toMatch(/from\s+['"]child_process['"]/);
      expect(source).not.toMatch(/require\(['"](node:)?(fs|child_process)['"]\)/);
      expect(source).not.toMatch(/mongodb|better-sqlite3|@prisma\/client/);
      expect(source).not.toMatch(/\bfetch\s*\(/);
    }
  });

  it('AC-001-54: a turn without a conversationId leaves the store empty', async () => {
    const id = topPassageId();
    const conversations = createConversationStore();

    await answerQuestion(
      { message: QUERY },
      deps(new FakeLlmAdapter(answerScript(`Sí [^p:${id}].`)), { conversations })
    );

    expect(conversations.size()).toBe(0);
  });
});
