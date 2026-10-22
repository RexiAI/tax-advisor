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
import { createBoeFetcher } from '../src/corpus/boe-fetcher';
import { runCorpusSyncCli } from '../src/corpus/sync-cli';
import { readBounds } from '../src/config/env';

const artifactPath = join(process.cwd(), CORPUS_ARTIFACT_PATH);

process.exitCode = await runCorpusSyncCli({
  fetcher: createBoeFetcher(),
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
