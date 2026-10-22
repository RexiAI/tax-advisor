'use client';

import { Composer } from '@/components/Composer';
import { ExampleQuestions } from '@/components/ExampleQuestions';
import { Header } from '@/components/Header';
import { Notice } from '@/components/Notice';
import { StatusLine } from '@/components/StatusLine';
import { Thread, type ThreadEntry } from '@/components/Thread';
import { EMPTY_STATE_EXAMPLES, SKIP_LINK_LABEL } from '@/content/strings';

import { submitQuestion, type Submit } from './chat-submit';
import styles from './ChatScreen.module.css';
import { useChatTurn } from './use-chat-turn';

export interface CorpusMetadata {
  readonly taxYear: number;
  readonly generatedAt: string;
}

export interface ChatScreenProps {
  readonly corpus: CorpusMetadata;
  readonly maxChars: number;
  /** Injected in tests; defaults to the real streaming client. */
  readonly submit?: Submit;
}

/** Empty state or the thread; one place decides which. */
function MainContent({
  entries,
  onSelectExample,
}: {
  readonly entries: readonly ThreadEntry[];
  readonly onSelectExample: (question: string) => void;
}) {
  if (entries.length === 0) {
    return <ExampleQuestions questions={EMPTY_STATE_EXAMPLES} onSelect={onSelectExample} />;
  }
  return <Thread entries={entries} />;
}

export function ChatScreen({ corpus, maxChars, submit = submitQuestion }: ChatScreenProps) {
  const turn = useChatTurn({ submit });

  return (
    <div className={styles.screen}>
      <a className={styles.skipLink} href="#respuesta">
        {SKIP_LINK_LABEL}
      </a>

      <Header taxYear={corpus.taxYear} generatedAt={corpus.generatedAt} />

      <main id="respuesta" className={styles.main}>
        <MainContent entries={turn.entries} onSelectExample={turn.setDraft} />

        {turn.busy ? (
          <div className={styles.pending}>
            <StatusLine text={turn.statusText} />
          </div>
        ) : null}

        {/*
         * The live region always exists so content inserted into it is announced:
         * a region created together with its content is not. It holds the
         * streaming text only, never the sources block.
         */}
        <div className={styles.liveRegion} aria-live="polite" aria-atomic="false">
          {turn.streamingText === '' ? null : (
            <p className={styles.streaming}>{turn.streamingText}</p>
          )}
        </div>
      </main>

      <div className={styles.dock}>
        {turn.notice === null ? null : <Notice {...turn.notice} />}
        <Composer
          value={turn.draft}
          maxChars={maxChars}
          busy={turn.busy}
          onChange={turn.setDraft}
          onSubmit={turn.handleSubmit}
        />
      </div>
    </div>
  );
}
