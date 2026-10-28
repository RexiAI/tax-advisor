/**
 * BOE consolidated-text XML → passages (Task 3). Pure: no I/O, no clock read, no
 * network. Every rejected block is reported in `skipped` with a reason code so a
 * parse never silently shrinks the corpus.
 */

import { createPassage, type Passage } from '../domain/passage';
import { boeSourceUrl } from '../domain/source';

import { deriveArticleLabel } from './article-label';
import type { SkipReason, SkippedBlock, SourceParseResult } from './source-adapter';
import { skipReasonFor } from './source-adapter';
import {
  attributesOf,
  childrenOf,
  findElements,
  parseXml,
  reduceElementTreeToText,
  tagNameOf,
  type XmlNode,
} from './xml';

export interface ParserMeta {
  readonly normId: string;
  readonly normTitle: string;
  readonly updatedAt: string;
  readonly fetchedAt: string;
}

export type { SkipReason, SkippedBlock } from './source-adapter';
export type ConsolidatedParseResult = SourceParseResult;

const NON_NORMATIVE_TIPOS = new Set([
  'preambulo',
  'preámbulo',
  // Live BOE vocabulary beyond the preamble, observed on the consolidated-text
  // endpoint (2026-10-07). None of these carries rule text: `nota_inicial` is a
  // correction notice, `encabezado` is a structural heading (TÍTULO/CAPÍTULO/
  // Sección), and `firma` is the royal signature block. Emitting them would make
  // a heading citable as the source of a rule, and they have no `titulo`, so
  // their label would degrade to an internal block id — which AC-001-12 forbids.
  'nota_inicial',
  'encabezado',
  'firma',
]);

export { boeSourceUrl };

interface BlockOutcome {
  readonly passage?: Passage;
  readonly skip?: SkipReason;
  readonly blockId: string;
}

interface BlockAttributes {
  readonly blockId: string;
  readonly blockTitle: string;
  readonly tipo: string;
}

function readAttributes(block: XmlNode): BlockAttributes {
  const attributes = attributesOf(block);
  return {
    blockId: attributes.id ?? '',
    blockTitle: attributes.titulo ?? '',
    tipo: (attributes.tipo ?? '').toLowerCase(),
  };
}

function renderLastVersion(block: XmlNode): string {
  const versions = childrenOf(block).filter((node) => tagNameOf(node) === 'version');
  const last = versions.at(-1);
  if (last === undefined) return '';
  return reduceElementTreeToText(childrenOf(last));
}

function passageOutcome(
  attributes: BlockAttributes,
  text: string,
  meta: ParserMeta
): BlockOutcome {
  const result = createPassage({
    normId: meta.normId,
    normTitle: meta.normTitle,
    blockId: attributes.blockId,
    blockTitle: attributes.blockTitle,
    articleLabel: deriveArticleLabel(attributes.blockTitle, attributes.blockId),
    text,
    sourceUrl: boeSourceUrl(meta.normId),
    updatedAt: meta.updatedAt,
    fetchedAt: meta.fetchedAt,
  });

  if (!result.ok) {
    return { blockId: attributes.blockId, skip: skipReasonFor(result.error) };
  }
  return { blockId: attributes.blockId, passage: result.passage };
}

function readBlock(block: XmlNode, meta: ParserMeta): BlockOutcome {
  const attributes = readAttributes(block);
  if (NON_NORMATIVE_TIPOS.has(attributes.tipo)) {
    return { blockId: attributes.blockId, skip: 'non_normative_block' };
  }

  const text = renderLastVersion(block);
  if (text === '') return { blockId: attributes.blockId, skip: 'empty_text' };

  return passageOutcome(attributes, text, meta);
}

export function parseConsolidatedXml(xml: string, meta: ParserMeta): ConsolidatedParseResult {
  const parsed = parseXml(xml);
  if (!parsed.ok) return parsed;

  const blocks = findElements(parsed.nodes, 'bloque');
  if (blocks.length === 0) return { ok: false, error: 'unparsable' };

  const passages: Passage[] = [];
  const skipped: SkippedBlock[] = [];
  for (const block of blocks) {
    const outcome = readBlock(block, meta);
    if (outcome.passage !== undefined) passages.push(outcome.passage);
    if (outcome.skip !== undefined) skipped.push({ blockId: outcome.blockId, reason: outcome.skip });
  }

  return { ok: true, passages, skipped };
}
