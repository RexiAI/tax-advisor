import { createLoginHandler } from '@/auth/login-handler';
import { loadAuthConfig } from '@/config/env';
import { createRateLimiter } from '@/service/rate-limit';

export const runtime = 'nodejs';

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 10 * 60 * 1000;

export const POST = createLoginHandler({
  loadAuthConfig,
  limiter: createRateLimiter({ max: MAX_ATTEMPTS, windowMs: WINDOW_MS }),
  now: () => Date.now(),
});
