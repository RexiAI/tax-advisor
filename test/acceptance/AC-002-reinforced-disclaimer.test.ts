/**
 * @vitest-environment jsdom
 */
import '@testing-library/jest-dom/vitest';
import '../support/setup-dom';

import { readFileSync } from 'node:fs';

import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { REINFORCED_SCOPE_DISCLAIMER } from '@/content/strings';
import { isNonIrpfNorm, NON_IRPF_NORM_IDS } from '@/domain/allowed-norms';
import { search } from '@/retrieval/index';
import { answerQuestion } from '@/service/answer-question';
import { createConversationStore } from '@/service/conversation-store';
import { createTurnTelemetry, type AnswerResponse } from '@/service/types';

import { FakeLlmAdapter } from '../support/fake-llm-adapter';
import { fixtureCorpus, repoPath } from '../support/harness';
import { answerResponse, askAndWait, renderScreen, submitReturning } from '../support/ui-harness';

const EXPECTED_DISCLAIMER =
  'Esta respuesta se apoya en una norma distinta del IRPF (IVA, Seguridad Social o el alta de autónomos). Es información general: confirma las cuantías y plazos vigentes con la administración competente.';

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

/** The passage a turn can cite: the top retrieved one for its own message. */
function topPassageOf(message: string): { readonly id: string; readonly normId: string } {
  const [top] = search(fixtureCorpus().index, message);
  if (top === undefined) throw new Error(`fixture corpus has no match for ${message}`);
  return { id: top.passage.passageId, normId: top.passage.normId };
}

function adapterCiting(passageId: string): FakeLlmAdapter {
  return new FakeLlmAdapter({ deltas: [`La norma lo regula [^p:${passageId}].`] });
}

describe('AC-002-24 the reinforced disclaimer exists with the exact text', () => {
  it('AC-002-24: REINFORCED_SCOPE_DISCLAIMER is exported verbatim', () => {
    expect(REINFORCED_SCOPE_DISCLAIMER).toBe(EXPECTED_DISCLAIMER);
  });
});

describe('AC-002-25 the field is separate and derived from the norms that answered', () => {
  it('AC-002-25: AnswerResponse declares an optional scopeDisclaimer', () => {
    const source = readFileSync(repoPath('src/service/types.ts'), 'utf8');
    expect(source).toMatch(/scopeDisclaimer\?: string;/);
  });

  it('AC-002-25: the committed non-IRPF set has six norms and a membership predicate', () => {
    expect(NON_IRPF_NORM_IDS).toHaveLength(6);
    for (const normId of NON_IRPF_NORM_IDS) expect(isNonIrpfNorm(normId)).toBe(true);
    expect(isNonIrpfNorm('BOE-A-2006-20764')).toBe(false);
    expect(isNonIrpfNorm('BOE-A-2007-6820')).toBe(false);
  });

  it('AC-002-25: a citation of a non-IRPF norm carries the disclaimer', async () => {
    const message = '¿cuánto IVA pago?';
    const top = topPassageOf(message);
    expect(isNonIrpfNorm(top.normId)).toBe(true);

    const response = await answerQuestion({ message }, deps(adapterCiting(top.id)));

    expect(response.kind).toBe('answer');
    if (response.kind !== 'answer') return;
    expect(response.scopeDisclaimer).toBe(REINFORCED_SCOPE_DISCLAIMER);
  });

  it('AC-002-25: an answer citing only IRPF passages carries no disclaimer', async () => {
    const message = '¿Puedo deducirme el alquiler de mi vivienda habitual?';
    const top = topPassageOf(message);
    expect(isNonIrpfNorm(top.normId)).toBe(false);

    const response = await answerQuestion({ message }, deps(adapterCiting(top.id)));

    expect(response.kind).toBe('answer');
    if (response.kind !== 'answer') return;
    expect('scopeDisclaimer' in response).toBe(false);
  });
});

describe('AC-002-26 the disclaimer renders adjacent to the AI one and swallows nothing', () => {
  const withScope: AnswerResponse = answerResponse({
    scopeDisclaimer: EXPECTED_DISCLAIMER,
    citations: [
      {
        passageId: 'BOE-A-1992-28740#a4',
        normTitle: 'Ley 37/1992, de 28 de diciembre, del Impuesto sobre el Valor Añadido.',
        articleLabel: 'Artículo 4',
        sourceUrl: 'https://www.boe.es/buscar/act.php?id=BOE-A-1992-28740',
        boeUpdatedAt: '2026-10-07',
      },
    ],
  });

  it('AC-002-26: both disclaimers are visible and the reinforced one follows the AI one', async () => {
    const { container } = renderScreen({ submit: submitReturning(withScope) });
    await askAndWait();

    const article = container.querySelector('article');
    expect(article).not.toBeNull();
    const paragraphs = [...(article as HTMLElement).querySelectorAll('p')];
    const rendered = paragraphs.map((paragraph) => paragraph.textContent);

    const aiIndex = rendered.indexOf(withScope.disclaimer);
    const scopeIndex = rendered.indexOf(EXPECTED_DISCLAIMER);
    expect(aiIndex).toBeGreaterThanOrEqual(0);
    expect(scopeIndex).toBe(aiIndex + 1);
  });

  it('AC-002-26: the answer body still comes first', async () => {
    // The fixture carries a scope disclaimer, because the footer now ends there
    // (15-design §Reinforced disclaimer, adjudication).
    const { container } = renderScreen({ submit: submitReturning(withScope) });
    await askAndWait();

    const article = container.querySelector('article');
    expect(article).not.toBeNull();
    const body = (article as HTMLElement).querySelector('[aria-live]');
    const reinforced = [...(article as HTMLElement).querySelectorAll('p')].find(
      (paragraph) => paragraph.textContent === EXPECTED_DISCLAIMER
    );

    expect(body).not.toBeNull();
    expect(reinforced).toBeDefined();
    const position = body!.compareDocumentPosition(reinforced!);
    expect(position & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('AC-002-26: an answer without the field renders no reinforced line', async () => {
    renderScreen({ submit: submitReturning(answerResponse()) });
    await askAndWait();

    expect(screen.queryByText(EXPECTED_DISCLAIMER)).toBeNull();
    expect(await screen.findByRole('heading', { name: /^Fuentes/ })).toBeVisible();
  });

  it('AC-002-26: an answer with the reinforced line still shows Fuentes and the AI disclosure', async () => {
    renderScreen({ submit: submitReturning(withScope) });
    await askAndWait();

    expect(await screen.findByText(EXPECTED_DISCLAIMER)).toBeVisible();
    expect(screen.getByRole('heading', { name: /^Fuentes/ })).toBeVisible();
    expect(screen.getAllByText(withScope.disclaimer).length).toBeGreaterThanOrEqual(2);
  });
});
