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

/** The numbered procedure a guide carries; absent for every other notice. */
function NoticeItems({ items }: { readonly items?: readonly string[] }) {
  if (items === undefined) return null;
  return (
    <ol className={styles.list}>
      {items.map((item) => (
        <li key={item} className={styles.listItem}>
          {item}
        </li>
      ))}
    </ol>
  );
}

/**
 * Only the guide's link list leaves the product: an AEAT page in the same tab
 * replaces the conversation. The handoff is a `mailto:` and a new tab there is
 * pointless, so it keeps neither attribute.
 */
function externalLinkAttributes(href: string): { target?: string; rel?: string } {
  if (!href.startsWith('http://') && !href.startsWith('https://')) return {};
  return { target: '_blank', rel: 'noopener noreferrer' };
}

function NoticeLinks({ links }: { readonly links?: readonly NoticeAction[] }) {
  if (links === undefined) return null;
  return (
    <ul className={styles.links}>
      {links.map((link) => (
        <li key={link.href}>
          <a className={styles.action} href={link.href} {...externalLinkAttributes(link.href)}>
            {link.label}
          </a>
        </li>
      ))}
    </ul>
  );
}

export function Notice(props: NoticeProps) {
  const { tone, title, body, items, links, action, footer } = props;
  return (
    <aside className={`${styles.notice} ${TONE_CLASS[tone]}`}>
      {title === undefined ? null : <h2 className={styles.title}>{title}</h2>}
      <p className={styles.body}>{body}</p>
      <NoticeItems items={items} />
      <NoticeLinks links={links} />
      {action === undefined ? null : (
        <a className={styles.action} href={action.href}>
          {action.label}
        </a>
      )}
      {footer === undefined ? null : <p className={styles.footer}>{footer}</p>}
    </aside>
  );
}
