/**
 * @vitest-environment jsdom
 */
import '@testing-library/jest-dom/vitest';
import '../support/setup-dom';

import { cleanup, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { IBI_BOUNDARY_NOTE, IBI_BOUNDARY_TITLE, INSUFFICIENT_TITLE } from '@/content/strings';
import { abstentionNotice } from '@/components/ChatScreen/use-chat-turn';

import {
  answerResponse,
  askAndWait,
  DEFAULT_DISCLAIMER,
  insufficientResponse,
  renderAnswerBlock,
  renderNotice,
  renderScreen,
  submitReturning,
} from '../support/ui-harness';

describe('AC-003-10 AnswerBlock renders the note', () => {
  it('AC-003-10: the note is visible as an info notice titled IBI_BOUNDARY_TITLE', () => {
    const container = renderAnswerBlock(answerResponse({ boundaryNote: IBI_BOUNDARY_NOTE }));

    expect(screen.getByText(IBI_BOUNDARY_NOTE)).toBeVisible();
    expect(container.textContent).toContain(IBI_BOUNDARY_NOTE);

    const heading = screen.getByRole('heading', { name: IBI_BOUNDARY_TITLE });
    expect(heading).toBeVisible();
    expect(heading.tagName).toBe('H2');

    const notice = heading.closest('aside');
    expect(notice).not.toBeNull();
    expect(notice).toHaveTextContent(IBI_BOUNDARY_NOTE);
    // The tone is what CSS modules expose to jsdom: the hashed class keeps its key.
    expect(notice?.className).toContain('info');
  });
});

describe('AC-003-11 insufficient_evidence renders the note', () => {
  it('AC-003-11: the abstention notice body carries the note next to the explanation', async () => {
    const response = insufficientResponse({ boundaryNote: IBI_BOUNDARY_NOTE });
    const props = abstentionNotice(response);
    expect(props).not.toBeNull();
    if (props === null) return;

    const container = renderNotice(props);
    const notice = container.querySelector('aside');
    expect(notice).not.toBeNull();
    if (notice === null) return;

    // The note and the explanation share one body paragraph, so the assertion is a
    // substring match on the rendered paragraph, never an exact `getByText`.
    expect(notice).toHaveTextContent(/Sus normas propias no están cubiertas por el corpus/);
    const body = notice.querySelector('p');
    expect(body).not.toBeNull();
    expect(body?.textContent).toContain('No he encontrado suficiente información');
    expect(body?.textContent).toContain(IBI_BOUNDARY_NOTE);
    expect(within(notice).getByRole('link', { name: 'Hablar con un asesor' })).toHaveAttribute(
      'href',
      response.handoffUrl
    );

    cleanup();

    renderScreen({ submit: submitReturning(response) });
    await askAndWait('¿Puedo deducirme el IBI?');

    const renderedNotice = (
      await screen.findByRole('heading', { name: INSUFFICIENT_TITLE })
    ).closest('aside');
    expect(renderedNotice).toHaveTextContent(/Sus normas propias no están cubiertas por el corpus/);
    expect(within(renderedNotice as HTMLElement).getByRole('link', { name: 'Hablar con un asesor' })).toBeVisible();
    expect(screen.getByText(DEFAULT_DISCLAIMER)).toBeVisible();
    expect(screen.queryByText(/^Fuentes/)).toBeNull();
  });
});
