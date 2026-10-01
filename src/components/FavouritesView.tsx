import React, { useState, useMemo } from 'react';
import { Star, Search, SlidersHorizontal, Ruler } from 'lucide-react';
import { Course, PersonalReview, SortOption } from '../types/golf';
import { CourseCard } from './CourseCard';

interface FavouritesViewProps {
  favourites: Course[];
  reviews: PersonalReview[];
  yardageUnit: 'yards' | 'metres' | 'both';
  onViewCourse: (course: Course) => void;
  onToggleSave: (course: Course) => void;
  onToggleFavourite: (course: Course) => void;
}

export const FavouritesView: React.FC<FavouritesViewProps> = ({
  favourites,
  reviews,
  yardageUnit,
  onViewCourse,
  onToggleSave,
  onToggleFavourite,
}) => {
  const [search, setSearch] = useState('');
  const [yardagePreset, setYardagePreset] = useState('Any');
  const [sortBy, setSortBy] = useState<SortOption>('name_asc');

  const filtered = useMemo(() => {
    const seen = new Set<string>();
    let list = favourites.filter((c) => {
      if (seen.has(c.CourseID)) return false;
      seen.add(c.CourseID);
      return true;
    });
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.CourseName.toLowerCase().includes(q) ||
          c.CreatorName.toLowerCase().includes(q) ||
          c.LocationText.toLowerCase().includes(q)
      );
    }

    if (yardagePreset !== 'Any') {
      switch (yardagePreset) {
        case 'under_5000':
          list = list.filter((c) => c.CourseYardage < 5000);
          break;
        case '5000_5999':
          list = list.filter((c) => c.CourseYardage >= 5000 && c.CourseYardage <= 5999);
          break;
        case '6000_6499':
          list = list.filter((c) => c.CourseYardage >= 6000 && c.CourseYardage <= 6499);
          break;
        case '6500_6999':
          list = list.filter((c) => c.CourseYardage >= 6500 && c.CourseYardage <= 6999);
          break;
        case '7000_7499':
          list = list.filter((c) => c.CourseYardage >= 7000 && c.CourseYardage <= 7499);
          break;
        case '7500_plus':
          list = list.filter((c) => c.CourseYardage >= 7500);
          break;
      }
    }

    list.sort((a, b) => {
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
        default:
          return 0;
      }
    });

    return list;
  }, [favourites, search, yardagePreset, sortBy]);

  return (
    <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4">
      {/* Header */}
      <div className="bg-[#0b1710] border border-[#1b3b28] p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">Favourite Courses</h1>
            <p className="text-xs text-slate-400">
              {favourites.length} courses marked as personal favourites
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search favourites..."
              className="pl-8 pr-3 py-1.5 bg-[#07100b] border border-[#21432f] rounded text-slate-100 text-xs focus:outline-none focus:border-emerald-500"
            />
          </div>

          <select
            value={yardagePreset}
            onChange={(e) => setYardagePreset(e.target.value)}
            className="px-2.5 py-1.5 bg-[#07100b] border border-[#21432f] rounded text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
          >
            <option value="Any">All Lengths</option>
            <option value="under_5000">&lt; 5,000 yds</option>
            <option value="5000_5999">5,000–5,999 yds</option>
            <option value="6000_6499">6,000–6,499 yds</option>
            <option value="6500_6999">6,500–6,999 yds</option>
            <option value="7000_7499">7,000–7,499 yds</option>
            <option value="7500_plus">7,500+ yds</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-2.5 py-1.5 bg-[#07100b] border border-[#21432f] rounded text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
          >
            <option value="name_asc">Name (A–Z)</option>
            <option value="yardage_asc">Length: Shortest</option>
            <option value="yardage_desc">Length: Longest</option>
            <option value="rating_desc">Highest Rated</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="p-12 text-center bg-[#09150e] border border-[#193524] rounded-xl space-y-2">
          <Star className="w-10 h-10 mx-auto text-slate-400" />
          <h3 className="text-base font-semibold text-slate-200">No favourites to display</h3>
          <p className="text-xs text-slate-400">
            Click the star icon on any course card or course details screen to add it to your favourites list.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered
            .filter((c, idx, self) => idx === self.findIndex((item) => item.CourseID === c.CourseID))
            .map((course, idx) => {
              const review = reviews.find((r) => r.CourseID === course.CourseID);
              return (
                <CourseCard
                  key={`fav-card-${course.CourseID}-${idx}`}
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
