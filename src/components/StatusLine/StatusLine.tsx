import styles from './StatusLine.module.css';

export interface StatusLineProps {
  readonly text: string;
}

export function StatusLine({ text }: StatusLineProps) {
  return (
    <p className={styles.status} role="status">
      {text}
    </p>
  );
}
