import styles from './AnswerBlock.module.css';
import { AnswerSection } from '@/components/AnswerSection';
import { Notice } from '@/components/Notice';
import { SourcesList } from '@/components/SourcesList';
import {
  ANSWER_EXAMPLE_HEADING,
  ANSWER_RULE_HEADING,
  ANSWER_SUMMARY_HEADING,
  IBI_BOUNDARY_TITLE,
  YEAR_NOTICE_TITLE,
} from '@/content/strings';
import type { AnswerResponse } from '@/service/types';

export interface AnswerBlockProps {
  readonly response: AnswerResponse;
}

/** One headed paragraph: the shape every part of the answer's prose takes. */
function Prose({ heading, text }: { readonly heading: string; readonly text: string }) {
  return (
    <AnswerSection heading={heading}>
      <p className={styles.paragraph}>{text}</p>
    </AnswerSection>
  );
}

/** Summary, rule and the optional worked example — the answer's prose body. */
function AnswerBody({ response }: AnswerBlockProps) {
  return (
    <div className={styles.body} aria-live="polite" aria-atomic="false">
      <Prose heading={ANSWER_SUMMARY_HEADING} text={response.explanation} />
      {response.rule === response.explanation ? null : (
        <Prose heading={ANSWER_RULE_HEADING} text={response.rule} />
      )}
      {response.workedExample === undefined ? null : (
        <Prose heading={ANSWER_EXAMPLE_HEADING} text={response.workedExample} />
      )}
    </div>
  );
}

/** AI disclosure, then the reinforced scope line when the norms are not IRPF. */
function AnswerDisclaimers({ response }: AnswerBlockProps) {
  return (
    <>
      <p className={styles.disclaimer}>{response.disclaimer}</p>
      {response.scopeDisclaimer === undefined ? null : (
        <p className={styles.disclaimer}>{response.scopeDisclaimer}</p>
      )}
    </>
  );
}

/**
 * The answer is a document, not a message bubble: summary, rule, optional worked
 * example, then the qualifiers — the boundary note when the question mentioned a
 * tax the corpus cannot ground, then the year notice next to the evidence it
 * explains — then the sources block and the footer (AI disclosure, the reinforced
 * scope line when the answer leans on a non-IRPF norm). Both qualifiers are
 * siblings: neither replaces nor absorbs the other.
 */
export function AnswerBlock({ response }: AnswerBlockProps) {
  return (
    <article className={styles.answer}>
      <AnswerBody response={response} />

      {response.boundaryNote === undefined ? null : (
        <Notice tone="info" title={IBI_BOUNDARY_TITLE} body={response.boundaryNote} />
      )}

      {response.yearNotice === undefined ? null : (
        <Notice tone="info" title={YEAR_NOTICE_TITLE} body={response.yearNotice} />
      )}

      <SourcesList citations={response.citations} />

      <AnswerDisclaimers response={response} />
    </article>
  );
}
