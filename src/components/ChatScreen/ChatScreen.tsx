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
import { useChatTurn, type ChatTurn } from './use-chat-turn';

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

/**
 * The growing answer's live region. It always exists so content inserted into it
 * is announced: a region created together with its content is not. It holds the
 * streaming text only, never the sources block.
 */
function StreamingRegion({ text }: { readonly text: string }) {
  return (
    <div className={styles.liveRegion} aria-live="polite" aria-atomic="false">
      {text === '' ? null : <p className={styles.streaming}>{text}</p>}
    </div>
  );
}

/**
 * A refusal or an abstention is appended silently otherwise: the region has to
 * exist before the text arrives to be announced at all. It carries text only —
 * rendering the Notice here would read it twice.
 */
function Announcer({ text }: { readonly text: string }) {
  return (
    <div className={styles.announcer} aria-live="polite" aria-atomic="true">
      {text}
    </div>
  );
}

/** Everything the turn says before it becomes an entry: status, stream, announcement. */
function TurnFeedback({ turn }: { readonly turn: ChatTurn }) {
  return (
    <>
      {turn.busy ? (
        <div className={styles.pending}>
          <StatusLine text={turn.statusText} />
        </div>
      ) : null}
      <StreamingRegion text={turn.streamingText} />
      <Announcer text={turn.announcement} />
    </>
  );
}

/** The input surface: the turn-level notice, then the composer. */
function Dock({ turn, maxChars }: { readonly turn: ChatTurn; readonly maxChars: number }) {
  return (
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
  );
}

/** First tab stop: jumps past the header straight to the answer region. */
function SkipLink() {
  return (
    <a className={styles.skipLink} href="#respuesta">
      {SKIP_LINK_LABEL}
    </a>
  );
}

export function ChatScreen({ corpus, maxChars, submit = submitQuestion }: ChatScreenProps) {
  const turn = useChatTurn({ submit });

  return (
    <div className={styles.screen}>
      <SkipLink />

      <Header taxYear={corpus.taxYear} generatedAt={corpus.generatedAt} />

      <main id="respuesta" className={styles.main}>
        <MainContent entries={turn.entries} onSelectExample={turn.setDraft} />
        <TurnFeedback turn={turn} />
      </main>

      <Dock turn={turn} maxChars={maxChars} />
    </div>
  );
}
