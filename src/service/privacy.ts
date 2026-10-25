/**
 * Privacy guard (Task 12). Pure detection over the closed set
 * `'dni' | 'nie' | 'iban'`. The matched value is never returned — only the
 * category, so the caller cannot accidentally echo it.
 */

export type SensitiveCategory = 'dni' | 'nie' | 'iban';

const PATTERNS: ReadonlyArray<readonly [SensitiveCategory, RegExp]> = [
  ['nie', /\b[XYZ]\d{7}[A-Z]\b/],
  ['dni', /\b\d{8}[A-Z]\b/],
  // Spanish IBAN: ES + 22 digits, whitespace between groups tolerated.
  ['iban', /\bES(?:\s?\d){22}\b/],
];

export function detectSensitiveData(text: string): SensitiveCategory[] {
  const upper = text.toUpperCase();
  const found: SensitiveCategory[] = [];
  for (const [category, pattern] of PATTERNS) {
    if (pattern.test(upper)) found.push(category);
  }
  return found;
}
