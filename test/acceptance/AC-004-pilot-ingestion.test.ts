import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { sourceLinkLabel } from '@/content/strings';
import { parseCorpusArtifact } from '@/corpus/artifact';
import { ALLOWED_NORMS } from '@/domain/allowed-norms';
import { PILOT_FALLBACK_ORDER, selectVerifiedPilots } from '@/domain/pilot-ingestion';
import { jurisdictionDisplayName } from '@/domain/source';

import { fixtureCorpus, fixtureMeta, readFixture, repoPath } from '../support/harness';
import { offlineFetchState } from '../support/offline-fetch';

const PILOTS = ALLOWED_NORMS.filter(
  (norm) => norm.jurisdiction === 'madrid' || norm.jurisdiction === 'murcia'
);

describe('AC-004-26 the pilot norms enter the registry with complete provenance', () => {
  it('AC-004-26: one Madrid and one Murcia entry, every field non-empty, tax irpf', () => {
    expect(PILOTS).toHaveLength(2);
    expect(PILOTS.map((norm) => norm.jurisdiction).sort()).toEqual(['madrid', 'murcia']);

    for (const norm of PILOTS) {
      for (const field of [
        'publisher',
        'jurisdiction',
        'authorityUsed',
        'officialId',
        'sourceUrl',
        'updatedAt',
        'licenseNote',
      ] as const) {
        expect(norm[field], `${norm.normId} ${field}`).toBeTruthy();
      }
      expect(norm.tax).toBe('irpf');
      expect(norm.publisher).toBe(norm.jurisdiction === 'madrid' ? 'bocm' : 'borm');
      expect(norm.authorityUsed).toBe('boe');
      expect(norm.officialId).toBe(norm.normId);
    }
  });
});

describe('AC-004-27 per-norm verification evidence is recorded', () => {
  it('AC-004-27: the record states the consolidated text, identifier, date, authority and reuse', () => {
    const registry = readFileSync(repoPath('src/domain/allowed-norms.ts'), 'utf8')
      .replace(/\s*\*\s*/g, ' ')
      .replace(/\s+/g, ' ');
    expect(registry).toMatch(/official consolidated text with a stable identifier and an update date was found/i);
    expect(registry).toMatch(/authority used/i);
    expect(registry).toMatch(/reuse/i);
    expect(registry).toMatch(/asserts no fact about the content/i);
    expect(registry).toContain('BOCM-m-2010-90068');
    expect(registry).toContain('BOE-A-2011-10542');
  });
});

describe('AC-004-28 the ordered fallback is applied and recorded', () => {
  it('AC-004-28: an unverified pilot is replaced in order and the reason recorded', () => {
    expect(PILOT_FALLBACK_ORDER).toEqual([
      'madrid',
      'murcia',
      'castilla_y_leon',
      'aragon',
      'extremadura',
    ]);

    const selection = selectVerifiedPilots([
      { id: 'madrid', label: 'Madrid', verified: false, reason: 'no stable consolidated text' },
      { id: 'murcia', label: 'Murcia', verified: true },
      { id: 'castilla_y_leon', label: 'Castilla y León', verified: true },
      { id: 'aragon', label: 'Aragón', verified: true },
    ]);

    expect(selection.selected.map((candidate) => candidate.id)).toEqual([
      'murcia',
      'castilla_y_leon',
    ]);
    expect(selection.replaced).toEqual([
      { id: 'madrid', reason: 'no stable consolidated text' },
    ]);
    expect(selection.selected.map((candidate) => candidate.id)).not.toContain('aragon');
  });
});

describe('AC-004-29 the pilot fixtures are committed and offline', () => {
  it('AC-004-29: one fixture per pilot, present in the harness, no network call', () => {
    const pilotIds = PILOTS.map((norm) => norm.normId).sort();
    expect(fixtureMeta().map((meta) => meta.normId)).toEqual(expect.arrayContaining(pilotIds));

    for (const meta of fixtureMeta().filter((entry) => pilotIds.includes(entry.normId))) {
      expect(readFixture(...meta.file)).toContain('<bloque');
    }

    const corpus = fixtureCorpus();
    for (const norm of PILOTS) {
      expect(
        corpus.artifact.passages.some((passage) => passage.normId === norm.normId),
        `no fixture passage for ${norm.normId}`
      ).toBe(true);
    }
    expect(offlineFetchState.attempts).toEqual([]);
  });
});

describe('AC-004-30 the committed artifact reflects the pilots', () => {
  it('AC-004-30: coverage includes both pilots and their passages carry bocm/borm', () => {
    const raw = readFileSync(repoPath('corpus/corpus.json'), 'utf8');
    const parsed = parseCorpusArtifact(raw);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    expect(parsed.artifact.coverage).toEqual(
      expect.arrayContaining([
        { jurisdiction: 'madrid', tax: 'irpf' },
        { jurisdiction: 'murcia', tax: 'irpf' },
      ])
    );

    const madrid = parsed.artifact.passages.filter((passage) => passage.normId === 'BOCM-m-2010-90068');
    const murcia = parsed.artifact.passages.filter((passage) => passage.normId === 'BOE-A-2011-10542');
    expect(madrid.length).toBeGreaterThan(0);
    expect(murcia.length).toBeGreaterThan(0);
    for (const passage of madrid) {
      expect(passage.publisher).toBe('bocm');
      expect(passage.jurisdiction).toBe('madrid');
    }
    for (const passage of murcia) {
      expect(passage.publisher).toBe('borm');
      expect(passage.jurisdiction).toBe('murcia');
    }
  });

  it('AC-004-30: each pilot authority is the BOE, so its link reads Ver en el BOE', () => {
    const raw = readFileSync(repoPath('corpus/corpus.json'), 'utf8');
    const parsed = parseCorpusArtifact(raw);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    const pilots = parsed.artifact.norms.filter(
      (norm) => norm.jurisdiction === 'madrid' || norm.jurisdiction === 'murcia'
    );
    expect(pilots).toHaveLength(2);

    for (const norm of pilots) {
      expect(norm.authorityUsed).toBe('boe');
      expect(sourceLinkLabel(norm.authorityUsed)).toBe('Ver en el BOE');
      // The publisher stays recorded, and the jurisdiction still renders.
      expect(norm.publisher).toBe(norm.jurisdiction === 'madrid' ? 'bocm' : 'borm');
      expect(jurisdictionDisplayName(norm.jurisdiction)).toBe(
        norm.jurisdiction === 'madrid' ? 'Comunidad de Madrid' : 'Región de Murcia'
      );
    }
  });
});
