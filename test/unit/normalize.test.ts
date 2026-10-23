import { describe, expect, it } from 'vitest';

import { expandTerms } from '@/retrieval/expand';
import { normalizeTerms, normalizeText } from '@/retrieval/normalize';

describe('normalizeText', () => {
  it('strips accents, ñ and case', () => {
    expect(normalizeText('Deducción')).toBe('deduccion');
    expect(normalizeText('DEDUCCIÓN')).toBe('deduccion');
    expect(normalizeText('niño')).toBe('nino');
    expect(normalizeText('¿Año fiscal?')).toBe('¿ano fiscal?');
  });
});

describe('normalizeTerms', () => {
  it('splits on non-alphanumerics and drops stopwords', () => {
    expect(normalizeTerms('¿Puedo deducirme el alquiler de mi vivienda habitual?')).toEqual([
      'puedo',
      'deducirme',
      'alquiler',
      'vivienda',
      'habitual',
    ]);
  });

  it('keeps numbers as terms', () => {
    expect(normalizeTerms('ejercicio 2025')).toEqual(['ejercicio', '2025']);
  });

  it('returns nothing for a stopword-only or empty input', () => {
    expect(normalizeTerms('de la que el')).toEqual([]);
    expect(normalizeTerms('   ')).toEqual([]);
    expect(normalizeTerms('¿?')).toEqual([]);
  });

  it('collapses repeated terms into the same token, leaving de-duplication to the caller', () => {
    expect(normalizeTerms('alquiler alquiler')).toEqual(['alquiler', 'alquiler']);
  });
});

describe('expandTerms', () => {
  it('maps "me sale a pagar o a devolver" to the BOE vocabulary', () => {
    expect(expandTerms('¿Me sale a pagar o a devolver?')).toEqual(
      expect.arrayContaining(['cuota', 'diferencial', 'devolucion'])
    );
  });

  it('maps common taxpayer words to their BOE equivalents', () => {
    expect(expandTerms('alquiler de vivienda')).toEqual(expect.arrayContaining(['arrendamiento', 'inmueble']));
    expect(expandTerms('gastos de autónomo')).toEqual(expect.arrayContaining(['autonomos']));
  });

  it('returns nothing for an unrelated question', () => {
    expect(expandTerms('¿Qué es el IRPF?')).toEqual([]);
  });
});
