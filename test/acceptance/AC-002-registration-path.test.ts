/**
 * @vitest-environment jsdom
 */
import '@testing-library/jest-dom/vitest';
import '../support/setup-dom';

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { abstentionNotice } from '@/components/ChatScreen/use-chat-turn';
import { HANDOFF_URL, OUT_OF_SCOPE_TITLE } from '@/content/strings';
import { search } from '@/retrieval/index';
import { answerQuestion } from '@/service/answer-question';
import { createConversationStore } from '@/service/conversation-store';
import { classifyScope } from '@/service/scope-guard';
import { createTurnTelemetry, type OutOfScopeResponse } from '@/service/types';

import { FakeLlmAdapter } from '../support/fake-llm-adapter';
import { fixtureCorpus, repoPath } from '../support/harness';
import { askAndWait, renderScreen, submitReturning } from '../support/ui-harness';

const ALTA = 'Me quiero dar de alta como autónomo';

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

function sourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...sourceFiles(full));
    else if (/\.(ts|tsx)$/.test(entry)) out.push(full);
  }
  return out;
}

function citingAdapterFor(message: string): FakeLlmAdapter {
  const [top] = search(fixtureCorpus().index, message);
  if (top === undefined) throw new Error(`fixture corpus has no match for ${message}`);
  return new FakeLlmAdapter({
    deltas: [
      `Para darte de alta, la norma exige ciertos requisitos [^p:${top.passage.passageId}].`,
    ],
  });
}

describe('AC-002-12 the autónomo constant module is gone and nobody imports it', () => {
  it('AC-002-12: the file does not exist and no module references its constants', () => {
    expect(existsSync(repoPath('src/content/autonomo.ts'))).toBe(false);

    const offenders: string[] = [];
    for (const file of sourceFiles(repoPath('src'))) {
      const source = readFileSync(file, 'utf8');
      if (/AUTONOMO_(EXPLANATION|STEPS|LINKS)/.test(source)) offenders.push(file);
      if (/from\s+['"][^'"]*content\/autonomo['"]/.test(source)) offenders.push(file);
    }
    expect(offenders).toEqual([]);
    expect(readFileSync(repoPath('src/service/answer-question.ts'), 'utf8')).not.toContain(
      '../content/autonomo'
    );
  });
});

describe('AC-002-13 the out_of_scope payload loses steps and links', () => {
  it('AC-002-13: the payload carries exactly the six fields, with no steps and no links', async () => {
    const response = await answerQuestion(
      { message: '¿Cuánto es el IBI de mi vivienda?' },
      deps(new FakeLlmAdapter({ deltas: [] }))
    );
    expect(response.kind).toBe('out_of_scope');
    if (response.kind !== 'out_of_scope') return;

    expect(Object.keys(response).sort()).toEqual([
      'disclaimer',
      'explanation',
      'handoffUrl',
      'kind',
      'officialBody',
      'reasonCode',
      'topicLabel',
    ]);
    expect('steps' in response).toBe(false);
    expect('links' in response).toBe(false);
  });

  it('AC-002-13: the type module declares no steps or links on OutOfScopeResponse', () => {
    const source = readFileSync(repoPath('src/service/types.ts'), 'utf8');
    const start = source.indexOf('interface OutOfScopeResponse');
    expect(start).toBeGreaterThan(-1);
    const block = source.slice(start, source.indexOf('}', start));
    expect(block).toContain('reasonCode');
    expect(block).toContain('topicLabel');
    expect(block).toContain('officialBody');
    expect(block).toContain('explanation');
    expect(block).toContain('handoffUrl');
    expect(block).toContain('disclaimer');
    expect(block).not.toContain('steps');
    expect(block).not.toContain('links');
  });

  it('AC-002-13: the payload type itself has no optional steps or links', () => {
    // Compile-time: `steps`/`links` no longer exist on the out-of-scope shape.
    const response: OutOfScopeResponse = {
      kind: 'out_of_scope',
      reasonCode: 'ibi',
      topicLabel: 'el IBI',
      officialBody: 'la autoridad tributaria de tu comunidad autónoma',
      explanation: 'texto',
      handoffUrl: 'mailto:asesoria@example.com',
      disclaimer: 'texto',
    };
    expect(Object.keys(response)).toHaveLength(7);
  });
});

describe('AC-002-15 an autónomo registration question is not answered from a constant', () => {
  it('AC-002-15: the turn reaches retrieval, calls the model once and cites a retrieved passage', async () => {
    expect(classifyScope(ALTA)).toBeNull();

    const adapter = citingAdapterFor(ALTA);
    const response = await answerQuestion({ message: ALTA }, deps(adapter));

    expect(adapter.callCount).toBe(1);
    expect(['answer', 'insufficient_evidence', 'clarification']).toContain(response.kind);
    expect(response.kind).not.toBe('out_of_scope');

    if (response.kind !== 'answer') return;
    expect(response.citations.length).toBeGreaterThanOrEqual(1);
  });

  it('AC-002-15: without support in the corpus it abstains or asks, never refuses with steps', async () => {
    const adapter = new FakeLlmAdapter({ deltas: ['No lo sé.'] });
    const response = await answerQuestion({ message: ALTA }, deps(adapter));

    expect(['insufficient_evidence', 'clarification']).toContain(response.kind);
    expect(JSON.stringify(response)).not.toContain('"steps"');
  });
});

describe('AC-002-14 the chat UI renders out_of_scope without items or links', () => {
  it('AC-002-14: the notice is exactly tone, title, body and the handoff action', () => {
    const notice = abstentionNotice({
      kind: 'out_of_scope',
      reasonCode: 'ibi',
      topicLabel: 'el IBI',
      officialBody: 'la autoridad tributaria de tu comunidad autónoma',
      explanation: 'Las preguntas sobre el IBI quedan fuera de mi alcance.',
      handoffUrl: HANDOFF_URL,
      disclaimer: 'Esto es información general elaborada con IA.',
    });

    expect(notice).toEqual({
      tone: 'info',
      title: OUT_OF_SCOPE_TITLE,
      body: 'Las preguntas sobre el IBI quedan fuera de mi alcance.',
      action: { href: HANDOFF_URL, label: 'Hablar con un asesor' },
    });
  });

  it('AC-002-14: a remaining refusal renders its title, body and handoff, and nothing else', async () => {
    renderScreen({
      submit: submitReturning({
        kind: 'out_of_scope',
        reasonCode: 'ibi',
        topicLabel: 'el IBI',
        officialBody: 'la autoridad tributaria de tu comunidad autónoma',
        explanation:
          'Las preguntas sobre el IBI quedan fuera de mi alcance: la administración competente es la autoridad tributaria de tu comunidad autónoma.',
        handoffUrl: HANDOFF_URL,
        disclaimer: 'Esto es información general elaborada con IA.',
      }),
    });
    await askAndWait('¿Cuánto es el IBI de mi vivienda?');

    expect(await screen.findByRole('heading', { name: OUT_OF_SCOPE_TITLE })).toBeVisible();
    expect(
      screen.getByText(/la administración competente es la autoridad tributaria/)
    ).toBeVisible();

    const notice = screen.getByRole('heading', { name: OUT_OF_SCOPE_TITLE }).closest('aside');
    expect(notice).not.toBeNull();
    const links = (notice as HTMLElement).querySelectorAll('a');
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAttribute('href', HANDOFF_URL);
    expect(notice?.querySelector('ol')).toBeNull();
    expect(notice?.querySelector('ul')).toBeNull();
    expect(screen.queryByText(/^Fuentes/)).toBeNull();
  });
});
