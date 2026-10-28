import { ArrowSquareOut } from '@phosphor-icons/react';

import { formatSpanishDate } from '@/content/format';
import { SOURCE_UPDATED_LABEL, sourceLinkAriaLabel, sourceLinkLabel } from '@/content/strings';
import type { Citation } from '@/domain/citation';
import { jurisdictionDisplayName, publisherCode } from '@/domain/source';

import styles from './SourceEntry.module.css';

export interface SourceEntryProps {
  readonly citation: Citation;
}

/**
 * One citation, showing whose rules it is, who publishes them, where to read them
 * and which version. Three facts stay separate on purpose: the jurisdiction and
 * the issuing publisher are metadata, while the link label names the host that
 * serves the consolidated text (`authorityUsed`) — a Madrid norm can name the BOCM
 * as its publisher and the BOE as the page the link opens.
 *
 * The jurisdiction and publisher tokens are rendered unconditionally, including
 * for `state`: suppressing them would make the entry shape depend on data and
 * teach readers that the fields only appear for "special" sources.
 */
export function SourceEntry({ citation }: SourceEntryProps) {
  const linkLabel = `${sourceLinkAriaLabel(citation.authorityUsed)}: ${citation.normTitle}, ${citation.articleLabel}`;
  return (
    <li className={styles.entry}>
      <p className={styles.label}>{citation.articleLabel}</p>
      <p className={styles.norm}>{citation.normTitle}</p>
      <p className={styles.meta}>
        <span className={styles.metaItem}>{jurisdictionDisplayName(citation.jurisdiction)}</span>
        <span className={styles.metaItem}>{publisherCode(citation.publisher)}</span>
        <a className={styles.link} href={citation.sourceUrl} target="_blank" rel="noopener noreferrer" aria-label={linkLabel}>
          <span>{sourceLinkLabel(citation.authorityUsed)}</span>
          <ArrowSquareOut aria-hidden="true" size={16} />
        </a>
        <time className={styles.metaItem} dateTime={citation.updatedAt}>{SOURCE_UPDATED_LABEL} {formatSpanishDate(citation.updatedAt)}</time>
      </p>
    </li>
  );
}
