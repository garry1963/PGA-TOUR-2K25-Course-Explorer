import React, { useState } from 'react';
import { X, FolderSync, Check, AlertCircle, RefreshCw } from 'lucide-react';
import { Course } from '../types/golf';
import { courseDataProvider } from '../services/CourseDataProvider';
import { localDatabase } from '../services/LocalDatabase';

interface SyncModalProps {
  savedCourses: Course[];
  simulateOffline: boolean;
  onClose: () => void;
  onSyncCompleted: () => void;
}

export const SyncModal: React.FC<SyncModalProps> = ({
  savedCourses,
  simulateOffline,
  onClose,
  onSyncCompleted,
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>(savedCourses.map((c) => c.CourseID));
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [syncedCount, setSyncedCount] = useState<number | null>(null);

  const isOffline = simulateOffline || (typeof navigator !== 'undefined' && !navigator.onLine);

  const toggleSelectAll = () => {
    if (selectedIds.length === savedCourses.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(savedCourses.map((c) => c.CourseID));
    }
  };

  const toggleSelectCourse = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleExecuteSync = async () => {
    if (isOffline) {
      setSyncStatus('Cannot sync while offline. Please disable offline mode or connect to internet.');
      return;
    }

    setIsSyncing(true);
    setSyncStatus(null);
    let count = 0;

    try {
      for (const id of selectedIds) {
        const course = savedCourses.find((c) => c.CourseID === id);
        if (!course) continue;

        // Fetch fresh metadata from provider
        const fresh = await courseDataProvider.fetchLatestCourseData(course.ExternalCourseID);
        if (fresh) {
          // Update while strictly preserving user's PersonalNotes, IsFavourite, and IsSaved
          const updated: Course = {
            ...course,
            ...fresh,
            PersonalNotes: course.PersonalNotes,
            IsFavourite: course.IsFavourite,
            IsSaved: true,
          };
          await localDatabase.saveCourse(updated);
          count++;
        }
      }
      setSyncedCount(count);
      setSyncStatus(`Successfully synchronized ${count} courses with external catalog.`);
      onSyncCompleted();
    } catch (err: any) {
      setSyncStatus(`Sync error: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0b1710] border border-[#1f422e] rounded-xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 bg-[#08130c] border-b border-[#183624] flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-100 font-semibold text-sm">
            <FolderSync className="w-4 h-4 text-emerald-400" />
            <span>Update Saved Courses (Data Sync)</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3.5 overflow-y-auto text-xs text-slate-300">
          <p className="text-slate-400 leading-relaxed">
            Synchronise course lengths, community ratings, and tournament stats with the external PGA TOUR 2K25 catalog.
            <strong className="text-emerald-400 block mt-1 font-normal">
              Your personal reviews, personal ratings, and notes are never overwritten.
            </strong>
          </p>

          {isOffline && (
            <div className="p-2.5 bg-rose-950/40 border border-rose-800 text-rose-300 rounded flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>Network connection is currently offline.</span>
            </div>
          )}

          {/* Selection controls */}
          <div className="flex items-center justify-between pt-1 border-t border-[#173022]">
            <button
              type="button"
              onClick={toggleSelectAll}
              className="text-emerald-400 hover:text-emerald-300 font-medium"
            >
              {selectedIds.length === savedCourses.length ? 'Deselect All' : 'Select All Courses'}
            </button>
            <span className="text-slate-400 font-mono">
              {selectedIds.length} of {savedCourses.length} selected
            </span>
          </div>

          {/* List of courses to sync */}
          <div className="max-h-56 overflow-y-auto space-y-1.5 p-2 bg-[#07100b] border border-[#1b3b27] rounded-lg">
            {savedCourses
              .filter((c, idx, self) => idx === self.findIndex((item) => item.CourseID === c.CourseID))
              .map((c, idx) => {
                const isChecked = selectedIds.includes(c.CourseID);
                return (
                  <label
                    key={`sync-course-${c.CourseID}-${idx}`}
                    className="flex items-center justify-between p-2 rounded hover:bg-[#102418] cursor-pointer text-xs"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleSelectCourse(c.CourseID)}
                        className="w-3.5 h-3.5 accent-emerald-500 rounded"
                      />
                      <span className="text-slate-200 truncate font-medium">{c.CourseName}</span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono shrink-0 ml-2">
                      {c.CourseYardage.toLocaleString()} yds
                    </span>
                  </label>
                );
              })}
          </div>

          {syncStatus && (
            <div className="p-2.5 bg-[#0e2418] border border-emerald-600/50 text-emerald-300 rounded flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{syncStatus}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#08130c] border-t border-[#183624] flex items-center justify-end gap-2 text-xs">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-slate-400 hover:text-white"
          >
            Close
          </button>
          <button
            onClick={handleExecuteSync}
            disabled={isSyncing || selectedIds.length === 0 || isOffline}
            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded font-semibold transition-colors flex items-center gap-1.5 shadow-sm"
          >
            {isSyncing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Synchronising...</span>
              </>
            ) : (
              <span>Update Selected Courses</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
