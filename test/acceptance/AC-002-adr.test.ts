import { existsSync, readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { repoPath } from '../support/harness';

const ADR_PATH = 'docs/adr/0003-advisor-scope-expansion.md';
const ADR = existsSync(repoPath(ADR_PATH)) ? readFileSync(repoPath(ADR_PATH), 'utf8') : '';

function section(title: string): string {
  const start = ADR.indexOf(`## ${title}`);
  if (start === -1) return '';
  const rest = ADR.slice(start + title.length + 3);
  const next = rest.indexOf('\n## ');
  return next === -1 ? rest : rest.slice(0, next);
}

describe('AC-002-33 the new ADR records the decision, the alternatives and the accepted risk', () => {
  it('AC-002-33: the ADR exists with the repository structure', () => {
    expect(existsSync(repoPath(ADR_PATH))).toBe(true);
    for (const heading of ['Context', 'Decision', 'Alternatives considered', 'Consequences']) {
      expect(ADR, `missing ${heading}`).toContain(`## ${heading}`);
    }
  });

  it('AC-002-33: it records the widened scope and what stays out', () => {
    const decision = section('Decision').toLowerCase();
    expect(decision).not.toBe('');
    // The four subjects, in whichever of the two spellings the ADR uses.
    const subjects: readonly (readonly [string, RegExp])[] = [
      ['censal', /censal/],
      ['LGSS / Seguridad Social', /lgss|seguridad social/],
      ['RETA', /\breta\b/],
      ['IVA', /\biva\b|\bvat\b/],
      ['IAE', /\biae\b|actividades económicas/],
    ];
    for (const [name, pattern] of subjects) {
      expect(decision, `decision omits ${name}`).toMatch(pattern);
    }
    expect(decision).toMatch(/retrieval|cita/);

    const excluded: readonly (readonly [string, RegExp])[] = [
      ['ITP', /\bitp\b/],
      ['ISD', /\bisd\b/],
      ['IBI', /\bibi\b/],
      ['non-residents', /no residentes|non-residents|irnr/],
      ['company tax', /sociedades/],
    ];
    for (const [name, pattern] of excluded) {
      expect(decision, `decision does not exclude ${name}`).toMatch(pattern);
    }
    expect(decision).toMatch(/presentación|presentar|filing/);
  });

  it('AC-002-33: it lists and rejects handoff-only and a cosmetic reframe', () => {
    const alternatives = section('Alternatives considered').toLowerCase();
    expect(alternatives).not.toBe('');
    expect(alternatives).toMatch(/handoff-only|solo derivación|derivar todo/);
    expect(alternatives).toMatch(/cosmetic|cosmético|reframe/);
    expect(alternatives).toMatch(/reject|rechaz/);
  });

  it('AC-002-33: the consequences cover the corpus surface, the legal posture and ADR 0001', () => {
    const consequences = section('Consequences');
    expect(consequences).not.toBe('');
    expect(consequences).toMatch(/8 (norms|normas)/);
    expect(consequences.toLowerCase()).toMatch(/disclaimer/);
    expect(consequences.toLowerCase()).toMatch(/handoff|derivación/);
    expect(consequences).toContain('0001-lexical-retrieval.md');
  });

  it('AC-002-33: the accepted risk is recorded without a recall gate', () => {
    const body = ADR.toLowerCase();
    expect(body).toMatch(/riesgo aceptado|accepted risk/);
    expect(body).toMatch(/insufficient_evidence/);
    expect(body).toMatch(/recall/);
    expect(body).toMatch(/no .*gate|sin gate|not a gate/);
  });

  it('AC-002-33: it cites only the BOE and this repository', () => {
    const hosts = [...ADR.matchAll(/https?:\/\/([^\s/)>]+)/g)].map((match) => match[1] ?? '');
    for (const host of hosts) {
      expect(['www.boe.es', 'boe.es']).toContain(host);
    }
    expect(ADR.toLowerCase()).not.toMatch(/competidor|competitor/);
  });
});
