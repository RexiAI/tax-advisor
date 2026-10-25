import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { search } from '@/retrieval/index';
import { answerQuestion } from '@/service/answer-question';
import { createConversationStore } from '@/service/conversation-store';
import { classifyScope } from '@/service/scope-guard';
import { createTurnTelemetry } from '@/service/types';

import { FakeLlmAdapter } from '../support/fake-llm-adapter';
import { fixtureCorpus, repoPath } from '../support/harness';

const SCOPE_GUARD_TEST = 'test/acceptance/AC-001-scope-guard.test.ts';
const TEXT_AND_GUARDS_TEST = 'test/unit/text-and-guards.test.ts';
const CHAT_UI_TEST = 'test/acceptance/AC-001-chat-ui.test.ts';

/** The three subjects this spec moved into scope. */
const NEWLY_ANSWERABLE = [
  '¿cuánto IVA pago?',
  '¿cuánto es la cuota de autónomos?',
  'me quiero dar de alta como autónomo',
];

const WITHDRAWN_REASON_CODES = ['social_security', 'autonomo_registration'];

function read(path: string): string {
  return readFileSync(repoPath(path), 'utf8');
}

function testSources(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...testSources(full));
    else if (/\.(ts|tsx)$/.test(entry)) out.push(full);
  }
  return out;
}

function deps(adapter: FakeLlmAdapter) {
  return {
    index: fixtureCorpus().index,
    adapter,
    config: { minRetrievalScore: 0.01, retrievalTopK: 5, corpusTaxYear: 2025 },
    conversations: createConversationStore(),
    telemetry: createTurnTelemetry(),
    now: () => 1_000,
  };
}

function citingAdapterFor(message: string): FakeLlmAdapter {
  const [top] = search(fixtureCorpus().index, message);
  if (top === undefined) throw new Error(`fixture corpus has no match for ${message}`);
  return new FakeLlmAdapter({ deltas: [`La norma lo regula [^p:${top.passage.passageId}].`] });
}

describe('AC-002-29 the 001 tests that fixed the old routing are updated, ids kept', () => {
  it('AC-002-29: no assertion in the two files still routes the three subjects out of scope', () => {
    for (const path of [SCOPE_GUARD_TEST, TEXT_AND_GUARDS_TEST]) {
      const source = read(path);
      for (const reasonCode of WITHDRAWN_REASON_CODES) {
        expect(source, `${path} still names ${reasonCode}`).not.toContain(reasonCode);
      }
      expect(source, `${path} still expects a removed guide`).not.toMatch(
        /IVA_GUIDE|RETA_GUIDE|FACTURA_GUIDE|MODELS_OVERVIEW/
      );
    }
  });

  it('AC-002-29: every updated test keeps its AC-001 scenario id', () => {
    const scopeGuard = read(SCOPE_GUARD_TEST);
    for (const id of ['AC-001-55', 'AC-001-56', 'AC-001-57', 'AC-001-58']) {
      expect(scopeGuard, `lost ${id}`).toContain(id);
    }
    const unit = read(TEXT_AND_GUARDS_TEST);
    expect(unit).toContain('classifyScope');
    expect(unit).toContain('filing_request');
  });

  it('AC-002-29: the updated assertions agree with AC-002-08 on the classification', () => {
    for (const message of NEWLY_ANSWERABLE) {
      expect(classifyScope(message), message).toBeNull();
    }
  });

  it('AC-002-29: the end-to-end flow reaches retrieval for VAT, RETA and registration', async () => {
    for (const message of NEWLY_ANSWERABLE) {
      const adapter = citingAdapterFor(message);
      const response = await answerQuestion({ message }, deps(adapter));

      expect(response.kind, message).not.toBe('out_of_scope');
      expect(response.kind, message).not.toBe('guide');
      expect(adapter.callCount, message).toBe(1);
    }
  });
});

describe('AC-002-30 the iva reason-code fixture is replaced by one still valid', () => {
  it('AC-002-30: no payload under test/ uses a withdrawn out-of-scope reason code', () => {
    const offenders: string[] = [];
    for (const file of testSources(repoPath('test'))) {
      const source = readFileSync(file, 'utf8');
      for (const reasonCode of ['iva', ...WITHDRAWN_REASON_CODES]) {
        if (new RegExp(`reasonCode:\\s*'${reasonCode}'`).test(source))
          offenders.push(`${file}: ${reasonCode}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it('AC-002-30: the chat UI fixture uses ibi with a coherent topic label and body', () => {
    const source = read(CHAT_UI_TEST);
    expect(source).toContain("reasonCode: 'ibi'");
    expect(source).toContain("topicLabel: 'el IBI'");
    expect(source).toMatch(/officialBody: 'la autoridad tributaria de tu comunidad autónoma'/);
    expect(source).toContain('AC-001-79');
  });
});
