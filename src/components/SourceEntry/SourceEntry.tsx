import { ArrowSquareOut } from '@phosphor-icons/react';

import { formatSpanishDate } from '@/content/format';
import {
  SOURCE_LINK_ARIA_PREFIX,
  SOURCE_LINK_LABEL,
  SOURCE_UPDATED_LABEL,
} from '@/content/strings';
import type { Citation } from '@/domain/citation';

import styles from './SourceEntry.module.css';

export interface SourceEntryProps {
  readonly citation: Citation;
}

export function SourceEntry({ citation }: SourceEntryProps) {
  const linkLabel = `${SOURCE_LINK_ARIA_PREFIX}: ${citation.normTitle}, ${citation.articleLabel}`;

  return (
    <li className={styles.entry}>
      <p className={styles.label}>{citation.articleLabel}</p>
      <p className={styles.norm}>{citation.normTitle}</p>
      <p className={styles.meta}>
        <a
          className={styles.link}
          href={citation.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={linkLabel}
        >
          <span>{SOURCE_LINK_LABEL}</span>
          <ArrowSquareOut aria-hidden="true" size={16} />
        </a>
        <span className={styles.date}>
          {SOURCE_UPDATED_LABEL} {formatSpanishDate(citation.boeUpdatedAt)}
        </span>
      </p>
    </li>
  );
}
