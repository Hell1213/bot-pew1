import { useState } from 'react';
import type { SubredditConfig, ConfigPreset } from '../../../shared/dto/modsignal';
import { CONFIG_PRESETS } from '../../../shared/dto/modsignal';

interface Props {
  config: SubredditConfig;
  onSave: (updates: Partial<SubredditConfig>) => Promise<void>;
}

const presetInfo: Record<ConfigPreset, { icon: string }> = {
  conservative: { icon: '🛡️' },
  balanced: { icon: '⚖️' },
  aggressive: { icon: '🔍' },
};

export const ConfigPanel = ({ config, onSave }: Props) => {
  const [enabled, setEnabled] = useState(config.enabled);
  const [selectedPreset, setSelectedPreset] = useState<ConfigPreset | null>(
    (Object.entries(CONFIG_PRESETS) as [ConfigPreset, typeof CONFIG_PRESETS['conservative']][]).find(
      ([, p]) =>
        p.burstThreshold === config.burstThreshold &&
        p.similarityThreshold === config.similarityThreshold &&
        p.windowMinutes === config.windowMinutes &&
        p.cooldownMinutes === config.cooldownMinutes
    )?.[0] ?? null
  );
  const [burstThreshold, setBurstThreshold] = useState(config.burstThreshold);
  const [similarityThreshold, setSimilarityThreshold] = useState(config.similarityThreshold);
  const [windowMinutes, setWindowMinutes] = useState(config.windowMinutes);
  const [cooldownMinutes, setCooldownMinutes] = useState(config.cooldownMinutes);
  const [autoTuneEnabled, setAutoTuneEnabled] = useState(config.autoTuneEnabled);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const applyPreset = (preset: ConfigPreset) => {
    const p = CONFIG_PRESETS[preset];
    setSelectedPreset(preset);
    setBurstThreshold(p.burstThreshold);
    setSimilarityThreshold(p.similarityThreshold);
    setWindowMinutes(p.windowMinutes);
    setCooldownMinutes(p.cooldownMinutes);
  };

  const handleSave = async () => {
    setSaving(true);
    await onSave({ enabled, burstThreshold, similarityThreshold, windowMinutes, cooldownMinutes, autoTuneEnabled });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Detection Settings</h2>
        <div className="flex items-center gap-2">
          {saved && <span className="text-[11px] text-green-600 dark:text-green-400">Saved</span>}
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-3 py-1 bg-[#d93900] text-white text-xs rounded-full font-medium hover:bg-[#c23300] transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between px-3 py-2.5 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div>
          <span className="text-xs font-medium text-gray-900 dark:text-white">ModSignal</span>
          <p className="text-[10px] text-gray-500 mt-0.5">Monitor for suspicious activity</p>
        </div>
        <div
          onClick={() => setEnabled(!enabled)}
          className={`relative w-9 h-5 rounded-full transition-colors cursor-pointer ${enabled ? 'bg-[#d93900]' : 'bg-gray-300 dark:bg-gray-600'}`}
        >
          <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${enabled ? 'translate-x-4.5' : 'translate-x-0.5'}`} />
        </div>
      </div>

      <div>
        <span className="text-xs font-semibold text-gray-900 dark:text-white block mb-1.5">Detection Profile</span>
        <p className="text-[10px] text-gray-500 mb-2">How sensitive should detection be? Match this to your community&apos;s activity level.</p>
        <div className="space-y-1.5">
          {(Object.entries(CONFIG_PRESETS) as [ConfigPreset, typeof CONFIG_PRESETS['conservative']][]).map(([key, preset]) => {
            const info = presetInfo[key];
            return (
              <button
                key={key}
                onClick={() => applyPreset(key)}
                className={`w-full flex items-center gap-3 p-2.5 rounded-lg border text-left transition-all ${
                  selectedPreset === key
                    ? 'border-[#d93900] bg-orange-50 dark:bg-orange-900/15'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800'
                }`}
              >
                <span className="text-base flex-shrink-0">{info.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-gray-900 dark:text-white">{preset.label}</span>
                    {selectedPreset === key && (
                      <span className="text-[9px] text-[#d93900] dark:text-orange-400 font-medium">Active</span>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight">{preset.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <details className="group">
        <summary className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 cursor-pointer list-none py-1">
          <span className="text-[8px] transition-transform group-open:rotate-90">▶</span>
          Advanced tuning
        </summary>
        <div className="mt-2 space-y-2 pl-2 border-l-2 border-gray-200 dark:border-gray-700">
          <div className="px-3 py-2.5 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <label className="text-xs font-medium text-gray-900 dark:text-white">Activity Spike Sensitivity: {burstThreshold.toFixed(1)}</label>
            <input type="range" min="0.5" max="10" step="0.1" value={burstThreshold}
              onChange={(e) => { setBurstThreshold(parseFloat(e.target.value)); setSelectedPreset(null); }}
              className="w-full mt-1 accent-[#d93900]" />
            <p className="text-[10px] text-gray-500 mt-0.5">Lower = more sensitive to spikes. Adjust if you get too many or too few alerts.</p>
          </div>

          <div className="px-3 py-2.5 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <label className="text-xs font-medium text-gray-900 dark:text-white">Behavior Similarity: {similarityThreshold.toFixed(2)}</label>
            <input type="range" min="0.1" max="1" step="0.05" value={similarityThreshold}
              onChange={(e) => { setSimilarityThreshold(parseFloat(e.target.value)); setSelectedPreset(null); }}
              className="w-full mt-1 accent-[#d93900]" />
            <p className="text-[10px] text-gray-500 mt-0.5">How closely accounts must match to be grouped. Higher = more precise matching.</p>
          </div>

          <div className="px-3 py-2.5 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <label className="text-xs font-medium text-gray-900 dark:text-white">Detection Window: {windowMinutes} min</label>
            <input type="range" min="1" max="30" step="1" value={windowMinutes}
              onChange={(e) => { setWindowMinutes(parseInt(e.target.value)); setSelectedPreset(null); }}
              className="w-full mt-1 accent-[#d93900]" />
            <p className="text-[10px] text-gray-500 mt-0.5">Time period analyzed for each check. Shorter = faster to detect bursts.</p>
          </div>

          <div className="px-3 py-2.5 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <label className="text-xs font-medium text-gray-900 dark:text-white">Alert Cooldown: {cooldownMinutes} min</label>
            <input type="range" min="5" max="60" step="5" value={cooldownMinutes}
              onChange={(e) => { setCooldownMinutes(parseInt(e.target.value)); setSelectedPreset(null); }}
              className="w-full mt-1 accent-[#d93900]" />
            <p className="text-[10px] text-gray-500 mt-0.5">Minimum gap between alerts for the same incident. Prevents notification spam.</p>
          </div>

          <div className="flex items-center justify-between px-3 py-2.5 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div>
              <span className="text-xs font-medium text-gray-900 dark:text-white">Auto-adjust thresholds</span>
              <p className="text-[10px] text-gray-500 mt-0.5">Let ModSignal learn from false positives</p>
            </div>
            <div
              onClick={() => setAutoTuneEnabled(!autoTuneEnabled)}
              className={`relative w-9 h-5 rounded-full transition-colors cursor-pointer ${autoTuneEnabled ? 'bg-[#d93900]' : 'bg-gray-300 dark:bg-gray-600'}`}
            >
              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${autoTuneEnabled ? 'translate-x-4.5' : 'translate-x-0.5'}`} />
            </div>
          </div>
        </div>
      </details>
    </div>
  );
};
