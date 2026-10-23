/**
 * Spanish date rendering for citation metadata and the corpus freshness line.
 * Dates arrive as `YYYY-MM-DD` or a UTC timestamp; the day is formatted in UTC so
 * a server and a browser in different time zones show the same date.
 */

export function formatSpanishDate(value: string): string {
  const dateOnly = value.slice(0, 10);
  const date = new Date(`${dateOnly}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

/**
 * Models occasionally answer with Markdown emphasis or headings even when asked
 * for plain paragraphs. The UI renders text nodes, not Markdown, so strip the
 * markup rather than showing literal `**` to a taxpayer.
 */
export function toPlainText(value: string): string {
  return value
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/(^|\s)__(.+?)__(?=\s|$)/g, '$1$2')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\s+([.,;:!?)}»])/g, '$1')
    .replace(/\r\n/g, '\n')
    .trim();
}
