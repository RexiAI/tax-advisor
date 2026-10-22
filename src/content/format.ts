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
