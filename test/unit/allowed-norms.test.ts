import { describe, expect, it } from 'vitest';

import {
  ALLOWED_NORMS,
  isAllowedNorm,
  isNonIrpfNorm,
  NON_IRPF_NORM_IDS,
} from '@/domain/allowed-norms';

const IRPF_IDS = [
  'BOE-A-2006-20764',
  'BOE-A-2007-6820',
  'BOCM-m-2010-90068',
  'BOE-A-2011-10542',
];

describe('allowed-norms registry', () => {
  it('keeps a stable order and unique non-empty identifiers', () => {
    const ids = ALLOWED_NORMS.map((norm) => norm.normId);
    expect(ids).toEqual([...ids]);
    expect(new Set(ids).size).toBe(ids.length);
    for (const norm of ALLOWED_NORMS) {
      expect(norm.normId.length).toBeGreaterThan(0);
      expect(norm.normTitle.length).toBeGreaterThan(0);
    }
  });

  it('answers from the same set through isAllowedNorm', () => {
    for (const norm of ALLOWED_NORMS) expect(isAllowedNorm(norm.normId)).toBe(true);
    expect(isAllowedNorm('')).toBe(false);
    expect(isAllowedNorm('BOE-A-2006-20764 ')).toBe(false);
  });

  it('splits the registry into IRPF and non-IRPF exactly once', () => {
    const all = new Set(ALLOWED_NORMS.map((norm) => norm.normId));
    const partitioned = new Set([...IRPF_IDS, ...NON_IRPF_NORM_IDS]);

    expect(partitioned).toEqual(all);
    expect(NON_IRPF_NORM_IDS).toHaveLength(6);
    for (const normId of NON_IRPF_NORM_IDS) expect(isNonIrpfNorm(normId)).toBe(true);
    for (const normId of IRPF_IDS) expect(isNonIrpfNorm(normId)).toBe(false);
    expect(isNonIrpfNorm('BOE-A-2004-4214')).toBe(false);
  });
});
