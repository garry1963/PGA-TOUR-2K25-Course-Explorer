import React from 'react';
import { MessageSquareText, Star, Trash2, Calendar, Eye, Ruler } from 'lucide-react';
import { Course, PersonalReview } from '../types/golf';
import { formatYardage, formatDate } from '../utils/formatters';

interface MyReviewsViewProps {
  reviews: PersonalReview[];
  courses: Course[];
  yardageUnit: 'yards' | 'metres' | 'both';
  onViewCourse: (course: Course) => void;
  onDeleteReview: (reviewId: string) => void;
  onNavigateToSearch: () => void;
}

export const MyReviewsView: React.FC<MyReviewsViewProps> = ({
  reviews,
  courses,
  yardageUnit,
  onViewCourse,
  onDeleteReview,
  onNavigateToSearch,
}) => {
  return (
    <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4">
      {/* Header */}
      <div className="bg-[#0b1710] border border-[#1b3b28] p-4 rounded-xl flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <MessageSquareText className="w-5 h-5 text-emerald-400" />
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">My Course Reviews</h1>
            <p className="text-xs text-slate-400">
              {reviews.length} courses reviewed with your personal ratings and gameplay notes
            </p>
          </div>
        </div>
      </div>

      {reviews.length === 0 ? (
        <div className="p-12 text-center bg-[#09150e] border border-[#193524] rounded-xl space-y-3">
          <MessageSquareText className="w-10 h-10 mx-auto text-slate-400" />
          <h3 className="text-base font-semibold text-slate-200">No course reviews added yet</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            You can add personal star ratings and notes to any course in the catalog or saved database.
          </p>
          <button
            onClick={onNavigateToSearch}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded text-xs font-semibold transition-colors"
          >
            Find Courses to Review
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reviews
            .filter((r, idx, self) => idx === self.findIndex((item) => item.ReviewID === r.ReviewID))
            .map((review) => {
              const course = courses.find((c) => c.CourseID === review.CourseID);
              return (
                <div
                  key={`rev-card-${review.ReviewID}`}
                  className="bg-[#0a1610] border border-[#1a3826] hover:border-emerald-600/50 rounded-xl overflow-hidden flex flex-col justify-between p-4 space-y-3 transition-colors group"
                >
                <div>
                  {/* Top: Course thumbnail, Name & Yardage */}
                  <div className="flex items-start gap-3">
                    {course?.CourseImageURL && (
                      <img
                        src={course.CourseImageURL}
                        alt={course.CourseName}
                        referrerPolicy="no-referrer"
                        className="w-16 h-12 object-cover rounded bg-[#07100b] shrink-0 border border-[#1c3a29]"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h3
                        onClick={() => course && onViewCourse(course)}
                        className="text-sm font-semibold text-slate-100 hover:text-emerald-300 transition-colors truncate cursor-pointer"
                        title={course?.CourseName || 'Course'}
                      >
                        {course?.CourseName || 'PGA TOUR 2K25 Course'}
                      </h3>
                      {course && (
                        <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5 font-mono">
                          <Ruler className="w-3 h-3 text-emerald-400" />
                          <span>{formatYardage(course.CourseYardage, yardageUnit)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Personal Rating Stars & Title (Section 26) */}
                  <div className="mt-3 pt-2.5 border-t border-[#173022]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <div className="flex text-amber-400">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-3.5 h-3.5 ${
                                s <= Math.round(review.Rating) ? 'fill-amber-400' : 'text-slate-600'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-xs font-bold text-emerald-300 font-mono ml-1 tabular-nums">
                          {review.Rating.toFixed(1)} / 5.0
                        </span>
                      </div>

                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(review.DateCreated)}
                      </span>
                    </div>

                    <h4 className="text-xs font-semibold text-slate-100 mt-2">
                      {review.ReviewTitle}
                    </h4>
                    <p className="text-xs text-slate-300 mt-1 line-clamp-3 leading-relaxed">
                      {review.ReviewText}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-2 border-t border-[#152e20] flex items-center justify-between text-xs">
                  <button
                    onClick={() => course && onViewCourse(course)}
                    className="text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Course</span>
                  </button>

                  <button
                    onClick={() => onDeleteReview(review.ReviewID)}
                    className="text-rose-400 hover:text-rose-300 flex items-center gap-1 p-1 hover:bg-rose-950/40 rounded transition-colors"
                    title="Delete this review"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
