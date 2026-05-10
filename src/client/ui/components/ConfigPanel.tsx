import { useState } from 'react';
import type { SubredditConfig } from '../../../shared/dto/modsignal';

interface Props {
  config: SubredditConfig;
  onSave: (updates: Partial<SubredditConfig>) => void;
}

export const ConfigPanel = ({ config, onSave }: Props) => {
  const [enabled, setEnabled] = useState(config.enabled);
  const [burstThreshold, setBurstThreshold] = useState(config.burstThreshold);
  const [similarityThreshold, setSimilarityThreshold] = useState(config.similarityThreshold);
  const [windowMinutes, setWindowMinutes] = useState(config.windowMinutes);
  const [cooldownMinutes, setCooldownMinutes] = useState(config.cooldownMinutes);
  const [autoTuneEnabled, setAutoTuneEnabled] = useState(config.autoTuneEnabled);

  const handleSave = () => {
    onSave({ enabled, burstThreshold, similarityThreshold, windowMinutes, cooldownMinutes, autoTuneEnabled });
  };

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-base font-semibold text-gray-900 dark:text-white">Settings</h2>

      <label className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <span className="text-sm text-gray-900 dark:text-white">Enabled</span>
        <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} className="toggle" />
      </label>

      <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <label className="text-sm text-gray-900 dark:text-white">Burst Threshold: {burstThreshold.toFixed(1)}</label>
        <input
          type="range" min="1" max="10" step="0.1"
          value={burstThreshold} onChange={(e) => setBurstThreshold(parseFloat(e.target.value))}
          className="w-full mt-1"
        />
        <p className="text-xs text-gray-500 mt-1">Higher = less sensitive</p>
      </div>

      <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <label className="text-sm text-gray-900 dark:text-white">Similarity Threshold: {similarityThreshold.toFixed(2)}</label>
        <input
          type="range" min="0" max="1" step="0.05"
          value={similarityThreshold} onChange={(e) => setSimilarityThreshold(parseFloat(e.target.value))}
          className="w-full mt-1"
        />
        <p className="text-xs text-gray-500 mt-1">Higher = stricter matching</p>
      </div>

      <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <label className="text-sm text-gray-900 dark:text-white">Window (minutes): {windowMinutes}</label>
        <input
          type="range" min="1" max="30" step="1"
          value={windowMinutes} onChange={(e) => setWindowMinutes(parseInt(e.target.value))}
          className="w-full mt-1"
        />
      </div>

      <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <label className="text-sm text-gray-900 dark:text-white">Cooldown (minutes): {cooldownMinutes}</label>
        <input
          type="range" min="5" max="60" step="5"
          value={cooldownMinutes} onChange={(e) => setCooldownMinutes(parseInt(e.target.value))}
          className="w-full mt-1"
        />
      </div>

      <label className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <span className="text-sm text-gray-900 dark:text-white">Auto-Tune</span>
        <input type="checkbox" checked={autoTuneEnabled} onChange={(e) => setAutoTuneEnabled(e.target.checked)} className="toggle" />
      </label>

      <button
        onClick={handleSave}
        className="w-full py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors"
      >
        Save Settings
      </button>
    </div>
  );
};
