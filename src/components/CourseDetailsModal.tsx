import React, { useState } from 'react';
import {
  X,
  Star,
  Bookmark,
  BookmarkCheck,
  Award,
  MapPin,
  Calendar,
  Layers,
  Flag,
  Ruler,
  Info,
  FolderPlus,
  Edit3,
  Trash2,
  Check,
  Tag,
  Hash,
  Globe,
  ExternalLink,
  FolderTree,
} from 'lucide-react';
import { Course, CourseCollection, PersonalReview } from '../types/golf';
import { formatYardage, formatDifficulty, formatDate } from '../utils/formatters';

interface CourseDetailsModalProps {
  course: Course;
  personalReview?: PersonalReview | null;
  collections: CourseCollection[];
  yardageUnit: 'yards' | 'metres' | 'both';
  onClose: () => void;
  onToggleSave: (course: Course) => void;
  onToggleFavourite: (course: Course) => void;
  onSaveReview: (review: { Rating: number; ReviewTitle: string; ReviewText: string }) => void;
  onDeleteReview: (reviewId: string) => void;
  onSavePersonalNotes: (courseId: string, notes: string) => void;
  onAddToCollection: (collectionId: string, courseId: string) => void;
  onOpenAddToCollection?: (course: Course) => void;
}

export const CourseDetailsModal: React.FC<CourseDetailsModalProps> = ({
  course,
  personalReview,
  collections,
  yardageUnit,
  onClose,
  onToggleSave,
  onToggleFavourite,
  onSaveReview,
  onDeleteReview,
  onSavePersonalNotes,
  onAddToCollection,
  onOpenAddToCollection,
}) => {
  // Review form state
  const [isEditingReview, setIsEditingReview] = useState(false);
  const [reviewRating, setReviewRating] = useState<number>(personalReview?.Rating || 5);
  const [reviewTitle, setReviewTitle] = useState(personalReview?.ReviewTitle || '');
  const [reviewText, setReviewText] = useState(personalReview?.ReviewText || '');

  // Personal notes state (Section 49)
  const [notes, setNotes] = useState(course.PersonalNotes || '');
  const [isNotesSaved, setIsNotesSaved] = useState(false);

  // Collection dropdown
  const [selectedCollectionId, setSelectedCollectionId] = useState('');
  const [collectionAddedMsg, setCollectionAddedMsg] = useState(false);

  const diff = formatDifficulty(course.Difficulty);

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewTitle.trim() && !reviewText.trim()) return;
    onSaveReview({
      Rating: reviewRating,
      ReviewTitle: reviewTitle.trim() || 'My Course Review',
      ReviewText: reviewText.trim(),
    });
    setIsEditingReview(false);
  };

  const handleNotesSave = () => {
    onSavePersonalNotes(course.CourseID, notes);
    setIsNotesSaved(true);
    setTimeout(() => setIsNotesSaved(false), 2000);
  };

  const handleAddCollection = () => {
    if (!selectedCollectionId) return;
    onAddToCollection(selectedCollectionId, course.CourseID);
    setCollectionAddedMsg(true);
    setTimeout(() => setCollectionAddedMsg(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#0b1711] border border-[#1f422e] rounded-xl max-w-4xl w-full overflow-hidden shadow-2xl flex flex-col my-auto max-h-[90vh]">
        {/* Header Hero Banner (Section 14) */}
        <div className="relative aspect-[21/9] sm:aspect-[24/8] w-full bg-[#07100b] overflow-hidden shrink-0">
          <img
            src={course.CourseImageURL}
            alt={course.CourseName}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b1711] via-[#0b1711]/60 to-transparent" />

          {/* Close button */}
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="absolute top-3 right-3 p-1.5 rounded-full bg-black/60 text-slate-300 hover:text-white hover:bg-black/80 transition-colors border border-white/10"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header Overlay Content */}
          <div className="absolute bottom-4 left-6 right-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                {course.TgcStatus ? (
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-bold tracking-wider uppercase rounded shadow-sm ${
                      course.TgcStatus === 'Tour Worthy'
                        ? 'bg-amber-500 text-slate-950 border border-amber-300'
                        : course.TgcStatus === 'Platinum Tour'
                        ? 'bg-purple-600 text-white border border-purple-400'
                        : course.TgcStatus === 'Elite Tour'
                        ? 'bg-sky-600 text-white border border-sky-400'
                        : 'bg-emerald-700 text-white border border-emerald-400'
                    }`}
                  >
                    <Award className="w-3.5 h-3.5" />
                    TGC Tours: {course.TgcStatus}
                  </span>
                ) : (
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold tracking-wider uppercase rounded ${
                      course.SourceType === 'Official'
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'bg-emerald-600 text-white font-bold'
                    }`}
                  >
                    {course.SourceType === 'Official' && <Award className="w-3.5 h-3.5" />}
                    {course.SourceType} Course
                  </span>
                )}

                {course.IsLidar && (
                  <span className="text-xs text-cyan-300 bg-cyan-950/70 px-2 py-0.5 rounded border border-cyan-500/50 font-semibold">
                    LiDAR Accurate Re-creation
                  </span>
                )}

                <span className="text-xs text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-700/40">
                  {course.CourseType}
                </span>
                <span className="text-xs text-slate-300 font-mono">
                  {course.NumberOfHoles} Holes · Par {course.Par}
                </span>
                {course.GreenSpeed && (
                  <span className="text-xs text-slate-300 font-mono bg-[#14281d] px-2 py-0.5 rounded border border-[#21432f]">
                    Greens: {course.GreenSpeed}
                  </span>
                )}
                {course.WebSource && (
                  <span className="text-xs text-sky-300 bg-sky-950/60 px-2 py-0.5 rounded border border-sky-700/40 flex items-center gap-1">
                    <Globe className="w-3 h-3" /> Web Discovery
                  </span>
                )}
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                {course.CourseName}
              </h1>
              <div className="flex items-center gap-2 text-xs text-slate-300 mt-1 flex-wrap">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                <span>{course.LocationText}</span>
                <span>·</span>
                <span className="text-slate-400">Created by {course.CreatorName}</span>
                {course.TgcStatus && (
                  <>
                    <span>·</span>
                    <a
                      href={course.TgcListingUrl || 'https://www.tgctours.com/Course/Tgc2k25Listings'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-amber-400 hover:text-amber-300 hover:underline flex items-center gap-1 font-semibold"
                    >
                      <span>TGC Tours 2K25 Listings</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </>
                )}
                {course.WebSource && (
                  <>
                    <span>·</span>
                    <a
                      href={course.WebSource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sky-400 hover:underline flex items-center gap-1"
                    >
                      <span>{course.WebSource.title}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </>
                )}
              </div>
            </div>

            {/* Quick Actions (Save & Favourite) */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => onToggleFavourite(course)}
                className={`px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1.5 transition-colors border ${
                  course.IsFavourite
                    ? 'bg-amber-500/20 border-amber-400/60 text-amber-300 hover:bg-amber-500/30'
                    : 'bg-black/50 border-white/20 text-slate-200 hover:bg-black/70'
                }`}
              >
                <Star className={`w-4 h-4 ${course.IsFavourite ? 'fill-amber-400 text-amber-400' : ''}`} />
                <span>{course.IsFavourite ? 'Favourited' : 'Favourite'}</span>
              </button>

              <button
                onClick={() => onToggleSave(course)}
                className={`px-4 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm ${
                  course.IsSaved
                    ? 'bg-emerald-800 border border-emerald-600 text-white'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                }`}
              >
                {course.IsSaved ? (
                  <>
                    <BookmarkCheck className="w-4 h-4" />
                    <span>Saved in Database</span>
                  </>
                ) : (
                  <>
                    <Bookmark className="w-4 h-4" />
                    <span>Save Course</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-200">
          {/* Key Metrics Banner (Section 15: Course Length prominently displayed) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-[#0e2117] rounded-lg border border-[#1b3d2b]">
            <div>
              <span className="text-[11px] text-slate-400 uppercase tracking-wider block font-medium">
                Course Length
              </span>
              <span className="text-base font-bold text-emerald-300 font-mono tabular-nums">
                {formatYardage(course.CourseYardage, yardageUnit)}
              </span>
            </div>

            <div>
              <span className="text-[11px] text-slate-400 uppercase tracking-wider block font-medium">
                Difficulty Rating
              </span>
              <span className={`text-base font-bold tabular-nums ${diff.colorClass}`}>
                {diff.text}
              </span>
            </div>

            <div>
              <span className="text-[11px] text-slate-400 uppercase tracking-wider block font-medium">
                Community Rating
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span className="text-base font-bold text-slate-100 tabular-nums">
                  {course.CommunityRating.toFixed(1)}
                </span>
                <span className="text-xs text-slate-400 tabular-nums">
                  / 5 ({course.ReviewCount.toLocaleString()})
                </span>
              </div>
            </div>

            <div>
              <span className="text-[11px] text-slate-400 uppercase tracking-wider block font-medium">
                Holes & Par
              </span>
              <span className="text-base font-bold text-slate-100 font-mono">
                {course.NumberOfHoles} Holes · Par {course.Par}
              </span>
            </div>
          </div>

          {/* Section 27: Community Rating vs Personal Rating Separation */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Community Rating Card */}
            <div className="p-4 bg-[#0a1710] border border-[#1b3827] rounded-lg">
              <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold block mb-2">
                Community Review Summary
              </span>
              <div className="flex items-center gap-2">
                <div className="flex text-amber-400">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`w-4 h-4 ${
                        s <= Math.round(course.CommunityRating) ? 'fill-amber-400' : 'text-slate-600'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-base font-bold text-white tabular-nums">
                  {course.CommunityRating.toFixed(1)} / 5.0
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Based on {course.ReviewCount.toLocaleString()} player ratings on PGA TOUR 2K25.
              </p>
            </div>

            {/* My Personal Rating Card */}
            <div className="p-4 bg-[#0a1710] border border-[#1b3827] rounded-lg flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs uppercase tracking-wider text-emerald-400 font-semibold">
                    My Personal Rating
                  </span>
                  {personalReview && (
                    <span className="text-[11px] text-slate-400">
                      Reviewed on {formatDate(personalReview.DateCreated)}
                    </span>
                  )}
                </div>
                {personalReview ? (
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="flex text-amber-400">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-4 h-4 ${
                              s <= Math.round(personalReview.Rating) ? 'fill-amber-400' : 'text-slate-600'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-base font-bold text-emerald-300 tabular-nums">
                        {personalReview.Rating.toFixed(1)} / 5.0
                      </span>
                    </div>
                    <h4 className="text-sm font-semibold text-slate-100 mt-1">
                      {personalReview.ReviewTitle}
                    </h4>
                    <p className="text-xs text-slate-300 mt-0.5 line-clamp-2">
                      {personalReview.ReviewText}
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">
                    You have not reviewed this course yet. Add your personal score and notes below.
                  </p>
                )}
              </div>

              <div className="mt-3 pt-2 border-t border-[#173022] flex items-center gap-2">
                <button
                  onClick={() => setIsEditingReview(!isEditingReview)}
                  className="px-3 py-1 bg-[#173523] hover:bg-[#204a32] text-emerald-300 rounded text-xs font-medium transition-colors flex items-center gap-1.5"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>{personalReview ? 'Edit My Review' : 'Add My Review'}</span>
                </button>
                {personalReview && (
                  <button
                    onClick={() => onDeleteReview(personalReview.ReviewID)}
                    className="px-2.5 py-1 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded text-xs transition-colors flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Section 25 & 26: Add/Edit Review Drawer Form */}
          {isEditingReview && (
            <form
              onSubmit={handleReviewSubmit}
              className="p-4 bg-[#0e2117] border border-emerald-600/40 rounded-lg space-y-3"
            >
              <h3 className="text-xs font-semibold uppercase tracking-wider text-emerald-300">
                {personalReview ? 'Edit Your Review' : 'Add Your Personal Review'}
              </h3>

              {/* Star Rating Selector */}
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Personal Rating (1 to 5 Stars): <strong className="text-white">{reviewRating} Stars</strong>
                </label>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setReviewRating(star)}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= reviewRating
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-slate-600 hover:text-slate-400'
                        }`}
                      />
                    </button>
                  ))}
                  <div className="ml-3 flex gap-1">
                    {[3.5, 4.5].map((half) => (
                      <button
                        type="button"
                        key={half}
                        onClick={() => setReviewRating(half)}
                        className={`px-2 py-0.5 text-xs rounded border ${
                          reviewRating === half
                            ? 'bg-amber-500/20 text-amber-300 border-amber-400'
                            : 'bg-black/30 text-slate-400 border-white/10'
                        }`}
                      >
                        {half}★
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Review Title */}
              <div>
                <label className="block text-xs text-slate-400 mb-1">Review Title</label>
                <input
                  type="text"
                  value={reviewTitle}
                  onChange={(e) => setReviewTitle(e.target.value)}
                  placeholder="e.g. Fantastic Links Course with challenging opening holes"
                  className="w-full px-3 py-1.5 bg-[#09150f] border border-[#234731] rounded text-slate-100 text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Review Text */}
              <div>
                <label className="block text-xs text-slate-400 mb-1">Review Details</label>
                <textarea
                  rows={3}
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Write your personal thoughts on green roll, fairway firmness, wind play, favorite hole..."
                  className="w-full px-3 py-1.5 bg-[#09150f] border border-[#234731] rounded text-slate-100 text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold transition-colors"
                >
                  Save Review
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingReview(false)}
                  className="px-3 py-1.5 text-slate-400 hover:text-slate-200 text-xs"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Course Description */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Course Description
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed bg-[#0a1710] p-3.5 rounded-lg border border-[#183525]">
              {course.Description || 'Not available'}
            </p>
          </div>

          {/* Section 16: Additional Course Specifications Grid */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Specifications & Course Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-[#0a1710] border border-[#183525] rounded space-y-1">
                <span className="text-slate-400 block font-medium">Tee Information</span>
                <span className="text-slate-200">{course.TeeInformation || 'Not available'}</span>
              </div>

              <div className="p-3 bg-[#0a1710] border border-[#183525] rounded space-y-1">
                <span className="text-slate-400 block font-medium">Green Details</span>
                <span className="text-slate-200">{course.GreenInformation || 'Not available'}</span>
              </div>

              <div className="p-3 bg-[#0a1710] border border-[#183525] rounded space-y-1">
                <span className="text-slate-400 block font-medium">Fairway & Hazards</span>
                <span className="text-slate-200">{course.FairwayInformation || 'Not available'}</span>
              </div>

              <div className="p-3 bg-[#0a1710] border border-[#183525] rounded space-y-1">
                <span className="text-slate-400 block font-medium">Total Play Count</span>
                <span className="text-slate-200 font-mono tabular-nums">
                  {course.PlayCount ? `${course.PlayCount.toLocaleString()} rounds recorded` : 'Not available'}
                </span>
              </div>
            </div>
          </div>

          {/* Course Tags */}
          {course.CourseTags && course.CourseTags.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-emerald-400" />
                Course Tags
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {course.CourseTags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-2.5 py-1 bg-[#12281c] border border-[#214731] text-emerald-300 rounded font-medium"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Section 49: Optional Personal Notes (Private to local database) */}
          <div className="p-3.5 bg-[#0a1610] border border-[#1a3826] rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                Private Personal Notes (Offline Only)
              </span>
              {isNotesSaved && (
                <span className="text-xs text-emerald-400 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Notes Saved
                </span>
              )}
            </div>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Great course for our Sunday tournament society. Tough bunkers on hole 14."
              className="w-full px-3 py-1.5 bg-[#07100b] border border-[#234932] rounded text-slate-100 text-xs focus:outline-none focus:border-emerald-500"
            />
            <button
              onClick={handleNotesSave}
              className="px-3 py-1 bg-[#163322] hover:bg-[#1d422c] text-emerald-300 rounded text-xs font-medium transition-colors"
            >
              Update Private Notes
            </button>
          </div>

          {/* Add to Custom Collection dropdown & Manager (Section 24 & 31) */}
          <div className="p-3.5 bg-[#0a1610] border border-[#1a3826] rounded-lg space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <FolderPlus className="w-4 h-4 text-emerald-400" />
                <div>
                  <span className="text-xs font-semibold text-slate-200 block">Course Collections</span>
                  <span className="text-[11px] text-slate-400">
                    Organise and save this course with all its information into any selected collection
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <select
                  value={selectedCollectionId}
                  onChange={(e) => setSelectedCollectionId(e.target.value)}
                  className="px-2.5 py-1.5 bg-[#07100b] border border-[#234932] text-slate-200 text-xs rounded focus:outline-none focus:border-emerald-500"
                >
                  <option value="">Select a Collection...</option>
                  {collections.map((c) => (
                    <option key={c.CollectionID} value={c.CollectionID}>
                      {c.CollectionName} ({c.CourseIDs.length})
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleAddCollection}
                  disabled={!selectedCollectionId}
                  className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white rounded text-xs font-medium transition-colors cursor-pointer"
                >
                  Add
                </button>
                {onOpenAddToCollection && (
                  <button
                    type="button"
                    onClick={() => onOpenAddToCollection(course)}
                    className="px-3 py-1.5 bg-[#12281c] hover:bg-[#1a3826] border border-[#234832] text-amber-300 hover:text-white rounded text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
                    title="Open multi-select collection manager"
                  >
                    <FolderTree className="w-3.5 h-3.5" />
                    <span>Manage Collections</span>
                  </button>
                )}
                {collectionAddedMsg && (
                  <span className="text-xs text-emerald-400 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Added!
                  </span>
                )}
              </div>
            </div>

            {/* List containing collections */}
            {collections.filter((c) => c.CourseIDs.includes(course.CourseID)).length > 0 && (
              <div className="pt-2 border-t border-[#162e20] flex items-center gap-2 flex-wrap text-xs">
                <span className="text-[11px] text-slate-400">Currently in:</span>
                {collections
                  .filter((c) => c.CourseIDs.includes(course.CourseID))
                  .map((col) => (
                    <span
                      key={col.CollectionID}
                      className="px-2 py-0.5 rounded-full bg-emerald-950/70 border border-emerald-600/40 text-emerald-300 text-[10px] font-medium"
                    >
                      {col.CollectionName}
                    </span>
                  ))}
              </div>
            )}
          </div>

          {/* Technical Metadata Footer */}
          <div className="pt-3 border-t border-[#173022] flex flex-wrap items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>External ID: {course.ExternalCourseID}</span>
            <span>Last Retrieved: {formatDate(course.LastRetrievedDate)}</span>
            <span>Data Provider: PGA TOUR 2K25 Catalog</span>
          </div>
        </div>
      </div>
    </div>
  );
};
