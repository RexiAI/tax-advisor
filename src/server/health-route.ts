/**
 * `GET /health` (Task 14). Two checks, no outbound call, nothing sensitive in the
 * body: a status word per dependency and an overall status.
 */

import type { AppDeps } from './deps';

export type CheckStatus = 'ok' | 'error';

export interface HealthBody {
  readonly status: CheckStatus;
  readonly checks: {
    readonly llmConfig: CheckStatus;
    readonly corpusIndex: CheckStatus;
  };
}

function configStatus(deps: AppDeps): CheckStatus {
  return deps.loadConfig().ok ? 'ok' : 'error';
}

function corpusStatus(deps: AppDeps): CheckStatus {
  const corpus = deps.loadCorpus();
  if (!corpus.ok) return 'error';
  return corpus.corpus.index.size >= 1 ? 'ok' : 'error';
}

export function createHealthHandler(deps: AppDeps): () => Promise<Response> {
  return async function handleHealth(): Promise<Response> {
    const llmConfig = configStatus(deps);
    const corpusIndex = corpusStatus(deps);
    const healthy = llmConfig === 'ok' && corpusIndex === 'ok';

    const body: HealthBody = {
      status: healthy ? 'ok' : 'error',
      checks: { llmConfig, corpusIndex },
    };

    return new Response(JSON.stringify(body), {
      status: healthy ? 200 : 503,
      headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
    });
  };
}
