import DashboardWidget, {
  type DashboardWidgetStatus,
} from '../DashboardWidget/DashboardWidget';

interface AverageDurationWidgetProps {
  /**
   * Average duration of the movies in minutes, computed beforehand from valid
   * durations only. `null` means that no valid duration exists: the widget then
   * shows that the data is unavailable instead of displaying zero.
   */
  averageMinutes: number | null;
  /**
   * Loading state of the value. Defaults to `ready`; the `empty` state is
   * derived from `averageMinutes`.
   */
  status?: Exclude<DashboardWidgetStatus, 'empty'>;
}

const minutesFormatter = new Intl.NumberFormat('fr-FR', {
  maximumFractionDigits: 0,
});

export default function AverageDurationWidget({
  averageMinutes,
  status = 'ready',
}: AverageDurationWidgetProps) {
  const hasValue = averageMinutes !== null && Number.isFinite(averageMinutes);

  return (
    <DashboardWidget
      title="Durée moyenne"
      status={status === 'ready' && !hasValue ? 'empty' : status}
    >
      {hasValue && (
        <p className="dashboard-widget-value">
          <strong>{minutesFormatter.format(averageMinutes)}</strong>{' '}
          <abbr title="minutes">min</abbr>
        </p>
      )}
    </DashboardWidget>
  );
}
