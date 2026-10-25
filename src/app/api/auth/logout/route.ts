import { NextResponse } from 'next/server';

import { SESSION_COOKIE } from '@/auth/session';

export function POST(): NextResponse {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return response;
}
