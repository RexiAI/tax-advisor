/**
 * The article label is derived from the block title, never invented and never
 * empty (Task 3, AC-001-12).
 *
 * `Artículo 63. Escala general del impuesto` yields `Artículo 63`; anything else
 * yields the block title verbatim.
 */

const ARTICLE_LABEL = /^(art[íi]culo\s+\d+[a-z]*(?:\s+(?:bis|ter|qu[áa]ter|quinquies))?)/i;

export function deriveArticleLabel(blockTitle: string, fallback: string): string {
  const title = blockTitle.replace(/\s+/g, ' ').trim();
  const match = ARTICLE_LABEL.exec(title);
  if (match?.[1] !== undefined) return match[1].trim();
  if (title !== '') return title;
  return fallback.trim();
}
