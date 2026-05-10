import type { AlertPayload } from '../../../shared/dto/modsignal';

interface Props {
  alert: AlertPayload;
  onDismiss: (id: string) => void;
}

export const AlertDetail = ({ alert, onDismiss }: Props) => {
  return (
    <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
      <div className="grid grid-cols-2 gap-3 text-sm mb-3">
        <div>
          <p className="text-gray-500">Type</p>
          <p className="text-gray-900 dark:text-white capitalize">{alert.type.replace('_', ' ')}</p>
        </div>
        <div>
          <p className="text-gray-500">Score</p>
          <p className="text-gray-900 dark:text-white">{alert.score}/100</p>
        </div>
        <div>
          <p className="text-gray-500">Users</p>
          <p className="text-gray-900 dark:text-white">{alert.affectedUsers.length}</p>
        </div>
        <div>
          <p className="text-gray-500">Time</p>
          <p className="text-gray-900 dark:text-white">{new Date(alert.timestamp).toLocaleTimeString()}</p>
        </div>
      </div>

      <div className="mb-3">
        <p className="text-xs text-gray-500 mb-1">Reason Codes</p>
        <div className="flex flex-wrap gap-1">
          {alert.reasonCodes.map((code) => (
            <span key={code} className="text-xs px-2 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-gray-700 dark:text-gray-300">
              {code}
            </span>
          ))}
        </div>
      </div>

      {alert.affectedUsers.length > 0 && (
        <div className="mb-3">
          <p className="text-xs text-gray-500 mb-1">Affected Users</p>
          <div className="flex flex-col gap-1 max-h-32 overflow-y-auto">
            {alert.affectedUsers.slice(0, 10).map((user) => (
              <div key={user.userId} className="flex items-center justify-between text-xs px-2 py-1 bg-white dark:bg-gray-700 rounded">
                <span className="text-gray-900 dark:text-white">u/{user.username}</span>
                <span className="text-gray-500">age: {Math.round(user.accountAgeDays)}d</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={() => onDismiss(alert.id)}
        className="w-full py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900 rounded transition-colors"
      >
        Dismiss Alert
      </button>
    </div>
  );
};
