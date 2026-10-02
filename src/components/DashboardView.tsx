import React from 'react';
import {
  BookmarkCheck,
  Star,
  MessageSquareText,
  Clock,
  Compass,
  ArrowRight,
  TrendingUp,
  Ruler,
  Award,
  Plus,
} from 'lucide-react';
import { Course, PersonalReview } from '../types/golf';
import { CourseCard } from './CourseCard';
import { formatYardage } from '../utils/formatters';

interface DashboardViewProps {
  savedCourses: Course[];
  favourites: Course[];
  recentCourses: Course[];
  reviews: PersonalReview[];
  yardageUnit: 'yards' | 'metres' | 'both';
  onViewCourse: (course: Course) => void;
  onToggleSave: (course: Course) => void;
  onToggleFavourite: (course: Course) => void;
  onNavigate: (view: any) => void;
  onOpenAddCourseModal?: () => void;
  onOpenAddToCollection?: (course: Course) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  savedCourses,
  favourites,
  recentCourses,
  reviews,
  yardageUnit,
  onViewCourse,
  onToggleSave,
  onToggleFavourite,
  onNavigate,
  onOpenAddCourseModal,
  onOpenAddToCollection,
}) => {
  // Stat cards metrics
  const totalYardageSaved = savedCourses.reduce((acc, c) => acc + (c.CourseYardage || 0), 0);
  const avgYardage = savedCourses.length > 0 ? Math.round(totalYardageSaved / savedCourses.length) : 0;

  const uniqueRecent = React.useMemo(() => {
    const seen = new Set<string>();
    return recentCourses.filter((c) => {
      if (seen.has(c.CourseID)) return false;
      seen.add(c.CourseID);
      return true;
    });
  }, [recentCourses]);

  const uniqueFavourites = React.useMemo(() => {
    const seen = new Set<string>();
    return favourites.filter((c) => {
      if (seen.has(c.CourseID)) return false;
      seen.add(c.CourseID);
      return true;
    });
  }, [favourites]);

  const uniqueSaved = React.useMemo(() => {
    const seen = new Set<string>();
    return savedCourses.filter((c) => {
      if (seen.has(c.CourseID)) return false;
      seen.add(c.CourseID);
      return true;
    });
  }, [savedCourses]);

  return (
    <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6">
      {/* Welcome Hero Banner */}
      <div className="bg-gradient-to-r from-[#0d1e15] via-[#11291c] to-[#0d1e15] border border-[#1b3d2b] rounded-xl p-5 lg:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold uppercase tracking-wider">
            <Compass className="w-3.5 h-3.5" />
            <span>PGA TOUR 2K25 · Windows Course Explorer & Offline Library</span>
          </div>
          <h1 className="text-xl lg:text-2xl font-bold text-white tracking-tight">
            Course Dashboard & Personal Archive
          </h1>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Discover championship and community layouts by course yardage, difficulty, and location. Save courses directly to your local offline database.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          {onOpenAddCourseModal && (
            <button
              onClick={onOpenAddCourseModal}
              className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md border border-emerald-500/50 cursor-pointer active:scale-95"
              title="Add a custom course and save to any collection"
            >
              <Plus className="w-4 h-4" />
              <span>Add Course</span>
            </button>
          )}

          <button
            onClick={() => onNavigate('tgc-library')}
            className="px-4 py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md border border-amber-400/50 cursor-pointer active:scale-95 shrink-0"
            title="Browse and search the complete TGC Tours course library"
          >
            <Award className="w-4 h-4 text-amber-200" />
            <span>TGC Full Library</span>
          </button>

          <button
            onClick={() => onNavigate('search')}
            className="px-4 py-2.5 bg-[#142d20] hover:bg-[#1c3d2c] border border-emerald-600/40 text-emerald-300 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors shrink-0 shadow-sm"
          >
            <span>Explore Catalog</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* SECTION 5: DASHBOARD CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Saved Courses */}
        <div
          onClick={() => onNavigate('saved')}
          className="p-4 bg-[#0a1610] border border-[#1a3826] hover:border-emerald-600/60 rounded-xl cursor-pointer transition-colors group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Saved Courses</span>
            <BookmarkCheck className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold text-white font-mono tabular-nums">
            {uniqueSaved.length}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Stored in local offline database
          </span>
        </div>

        {/* Card 2: Favourites */}
        <div
          onClick={() => onNavigate('favourites')}
          className="p-4 bg-[#0a1610] border border-[#1a3826] hover:border-amber-500/60 rounded-xl cursor-pointer transition-colors group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Favourites</span>
            <Star className="w-4 h-4 text-amber-400 fill-amber-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold text-white font-mono tabular-nums">
            {uniqueFavourites.length}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Top selected courses
          </span>
        </div>

        {/* Card 3: My Reviews */}
        <div
          onClick={() => onNavigate('reviews')}
          className="p-4 bg-[#0a1610] border border-[#1a3826] hover:border-emerald-600/60 rounded-xl cursor-pointer transition-colors group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">My Reviews</span>
            <MessageSquareText className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold text-white font-mono tabular-nums">
            {reviews.length}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Personal reviews & ratings
          </span>
        </div>

        {/* Card 4: Avg Saved Length / Yardage Stat */}
        <div className="p-4 bg-[#0a1610] border border-[#1a3826] rounded-xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Avg Course Length</span>
            <Ruler className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-emerald-300 font-mono tabular-nums">
            {avgYardage > 0 ? formatYardage(avgYardage, yardageUnit) : '—'}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Across your saved library
          </span>
        </div>
      </div>

      {/* TGC Tours Full Course Library Feature Banner */}
      <div className="bg-gradient-to-r from-[#14281b] via-[#1a3826] to-[#122419] border border-amber-500/40 rounded-xl p-4 lg:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500 text-black">
                Featured Library
              </span>
              <span className="text-xs text-amber-300 font-mono">1,000+ Verified Courses</span>
            </div>
            <h2 className="text-sm lg:text-base font-bold text-white mt-1">
              TGC Tours Official 2K25 Full Course Library
            </h2>
            <p className="text-xs text-slate-300 mt-0.5 leading-relaxed max-w-xl">
              Browse Tour Worthy certified layouts, Platinum and Elite Tour tournament hosts, and LiDAR real-world replicas. Filter by green speeds, yardage, and designer.
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigate('tgc-library')}
          className="px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white rounded-lg text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 shrink-0 border border-amber-400/50 cursor-pointer"
        >
          <span>Open Full Library</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* SECTION 5: RECENTLY VIEWED (Last 5-10 courses viewed) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-semibold text-slate-100 uppercase tracking-wider">
              Recently Viewed Courses
            </h2>
          </div>
          <button
            onClick={() => onNavigate('recent')}
            className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1"
          >
            <span>View History</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {uniqueRecent.length === 0 ? (
          <div className="p-6 text-center bg-[#0a150e] border border-[#183524] rounded-lg text-slate-400 text-xs">
            No recently viewed courses yet. Browse the course catalog to start discovering.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {uniqueRecent.slice(0, 4).map((course, idx) => {
              const review = reviews.find((r) => r.CourseID === course.CourseID);
              return (
                <CourseCard
                  key={`dash-recent-${course.CourseID}-${idx}`}
                  course={course}
                  personalReview={review}
                  yardageUnit={yardageUnit}
                  onViewCourse={onViewCourse}
                  onToggleSave={onToggleSave}
                  onToggleFavourite={onToggleFavourite}
                  onOpenAddToCollection={onOpenAddToCollection}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION 5: FAVOURITE COURSES */}
      {favourites.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <h2 className="text-sm font-semibold text-slate-100 uppercase tracking-wider">
                Favourite Courses
              </h2>
            </div>
            <button
              onClick={() => onNavigate('favourites')}
              className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1"
            >
              <span>View All ({favourites.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {uniqueFavourites.slice(0, 4).map((course, idx) => {
              const review = reviews.find((r) => r.CourseID === course.CourseID);
              return (
                <CourseCard
                  key={`dash-fav-${course.CourseID}-${idx}`}
                  course={course}
                  personalReview={review}
                  yardageUnit={yardageUnit}
                  onViewCourse={onViewCourse}
                  onToggleSave={onToggleSave}
                  onToggleFavourite={onToggleFavourite}
                  onOpenAddToCollection={onOpenAddToCollection}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* SECTION 5: RECENTLY SAVED COURSES */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookmarkCheck className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-semibold text-slate-100 uppercase tracking-wider">
              Recently Saved in Local Database
            </h2>
          </div>
          <button
            onClick={() => onNavigate('saved')}
            className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1"
          >
            <span>Manage Saved ({uniqueSaved.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {uniqueSaved.length === 0 ? (
          <div className="p-6 text-center bg-[#0a150e] border border-[#183524] rounded-lg text-slate-400 text-xs space-y-2">
            <p>You haven&apos;t saved any courses yet.</p>
            <p className="text-slate-400">
              Saving courses makes them instantly accessible in offline mode without requiring an active internet connection.
            </p>
            <button
              onClick={() => onNavigate('search')}
              className="px-3 py-1.5 bg-emerald-700 text-white rounded text-xs font-semibold hover:bg-emerald-600 transition-colors"
            >
              Browse Courses
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {uniqueSaved.slice(0, 4).map((course, idx) => {
              const review = reviews.find((r) => r.CourseID === course.CourseID);
              return (
                <CourseCard
                  key={`dash-saved-${course.CourseID}-${idx}`}
                  course={course}
                  personalReview={review}
                  yardageUnit={yardageUnit}
                  onViewCourse={onViewCourse}
                  onToggleSave={onToggleSave}
                  onToggleFavourite={onToggleFavourite}
                  onOpenAddToCollection={onOpenAddToCollection}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
