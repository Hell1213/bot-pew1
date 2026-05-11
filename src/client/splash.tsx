import './index.css';

import { requestExpandedMode } from '@devvit/web/client';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

const Splash = () => {
  return (
    <div className="flex relative flex-col justify-center items-center min-h-screen bg-white dark:bg-gray-900 px-6">
      <div className="w-14 h-14 rounded-xl bg-[#d93900] flex items-center justify-center shadow-sm mb-4">
        <span className="text-2xl">🛡️</span>
      </div>

      <h1 className="text-xl font-bold text-center text-gray-900 dark:text-white">
        ModSignal
      </h1>
      <p className="text-xs text-center text-gray-500 dark:text-gray-400 max-w-[260px] mt-1 leading-relaxed">
        Real-time moderation intelligence for Reddit communities. Detects coordinated behavior, raids, and spam campaigns.
      </p>

      <div className="flex flex-col items-center w-full mt-5">
        <button
          className="flex items-center justify-center bg-[#d93900] text-white w-full max-w-[260px] h-9 rounded-full transition-colors px-4 hover:bg-[#c23300] text-sm font-medium"
          onClick={(e) => requestExpandedMode(e.nativeEvent, 'game')}
        >
          Open Incident Dashboard
        </button>
      </div>

      <div className="flex flex-wrap justify-center gap-3 mt-4 text-[11px] text-gray-400 dark:text-gray-500">
        <span className="flex items-center gap-1">📈 Activity monitoring</span>
        <span className="flex items-center gap-1">👥 Behavior clustering</span>
        <span className="flex items-center gap-1">⚡ Real-time alerts</span>
      </div>

      <footer className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[10px] text-gray-400 dark:text-gray-500">
        ModSignal · Built for Reddit moderators
      </footer>
    </div>
  );
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Splash />
  </StrictMode>
);
