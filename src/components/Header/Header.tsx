import { LogoutButton } from '@/components/LogoutButton';
import { formatSpanishDate } from '@/content/format';
import { AI_DISCLOSURE, APP_NAME, CORPUS_FRESHNESS_LABEL, TAX_YEAR_LABEL } from '@/content/strings';

import styles from './Header.module.css';

export interface HeaderProps {
  /** Corpus tax year, read from the artifact metadata. */
  readonly taxYear: number;
  /** Corpus `generatedAt`, read from the artifact metadata. */
  readonly generatedAt: string;
}

export function Header({ taxYear, generatedAt }: HeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.top}>
        <h1 className={styles.title}>{APP_NAME}</h1>
        <LogoutButton />
      </div>
      <p className={styles.freshness}>
        <span className={styles.metadata}>
          {TAX_YEAR_LABEL}: {taxYear}
        </span>
        {generatedAt === '' ? null : (
          <span className={styles.metadata}>
            {CORPUS_FRESHNESS_LABEL}:{' '}
            <time dateTime={generatedAt}>{formatSpanishDate(generatedAt)}</time>
          </span>
        )}
      </p>
      <p className={styles.disclosure}>{AI_DISCLOSURE}</p>
    </header>
  );
}
