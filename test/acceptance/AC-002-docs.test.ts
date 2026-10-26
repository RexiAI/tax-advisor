import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { repoPath } from '../support/harness';

const RUNBOOK = readFileSync(repoPath('docs/RUNBOOK.md'), 'utf8');
const RETRIEVAL_ADR = readFileSync(repoPath('docs/adr/0001-lexical-retrieval.md'), 'utf8');

/** Distinctive fragment of each covered norm's title. */
const NORM_TITLES = [
  'Ley 35/2006',
  'Real Decreto 439/2007',
  'Ley 58/2003',
  'Real Decreto 1065/2007',
  'Real Decreto Legislativo 8/2015',
  'Real Decreto 84/1996',
  'Ley 37/1992',
  'Real Decreto Legislativo 1175/1990',
];

const FIXTURE_FILES = [
  'ley-35-2006.xml',
  'rd-439-2007.xml',
  'ley-58-2003.xml',
  'rd-1065-2007.xml',
  'rdleg-8-2015-lgss.xml',
  'rd-84-1996.xml',
  'ley-37-1992-iva.xml',
  'rdleg-1175-1990-iae.xml',
];

function section(titlePattern: RegExp): string {
  const headings = [...RUNBOOK.matchAll(/^## (.+)$/gm)].map((match) => ({
    title: match[1] ?? '',
    start: match.index ?? 0,
  }));
  const index = headings.findIndex((heading) => titlePattern.test(heading.title));
  if (index === -1) return '';
  const end = headings[index + 1]?.start ?? RUNBOOK.length;
  return RUNBOOK.slice(headings[index]!.start, end);
}

describe('AC-002-31 the runbook describes the expanded corpus', () => {
  it('AC-002-31: the corpus section no longer claims two norms and names all eight', () => {
    const body = section(/corpus sync/i);
    expect(body).not.toBe('');
    expect(body).not.toMatch(/two covered norms/i);
    expect(body).not.toMatch(/for the two/i);

    for (const title of NORM_TITLES) {
      expect(body, `runbook omits ${title}`).toContain(title);
    }
  });

  it('AC-002-31: the same command, exit codes and invariants remain', () => {
    const body = section(/corpus sync/i);
    expect(body).toContain('npm run corpus:sync');
    expect(body).toMatch(/exits `0`/);
    expect(body).toMatch(/exits `1`/);
    expect(body).toMatch(/incremental/i);
    expect(body).toMatch(/idempotent/i);
    expect(body).toMatch(/contentHash/);
    expect(body).toMatch(/not\*\* modified|not modified/i);
  });

  it('AC-002-31: the parsing-broke section keeps the per-norm fixture convention', () => {
    const body = section(/BOE changed|parsing broke/i);
    expect(body).not.toBe('');
    expect(body).toContain('test/fixtures/boe/');
    for (const file of FIXTURE_FILES) {
      expect(body, `runbook omits ${file}`).toContain(file);
    }
    expect(body).toMatch(/exit=1|exit 1|non-zero/i);
  });
});

describe('AC-002-32 the impact note records the growth and imposes no recall gate', () => {
  it('AC-002-32: the revisit section records the corpus growth and points at ADR 0003', () => {
    const revisit = RETRIEVAL_ADR.slice(RETRIEVAL_ADR.indexOf('## Revisit condition'));
    expect(revisit).not.toBe('');

    expect(revisit).toMatch(/2 to 8|from 2|two to eight/i);
    expect(revisit).toContain('docs/adr/0003-advisor-scope-expansion.md');
    expect(revisit).toMatch(/396/);
    expect(revisit).toMatch(/several thousand|thousands of passages/i);
  });

  it('AC-002-32: no recall-measurement obligation is introduced', () => {
    const revisit = RETRIEVAL_ADR.slice(RETRIEVAL_ADR.indexOf('## Revisit condition'));
    expect(revisit).toMatch(/accepted/i);
    expect(revisit).toMatch(/insufficient_evidence/);
    expect(revisit).toMatch(/no recall-measurement gate|not a gate|no measurement gate/i);
  });

  it('AC-002-32: the existing revisit threshold is untouched', () => {
    expect(RETRIEVAL_ADR).toContain('50,000 passages');
  });
});
