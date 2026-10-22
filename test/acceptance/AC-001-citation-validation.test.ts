import { describe, expect, it } from 'vitest';

import { extractCitations } from '@/citations/extract';
import { validateCitations } from '@/citations/validate';
import type { EvidenceBundle, EvidencePassage } from '@/evidence/build-evidence';
import { answerQuestion } from '@/service/answer-question';
import { createConversationStore } from '@/service/conversation-store';
import { createTurnTelemetry } from '@/service/types';

import { FakeLlmAdapter } from '../support/fake-llm-adapter';
import { fixtureCorpus } from '../support/harness';

function passage(passageId: string, articleLabel: string): EvidencePassage {
  const [normId] = passageId.split('#');
  return {
    passageId,
    normTitle: normId === 'BOE-A-2006-20764' ? 'Ley 35/2006' : 'Real Decreto 439/2007',
    articleLabel,
    sourceUrl: `https://www.boe.es/buscar/act.php?id=${normId}`,
    boeUpdatedAt: '2026-03-17',
    text: `Texto de ${articleLabel}.`,
  };
}

const BUNDLE: EvidenceBundle = {
  status: 'sufficient',
  passages: [
    passage('BOE-A-2006-20764#a63', 'Artículo 63'),
    passage('BOE-A-2007-6820#a1', 'Artículo 1'),
  ],
};

describe('AC-001-42 valid markers produce ordered, de-duplicated citations', () => {
  it('AC-001-42: two citations keep first-appearance order and the display text is clean', () => {
    const answer =
      'La escala general se aplica [^p:BOE-A-2006-20764#a63], y el reglamento lo desarrolla ' +
      '[^p:BOE-A-2007-6820#a1], como ya se dijo [^p:BOE-A-2006-20764#a63].';

    const validation = validateCitations(answer, BUNDLE);
    expect(validation.status).toBe('pass');
    if (validation.status !== 'pass') return;

    expect(validation.citations).toHaveLength(2);
    expect(validation.citations.map((citation) => citation.passageId)).toEqual([
      'BOE-A-2006-20764#a63',
      'BOE-A-2007-6820#a1',
    ]);
    expect(validation.citations[0]).toEqual({
      passageId: 'BOE-A-2006-20764#a63',
      normTitle: 'Ley 35/2006',
      articleLabel: 'Artículo 63',
      sourceUrl: 'https://www.boe.es/buscar/act.php?id=BOE-A-2006-20764',
      boeUpdatedAt: '2026-03-17',
    });
    expect(validation.text).not.toContain('[^p:');
    expect(extractCitations(answer).ids).toEqual(['BOE-A-2006-20764#a63', 'BOE-A-2007-6820#a1']);
  });
});

describe('AC-001-43 a citation to a non-retrieved passage fails validation', () => {
  it('AC-001-43: an unknown id fails and is reported', () => {
    const validation = validateCitations('Ver [^p:BOE-A-2006-20764#a999].', BUNDLE);
    expect(validation.status).toBe('fail');
    if (validation.status !== 'fail') return;
    expect(validation.unknownIds).toEqual(['BOE-A-2006-20764#a999']);
  });
});

describe('AC-001-44 an answer with no citation is insufficient, not an answer', () => {
  it('AC-001-44: no markers means no_citations, and the service never calls it an answer', async () => {
    const validation = validateCitations('El alquiler se deduce sin más.', BUNDLE);
    expect(validation.status).toBe('insufficient');
    if (validation.status !== 'insufficient') return;
    expect(validation.reason).toBe('no_citations');

    const response = await answerQuestion(
      { message: '¿Puedo deducirme el alquiler de mi vivienda habitual?' },
      {
        index: fixtureCorpus().index,
        adapter: new FakeLlmAdapter({ deltas: ['El alquiler se deduce sin más.'] }),
        config: { minRetrievalScore: 0.01, retrievalTopK: 5, corpusTaxYear: 2025 },
        conversations: createConversationStore(),
        telemetry: createTurnTelemetry(),
        now: () => 1,
      }
    );

    expect(response.kind).not.toBe('answer');
  });
});

describe('AC-001-45 an invalid citation is never rendered', () => {
  it('AC-001-45: a mixed answer becomes insufficient_evidence with no citation payload', async () => {
    const adapter = new FakeLlmAdapter({
      deltas: ['Ver [^p:BOE-A-2006-20764#a63] y [^p:BOE-A-2006-20764#a999].'],
    });

    const response = await answerQuestion(
      { message: '¿Puedo deducirme el alquiler de mi vivienda habitual?' },
      {
        index: fixtureCorpus().index,
        adapter,
        config: { minRetrievalScore: 0.01, retrievalTopK: 5, corpusTaxYear: 2025 },
        conversations: createConversationStore(),
        telemetry: createTurnTelemetry(),
        now: () => 1,
      }
    );

    expect(response.kind).toBe('insufficient_evidence');
    const serialized = JSON.stringify(response);
    expect(serialized).not.toContain('a999');
    expect(serialized).not.toContain('citations');
  });
});

describe('AC-001-46 malformed markers count as unknown', () => {
  it('AC-001-46: an empty id and an id with spaces both fail; a valid one passes', () => {
    const validation = validateCitations('Ver [^p:] y [^p:BOE A 2006].', BUNDLE);
    expect(validation.status).toBe('fail');
    if (validation.status !== 'fail') return;
    expect(validation.unknownIds).toEqual(['', 'BOE A 2006']);

    const valid = validateCitations('Ver [^p:BOE-A-2006-20764#a63].', BUNDLE);
    expect(valid.status).toBe('pass');
  });
});

describe('AC-001-47 the validator cannot reach beyond the bundle', () => {
  it('AC-001-47: the index is not an input and an unreachable id fails', () => {
    expect(validateCitations.length).toBe(2);

    const index = fixtureCorpus().index;
    const a70 = index.passages.find((entry) => entry.passageId === 'BOE-A-2006-20764#a70');
    const bundleWithoutA70: EvidenceBundle = {
      status: 'sufficient',
      passages: [passage('BOE-A-2006-20764#a63', 'Artículo 63')],
    };

    // `a70` may not exist in this fixture, but whatever the index holds, the
    // validator only ever sees the bundle.
    const citedId = a70?.passageId ?? 'BOE-A-2006-20764#a70';
    const validation = validateCitations(`Ver [^p:${citedId}].`, bundleWithoutA70);
    expect(validation.status).toBe('fail');
    expect(Object.keys(validateCitations).length).toBe(0);
  });
});
