// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import MoviesCountWidget from './MoviesCountWidget';

afterEach(cleanup);

/** Returns the visible text of the widget value, with spaces normalized. */
function getValueText(): string | undefined {
  return screen
    .getByRole('article', { name: 'Films en base' })
    .querySelector('p')
    ?.textContent?.replace(/\s/g, ' ');
}

describe('MoviesCountWidget', () => {
  it('renders the formatted number of movies with a plural label', () => {
    // Arrange and act: render a count that needs a thousands separator.
    render(<MoviesCountWidget count={1248} />);

    // Assert: the widget is titled and shows the French-formatted count.
    expect(
      screen.getByRole('heading', { level: 3, name: 'Films en base' }),
    ).toBeTruthy();
    expect(getValueText()).toBe('1 248 films');
  });

  it('uses the singular label for zero and one movie', () => {
    // Act and assert: French uses the singular for 0 and 1.
    const { rerender } = render(<MoviesCountWidget count={0} />);
    expect(getValueText()).toBe('0 film');

    rerender(<MoviesCountWidget count={1} />);
    expect(getValueText()).toBe('1 film');
  });

  it('shows an unavailable message instead of zero when the count is unknown', () => {
    // Arrange and act: render the widget without a known count.
    render(<MoviesCountWidget count={null} />);

    // Assert: unknown data is not displayed as zero.
    expect(getValueText()).toBe('Donnée indisponible');
    expect(screen.queryByText('0')).toBeNull();
  });
});
