import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { repoPath } from '../support/harness';

const ADR = readFileSync(repoPath('docs/adr/0004-official-source-coverage.md'), 'utf8');

function decision(): string {
  const start = ADR.indexOf('## Decision');
  const end = ADR.indexOf('## Alternatives considered');
  return start === -1 || end === -1 ? '' : ADR.slice(start, end);
}

describe('AC-004-01 the ADR exists with the repository structure', () => {
  it('AC-004-01: the five sections are present', () => {
    for (const heading of [
      '## Context',
      '## Decision',
      '## Alternatives considered',
      '## Consequences',
      '## Sources',
    ]) {
      expect(ADR, `missing ${heading}`).toContain(heading);
    }
  });
});

describe('AC-004-02 the source-registry data model and the jurisdiction concept', () => {
  it('AC-004-02: every provenance field is named and admission is conditional', () => {
    const text = decision();
    for (const field of [
      'publisher',
      'jurisdiction',
      'authorityUsed',
      'officialId',
      'sourceUrl',
      'updatedAt',
      'licenseNote',
    ]) {
      expect(text, `does not name ${field}`).toContain(field);
    }
    expect(text.replace(/\s+/g, ' ')).toMatch(/missing any of them is not admitted/i);
  });

  it('AC-004-02: the closed jurisdiction set names state, Madrid and Murcia, and municipal stays a refusal', () => {
    const text = decision();
    expect(text).toContain('`state`');
    expect(text.toLowerCase()).toContain('madrid');
    expect(text.toLowerCase()).toContain('murcia');
    expect(text).toMatch(/municipal taxes are out of scope/i);
    expect(text).toMatch(/never as a jurisdiction value/i);
  });
});

describe('AC-004-03 the publisher-authority rule and the licence-per-publisher model', () => {
  it('AC-004-03: the bulletin is the source of record, BOE only as the documented fallback', () => {
    const text = decision().replace(/\s+/g, ' ');
    expect(text).toMatch(/community bulletin is the source of record/i);
    expect(text).toMatch(/BOE consolidated text is\s+used only when the publisher offers no stable, versioned consolidated text/i);
    expect(text).toMatch(/`authorityUsed` records which publisher was used/i);
    expect(text).toMatch(/both references and both dates/i);
    expect(text).toMatch(/does not switch\s+authority between syncs without an explicit migration note/i);
    expect(text).toMatch(/reuse terms are stored per norm/i);
    expect(text).toMatch(/does not imply that any publisher\s+endorses/i);
  });
});

describe('AC-004-04 the coverage matrix, the pilot pair and the fallback order', () => {
  it('AC-004-04: coverage is per pair, single-lookup, with no second list', () => {
    const text = `${decision()}${ADR.slice(ADR.indexOf('## Consequences'))}`.replace(/\s+/g, ' ');
    expect(text).toMatch(/per `\(jurisdiction, tax\)` pair/i);
    expect(text).toMatch(/machine-readable/i);
    expect(text).toContain('isCovered');
    expect(text).toMatch(/no second list/i);
  });

  it('AC-004-04: the pilot pair, the fallback order and the exclusion list are recorded', () => {
    const text = `${decision()}${ADR.slice(ADR.indexOf('## Consequences'))}`.replace(/\s+/g, ' ');
    expect(text).toMatch(/Comunidad de Madrid \(BOCM\)/);
    expect(text).toMatch(/Región de Murcia \(BORM\)/);
    expect(text).toMatch(/Castilla y León \(BOCYL\)/);
    expect(text).toMatch(/Aragón \(BOA\)/);
    expect(text).toMatch(/Extremadura \(DOE\)/);
    expect(text).toMatch(/incremental on the source's own update date/i);
    expect(text).toMatch(/fails\s+closed/i);
    expect(text).toContain('spec 005');
    expect(text).toContain('spec 006');
    expect(text).toMatch(/municipal taxes/i);
    expect(text).toMatch(/DGT consultations and AEAT manuals/i);
  });
});

describe('AC-004-05 the sources cite only official hosts', () => {
  it('AC-004-05: every URL host is an official bulletin or BOE host', () => {
    const sources = ADR.slice(ADR.indexOf('## Sources'));
    const hosts = [...sources.matchAll(/https?:\/\/([^\s/)>]+)/g)].map((match) => match[1] ?? '');
    expect(hosts.length).toBeGreaterThan(0);
    for (const host of hosts) {
      expect(['www.boe.es', 'boe.es', 'www.bocm.es', 'bocm.es', 'www.borm.es', 'borm.es']).toContain(
        host
      );
    }
    expect(sources.toLowerCase()).not.toMatch(/iberley|noticias\.juridicas|wolters|aranzadi/);
  });
});
