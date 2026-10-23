'use client';

import { useState } from 'react';

import styles from './LogoutButton.module.css';

export function LogoutButton() {
  const [busy, setBusy] = useState(false);

  async function handleLogout(): Promise<void> {
    setBusy(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      window.location.assign('/login');
    }
  }

  return (
    <button className={styles.button} type="button" onClick={handleLogout} disabled={busy}>
      {busy ? 'Saliendo…' : 'Salir'}
    </button>
  );
}
