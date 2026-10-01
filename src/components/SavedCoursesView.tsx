import React, { useState, useMemo } from 'react';
import {
  Search,
  BookmarkCheck,
  Star,
  SlidersHorizontal,
  LayoutGrid,
  List,
  Trash2,
  Edit3,
  Eye,
  Filter,
} from 'lucide-react';
import { Course, CourseType, PersonalReview, SortOption } from '../types/golf';
import { CourseCard } from './CourseCard';
import { formatYardage, formatDifficulty } from '../utils/formatters';

interface SavedCoursesViewProps {
  savedCourses: Course[];
  reviews: PersonalReview[];
  yardageUnit: 'yards' | 'metres' | 'both';
  onViewCourse: (course: Course) => void;
  onToggleSave: (course: Course) => void;
  onToggleFavourite: (course: Course) => void;
  onOpenSyncModal: () => void;
}

export const SavedCoursesView: React.FC<SavedCoursesViewProps> = ({
  savedCourses,
  reviews,
  yardageUnit,
  onViewCourse,
  onToggleSave,
  onToggleFavourite,
  onOpenSyncModal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sourceFilter, setSourceFilter] = useState<'All' | 'Official' | 'User Created'>('All');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [yardagePreset, setYardagePreset] = useState<string>('Any');
  const [minYardage, setMinYardage] = useState<number | null>(null);
  const [maxYardage, setMaxYardage] = useState<number | null>(null);
  const [difficultyFilter, setDifficultyFilter] = useState<string>('Any');
  const [favouriteOnly, setFavouriteOnly] = useState(false);
  const [hasReviewOnly, setHasReviewOnly] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('name_asc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Filtered and sorted courses
  const filteredCourses = useMemo(() => {
    // Deduplicate saved courses array
    const seen = new Set<string>();
    let result = savedCourses.filter((c) => {
      if (seen.has(c.CourseID)) return false;
      seen.add(c.CourseID);
      return true;
    });

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter(
        (c) =>
          c.CourseName.toLowerCase().includes(q) ||
          c.CreatorName.toLowerCase().includes(q) ||
          c.LocationText.toLowerCase().includes(q)
      );
    }

    if (sourceFilter !== 'All') {
      result = result.filter((c) => c.SourceType === sourceFilter);
    }

    if (typeFilter !== 'All') {
      result = result.filter((c) => c.CourseType === typeFilter);
    }

    if (favouriteOnly) {
      result = result.filter((c) => c.IsFavourite);
    }

    if (hasReviewOnly) {
      const reviewedIds = new Set(reviews.map((r) => r.CourseID));
      result = result.filter((c) => reviewedIds.has(c.CourseID));
    }

    // Yardage presets
    if (yardagePreset !== 'Any') {
      switch (yardagePreset) {
        case 'under_5000':
          result = result.filter((c) => c.CourseYardage < 5000);
          break;
        case '5000_5999':
          result = result.filter((c) => c.CourseYardage >= 5000 && c.CourseYardage <= 5999);
          break;
        case '6000_6499':
          result = result.filter((c) => c.CourseYardage >= 6000 && c.CourseYardage <= 6499);
          break;
        case '6500_6999':
          result = result.filter((c) => c.CourseYardage >= 6500 && c.CourseYardage <= 6999);
          break;
        case '7000_7499':
          result = result.filter((c) => c.CourseYardage >= 7000 && c.CourseYardage <= 7499);
          break;
        case '7500_plus':
          result = result.filter((c) => c.CourseYardage >= 7500);
          break;
      }
    }

    // Custom yardage range
    if (minYardage !== null && !isNaN(minYardage)) {
      result = result.filter((c) => c.CourseYardage >= minYardage);
    }
    if (maxYardage !== null && !isNaN(maxYardage)) {
      result = result.filter((c) => c.CourseYardage <= maxYardage);
    }

    if (difficultyFilter !== 'Any') {
      result = result.filter((c) => c.DifficultyTier === difficultyFilter);
    }

    // Sorting (strictly NO distance sorting)
    result.sort((a, b) => {
      switch (sortBy) {
        case 'name_asc':
          return a.CourseName.localeCompare(b.CourseName);
        case 'name_desc':
          return b.CourseName.localeCompare(a.CourseName);
        case 'yardage_asc':
          return a.CourseYardage - b.CourseYardage;
        case 'yardage_desc':
          return b.CourseYardage - a.CourseYardage;
        case 'rating_desc':
          return b.CommunityRating - a.CommunityRating;
        case 'rating_asc':
          return a.CommunityRating - b.CommunityRating;
        case 'difficulty_asc':
          return a.Difficulty - b.Difficulty;
        case 'difficulty_desc':
          return b.Difficulty - a.Difficulty;
        case 'official_first':
          if (a.SourceType === 'Official' && b.SourceType !== 'Official') return -1;
          if (b.SourceType === 'Official' && a.SourceType !== 'Official') return 1;
          return 0;
        case 'user_created_first':
          if (a.SourceType === 'User Created' && b.SourceType !== 'User Created') return -1;
          if (b.SourceType === 'User Created' && a.SourceType !== 'User Created') return 1;
          return 0;
        default:
          return 0;
      }
    });

    return result;
  }, [
    savedCourses,
    searchTerm,
    sourceFilter,
    typeFilter,
    yardagePreset,
    minYardage,
    maxYardage,
    difficultyFilter,
    favouriteOnly,
    hasReviewOnly,
    sortBy,
    reviews,
  ]);

  return (
    <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0b1710] border border-[#1b3b28] p-4 rounded-xl">
        <div>
          <div className="flex items-center gap-2">
            <BookmarkCheck className="w-5 h-5 text-emerald-400" />
            <h1 className="text-lg font-bold text-white tracking-tight">Saved Courses (Local Database)</h1>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {savedCourses.length} courses stored locally. Always accessible offline without internet connection.
          </p>
        </div>

        <button
          onClick={onOpenSyncModal}
          className="px-3.5 py-1.5 bg-[#14281c] hover:bg-[#1a3826] border border-[#234832] text-emerald-300 rounded text-xs font-semibold transition-colors flex items-center gap-1.5 self-start sm:self-auto"
        >
          <span>Update Course Data</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#0a160f] border border-[#183324] p-3.5 rounded-lg space-y-3 text-xs">
        <div className="flex flex-col md:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-emerald-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search saved courses by title, creator, location..."
              className="w-full pl-9 pr-3 py-1.5 bg-[#07100b] border border-[#21432f] rounded text-slate-100 text-xs focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Source */}
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value as any)}
              className="px-2.5 py-1.5 bg-[#07100b] border border-[#21432f] rounded text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
            >
              <option value="All">All Sources</option>
              <option value="Official">Official</option>
              <option value="User Created">User Created</option>
            </select>

            {/* Yardage Presets */}
            <select
              value={yardagePreset}
              onChange={(e) => {
                setYardagePreset(e.target.value);
                setMinYardage(null);
                setMaxYardage(null);
              }}
              className="px-2.5 py-1.5 bg-[#07100b] border border-[#21432f] rounded text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
            >
              <option value="Any">Any Length</option>
              <option value="under_5000">Under 5,000 yds</option>
              <option value="5000_5999">5,000–5,999 yds</option>
              <option value="6000_6499">6,000–6,499 yds</option>
              <option value="6500_6999">6,500–6,999 yds</option>
              <option value="7000_7499">7,000–7,499 yds</option>
              <option value="7500_plus">7,500+ yds</option>
            </select>

            {/* Favourites only toggle */}
            <button
              onClick={() => setFavouriteOnly(!favouriteOnly)}
              className={`px-2.5 py-1.5 rounded border transition-colors flex items-center gap-1 ${
                favouriteOnly
                  ? 'bg-amber-950/60 border-amber-600/70 text-amber-300'
                  : 'bg-[#07100b] border-[#21432f] text-slate-400 hover:text-white'
              }`}
            >
              <Star className="w-3.5 h-3.5 fill-amber-400" />
              <span>Favourites</span>
            </button>

            {/* Reviewed only toggle */}
            <button
              onClick={() => setHasReviewOnly(!hasReviewOnly)}
              className={`px-2.5 py-1.5 rounded border transition-colors ${
                hasReviewOnly
                  ? 'bg-emerald-950/60 border-emerald-600/70 text-emerald-300'
                  : 'bg-[#07100b] border-[#21432f] text-slate-400 hover:text-white'
              }`}
            >
              <span>Reviewed Only</span>
            </button>
          </div>
        </div>

        {/* Custom Yardage Min/Max Inputs for Saved Courses */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#173022]">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-xs">Custom Yardage:</span>
            <input
              type="number"
              value={minYardage ?? ''}
              onChange={(e) => {
                setMinYardage(e.target.value ? Number(e.target.value) : null);
                setYardagePreset('Any');
              }}
              placeholder="Min"
              className="w-20 px-2 py-1 bg-[#07100b] border border-[#21432f] rounded text-slate-200 text-xs font-mono"
            />
            <span className="text-slate-400">to</span>
            <input
              type="number"
              value={maxYardage ?? ''}
              onChange={(e) => {
                setMaxYardage(e.target.value ? Number(e.target.value) : null);
                setYardagePreset('Any');
              }}
              placeholder="Max"
              className="w-20 px-2 py-1 bg-[#07100b] border border-[#21432f] rounded text-slate-200 text-xs font-mono"
            />
            <span className="text-slate-400 text-xs font-mono">yards</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-2 py-1 bg-[#07100b] border border-[#21432f] rounded text-slate-200 text-xs font-medium"
            >
              <option value="name_asc">Name (A–Z)</option>
              <option value="name_desc">Name (Z–A)</option>
              <option value="yardage_asc">Length: Shortest First</option>
              <option value="yardage_desc">Length: Longest First</option>
              <option value="rating_desc">Highest Rated</option>
              <option value="difficulty_asc">Easiest First</option>
              <option value="difficulty_desc">Hardest First</option>
            </select>

            <div className="flex items-center bg-[#07100b] border border-[#1b3827] rounded p-0.5 ml-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1 rounded ${
                  viewMode === 'grid' ? 'bg-[#183826] text-emerald-300' : 'text-slate-400'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1 rounded ${
                  viewMode === 'list' ? 'bg-[#183826] text-emerald-300' : 'text-slate-400'
                }`}
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Courses Display */}
      {filteredCourses.length === 0 ? (
        <div className="p-12 text-center bg-[#09150e] border border-[#193524] rounded-xl space-y-2">
          <BookmarkCheck className="w-10 h-10 mx-auto text-slate-400" />
          <h3 className="text-base font-semibold text-slate-200">No saved courses match these filters</h3>
          <p className="text-xs text-slate-400">
            Clear your search term or yardage restrictions to view all saved courses.
          </p>
        </div>
      ) : (
        <div
          className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
              : 'space-y-3'
          }
        >
          {filteredCourses
            .filter((c, idx, self) => idx === self.findIndex((item) => item.CourseID === c.CourseID))
            .map((course, idx) => {
              const review = reviews.find((r) => r.CourseID === course.CourseID);
              return (
                <CourseCard
                  key={`saved-view-${course.CourseID}-${idx}`}
                  course={course}
                  personalReview={review}
                  yardageUnit={yardageUnit}
                  onViewCourse={onViewCourse}
                  onToggleSave={onToggleSave}
                  onToggleFavourite={onToggleFavourite}
                />
              );
            })}
        </div>
      )}
    </div>
  );
};
