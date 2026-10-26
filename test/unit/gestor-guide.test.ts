import { describe, expect, it } from 'vitest';

import { gestorGuide, MODEL_GUIDES } from '@/content/gestor-guides';

describe('gestorGuide', () => {
  // Spec 002: the procedural IRPF models stay procedural; the censal and VAT
  // models are answered from the corpus, so their matchers were withdrawn.
  it('returns a procedural card for a kept IRPF model', () => {
    const guide = gestorGuide('¿Cómo se presenta el modelo 130?');
    expect(guide?.title).toContain('130');
    expect(guide?.steps.length).toBeGreaterThanOrEqual(4);
    expect(guide?.links.some((link) => link.href.includes('G601'))).toBe(true);
  });

  it('keeps only the procedural IRPF models in the model map', () => {
    expect(Object.keys(MODEL_GUIDES).sort()).toEqual(['100', '130', '131']);
    for (const code of ['130', '131', '100']) {
      expect(MODEL_GUIDES[code]?.title).toContain(code);
    }
  });

  it('leaves VAT questions to retrieval', () => {
    expect(gestorGuide('¿Puedo deducir el IVA de la gasolina?')).toBeNull();
  });

  it('leaves invoice and VAT questions to retrieval', () => {
    expect(gestorGuide('¿Cómo se hace una factura con IVA?')).toBeNull();
  });

  it('leaves the quota question to retrieval', () => {
    expect(gestorGuide('¿Cuánto es la cuota de autónomos este año?')).toBeNull();
  });

  it('leaves what an autónomo files to retrieval', () => {
    expect(gestorGuide('¿Qué modelos tiene que presentar un autónomo?')).toBeNull();
  });

  it('returns deduction guidance for a general expenses question', () => {
    const guide = gestorGuide('¿Qué gastos puedo deducirme como autónomo?');
    expect(guide?.title).toContain('Gastos deducibles');
    expect(guide?.links.some((link) => link.href.includes('BOE-A-2006-20764'))).toBe(true);
  });

  it('leaves a specific IRPF deduction question without a general expenses guide', () => {
    expect(gestorGuide('¿Puedo deducirme el alquiler de mi vivienda habitual?')).toBeNull();
  });

  it('covers the former gestor limits with a guide', () => {
    const cases: [string, string][] = [
      ['¿Cómo hago una nómina?', 'Nóminas'],
      ['¿Tengo que depositar las cuentas anuales?', 'Contabilidad'],
      ['¿Cómo tributa una sociedad limitada?', 'Sociedades'],
      ['Soy de Bizkaia, ¿dónde presento el IRPF?', 'forales'],
      ['Soy no residente y tengo una casa en España', 'No residentes'],
      ['¿Cómo se calcula el impuesto de sucesiones?', 'Sucesiones'],
      ['¿Cuánto ITP pago por una vivienda?', 'ITP'],
      ['¿Cómo presento con certificado digital?', 'Presentación'],
    ];
    for (const [message, expected] of cases) {
      expect(gestorGuide(message)?.title).toContain(expected);
    }
  });

  it('leaves a first-person filing request to the filing guard', () => {
    expect(gestorGuide('Hazme el modelo 303')).toBeNull();
  });
});
