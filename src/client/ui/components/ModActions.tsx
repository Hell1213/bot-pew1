import { useState } from 'react';
import type { ModAction, ModActionEntry } from '../../../shared/dto/modsignal';

interface Props {
  alertId: string;
  actionHistory: readonly ModActionEntry[];
  onAction: (id: string, action: ModAction) => void;
}

const actionDefs: { action: ModAction; label: string; style: string; shortcut: string }[] = [
  { action: 'acknowledge', label: 'Acknowledge', style: 'bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800 dark:hover:bg-blue-900/40', shortcut: 'See it' },
  { action: 'monitor', label: 'Monitor', style: 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800 dark:hover:bg-yellow-900/40', shortcut: 'Watch' },
  { action: 'investigate', label: 'Investigate', style: 'bg-orange-50 text-orange-700 hover:bg-orange-100 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800 dark:hover:bg-orange-900/40', shortcut: 'Dig in' },
  { action: 'escalate', label: 'Escalate', style: 'bg-red-50 text-red-700 hover:bg-red-100 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800 dark:hover:bg-red-900/40', shortcut: 'Flag' },
  { action: 'dismiss', label: 'Resolve', style: 'bg-gray-50 text-gray-600 hover:bg-gray-100 border-gray-200 dark:bg-gray-700/30 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600/40', shortcut: 'Close' },
];

const actionLabels: Record<ModAction, string> = {
  acknowledge: 'Acknowledged',
  monitor: 'Monitoring',
  investigate: 'Investigating',
  escalate: 'Escalated',
  dismiss: 'Resolved',
};

export const ModActions = ({ alertId, actionHistory, onAction }: Props) => {
  const [pending, setPending] = useState<string | null>(null);
  const lastAction = actionHistory[actionHistory.length - 1];
  const takenActions = new Set(actionHistory.map((a) => a.action));

  const handleAction = async (action: ModAction) => {
    setPending(action);
    await onAction(alertId, action);
    setPending(null);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Moderator Action</span>
        {lastAction && (
          <span className="text-[10px] text-gray-400 dark:text-gray-500">
            <span className="font-medium text-gray-600 dark:text-gray-400">{actionLabels[lastAction.action]}</span> by u/{lastAction.by} · {new Date(lastAction.at).toLocaleTimeString()}
          </span>
        )}
      </div>

      <div className="grid grid-cols-5 gap-1">
        {actionDefs.map(({ action, label, style, shortcut }) => {
          const isTaken = takenActions.has(action);
          const isLoading = pending === action;
          return (
            <button
              key={action}
              onClick={() => handleAction(action)}
              disabled={isLoading || isTaken}
              className={`flex flex-col items-center gap-0 py-1.5 rounded-md text-[10px] font-medium border transition-all min-w-0
                ${isTaken
                  ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800 cursor-default opacity-70'
                  : `${style} cursor-pointer`
                }
                ${isLoading ? 'opacity-50 cursor-wait' : ''}
              `}
            >
              <span className="text-xs leading-none mb-0.5">
                {isLoading ? '⏳' : isTaken ? '✓' : ''}
              </span>
              <span className="truncate w-full text-center">{isTaken ? actionLabels[action] : label}</span>
              {!isTaken && !isLoading && (
                <span className="text-[8px] text-gray-400 dark:text-gray-500 leading-none mt-0.5 hidden sm:inline">{shortcut}</span>
              )}
            </button>
          );
        })}
      </div>

      {actionHistory.length > 1 && (
        <details className="group">
          <summary className="text-[9px] text-gray-400 dark:text-gray-500 cursor-pointer hover:text-gray-600 dark:hover:text-gray-400 list-none flex items-center gap-1">
            <span className="text-[8px] transition-transform group-open:rotate-90">▶</span>
            Full audit trail ({actionHistory.length} action{actionHistory.length > 1 ? 's' : ''})
          </summary>
          <div className="mt-1 space-y-0.5">
            {actionHistory.map((entry, i) => (
              <div key={i} className="flex items-center gap-1.5 text-[10px] text-gray-400 dark:text-gray-500">
                <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600 flex-shrink-0" />
                <span className="font-medium text-gray-600 dark:text-gray-400">{actionLabels[entry.action]}</span>
                <span>by u/{entry.by}</span>
                <span>·</span>
                <span>{new Date(entry.at).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
};
