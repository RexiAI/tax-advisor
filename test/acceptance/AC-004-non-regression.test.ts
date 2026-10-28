import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { IBI_BOUNDARY_NOTE, OUT_OF_SCOPE_EXPLANATION } from '@/content/strings';
import { parseCorpusArtifact } from '@/corpus/artifact';
import { search } from '@/retrieval/index';
import { answerQuestion } from '@/service/answer-question';
import { createConversationStore } from '@/service/conversation-store';
import { classifyScope } from '@/service/scope-guard';
import { createTurnTelemetry } from '@/service/types';

import { FakeLlmAdapter } from '../support/fake-llm-adapter';
import { fixtureCorpus, repoPath } from '../support/harness';
import { offlineFetchState } from '../support/offline-fetch';

const CONFIG = { minRetrievalScore: 0.01, retrievalTopK: 5, corpusTaxYear: 2025 };

const STATE_QUESTIONS = [
  '¿Puedo deducirme el alquiler de mi vivienda habitual?',
  '¿Cuánto IVA pago?',
  '¿Cuánto es la cuota de autónomos?',
  '¿Cómo funciona el Impuesto sobre Actividades Económicas?',
];

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

function citingAdapter(message: string): FakeLlmAdapter {
  const [top] = search(fixtureCorpus().index, message, undefined, (passage) => passage.jurisdiction === 'state');
  if (top === undefined) throw new Error(`fixture corpus has no state match for ${message}`);
  return new FakeLlmAdapter({ deltas: [`Según la norma [^p:${top.passage.passageId}].`] });
}

describe('AC-004-45 the 8 state norms still answer with a citation', () => {
  it('AC-004-45: IRPF, IVA, RETA and IAE questions answer with at least one citation', async () => {
    for (const message of STATE_QUESTIONS) {
      const response = await answerQuestion({ message }, deps(citingAdapter(message)));
      expect(response.kind, message).toBe('answer');
      if (response.kind !== 'answer') continue;
      expect(response.citations.length, message).toBeGreaterThan(0);
      for (const citation of response.citations) {
        expect(citation.jurisdiction).toBe('state');
        expect(citation.publisher).toBe('boe');
      }
    }
  });
});

describe('AC-004-46 the five refusals keep their reason codes and bodies', () => {
  it('AC-004-46: ITP, ISD, IBI, non-residents and company tax classify as before', () => {
    const cases: readonly [string, string, string][] = [
      ['¿Cuánto tengo que pagar de ITP por la compra de mi casa?', 'itp', 'la autoridad tributaria de tu comunidad autónoma'],
      ['¿Cuánto se paga de ISD por una herencia?', 'isd', 'la autoridad tributaria de tu comunidad autónoma'],
      ['¿Cuánto es el IBI de mi vivienda?', 'ibi', 'la autoridad tributaria de tu comunidad autónoma'],
      ['Soy no residente y tengo una casa en España', 'non_residents', 'Agencia Tributaria'],
      ['¿Cómo tributa el Impuesto sobre Sociedades?', 'company_tax', 'Agencia Tributaria'],
    ];
    for (const [message, reasonCode, body] of cases) {
      const match = classifyScope(message);
      expect(match?.reasonCode, message).toBe(reasonCode);
      expect(match?.officialBody, message).toBe(body);
    }
  });
});

describe('AC-004-47 the IBI note text is unchanged', () => {
  it('AC-004-47: the note and the IBI body are byte-identical to spec 003', () => {
    expect(IBI_BOUNDARY_NOTE).toBe(
      'Tu pregunta menciona el IBI. Sus normas propias no están cubiertas por el corpus que este asesor cita, así que no puedo confirmar nada sobre él.'
    );
    expect(classifyScope('¿Cuánto es el IBI de mi vivienda?')?.officialBody).toBe(
      'la autoridad tributaria de tu comunidad autónoma'
    );
    expect(OUT_OF_SCOPE_EXPLANATION).toContain('la administración competente es {body}');
  });
});

describe('AC-004-48 every source URL still points at an official host', () => {
  it('AC-004-48: every norm and passage URL host is official', () => {
    const parsed = parseCorpusArtifact(readFileSync(repoPath('corpus/corpus.json'), 'utf8'));
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    const hosts = new Set<string>();
    for (const norm of parsed.artifact.norms) hosts.add(new URL(norm.sourceUrl).hostname);
    for (const passage of parsed.artifact.passages) hosts.add(new URL(passage.sourceUrl).hostname);

    for (const host of hosts) {
      expect(['www.boe.es', 'www.bocm.es', 'www.borm.es']).toContain(host);
    }
  });
});

describe('AC-004-49 the corpus remains intact and de-duplicated', () => {
  it('AC-004-49: more than 396 passages, no duplicate ids, offline', () => {
    const corpus = fixtureCorpus();
    expect(corpus.index.size).toBeGreaterThan(396);
    const ids = corpus.artifact.passages.map((passage) => passage.passageId);
    expect(new Set(ids).size).toBe(ids.length);
    expect(offlineFetchState.attempts).toEqual([]);
  });
});
