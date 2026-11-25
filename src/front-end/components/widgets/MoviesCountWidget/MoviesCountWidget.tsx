import DashboardWidget from '../DashboardWidget/DashboardWidget';

interface MoviesCountWidgetProps {
  /** Number of movies stored in the database, or null when it is unknown. */
  count: number | null;
}

const numberFormatter = new Intl.NumberFormat('fr-FR');

export default function MoviesCountWidget({ count }: MoviesCountWidgetProps) {
  return (
    <DashboardWidget
      title="Films en base"
      status={count === null ? 'empty' : 'ready'}
    >
      {count !== null && (
        <p className="dashboard-widget-value">
          <strong>{numberFormatter.format(count)}</strong>{' '}
          {count > 1 ? 'films' : 'film'}
        </p>
      )}
    </DashboardWidget>
  );
}
