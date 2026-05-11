import { useState } from 'react';
import type { DemoScenario } from '../../../shared/dto/modsignal';

interface Props {
  onRefresh: () => void;
}

const scenarios: { key: DemoScenario; label: string; description: string; icon: string }[] = [
  { key: 'normal', label: 'Normal Traffic', description: 'Regular community activity', icon: '📊' },
  { key: 'spam_wave', label: 'Spam Wave', description: '80+ low-quality posts', icon: '🌊' },
  { key: 'coordinated_raid', label: 'Coordinated Raid', description: '40 posts, 4 accounts', icon: '⚔️' },
  { key: 'suspicious_swarm', label: 'Suspicious Swarm', description: '60 posts, 15 accounts', icon: '🐝' },
  { key: 'reset', label: 'Reset Demo', description: 'Clear all simulated alerts', icon: '🔄' },
];

export const DemoControls = ({ onRefresh }: Props) => {
  const [open, setOpen] = useState(false);
  const [running, setRunning] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  const runScenario = async (scenario: DemoScenario) => {
    setRunning(scenario);
    setResult(null);
    try {
      const res = await fetch('/api/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario }),
      });
      const data = await res.json();
      if (data.status === 'simulated') {
        setResult(`Generated ${data.eventsGenerated} events → ${data.alertsCreated} alert(s)`);
      } else if (scenario === 'reset') {
        setResult('All demo alerts cleared');
      }
      onRefresh();
    } catch {
      setResult('Simulation failed');
    } finally {
      setRunning(null);
    }
  };

  return (
    <details className="group" open={open} onToggle={(e) => setOpen(e.currentTarget.open)}>
      <summary className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 cursor-pointer list-none py-1 border-b border-dashed border-gray-200 dark:border-gray-700 mb-0">
        <span className="text-[10px] transition-transform group-open:rotate-90">▶</span>
        <span className="text-[10px]">🧪</span>
        Developer Testing Tools
        {open && <span className="text-[9px] text-gray-400 ml-auto">for hackathon evaluation</span>}
      </summary>
      <div className="mt-2 space-y-2">
        <p className="text-[10px] text-gray-500 dark:text-gray-400">Simulate scenarios to test detection:</p>
        <div className="grid grid-cols-2 gap-1.5">
          {scenarios.map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => runScenario(key)}
              disabled={running !== null}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs border transition-all ${
                running === key
                  ? 'border-orange-300 bg-orange-50 dark:border-orange-700 dark:bg-orange-900/20 animate-pulse'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
              } ${running !== null && running !== key ? 'opacity-40' : ''}`}
            >
              <span className="text-sm">{running === key ? '⏳' : icon}</span>
              <span className="font-medium text-gray-700 dark:text-gray-300">{label}</span>
            </button>
          ))}
        </div>
        {result && (
          <div className="text-[10px] text-center text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 rounded px-2 py-1 border border-gray-200 dark:border-gray-700">
            {result}
          </div>
        )}
      </div>
    </details>
  );
};
