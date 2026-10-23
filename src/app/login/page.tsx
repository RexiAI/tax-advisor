import { LoginForm } from '@/components/LoginForm';

import styles from './page.module.css';

export interface LoginPageProps {
  readonly searchParams: Promise<{ readonly next?: string | string[] }>;
}

function safeNext(value: string | string[] | undefined): string {
  const candidate = Array.isArray(value) ? value[0] : value;
  if (candidate === undefined || !candidate.startsWith('/') || candidate.startsWith('//')) return '/';
  return candidate;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  return (
    <main className={styles.main}>
      <LoginForm nextPath={safeNext(params.next)} />
    </main>
  );
}
