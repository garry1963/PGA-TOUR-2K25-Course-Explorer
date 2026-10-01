import React from 'react';
import { Clock, Trash2, Eye } from 'lucide-react';
import { Course, PersonalReview } from '../types/golf';
import { CourseCard } from './CourseCard';

interface RecentlyViewedViewProps {
  recentCourses: Course[];
  reviews: PersonalReview[];
  yardageUnit: 'yards' | 'metres' | 'both';
  onViewCourse: (course: Course) => void;
  onToggleSave: (course: Course) => void;
  onToggleFavourite: (course: Course) => void;
  onClearHistory: () => void;
}

export const RecentlyViewedView: React.FC<RecentlyViewedViewProps> = ({
  recentCourses,
  reviews,
  yardageUnit,
  onViewCourse,
  onToggleSave,
  onToggleFavourite,
  onClearHistory,
}) => {
  return (
    <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4">
      {/* Header */}
      <div className="bg-[#0b1710] border border-[#1b3b28] p-4 rounded-xl flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Clock className="w-5 h-5 text-emerald-400" />
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">Recently Viewed Courses</h1>
            <p className="text-xs text-slate-400">
              Personal browsing history of the last {recentCourses.length} courses examined
            </p>
          </div>
        </div>

        {recentCourses.length > 0 && (
          <button
            onClick={onClearHistory}
            className="px-3 py-1.5 bg-[#17251e] hover:bg-rose-950/60 border border-[#234232] hover:border-rose-800 text-slate-300 hover:text-rose-300 rounded text-xs font-medium transition-colors flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear History</span>
          </button>
        )}
      </div>

      {recentCourses.length === 0 ? (
        <div className="p-12 text-center bg-[#09150e] border border-[#193524] rounded-xl space-y-2">
          <Clock className="w-10 h-10 mx-auto text-slate-400" />
          <h3 className="text-base font-semibold text-slate-200">No recently viewed courses</h3>
          <p className="text-xs text-slate-400">
            As you explore courses in the search or saved library, your history will be preserved here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {recentCourses
            .filter((c, idx, self) => idx === self.findIndex((item) => item.CourseID === c.CourseID))
            .map((course, idx) => {
              const review = reviews.find((r) => r.CourseID === course.CourseID);
              return (
                <CourseCard
                  key={`recent-view-${course.CourseID}-${idx}`}
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
