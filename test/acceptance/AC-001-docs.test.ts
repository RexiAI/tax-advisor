import { existsSync, readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { repoPath } from '../support/harness';

const RUNBOOK = readFileSync(repoPath('docs/RUNBOOK.md'), 'utf8');
const RETRIEVAL_ADR = readFileSync(repoPath('docs/adr/0001-lexical-retrieval.md'), 'utf8');
const PERSISTENCE_ADR = readFileSync(repoPath('docs/adr/0002-no-server-persistence.md'), 'utf8');

const packageJson = JSON.parse(readFileSync(repoPath('package.json'), 'utf8')) as {
  scripts: Record<string, string>;
};

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

function backtickedPaths(text: string): string[] {
  return [...text.matchAll(/`([^`]+)`/g)]
    .map((match) => match[1] ?? '')
    .filter((token) => token.includes('/') && !token.startsWith('http') && !token.includes(' '))
    .map((token) => token.replace(/\/$/, ''));
}

describe('AC-001-86 the runbook covers the five operational paths with real commands', () => {
  it('AC-001-86: the five sections exist and each carries a runnable command', () => {
    const sections: [RegExp, RegExp][] = [
      [/corpus sync/i, /npm run corpus:sync/],
      [/environment variable/i, /LLM_API_KEY/],
      [/local run/i, /npm run dev/],
      [/deploy/i, /curl /],
      [/BOE changed|parsing broke/i, /npm run corpus:sync/],
    ];

    for (const [heading, command] of sections) {
      const body = section(heading);
      expect(body, `missing section ${heading}`).not.toBe('');
      expect(body).toMatch(command);
    }
  });

  it('AC-001-86: the parsing-broke section states the failure contract and names the fixture', () => {
    const body = section(/BOE changed|parsing broke/i);
    expect(body).toMatch(/exit/i);
    expect(body).toMatch(/non-zero|exit 1|exit=1/i);
    expect(body).toMatch(/must\s+never ship a shrunken corpus|never ship a shrunken corpus/i);
    expect(body).toContain('test/fixtures/boe/ley-35-2006.xml');
    expect(body).toContain('test/fixtures/boe/rd-439-2007.xml');
  });

  it('AC-001-86: every repository path and npm script named in the runbook resolves', () => {
    for (const path of backtickedPaths(RUNBOOK)) {
      expect(existsSync(repoPath(path)), `runbook path does not exist: ${path}`).toBe(true);
    }

    const scripts = [...RUNBOOK.matchAll(/npm run ([a-z:]+)/g)].map((match) => match[1] ?? '');
    expect(scripts.length).toBeGreaterThan(0);
    for (const script of scripts) {
      expect(Object.keys(packageJson.scripts)).toContain(script);
    }
  });
});

describe('AC-001-87 the retrieval ADR records the alternative and the revisit condition', () => {
  it('AC-001-87: the ADR follows the repository structure and names the rejected alternative', () => {
    for (const heading of [
      '## Context',
      '## Decision',
      '## Alternatives considered',
      '## Consequences',
    ]) {
      expect(RETRIEVAL_ADR).toContain(heading);
    }
    expect(RETRIEVAL_ADR.toLowerCase()).toContain('embeddings');
    expect(RETRIEVAL_ADR.toLowerCase()).toContain('vector');
    expect(RETRIEVAL_ADR).toMatch(/revisit condition/i);
    expect(RETRIEVAL_ADR).toMatch(/\d+%|\d+,000/);
  });

  it('AC-001-87: it cites only official sources', () => {
    const urls = [...RETRIEVAL_ADR.matchAll(/https?:\/\/([^\s/)>]+)/g)].map((match) => match[1]);
    expect(urls.length).toBeGreaterThan(0);
    for (const host of urls) {
      expect(['www.boe.es', 'boe.es', 'sede.agenciatributaria.gob.es']).toContain(host);
    }
  });
});

describe('AC-001-88 the no-persistence ADR records the privacy rationale', () => {
  it('AC-001-88: structure, in-memory state, serverless implication and the rejected store', () => {
    for (const heading of [
      '## Context',
      '## Decision',
      '## Alternatives considered',
      '## Consequences',
    ]) {
      expect(PERSISTENCE_ADR).toContain(heading);
    }
    expect(PERSISTENCE_ADR.toLowerCase()).toContain('in-memory');
    expect(PERSISTENCE_ADR.toLowerCase()).toContain('serverless');
    expect(PERSISTENCE_ADR.toLowerCase()).toMatch(/minimis|minimiz/);
    expect(PERSISTENCE_ADR.toLowerCase()).toMatch(/persist conversations|persist.*database/);
    expect(PERSISTENCE_ADR).toMatch(/rejected/i);
  });

  it('AC-001-88: it cites no commercial marketing content', () => {
    const urls = [...PERSISTENCE_ADR.matchAll(/https?:\/\/([^\s/)>]+)/g)].map((match) => match[1]);
    expect(urls.length).toBeGreaterThan(0);
    for (const host of urls) {
      expect(['www.boe.es', 'boe.es', 'sede.agenciatributaria.gob.es']).toContain(host);
    }
  });
});

describe('AC-001-77 no text claims professional registration', () => {
  it('AC-001-77: no source claims to be a registered advisor, gestor or Colaborador Social', () => {
    const files = [
      'src/content/strings.ts',
      'src/content/scope-topics.ts',
      'src/prompts/system-policy.ts',
      'docs/RUNBOOK.md',
    ];
    for (const file of files) {
      const source = readFileSync(repoPath(file), 'utf8');
      expect(source.toLowerCase()).not.toMatch(
        /colaborador social|gestor(?:ía)? registrad|asesor registrad/
      );
    }
  });
});
