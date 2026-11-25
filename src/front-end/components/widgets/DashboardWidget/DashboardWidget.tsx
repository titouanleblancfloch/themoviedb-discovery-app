import { useId, type ReactNode } from 'react';
import './DashboardWidget.css';

/**
 * Display state shared by every dashboard widget.
 * - `ready`: the value is available and rendered from `children`.
 * - `loading`: the value is being fetched.
 * - `empty`: no valid data exists, which must not be shown as zero.
 * - `error`: the value could not be loaded.
 */
export type DashboardWidgetStatus = 'ready' | 'loading' | 'empty' | 'error';

interface DashboardWidgetProps {
  /** Accessible title displayed at the top of the widget. */
  title: string;
  /** Display state of the widget. */
  status: DashboardWidgetStatus;
  /** Content displayed when the status is `ready`. */
  children?: ReactNode;
}

export default function DashboardWidget({
  title,
  status,
  children,
}: DashboardWidgetProps) {
  const titleId = useId();

  return (
    <article
      className="dashboard-widget"
      aria-labelledby={titleId}
      aria-busy={status === 'loading'}
    >
      <h3 id={titleId} className="dashboard-widget-title">
        {title}
      </h3>
      {status === 'ready' && children}
      {status === 'loading' && (
        <p className="dashboard-widget-message" role="status">
          Chargement…
        </p>
      )}
      {status === 'empty' && (
        <p className="dashboard-widget-message">Donnée indisponible</p>
      )}
      {status === 'error' && (
        <p
          className="dashboard-widget-message dashboard-widget-error"
          role="alert"
        >
          Impossible de charger la donnée
        </p>
      )}
    </article>
  );
}
