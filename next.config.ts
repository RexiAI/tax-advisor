import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { NextConfig } from 'next';

const projectRoot = dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Pin the trace root to this repo. A lockfile in a parent directory otherwise
  // makes Next.js infer /home/<user> as the workspace root.
  outputFileTracingRoot: projectRoot,
};

export default nextConfig;
