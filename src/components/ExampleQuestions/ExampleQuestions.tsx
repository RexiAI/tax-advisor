import { EMPTY_STATE_HEADING } from '@/content/strings';

import styles from './ExampleQuestions.module.css';

export interface ExampleQuestionsProps {
  readonly questions: readonly string[];
  readonly onSelect: (question: string) => void;
}

/**
 * Empty-state affordance: asks what the user wants to know and offers example
 * questions as buttons that fill the composer without submitting it.
 */
export function ExampleQuestions({ questions, onSelect }: ExampleQuestionsProps) {
  return (
    <div className={styles.examples}>
      <h2 className={styles.heading}>{EMPTY_STATE_HEADING}</h2>
      <ul className={styles.list}>
        {questions.map((question) => (
          <li key={question}>
            <button
              type="button"
              className={styles.example}
              onClick={() => {
                onSelect(question);
              }}
            >
              {question}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
