import { afterEach } from 'vitest';

import { installOfflineFetch } from './test/support/offline-fetch';

// The suite must pass with no real credentials in the environment. Tests that
// need a configured model set their own values explicitly.
for (const key of ['LLM_BASE_URL', 'LLM_API_KEY', 'LLM_MODEL']) {
  delete process.env[key];
}

// The offline fetch stub is installed before every test file so that no test can
// reach the network, and re-installed before each test so attempts are counted
// per test rather than per file.
installOfflineFetch();

afterEach(() => {
  installOfflineFetch();
});
