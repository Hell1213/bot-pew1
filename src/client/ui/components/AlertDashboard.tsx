import type { AlertPayload, SubredditRisk } from '../../../shared/dto/modsignal';
import { AlertRow } from './AlertRow';

interface Props {
  alerts: readonly AlertPayload[];
  stats: SubredditRisk | null;
  onDismiss: (id: string) => void;
  onRefresh: () => void;
}

export const AlertDashboard = ({ alerts, stats, onDismiss, onRefresh }: Props) => {
  const activeAlerts = alerts.filter((a) => !a.dismissed);
  const criticalCount = alerts.filter((a) => a.severity === 'critical').length;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-3">
        <div className="flex-1 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{activeAlerts.length}</p>
          <p className="text-sm text-gray-500">Active Alerts</p>
        </div>
        <div className="flex-1 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
          <p className="text-2xl font-bold text-red-600">{criticalCount}</p>
          <p className="text-sm text-gray-500">Critical</p>
        </div>
        <div className="flex-1 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.uniqueUsersFlagged ?? 0}</p>
          <p className="text-sm text-gray-500">Users Flagged</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">Alerts</h2>
        <button onClick={onRefresh} className="text-sm text-blue-500 hover:underline">
          Refresh
        </button>
      </div>

      {activeAlerts.length === 0 ? (
        <div className="flex flex-col items-center py-12 text-gray-400">
          <p className="text-4xl mb-2">✅</p>
          <p>No active alerts. ModSignal is watching.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {activeAlerts.map((alert) => (
            <AlertRow key={alert.id} alert={alert} onDismiss={onDismiss} />
          ))}
        </div>
      )}
    </div>
  );
};
