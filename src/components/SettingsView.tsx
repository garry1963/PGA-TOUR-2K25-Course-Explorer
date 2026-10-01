import React, { useState, useEffect, useRef } from 'react';
import {
  Settings as SettingsIcon,
  Database,
  Download,
  Upload,
  FileSpreadsheet,
  FileCode,
  HardDrive,
  RefreshCw,
  Check,
  AlertTriangle,
  Ruler,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { AppSettings } from '../types/golf';
import { localDatabase } from '../services/LocalDatabase';

interface SettingsViewProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  onDataRestored: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  onDataRestored,
}) => {
  const [stats, setStats] = useState<{
    savedCoursesCount: number;
    favouritesCount: number;
    reviewsCount: number;
    collectionsCount: number;
    approxSizeKB: number;
  }>({
    savedCoursesCount: 0,
    favouritesCount: 0,
    reviewsCount: 0,
    collectionsCount: 0,
    approxSizeKB: 0,
  });

  const [statusMsg, setStatusMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadStats = async () => {
    const data = await localDatabase.getDatabaseStats();
    setStats(data);
  };

  useEffect(() => {
    loadStats();
  }, []);

  const showStatus = (text: string, type: 'success' | 'error' = 'success') => {
    setStatusMsg({ text, type });
    setTimeout(() => setStatusMsg(null), 3500);
  };

  // Export JSON Backup
  const handleBackupJSON = async () => {
    try {
      const json = await localDatabase.exportCompleteDatabaseJSON();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pga_tour_2k25_course_explorer_backup_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showStatus('Database backup JSON created and downloaded successfully.');
    } catch (err: any) {
      showStatus(`Backup failed: ${err.message}`, 'error');
    }
  };

  // Export SQLite Dump script
  const handleExportSQL = async () => {
    try {
      const sql = await localDatabase.exportSQLiteSQLScript();
      const blob = new Blob([sql], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pga_tour_2k25_courses_${new Date().toISOString().slice(0, 10)}.sql`;
      a.click();
      URL.revokeObjectURL(url);
      showStatus('SQLite schema dump script exported successfully.');
    } catch (err: any) {
      showStatus(`SQL dump failed: ${err.message}`, 'error');
    }
  };

  // Export CSV
  const handleExportCSV = async () => {
    try {
      const csv = await localDatabase.exportSavedCoursesCSV();
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pga_tour_2k25_saved_courses_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      showStatus('Saved courses exported to CSV successfully.');
    } catch (err: any) {
      showStatus(`CSV export failed: ${err.message}`, 'error');
    }
  };

  // Restore from File
  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const result = await localDatabase.restoreDatabaseFromJSON(text);
        if (result.success) {
          showStatus(`Successfully restored ${result.count} records into local database.`);
          await loadStats();
          onDataRestored();
        } else {
          showStatus(`Restore error: ${result.error}`, 'error');
        }
      } catch (err: any) {
        showStatus(`Failed to read file: ${err.message}`, 'error');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6 max-w-4xl">
      {/* Header */}
      <div className="bg-[#0b1710] border border-[#1b3b28] p-4 rounded-xl flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <SettingsIcon className="w-5 h-5 text-emerald-400" />
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">Application Settings & Database</h1>
            <p className="text-xs text-slate-400">
              Manage unit standards, local offline SQLite storage, backups, and display preferences
            </p>
          </div>
        </div>

        {statusMsg && (
          <div
            className={`px-3 py-1.5 rounded text-xs flex items-center gap-1.5 font-medium ${
              statusMsg.type === 'success'
                ? 'bg-emerald-950/80 border border-emerald-600 text-emerald-300'
                : 'bg-rose-950/80 border border-rose-600 text-rose-300'
            }`}
          >
            {statusMsg.type === 'success' ? <Check className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
            <span>{statusMsg.text}</span>
          </div>
        )}
      </div>

      {/* SECTION 38: UNITS (Yards vs Metres) */}
      <div className="p-4 bg-[#0a160f] border border-[#183324] rounded-xl space-y-3">
        <div className="flex items-center gap-2 text-emerald-400">
          <Ruler className="w-4 h-4" />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
            Course Length / Yardage Measurement Standard
          </h2>
        </div>
        <p className="text-xs text-slate-400">
          Select your primary measurement unit for course length. All database yardages remain mathematically synchronized.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          {[
            { id: 'yards', label: 'Yards (Primary PGA Standard)', example: '7,245 yards' },
            { id: 'metres', label: 'Metres (Metric System)', example: '6,625 metres' },
            { id: 'both', label: 'Dual Display (Yards & Metres)', example: '7,245 yds / 6,625 m' },
          ].map((option) => (
            <button
              key={option.id}
              onClick={() => onUpdateSettings({ ...settings, yardageUnit: option.id as any })}
              className={`p-3 rounded-lg border text-left transition-colors flex flex-col justify-between ${
                settings.yardageUnit === option.id
                  ? 'bg-emerald-950/60 border-emerald-500 text-white'
                  : 'bg-[#07110c] border-[#183524] text-slate-300 hover:bg-[#0e2116]'
              }`}
            >
              <div>
                <span className="text-xs font-semibold block">{option.label}</span>
                <span className="text-[11px] text-slate-400 mt-1 block font-mono">{option.example}</span>
              </div>
              {settings.yardageUnit === option.id && (
                <span className="text-[10px] text-emerald-400 font-bold mt-2">Active</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* SECTION 38: LOCAL DATABASE STATUS & BACKUP/RESTORE */}
      <div className="p-4 bg-[#0a160f] border border-[#183324] rounded-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-emerald-400">
            <Database className="w-4 h-4" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
              Local Offline Database Storage
            </h2>
          </div>
          <span className="text-xs text-emerald-400 font-mono">SQLite-Ready Architecture</span>
        </div>

        {/* Database specs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-[#07110c] border border-[#173323] rounded-lg text-xs">
          <div>
            <span className="text-slate-400 text-[10px] uppercase block">Saved Courses</span>
            <span className="text-base font-bold text-white font-mono">{stats.savedCoursesCount}</span>
          </div>
          <div>
            <span className="text-slate-400 text-[10px] uppercase block">Personal Reviews</span>
            <span className="text-base font-bold text-white font-mono">{stats.reviewsCount}</span>
          </div>
          <div>
            <span className="text-slate-400 text-[10px] uppercase block">Collections</span>
            <span className="text-base font-bold text-white font-mono">{stats.collectionsCount}</span>
          </div>
          <div>
            <span className="text-slate-400 text-[10px] uppercase block">Database Size</span>
            <span className="text-base font-bold text-emerald-300 font-mono">~{stats.approxSizeKB} KB</span>
          </div>
        </div>

        <div className="space-y-2">
          <span className="text-xs font-medium text-slate-300 block">
            Backup, Restore & Data Migration Actions
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {/* Backup Database */}
            <button
              onClick={handleBackupJSON}
              className="px-3 py-2 bg-[#122419] hover:bg-[#1a3826] border border-[#214731] rounded text-slate-200 text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Backup Database</span>
            </button>

            {/* Restore Database */}
            <label className="px-3 py-2 bg-[#122419] hover:bg-[#1a3826] border border-[#214731] rounded text-slate-200 text-xs font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer">
              <Upload className="w-3.5 h-3.5 text-emerald-400" />
              <span>Restore Database</span>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleRestoreFile}
                className="hidden"
              />
            </label>

            {/* Export CSV */}
            <button
              onClick={handleExportCSV}
              className="px-3 py-2 bg-[#122419] hover:bg-[#1a3826] border border-[#214731] rounded text-slate-200 text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export CSV</span>
            </button>

            {/* Export SQL */}
            <button
              onClick={handleExportSQL}
              className="px-3 py-2 bg-[#122419] hover:bg-[#1a3826] border border-[#214731] rounded text-slate-200 text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
            >
              <FileCode className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export SQL Dump</span>
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 32: OFFLINE MODE SIMULATOR */}
      <div className="p-4 bg-[#0a160f] border border-[#183324] rounded-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-emerald-400">
            {settings.simulateOffline ? <WifiOff className="w-4 h-4 text-rose-400" /> : <Wifi className="w-4 h-4" />}
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
              Offline Mode Simulator (Testing Tool)
            </h2>
          </div>
          <button
            onClick={() => onUpdateSettings({ ...settings, simulateOffline: !settings.simulateOffline })}
            className={`px-3 py-1 rounded text-xs font-semibold transition-colors border ${
              settings.simulateOffline
                ? 'bg-rose-950 border-rose-600 text-rose-300'
                : 'bg-emerald-950 border-emerald-600 text-emerald-300'
            }`}
          >
            {settings.simulateOffline ? 'Offline Mode Active' : 'Online Mode Active'}
          </button>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          Toggle offline mode simulation to verify that saved courses, cached reviews, and custom collections remain 100% operational when no network connectivity is present.
        </p>
      </div>

      {/* SECTION 38: IMAGE CACHING PREFERENCES */}
      <div className="p-4 bg-[#0a160f] border border-[#183324] rounded-xl space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
          Course Image Caching
        </h2>
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-300">Cache course images locally for offline viewing</span>
          <input
            type="checkbox"
            checked={settings.cacheImages}
            onChange={(e) => onUpdateSettings({ ...settings, cacheImages: e.target.checked })}
            className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
          />
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-[#163022]">
          <span className="text-xs text-slate-300">Maximum local image cache limit</span>
          <span className="text-xs font-mono text-emerald-400">{settings.maxImageCacheMB} MB</span>
        </div>
      </div>
    </div>
  );
};
