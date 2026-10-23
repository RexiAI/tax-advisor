import { AnswerSection } from '@/components/AnswerSection';
import { SourceEntry } from '@/components/SourceEntry';
import { CONSOLIDATED_TEXT_NOTICE, SOURCES_TITLE } from '@/content/strings';
import type { Citation } from '@/domain/citation';

import styles from './SourcesList.module.css';

export interface SourcesListProps {
  readonly citations: readonly Citation[];
}

/** One entry per passage, first appearance order, deduplicated by `passageId`. */
function uniqueCitations(citations: readonly Citation[]): Citation[] {
  const seen = new Set<string>();
  const unique: Citation[] = [];
  for (const citation of citations) {
    if (seen.has(citation.passageId)) continue;
    seen.add(citation.passageId);
    unique.push(citation);
  }
  return unique;
}

export function SourcesList({ citations }: SourcesListProps) {
  const entries = uniqueCitations(citations);
  if (entries.length === 0) return null;

  return (
    <div className={styles.sources}>
      <AnswerSection heading={`${SOURCES_TITLE} (${entries.length})`}>
        <ul className={styles.list}>
          {entries.map((citation) => (
            <SourceEntry key={citation.passageId} citation={citation} />
          ))}
        </ul>
        <p className={styles.notice}>{CONSOLIDATED_TEXT_NOTICE}</p>
      </AnswerSection>
    </div>
  );
}
