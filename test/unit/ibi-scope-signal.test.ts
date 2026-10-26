/**
 * Unit coverage for the two helpers Task 1 adds to `src/content/scope-topics.ts`.
 * The acceptance scenarios reach the classifier end to end; these pin the signal
 * itself — the forms it accepts, the forms it deliberately does not — and the
 * purity of the classification path.
 */

import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import {
  isDeductibilityQuestion,
  mentionsIbi,
  OUT_OF_SCOPE_TOPICS,
} from '@/content/scope-topics';
import { normalizeText } from '@/retrieval/normalize';
import { classifyScope } from '@/service/scope-guard';

import { repoPath } from '../support/harness';

function normalized(message: string): string {
  return normalizeText(message);
}

function signal(message: string): boolean {
  return isDeductibilityQuestion(normalized(message));
}

function ibiTopic() {
  const topic = OUT_OF_SCOPE_TOPICS.find((candidate) => candidate.reasonCode === 'ibi');
  if (topic === undefined) throw new Error('the ibi topic left the ordered map');
  return topic;
}

describe('mentionsIbi', () => {
  it('matches the abbreviation and the full Spanish phrase', () => {
    expect(mentionsIbi('cuanto es el ibi de mi vivienda')).toBe(true);
    expect(mentionsIbi('pago el impuesto sobre bienes inmuebles')).toBe(true);
  });

  it('does not match a word that merely contains the abbreviation', () => {
    expect(mentionsIbi('me voy a ibiza')).toBe(false);
    expect(mentionsIbi('el recibo es visible')).toBe(false);
  });

  it('is undefined on the answerable rental vocabulary', () => {
    expect(mentionsIbi('alquiler de bienes inmuebles')).toBe(false);
  });
});

describe('isDeductibilityQuestion', () => {
  const INCLUDED: readonly string[] = [
    'puedo deducir la luz',
    'puedo deducirme el ibi',
    'podemos deducirnos el agua',
    'deducimos el gasto',
    'la deduccion por vivienda',
    'las deducciones autonomicas',
    'es deducible el gasto',
    'son deducibles los intereses',
    'la deducibilidad del gasto',
    'me lo puedo desgravar',
    'puedo desgravarme el alquiler',
    'podemos desgravarnos el gasto',
    'me desgravo el ibi',
    'nos desgravamos el gasto',
    'la desgravacion por vivienda',
    'las desgravaciones autonomicas',
    'es desgravable el gasto',
    'son desgravables los intereses',
    'tengo un gasto deducible',
    'tengo un gasto desgravable',
  ];

  it.each(INCLUDED)('accepts every listed form: %s', (message) => {
    expect(signal(message)).toBe(true);
  });

  const THIRD_PERSON: readonly string[] = [
    'cuanto deduce el ibi',
    'cuanto deduces por el ibi',
    'cuanto deducen por el ibi',
    'cuanto desgrava el ibi',
    'cuanto desgravas por el ibi',
    'cuanto desgravan por el ibi',
  ];

  it.each(THIRD_PERSON)('rejects the third-person form: %s', (message) => {
    expect(signal(message)).toBe(false);
  });

  const NOT_A_SIGNAL: readonly string[] = [
    'puedo descontar el iva de una factura',
    'aplico un descuento del 10 por ciento',
    'puedo restar el iva',
  ];

  it.each(NOT_A_SIGNAL)('rejects subtraction and discount vocabulary: %s', (message) => {
    expect(signal(message)).toBe(false);
  });

  it('does not match the irregular first person the stem cannot reach', () => {
    // Recorded as out of scope by the task: no scenario requires `deduzco`.
    expect(signal('deduzco el ibi')).toBe(false);
  });

  it('lets a third-person form anywhere in the text veto the signal, as specified', () => {
    expect(signal('cuanto desgrava el ibi y puedo deducirlo')).toBe(false);
  });

  it('is accent-insensitive because it runs on the normalized text', () => {
    expect(signal('¿PUEDO DEDUCIRME EL IBI?')).toBe(true);
    expect(signal('la DEDUCCIÓN por vivienda')).toBe(true);
    expect(signal('la DESGRAVACIÓN autonómica')).toBe(true);
  });
});

describe('the ibi topic', () => {
  it('matches both IBI forms only when the text carries no deductibility signal', () => {
    expect(ibiTopic().match(normalized('¿Cuánto es el IBI de mi vivienda?'))).toBe(true);
    expect(ibiTopic().match(normalized('¿Puedo deducirme el IBI?'))).toBe(false);
    expect(ibiTopic().match(normalized('¿Puedo deducirme el impuesto sobre bienes inmuebles?'))).toBe(
      false
    );
    expect(ibiTopic().match(normalized('¿Me puedo desgravar el IBI?'))).toBe(false);
  });

  it('keeps its reason code, label and official body', () => {
    expect(ibiTopic().label).toBe('el IBI');
    expect(ibiTopic().officialBody).toBe('la autoridad tributaria de tu comunidad autónoma');
  });

  it('is a pure function of the normalized message: same input, same verdict', () => {
    const first = classifyScope('¿Puedo deducirme el IBI?');
    const second = classifyScope('¿Puedo deducirme el IBI?');
    expect(first).toBe(second);
  });
});

describe('the classification path stays pure', () => {
  it('adds no network, client or filesystem import to the guard or the topic map', () => {
    for (const file of ['src/service/scope-guard.ts', 'src/content/scope-topics.ts']) {
      const source = readFileSync(repoPath(file), 'utf8');
      expect(source, file).not.toMatch(/from 'node:fs'/);
      expect(source, file).not.toMatch(/fetch\(/);
      expect(source, file).not.toMatch(/from '\.\.\/llm\//);
      expect(source, file).not.toMatch(/from '\.\.\/server\//);
    }
  });
});
