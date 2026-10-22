import { AnswerBlock } from '@/components/AnswerBlock';
import { Notice, type NoticeProps } from '@/components/Notice';
import { UserTurn } from '@/components/UserTurn';
import { COMPOSER_THREAD_HEADING } from '@/content/strings';
import type { AnswerResponse } from '@/service/types';

import styles from './Thread.module.css';

export type ThreadEntry =
  | { readonly id: string; readonly kind: 'user'; readonly text: string }
  | { readonly id: string; readonly kind: 'answer'; readonly response: AnswerResponse }
  | { readonly id: string; readonly kind: 'notice'; readonly notice: NoticeProps };

export interface ThreadProps {
  readonly entries: readonly ThreadEntry[];
}

function renderEntry(entry: ThreadEntry) {
  if (entry.kind === 'user') return <UserTurn key={entry.id} text={entry.text} />;
  if (entry.kind === 'answer') return <AnswerBlock key={entry.id} response={entry.response} />;
  return <Notice key={entry.id} {...entry.notice} />;
}

export function Thread({ entries }: ThreadProps) {
  return (
    <section className={styles.thread} aria-labelledby="thread-heading">
      <h2 id="thread-heading" className={styles.heading}>
        {COMPOSER_THREAD_HEADING}
      </h2>
      <div className={styles.entries}>{entries.map(renderEntry)}</div>
    </section>
  );
}
