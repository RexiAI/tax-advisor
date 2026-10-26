/**
 * @vitest-environment jsdom
 */
import '@testing-library/jest-dom/vitest';
import '../support/setup-dom';

import { readFileSync } from 'node:fs';

import { cleanup, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { abstentionNotice } from '@/components/ChatScreen/use-chat-turn';
import {
  HANDOFF_LABEL,
  IBI_BOUNDARY_NOTE,
  IBI_BOUNDARY_TITLE,
  INSUFFICIENT_TITLE,
  OUT_OF_SCOPE_TITLE,
  YEAR_NOTICE_TITLE,
} from '@/content/strings';
import type { ChatResponse } from '@/service/types';

import { repoPath } from '../support/harness';
import {
  answerResponse,
  insufficientResponse,
  renderAnswerBlock,
  renderNotice,
} from '../support/ui-harness';

const YEAR_NOTICE = 'El texto del BOE que cito corresponde al año 2025.';

function noteHeading(): Element | null {
  return screen.queryByRole('heading', { name: IBI_BOUNDARY_TITLE });
}

function yearHeading(): Element | null {
  return screen.queryByRole('heading', { name: YEAR_NOTICE_TITLE });
}

function followedBy(earlier: Element, later: Element): boolean {
  return (
    (earlier.compareDocumentPosition(later) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0
  );
}

describe('AnswerBlock renders the note only when the payload carries it', () => {
  it('renders no note, no empty aside and no placeholder when boundaryNote is absent', () => {
    const container = renderAnswerBlock(answerResponse());

    expect(noteHeading()).toBeNull();
    expect(container.querySelectorAll('aside')).toHaveLength(0);
    expect(container.querySelectorAll('p:empty')).toHaveLength(0);
  });

  it('renders exactly one extra aside, and keeps the year notice untouched', () => {
    const withoutNote = renderAnswerBlock(answerResponse({ yearNotice: YEAR_NOTICE }));
    const baselineAsides = withoutNote.querySelectorAll('aside').length;
    cleanup();

    const withBoth = renderAnswerBlock(
      answerResponse({ yearNotice: YEAR_NOTICE, boundaryNote: IBI_BOUNDARY_NOTE })
    );

    expect(withBoth.querySelectorAll('aside')).toHaveLength(baselineAsides + 1);
    expect(noteHeading()).not.toBeNull();
    expect(yearHeading()).not.toBeNull();
    expect(screen.getByText(YEAR_NOTICE)).toBeVisible();
    expect(screen.getByText(IBI_BOUNDARY_NOTE)).toBeVisible();
  });
});

describe('the two qualifiers stack as siblings, in the designed order', () => {
  it('puts the boundary note before the year notice and both before Fuentes', () => {
    renderAnswerBlock(answerResponse({ yearNotice: YEAR_NOTICE, boundaryNote: IBI_BOUNDARY_NOTE }));

    const note = noteHeading();
    const year = yearHeading();
    const sources = screen.getByRole('heading', { name: /^Fuentes/ });
    expect(note).not.toBeNull();
    expect(year).not.toBeNull();
    if (note === null || year === null) return;

    expect(followedBy(note, year)).toBe(true);
    expect(followedBy(note, sources)).toBe(true);
    expect(followedBy(year, sources)).toBe(true);
    // Neither is nested in the other: they are sibling asides.
    expect(note.closest('aside')?.contains(year.closest('aside'))).toBe(false);
    expect(year.closest('aside')?.contains(note.closest('aside'))).toBe(false);
  });

  it('renders the note as a title and one paragraph, with no affordance at all', () => {
    renderAnswerBlock(answerResponse({ boundaryNote: IBI_BOUNDARY_NOTE }));

    const note = noteHeading();
    const aside = note?.closest('aside') ?? null;
    expect(note).not.toBeNull();
    expect(aside).not.toBeNull();
    if (aside === null || note === null) return;

    expect(aside.querySelectorAll('a')).toHaveLength(0);
    expect(aside.querySelectorAll('ol')).toHaveLength(0);
    expect(aside.querySelectorAll('ul')).toHaveLength(0);
    expect([...aside.children].map((child) => child.tagName)).toEqual(['H2', 'P']);
    expect(aside.textContent).toBe(`${IBI_BOUNDARY_TITLE}${IBI_BOUNDARY_NOTE}`);
    expect(aside.textContent).not.toContain('http');
  });

  it('keeps the note out of the answer live region and out of every heading level but H2', () => {
    const container = renderAnswerBlock(
      answerResponse({ yearNotice: YEAR_NOTICE, boundaryNote: IBI_BOUNDARY_NOTE })
    );

    const noteText = screen.getByText(IBI_BOUNDARY_NOTE);
    expect(noteText.closest('[aria-live]')).toBeNull();

    const headings = container.querySelectorAll('h1, h2, h3');
    expect(headings.length).toBeGreaterThan(0);
    for (const heading of headings) expect(heading.tagName).toBe('H2');
  });
});

describe('abstentionNotice composes the note into the body conditionally', () => {
  it('leaves the body exactly the explanation when there is no note', () => {
    const notice = abstentionNotice(insufficientResponse());

    expect(notice).toEqual({
      tone: 'info',
      title: INSUFFICIENT_TITLE,
      body: 'No he encontrado suficiente información',
      action: { href: 'mailto:asesoria@example.com', label: HANDOFF_LABEL },
    });
  });

  it('appends the note after a blank line and keeps the year notice in the footer', () => {
    const notice = abstentionNotice(
      insufficientResponse({ boundaryNote: IBI_BOUNDARY_NOTE, yearNotice: YEAR_NOTICE })
    );

    expect(notice).toEqual({
      tone: 'info',
      title: INSUFFICIENT_TITLE,
      body: `No he encontrado suficiente información\n\n${IBI_BOUNDARY_NOTE}`,
      action: { href: 'mailto:asesoria@example.com', label: HANDOFF_LABEL },
      footer: YEAR_NOTICE,
    });
    expect(notice?.body).not.toContain('undefined');
  });

  it('renders both statements in one body paragraph', () => {
    const notice = abstentionNotice(
      insufficientResponse({ boundaryNote: IBI_BOUNDARY_NOTE, yearNotice: YEAR_NOTICE })
    );
    if (notice === null) throw new Error('abstentionNotice returned null');

    const container = renderNotice(notice);
    const paragraphs = container.querySelectorAll('p');
    expect(paragraphs).toHaveLength(2);
    expect(paragraphs[0]?.textContent).toBe(
      `No he encontrado suficiente información\n\n${IBI_BOUNDARY_NOTE}`
    );
    expect(paragraphs[1]?.textContent).toBe(YEAR_NOTICE);
  });

  it('leaves the refusal branch exactly as it was', () => {
    const refusal: ChatResponse = {
      kind: 'out_of_scope',
      reasonCode: 'ibi',
      topicLabel: 'el IBI',
      officialBody: 'la autoridad tributaria de tu comunidad autónoma',
      explanation: 'Las preguntas sobre el IBI quedan fuera de mi alcance.',
      handoffUrl: 'mailto:asesoria@example.com',
      disclaimer: 'aviso',
    };

    expect(abstentionNotice(refusal)).toEqual({
      tone: 'info',
      title: OUT_OF_SCOPE_TITLE,
      body: 'Las preguntas sobre el IBI quedan fuera de mi alcance.',
      action: { href: 'mailto:asesoria@example.com', label: HANDOFF_LABEL },
    });
  });

  it('returns no notice for the kinds that never carry the note', () => {
    const others: readonly ChatResponse[] = [
      { kind: 'clarification', question: '¿Qué año?', disclaimer: 'aviso' },
      {
        kind: 'privacy_warning',
        category: 'dni',
        categoryLabel: 'DNI',
        message: 'Reformula la pregunta.',
        disclaimer: 'aviso',
      },
      { kind: 'error', errorCode: 'llm_timeout', message: 'Vuelve a intentarlo.' },
    ];

    for (const response of others) expect(abstentionNotice(response)).toBeNull();
  });

  it('keeps the guide branch free of the note', () => {
    const notice = abstentionNotice({
      kind: 'guide',
      title: 'Modelo 130',
      explanation: 'Pago fraccionado.',
      steps: ['Calcula el rendimiento neto.'],
      links: [],
      disclaimer: 'aviso',
    });

    expect(notice?.body).toBe('Pago fraccionado.');
    expect(notice?.items).toEqual(['Calcula el rendimiento neto.']);
  });
});

describe('no Spanish copy is written in the components', () => {
  it('AnswerBlock imports the title and use-chat-turn maps payload fields only', () => {
    const answerBlock = readFileSync(
      repoPath('src/components/AnswerBlock/AnswerBlock.tsx'),
      'utf8'
    );
    expect(answerBlock).toContain("from '@/content/strings'");
    expect(answerBlock).toContain('IBI_BOUNDARY_TITLE');
    expect(answerBlock).not.toContain('Sobre el IBI de tu pregunta');
    expect(answerBlock).not.toContain('Tu pregunta menciona el IBI');

    const chatTurn = readFileSync(
      repoPath('src/components/ChatScreen/use-chat-turn.ts'),
      'utf8'
    );
    expect(chatTurn).not.toContain('Sobre el IBI de tu pregunta');
    expect(chatTurn).not.toContain('Tu pregunta menciona el IBI');
  });
});
