import styles from './UserTurn.module.css';

export interface UserTurnProps {
  readonly text: string;
}

export function UserTurn({ text }: UserTurnProps) {
  return (
    <div className={styles.turn}>
      <p className={styles.text}>{text}</p>
    </div>
  );
}
