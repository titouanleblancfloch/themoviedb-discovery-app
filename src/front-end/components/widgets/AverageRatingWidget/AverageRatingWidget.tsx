import DashboardWidget, {
  type DashboardWidgetStatus,
} from '../DashboardWidget/DashboardWidget';

interface AverageRatingWidgetProps {
  /**
   * Simple (unweighted) average of the movie ratings out of 10, computed
   * beforehand over the whole catalog. `null` means that no movie has a rating:
   * the widget then shows that no rating is available instead of displaying zero.
   */
  averageRating: number | null;
  /**
   * Loading state of the value. Defaults to `ready`; the `empty` state is
   * derived from `averageRating`.
   */
  status?: Exclude<DashboardWidgetStatus, 'empty'>;
}

const ratingFormatter = new Intl.NumberFormat('fr-FR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export default function AverageRatingWidget({
  averageRating,
  status = 'ready',
}: AverageRatingWidgetProps) {
  const hasValue = averageRating !== null && Number.isFinite(averageRating);

  return (
    <DashboardWidget
      title="Note moyenne"
      status={status === 'ready' && !hasValue ? 'empty' : status}
      emptyMessage="Aucune note disponible"
    >
      {hasValue && (
        <p className="dashboard-widget-value">
          <strong>{ratingFormatter.format(averageRating)}</strong>{' '}
          <abbr title="sur 10">/ 10</abbr>
        </p>
      )}
    </DashboardWidget>
  );
}
