/**
 * `npm run corpus:sync` (Task 4).
 *
 * Fetches the BOE consolidated text of the covered norms, writes the committed
 * corpus artifact and prints a one-line summary. The behaviour under test lives in
 * `src/corpus/sync-cli.ts`; this file only supplies the real dependencies.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

import { CORPUS_ARTIFACT_PATH } from '../src/corpus/artifact';
import { createBoeAdapter } from '../src/corpus/boe-adapter';
import { createBocmAdapter } from '../src/corpus/bocm-adapter';
import { runCorpusSyncCli } from '../src/corpus/sync-cli';
import { readBounds } from '../src/config/env';

const artifactPath = join(process.cwd(), CORPUS_ARTIFACT_PATH);

process.exitCode = await runCorpusSyncCli({
  // Adapters are keyed by the publisher that supplies the text. The pilot
  // regional norms are consolidated by the BOE, so the BOE adapter serves them.
  adapters: [createBoeAdapter(), createBocmAdapter()],
  artifactPath,
  taxYear: readBounds().corpusTaxYear,
  now: () => new Date(),
  readFile: (path: string) => (existsSync(path) ? readFileSync(path, 'utf8') : null),
  writeFile: (path: string, contents: string) => {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, contents, 'utf8');
  },
  stdout: (line: string) => process.stdout.write(`${line}\n`),
  stderr: (line: string) => process.stderr.write(`${line}\n`),
});
