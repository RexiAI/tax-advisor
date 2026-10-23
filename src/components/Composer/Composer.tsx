import { ArrowUp } from '@phosphor-icons/react';
import type { FormEvent } from 'react';

import {
  COMPOSER_HELPER,
  COMPOSER_LABEL,
  COMPOSER_PLACEHOLDER,
  COMPOSER_SUBMIT_LABEL,
  PRIVACY_WARNING,
} from '@/content/strings';

import styles from './Composer.module.css';

/** Show the counter only when the message is within 10% of the cap. */
function counterVisibleFrom(maxChars: number): number {
  return Math.max(1, Math.round(maxChars * 0.9));
}

export interface ComposerProps {
  readonly value: string;
  readonly maxChars: number;
  readonly busy: boolean;
  readonly onChange: (value: string) => void;
  readonly onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

export function Composer({ value, maxChars, busy, onChange, onSubmit }: ComposerProps) {
  return (
    <form className={styles.form} onSubmit={onSubmit}>
      <p className={styles.privacy}>{PRIVACY_WARNING}</p>
      <label className={styles.label} htmlFor="composer-input">
        {COMPOSER_LABEL}
      </label>
      <p className={styles.helper}>{COMPOSER_HELPER}</p>
      <div className={styles.inputRow}>
        <textarea
          id="composer-input"
          className={styles.input}
          name="message"
          rows={2}
          value={value}
          placeholder={COMPOSER_PLACEHOLDER}
          onChange={(event) => {
            onChange(event.target.value);
          }}
          onKeyDown={(event) => {
            if (event.key !== 'Enter' || event.shiftKey) return;
            event.preventDefault();
            event.currentTarget.form?.requestSubmit();
          }}
        />
        <button type="submit" className={styles.submit} disabled={busy} aria-busy={busy}>
          <span>{COMPOSER_SUBMIT_LABEL}</span>
          <ArrowUp aria-hidden="true" size={18} />
        </button>
      </div>
      {value.length > counterVisibleFrom(maxChars) ? (
        <p className={styles.counter}>
          {value.length} / {maxChars}
        </p>
      ) : null}
    </form>
  );
}
