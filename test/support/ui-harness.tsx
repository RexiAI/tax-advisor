/**
 * jsdom test harness for the chat screen. JSX lives here so the acceptance test
 * file can stay plain TypeScript (the scenario-traceability gate scans
 * `*.test.ts`, not `*.test.tsx`).
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';

import { ChatScreen, type ChatScreenProps } from '@/components/ChatScreen';
import type { AnswerResponse, ChatResponse } from '@/service/types';

export const CORPUS = { taxYear: 2025, generatedAt: '2026-03-18T08:00:00Z' };

export const CITATION = {
  passageId: 'BOE-A-2006-20764#a63',
  normTitle: 'Ley 35/2006, de 28 de noviembre, del Impuesto sobre la Renta de las Personas Físicas',
  articleLabel: 'Artículo 63',
  sourceUrl: 'https://www.boe.es/buscar/act.php?id=BOE-A-2006-20764',
  boeUpdatedAt: '2026-03-17',
};

export const DEFAULT_DISCLAIMER =
  'Esto es información general elaborada con IA, no asesoramiento fiscal personalizado.';

export function answerResponse(overrides: Partial<AnswerResponse> = {}): AnswerResponse {
  return {
    kind: 'answer',
    explanation: 'La escala general del impuesto se aplica a la base liquidable.',
    rule: 'El artículo 63 fija la escala general.',
    citations: [CITATION],
    disclaimer: DEFAULT_DISCLAIMER,
    ...overrides,
  };
}

export function submitReturning(response: ChatResponse): ChatScreenProps['submit'] {
  return async () => ({ kind: 'response', response });
}

export interface ScreenView {
  readonly container: HTMLElement;
  readonly rerenderWith: (overrides: Partial<ChatScreenProps>) => void;
}

function element(props: ChatScreenProps): ReactElement {
  return <ChatScreen {...props} />;
}

export function renderScreen(overrides: Partial<ChatScreenProps> = {}): ScreenView {
  const props: ChatScreenProps = {
    corpus: CORPUS,
    maxChars: 2000,
    submit: submitReturning(answerResponse()),
    ...overrides,
  };
  const view = render(element(props));

  return {
    container: view.container,
    rerenderWith: (next: Partial<ChatScreenProps>) => {
      view.rerender(element({ ...props, ...next }));
    },
  };
}

export async function askAndWait(text = '¿Puedo deducir el alquiler?'): Promise<void> {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText('Escribe tu pregunta'), text);
  await user.click(screen.getByRole('button', { name: 'Preguntar' }));
}
