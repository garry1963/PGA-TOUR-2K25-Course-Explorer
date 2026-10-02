import React from 'react';
import {
  Minus,
  Square,
  X,
  Search,
  Wifi,
  WifiOff,
  RefreshCw,
  FolderSync,
  Compass,
  Plus,
} from 'lucide-react';
import { AppSettings } from '../types/golf';

interface WindowsTitleBarProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  onOpenSearch: () => void;
  onOpenSyncModal: () => void;
  onNavigate: (view: string) => void;
  onOpenAddCourseModal?: () => void;
}

export const WindowsTitleBar: React.FC<WindowsTitleBarProps> = ({
  settings,
  onUpdateSettings,
  onOpenSearch,
  onOpenSyncModal,
  onOpenAddCourseModal,
}) => {
  const [isMaximized, setIsMaximized] = React.useState(true);

  const toggleOfflineSimulation = () => {
    onUpdateSettings({
      ...settings,
      simulateOffline: !settings.simulateOffline,
    });
  };

  const isOffline = settings.simulateOffline || (typeof navigator !== 'undefined' && !navigator.onLine);

  return (
    <header className="h-10 bg-[#070e0a] border-b border-[#1b3325] flex items-center justify-between px-3 select-none text-xs text-slate-300 z-50 shrink-0">
      {/* Brand Zone: Single element wordmark & icon */}
      <div className="flex items-center gap-2.5">
        <div className="w-5 h-5 rounded bg-emerald-600/30 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
          <Compass className="w-3.5 h-3.5" />
        </div>
        <span className="font-semibold tracking-wide text-slate-100 flex items-center gap-1.5">
          <span>PGA TOUR 2K25 Course Explorer</span>
          <span className="text-[10px] text-emerald-400/80 font-mono">v1.2 (PC)</span>
        </span>
      </div>

      {/* Middle Zone: Quick Search Bar & Connectivity Badge */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenSearch}
          className="flex items-center gap-2 px-3 py-1 bg-[#122218] hover:bg-[#182e21] border border-[#224230] rounded text-slate-300 text-xs transition-colors duration-150 group"
          title="Quick Search (Ctrl + K)"
        >
          <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-400 transition-colors" />
          <span className="text-slate-400">Search courses, creator, location...</span>
          <kbd className="ml-2 px-1.5 py-0.5 text-[10px] font-mono bg-[#09150f] border border-[#224230] rounded text-slate-400">
            Ctrl+K
          </kbd>
        </button>

        {/* Sync Saved Courses Action */}
        <button
          onClick={onOpenSyncModal}
          className="flex items-center gap-1.5 px-2.5 py-1 bg-[#122419] hover:bg-[#1a3525] border border-[#234531] rounded text-slate-200 text-xs transition-colors"
          title="Synchronise saved courses with external catalog"
        >
          <FolderSync className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden sm:inline">Sync Data</span>
        </button>

        {/* Add Custom Course & Collection Assignment Action */}
        {onOpenAddCourseModal && (
          <button
            onClick={onOpenAddCourseModal}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-semibold rounded border border-emerald-500/50 text-xs shadow-sm transition-all cursor-pointer active:scale-95"
            title="Add a custom course with all course specifications and save to any collection"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Add Course</span>
          </button>
        )}

        {/* Online / Offline Simulator & Status Badge (Section 32) */}
        <button
          onClick={toggleOfflineSimulation}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded border text-xs font-medium transition-all ${
            isOffline
              ? 'bg-rose-950/50 border-rose-700/60 text-rose-300 hover:bg-rose-900/60'
              : 'bg-emerald-950/40 border-emerald-700/50 text-emerald-300 hover:bg-emerald-900/50'
          }`}
          title="Click to toggle simulated Offline mode for testing offline database access"
        >
          {isOffline ? (
            <>
              <WifiOff className="w-3.5 h-3.5 text-rose-400" />
              <span>OFFLINE</span>
            </>
          ) : (
            <>
              <Wifi className="w-3.5 h-3.5 text-emerald-400" />
              <span>ONLINE</span>
            </>
          )}
        </button>
      </div>

      {/* Right Zone: Window Control Buttons */}
      <div className="flex items-center -mr-1">
        <button
          aria-label="Minimize"
          className="w-10 h-8 flex items-center justify-center text-slate-400 hover:bg-[#13261a] hover:text-slate-100 transition-colors"
          onClick={() => {}}
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <button
          aria-label="Maximize / Restore"
          className="w-10 h-8 flex items-center justify-center text-slate-400 hover:bg-[#13261a] hover:text-slate-100 transition-colors"
          onClick={() => setIsMaximized(!isMaximized)}
        >
          <Square className="w-3 h-3" />
        </button>
        <button
          aria-label="Close"
          className="w-10 h-8 flex items-center justify-center text-slate-400 hover:bg-red-600 hover:text-white transition-colors"
          onClick={() => {}}
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
};
