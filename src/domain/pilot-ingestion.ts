/**
 * Pilot-ingestion fallback (spec 004, Task 6).
 *
 * The human gate fixed the pilot pair as Madrid and Murcia. If a pilot norm
 * cannot be verified — no stable consolidated text, identifier or update date —
 * the ordered fallback is Castilla y León (BOCYL), then Aragón (BOA), then
 * Extremadura (DOE). The substitution and its reason are recorded; an unofficial
 * copy is never a candidate.
 *
 * The fallback communities are labels here, not jurisdiction values: spec 005
 * owns the full community data and the `Jurisdiction` union. This module only
 * decides which verified candidate fills a pilot slot.
 */

export const PILOT_FALLBACK_ORDER: readonly string[] = [
  'madrid',
  'murcia',
  'castilla_y_leon',
  'aragon',
  'extremadura',
];

export interface PilotCandidate {
  readonly id: string;
  readonly label: string;
  /** True when an official consolidated text with a stable identifier and date was found. */
  readonly verified: boolean;
  /** Why the candidate was not verified; recorded on the substitution. */
  readonly reason?: string;
}

export interface PilotSubstitution {
  readonly id: string;
  readonly reason: string;
}

export interface PilotSelection {
  readonly selected: readonly PilotCandidate[];
  readonly replaced: readonly PilotSubstitution[];
}

const DEFAULT_REASON = 'no stable consolidated text, identifier or update date from its publisher';

function rank(candidate: PilotCandidate): number {
  const index = PILOT_FALLBACK_ORDER.indexOf(candidate.id);
  return index === -1 ? PILOT_FALLBACK_ORDER.length : index;
}

/**
 * The first `slots` verified candidates in fallback order. Every unverified
 * candidate that was skipped is recorded with its reason, so a substitution can
 * never be silent.
 */
export function selectVerifiedPilots(
  candidates: readonly PilotCandidate[],
  slots = 2
): PilotSelection {
  const ordered = [...candidates].sort((left, right) => rank(left) - rank(right));
  const selected = ordered.filter((candidate) => candidate.verified).slice(0, slots);
  const replaced = ordered
    .filter((candidate) => !candidate.verified)
    .map((candidate) => ({ id: candidate.id, reason: candidate.reason ?? DEFAULT_REASON }));
  return { selected, replaced };
}
