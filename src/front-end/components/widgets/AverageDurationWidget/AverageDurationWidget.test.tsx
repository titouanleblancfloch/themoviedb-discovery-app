// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { composeStories } from '@storybook/react-vite';
import { afterEach, describe, expect, it } from 'vitest';
import AverageDurationWidget from './AverageDurationWidget';
import * as stories from './AverageDurationWidget.stories';

const { Default, Loading, NoData, ErrorState, Mobile, DarkTheme } =
  composeStories(stories);

afterEach(cleanup);

/** Returns the visible text of the widget body, with spaces normalized. */
function getWidgetText(): string | undefined {
  return screen
    .getByRole('article', { name: 'Durée moyenne' })
    .querySelector('p')
    ?.textContent?.replace(/\s/g, ' ');
}

describe('AverageDurationWidget', () => {
  it('renders the label, the average value and the minute unit', () => {
    // Arrange and act: render the demo value of the mockup.
    render(<AverageDurationWidget averageMinutes={107} />);

    // Assert: the label, value and accessible unit are displayed.
    expect(
      screen.getByRole('heading', { level: 3, name: 'Durée moyenne' }),
    ).toBeTruthy();
    expect(getWidgetText()).toBe('107 min');
    expect(screen.getByTitle('minutes').textContent).toBe('min');
  });

  it('rounds the average to the nearest minute', () => {
    // Act and assert: decimals from the computed average are rounded.
    const { rerender } = render(
      <AverageDurationWidget averageMinutes={107.4} />,
    );
    expect(getWidgetText()).toBe('107 min');

    rerender(<AverageDurationWidget averageMinutes={107.6} />);
    expect(getWidgetText()).toBe('108 min');
  });

  it('shows unavailable data instead of zero when no valid duration exists', () => {
    // Act and assert: null and non-finite values are treated as missing data.
    const { rerender } = render(
      <AverageDurationWidget averageMinutes={null} />,
    );
    expect(getWidgetText()).toBe('Donnée indisponible');

    rerender(<AverageDurationWidget averageMinutes={Number.NaN} />);
    expect(getWidgetText()).toBe('Donnée indisponible');
    expect(screen.queryByText(/0 min/)).toBeNull();
  });

  it('forwards the loading and error states', () => {
    // Act and assert: the loading state hides any previous value.
    const { rerender } = render(
      <AverageDurationWidget averageMinutes={107} status="loading" />,
    );
    expect(screen.getByRole('status').textContent).toBe('Chargement…');
    expect(screen.queryByText('107')).toBeNull();

    // Act and assert: the error state is announced.
    rerender(<AverageDurationWidget averageMinutes={null} status="error" />);
    expect(screen.getByRole('alert').textContent).toBe(
      'Impossible de charger la donnée',
    );
  });
});

describe('AverageDurationWidget stories', () => {
  it('renders each Storybook state with its expected content', () => {
    // Arrange: pair each story with the text it must display.
    const expectedStates = [
      { Story: Default, text: '107 min' },
      { Story: Loading, text: 'Chargement…' },
      { Story: NoData, text: 'Donnée indisponible' },
      { Story: ErrorState, text: 'Impossible de charger la donnée' },
      { Story: Mobile, text: '107 min' },
      { Story: DarkTheme, text: '107 min' },
    ];

    // Act and assert: every story renders the widget in its own state.
    for (const { Story, text } of expectedStates) {
      const { unmount } = render(<Story />);
      expect(getWidgetText()).toBe(text);
      unmount();
    }
  });
});
