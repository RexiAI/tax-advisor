/**
 * @vitest-environment jsdom
 */
import '@testing-library/jest-dom/vitest';
import '../support/setup-dom';

import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  FILING_REQUEST_EXPLANATION,
  HANDOFF_URL,
  OUT_OF_SCOPE_EXPLANATION,
} from '@/content/strings';
import { answerQuestion } from '@/service/answer-question';
import { createConversationStore } from '@/service/conversation-store';
import { createTurnTelemetry } from '@/service/types';

import { FakeLlmAdapter } from '../support/fake-llm-adapter';
import { fixtureCorpus } from '../support/harness';
import { renderNotice } from '../support/ui-harness';

/**
 * Messages that reach the guard as a refusal. ITP, ISD, non-residents and
 * company tax are served by a preserved guide before the guard runs, so the two
 * templates below are what every refusal is built from — the source assertion
 * covers them all.
 */
const REFUSAL_MESSAGES = [
  '¿Cuánto es el IBI de mi vivienda?',
  'Hazme la declaración de la renta de 2024',
  'Preséntame el 303',
];

function deps() {
  return {
    index: fixtureCorpus().index,
    adapter: new FakeLlmAdapter({ deltas: [] }),
    config: { minRetrievalScore: 0.01, retrievalTopK: 5, corpusTaxYear: 2025 },
    conversations: createConversationStore(),
    telemetry: createTurnTelemetry(),
    now: () => 1_000,
  };
}

describe('AC-002-27 the refusal copy stops claiming the product is IRPF-only', () => {
  it('AC-002-27: no refusal payload contains «explico el IRPF»', async () => {
    for (const message of REFUSAL_MESSAGES) {
      const response = await answerQuestion({ message }, deps());
      expect(response.kind, message).toBe('out_of_scope');
      const payload = JSON.stringify(response);
      expect(payload, message).not.toContain('aquí solo explico el IRPF');
      expect(payload, message).not.toContain('solo explico el IRPF');
      expect(payload.toLowerCase(), message).not.toContain('explico el irpf');
    }
  });

  it('AC-002-27: neither refusal template carries the old sentence', () => {
    for (const template of [OUT_OF_SCOPE_EXPLANATION, FILING_REQUEST_EXPLANATION]) {
      expect(template.toLowerCase()).not.toContain('explico el irpf');
      expect(template.toLowerCase()).not.toContain('solo explico');
    }
    expect(OUT_OF_SCOPE_EXPLANATION).toContain('Lo que sí cubro');
    expect(FILING_REQUEST_EXPLANATION).toContain('Lo que sí hago');
  });

  it('AC-002-27: the explanation names the topic and the competent body', async () => {
    const response = await answerQuestion({ message: '¿Cuánto es el IBI de mi vivienda?' }, deps());
    if (response.kind !== 'out_of_scope') throw new Error('expected a refusal');

    expect(response.explanation).toContain(response.topicLabel);
    expect(response.explanation).toContain(response.officialBody);
    expect(response.explanation).toMatch(/Lo que sí cubro/);
  });

  it('AC-002-27: a filing refusal never names a topic the user only mentioned in passing', async () => {
    const response = await answerQuestion(
      { message: 'Preséntame la declaración del IVA de este trimestre' },
      deps()
    );
    if (response.kind !== 'out_of_scope') throw new Error('expected a refusal');

    expect(response.reasonCode).toBe('filing_request');
    expect(response.explanation).toContain(response.officialBody);
    expect(response.explanation).not.toContain(response.topicLabel);
    expect(response.explanation).toMatch(/No presento declaraciones/);
  });
});

describe('AC-002-28 external Notice links carry target and rel, the mailto handoff does not', () => {
  it('AC-002-28: a guide renders its link list with target=_blank and rel=noopener noreferrer', () => {
    renderNotice({
      tone: 'info',
      title: 'Modelo 130',
      body: 'Pago fraccionado de IRPF.',
      items: ['Calcula el rendimiento neto.'],
      links: [
        {
          href: 'https://sede.agenciatributaria.gob.es/Sede/procedimientoini/G601.shtml',
          label: 'AEAT · Modelo 130',
        },
        { href: 'http://example.test/guia', label: 'Guía' },
      ],
      action: { href: HANDOFF_URL, label: 'Hablar con un asesor' },
    });

    const external = screen.getByRole('link', { name: 'AEAT · Modelo 130' });
    expect(external).toHaveAttribute('target', '_blank');
    expect(external).toHaveAttribute('rel', 'noopener noreferrer');

    const plainHttp = screen.getByRole('link', { name: 'Guía' });
    expect(plainHttp).toHaveAttribute('target', '_blank');
    expect(plainHttp).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('AC-002-28: the mailto handoff keeps neither attribute', () => {
    renderNotice({
      tone: 'info',
      title: 'Fuera del alcance',
      body: 'La administración competente es la Agencia Tributaria.',
      action: { href: HANDOFF_URL, label: 'Hablar con un asesor' },
    });

    const handoff = screen.getByRole('link', { name: 'Hablar con un asesor' });
    expect(handoff).toHaveAttribute('href', HANDOFF_URL);
    expect(handoff).not.toHaveAttribute('target');
    expect(handoff).not.toHaveAttribute('rel');
  });
});
