// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import DashboardWidget from './DashboardWidget';

afterEach(cleanup);

describe('DashboardWidget', () => {
  it('renders its title and content when ready', () => {
    // Arrange and act: render a ready widget with a value.
    render(
      <DashboardWidget title="Mon indicateur" status="ready">
        <p>42</p>
      </DashboardWidget>,
    );

    // Assert: the article is named by its title and shows its content.
    const widget = screen.getByRole('article', { name: 'Mon indicateur' });
    expect(
      screen.getByRole('heading', { level: 3, name: 'Mon indicateur' }),
    ).toBeTruthy();
    expect(screen.getByText('42')).toBeTruthy();
    expect(widget.getAttribute('aria-busy')).toBe('false');
  });

  it('announces the loading state without rendering the content', () => {
    // Arrange and act: render a loading widget.
    render(
      <DashboardWidget title="Mon indicateur" status="loading">
        <p>42</p>
      </DashboardWidget>,
    );

    // Assert: a status message is announced and the widget is busy.
    expect(screen.getByRole('status').textContent).toBe('Chargement…');
    expect(
      screen
        .getByRole('article', { name: 'Mon indicateur' })
        .getAttribute('aria-busy'),
    ).toBe('true');
    expect(screen.queryByText('42')).toBeNull();
  });

  it('shows an unavailable message instead of the content when empty', () => {
    // Arrange and act: render a widget without valid data.
    render(
      <DashboardWidget title="Mon indicateur" status="empty">
        <p>0</p>
      </DashboardWidget>,
    );

    // Assert: missing data is never rendered as a value.
    expect(screen.getByText('Donnée indisponible')).toBeTruthy();
    expect(screen.queryByText('0')).toBeNull();
  });

  it('uses a custom message for the empty state when provided', () => {
    // Arrange and act: render an empty widget with a specific message.
    render(
      <DashboardWidget
        title="Mon indicateur"
        status="empty"
        emptyMessage="Aucune note disponible"
      />,
    );

    // Assert: the custom message replaces the default one.
    expect(screen.getByText('Aucune note disponible')).toBeTruthy();
    expect(screen.queryByText('Donnée indisponible')).toBeNull();
  });

  it('alerts the user when the value cannot be loaded', () => {
    // Arrange and act: render a widget in error.
    render(
      <DashboardWidget title="Mon indicateur" status="error">
        <p>42</p>
      </DashboardWidget>,
    );

    // Assert: the error is announced and the content is hidden.
    expect(screen.getByRole('alert').textContent).toBe(
      'Impossible de charger la donnée',
    );
    expect(screen.queryByText('42')).toBeNull();
  });
});
