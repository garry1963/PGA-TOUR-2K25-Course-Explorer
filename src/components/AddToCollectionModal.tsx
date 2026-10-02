import React, { useState } from 'react';
import {
  X,
  Plus,
  FolderTree,
  FolderPlus,
  Check,
  CheckCircle2,
  BookmarkCheck,
  Award,
  Layers,
  Sparkles,
} from 'lucide-react';
import { Course, CourseCollection } from '../types/golf';
import { formatYardage, formatDifficulty } from '../utils/formatters';

interface AddToCollectionModalProps {
  course: Course;
  collections: CourseCollection[];
  yardageUnit: 'yards' | 'metres' | 'both';
  onClose: () => void;
  onSaveToCollections: (course: Course, selectedCollectionIds: string[]) => Promise<void>;
  onCreateCollection?: (name: string, description: string) => Promise<CourseCollection | void>;
}

export const AddToCollectionModal: React.FC<AddToCollectionModalProps> = ({
  course,
  collections,
  yardageUnit,
  onClose,
  onSaveToCollections,
  onCreateCollection,
}) => {
  // Collections that already contain this course
  const initialSelected = collections
    .filter((c) => c.CourseIDs.includes(course.CourseID))
    .map((c) => c.CollectionID);

  const [selectedColIds, setSelectedColIds] = useState<string[]>(initialSelected);
  const [showCreateCol, setShowCreateCol] = useState(false);
  const [newColName, setNewColName] = useState('');
  const [newColDesc, setNewColDesc] = useState('');
  const [isCreatingCol, setIsCreatingCol] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const toggleCollection = (colId: string) => {
    if (selectedColIds.includes(colId)) {
      setSelectedColIds(selectedColIds.filter((id) => id !== colId));
    } else {
      setSelectedColIds([...selectedColIds, colId]);
    }
  };

  const handleSelectAll = () => {
    setSelectedColIds(collections.map((c) => c.CollectionID));
  };

  const handleClear = () => {
    setSelectedColIds([]);
  };

  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColName.trim() || !onCreateCollection) return;
    setIsCreatingCol(true);
    setErrorMsg(null);
    try {
      const created = await onCreateCollection(newColName.trim(), newColDesc.trim());
      if (created && created.CollectionID) {
        setSelectedColIds((prev) => [...prev, created.CollectionID]);
      }
      setNewColName('');
      setNewColDesc('');
      setShowCreateCol(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create collection');
    } finally {
      setIsCreatingCol(false);
    }
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await onSaveToCollections(course, selectedColIds);
      setSuccessMsg(
        `Course saved to ${selectedColIds.length} collection${selectedColIds.length === 1 ? '' : 's'}!`
      );
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save course to collections.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto animate-fade-in">
      <div className="bg-[#0b1710] border border-[#1e402c] rounded-2xl w-full max-w-xl flex flex-col shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="px-5 py-4 bg-[#08120c] border-b border-[#1a3826] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <FolderTree className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <span>Save Course to Collection</span>
              </h2>
              <p className="text-xs text-slate-400">
                Organize &amp; store course information in your custom collections
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Course Summary Banner */}
        <div className="p-4 bg-[#09150e] border-b border-[#162e20] flex items-center gap-3.5">
          <div className="w-16 h-12 rounded-lg bg-[#06100a] border border-[#1b3a27] overflow-hidden shrink-0">
            <img
              src={course.CourseImageURL}
              alt={course.CourseName}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  'data:image/svg+xml;charset=utf-8,' +
                  encodeURIComponent(
                    `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="70" viewBox="0 0 100 70"><rect width="100%" height="100%" fill="#12251a"/><text x="50%" y="50%" fill="#4ade80" font-size="10" text-anchor="middle">Golf</text></svg>`
                  );
              }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-white truncate">{course.CourseName}</h3>
              {course.TgcStatus && (
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  {course.TgcStatus}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
              <span>{course.CreatorName}</span>
              <span>·</span>
              <span className="font-mono text-emerald-300">
                {formatYardage(course.CourseYardage, yardageUnit)}
              </span>
              <span>·</span>
              <span>Par {course.Par}</span>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 max-h-[55vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3 bg-rose-950/60 border border-rose-800/80 rounded-xl text-rose-200 text-xs">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-950/70 border border-emerald-700/80 rounded-xl text-emerald-200 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="font-semibold">{successMsg}</span>
            </div>
          )}

          {/* Quick Actions & Inline New Collection Toggle */}
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="font-semibold text-slate-300">
              Select Collections ({selectedColIds.length} chosen):
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleSelectAll}
                className="px-2.5 py-1 rounded bg-[#102519] hover:bg-[#183524] text-slate-300 hover:text-white border border-[#1f3f2a] transition-colors text-[11px]"
              >
                Select All
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="px-2.5 py-1 rounded bg-[#102519] hover:bg-[#183524] text-slate-400 hover:text-white border border-[#1f3f2a] transition-colors text-[11px]"
              >
                Clear
              </button>
              {onCreateCollection && (
                <button
                  type="button"
                  onClick={() => setShowCreateCol(!showCreateCol)}
                  className="px-2.5 py-1 rounded bg-emerald-700 hover:bg-emerald-600 text-white font-medium flex items-center gap-1 transition-colors text-[11px]"
                >
                  <FolderPlus className="w-3.5 h-3.5" />
                  <span>New</span>
                </button>
              )}
            </div>
          </div>

          {/* Inline Create Form */}
          {showCreateCol && (
            <form
              onSubmit={handleCreateCollection}
              className="p-3 bg-[#0d2216] border border-emerald-600/40 rounded-xl space-y-2.5 animate-fade-in"
            >
              <div className="flex items-center justify-between text-xs font-bold text-emerald-300">
                <span>Create New Collection</span>
                <button
                  type="button"
                  onClick={() => setShowCreateCol(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <input
                type="text"
                value={newColName}
                onChange={(e) => setNewColName(e.target.value)}
                placeholder="Collection Name (e.g. Society Tourneys, Link Favs)..."
                className="w-full px-3 py-1.5 bg-[#06100a] border border-[#21432f] rounded-lg text-slate-100 text-xs focus:outline-none focus:border-emerald-500 font-semibold"
                autoFocus
              />
              <input
                type="text"
                value={newColDesc}
                onChange={(e) => setNewColDesc(e.target.value)}
                placeholder="Description (optional)..."
                className="w-full px-3 py-1.5 bg-[#06100a] border border-[#21432f] rounded-lg text-slate-100 text-xs focus:outline-none focus:border-emerald-500"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isCreatingCol || !newColName.trim()}
                  className="px-3.5 py-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold rounded-lg text-xs transition-colors"
                >
                  {isCreatingCol ? 'Creating...' : 'Create & Select'}
                </button>
              </div>
            </form>
          )}

          {/* Collections List */}
          {collections.length === 0 ? (
            <div className="p-6 text-center bg-[#07130b] border border-[#162e20] rounded-xl space-y-2">
              <FolderTree className="w-8 h-8 text-slate-500 mx-auto" />
              <p className="text-xs text-slate-300 font-semibold">No collections exist yet</p>
              <p className="text-[11px] text-slate-400">
                Click &quot;New&quot; above to create your first collection.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {collections.map((col) => {
                const isChecked = selectedColIds.includes(col.CollectionID);
                const wasInitiallyIncluded = col.CourseIDs.includes(course.CourseID);
                return (
                  <div
                    key={col.CollectionID}
                    onClick={() => toggleCollection(col.CollectionID)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-3 select-none ${
                      isChecked
                        ? 'bg-[#153422] border-emerald-500/70 text-white shadow-sm'
                        : 'bg-[#08150f] border-[#183523] text-slate-300 hover:bg-[#0e2216]'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                          isChecked
                            ? 'bg-emerald-500 border-emerald-400 text-white'
                            : 'border-[#264b34] bg-[#06100a]'
                        }`}
                      >
                        {isChecked && <Check className="w-3.5 h-3.5" />}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs truncate">{col.CollectionName}</span>
                          {wasInitiallyIncluded && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-black/40 text-emerald-400 font-medium">
                              Already added
                            </span>
                          )}
                        </div>
                        {col.Description && (
                          <p className="text-[11px] text-slate-400 truncate mt-0.5">
                            {col.Description}
                          </p>
                        )}
                      </div>
                    </div>

                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/40 text-slate-400 shrink-0">
                      {col.CourseIDs.length} courses
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-[#08120c] border-t border-[#1a3826] flex items-center justify-between gap-3">
          <span className="text-xs text-slate-400">
            {selectedColIds.length === 0
              ? 'Course will remain in catalog'
              : `Assign to ${selectedColIds.length} collection${selectedColIds.length === 1 ? '' : 's'}`}
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-slate-400 hover:text-white rounded-lg text-xs font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleSave}
              className="px-5 py-1.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 disabled:opacity-50 text-white font-bold text-xs rounded-lg shadow-md border border-emerald-500/50 flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
            >
              {isSubmitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <BookmarkCheck className="w-4 h-4" />
                  <span>Save to Collections</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
