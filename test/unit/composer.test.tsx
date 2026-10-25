/**
 * @vitest-environment jsdom
 */
import '@testing-library/jest-dom/vitest';
import '../support/setup-dom';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { FormEvent } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { Composer } from '@/components/Composer';

function setup(value = '') {
  const onSubmit = vi.fn((event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
  });
  render(
    <Composer value={value} maxChars={2000} busy={false} onChange={() => {}} onSubmit={onSubmit} />
  );
  return { onSubmit };
}

describe('Composer', () => {
  it('submits on Enter and leaves Shift+Enter to insert a newline', async () => {
    const user = userEvent.setup();
    const { onSubmit } = setup('texto');

    const textarea = screen.getByLabelText('Escribe tu pregunta');
    await user.click(textarea);
    await user.keyboard('{Enter}');
    expect(onSubmit).toHaveBeenCalledTimes(1);

    await user.keyboard('{Shift>}{Enter}{/Shift}');
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('hides the character counter until the message is long', () => {
    setup('corto');
    expect(screen.queryByText('/ 2000')).toBeNull();

    render(
      <Composer
        value={'a'.repeat(1801)}
        maxChars={2000}
        busy={false}
        onChange={() => {}}
        onSubmit={() => {}}
      />
    );
    expect(screen.getByText('1801 / 2000')).toBeVisible();
  });

  it('marks the submit button busy and disabled while a turn is running', () => {
    render(<Composer value="x" maxChars={2000} busy onChange={() => {}} onSubmit={() => {}} />);
    const button = screen.getByRole('button', { name: 'Preguntar' });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
  });
});
