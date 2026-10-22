/**
 * Repository paths for tests. Kept free of other imports so a jsdom component
 * test can use it without pulling server modules into the browser environment.
 */

import { join } from 'node:path';

/** Vitest runs from the repository root; `npm test` and `npx vitest` both do. */
export const REPO_ROOT = process.cwd();

export function repoPath(...parts: string[]): string {
  return join(REPO_ROOT, ...parts);
}
