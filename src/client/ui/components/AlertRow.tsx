import { useState } from 'react';
import type { AlertPayload } from '../../../shared/dto/modsignal';
import { AlertDetail } from './AlertDetail';

interface Props {
  alert: AlertPayload;
  onDismiss: (id: string) => void;
}

const severityColors: Record<string, string> = {
  critical: 'bg-red-500',
  high: 'bg-orange-500',
  medium: 'bg-yellow-500',
  low: 'bg-blue-500',
};

const severityBadge: Record<string, string> = {
  critical: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  high: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  low: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
};

export const AlertRow = ({ alert, onDismiss }: Props) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
      >
        <div className={`w-2 h-2 rounded-full mr-3 ${severityColors[alert.severity] ?? 'bg-gray-400'}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${severityBadge[alert.severity] ?? ''}`}>
              {alert.severity.toUpperCase()}
            </span>
            <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
              {alert.type.replace('_', ' ')}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {alert.score}/100 • {alert.affectedUsers.length} users • {alert.reasonCodes.slice(0, 2).join(', ')}
          </p>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onDismiss(alert.id); }}
          className="ml-2 px-2 py-1 text-xs text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900 rounded transition-colors"
        >
          Dismiss
        </button>
      </button>
      {expanded && <AlertDetail alert={alert} onDismiss={onDismiss} />}
    </div>
  );
};
