import { useState } from 'react';
import type { AlertPayload, ModAction } from '../../../shared/dto/modsignal';
import { ExplainabilityPanel } from './ExplainabilityPanel';
import { ModActions } from './ModActions';

interface Props {
  alert: AlertPayload;
  onAction: (id: string, action: ModAction) => void;
}

const severityConfig = {
  critical: { bar: 'bg-red-600', badge: 'bg-red-600 text-white', label: 'CRITICAL', score: 'text-red-600 dark:text-red-400', scoreBg: 'bg-red-50 dark:bg-red-900/20' },
  high: { bar: 'bg-orange-500', badge: 'bg-orange-500 text-white', label: 'HIGH', score: 'text-orange-600 dark:text-orange-400', scoreBg: 'bg-orange-50 dark:bg-orange-900/20' },
  medium: { bar: 'bg-yellow-500', badge: 'bg-yellow-500 text-white', label: 'MEDIUM', score: 'text-yellow-600 dark:text-yellow-400', scoreBg: 'bg-yellow-50 dark:bg-yellow-900/20' },
  low: { bar: 'bg-blue-500', badge: 'bg-blue-500 text-white', label: 'LOW', score: 'text-blue-600 dark:text-blue-400', scoreBg: 'bg-blue-50 dark:bg-blue-900/20' },
};

const incidentTitle = (type: string): string => {
  const titles: Record<string, string> = {
    burst: 'Activity Burst Detected',
    brigade: 'Coordinated Raid Detected',
    ban_evasion: 'Potential Ban Evasion',
    spam_raid: 'Spam Campaign Detected',
  };
  return titles[type] ?? 'Suspicious Activity Detected';
};

const timeAgo = (ts: number): string => {
  const diff = Date.now() - ts;
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
};

const getWorkflowState = (alert: AlertPayload): { label: string; color: string; dot: string } => {
  const last = alert.actionHistory[alert.actionHistory.length - 1];
  if (!last) return { label: 'Open', color: 'text-green-600 dark:text-green-400', dot: 'bg-green-500' };
  if (last.action === 'acknowledge') return { label: 'Acknowledged', color: 'text-blue-600 dark:text-blue-400', dot: 'bg-blue-500' };
  if (last.action === 'monitor') return { label: 'Monitoring', color: 'text-yellow-600 dark:text-yellow-400', dot: 'bg-yellow-500' };
  if (last.action === 'investigate') return { label: 'Investigating', color: 'text-orange-600 dark:text-orange-400', dot: 'bg-orange-500' };
  if (last.action === 'escalate') return { label: 'Escalated', color: 'text-red-600 dark:text-red-400', dot: 'bg-red-500' };
  if (last.action === 'dismiss') return { label: 'Resolved', color: 'text-gray-500', dot: 'bg-gray-400' };
  return { label: 'Open', color: 'text-green-600 dark:text-green-400', dot: 'bg-green-500' };
};

const evidenceLines = (alert: AlertPayload): string[] => {
  const lines: string[] = [];
  const e = alert.explainability;
  if (e) {
    if (e.burstAnomalyScore > 0) lines.push(`Activity spike ${Math.round(e.burstAnomalyScore)}% above baseline`);
    if (e.clusterCount > 0) lines.push(`${e.clusterCount} coordinated account cluster${e.clusterCount > 1 ? 's' : ''} detected`);
    if (e.suspiciousAccountRatio > 0.3) lines.push(`${Math.round(e.suspiciousAccountRatio * 100)}% of accounts are low-trust`);
  }
  if (alert.affectedUsers.length > 0) lines.push(`${alert.affectedUsers.length} affected account${alert.affectedUsers.length > 1 ? 's' : ''}`);
  return lines.length > 0 ? lines : ['Anomalous activity pattern detected'];
};

export const AlertCard = ({ alert, onAction }: Props) => {
  const [expanded, setExpanded] = useState(false);
  const config = severityConfig[alert.severity];
  const workflow = getWorkflowState(alert);
  const evidence = evidenceLines(alert);
  const isOpen = workflow.label === 'Open';

  return (
    <div className={`border rounded-lg overflow-hidden bg-white dark:bg-gray-800 transition-shadow ${isOpen ? 'shadow-sm border-gray-200 dark:border-gray-700 hover:shadow-md' : 'shadow-none border-gray-100 dark:border-gray-700/50 opacity-80'}`}>
      <div className="flex">
        <div className={`w-1 flex-shrink-0 ${config.bar}`} />

        <div className="flex-1 min-w-0">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-start w-full px-3 py-2.5 text-left hover:bg-gray-50/50 dark:hover:bg-gray-750/30 transition-colors gap-2.5"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className={`text-[11px] px-1.5 py-0.5 rounded font-bold ${config.badge}`}>
                  {config.label}
                </span>
                <span className={`text-[11px] px-1.5 py-0.5 rounded font-medium flex items-center gap-1 ${workflow.color} bg-gray-50 dark:bg-gray-700/50`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${workflow.dot}`} />
                  {workflow.label}
                </span>
                <span className="text-[11px] text-gray-400 dark:text-gray-500">
                  {timeAgo(alert.timestamp)}
                </span>
              </div>

              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mt-1">
                {incidentTitle(alert.type)}
              </h3>

              <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                {evidence.map((line, i) => (
                  <span key={i} className="flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
                    {line}
                  </span>
                ))}
              </div>

              {alert.actionHistory.length > 0 && (() => {
                const last = alert.actionHistory[alert.actionHistory.length - 1]!;
                return (
                  <div className="mt-1 text-[10px] text-gray-400 dark:text-gray-500">
                    Latest: {last.action} by u/{last.by} {timeAgo(last.at)}
                  </div>
                );
              })()}
            </div>

            <div className={`flex-shrink-0 flex flex-col items-center justify-center w-10 h-10 rounded-lg ${config.scoreBg}`}>
              <div className={`text-sm font-bold leading-none ${config.score}`}>
                {alert.score}
              </div>
              <div className="text-[9px] text-gray-400 dark:text-gray-500 leading-none mt-0.5">conf</div>
            </div>
          </button>

          {expanded && (
            <div className="border-t border-gray-100 dark:border-gray-700">
              <div className="px-3 py-2.5 space-y-2.5">
                <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
                  <div>
                    <span className="text-gray-400 dark:text-gray-500 text-[10px]">Incident type</span>
                    <p className="text-gray-800 dark:text-gray-200 capitalize font-medium">{alert.type.replace(/_/g, ' ')}</p>
                  </div>
                  <div>
                    <span className="text-gray-400 dark:text-gray-500 text-[10px]">Confidence</span>
                    <div className="flex items-center gap-1.5">
                      <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${alert.score >= 60 ? 'bg-red-500' : alert.score >= 35 ? 'bg-orange-500' : 'bg-blue-500'}`}
                          style={{ width: `${alert.score}%` }} />
                      </div>
                      <span className="text-gray-800 dark:text-gray-200 font-medium">{alert.score}%</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-400 dark:text-gray-500 text-[10px]">Detected</span>
                    <p className="text-gray-800 dark:text-gray-200">{new Date(alert.timestamp).toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-gray-400 dark:text-gray-500 text-[10px]">Related posts</span>
                    <p className="text-gray-800 dark:text-gray-200">{alert.relatedPosts.length} post{alert.relatedPosts.length !== 1 ? 's' : ''}</p>
                  </div>
                </div>

                {alert.affectedUsers.length > 0 && (
                  <div>
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 block mb-1">Affected accounts ({alert.affectedUsers.length})</span>
                    <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                      {alert.affectedUsers.slice(0, 20).map((user) => (
                        <span key={user.userId} className={`text-[11px] px-1.5 py-0.5 rounded font-medium ${user.karmaScore < 100 ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300' : 'bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300'}`}>
                          u/{user.username}
                          <span className="text-gray-400 dark:text-gray-500 ml-1">{Math.round(user.accountAgeDays)}d</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {alert.explainability && <ExplainabilityPanel data={alert.explainability} />}

                <ModActions alertId={alert.id} actionHistory={alert.actionHistory} onAction={onAction} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
