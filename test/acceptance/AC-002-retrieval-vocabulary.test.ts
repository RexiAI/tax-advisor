/**
 * The retrieval layer must speak the taxpayer's vocabulary as well as the
 * statute's. Both cases below were measured against the committed corpus: the
 * question retrieved the `autónomo` passages of LGSS 333/336 and the IRPF
 * articles, and the passages that govern the trámite were never in the bundle.
 *
 * These tests run against `corpus/corpus.json`, the artifact production loads,
 * not the smaller fixture corpus.
 */

import { describe, expect, it } from 'vitest';

import { DEFAULT_BOUNDS } from '@/config/env';
import { normIdOfPassageId } from '@/domain/passage';
import { buildEvidence } from '@/evidence/build-evidence';
import { search } from '@/retrieval/index';
import { loadCorpusFromFile } from '@/server/corpus-loader';
import { answerQuestion } from '@/service/answer-question';
import { createConversationStore } from '@/service/conversation-store';
import { createTurnTelemetry } from '@/service/types';

import { FakeLlmAdapter } from '../support/fake-llm-adapter';
import { repoPath } from '../support/harness';

const ALTA = 'Quiero darme de alta de autónomo. Guíame';
const IVA = '¿Cuándo empiezo a presentar el IVA si soy autónomo?';

const REGISTRO_CENSAL = 'BOE-A-2007-15984';
const LEY_IVA = 'BOE-A-1992-28740';
const REGISTRO_CENSAL_ALTA = `${REGISTRO_CENSAL}#a9`;

/** The filing vocabulary the statute uses for the VAT obligation. */
const OBLIGACION_IVA = /declaraciones-liquidaciones|plazos|sujetos pasivos/i;

const loaded = loadCorpusFromFile(repoPath('corpus/corpus.json'));
if (!loaded.ok) throw new Error(`committed corpus did not load: ${loaded.error}`);
const corpus = loaded.corpus;

function deps(adapter: FakeLlmAdapter) {
  return {
    index: corpus.index,
    adapter,
    config: {
      minRetrievalScore: DEFAULT_BOUNDS.minRetrievalScore,
      retrievalTopK: DEFAULT_BOUNDS.retrievalTopK,
      corpusTaxYear: DEFAULT_BOUNDS.corpusTaxYear,
    },
    conversations: createConversationStore(),
    telemetry: createTurnTelemetry(),
    now: () => 1_000,
  };
}

describe('AC-002-34 the autónomo registration question retrieves the censal article', () => {
  it('AC-002-34: the bundle carries artículo 9 of RD 1065/2007, not just LGSS 333', () => {
    const bundle = buildEvidence(ALTA, corpus.index, {
      minRetrievalScore: DEFAULT_BOUNDS.minRetrievalScore,
      topK: DEFAULT_BOUNDS.retrievalTopK,
    });

    expect(bundle.status).toBe('sufficient');
    const ids = bundle.passages.map((passage) => passage.passageId);
    expect(ids).toContain(REGISTRO_CENSAL_ALTA);
    expect(bundle.passages.length).toBeLessThanOrEqual(DEFAULT_BOUNDS.retrievalTopK);
  });

  it('AC-002-34: a turn citing that article cites the registration norm', async () => {
    const adapter = new FakeLlmAdapter({
      deltas: [
        `El alta se presenta en el censo de empresarios [^p:${REGISTRO_CENSAL_ALTA}].`,
      ],
    });
    const response = await answerQuestion({ message: ALTA }, deps(adapter));

    expect(response.kind).toBe('answer');
    if (response.kind !== 'answer') return;
    expect(response.citations.map((citation) => citation.passageId)).toContain(
      REGISTRO_CENSAL_ALTA
    );
    expect(
      response.citations.map((citation) => normIdOfPassageId(citation.passageId))
    ).toContain(REGISTRO_CENSAL);
  });
});

describe('AC-002-35 the VAT filing-start question retrieves the obligation article', () => {
  it('AC-002-35: the bundle carries a VAT passage drafted as an obligation, not only IRPF', () => {
    const bundle = buildEvidence(IVA, corpus.index, {
      minRetrievalScore: DEFAULT_BOUNDS.minRetrievalScore,
      topK: DEFAULT_BOUNDS.retrievalTopK,
    });

    expect(bundle.status).toBe('sufficient');
    const iva = bundle.passages.filter(
      (passage) => normIdOfPassageId(passage.passageId) === LEY_IVA
    );
    expect(iva.length).toBeGreaterThan(0);
    expect(iva.some((passage) => OBLIGACION_IVA.test(passage.text))).toBe(true);
  });

  it('AC-002-35: a turn citing that passage answers with the VAT norm and its disclaimer', async () => {
    const results = search(corpus.index, IVA, DEFAULT_BOUNDS.retrievalTopK);
    const target = results.find(
      (result) =>
        normIdOfPassageId(result.passage.passageId) === LEY_IVA &&
        OBLIGACION_IVA.test(result.passage.text)
    );
    expect(target).toBeDefined();
    if (target === undefined) return;

    const passageId = target.passage.passageId;
    const adapter = new FakeLlmAdapter({
      deltas: [`La obligación nace con el inicio de la actividad [^p:${passageId}].`],
    });
    const response = await answerQuestion({ message: IVA }, deps(adapter));

    expect(response.kind).toBe('answer');
    if (response.kind !== 'answer') return;
    expect(response.citations.map((citation) => citation.passageId)).toContain(passageId);
    expect(
      response.citations.map((citation) => normIdOfPassageId(citation.passageId))
    ).toContain(LEY_IVA);
    expect(response.scopeDisclaimer).toBeDefined();
  });

  it('AC-002-35: the question no longer answers from LGSS cese-de-actividad passages alone', () => {
    const results = search(corpus.index, IVA, DEFAULT_BOUNDS.retrievalTopK);
    const norms = results.map((result) => normIdOfPassageId(result.passage.passageId));
    expect(norms).toContain(LEY_IVA);
  });
});
