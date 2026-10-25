/**
 * React Testing Library cleanup for jsdom test files. `globals: false` in the
 * vitest config means RTL cannot register its own auto-cleanup, so each jsdom
 * test file imports this module to unmount between tests.
 */

import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(() => {
  cleanup();
});
