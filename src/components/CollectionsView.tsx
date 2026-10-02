import React, { useState } from 'react';
import {
  FolderTree,
  Plus,
  Trash2,
  Edit2,
  Check,
  FolderOpen,
  Eye,
  X,
  Ruler,
} from 'lucide-react';
import { Course, CourseCollection, PersonalReview } from '../types/golf';
import { CourseCard } from './CourseCard';
import { formatYardage } from '../utils/formatters';

interface CollectionsViewProps {
  collections: CourseCollection[];
  allCourses: Course[];
  reviews: PersonalReview[];
  yardageUnit: 'yards' | 'metres' | 'both';
  onViewCourse: (course: Course) => void;
  onToggleSave: (course: Course) => void;
  onToggleFavourite: (course: Course) => void;
  onCreateCollection: (name: string, description: string) => void;
  onUpdateCollection: (collection: CourseCollection) => void;
  onDeleteCollection: (collectionId: string) => void;
  onRemoveCourseFromCollection: (collectionId: string, courseId: string) => void;
  onOpenAddCourseModal?: (collectionId?: string) => void;
  onAddToCollection?: (collectionId: string, courseId: string) => void;
  onOpenAddToCollection?: (course: Course) => void;
}

export const CollectionsView: React.FC<CollectionsViewProps> = ({
  collections,
  allCourses,
  reviews,
  yardageUnit,
  onViewCourse,
  onToggleSave,
  onToggleFavourite,
  onCreateCollection,
  onUpdateCollection,
  onDeleteCollection,
  onRemoveCourseFromCollection,
  onOpenAddCourseModal,
  onAddToCollection,
  onOpenAddToCollection,
}) => {
  const [selectedColId, setSelectedColId] = useState<string>(collections[0]?.CollectionID || '');
  const [isCreating, setIsCreating] = useState(false);
  const [newColName, setNewColName] = useState('');
  const [newColDesc, setNewColDesc] = useState('');

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');

  const activeCollection = collections.find((c) => c.CollectionID === selectedColId) || collections[0];

  const collectionCourses = React.useMemo(() => {
    if (!activeCollection) return [];
    const seen = new Set<string>();
    const list: Course[] = [];
    for (const id of activeCollection.CourseIDs) {
      if (!seen.has(id)) {
        seen.add(id);
        const found = allCourses.find((c) => c.CourseID === id);
        if (found) list.push(found);
      }
    }
    return list;
  }, [activeCollection, allCourses]);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColName.trim()) return;
    onCreateCollection(newColName.trim(), newColDesc.trim());
    setNewColName('');
    setNewColDesc('');
    setIsCreating(false);
  };

  const handleStartEdit = (col: CourseCollection) => {
    setEditingId(col.CollectionID);
    setEditName(col.CollectionName);
    setEditDesc(col.Description);
  };

  const handleSaveEdit = (col: CourseCollection) => {
    if (!editName.trim()) return;
    onUpdateCollection({
      ...col,
      CollectionName: editName.trim(),
      Description: editDesc.trim(),
    });
    setEditingId(null);
  };

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Left Collections Sidebar list */}
      <div className="w-72 bg-[#08130d] border-r border-[#193524] flex flex-col justify-between shrink-0 select-none">
        <div className="p-3 border-b border-[#193524] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderTree className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-200">
              Collections ({collections.length})
            </span>
          </div>
          <button
            onClick={() => setIsCreating(true)}
            className="p-1.5 rounded bg-emerald-700 hover:bg-emerald-600 text-white transition-colors"
            title="Create New Collection"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Creation Form Modal/Drawer */}
        {isCreating && (
          <form onSubmit={handleCreateSubmit} className="p-3 bg-[#0d1f14] border-b border-[#1b3a27] space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-emerald-300">New Collection</span>
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <input
              type="text"
              value={newColName}
              onChange={(e) => setNewColName(e.target.value)}
              placeholder="e.g. Society Championship 2026"
              className="w-full px-2 py-1 bg-[#07100b] border border-[#234832] rounded text-slate-100 text-xs focus:outline-none focus:border-emerald-500"
              autoFocus
            />
            <input
              type="text"
              value={newColDesc}
              onChange={(e) => setNewColDesc(e.target.value)}
              placeholder="Short description..."
              className="w-full px-2 py-1 bg-[#07100b] border border-[#234832] rounded text-slate-100 text-xs focus:outline-none focus:border-emerald-500"
            />
            <button
              type="submit"
              className="w-full py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-medium transition-colors"
            >
              Create
            </button>
          </form>
        )}

        {/* Collection items */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {collections.map((col) => {
            const isSelected = activeCollection?.CollectionID === col.CollectionID;
            return (
              <div
                key={col.CollectionID}
                onClick={() => setSelectedColId(col.CollectionID)}
                className={`p-2.5 rounded-lg cursor-pointer transition-colors text-xs flex flex-col gap-1 ${
                  isSelected
                    ? 'bg-[#153222] border border-emerald-600/50 text-white'
                    : 'bg-[#0a170f] border border-[#142b1d] text-slate-300 hover:bg-[#102418]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 truncate">
                    <FolderOpen className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-emerald-400' : 'text-slate-400'}`} />
                    <span className="font-semibold truncate">{col.CollectionName}</span>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/40 text-slate-400 tabular-nums">
                    {col.CourseIDs.length}
                  </span>
                </div>
                {col.Description && (
                  <span className="text-[11px] text-slate-400 line-clamp-1">{col.Description}</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Main View Area */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4">
        {activeCollection ? (
          <>
            {/* Header info */}
            <div className="bg-[#0b1710] border border-[#1b3b28] p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3">
              {editingId === activeCollection.CollectionID ? (
                <div className="flex-1 space-y-2">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-2.5 py-1 bg-[#07100b] border border-[#234832] rounded text-slate-100 text-sm font-bold"
                  />
                  <input
                    type="text"
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    className="w-full px-2.5 py-1 bg-[#07100b] border border-[#234832] rounded text-slate-300 text-xs"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleSaveEdit(activeCollection)}
                      className="px-3 py-1 bg-emerald-700 text-white rounded text-xs font-medium flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" /> Save
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-2.5 py-1 text-slate-400 text-xs"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <h1 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                    <span>{activeCollection.CollectionName}</span>
                    <button
                      onClick={() => handleStartEdit(activeCollection)}
                      className="p-1 text-slate-400 hover:text-slate-200 transition-colors"
                      title="Edit collection name/description"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </h1>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {activeCollection.Description || 'No description provided.'}
                  </p>
                </div>
              )}

              <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
                {onOpenAddCourseModal && (
                  <button
                    onClick={() => onOpenAddCourseModal(activeCollection.CollectionID)}
                    className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white rounded-lg text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5 border border-emerald-500/50 cursor-pointer active:scale-95"
                    title="Add a new course and save directly into this collection"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Course to Collection</span>
                  </button>
                )}

                <button
                  onClick={() => onDeleteCollection(activeCollection.CollectionID)}
                  className="px-3 py-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 border border-transparent hover:border-rose-800/60 rounded text-xs transition-colors flex items-center gap-1.5"
                  title="Delete collection"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Collection</span>
                </button>
              </div>
            </div>

            {/* Courses in this collection */}
            {collectionCourses.length === 0 ? (
              <div className="p-12 text-center bg-[#09150e] border border-[#193524] rounded-xl space-y-3">
                <FolderOpen className="w-10 h-10 mx-auto text-slate-400" />
                <h3 className="text-base font-semibold text-slate-200">No courses in this collection yet</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Add custom courses directly with all course specifications and saved into this collection, or browse search results to populate this list.
                </p>
                {onOpenAddCourseModal && (
                  <div className="pt-2">
                    <button
                      onClick={() => onOpenAddCourseModal(activeCollection.CollectionID)}
                      className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white rounded-lg text-xs font-bold transition-all inline-flex items-center gap-2 shadow-md cursor-pointer active:scale-95"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Course to &quot;{activeCollection.CollectionName}&quot;</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {collectionCourses
                  .filter((c, idx, self) => idx === self.findIndex((item) => item.CourseID === c.CourseID))
                  .map((course, idx) => {
                    const review = reviews.find((r) => r.CourseID === course.CourseID);
                    return (
                      <div key={`col-card-${activeCollection.CollectionID}-${course.CourseID}-${idx}`} className="relative group/colcard">
                      <CourseCard
                        course={course}
                        personalReview={review}
                        yardageUnit={yardageUnit}
                        onViewCourse={onViewCourse}
                        onToggleSave={onToggleSave}
                        onToggleFavourite={onToggleFavourite}
                        onOpenAddToCollection={onOpenAddToCollection}
                      />
                      {/* Remove from collection quick badge */}
                      <button
                        onClick={() => onRemoveCourseFromCollection(activeCollection.CollectionID, course.CourseID)}
                        className="absolute top-2 right-12 z-20 p-1.5 rounded-full bg-black/60 text-slate-400 hover:text-rose-400 hover:bg-rose-950/80 transition-colors border border-white/10"
                        title="Remove from this collection"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          <div className="p-12 text-center text-slate-400 text-xs">
            Create or select a collection to view courses.
          </div>
        )}
      </div>
    </div>
  );
};
