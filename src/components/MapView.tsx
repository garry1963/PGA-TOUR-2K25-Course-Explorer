import React, { useState } from 'react';
import { MapPin, Star, Eye, Info, Ruler, Compass } from 'lucide-react';
import { Course } from '../types/golf';
import { formatYardage, formatDifficulty } from '../utils/formatters';

interface MapViewProps {
  courses: Course[];
  yardageUnit: 'yards' | 'metres' | 'both';
  onViewCourse: (course: Course) => void;
}

export const MapView: React.FC<MapViewProps> = ({
  courses,
  yardageUnit,
  onViewCourse,
}) => {
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [regionFilter, setRegionFilter] = useState<string>('All');

  // Filter courses with valid coordinates and ensure unique CourseIDs
  const coursesWithCoords = React.useMemo(() => {
    const seen = new Set<string>();
    return courses.filter((c) => {
      if (c.Latitude === null || c.Longitude === null) return false;
      if (seen.has(c.CourseID)) return false;
      seen.add(c.CourseID);
      return true;
    });
  }, [courses]);

  const filteredCourses = regionFilter === 'All'
    ? coursesWithCoords
    : coursesWithCoords.filter((c) => c.Country.toLowerCase().includes(regionFilter.toLowerCase()));

  // Map latitude [-60, 75] and longitude [-170, 180] to percentage coordinates (Equirectangular projection)
  const getMapPercent = (lat: number, lon: number) => {
    const x = ((lon + 170) / 350) * 100;
    const y = ((75 - lat) / 135) * 100;
    return {
      left: `${Math.min(96, Math.max(4, x))}%`,
      top: `${Math.min(92, Math.max(8, y))}%`,
    };
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden p-4 lg:p-6 space-y-4">
      {/* Top Header */}
      <div className="bg-[#0b1710] border border-[#1b3b28] p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-emerald-400" />
            <h1 className="text-lg font-bold text-white tracking-tight">
              Global Course Locations (Visual Map)
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Geographic overview of courses with coordinates. Purely a visual location index — strictly no user distance calculation.
          </p>
        </div>

        {/* Region Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Region:</span>
          <select
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-[#07100b] border border-[#21432f] rounded text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
          >
            <option value="All">All Continents ({coursesWithCoords.length})</option>
            <option value="United States">North America / USA</option>
            <option value="Scotland">Scotland / UK</option>
            <option value="Canada">Canada</option>
            <option value="Austria">Europe / Austria / Norway</option>
            <option value="Bahamas">Caribbean / Bahamas</option>
            <option value="United Arab Emirates">Middle East / UAE</option>
          </select>
        </div>
      </div>

      {/* Interactive Map Visualizer Container */}
      <div className="flex-1 relative bg-[#07110c] border border-[#183624] rounded-xl overflow-hidden min-h-[420px] flex items-center justify-center select-none shadow-inner">
        {/* Subtle World Map SVG Silhouette Backdrop */}
        <svg
          className="absolute inset-0 w-full h-full opacity-20 pointer-events-none"
          viewBox="0 0 1000 500"
          preserveAspectRatio="none"
        >
          <path
            d="M150,120 Q200,80 320,110 T450,130 L430,220 L300,280 L220,240 Z"
            fill="#224d34"
          />
          <path
            d="M260,280 Q320,320 300,430 T240,480 L200,380 Z"
            fill="#224d34"
          />
          <path
            d="M480,90 Q560,70 650,110 T800,140 L880,240 L700,260 L540,200 Z"
            fill="#224d34"
          />
          <path
            d="M460,200 Q540,240 560,340 T500,440 L450,320 Z"
            fill="#224d34"
          />
          <path
            d="M740,320 Q840,320 860,400 T780,440 L730,370 Z"
            fill="#224d34"
          />
          {/* Subtle Grid Lines */}
          <line x1="0" y1="250" x2="1000" y2="250" stroke="#1d422c" strokeDasharray="4 4" strokeWidth="1" />
          <line x1="500" y1="0" x2="500" y2="500" stroke="#1d422c" strokeDasharray="4 4" strokeWidth="1" />
        </svg>

        {/* Course Location Pins */}
        {filteredCourses.map((c) => {
          const { left, top } = getMapPercent(c.Latitude!, c.Longitude!);
          const isSelected = selectedCourse?.CourseID === c.CourseID;
          return (
            <button
              key={`map-pin-${c.CourseID}`}
              onClick={() => setSelectedCourse(c)}
              style={{ left, top }}
              className={`absolute -translate-x-1/2 -translate-y-full group cursor-pointer focus:outline-none transition-transform z-10 ${
                isSelected ? 'scale-125 z-30' : 'hover:scale-115'
              }`}
              title={`${c.CourseName} · ${c.LocationText}`}
            >
              <div
                className={`relative flex items-center justify-center p-1.5 rounded-full border shadow-lg transition-colors ${
                  isSelected
                    ? 'bg-amber-400 text-slate-950 border-white'
                    : c.SourceType === 'Official'
                    ? 'bg-emerald-600 text-white border-emerald-300'
                    : 'bg-emerald-800 text-emerald-200 border-emerald-500'
                }`}
              >
                <MapPin className="w-4 h-4" />
              </div>
              <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-black/90 border border-emerald-600/50 rounded text-[11px] text-white whitespace-nowrap shadow-md pointer-events-none">
                {c.CourseName}
              </div>
            </button>
          );
        })}

        {/* Selected Course Popover Card (Section 37) */}
        {selectedCourse && (
          <div className="absolute bottom-4 right-4 z-40 bg-[#0d1e15] border border-emerald-600/70 rounded-xl p-4 max-w-sm w-full shadow-2xl space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-[10px] font-semibold tracking-wider uppercase text-emerald-400 block">
                  {selectedCourse.SourceType} · {selectedCourse.CourseType}
                </span>
                <h3 className="text-sm font-bold text-white line-clamp-1">
                  {selectedCourse.CourseName}
                </h3>
                <span className="text-xs text-slate-400 block mt-0.5">
                  {selectedCourse.LocationText}
                </span>
              </div>
              <button
                onClick={() => setSelectedCourse(null)}
                className="text-slate-400 hover:text-white p-1 text-xs"
              >
                ✕
              </button>
            </div>

            {/* Course thumbnail */}
            <img
              src={selectedCourse.CourseImageURL}
              alt={selectedCourse.CourseName}
              referrerPolicy="no-referrer"
              className="w-full h-24 object-cover rounded-lg border border-[#1b3b28]"
            />

            {/* Specs: Course Length & Difficulty */}
            <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-[#183624]">
              <div>
                <span className="text-[10px] text-slate-400 block uppercase">Course Length</span>
                <span className="font-semibold text-emerald-300 font-mono">
                  {formatYardage(selectedCourse.CourseYardage, yardageUnit)}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase">Rating</span>
                <div className="flex items-center gap-1 font-semibold text-slate-200">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>{selectedCourse.CommunityRating.toFixed(1)} / 5</span>
                </div>
              </div>
            </div>

            {/* Open Course Button */}
            <button
              onClick={() => onViewCourse(selectedCourse)}
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Open Course Details</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
