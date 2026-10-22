import type { ReactNode } from 'react';

import styles from './AnswerSection.module.css';

export interface AnswerSectionProps {
  readonly heading: string;
  readonly children: ReactNode;
}

export function AnswerSection({ heading, children }: AnswerSectionProps) {
  return (
    <section className={styles.section}>
      <h2 className={styles.heading}>{heading}</h2>
      {children}
    </section>
  );
}
