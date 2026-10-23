import { NextResponse } from 'next/server';

import { emailsMatch, passwordsMatch } from '@/auth/password';
import { SESSION_COOKIE, signSession } from '@/auth/session';
import type { AuthConfigResult } from '@/config/env';
import type { RateLimiter } from '@/service/rate-limit';

interface LoginBody {
  readonly email?: unknown;
  readonly password?: unknown;
}

export interface LoginDeps {
  readonly loadAuthConfig: () => AuthConfigResult;
  readonly limiter: RateLimiter;
  readonly now: () => number;
}

function clientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded !== null && forwarded !== '') return forwarded.split(',')[0]?.trim() ?? 'unknown';
  return request.headers.get('x-real-ip') ?? 'unknown';
}

function errorResponse(
  errorCode: string,
  message: string,
  status: number,
  headers: Record<string, string> = {}
): NextResponse {
  return NextResponse.json({ ok: false, errorCode, message }, { status, headers });
}

function parseBody(value: unknown): { email: string; password: string } | null {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return null;
  const body = value as LoginBody;
  if (typeof body.email !== 'string' || typeof body.password !== 'string') return null;
  return { email: body.email, password: body.password };
}

async function readBody(request: Request): Promise<{ email: string; password: string } | null> {
  try {
    return parseBody(await request.json());
  } catch {
    return null;
  }
}

export function createLoginHandler(deps: LoginDeps): (request: Request) => Promise<NextResponse> {
  return async function handleLogin(request: Request): Promise<NextResponse> {
    const now = deps.now();
    const limit = deps.limiter.check(clientIp(request), now);
    if (!limit.allowed) {
      return errorResponse(
        'rate_limited',
        'Demasiados intentos. Espera unos minutos.',
        429,
        { 'retry-after': String(limit.retryAfterSeconds) }
      );
    }

    const auth = deps.loadAuthConfig();
    if (!auth.ok) {
      return errorResponse('missing_auth_config', 'El acceso no está configurado.', 503);
    }

    const body = await readBody(request);
    if (body === null) {
      return errorResponse('invalid_request', 'Faltan el email o la contraseña.', 400);
    }

    const allowed =
      emailsMatch(body.email, auth.config.allowedEmail) &&
      passwordsMatch(body.password, auth.config.password);
    if (!allowed) {
      return errorResponse('unauthorized', 'Email o contraseña incorrectos.', 401);
    }

    const token = await signSession(
      auth.config.allowedEmail,
      auth.config.secret,
      auth.config.sessionTtlSeconds,
      now
    );
    const response = NextResponse.json({ ok: true });
    response.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: auth.config.secureCookies,
      path: '/',
      maxAge: auth.config.sessionTtlSeconds,
    });
    return response;
  };
}
