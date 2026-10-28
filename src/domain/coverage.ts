/**
 * The declared coverage matrix (spec 004): a canonical list of
 * `(jurisdiction, tax)` pairs plus one lookup.
 *
 * The sync derives the list from the norm registry; nothing else declares a
 * covered pair. A second list would drift the moment spec 005 adds a community,
 * and a guard that hardcodes its own copy could disagree with the artifact it
 * ships.
 */

import {
  JURISDICTIONS,
  TAXES,
  isJurisdiction,
  isTax,
  type Jurisdiction,
  type Tax,
} from './source';

export interface CoveragePair {
  readonly jurisdiction: Jurisdiction;
  readonly tax: Tax;
}

/** A registry entry's tag has the pair's shape; the role differs, not the fields. */
export type CoverageTag = CoveragePair;

function jurisdictionRank(jurisdiction: Jurisdiction): number {
  return JURISDICTIONS.indexOf(jurisdiction);
}

function taxRank(tax: Tax): number {
  return TAXES.indexOf(tax);
}

function comparePairs(left: CoveragePair, right: CoveragePair): number {
  const byJurisdiction = jurisdictionRank(left.jurisdiction) - jurisdictionRank(right.jurisdiction);
  if (byJurisdiction !== 0) return byJurisdiction;
  return taxRank(left.tax) - taxRank(right.tax);
}

/**
 * Deduplicated, canonically ordered. The artifact is committed, so the order is
 * part of the artifact's bytes: a registry reordering must not rewrite the file.
 */
export function coverageOf(tags: readonly CoverageTag[]): readonly CoveragePair[] {
  const seen = new Set<string>();
  const pairs: CoveragePair[] = [];
  for (const tag of tags) {
    const key = `${tag.jurisdiction}:${tag.tax}`;
    if (seen.has(key)) continue;
    seen.add(key);
    pairs.push({ jurisdiction: tag.jurisdiction, tax: tag.tax });
  }
  return pairs.sort(comparePairs);
}

/**
 * The single runtime lookup. An unknown jurisdiction, an unknown tax or an
 * undeclared pair all answer `false` — the caller never has to distinguish
 * "not covered" from "not a known value".
 */
export function isCovered(
  coverage: readonly CoveragePair[],
  jurisdiction: string,
  tax: string
): boolean {
  if (!isJurisdiction(jurisdiction) || !isTax(tax)) return false;
  return coverage.some((pair) => pair.jurisdiction === jurisdiction && pair.tax === tax);
}

function parseCoverageEntry(entry: unknown): CoveragePair | null {
  if (entry === null || typeof entry !== 'object' || Array.isArray(entry)) return null;
  const candidate = entry as Record<string, unknown>;
  if (!isJurisdiction(candidate.jurisdiction)) return null;
  if (!isTax(candidate.tax)) return null;
  return { jurisdiction: candidate.jurisdiction, tax: candidate.tax };
}

/** Rebuilds the pair list from an untrusted value, or `null` when malformed. */
export function parseCoverage(value: unknown): readonly CoveragePair[] | null {
  if (!Array.isArray(value) || value.length === 0) return null;
  const pairs = value.map(parseCoverageEntry);
  if (pairs.some((pair) => pair === null)) return null;
  return pairs as readonly CoveragePair[];
}
