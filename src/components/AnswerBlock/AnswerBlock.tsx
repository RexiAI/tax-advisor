import styles from './AnswerBlock.module.css';
import { AnswerSection } from '@/components/AnswerSection';
import { Notice } from '@/components/Notice';
import { SourcesList } from '@/components/SourcesList';
import {
  ANSWER_EXAMPLE_HEADING,
  ANSWER_RULE_HEADING,
  ANSWER_SUMMARY_HEADING,
} from '@/content/strings';
import type { AnswerResponse } from '@/service/types';

export interface AnswerBlockProps {
  readonly response: AnswerResponse;
}

/**
 * The answer is a document, not a message bubble: summary, rule, optional worked
 * example, then the sources block and the disclaimer footer.
 */
export function AnswerBlock({ response }: AnswerBlockProps) {
  return (
    <article className={styles.answer}>
      {response.yearNotice === undefined ? null : <Notice tone="info" body={response.yearNotice} />}

      <div className={styles.body} aria-live="polite" aria-atomic="false">
        <AnswerSection heading={ANSWER_SUMMARY_HEADING}>
          <p className={styles.paragraph}>{response.explanation}</p>
        </AnswerSection>
        <AnswerSection heading={ANSWER_RULE_HEADING}>
          <p className={styles.paragraph}>{response.rule}</p>
        </AnswerSection>
        {response.workedExample === undefined ? null : (
          <AnswerSection heading={ANSWER_EXAMPLE_HEADING}>
            <p className={styles.paragraph}>{response.workedExample}</p>
          </AnswerSection>
        )}
      </div>

      <SourcesList citations={response.citations} />

      <p className={styles.disclaimer}>{response.disclaimer}</p>
    </article>
  );
}
