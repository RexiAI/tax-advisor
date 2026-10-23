import { createHash, timingSafeEqual } from 'node:crypto';

function sha256(value: string): Buffer {
  return createHash('sha256').update(value, 'utf8').digest();
}

/** Fixed-length comparison; a length difference never short-circuits the compare. */
export function passwordsMatch(submitted: string, expected: string): boolean {
  if (expected === '') return false;
  return timingSafeEqual(sha256(submitted), sha256(expected));
}

export function emailsMatch(submitted: string, expected: string): boolean {
  return submitted.trim().toLowerCase() === expected.trim().toLowerCase();
}
