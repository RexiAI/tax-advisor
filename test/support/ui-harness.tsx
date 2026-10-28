/**
 * jsdom test harness for the chat screen. JSX lives here so the acceptance test
 * file can stay plain TypeScript (the scenario-traceability gate scans
 * `*.test.ts`, not `*.test.tsx`).
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';

import { AnswerBlock } from '@/components/AnswerBlock';
import { ChatScreen, type ChatScreenProps } from '@/components/ChatScreen';
import { Notice, type NoticeProps } from '@/components/Notice';
import type { AnswerResponse, ChatResponse, InsufficientEvidenceResponse } from '@/service/types';

export const CORPUS = { taxYear: 2025, generatedAt: '2026-03-18T08:00:00Z' };

export const CITATION = {
  passageId: 'BOE-A-2006-20764#a63',
  normTitle: 'Ley 35/2006, de 28 de noviembre, del Impuesto sobre la Renta de las Personas Físicas',
  articleLabel: 'Artículo 63',
  sourceUrl: 'https://www.boe.es/buscar/act.php?id=BOE-A-2006-20764',
  publisher: 'boe' as const,
  jurisdiction: 'state' as const,
  authorityUsed: 'boe' as const,
  updatedAt: '2026-03-17',
};

/** A pilot community citation: the BOCM published the norm, the BOE hosts its text. */
export const MADRID_CITATION = {
  passageId: 'BOCM-m-2010-90068#a4',
  normTitle:
    'Decreto Legislativo 1/2010, de 21 de octubre, del Consejo de Gobierno, por el que se aprueba el Texto Refundido de las Disposiciones Legales de la Comunidad de Madrid en materia de tributos cedidos por el Estado.',
  articleLabel: 'Artículo 4',
  sourceUrl: 'https://www.boe.es/buscar/act.php?id=BOCM-m-2010-90068',
  publisher: 'bocm' as const,
  jurisdiction: 'madrid' as const,
  authorityUsed: 'boe' as const,
  updatedAt: '2026-10-07',
};

export const MURCIA_CITATION = {
  passageId: 'BOE-A-2011-10542#a5',
  normTitle:
    'Decreto Legislativo 1/2010, de 5 de noviembre, por el que se aprueba el Texto Refundido de las disposiciones legales vigentes en la Región de Murcia en materia de tributos cedidos.',
  articleLabel: 'Artículo 5',
  sourceUrl: 'https://www.boe.es/buscar/act.php?id=BOE-A-2011-10542',
  publisher: 'borm' as const,
  jurisdiction: 'murcia' as const,
  authorityUsed: 'boe' as const,
  updatedAt: '2026-11-02',
};

/**
 * The same issuing publisher as `MADRID_CITATION`, but the community bulletin is
 * the authority that serves the text — so the link must read "Ver en el BOCM".
 */
export const BOCM_AUTHORITY_CITATION = {
  passageId: 'BOCM-m-2010-90068#a5',
  normTitle:
    'Decreto Legislativo 1/2010, de 21 de octubre, del Consejo de Gobierno, por el que se aprueba el Texto Refundido de las Disposiciones Legales de la Comunidad de Madrid en materia de tributos cedidos por el Estado.',
  articleLabel: 'Artículo 4',
  sourceUrl: 'https://www.bocm.es/eli/es-md/dlg/2010/10/21/1',
  publisher: 'bocm' as const,
  jurisdiction: 'madrid' as const,
  authorityUsed: 'bocm' as const,
  updatedAt: '2026-10-07',
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

/**
 * Renders one `Notice` in isolation. JSX stays here so the acceptance test stays
 * plain TypeScript (the traceability gate scans `*.test.ts`).
 */
export function renderNotice(props: NoticeProps): HTMLElement {
  return render(<Notice {...props} />).container;
}

export function insufficientResponse(
  overrides: Partial<InsufficientEvidenceResponse> = {}
): InsufficientEvidenceResponse {
  return {
    kind: 'insufficient_evidence',
    explanation: 'No he encontrado suficiente información',
    handoffUrl: 'mailto:asesoria@example.com',
    disclaimer: DEFAULT_DISCLAIMER,
    ...overrides,
  };
}

/** Renders one `AnswerBlock` in isolation — the component the note lives in. */
export function renderAnswerBlock(response: AnswerResponse): HTMLElement {
  return render(<AnswerBlock response={response} />).container;
}

export async function askAndWait(text = '¿Puedo deducir el alquiler?'): Promise<void> {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText('Escribe tu pregunta'), text);
  await user.click(screen.getByRole('button', { name: 'Preguntar' }));
}
