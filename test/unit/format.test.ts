import { describe, expect, it } from 'vitest';

import { formatSpanishDate, toPlainText } from '@/content/format';

describe('toPlainText', () => {
  it('strips Markdown emphasis, headings and inline code', () => {
    expect(toPlainText('**Resumen:** usa `artículo 20`.\n\n## La norma')).toBe(
      'Resumen: usa artículo 20.\n\nLa norma'
    );
  });

  it('leaves plain Spanish text untouched', () => {
    expect(toPlainText('¿Puedo deducir el alquiler?')).toBe('¿Puedo deducir el alquiler?');
  });

  it('removes the stray space models leave before punctuation', () => {
    expect(toPlainText('la fecha .')).toBe('la fecha.');
  });
});

describe('formatSpanishDate', () => {
  it('formats a BOE date in Spanish without shifting the day', () => {
    expect(formatSpanishDate('2026-10-07')).toBe('7 de octubre de 2026');
  });

  it('returns the original value when it is not a date', () => {
    expect(formatSpanishDate('sin fecha')).toBe('sin fecha');
  });
});
