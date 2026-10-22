import styles from './Notice.module.css';

export type NoticeTone = 'info' | 'warning' | 'error';

export interface NoticeAction {
  readonly href: string;
  readonly label: string;
}

export interface NoticeProps {
  readonly tone: NoticeTone;
  readonly title?: string;
  readonly body: string;
  readonly action?: NoticeAction;
  readonly footer?: string;
}

const TONE_CLASS: Readonly<Record<NoticeTone, string>> = {
  info: styles.info ?? '',
  warning: styles.warning ?? '',
  error: styles.error ?? '',
};

export function Notice({ tone, title, body, action, footer }: NoticeProps) {
  return (
    <aside className={`${styles.notice} ${TONE_CLASS[tone]}`}>
      {title === undefined ? null : <h2 className={styles.title}>{title}</h2>}
      <p className={styles.body}>{body}</p>
      {action === undefined ? null : (
        <a className={styles.action} href={action.href}>
          {action.label}
        </a>
      )}
      {footer === undefined ? null : <p className={styles.footer}>{footer}</p>}
    </aside>
  );
}
