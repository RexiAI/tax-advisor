import { NextResponse, type NextRequest } from 'next/server';

import { SESSION_COOKIE, verifySession } from '@/auth/session';
import { loadAuthConfig } from '@/config/env';

const PUBLIC_PATHS = new Set(['/login', '/api/auth/login', '/api/auth/logout', '/health']);

function deny(request: NextRequest, errorCode: 'unauthorized' | 'missing_auth_config'): NextResponse {
  if (request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.json(
      {
        kind: 'error',
        errorCode,
        message:
          errorCode === 'unauthorized'
            ? 'Tu sesión ha caducado. Vuelve a entrar.'
            : 'El acceso no está configurado en este momento.',
      },
      { status: errorCode === 'unauthorized' ? 401 : 503 }
    );
  }
  const url = request.nextUrl.clone();
  url.pathname = '/login';
  url.search = '';
  url.searchParams.set('next', request.nextUrl.pathname);
  return NextResponse.redirect(url);
}

type AuthOutcome = 'ok' | 'unauthorized' | 'missing_auth_config';

async function authorize(request: NextRequest): Promise<AuthOutcome> {
  const config = loadAuthConfig();
  if (!config.ok) return 'missing_auth_config';

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (token === undefined) return 'unauthorized';

  const session = await verifySession(token, config.config.secret);
  return session?.sub === config.config.allowedEmail ? 'ok' : 'unauthorized';
}

export async function middleware(request: NextRequest): Promise<NextResponse> {
  if (PUBLIC_PATHS.has(request.nextUrl.pathname)) return NextResponse.next();

  const outcome = await authorize(request);
  return outcome === 'ok' ? NextResponse.next() : deny(request, outcome);
}

export const config = {
  matcher: ['/((?!_next|favicon.ico).*)'],
};
