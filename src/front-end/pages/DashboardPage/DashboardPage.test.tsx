// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import DashboardPage from './DashboardPage';

afterEach(cleanup);

describe('DashboardPage', () => {
  it('renders the dashboard with an empty state when no widget is configured', () => {
    // Arrange and act: render the dashboard without any widget.
    render(<DashboardPage />);

    // Assert: the page, its headings, and the empty state are visible.
    expect(screen.getByRole('main')).toBeTruthy();
    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Tableau de bord des films',
      }),
    ).toBeTruthy();
    expect(
      screen.getByRole('heading', { level: 2, name: 'Indicateurs' }),
    ).toBeTruthy();
    expect(screen.getByRole('status').textContent).toBe(
      "Aucun widget n'est configuré pour le moment.",
    );
  });
});
