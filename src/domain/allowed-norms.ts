/**
 * The two norms this product covers (Task 2). Everything outside this set is
 * refused rather than guessed at.
 */

export interface AllowedNorm {
  readonly normId: string;
  readonly normTitle: string;
}

export const ALLOWED_NORMS: readonly AllowedNorm[] = [
  { normId: 'BOE-A-2006-20764', normTitle: 'Ley 35/2006 del Impuesto sobre la Renta' },
  { normId: 'BOE-A-2007-6820', normTitle: 'Real Decreto 439/2007, Reglamento del IRPF' },
];

const ALLOWED_IDS = new Set(ALLOWED_NORMS.map((norm) => norm.normId));

export function isAllowedNorm(normId: string): boolean {
  return ALLOWED_IDS.has(normId);
}
