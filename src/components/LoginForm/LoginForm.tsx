'use client';

import { useState, type FormEvent } from 'react';

import { AI_DISCLOSURE, APP_NAME } from '@/content/strings';

import styles from './LoginForm.module.css';

export interface LoginFormProps {
  readonly nextPath: string;
}

interface ErrorBody {
  readonly message?: string;
}

export function LoginForm({ nextPath }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setBusy(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (response.ok) {
        window.location.assign(nextPath);
        return;
      }
      const body = (await response.json().catch(() => ({}))) as ErrorBody;
      setError(body.message ?? 'No se pudo iniciar sesión.');
    } catch {
      setError('No se pudo conectar. Vuelve a intentarlo.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <p className={styles.eyebrow}>Acceso privado</p>
      <h1 className={styles.title}>{APP_NAME}</h1>
      <p className={styles.intro}>
        Introduce el email y la contraseña configurados para usar el asesor fiscal.
      </p>

      <label className={styles.label} htmlFor="login-email">
        Email
      </label>
      <input
        id="login-email"
        className={styles.input}
        type="email"
        name="email"
        autoComplete="username"
        required
        value={email}
        onChange={(event) => {
          setEmail(event.target.value);
        }}
      />

      <label className={styles.label} htmlFor="login-password">
        Contraseña
      </label>
      <input
        id="login-password"
        className={styles.input}
        type="password"
        name="password"
        autoComplete="current-password"
        required
        value={password}
        onChange={(event) => {
          setPassword(event.target.value);
        }}
      />

      {error === '' ? null : (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}

      <button className={styles.submit} type="submit" disabled={busy} aria-busy={busy}>
        {busy ? 'Entrando…' : 'Entrar'}
      </button>

      <p className={styles.disclaimer}>{AI_DISCLOSURE}</p>
    </form>
  );
}
