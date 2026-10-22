import { readFileSync, readdirSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { SYSTEM_POLICY } from '@/prompts/system-policy';

import { repoPath } from '../support/paths';

function sourceOf(...segments: string[]): string {
  return readFileSync(repoPath(...segments), 'utf8');
}

describe('task 5: the retrieval layer has no I/O boundary', () => {
  it('imports no filesystem, network or database client', () => {
    const dir = repoPath('src/retrieval');
    for (const file of readdirSync(dir)) {
      const source = sourceOf('src/retrieval', file);
      expect(source, `${file} imports fs`).not.toMatch(/from\s+['"](node:)?fs['"]/);
      expect(source, `${file} imports a network client`).not.toMatch(/from\s+['"]https?['"]/);
      expect(source, `${file} imports a database client`).not.toMatch(
        /mongodb|pg|mysql|better-sqlite3|prisma/
      );
      expect(source, `${file} calls fetch`).not.toMatch(/\bfetch\s*\(/);
    }
  });
});

describe('task 3: the parser reads no clock', () => {
  it('carries no Date usage of its own', () => {
    for (const file of ['parse-consolidated-xml.ts', 'xml.ts', 'article-label.ts']) {
      const source = sourceOf('src/corpus', file);
      expect(source, `${file} reads the clock`).not.toMatch(/\bDate\.now|new Date\(/);
    }
  });
});

describe('task 8: the policy is a compile-time constant', () => {
  it('is a plain template literal with no interpolation', () => {
    const source = sourceOf('src/prompts/system-policy.ts');
    expect(source).not.toMatch(/\$\{/);
    expect(SYSTEM_POLICY.length).toBeGreaterThan(200);
  });
});

describe('task 1: configuration is read in exactly one module', () => {
  it('no other module reads process.env directly', () => {
    const offenders: string[] = [];
    const walk = (dir: string): void => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = `${dir}/${entry.name}`;
        if (entry.isDirectory()) {
          walk(full);
          continue;
        }
        if (!/\.(ts|tsx)$/.test(entry.name)) continue;
        if (full.endsWith('src/config/env.ts')) continue;
        if (readFileSync(full, 'utf8').includes('process.env')) offenders.push(full);
      }
    };
    walk(repoPath('src'));
    expect(offenders).toEqual([]);
  });
});
