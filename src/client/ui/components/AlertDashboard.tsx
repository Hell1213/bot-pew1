import { useState } from 'react';
import type { AlertPayload, ModAction } from '../../../shared/dto/modsignal';
import { AlertCard } from './AlertCard';

interface Props {
  alerts: readonly AlertPayload[];
  onAction: (id: string, action: ModAction) => Promise<void>;
  onRefresh: () => void;
  loading: boolean;
  scanTimeDisplay: string | null;
}

const workflowStates = [
  { key: 'open', label: 'Open' },
  { key: 'acknowledged', label: 'Acknowledged' },
  { key: 'investigating', label: 'Investigating' },
  { key: 'resolved', label: 'Resolved' },
] as const;

const getWorkflowState = (alert: AlertPayload): string => {
  const last = alert.actionHistory[alert.actionHistory.length - 1];
  if (!last) return 'open';
  if (last.action === 'dismiss') return 'resolved';
  if (last.action === 'escalate') return 'investigating';
  return last.action;
};

export const AlertDashboard = ({ alerts, onAction, onRefresh, loading, scanTimeDisplay }: Props) => {
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterWorkflow, setFilterWorkflow] = useState<string>('open');

  const activeAlerts = alerts.filter((a) => {
    const state = getWorkflowState(a);
    return state !== 'resolved';
  });

  const criticalCount = activeAlerts.filter((a) => a.severity === 'critical').length;
  const highCount = activeAlerts.filter((a) => a.severity === 'high').length;

  const filtered = activeAlerts.filter((a) => {
    if (filterSeverity !== 'all' && a.severity !== filterSeverity) return false;
    if (filterWorkflow === 'open') return getWorkflowState(a) === 'open';
    if (filterWorkflow === 'resolved') return getWorkflowState(a) === 'resolved';
    if (filterWorkflow === 'acknowledged') return getWorkflowState(a) === 'acknowledge';
    if (filterWorkflow === 'investigating') return ['investigate', 'escalate', 'monitor'].includes(getWorkflowState(a));
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    const order = { critical: 0, high: 1, medium: 2, low: 3 };
    return (order[a.severity] ?? 99) - (order[b.severity] ?? 99) || b.timestamp - a.timestamp;
  });

  const lastScanAgo = scanTimeDisplay;

  if (loading && alerts.length === 0) {
    return (
      <div className="space-y-2 animate-pulse">
        <div className="h-10 bg-gray-100 dark:bg-gray-800 rounded-lg" />
        <div className="flex gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex-1 h-16 bg-gray-100 dark:bg-gray-800 rounded-lg" />
          ))}
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-28 bg-gray-100 dark:bg-gray-800 rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            Monitoring Active
          </span>
          {lastScanAgo && (
            <span>Last scan: {lastScanAgo}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {criticalCount > 0 && (
            <span className="text-xs px-1.5 py-0.5 bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300 rounded font-semibold">
              {criticalCount} critical
            </span>
          )}
          <button
            onClick={onRefresh}
            disabled={loading}
            className="text-xs px-2 py-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors disabled:opacity-50"
          >
            {loading ? '↻' : '↻ Refresh'}
          </button>
        </div>
      </div>

      <div className="flex gap-2">
        <div className="flex-1 px-3 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 min-w-0">
          <p className="text-lg font-bold text-gray-900 dark:text-white leading-tight">{activeAlerts.length}</p>
          <p className="text-[10px] text-gray-500">Open Incidents</p>
        </div>
        <div className={`flex-1 px-3 py-2 rounded-lg border min-w-0 ${criticalCount > 0 ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/50' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'}`}>
          <p className={`text-lg font-bold leading-tight ${criticalCount > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>{criticalCount}</p>
          <p className={`text-[10px] ${criticalCount > 0 ? 'text-red-500' : 'text-gray-500'}`}>Critical</p>
          {highCount > 0 && <p className="text-[10px] text-orange-500 leading-none">+{highCount} high</p>}
        </div>
        <div className="flex-1 px-3 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 min-w-0">
          <p className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
            {activeAlerts.reduce((s, a) => s + a.affectedUsers.length, 0)}
          </p>
          <p className="text-[10px] text-gray-500">Accounts</p>
        </div>
      </div>

      <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
        {workflowStates.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilterWorkflow(key)}
            className={`text-xs px-2.5 py-1 rounded-full font-medium whitespace-nowrap transition-colors ${
              filterWorkflow === key
                ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            {label}
            {key === 'open' && activeAlerts.length > 0 && (
              <span className="ml-1 text-[10px] opacity-70">({activeAlerts.length})</span>
            )}
          </button>
        ))}
        <span className="mx-1 text-gray-300 dark:text-gray-600">|</span>
        {['all', 'critical', 'high', 'medium'].map((f) => (
          <button
            key={f}
            onClick={() => setFilterSeverity(f)}
            className={`text-xs px-2 py-1 rounded font-medium transition-colors ${
              filterSeverity === f
                ? 'text-gray-900 dark:text-white underline underline-offset-2'
                : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400'
            }`}
          >
            {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {sorted.length === 0 ? (
        <div className="flex flex-col items-center py-12 text-gray-400 dark:text-gray-500">
          <div className="w-12 h-12 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center mb-3">
            <span className="text-2xl">🛡️</span>
          </div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {filterWorkflow !== 'open' ? `No ${filterWorkflow} incidents` : 'No active abuse signals detected'}
          </p>
          <p className="text-xs mt-1 text-center max-w-[260px] text-gray-400 dark:text-gray-500">
            ModSignal is actively monitoring community behavior. New incidents will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {sorted.map((alert) => (
            <AlertCard key={alert.id} alert={alert} onAction={onAction} />
          ))}
        </div>
      )}
    </div>
  );
};
