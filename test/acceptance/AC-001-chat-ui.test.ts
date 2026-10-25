/**
 * @vitest-environment jsdom
 */
import '@testing-library/jest-dom/vitest';
import '../support/setup-dom';

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { HANDOFF_URL } from '@/content/strings';
import type { ChatResponse } from '@/service/types';

import { repoPath } from '../support/paths';
import {
  answerResponse,
  askAndWait,
  CITATION,
  CORPUS,
  DEFAULT_DISCLAIMER,
  renderScreen,
  submitReturning,
} from '../support/ui-harness';

const USER_FACING_COPY = [
  'Renta Clara',
  'Escribe tu pregunta',
  'Preguntar',
  'No escribas tu DNI, NIE, IBAN ni documentos personales.',
  'El texto consolidado del BOE es informativo',
  '¿Qué quieres saber sobre tu IRPF?',
  'En resumen',
  'La norma dice',
  'Ver en el BOE',
];

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

function pxWidths(css: string): number[] {
  return [...css.matchAll(/(?:^|[\s;{])(?:min-)?width\s*:\s*(\d+)px/g)].map((match) =>
    Number(match[1])
  );
}

function widthDeclarations(css: string): string[] {
  return [...css.matchAll(/(?:^|[\s;{])(?:min-)?width\s*:\s*[^;]+/g)].map((match) => match[0]);
}

describe('AC-001-75 the AI disclosure is visible on first load and in every answer footer', () => {
  it('AC-001-75: the disclosure is visible text on load, outside hidden or titled elements', () => {
    const { container } = renderScreen();
    const disclosure = screen.getByText(DEFAULT_DISCLAIMER);

    expect(disclosure).toBeVisible();
    expect(disclosure.closest('[hidden]')).toBeNull();
    expect(disclosure.closest('[aria-hidden="true"]')).toBeNull();
    expect(disclosure.closest('[title]')).toBeNull();
    expect(container.textContent).toContain(DEFAULT_DISCLAIMER);
  });

  it('AC-001-75: an answer repeats the same string in its footer', async () => {
    renderScreen();
    await askAndWait();

    const matches = await screen.findAllByText(DEFAULT_DISCLAIMER);
    expect(matches.length).toBeGreaterThanOrEqual(2);
  });

  it('AC-001-75: both render sites import one constant instead of the literal', () => {
    for (const file of [
      'src/components/Header/Header.tsx',
      'src/components/AnswerBlock/AnswerBlock.tsx',
    ]) {
      const source = readFileSync(repoPath(file), 'utf8');
      expect(source).not.toContain('Esto es información general elaborada con IA');
    }
  });
});

describe('AC-001-76 citations show norm, article, date and a real link', () => {
  it('AC-001-76: the entry carries the metadata and a safe external link', async () => {
    renderScreen();
    await askAndWait();

    expect(await screen.findByText('Artículo 63')).toBeVisible();
    expect(
      screen.getByText(
        'Ley 35/2006, de 28 de noviembre, del Impuesto sobre la Renta de las Personas Físicas'
      )
    ).toBeVisible();
    expect(screen.getByText(/17 de marzo de 2026/)).toBeVisible();

    const link = screen.getByRole('link', { name: /Ver en el BOE/ });
    expect(link).toHaveAttribute('href', CITATION.sourceUrl);
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    expect(link.textContent).toBe('Ver en el BOE');
    expect(link.textContent).not.toContain('https://');
  });

  it('AC-001-76: two markers for the same passage render one entry', async () => {
    renderScreen({ submit: submitReturning(answerResponse({ citations: [CITATION, CITATION] })) });
    await askAndWait();

    expect(await screen.findAllByText('Artículo 63')).toHaveLength(1);
  });
});

describe('AC-001-77 the consolidated-text notice is rendered and claims nothing', () => {
  it('AC-001-77: the notice states informative value and no official endorsement', async () => {
    renderScreen();
    await askAndWait();

    expect(
      await screen.findByText(/El texto consolidado del BOE es informativo y no tiene valor legal/)
    ).toBeVisible();
    expect(screen.getByText(/no es una publicación oficial del BOE/)).toBeVisible();
    expect(screen.getByText(/ni cuenta con su respaldo/)).toBeVisible();
  });
});

describe('AC-001-78 corpus freshness is visible from artifact metadata', () => {
  it('AC-001-78: the header shows the artifact tax year and date, and follows a changed date', () => {
    const view = renderScreen();
    expect(screen.getByText(/2025/)).toBeVisible();
    expect(screen.getByText(/18 de marzo de 2026/)).toBeVisible();

    view.rerenderWith({ corpus: { taxYear: 2025, generatedAt: '2026-05-01T09:00:00Z' } });
    expect(screen.getByText(/1 de mayo de 2026/)).toBeVisible();
    expect(screen.queryByText(/18 de marzo de 2026/)).toBeNull();
    expect(CORPUS.taxYear).toBe(2025);
  });
});

describe('AC-001-79 non-answer states render their affordances', () => {
  it('AC-001-79: insufficient evidence renders the explanation, the handoff and no citations', async () => {
    renderScreen({
      submit: submitReturning({
        kind: 'insufficient_evidence',
        explanation: 'No he encontrado pasajes que respondan a esta pregunta.',
        handoffUrl: HANDOFF_URL,
        disclaimer: DEFAULT_DISCLAIMER,
      }),
    });
    await askAndWait();

    expect(
      await screen.findByText('No he encontrado pasajes que respondan a esta pregunta.')
    ).toBeVisible();
    const handoff = screen.getByRole('link', { name: 'Hablar con un asesor' });
    expect(handoff).toHaveAttribute('href', HANDOFF_URL);
    expect(screen.queryByText(/^Fuentes/)).toBeNull();
  });

  it('AC-001-79: out of scope names the topic and the official body', async () => {
    renderScreen({
      submit: submitReturning({
        kind: 'out_of_scope',
        reasonCode: 'iva',
        topicLabel: 'el IVA',
        officialBody: 'Agencia Tributaria',
        explanation:
          'Las preguntas sobre el IVA quedan fuera del alcance de esta herramienta. Para el IVA, la administración competente es Agencia Tributaria.',
        handoffUrl: HANDOFF_URL,
        disclaimer: DEFAULT_DISCLAIMER,
      }),
    });
    await askAndWait();

    expect(await screen.findByText(/el IVA/)).toBeVisible();
    expect(screen.getByText(/Agencia Tributaria/)).toBeVisible();
    expect(screen.getByRole('link', { name: 'Hablar con un asesor' })).toBeVisible();
    expect(screen.queryByText(/^Fuentes/)).toBeNull();
  });

  it('AC-001-79: yearNotice renders above the citation list; no example block without one', async () => {
    renderScreen({
      submit: submitReturning(
        answerResponse({ yearNotice: 'La respuesta se basa en el texto del BOE para el año 2025.' })
      ),
    });
    await askAndWait();

    const notice = await screen.findByText(/La respuesta se basa en el texto del BOE/);
    const sourcesHeading = screen.getByRole('heading', { name: /^Fuentes/ });
    expect(notice.compareDocumentPosition(sourcesHeading)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(screen.queryByRole('heading', { name: 'Ejemplo' })).toBeNull();
  });

  it('AC-001-79: a worked example renders when present', async () => {
    renderScreen({
      submit: submitReturning(answerResponse({ workedExample: 'Con 1.000 € de alquiler, 150 €.' })),
    });
    await askAndWait();

    expect(await screen.findByRole('heading', { name: 'Ejemplo' })).toBeVisible();
    expect(screen.getByText('Con 1.000 € de alquiler, 150 €.')).toBeVisible();
  });
});

describe('AC-001-80 keyboard and semantic structure', () => {
  it('AC-001-80: one h1, h2 sections, a polite live region and a real form', () => {
    const { container } = renderScreen();

    expect(container.querySelectorAll('h1')).toHaveLength(1);
    expect(container.querySelectorAll('h1')[0]?.textContent).toBe('Renta Clara');
    for (const heading of container.querySelectorAll('h2, h3')) {
      expect(heading.tagName).toBe('H2');
    }

    expect(container.querySelector('[aria-live="polite"]')).not.toBeNull();

    const form = container.querySelector('form');
    expect(form).not.toBeNull();
    const textarea = within(form as HTMLElement).getByRole('textbox');
    expect(textarea.tagName).toBe('TEXTAREA');
    expect(within(form as HTMLElement).getByRole('button', { name: 'Preguntar' })).toHaveAttribute(
      'type',
      'submit'
    );
  });

  it('AC-001-80: the answer live region excludes the sources block', async () => {
    const { container } = renderScreen();
    await askAndWait();

    const regions = [...container.querySelectorAll('[aria-live="polite"]')];
    expect(regions.length).toBeGreaterThan(0);
    for (const region of regions) {
      expect(region.textContent).not.toContain('Fuentes');
      expect(region.textContent).not.toContain('Artículo 63');
    }
    expect(regions.some((region) => (region.textContent ?? '').includes('En resumen'))).toBe(true);
  });

  it('AC-001-80: no click handler sits on a non-interactive element', () => {
    for (const file of walk(repoPath('src/components'))) {
      if (!file.endsWith('.tsx')) continue;
      const source = readFileSync(file, 'utf8');
      expect(source).not.toMatch(/<div[^>]*onClick/);
      expect(source).not.toMatch(/<span[^>]*onClick/);
    }
  });

  it('AC-001-80: every interactive component module defines a focus-visible rule', () => {
    const dir = repoPath('src/components');
    for (const entry of readdirSync(dir)) {
      const componentDir = join(dir, entry);
      if (!statSync(componentDir).isDirectory()) continue;
      const files = readdirSync(componentDir);
      const tsx = files.find((file) => file.endsWith('.tsx'));
      const css = files.find((file) => file.endsWith('.module.css'));
      if (tsx === undefined || css === undefined) continue;

      const source = readFileSync(join(componentDir, tsx), 'utf8');
      if (!/<(button|textarea|input|a)\b/.test(source)) continue;
      expect(readFileSync(join(componentDir, css), 'utf8')).toContain(':focus-visible');
    }
  });
});

describe('AC-001-81 360px layout and Spanish-only copy', () => {
  it('AC-001-81: no fixed width over 360px and no overflow masking', () => {
    const cssFiles = walk(repoPath('src/components')).filter((file) =>
      file.endsWith('.module.css')
    );
    expect(cssFiles.length).toBeGreaterThan(0);

    for (const file of cssFiles) {
      const css = readFileSync(file, 'utf8');
      expect(css, `${file} masks overflow`).not.toMatch(/overflow-x\s*:\s*hidden/);
      for (const pxWidth of pxWidths(css)) {
        expect(pxWidth, `${file} pins a width over 360px`).toBeLessThanOrEqual(360);
      }
      for (const declared of widthDeclarations(css)) {
        expect(declared, `${file} hardcodes a colour`).not.toContain('#');
      }
    }
  });

  it('AC-001-81: user-facing copy comes from the strings module, in Spanish', () => {
    const tsxFiles = [...walk(repoPath('src/components')), ...walk(repoPath('src/app'))].filter(
      (file) => file.endsWith('.tsx')
    );
    expect(tsxFiles.length).toBeGreaterThan(0);

    for (const file of tsxFiles) {
      const source = readFileSync(file, 'utf8');
      for (const text of USER_FACING_COPY) {
        expect(source, `${file} hardcodes ${text}`).not.toContain(text);
      }
    }
  });
});

describe('chat screen state handling', () => {
  it('renders a server error message above the composer and keeps the typed text', async () => {
    renderScreen({
      submit: async () => ({
        kind: 'error',
        error: { errorCode: 'message_too_long', message: 'La pregunta es demasiado larga.' },
      }),
    });

    await askAndWait('texto conservado');

    expect(await screen.findByText('La pregunta es demasiado larga.')).toBeVisible();
    expect(screen.getByLabelText('Escribe tu pregunta')).toHaveValue('texto conservado');
  });

  it('renders the retry interval for a rate-limited response', async () => {
    renderScreen({
      submit: async () => ({
        kind: 'error',
        error: {
          errorCode: 'rate_limited',
          message: 'Has hecho demasiadas preguntas seguidas.',
          retryAfterSeconds: 42,
        },
      }),
    });

    await askAndWait();

    expect(await screen.findByText(/42 segundos/)).toBeVisible();
  });

  it('renders a privacy warning without echoing the detected value', async () => {
    const response: ChatResponse = {
      kind: 'privacy_warning',
      category: 'dni',
      categoryLabel: 'DNI',
      message: 'No puedo procesar datos personales. He detectado un dato de tipo DNI.',
      disclaimer: DEFAULT_DISCLAIMER,
    };
    renderScreen({ submit: submitReturning(response) });

    await askAndWait('Mi DNI es 12345678Z');

    expect(await screen.findByText(/tipo DNI/)).toBeVisible();
    expect(screen.getByLabelText('Escribe tu pregunta')).toHaveValue('Mi DNI es 12345678Z');
  });

  it('shows the single clarifying question above the composer', async () => {
    renderScreen({
      submit: submitReturning({
        kind: 'clarification',
        question: '¿En qué año fiscal?',
        disclaimer: DEFAULT_DISCLAIMER,
      }),
    });

    await askAndWait();

    expect(await screen.findByText('¿En qué año fiscal?')).toBeVisible();
  });
});
