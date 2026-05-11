import { useState, useEffect, useCallback, useRef } from 'react';
import type { AlertPayload, SubredditConfig, ModAction, ModActionEntry } from '../../shared/dto/modsignal';
import { AlertDashboard } from './components/AlertDashboard';
import { ConfigPanel } from './components/ConfigPanel';
import { DemoControls } from './components/DemoControls';

type Tab = 'dashboard' | 'config';

export const ModSignalPost = () => {
  const [tab, setTab] = useState<Tab>('dashboard');
  const [alerts, setAlerts] = useState<AlertPayload[]>([]);
  const [config, setConfig] = useState<SubredditConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionPending, setActionPending] = useState<Set<string>>(new Set());
  const [lastScanTime, setLastScanTime] = useState<number | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    setError(null);
    try {
      const [alertsRes, configRes] = await Promise.all([
        fetch('/api/alerts'),
        fetch('/api/config'),
      ]);
      if (!alertsRes.ok || !configRes.ok) {
        throw new Error('Failed to fetch data');
      }
      const alertsData = await alertsRes.json();
      const configData = await configRes.json();
      setAlerts(alertsData.alerts ?? []);
      setConfig(configData);
      setLastScanTime(Date.now());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData(true);
    pollingRef.current = setInterval(() => void fetchData(false), 30000);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [fetchData]);

  const scanTimeDisplay = lastScanTime
    ? (() => {
      const diff = Date.now() - lastScanTime;
      if (diff < 60000) return 'just now';
      if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
      return `${Math.floor(diff / 3600000)}h ago`;
    })()
    : null;

  const handleAction = useCallback(async (alertId: string, action: ModAction): Promise<void> => {
    if (actionPending.has(alertId)) return;
    setActionPending((prev) => new Set(prev).add(alertId));
    try {
      const res = await fetch(`/api/alerts/${alertId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, by: 'mod' }),
      });
      if (res.ok) {
        const data = await res.json();
        setAlerts((prev) => prev.map((a) => a.id === alertId ? (data.alert ?? { ...a, actionHistory: [...a.actionHistory, { action, by: 'mod', at: Date.now() } as ModActionEntry] }) : a));
      }
    } catch (err) {
      console.error('Failed to submit action', err);
    } finally {
      setActionPending((prev) => { const next = new Set(prev); next.delete(alertId); return next; });
    }
  }, [actionPending]);

  const handleConfigSave = useCallback(async (updates: Partial<SubredditConfig>): Promise<void> => {
    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        const updated = await res.json();
        setConfig(updated);
      }
    } catch (err) {
      console.error('Failed to save config', err);
    }
  }, []);

  if (loading && alerts.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-white dark:bg-gray-900 gap-3 px-4">
        <div className="w-6 h-6 border-2 border-gray-200 dark:border-gray-600 border-t-[#d93900] rounded-full animate-spin" />
        <p className="text-xs text-gray-400">Loading ModSignal...</p>
      </div>
    );
  }

  if (error && alerts.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-white dark:bg-gray-900 gap-3 px-6">
        <div className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
          <span className="text-lg">⚠️</span>
        </div>
        <p className="text-sm text-red-600 dark:text-red-400 text-center">Could not connect</p>
        <p className="text-xs text-gray-400 text-center">{error}</p>
        <button
          onClick={() => fetchData(true)}
          className="px-4 py-1.5 bg-[#d93900] text-white text-xs rounded-full font-medium hover:bg-[#c23300] transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-gray-900">
      <header className="sticky top-0 z-10 border-b border-gray-200 dark:border-gray-700 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm">
        <div className="flex items-center px-3 py-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-sm">🛡️</span>
            <h1 className="text-sm font-bold text-gray-900 dark:text-white">ModSignal</h1>
          </div>
          <nav className="flex gap-0.5 ml-auto">
            <button
              onClick={() => setTab('dashboard')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                tab === 'dashboard'
                  ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Incidents
            </button>
            <button
              onClick={() => setTab('config')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                tab === 'config'
                  ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Settings
            </button>
          </nav>
        </div>
        <div className="flex items-center gap-2 px-3 pb-2 text-[10px] text-gray-400 dark:text-gray-500">
          <span className="flex items-center gap-1">
            <span className={`w-1.5 h-1.5 rounded-full ${error ? 'bg-red-400' : 'bg-green-400'}`} />
            {error ? 'Disconnected' : 'Active'}
          </span>
          {scanTimeDisplay && (
            <span>· Last check: {scanTimeDisplay}</span>
          )}
          {config && (
            <span>
              · Profile: {(() => {
                const match = [['conservative', 5], ['balanced', 3], ['aggressive', 1.5]].find(([, t]) => t === config.burstThreshold);
                return match ? (match[0] as string).charAt(0).toUpperCase() + (match[0] as string).slice(1) : 'Custom';
              })()}
            </span>
          )}
        </div>
      </header>

      <main className="flex-1 px-3 py-3 space-y-3">
        {tab === 'dashboard' && (
          <>
            <DemoControls onRefresh={() => fetchData(false)} />
            <AlertDashboard
              alerts={alerts}
              onAction={handleAction}
              onRefresh={() => fetchData(false)}
              loading={loading}
              scanTimeDisplay={scanTimeDisplay}
            />
          </>
        )}
        {tab === 'config' && config && (
          <ConfigPanel config={config} onSave={handleConfigSave} />
        )}
      </main>
    </div>
  );
};
