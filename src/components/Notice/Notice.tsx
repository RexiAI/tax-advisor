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
  readonly items?: readonly string[];
  readonly links?: readonly NoticeAction[];
  readonly action?: NoticeAction;
  readonly footer?: string;
}

const TONE_CLASS: Readonly<Record<NoticeTone, string>> = {
  info: styles.info ?? '',
  warning: styles.warning ?? '',
  error: styles.error ?? '',
};

export function Notice({ tone, title, body, items, links, action, footer }: NoticeProps) {
  return (
    <aside className={`${styles.notice} ${TONE_CLASS[tone]}`}>
      {title === undefined ? null : <h2 className={styles.title}>{title}</h2>}
      <p className={styles.body}>{body}</p>
      {items === undefined ? null : (
        <ol className={styles.list}>
          {items.map((item) => (
            <li key={item} className={styles.listItem}>
              {item}
            </li>
          ))}
        </ol>
      )}
      {links === undefined ? null : (
        <ul className={styles.links}>
          {links.map((link) => (
            <li key={link.href}>
              <a className={styles.action} href={link.href}>
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      )}
      {action === undefined ? null : (
        <a className={styles.action} href={action.href}>
          {action.label}
        </a>
      )}
      {footer === undefined ? null : <p className={styles.footer}>{footer}</p>}
    </aside>
  );
}
