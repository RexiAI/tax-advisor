import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import nextPlugin from '@next/eslint-plugin-next';
import { FlatCompat } from '@eslint/eslintrc';

const baseDirectory = dirname(fileURLToPath(import.meta.url));

const compat = new FlatCompat({ baseDirectory });

const eslintConfig = [
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      '.standards/**',
      'corpus/**',
      'coverage/**',
      'next-env.d.ts',
      '*.config.ts',
      '*.config.mjs',
    ],
  },
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    plugins: { '@next/next': nextPlugin },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      'prefer-const': 'error',
      complexity: ['error', 6],
      'import/order': 'off',
    },
  },
  {
    files: ['test/**/*.{ts,tsx}', 'vitest.setup.ts'],
    rules: {
      '@typescript-eslint/no-non-null-assertion': 'off',
    },
  },
];

export default eslintConfig;
