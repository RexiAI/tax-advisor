import { describe, expect, it } from 'vitest';

import { gestorGuide, MODEL_GUIDES } from '@/content/gestor-guides';

describe('gestorGuide', () => {
  it('returns a model card for a known model', () => {
    const guide = gestorGuide('¿Cómo se presenta el modelo 303?');
    expect(guide?.title).toContain('303');
    expect(guide?.steps.length).toBeGreaterThanOrEqual(4);
    expect(guide?.links.some((link) => link.href.includes('G414'))).toBe(true);
  });

  it('knows the common autónomo models', () => {
    for (const code of ['303', '390', '130', '131', '100', '036']) {
      expect(MODEL_GUIDES[code]?.title).toContain(code);
    }
  });

  it('returns IVA guidance without needing a model number', () => {
    const guide = gestorGuide('¿Puedo deducir el IVA de la gasolina?');
    expect(guide?.title).toContain('IVA');
    expect(guide?.steps.length).toBeGreaterThan(3);
  });

  it('returns invoice guidance when the question is about a factura con IVA', () => {
    expect(gestorGuide('¿Cómo se hace una factura con IVA?')?.title).toContain('Factura');
  });

  it('returns RETA guidance for a quota question', () => {
    const guide = gestorGuide('¿Cuánto es la cuota de autónomos este año?');
    expect(guide?.title).toContain('Cuota de autónomos');
    expect(guide?.links.some((link) => link.href.includes('seg-social.es'))).toBe(true);
  });

  it('returns the models overview for an autónomo asking what to file', () => {
    const guide = gestorGuide('¿Qué modelos tiene que presentar un autónomo?');
    expect(guide?.title).toContain('Modelos habituales');
    expect(guide?.steps.join(' ')).toContain('303');
  });

  it('returns deduction guidance for a general expenses question', () => {
    const guide = gestorGuide('¿Qué gastos puedo deducirme como autónomo?');
    expect(guide?.title).toContain('Gastos deducibles');
    expect(guide?.links.some((link) => link.href.includes('BOE-A-2006-20764'))).toBe(true);
  });

  it('leaves a specific IRPF deduction question without a general expenses guide', () => {
    expect(gestorGuide('¿Puedo deducirme el alquiler de mi vivienda habitual?')).toBeNull();
  });

  it('leaves a first-person filing request to the filing guard', () => {
    expect(gestorGuide('Hazme el modelo 303')).toBeNull();
  });
});
