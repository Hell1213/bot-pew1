import type { ExplainabilityData } from '../../../shared/dto/modsignal';

interface Props {
  data: ExplainabilityData;
}

const humanScore = (score: number): { label: string; color: string } => {
  if (score >= 70) return { label: 'Strong signal', color: 'text-red-600 dark:text-red-400' };
  if (score >= 40) return { label: 'Moderate signal', color: 'text-orange-600 dark:text-orange-400' };
  return { label: 'Weak signal', color: 'text-gray-500' };
};

export const ExplainabilityPanel = ({ data }: Props) => {
  const overall = humanScore(data.burstAnomalyScore);

  const evidence: { icon: string; label: string; detail: string }[] = [
    data.burstAnomalyScore > 0 ? {
      icon: '📈',
      label: 'Activity spike',
      detail: `Posting volume is ${data.burstZScore.toFixed(1)}× higher than normal community baseline`,
    } : null,
    data.clusterCount > 0 ? {
      icon: '👥',
      label: 'Coordinated behavior',
      detail: `${data.clusterCount} group${data.clusterCount > 1 ? 's' : ''} of accounts show unusually similar behavior (${Math.round(data.clusterConfidence)}% similarity confidence)`,
    } : null,
    data.suspiciousAccountRatio > 0.3 ? {
      icon: '⚠️',
      label: 'Low-trust accounts',
      detail: `${Math.round(data.suspiciousAccountRatio * 100)}% of involved accounts have low karma or are recently created`,
    } : null,
    data.temporalAnomaly ? {
      icon: '⏰',
      label: 'Time anomaly',
      detail: 'Activity is concentrated in an unusually short window, suggesting coordinated timing',
    } : null,
  ].filter(Boolean) as { icon: string; label: string; detail: string }[];

  return (
    <div className="bg-amber-50/50 dark:bg-amber-900/10 border border-amber-200/50 dark:border-amber-700/30 rounded-lg p-3 space-y-2.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Detection Signals</span>
        <span className={`text-[10px] font-semibold ${overall.color}`}>{overall.label}</span>
      </div>

      <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
        {data.summary}
      </p>

      <div className="space-y-1.5">
        {evidence.map((item, i) => (
          <div key={i} className="flex gap-2 text-xs">
            <span className="flex-shrink-0 mt-0.5">{item.icon}</span>
            <div>
              <span className="font-medium text-gray-700 dark:text-gray-300">{item.label}</span>
              <p className="text-gray-500 dark:text-gray-400 text-[11px] leading-relaxed">{item.detail}</p>
            </div>
          </div>
        ))}
      </div>

      <div>
        <span className="text-[10px] text-gray-400 dark:text-gray-500 block mb-1">How confidence is calculated</span>
        <div className="flex h-1.5 rounded-full overflow-hidden">
          <div className="bg-red-400" style={{ width: `${data.scoringComposition.burstWeight}%` }} title="Activity spike" />
          <div className="bg-orange-400" style={{ width: `${data.scoringComposition.newAccountWeight}%` }} title="New account activity" />
          <div className="bg-blue-400" style={{ width: `${data.scoringComposition.fingerprintWeight}%` }} title="Account fingerprinting" />
          <div className="bg-purple-400" style={{ width: `${data.scoringComposition.clusterWeight}%` }} title="Behavioral clustering" />
        </div>
        <div className="flex flex-wrap gap-x-2.5 gap-y-0.5 mt-1">
          {[
            { color: 'bg-red-400', label: 'Volume spike' },
            { color: 'bg-orange-400', label: 'New accounts' },
            { color: 'bg-blue-400', label: 'Account analysis' },
            { color: 'bg-purple-400', label: 'Pattern matching' },
          ].map((item) => (
            <span key={item.label} className="flex items-center gap-1 text-[10px] text-gray-400 dark:text-gray-500">
              <span className={`w-1.5 h-1.5 rounded-full ${item.color}`} />
              {item.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
