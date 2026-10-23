/**
 * Citation marker extraction (Task 9). The marker syntax is fixed by the policy:
 * `[^p:<passageId>]`. Extraction returns the ids in order of first appearance,
 * de-duplicated, plus the answer text with the markers removed for display.
 */

const MARKER = /\[\^p:([^\]]*)\]/g;

export interface CitationExtraction {
  readonly ids: readonly string[];
  readonly text: string;
}

export function stripCitationMarkers(answerText: string): string {
  return answerText.replace(MARKER, '');
}

export function extractCitations(answerText: string): CitationExtraction {
  const ids: string[] = [];
  MARKER.lastIndex = 0;

  for (const match of answerText.matchAll(MARKER)) {
    const id = match[1] ?? '';
    if (!ids.includes(id)) ids.push(id);
  }

  return { ids, text: stripCitationMarkers(answerText) };
}
