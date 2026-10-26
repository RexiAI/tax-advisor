/**
 * Turn state for the chat screen: the thread, the draft, the pending status and
 * the single request that produces a response. Kept out of the component so the
 * screen stays a layout and every function stays inside the complexity budget.
 */

'use client';

import { useState, type FormEvent } from 'react';

import type { NoticeProps } from '@/components/Notice';
import type { ThreadEntry } from '@/components/Thread';
import {
  CLARIFICATION_TITLE,
  GUIDE_FOOTER,
  HANDOFF_LABEL,
  INSUFFICIENT_TITLE,
  OUT_OF_SCOPE_TITLE,
  RETRY_AFTER_LABEL,
  STATUS_SEARCHING,
} from '@/content/strings';
import type { AnswerResponse, ChatResponse, InsufficientEvidenceResponse } from '@/service/types';

import type { ClientError, Submit, SubmitOutcome } from './chat-submit';

export interface ChatTurn {
  readonly entries: readonly ThreadEntry[];
  readonly draft: string;
  readonly busy: boolean;
  readonly streamingText: string;
  readonly notice: NoticeProps | null;
  /** Announced by the persistent polite region; text only, never the block. */
  readonly announcement: string;
  readonly statusText: string;
  setDraft(value: string): void;
  handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void>;
}

interface ThreadUpdates {
  readonly append: (added: readonly ThreadEntry[]) => void;
  readonly clearDraft: () => void;
  readonly setNotice: (notice: NoticeProps | null) => void;
  readonly setAnnouncement: (text: string) => void;
}

let entryCounter = 0;

function nextEntryId(): string {
  entryCounter += 1;
  return `entry-${String(entryCounter)}`;
}

function userEntry(text: string): ThreadEntry {
  return { id: nextEntryId(), kind: 'user', text };
}

function answerEntry(response: AnswerResponse): ThreadEntry {
  return { id: nextEntryId(), kind: 'answer', response };
}

function noticeEntry(notice: NoticeProps): ThreadEntry {
  return { id: nextEntryId(), kind: 'notice', notice };
}

/**
 * The abstention's body. Both strings are payload fields, so this is a mapping,
 * not copy: the boundary note joins the explanation after a blank line, which
 * `.body` renders as a paragraph break under `white-space: pre-line`. When there
 * is no note the body stays exactly the explanation — no trailing separator and
 * no empty second paragraph.
 */
function abstentionBody(response: InsufficientEvidenceResponse): string {
  return response.boundaryNote === undefined
    ? response.explanation
    : `${response.explanation}\n\n${response.boundaryNote}`;
}

/**
 * The `Notice` for a thread-level non-answer. An abstention is an ordinary
 * outcome and gets a name; a refusal gets its boundary copy and the handoff, and
 * nothing else — no steps, no link list, no footer. A guide keeps its numbered
 * procedure and carries the disclosure plus the boundary in one footer.
 */
export function abstentionNotice(response: ChatResponse): NoticeProps | null {
  if (response.kind === 'insufficient_evidence') {
    return {
      tone: 'info',
      title: INSUFFICIENT_TITLE,
      body: abstentionBody(response),
      action: { href: response.handoffUrl, label: HANDOFF_LABEL },
      ...(response.yearNotice === undefined ? {} : { footer: response.yearNotice }),
    };
  }
  if (response.kind === 'out_of_scope') {
    return {
      tone: 'info',
      title: OUT_OF_SCOPE_TITLE,
      body: response.explanation,
      action: { href: response.handoffUrl, label: HANDOFF_LABEL },
    };
  }
  if (response.kind === 'guide') {
    return {
      tone: 'info',
      title: response.title,
      body: response.explanation,
      items: response.steps,
      links: response.links,
      footer: GUIDE_FOOTER,
    };
  }
  return null;
}

function composerNotice(response: ChatResponse): NoticeProps | null {
  if (response.kind === 'clarification') {
    return { tone: 'info', title: CLARIFICATION_TITLE, body: response.question };
  }
  if (response.kind === 'privacy_warning') return { tone: 'warning', body: response.message };
  if (response.kind === 'error') return { tone: 'error', body: response.message };
  return null;
}

function errorNotice(error: ClientError): NoticeProps {
  if (error.retryAfterSeconds === undefined) return { tone: 'error', body: error.message };
  return {
    tone: 'error',
    body: error.message,
    footer: RETRY_AFTER_LABEL.replace('{seconds}', String(error.retryAfterSeconds)),
  };
}

function applyOutcome(outcome: SubmitOutcome, message: string, update: ThreadUpdates): void {
  if (outcome.kind === 'error') {
    update.setNotice(errorNotice(outcome.error));
    return;
  }

  const response = outcome.response;
  if (response.kind === 'answer') {
    update.append([userEntry(message), answerEntry(response)]);
    update.clearDraft();
    return;
  }

  const abstention = abstentionNotice(response);
  if (abstention !== null) {
    update.append([userEntry(message), noticeEntry(abstention)]);
    update.setAnnouncement(abstention.title ?? abstention.body);
    update.clearDraft();
    return;
  }

  update.setNotice(composerNotice(response));
}

interface TurnRun {
  readonly submit: Submit;
  readonly message: string;
  readonly conversationId: string;
  readonly onDelta: (text: string) => void;
  readonly update: ThreadUpdates;
}

async function runTurn(run: TurnRun): Promise<void> {
  const outcome = await run.submit(run.message, run.conversationId, run.onDelta);
  applyOutcome(outcome, run.message, run.update);
}

function createConversationId(): string {
  return `c-${String(Date.now())}-${Math.random().toString(36).slice(2, 10)}`;
}

export function useChatTurn(options: { readonly submit: Submit }): ChatTurn {
  const [entries, setEntries] = useState<ThreadEntry[]>([]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [notice, setNotice] = useState<NoticeProps | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const [conversationId] = useState(createConversationId);

  const update: ThreadUpdates = {
    append: (added) => {
      setEntries((previous) => [...previous, ...added]);
    },
    clearDraft: () => {
      setDraft('');
    },
    setNotice,
    setAnnouncement,
  };

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const message = draft.trim();
    if (message === '' || busy) return;

    setBusy(true);
    setNotice(null);
    setAnnouncement('');
    setStreamingText('');

    try {
      await runTurn({
        submit: options.submit,
        message,
        conversationId,
        onDelta: (text) => {
          setStreamingText((previous) => previous + text);
        },
        update,
      });
    } finally {
      setBusy(false);
      setStreamingText('');
    }
  }

  return {
    entries,
    draft,
    busy,
    streamingText,
    notice,
    announcement,
    statusText: STATUS_SEARCHING,
    setDraft,
    handleSubmit,
  };
}
