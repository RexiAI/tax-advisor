/**
 * The BOCM source adapter (spec 004, Task 5).
 *
 * The BOCM publishes one XML document per disposition. Unlike the BOE's
 * consolidated-text resource it is not a `<bloque>` document: the metadata is a
 * flat `metadatos` element and the whole text arrives as one `texto` node whose
 * article headings are lines. This adapter owns that shape: it reads the
 * bulletin's own `fecha_publicacion`, turns the article headings into passages,
 * and reports everything it skipped so a regional document can never silently
 * shrink the corpus.
 *
 * Nothing else in the codebase parses this shape, so a BOCM format change has
 * exactly one place to adapt.
 */

import type { AllowedNorm } from '../domain/allowed-norms';
import { createPassage, type Passage } from '../domain/passage';
import type { Publisher } from '../domain/source';

import type { FetchedDocument, FetchedUpdate } from './fetcher';
import { fetchXmlDocument } from './fetcher';
import type {
  SkippedBlock,
  SourceAdapter,
  SourceParseMeta,
  SourceParseResult,
} from './source-adapter';
import { skipReasonFor } from './source-adapter';
import { childrenOf, findElements, parseXml, reduceElementTreeToText, textOfFirstElement } from './xml';

export const BOCM_HOST = 'www.bocm.es';

const ARTICLE_HEADING = /^Art[íi]culo\s+(.+)$/;
/** The bulletin writes `2010/10/25`; the corpus records `2010-10-25`. */
const SLASHED_DATE = /^(\d{4})\/(\d{2})\/(\d{2})$/;
const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;

function isoDate(year: string, month: string, day: string): string | undefined {
  const monthNumber = Number(month);
  const dayNumber = Number(day);
  if (monthNumber < 1 || monthNumber > 12) return undefined;
  if (dayNumber < 1 || dayNumber > 31) return undefined;
  return `${year}-${month}-${day}`;
}

/** The bulletin's own date in `YYYY-MM-DD`, or `undefined` — never guessed. */
export function normalizeBulletinDate(value: string): string | undefined {
  const trimmed = value.trim();
  const slashed = SLASHED_DATE.exec(trimmed);
  if (slashed !== null) return isoDate(slashed[1] as string, slashed[2] as string, slashed[3] as string);
  const dashed = DATE_ONLY.exec(trimmed);
  if (dashed !== null) return isoDate(dashed[1] as string, dashed[2] as string, dashed[3] as string);
  return undefined;
}

export function readBocmPublicationDate(xml: string): string | undefined {
  const raw = textOfFirstElement(xml, 'fecha_publicacion');
  return raw === undefined ? undefined : normalizeBulletinDate(raw);
}

/** `Artículo 2 bis` → `art-2-bis`, stable across runs. */
function blockIdOf(label: string): string {
  return `art-${label
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')}`;
}

interface ArticleBlock {
  readonly blockId: string;
  readonly blockTitle: string;
  readonly text: string;
}

/** Splits the single `texto` node into one block per article heading line. */
export function splitBocmArticles(text: string): { blocks: ArticleBlock[]; skipped: SkippedBlock[] } {
  const lines = text.split('\n').map((line) => line.trim());
  const starts = headingIndexes(lines);

  const blocks = starts.map((start, index) => {
    const end = starts[index + 1] ?? lines.length;
    return toBlock({ label: lines[start] ?? '', lines: lines.slice(start, end) });
  });

  const preamble = lines.slice(0, starts[0] ?? lines.length);
  const skipped: SkippedBlock[] =
    preamble.some((line) => line !== '') ? [{ blockId: 'preambulo', reason: 'non_normative_block' }] : [];

  return { blocks, skipped };
}

function headingIndexes(lines: readonly string[]): number[] {
  const indexes: number[] = [];
  lines.forEach((line, index) => {
    if (ARTICLE_HEADING.test(line)) indexes.push(index);
  });
  return indexes;
}

function toBlock(block: { label: string; lines: string[] }): ArticleBlock {
  return {
    blockId: blockIdOf(block.label),
    blockTitle: block.label,
    text: block.lines.join('\n').trim(),
  };
}

export interface BocmAdapterOptions {
  readonly fetchImpl?: typeof fetch;
}

const fetchBocmDocument = (
  norm: AllowedNorm,
  fetchImpl: typeof fetch
): Promise<FetchedDocument> => fetchXmlDocument(norm.sourceUrl, norm.normId, fetchImpl);

export function createBocmAdapter(options: BocmAdapterOptions = {}): SourceAdapter {
  const fetchImpl = options.fetchImpl ?? ((input, init) => globalThis.fetch(input, init));

  return {
    publisher: 'bocm' satisfies Publisher,
    async getLastUpdated(norm: AllowedNorm): Promise<FetchedUpdate> {
      const document = await fetchBocmDocument(norm, fetchImpl);
      if (!document.ok) return document;
      const updatedAt = readBocmPublicationDate(document.document);
      if (updatedAt === undefined) {
        return { ok: false, error: `fecha_publicacion missing for ${norm.normId}` };
      }
      return { ok: true, updatedAt };
    },
    fetchDocument: (norm: AllowedNorm) => fetchBocmDocument(norm, fetchImpl),
    sourceUrl: (norm: AllowedNorm) => norm.sourceUrl,
    parse(document: string, meta: SourceParseMeta): SourceParseResult {
      const parsed = parseXml(document);
      if (!parsed.ok) return parsed;
      const [texto] = findElements(parsed.nodes, 'texto');
      if (texto === undefined) return { ok: false, error: 'unparsable' };

      const { blocks, skipped } = splitBocmArticles(reduceElementTreeToText(childrenOf(texto)));
      const passages: Passage[] = [];
      const skippedBlocks: SkippedBlock[] = [...skipped];

      for (const block of blocks) {
        const result = createPassage({
          normId: meta.norm.normId,
          normTitle: meta.norm.normTitle,
          blockId: block.blockId,
          blockTitle: block.blockTitle,
          articleLabel: block.blockTitle,
          text: block.text,
          sourceUrl: meta.norm.sourceUrl,
          updatedAt: meta.updatedAt,
          fetchedAt: meta.fetchedAt,
        });
        if (result.ok) passages.push(result.passage);
        else skippedBlocks.push({ blockId: block.blockId, reason: skipReasonFor(result.error) });
      }

      return { ok: true, passages, skipped: skippedBlocks };
    },
  };
}
