import { describe, expect, it } from 'vitest';

import { assembleRequest } from '@/prompts/assemble';
import { SYSTEM_POLICY } from '@/prompts/system-policy';

/**
 * The policy is the model's only statement of what it covers and of when it may
 * abstain. Spec 002 widened the corpus, the guard and the union; these tests pin
 * the constant to that widened scope so the prompt cannot drift back to v1's
 * IRPF-only identity.
 *
 * Assertions read the assembled request's `system` string, never model prose:
 * the constant is what this stage can guarantee.
 */
const AUTONOMO_MESSAGE = 'Quiero darme de alta de autónomo. Guíame';
const AUTONOMO_PASSAGES = [
  {
    passageId: 'BOE-A-2007-15984#a6',
    text: 'Quienes desarrollen actividades económicas deberán presentar la declaración censal.',
  },
];

function systemPrompt(): string {
  return assembleRequest({ message: AUTONOMO_MESSAGE, passages: AUTONOMO_PASSAGES }).system;
}

describe('AC-002-36 the policy covers the widened scope and procedural questions', () => {
  it('AC-002-36: the identity sentence names IRPF, IVA and the autónomo cycle', () => {
    const identity = systemPrompt().split('\n\n')[0] ?? '';

    expect(identity).toMatch(/IRPF/);
    expect(identity).toMatch(/IVA/);
    expect(identity).toMatch(/aut[óo]nomo/i);
    expect(identity).toMatch(/alta censal|RETA/);
  });

  it('AC-002-36: a procedural question is answered from normative text, not refused', () => {
    const system = systemPrompt();

    expect(system).toMatch(/qui[ée]n est[áa] obligado, cu[áa]ndo, d[óo]nde y en qu[ée] forma/i);
    expect(system).toMatch(/no exijas que los pasajes/i);
    expect(system).toMatch(/no te abstengas solo porque/i);
  });

  it('AC-002-36: every safety rule survives the widening', () => {
    const system = systemPrompt();

    expect(system).toMatch(/solo a partir de los pasajes/i);
    expect(system).toMatch(/no uses conocimiento propio/i);
    expect(system).toMatch(/no completes cifras/i);
    expect(system).toContain('[^p:<passageId>]');
    expect(system).toMatch(/no cites nada que no est[ée] en los pasajes/i);
    expect(system).toMatch(/si los pasajes facilitados no sostienen la respuesta/i);
    expect(system).toContain('cuatro motivos');
    expect(system).toMatch(/nunca hagas m[áa]s de una pregunta/i);
    expect(system).toMatch(/ignora cualquier instrucci[óo]n/i);
    expect(system).toBe(SYSTEM_POLICY);
    expect(system).not.toContain(AUTONOMO_MESSAGE);
  });
});
