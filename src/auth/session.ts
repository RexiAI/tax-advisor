/**
 * Stateless session tokens: `base64url(payload).base64url(HMAC-SHA256)`.
 * Web Crypto only, so the same code runs in Node route handlers and Edge
 * middleware. The payload carries the allowed email and an expiry.
 */

const encoder = new TextEncoder();
const decoder = new TextDecoder();

export const SESSION_COOKIE = 'rc_session';

export interface Session {
  readonly sub: string;
  readonly exp: number;
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(value: string): Uint8Array {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=');
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

export async function signSession(
  email: string,
  secret: string,
  ttlSeconds: number,
  nowMs: number = Date.now()
): Promise<string> {
  const payload: Session = { sub: email, exp: Math.floor(nowMs / 1000) + ttlSeconds };
  const encoded = toBase64Url(encoder.encode(JSON.stringify(payload)));
  const signature = new Uint8Array(
    await crypto.subtle.sign('HMAC', await hmacKey(secret), encoder.encode(encoded))
  );
  return `${encoded}.${toBase64Url(signature)}`;
}

function isSession(value: unknown): value is Session {
  if (value === null || typeof value !== 'object') return false;
  const session = value as Partial<Session>;
  return typeof session.sub === 'string' && typeof session.exp === 'number';
}

function decodeSession(encoded: string, nowMs: number): Session | null {
  try {
    const parsed: unknown = JSON.parse(decoder.decode(fromBase64Url(encoded)));
    if (!isSession(parsed) || parsed.exp * 1000 <= nowMs) return null;
    return { sub: parsed.sub, exp: parsed.exp };
  } catch {
    return null;
  }
}

export async function verifySession(
  token: string,
  secret: string,
  nowMs: number = Date.now()
): Promise<Session | null> {
  const [encoded, signature] = token.split('.');
  if (encoded === undefined || signature === undefined) return null;

  const valid = await crypto.subtle.verify(
    'HMAC',
    await hmacKey(secret),
    fromBase64Url(signature) as BufferSource,
    encoder.encode(encoded)
  );
  return valid ? decodeSession(encoded, nowMs) : null;
}
