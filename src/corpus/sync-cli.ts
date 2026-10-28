/**
 * The sync CLI's behaviour, separated from process-level wiring so it can be
 * driven with a fake fetcher and a temporary artifact path (Task 4).
 *
 * Contract: exit 0 after writing the artifact, or exit 1 after writing nothing
 * and naming the failing norm on stderr.
 */

import type { CorpusArtifact } from './artifact';
import { parseCorpusArtifact, toIsoUtcSeconds } from './artifact';
import type { SourceAdapter } from './source-adapter';
import { runCorpusSync } from './sync';

export interface SyncCliDeps {
  readonly adapters: readonly SourceAdapter[];
  readonly taxYear: number;
  readonly now: () => Date;
  readonly readFile: (path: string) => string | null;
  readonly writeFile: (path: string, contents: string) => void;
  readonly stdout: (line: string) => void;
  readonly stderr: (line: string) => void;
}

function previousArtifact(
  readFile: (path: string) => string | null,
  path: string
): CorpusArtifact | null {
  const raw = readFile(path);
  if (raw === null) return null;
  const parsed = parseCorpusArtifact(raw);
  return parsed.ok ? parsed.artifact : null;
}

export async function runCorpusSyncCli(
  deps: SyncCliDeps & { readonly artifactPath: string }
): Promise<number> {
  const result = await runCorpusSync({
    adapters: deps.adapters,
    previous: previousArtifact(deps.readFile, deps.artifactPath),
    generatedAt: toIsoUtcSeconds(deps.now()),
    taxYear: deps.taxYear,
  });

  if (!result.ok) {
    deps.stderr(
      `corpus:sync failed: ${result.error} for ${result.normId} (${result.detail}). ` +
        'The committed artifact was not modified.'
    );
    return 1;
  }

  deps.writeFile(deps.artifactPath, `${JSON.stringify(result.artifact, null, 2)}\n`);
  deps.stdout(
    `corpus:sync ok: ${result.artifact.passages.length} passages, ` +
      `${result.fetchedNormIds.length} norms fetched, ${result.reusedNormIds.length} reused, ` +
      `hash ${result.artifact.contentHash.slice(0, 12)}`
  );
  return 0;
}
