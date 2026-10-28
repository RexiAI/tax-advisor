/**
 * XML access and text reduction for BOE consolidated texts (Task 3).
 *
 * The BOE ships a `<bloque>`/`<version>` document whose version children are HTML
 * fragments. Parsing keeps document order (`preserveOrder`) so the reducer can
 * decide where a line break belongs instead of stripping tags with a regex and
 * hoping the result reads.
 */

import { XMLParser, XMLValidator } from 'fast-xml-parser';

export type XmlNode = Record<string, unknown>;

export type XmlParseResult =
  | { readonly ok: true; readonly nodes: readonly XmlNode[] }
  | { readonly ok: false; readonly error: 'unparsable' };

const ATTRIBUTES_KEY = ':@';
const TEXT_KEY = '#text';

const BLOCK_TAGS = new Set([
  'p',
  'div',
  'li',
  'ul',
  'ol',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'section',
  'article',
  'blockquote',
  'br',
  'tr',
]);

const TABLE_WRAPPER_TAGS = new Set(['thead', 'tbody', 'tfoot']);
const CELL_TAGS = new Set(['td', 'th']);

const NAMED_ENTITIES: ReadonlyArray<readonly [string, string]> = [
  ['&nbsp;', ' '],
  ['&quot;', '"'],
  ['&apos;', "'"],
  ['&lt;', '<'],
  ['&gt;', '>'],
  ['&amp;', '&'],
];

export function isTextNode(node: XmlNode): boolean {
  return typeof node[TEXT_KEY] === 'string';
}

export function tagNameOf(node: XmlNode): string {
  for (const key of Object.keys(node)) {
    if (key !== ATTRIBUTES_KEY && key !== TEXT_KEY) return key;
  }
  return '';
}

export function childrenOf(node: XmlNode): XmlNode[] {
  const tag = tagNameOf(node);
  if (tag === '') return [];
  const value = node[tag];
  return Array.isArray(value) ? (value as XmlNode[]) : [];
}

export function attributesOf(node: XmlNode): Record<string, string> {
  const raw = node[ATTRIBUTES_KEY];
  if (typeof raw !== 'object' || raw === null) return {};
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    out[key.replace(/^@_/, '')] = typeof value === 'string' ? decodeEntities(value) : String(value);
  }
  return out;
}

/** Depth-first collection of every element with the given tag, in document order. */
export function findElements(nodes: readonly XmlNode[], tag: string): XmlNode[] {
  const found: XmlNode[] = [];
  for (const node of nodes) {
    if (!isTextNode(node) && tagNameOf(node) === tag) found.push(node);
    found.push(...findElements(childrenOf(node), tag));
  }
  return found;
}

/**
 * The text of the first element with the given tag, or `undefined` when the
 * document does not parse, carries no such element, or the element is empty. Both
 * publisher adapters read their own update date this way.
 */
export function textOfFirstElement(xml: string, tag: string): string | undefined {
  const parsed = parseXml(xml);
  if (!parsed.ok) return undefined;
  const [node] = findElements(parsed.nodes, tag);
  if (node === undefined) return undefined;
  const text = reduceElementTreeToText(childrenOf(node));
  return text === '' ? undefined : text;
}

export function decodeEntities(value: string): string {
  let decoded = value
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex: string) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec: string) => String.fromCodePoint(Number(dec)));
  for (const [entity, replacement] of NAMED_ENTITIES) {
    decoded = decoded.split(entity).join(replacement);
  }
  return decoded;
}

function collapse(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function renderTableRows(nodes: readonly XmlNode[]): string[] {
  const rows: string[] = [];
  for (const node of nodes) {
    if (isTextNode(node)) continue;
    const tag = tagNameOf(node).toLowerCase();
    if (tag === 'tr') {
      const cells = childrenOf(node)
        .filter((cell) => CELL_TAGS.has(tagNameOf(cell).toLowerCase()))
        .map((cell) => collapse(renderNodes(childrenOf(cell))))
        .filter((cell) => cell !== '');
      if (cells.length > 0) rows.push(cells.join(' | '));
      continue;
    }
    if (TABLE_WRAPPER_TAGS.has(tag)) rows.push(...renderTableRows(childrenOf(node)));
  }
  return rows;
}

function renderNodes(nodes: readonly XmlNode[]): string {
  let out = '';
  for (const node of nodes) {
    if (isTextNode(node)) {
      out += decodeEntities(String(node[TEXT_KEY]));
      continue;
    }
    const tag = tagNameOf(node).toLowerCase();
    if (tag === 'table') {
      out += `\n${renderTableRows(childrenOf(node)).join('\n')}\n`;
      continue;
    }
    const inner = renderNodes(childrenOf(node));
    out += BLOCK_TAGS.has(tag) ? `\n${inner}\n` : inner;
  }
  return out;
}

/**
 * Tags removed, entities decoded, block-level tags turned into line breaks, runs
 * of whitespace collapsed to a single space, trimmed, and table rows flattened to
 * one line with cells separated by `' | '`.
 */
export function reduceElementTreeToText(nodes: readonly XmlNode[]): string {
  return renderNodes(nodes)
    .split('\n')
    .map((line) => collapse(line))
    .filter((line) => line !== '')
    .join('\n');
}

const PARSER_OPTIONS = {
  preserveOrder: true,
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  trimValues: false,
  processEntities: true,
} as const;

export function parseXml(xml: string): XmlParseResult {
  if (XMLValidator.validate(xml) !== true) return { ok: false, error: 'unparsable' };
  try {
    const parsed: unknown = new XMLParser(PARSER_OPTIONS).parse(xml);
    if (!Array.isArray(parsed)) return { ok: false, error: 'unparsable' };
    return { ok: true, nodes: parsed as XmlNode[] };
  } catch {
    return { ok: false, error: 'unparsable' };
  }
}
