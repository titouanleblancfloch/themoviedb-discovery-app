// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { composeStories } from '@storybook/react-vite';
import { afterEach, describe, expect, it } from 'vitest';
import AverageRatingWidget from './AverageRatingWidget';
import * as stories from './AverageRatingWidget.stories';

const {
  Default,
  Loading,
  NoRatings,
  ZeroAverage,
  ErrorState,
  Mobile,
  DarkTheme,
} = composeStories(stories);

afterEach(cleanup);

/** Returns the visible text of the widget body, with spaces normalized. */
function getWidgetText(): string | undefined {
  return screen
    .getByRole('article', { name: 'Note moyenne' })
    .querySelector('p')
    ?.textContent?.replace(/\s/g, ' ');
}

describe('AverageRatingWidget', () => {
  it('renders the label, the French-formatted rating and the scale', () => {
    // Arrange and act: render the demo value of the ticket.
    render(<AverageRatingWidget averageRating={6.78} />);

    // Assert: the label, the comma decimal separator and the /10 scale are shown.
    expect(
      screen.getByRole('heading', { level: 3, name: 'Note moyenne' }),
    ).toBeTruthy();
    expect(getWidgetText()).toBe('6,78 / 10');
    expect(screen.getByTitle('sur 10').textContent).toBe('/ 10');
  });

  it('always displays exactly two decimals', () => {
    // Act and assert: values are padded or rounded to two decimals.
    const { rerender } = render(<AverageRatingWidget averageRating={7} />);
    expect(getWidgetText()).toBe('7,00 / 10');

    rerender(<AverageRatingWidget averageRating={6.785} />);
    expect(getWidgetText()).toBe('6,79 / 10');
  });

  it('distinguishes a zero average from a missing rating', () => {
    // Act and assert: a real zero is displayed as a value.
    const { rerender } = render(<AverageRatingWidget averageRating={0} />);
    expect(getWidgetText()).toBe('0,00 / 10');

    // Act and assert: missing ratings show a dedicated message, not zero.
    rerender(<AverageRatingWidget averageRating={null} />);
    expect(getWidgetText()).toBe('Aucune note disponible');

    rerender(<AverageRatingWidget averageRating={Number.NaN} />);
    expect(getWidgetText()).toBe('Aucune note disponible');
  });

  it('forwards the loading and error states', () => {
    // Act and assert: the loading state hides any previous value.
    const { rerender } = render(
      <AverageRatingWidget averageRating={6.78} status="loading" />,
    );
    expect(screen.getByRole('status').textContent).toBe('Chargement…');
    expect(screen.queryByText('6,78')).toBeNull();

    // Act and assert: the error state is announced.
    rerender(<AverageRatingWidget averageRating={null} status="error" />);
    expect(screen.getByRole('alert').textContent).toBe(
      'Impossible de charger la donnée',
    );
  });
});

describe('AverageRatingWidget stories', () => {
  it('renders each Storybook state with its expected content', () => {
    // Arrange: pair each story with the text it must display.
    const expectedStates = [
      { Story: Default, text: '6,78 / 10' },
      { Story: Loading, text: 'Chargement…' },
      { Story: NoRatings, text: 'Aucune note disponible' },
      { Story: ZeroAverage, text: '0,00 / 10' },
      { Story: ErrorState, text: 'Impossible de charger la donnée' },
      { Story: Mobile, text: '6,78 / 10' },
      { Story: DarkTheme, text: '6,78 / 10' },
    ];

    // Act and assert: every story renders the widget in its own state.
    for (const { Story, text } of expectedStates) {
      const { unmount } = render(<Story />);
      expect(getWidgetText()).toBe(text);
      unmount();
    }
  });
});
