import { NextRequest } from 'next/server';
import { describe, expect, it } from 'vitest';

import { emailsMatch, passwordsMatch } from '@/auth/password';
import { SESSION_COOKIE, signSession, verifySession } from '@/auth/session';
import { createLoginHandler } from '@/auth/login-handler';
import { loadAuthConfig, type AuthConfig } from '@/config/env';
import { middleware } from '@/middleware';
import { createRateLimiter } from '@/service/rate-limit';

const AUTH: AuthConfig = {
  allowedEmail: 'danielbueno76@gmail.com',
  password: 'correct horse battery staple',
  secret: 'test-secret-at-least-32-characters-long',
  sessionTtlSeconds: 3600,
  secureCookies: false,
};

process.env.AUTH_ALLOWED_EMAIL = AUTH.allowedEmail;
process.env.AUTH_PASSWORD = AUTH.password;
process.env.AUTH_SECRET = AUTH.secret;

function loginHandler() {
  return createLoginHandler({
    loadAuthConfig: () => ({ ok: true, config: AUTH }),
    limiter: createRateLimiter({ max: 5, windowMs: 60_000 }),
    now: () => 1_700_000_000_000,
  });
}

function loginRequest(email: string, password: string): Request {
  return new Request('http://localhost/api/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': '203.0.113.9' },
    body: JSON.stringify({ email, password }),
  });
}

describe('session tokens', () => {
  it('round-trips an allowed email', async () => {
    const token = await signSession(AUTH.allowedEmail, AUTH.secret, 60, 1_700_000_000_000);
    await expect(verifySession(token, AUTH.secret, 1_700_000_001_000)).resolves.toEqual({
      sub: AUTH.allowedEmail,
      exp: 1_700_000_060,
    });
  });

  it('rejects a tampered token, a wrong secret and an expired token', async () => {
    const token = await signSession(AUTH.allowedEmail, AUTH.secret, 60, 1_700_000_000_000);
    await expect(verifySession(`${token}x`, AUTH.secret, 1_700_000_001_000)).resolves.toBeNull();
    await expect(verifySession(token, 'another-secret', 1_700_000_001_000)).resolves.toBeNull();
    await expect(verifySession(token, AUTH.secret, 1_700_000_061_000)).resolves.toBeNull();
  });
});

describe('credential comparison', () => {
  it('matches the configured email and password only', () => {
    expect(emailsMatch(' DanielBueno76@Gmail.com ', AUTH.allowedEmail)).toBe(true);
    expect(emailsMatch('other@example.com', AUTH.allowedEmail)).toBe(false);
    expect(passwordsMatch(AUTH.password, AUTH.password)).toBe(true);
    expect(passwordsMatch('wrong', AUTH.password)).toBe(false);
    expect(passwordsMatch('', '')).toBe(false);
  });
});

describe('POST /api/auth/login', () => {
  it('sets an HttpOnly session cookie for the allowed email and password', async () => {
    const response = await loginHandler()(loginRequest(AUTH.allowedEmail, AUTH.password));
    expect(response.status).toBe(200);

    const cookie = response.headers.get('set-cookie') ?? '';
    expect(cookie).toContain(`${SESSION_COOKIE}=`);
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('SameSite=lax');
    expect(cookie).not.toContain('Secure');
  });

  it('rejects a wrong email or password with the same 401', async () => {
    const wrongEmail = await loginHandler()(
      loginRequest('other@example.com', AUTH.password)
    );
    const wrongPassword = await loginHandler()(
      loginRequest(AUTH.allowedEmail, 'wrong')
    );
    expect(wrongEmail.status).toBe(401);
    expect(wrongPassword.status).toBe(401);
    expect(wrongEmail.headers.get('set-cookie')).toBeNull();
  });

  it('fails closed when auth configuration is missing', async () => {
    const handler = createLoginHandler({
      loadAuthConfig: () => ({ ok: false, error: 'missing_auth_config', missing: ['AUTH_PASSWORD'] }),
      limiter: createRateLimiter({ max: 5, windowMs: 60_000 }),
      now: () => 1_700_000_000_000,
    });
    const response = await handler(loginRequest(AUTH.allowedEmail, AUTH.password));
    expect(response.status).toBe(503);
  });

  it('rate-limits repeated attempts', async () => {
    const handler = createLoginHandler({
      loadAuthConfig: () => ({ ok: true, config: AUTH }),
      limiter: createRateLimiter({ max: 1, windowMs: 60_000 }),
      now: () => 1_700_000_000_000,
    });
    await handler(loginRequest(AUTH.allowedEmail, 'wrong'));
    const blocked = await handler(loginRequest(AUTH.allowedEmail, AUTH.password));
    expect(blocked.status).toBe(429);
    expect(blocked.headers.get('retry-after')).toBeDefined();
  });
});

describe('middleware', () => {
  it('redirects an unauthenticated page request to /login', async () => {
    const response = await middleware(new NextRequest('http://localhost/'));
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toContain('/login');
  });

  it('returns 401 JSON for an unauthenticated API request', async () => {
    const response = await middleware(new NextRequest('http://localhost/api/chat'));
    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({ errorCode: 'unauthorized' });
  });

  it('lets a valid session through and keeps /health public', async () => {
    const token = await signSession(AUTH.allowedEmail, AUTH.secret, 60);
    const authenticated = await middleware(
      new NextRequest('http://localhost/', { headers: { cookie: `${SESSION_COOKIE}=${token}` } })
    );
    expect(authenticated.status).toBe(200);

    const health = await middleware(new NextRequest('http://localhost/health'));
    expect(health.status).toBe(200);
  });
});

describe('loadAuthConfig', () => {
  it('reports every missing auth variable', () => {
    const saved = { ...process.env };
    delete process.env.AUTH_ALLOWED_EMAIL;
    delete process.env.AUTH_PASSWORD;
    delete process.env.AUTH_SECRET;
    try {
      expect(loadAuthConfig()).toMatchObject({
        ok: false,
        missing: ['AUTH_ALLOWED_EMAIL', 'AUTH_PASSWORD', 'AUTH_SECRET'],
      });
    } finally {
      process.env = saved;
    }
  });
});
