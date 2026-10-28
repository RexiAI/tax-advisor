/**
 * @vitest-environment jsdom
 */
import '@testing-library/jest-dom/vitest';
import '../support/setup-dom';

import { readFileSync } from 'node:fs';

import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  CONSOLIDATED_TEXT_NOTICE,
  INSUFFICIENT_BOUNDARY,
  INSUFFICIENT_EXPLANATIONS,
  INSUFFICIENT_TITLE,
  OUT_OF_SCOPE_EXPLANATION,
  STATUS_SEARCHING,
  YEAR_NOTICE_BODY,
  sourceLinkLabel,
} from '@/content/strings';
import { parseCorpusArtifact } from '@/corpus/artifact';
import { citationOf, type Citation } from '@/domain/citation';
import type { AuthorityUsed } from '@/domain/source';
import { SYSTEM_POLICY } from '@/prompts/system-policy';

import { fixtureCorpus, repoPath } from '../support/harness';
import {
  answerResponse,
  BOCM_AUTHORITY_CITATION,
  CITATION,
  MADRID_CITATION,
  MURCIA_CITATION,
  renderAnswerBlock,
} from '../support/ui-harness';

function renderCitations(citations: readonly Citation[]): HTMLElement {
  return renderAnswerBlock(answerResponse({ citations: [...citations] }));
}

/**
 * Test-only host map (15-design.md addendum): the label's token must be the
 * domain of the host that serves the text. It lives here rather than in the
 * product because the component cannot repair a mismatch and `strings.ts` must
 * carry no host literal.
 */
const HOST_BY_AUTHORITY: Readonly<Record<AuthorityUsed, string>> = {
  boe: 'boe.es',
  bocm: 'bocm.es',
  borm: 'borm.es',
};

function hostToken(label: string): string {
  const match = /^Ver en el ([A-Za-z]+)$/.exec(label);
  if (match === null) throw new Error(`unexpected source link label: ${label}`);
  return match[1] as string;
}

function committedCitations(): readonly Citation[] {
  const parsed = parseCorpusArtifact(readFileSync(repoPath('corpus/corpus.json'), 'utf8'));
  if (!parsed.ok) throw new Error(`committed corpus did not parse: ${parsed.error}`);
  return parsed.artifact.passages.map((passage) => citationOf(passage));
}

function fixtureCitations(): readonly Citation[] {
  return fixtureCorpus().artifact.passages.map((passage) => citationOf(passage));
}

describe('AC-004-31 a source entry renders publisher and jurisdiction', () => {
  it('AC-004-31: the entry shows the jurisdiction, the publisher and the date', () => {
    renderCitations([MADRID_CITATION]);

    // Both tokens are exact text nodes of their own (T7-C4).
    expect(screen.getByText('Comunidad de Madrid')).toBeVisible();
    expect(screen.getByText('BOCM')).toBeVisible();
    expect(screen.getByText(/7 de octubre de 2026/)).toBeVisible();
  });
});

describe('AC-004-32 the link label names the text real host, not the issuing publisher', () => {
  it('AC-004-32: a Madrid citation reads Ver en el BOE while the row keeps BOCM', () => {
    renderCitations([MADRID_CITATION]);

    const link = screen.getByRole('link', { name: /Ver en el BOE/ });
    expect(link.textContent).toBe('Ver en el BOE');
    expect(link.getAttribute('aria-label')).toMatch(/^Ver en el BOE: /);
    expect(link).toHaveAttribute('href', MADRID_CITATION.sourceUrl);

    // The metadata row still names the issuing publisher and the jurisdiction.
    expect(screen.getByText('BOCM')).toBeVisible();
    expect(screen.getByText('Comunidad de Madrid')).toBeVisible();
  });

  it('AC-004-32: a citation published by the BOE reads Ver en el BOE too', () => {
    renderCitations([CITATION]);

    const link = screen.getByRole('link', { name: /Ver en el BOE/ });
    expect(link.textContent).toBe('Ver en el BOE');
    expect(link.getAttribute('aria-label')).toMatch(/^Ver en el BOE: /);
  });
});

describe('AC-004-33 the link label follows authorityUsed and never contradicts sourceUrl', () => {
  it('AC-004-33: a citation whose authority is the BOCM reads Ver en el BOCM', () => {
    renderCitations([BOCM_AUTHORITY_CITATION]);

    const link = screen.getByRole('link', { name: /Ver en el BOCM/ });
    expect(link.textContent).toBe('Ver en el BOCM');
    expect(link.getAttribute('aria-label')).toMatch(/^Ver en el BOCM: /);
    expect(link).toHaveAttribute('href', BOCM_AUTHORITY_CITATION.sourceUrl);
  });

  it('AC-004-33: the same publisher yields two labels for two authorities', () => {
    expect(sourceLinkLabel('boe')).toBe('Ver en el BOE');
    expect(sourceLinkLabel('bocm')).toBe('Ver en el BOCM');
    expect(sourceLinkLabel('borm')).toBe('Ver en el BORM');

    const container = renderCitations([MADRID_CITATION, BOCM_AUTHORITY_CITATION]);
    const labels = [...container.querySelectorAll('a')].map((link) => link.textContent);
    expect(labels).toEqual(['Ver en el BOE', 'Ver en el BOCM']);
  });
});

describe('AC-004-34 the named identity and refusal copy no longer hardcodes del BOE', () => {
  it('AC-004-34: every named string refers to the official sources generically', () => {
    const named = [
      CONSOLIDATED_TEXT_NOTICE,
      INSUFFICIENT_TITLE,
      OUT_OF_SCOPE_EXPLANATION,
      STATUS_SEARCHING,
      INSUFFICIENT_EXPLANATIONS.no_results,
      INSUFFICIENT_EXPLANATIONS.below_threshold,
      INSUFFICIENT_EXPLANATIONS.no_citations,
      INSUFFICIENT_EXPLANATIONS.corpus_unavailable,
      INSUFFICIENT_BOUNDARY,
      YEAR_NOTICE_BODY,
    ];
    for (const text of named) {
      expect(text).not.toMatch(/\bBOE\b/);
    }
    expect(CONSOLIDATED_TEXT_NOTICE).toMatch(/fuentes oficiales/i);
    expect(INSUFFICIENT_TITLE).toMatch(/fuentes oficiales/i);
    expect(OUT_OF_SCOPE_EXPLANATION).toContain('la norma oficial citada');
    expect(STATUS_SEARCHING).toMatch(/fuentes oficiales/i);
  });

  it('AC-004-34: the system policy identity sentence no longer asserts the BOE', () => {
    expect(SYSTEM_POLICY).not.toContain('Boletín Oficial del Estado');
    expect(SYSTEM_POLICY).toMatch(/texto consolidado de las fuentes oficiales/i);
  });

  it('AC-004-34: unverified_citation stays byte-identical (it already names no source)', () => {
    expect(INSUFFICIENT_EXPLANATIONS.unverified_citation).toBe(
      'La respuesta citaba normas que no forman parte de los pasajes recuperados para esta pregunta, así que no puedo confirmarla.'
    );
  });
});

describe('AC-004-35 a regional citation shows the consolidated-version date', () => {
  it('AC-004-35: the rendered date is updatedAt, and boeUpdatedAt no longer exists', () => {
    renderCitations([MURCIA_CITATION]);
    expect(screen.getByText(/2 de noviembre de 2026/)).toBeVisible();
    expect('boeUpdatedAt' in MURCIA_CITATION).toBe(false);
    expect(MURCIA_CITATION.updatedAt).toBe('2026-11-02');
  });
});

describe('AC-004-53 the link label host token matches the sourceUrl host', () => {
  it('AC-004-53: every citation in the committed corpus and the fixtures names its own host', () => {
    const citations = [
      ...committedCitations(),
      ...fixtureCitations(),
      CITATION,
      MADRID_CITATION,
      MURCIA_CITATION,
      BOCM_AUTHORITY_CITATION,
    ];
    expect(citations.length).toBeGreaterThan(400);

    for (const citation of citations) {
      const expectedHost = HOST_BY_AUTHORITY[citation.authorityUsed];
      const hostname = new URL(citation.sourceUrl).hostname.replace(/^www\./, '');

      expect(hostname, `${citation.passageId}: sourceUrl host`).toBe(expectedHost);
      expect(hostToken(sourceLinkLabel(citation.authorityUsed)), citation.passageId).toBe(
        expectedHost.split('.')[0]?.toUpperCase()
      );
    }
  });

  it('AC-004-53: boe.es renders BOE, bocm.es renders BOCM, borm.es renders BORM', () => {
    expect(hostToken(sourceLinkLabel('boe'))).toBe('BOE');
    expect(hostToken(sourceLinkLabel('bocm'))).toBe('BOCM');
    expect(hostToken(sourceLinkLabel('borm'))).toBe('BORM');
  });
});
