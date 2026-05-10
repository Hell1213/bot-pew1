import { useState, useEffect } from 'react';
import type { AlertPayload, SubredditConfig, SubredditRisk } from '../../shared/dto/modsignal';
import { AlertDashboard } from './components/AlertDashboard';
import { ConfigPanel } from './components/ConfigPanel';

type Tab = 'dashboard' | 'config';

export const ModSignalPost = () => {
  const [tab, setTab] = useState<Tab>('dashboard');
  const [alerts, setAlerts] = useState<AlertPayload[]>([]);
  const [config, setConfig] = useState<SubredditConfig | null>(null);
  const [stats, setStats] = useState<SubredditRisk | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [alertsRes, configRes, statsRes] = await Promise.all([
        fetch('/api/alerts'),
        fetch('/api/config'),
        fetch('/api/stats'),
      ]);
      if (!alertsRes.ok || !configRes.ok || !statsRes.ok) {
        throw new Error('Failed to fetch data');
      }
      const alertsData = await alertsRes.json();
      const configData = await configRes.json();
      const statsData = await statsRes.json();
      setAlerts(alertsData.alerts ?? []);
      setConfig(configData);
      setStats(statsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleDismiss = async (alertId: string) => {
    try {
      const res = await fetch(`/api/alerts/${alertId}/dismiss`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dismissedBy: 'mod' }),
      });
      if (res.ok) {
        setAlerts((prev) => prev.filter((a) => a.id !== alertId));
      }
    } catch (err) {
      console.error('Failed to dismiss alert', err);
    }
  };

  const handleConfigSave = async (updates: Partial<SubredditConfig>) => {
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
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-white dark:bg-gray-900">
        <p className="text-gray-500">Loading ModSignal...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-white dark:bg-gray-900 gap-4">
        <p className="text-red-500">Error: {error}</p>
        <button onClick={fetchData} className="px-4 py-2 bg-blue-500 text-white rounded">Retry</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-gray-900">
      <header className="flex items-center px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <h1 className="text-lg font-bold text-gray-900 dark:text-white">ModSignal</h1>
        <nav className="flex gap-2 ml-auto">
          <button
            onClick={() => setTab('dashboard')}
            className={`px-3 py-1 rounded text-sm ${tab === 'dashboard' ? 'bg-blue-500 text-white' : 'text-gray-600 dark:text-gray-300'}`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setTab('config')}
            className={`px-3 py-1 rounded text-sm ${tab === 'config' ? 'bg-blue-500 text-white' : 'text-gray-600 dark:text-gray-300'}`}
          >
            Config
          </button>
        </nav>
      </header>

      <main className="flex-1 p-4">
        {tab === 'dashboard' && (
          <AlertDashboard
            alerts={alerts}
            stats={stats}
            onDismiss={handleDismiss}
            onRefresh={fetchData}
          />
        )}
        {tab === 'config' && config && (
          <ConfigPanel config={config} onSave={handleConfigSave} />
        )}
      </main>
    </div>
  );
};
