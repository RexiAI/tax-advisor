import { describe, expect, it } from 'vitest';

import { boeSourceUrl } from '@/corpus/parse-consolidated-xml';
import { ALLOWED_NORMS, isAllowedNorm } from '@/domain/allowed-norms';
import { createPassage } from '@/domain/passage';

/**
 * The `normTitle` values below are the exact strings the BOE consolidated-text
 * metadata endpoint returns, recorded from the source at spec time.
 */
const NEW_NORMS: readonly (readonly [string, string])[] = [
  ['BOE-A-2003-23186', 'Ley 58/2003, de 17 de diciembre, General Tributaria.'],
  [
    'BOE-A-2007-15984',
    'Real Decreto 1065/2007, de 27 de julio, por el que se aprueba el Reglamento General de las actuaciones y los procedimientos de gestión e inspección tributaria y de desarrollo de las normas comunes de los procedimientos de aplicación de los tributos.',
  ],
  [
    'BOE-A-2015-11724',
    'Real Decreto Legislativo 8/2015, de 30 de octubre, por el que se aprueba el texto refundido de la Ley General de la Seguridad Social.',
  ],
  [
    'BOE-A-1996-4447',
    'Real Decreto 84/1996, de 26 de enero, por el que se aprueba el Reglamento General sobre inscripción de empresas y afiliación, altas, bajas y variaciones de datos de trabajadores en la Seguridad Social.',
  ],
  ['BOE-A-1992-28740', 'Ley 37/1992, de 28 de diciembre, del Impuesto sobre el Valor Añadido.'],
  [
    'BOE-A-1990-23930',
    'Real Decreto Legislativo 1175/1990, de 28 de septiembre, por el que se aprueban las tarifas y la instrucción del Impuesto sobre Actividades Económicas.',
  ],
];

const IRPF_NORMS: readonly (readonly [string, string])[] = [
  ['BOE-A-2006-20764', 'Ley 35/2006 del Impuesto sobre la Renta'],
  ['BOE-A-2007-6820', 'Real Decreto 439/2007, Reglamento del IRPF'],
];

function passageFor(normId: string) {
  return createPassage({
    normId,
    normTitle: 'Título de prueba',
    blockId: 'a1',
    blockTitle: 'Artículo 1. Prueba',
    articleLabel: 'Artículo 1',
    text: 'Texto normativo de prueba.',
    sourceUrl: boeSourceUrl(normId),
    updatedAt: '2026-03-17',
    fetchedAt: '2026-03-18T08:00:00Z',
  });
}

describe('AC-002-01 the registry holds the two IRPF norms and the six verified new norms', () => {
  it('AC-002-01: the eight state entries plus the two pilots, with the six new pairs copied verbatim', () => {
    expect(ALLOWED_NORMS).toHaveLength(10);

    for (const [normId, normTitle] of [...IRPF_NORMS, ...NEW_NORMS]) {
      const entry = ALLOWED_NORMS.find((candidate) => candidate.normId === normId);
      expect(entry, `missing ${normId}`).toBeDefined();
      expect(entry?.normTitle).toBe(normTitle);
    }
  });
});

describe('AC-002-02 a passage of a new norm is accepted and an unlisted norm is refused', () => {
  it('AC-002-02: isAllowedNorm gates the six new norms and createPassage refuses anything else', () => {
    for (const [normId] of NEW_NORMS) {
      expect(isAllowedNorm(normId)).toBe(true);
      expect(passageFor(normId).ok).toBe(true);
    }

    expect(isAllowedNorm('BOE-A-2004-4214')).toBe(false);
    expect(passageFor('BOE-A-2004-4214')).toEqual({ ok: false, error: 'unsupported_norm' });
  });
});

describe('AC-002-03 the TRLRHL stays out and every id links to the consolidated text', () => {
  it('AC-002-03: no TRLRHL entry and every norm resolves its BOE source URL', () => {
    expect(ALLOWED_NORMS.map((norm) => norm.normId)).not.toContain('BOE-A-2004-4214');

    for (const norm of ALLOWED_NORMS) {
      expect(norm.normId).not.toBe('');
      expect(boeSourceUrl(norm.normId)).toBe(`https://www.boe.es/buscar/act.php?id=${norm.normId}`);
    }

    const ids = ALLOWED_NORMS.map((norm) => norm.normId);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
