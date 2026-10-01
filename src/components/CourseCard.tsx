import React from 'react';
import { Star, Bookmark, BookmarkCheck, Eye, MapPin, Award, Globe, ExternalLink } from 'lucide-react';
import { Course, PersonalReview } from '../types/golf';
import { formatYardage, formatDifficulty } from '../utils/formatters';

interface CourseCardProps {
  course: Course;
  personalReview?: PersonalReview | null;
  yardageUnit: 'yards' | 'metres' | 'both';
  onViewCourse: (course: Course) => void;
  onToggleSave: (course: Course) => void;
  onToggleFavourite: (course: Course) => void;
}

export const CourseCard: React.FC<CourseCardProps> = ({
  course,
  personalReview,
  yardageUnit,
  onViewCourse,
  onToggleSave,
  onToggleFavourite,
}) => {
  const diff = formatDifficulty(course.Difficulty);

  return (
    <div className="group bg-[#0e1c14] border border-[#1d3a28] hover:border-emerald-600/60 rounded-lg overflow-hidden flex flex-col transition-all duration-200 shadow-sm hover:shadow-md hover:shadow-emerald-950/30">
      {/* Course Image Header with Scrim */}
      <div className="relative aspect-video w-full bg-[#0a140e] overflow-hidden">
        <img
          src={course.CourseImageURL}
          alt={course.CourseName}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
          onError={(e) => {
            // Graceful fallback to styled SVG placeholder
            (e.target as HTMLImageElement).src =
              'data:image/svg+xml;charset=utf-8,' +
              encodeURIComponent(
                `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="340" viewBox="0 0 600 340"><rect width="100%" height="100%" fill="#12251a"/><text x="50%" y="50%" fill="#4ade80" font-family="sans-serif" font-size="18" text-anchor="middle">Golf Course Preview</text></svg>`
              );
          }}
        />

        {/* Measured Gradient Scrim for Contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0e1c14] via-[#0e1c14]/30 to-transparent" />

        {/* Source Badge: TGC Tours / Official / User Created & Web Badge */}
        <div className="absolute top-2.5 left-2.5 flex flex-wrap items-center gap-1.5 z-10">
          {course.TgcStatus ? (
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase rounded shadow-sm ${
                course.TgcStatus === 'Tour Worthy'
                  ? 'bg-amber-500 text-slate-950 border border-amber-300'
                  : course.TgcStatus === 'Platinum Tour'
                  ? 'bg-purple-600 text-white border border-purple-400'
                  : course.TgcStatus === 'Elite Tour'
                  ? 'bg-sky-600 text-white border border-sky-400'
                  : 'bg-emerald-700 text-white border border-emerald-400'
              }`}
              title={`TGC Tours Status: ${course.TgcStatus}`}
            >
              <Award className="w-3 h-3" />
              {course.TgcStatus === 'Tour Worthy' ? 'Tour Worthy' : course.TgcStatus}
            </span>
          ) : (
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase rounded ${
                course.SourceType === 'Official'
                  ? 'bg-amber-500/90 text-slate-950 shadow-sm'
                  : 'bg-emerald-700/90 text-white shadow-sm'
              }`}
            >
              {course.SourceType === 'Official' && <Award className="w-3 h-3" />}
              {course.SourceType}
            </span>
          )}

          {course.IsLidar && (
            <span className="inline-flex items-center px-1.5 py-0.5 text-[9px] font-bold tracking-wider uppercase rounded bg-cyan-950/90 border border-cyan-500/50 text-cyan-300 shadow-sm">
              LiDAR
            </span>
          )}

          {course.WebSource && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase rounded bg-sky-600/90 text-white shadow-sm">
              <Globe className="w-3 h-3" /> Web
            </span>
          )}
        </div>

        {/* Favourite Star Toggle Quick Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavourite(course);
          }}
          aria-label={course.IsFavourite ? 'Remove from Favourites' : 'Mark as Favourite'}
          className={`absolute top-2.5 right-2.5 p-1.5 rounded-full transition-colors z-10 ${
            course.IsFavourite
              ? 'bg-amber-500/20 text-amber-400 border border-amber-400/50 hover:bg-amber-500/30'
              : 'bg-black/40 text-slate-400 hover:text-white border border-white/10'
          }`}
          title={course.IsFavourite ? 'In Favourites' : 'Add to Favourites'}
        >
          <Star className={`w-3.5 h-3.5 ${course.IsFavourite ? 'fill-amber-400' : ''}`} />
        </button>

        {/* Course Hole & Par Quiet Kicker */}
        <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-[11px] text-slate-300 font-mono">
          <span>{course.NumberOfHoles} Holes · Par {course.Par}</span>
          <span className="text-emerald-400 font-semibold">{course.CourseType}</span>
        </div>
      </div>

      {/* Course Info Content Body */}
      <div className="p-3.5 flex-1 flex flex-col justify-between space-y-3">
        <div>
          {/* Course Name */}
          <h3
            onClick={() => onViewCourse(course)}
            className="text-sm font-semibold text-slate-100 hover:text-emerald-300 transition-colors line-clamp-1 cursor-pointer"
            title={course.CourseName}
          >
            {course.CourseName}
          </h3>

          {/* Location & Creator Unboxed Metadata */}
          <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
            <span className="truncate">{course.LocationText}</span>
            <span aria-hidden="true" className="text-slate-400">·</span>
            <span className="truncate text-slate-400">{course.CreatorName}</span>
          </div>

          {/* TGC Tours 2K25 Listing Link */}
          {course.TgcStatus && (
            <div className="mt-1.5 flex items-center justify-between text-[11px] text-amber-400/90 bg-amber-950/30 border border-amber-800/30 rounded px-2 py-0.5">
              <span className="font-medium truncate">TGC Tours 2K25 Listing</span>
              <a
                href={course.TgcListingUrl || 'https://www.tgctours.com/Course/Tgc2k25Listings'}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="hover:underline flex items-center gap-0.5 text-amber-300 shrink-0 ml-1"
                title="View on TGCTours.com"
              >
                <span>tgctours.com</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
          )}

          {course.WebSource && (
            <div className="mt-1 flex items-center gap-1 text-[11px] text-sky-400">
              <Globe className="w-3 h-3 shrink-0" />
              <a
                href={course.WebSource.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="hover:underline truncate"
                title={course.WebSource.title}
              >
                {course.WebSource.title}
              </a>
              <ExternalLink className="w-2.5 h-2.5 shrink-0 opacity-70" />
            </div>
          )}

          {/* Course Metrics Grid (Strictly Course Length, No Distance From User) */}
          <div className="mt-3 pt-2.5 border-t border-[#1a3525] grid grid-cols-2 gap-2 text-xs">
            {/* Metric 1: Course Length / Yardage */}
            <div>
              <span className="text-[10px] text-slate-400 block uppercase tracking-wider">Course Length</span>
              <span className="font-semibold text-slate-200 tabular-nums text-xs">
                {formatYardage(course.CourseYardage, yardageUnit)}
              </span>
            </div>

            {/* Metric 2: Difficulty */}
            <div>
              <span className="text-[10px] text-slate-400 block uppercase tracking-wider">Difficulty</span>
              <span className={`font-semibold tabular-nums text-xs ${diff.colorClass}`}>
                {diff.text}
              </span>
            </div>
          </div>

          {/* Rating Lines: Community vs Personal (Section 27) */}
          <div className="mt-2.5 pt-2 border-t border-[#173021] flex items-center justify-between text-xs">
            {/* Community Rating */}
            <div className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span className="font-semibold text-slate-200 tabular-nums">
                {course.CommunityRating.toFixed(1)}
              </span>
              <span className="text-[11px] text-slate-400 tabular-nums">
                ({course.ReviewCount.toLocaleString()})
              </span>
            </div>

            {/* User Personal Rating if available */}
            {personalReview && (
              <div className="flex items-center gap-1 text-[11px] text-emerald-300 bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-800/40">
                <span>My Rating:</span>
                <span className="font-bold tabular-nums">{personalReview.Rating.toFixed(1)}★</span>
              </div>
            )}
          </div>
        </div>

        {/* Card Action Buttons (Section 12: View Course, Save, Favourite) */}
        <div className="pt-2 flex items-center gap-2">
          <button
            onClick={() => onViewCourse(course)}
            className="flex-1 py-1.5 px-2 bg-[#173322] hover:bg-[#1f452e] text-slate-200 hover:text-white rounded text-xs font-medium flex items-center justify-center gap-1.5 transition-colors border border-[#254d34]"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>View</span>
          </button>

          <button
            onClick={() => onToggleSave(course)}
            className={`py-1.5 px-2.5 rounded text-xs font-medium flex items-center justify-center gap-1.5 transition-colors border ${
              course.IsSaved
                ? 'bg-emerald-950/70 border-emerald-600/50 text-emerald-300 hover:bg-emerald-900/60'
                : 'bg-[#122218] border-[#224230] text-slate-300 hover:text-white hover:bg-[#1a3324]'
            }`}
            title={course.IsSaved ? 'Saved in local offline database' : 'Save course locally'}
          >
            {course.IsSaved ? (
              <>
                <BookmarkCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Saved</span>
              </>
            ) : (
              <>
                <Bookmark className="w-3.5 h-3.5" />
                <span>Save</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
