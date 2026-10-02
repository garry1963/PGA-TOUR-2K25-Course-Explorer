import React, { useState, useMemo, useEffect } from 'react';
import {
  Award,
  Search,
  SlidersHorizontal,
  BookmarkCheck,
  Bookmark,
  Star,
  Eye,
  FolderPlus,
  ExternalLink,
  Plus,
  LayoutGrid,
  List,
  Sparkles,
  Filter,
  Check,
  X,
  MapPin,
  Ruler,
  Compass,
  ArrowUpDown,
  Flame,
  Globe,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Trees,
  Sun,
  Mountain,
  Snowflake,
  ShieldCheck,
  Palmtree,
  Wheat,
  Waves,
} from 'lucide-react';
import { Course, CourseCollection, PersonalReview, TgcCourseTheme, TgcTourStatus } from '../types/golf';
import { CourseCard } from './CourseCard';
import { formatYardage, formatDifficulty } from '../utils/formatters';

interface TgcLibraryViewProps {
  allCourses: Course[];
  savedCourses: Course[];
  favourites: Course[];
  collections: CourseCollection[];
  reviews: PersonalReview[];
  yardageUnit: 'yards' | 'metres' | 'both';
  onViewCourse: (course: Course) => void;
  onToggleSave: (course: Course) => void;
  onToggleFavourite: (course: Course) => void;
  onOpenAddCourseModal?: () => void;
  onOpenAddToCollection?: (course: Course) => void;
  onNavigateToMap?: () => void;
}

export type TgcTourTier =
  | 'All'
  | 'Tour Worthy'
  | 'Platinum Tour'
  | 'Elite Tour'
  | 'Kinetic Tour'
  | 'Challenge Circuit'
  | 'Approved'
  | 'Beer League';

export type RealOrLidarFilter = 'All' | 'Real' | 'LiDAR' | 'Original';

export type SortOption =
  | 'name-asc'
  | 'name-desc'
  | 'rating-desc'
  | 'reviews-desc'
  | 'yardage-desc'
  | 'yardage-asc'
  | 'difficulty-desc'
  | 'designer-asc';

export const ALL_TGC_THEMES: { id: TgcCourseTheme | 'All'; label: string; icon: string; color: string }[] = [
  { id: 'All', label: 'All Themes', icon: '⛳', color: 'emerald' },
  { id: 'Autumn', label: 'Autumn', icon: '🍁', color: 'amber' },
  { id: 'Boreal', label: 'Boreal', icon: '🌲', color: 'emerald' },
  { id: 'Countryside', label: 'Countryside', icon: '🏡', color: 'lime' },
  { id: 'Delta', label: 'Delta', icon: '🌊', color: 'teal' },
  { id: 'Desert', label: 'Desert', icon: '🏜️', color: 'orange' },
  { id: 'Harvest', label: 'Harvest', icon: '🌾', color: 'yellow' },
  { id: 'Highlands', label: 'Highlands', icon: '⛰️', color: 'purple' },
  { id: 'Rustic', label: 'Rustic', icon: '🪵', color: 'stone' },
  { id: 'Steppe', label: 'Steppe', icon: '🐎', color: 'slate' },
  { id: 'Swiss', label: 'Swiss', icon: '🏔️', color: 'cyan' },
  { id: 'Links', label: 'Links', icon: '🏖️', color: 'blue' },
  { id: 'Temperate', label: 'Temperate', icon: '🌳', color: 'green' },
  { id: 'Tropical', label: 'Tropical', icon: '🌴', color: 'rose' },
  { id: 'Winter', label: 'Winter', icon: '❄️', color: 'sky' },
];

const ALPHABET = ['All', '#', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')];

export const TgcLibraryView: React.FC<TgcLibraryViewProps> = ({
  allCourses,
  savedCourses,
  favourites,
  collections,
  reviews,
  yardageUnit,
  onViewCourse,
  onToggleSave,
  onToggleFavourite,
  onOpenAddCourseModal,
  onOpenAddToCollection,
  onNavigateToMap,
}) => {
  // Primary criteria filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLetter, setSelectedLetter] = useState<string>('All');
  const [selectedTour, setSelectedTour] = useState<TgcTourTier>('All');
  const [selectedRealOrLidar, setSelectedRealOrLidar] = useState<RealOrLidarFilter>('All');
  const [selectedTheme, setSelectedTheme] = useState<TgcCourseTheme | 'All'>('All');
  const [selectedYardagePreset, setSelectedYardagePreset] = useState<string>('Any');
  const [selectedMinRating, setSelectedMinRating] = useState<number>(0);
  const [selectedGreenSpeed, setSelectedGreenSpeed] = useState<string>('All');
  
  // Default sorting strictly in A - Z order as requested
  const [sortBy, setSortBy] = useState<SortOption>('name-asc');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Pagination states - 24 courses at a time
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(24);
  const [jumpPageInput, setJumpPageInput] = useState<string>('');

  // Extract all TGC Tours courses from the global dataset
  const tgcCourses = useMemo(() => {
    return allCourses.filter((course) => {
      const hasTgcStatus = Boolean(course.TgcStatus);
      const hasTgcId = course.CourseID.toLowerCase().startsWith('tgc-');
      const hasTgcTags =
        course.CourseTags &&
        course.CourseTags.some((t) =>
          t.toLowerCase().includes('tgc') ||
          t.toLowerCase().includes('tour worthy') ||
          t.toLowerCase().includes('approved') ||
          t.toLowerCase().includes('platinum') ||
          t.toLowerCase().includes('elite') ||
          t.toLowerCase().includes('challenge') ||
          t.toLowerCase().includes('kinetic') ||
          t.toLowerCase().includes('beer league')
        );
      const hasTgcUrl =
        course.TgcListingUrl || (course.CourseURL && course.CourseURL.includes('tgctours.com'));
      return hasTgcStatus || hasTgcId || hasTgcTags || hasTgcUrl;
    });
  }, [allCourses]);

  // Saved and Favourites ID sets for fast lookup
  const savedIds = useMemo(() => new Set(savedCourses.map((c) => c.CourseID)), [savedCourses]);
  const favIds = useMemo(() => new Set(favourites.map((c) => c.CourseID)), [favourites]);

  // Theme counts for live badge display
  const themeCounts = useMemo(() => {
    const counts: Record<string, number> = { All: tgcCourses.length };
    for (const c of tgcCourses) {
      if (c.Theme) {
        counts[c.Theme] = (counts[c.Theme] || 0) + 1;
      }
    }
    return counts;
  }, [tgcCourses]);

  // Library statistics
  const stats = useMemo(() => {
    const total = tgcCourses.length;
    const tourWorthyCount = tgcCourses.filter(
      (c) => c.TgcStatus === 'Tour Worthy' || (c.CourseTags && c.CourseTags.includes('Tour Worthy'))
    ).length;
    const platinumEliteCount = tgcCourses.filter(
      (c) => c.TgcStatus === 'Platinum Tour' || c.TgcStatus === 'Elite Tour'
    ).length;
    const realCourseCount = tgcCourses.filter((c) => c.IsRealWorld === true).length;
    const lidarCount = tgcCourses.filter((c) => c.IsLidar === true).length;
    const avgYardage =
      total > 0
        ? Math.round(tgcCourses.reduce((acc, c) => acc + (c.CourseYardage || 0), 0) / total)
        : 7120;

    return {
      total,
      tourWorthyCount,
      platinumEliteCount,
      realCourseCount,
      lidarCount,
      avgYardage,
    };
  }, [tgcCourses]);

  // Filtered courses
  const filteredCourses = useMemo(() => {
    let result = [...tgcCourses];

    // 1. Text Search (query)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((c) => {
        return (
          c.CourseName.toLowerCase().includes(q) ||
          c.CreatorName.toLowerCase().includes(q) ||
          c.LocationText.toLowerCase().includes(q) ||
          (c.City && c.City.toLowerCase().includes(q)) ||
          (c.Region && c.Region.toLowerCase().includes(q)) ||
          (c.Country && c.Country.toLowerCase().includes(q)) ||
          (c.Theme && c.Theme.toLowerCase().includes(q)) ||
          (c.CourseTags && c.CourseTags.some((t) => t.toLowerCase().includes(q))) ||
          (c.Description && c.Description.toLowerCase().includes(q))
        );
      });
    }

    // 2. A - Z Letter Filter
    if (selectedLetter !== 'All') {
      if (selectedLetter === '#') {
        result = result.filter((c) => /^[^a-zA-Z]/.test(c.CourseName.trim()));
      } else {
        const l = selectedLetter.toUpperCase();
        result = result.filter((c) => c.CourseName.trim().toUpperCase().startsWith(l));
      }
    }

    // 3. Tour Status Filter
    if (selectedTour !== 'All') {
      if (selectedTour === 'Tour Worthy') {
        result = result.filter(
          (c) => c.TgcStatus === 'Tour Worthy' || (c.CourseTags && c.CourseTags.includes('Tour Worthy'))
        );
      } else if (selectedTour === 'Platinum Tour') {
        result = result.filter((c) => c.TgcStatus === 'Platinum Tour');
      } else if (selectedTour === 'Elite Tour') {
        result = result.filter((c) => c.TgcStatus === 'Elite Tour');
      } else if (selectedTour === 'Kinetic Tour') {
        result = result.filter((c) => c.TgcStatus === 'Kinetic Tour');
      } else if (selectedTour === 'Challenge Circuit') {
        result = result.filter((c) => c.TgcStatus === 'Challenge Circuit');
      } else if (selectedTour === 'Approved') {
        result = result.filter((c) => c.TgcStatus === 'Approved' || c.TgcStatus === 'Tour Worthy');
      } else if (selectedTour === 'Beer League') {
        result = result.filter((c) => c.TgcStatus === 'Beer League');
      }
    }

    // 4. Real or LiDAR or Original Filter
    if (selectedRealOrLidar !== 'All') {
      if (selectedRealOrLidar === 'Real') {
        result = result.filter((c) => c.IsRealWorld === true);
      } else if (selectedRealOrLidar === 'LiDAR') {
        result = result.filter((c) => c.IsLidar === true);
      } else if (selectedRealOrLidar === 'Original') {
        result = result.filter((c) => !c.IsRealWorld && !c.IsLidar);
      }
    }

    // 5. TGC Theme Filter (Autumn, Boreal, Countryside, Delta, Desert, Harvest, Highlands, Rustic, Steppe, Swiss, Links, Temperate, Tropical, Winter)
    if (selectedTheme !== 'All') {
      result = result.filter(
        (c) => (c.Theme || '').toLowerCase() === selectedTheme.toLowerCase()
      );
    }

    // 6. Yardage Range Presets
    if (selectedYardagePreset !== 'Any') {
      if (selectedYardagePreset === 'under-6500') {
        result = result.filter((c) => c.CourseYardage < 6500);
      } else if (selectedYardagePreset === '6500-7000') {
        result = result.filter((c) => c.CourseYardage >= 6500 && c.CourseYardage <= 7000);
      } else if (selectedYardagePreset === '7000-7400') {
        result = result.filter((c) => c.CourseYardage >= 7000 && c.CourseYardage <= 7400);
      } else if (selectedYardagePreset === 'over-7400') {
        result = result.filter((c) => c.CourseYardage > 7400);
      }
    }

    // 7. Minimum Community Rating
    if (selectedMinRating > 0) {
      result = result.filter((c) => (c.CommunityRating || 0) >= selectedMinRating);
    }

    // 8. Green Speed Filter
    if (selectedGreenSpeed !== 'All') {
      result = result.filter((c) => {
        const gs = (c.GreenSpeed || '').toLowerCase();
        if (selectedGreenSpeed === 'lightning') return gs.includes('lightning') || gs.includes('17');
        if (selectedGreenSpeed === 'very-fast') return gs.includes('very fast') || gs.includes('16');
        if (selectedGreenSpeed === 'fast') return gs.includes('fast');
        return true;
      });
    }

    // 9. Sorting (Default: A - Z order)
    result.sort((a, b) => {
      switch (sortBy) {
        case 'name-asc':
          return a.CourseName.localeCompare(b.CourseName);
        case 'name-desc':
          return b.CourseName.localeCompare(a.CourseName);
        case 'rating-desc':
          return (b.CommunityRating || 0) - (a.CommunityRating || 0);
        case 'reviews-desc':
          return (b.ReviewCount || 0) - (a.ReviewCount || 0);
        case 'yardage-desc':
          return b.CourseYardage - a.CourseYardage;
        case 'yardage-asc':
          return a.CourseYardage - b.CourseYardage;
        case 'difficulty-desc':
          return b.Difficulty - a.Difficulty;
        case 'designer-asc':
          return a.CreatorName.localeCompare(b.CreatorName);
        default:
          return a.CourseName.localeCompare(b.CourseName);
      }
    });

    return result;
  }, [
    tgcCourses,
    searchQuery,
    selectedLetter,
    selectedTour,
    selectedRealOrLidar,
    selectedTheme,
    selectedYardagePreset,
    selectedMinRating,
    selectedGreenSpeed,
    sortBy,
  ]);

  // Reset page to 1 whenever any filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchQuery,
    selectedLetter,
    selectedTour,
    selectedRealOrLidar,
    selectedTheme,
    selectedYardagePreset,
    selectedMinRating,
    selectedGreenSpeed,
    sortBy,
    pageSize,
  ]);

  // Pagination calculation: 24 courses at a time
  const totalCount = filteredCourses.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedCourses = useMemo(() => {
    const startIndex = (validCurrentPage - 1) * pageSize;
    return filteredCourses.slice(startIndex, startIndex + pageSize);
  }, [filteredCourses, validCurrentPage, pageSize]);

  const startIndex = totalCount === 0 ? 0 : (validCurrentPage - 1) * pageSize + 1;
  const endIndex = Math.min(validCurrentPage * pageSize, totalCount);

  // Jump to page handler
  const handleJumpPage = (e: React.FormEvent) => {
    e.preventDefault();
    const p = parseInt(jumpPageInput, 10);
    if (!isNaN(p) && p >= 1 && p <= totalPages) {
      setCurrentPage(p);
      setJumpPageInput('');
    }
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedLetter('All');
    setSelectedTour('All');
    setSelectedRealOrLidar('All');
    setSelectedTheme('All');
    setSelectedYardagePreset('Any');
    setSelectedMinRating(0);
    setSelectedGreenSpeed('All');
    setSortBy('name-asc');
    setCurrentPage(1);
  };

  const hasActiveFilters =
    Boolean(searchQuery.trim()) ||
    selectedLetter !== 'All' ||
    selectedTour !== 'All' ||
    selectedRealOrLidar !== 'All' ||
    selectedTheme !== 'All' ||
    selectedYardagePreset !== 'Any' ||
    selectedMinRating > 0 ||
    selectedGreenSpeed !== 'All' ||
    sortBy !== 'name-asc';

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#09140e]">
      {/* 1. Header & Hero Section */}
      <div className="p-4 lg:p-6 pb-3 border-b border-[#183626] bg-[#0b1b12] shrink-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-bold uppercase tracking-wider">
                <Award className="w-3.5 h-3.5 text-amber-400" />
                <span>TGC Tours Full Library</span>
              </span>
              <span className="text-[11px] text-emerald-400 font-mono font-semibold">
                {stats.total.toLocaleString()} Courses Available
              </span>
              <span className="text-[11px] text-slate-400">· 24 Courses Per Page</span>
            </div>
            <h1 className="text-xl lg:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <span>TGC Tours 1,000+ Course Library</span>
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Explore the complete competitive database of 1,000+ courses by A–Z alphabetical order, Tour classification, Real vs LiDAR vs Original designs, and official 2K course themes.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2 self-start md:self-center flex-wrap">
            <a
              href="https://www.tgctours.com/Course/Tgc2k25Listings"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-[#12281c] hover:bg-[#1a3826] border border-[#234832] text-amber-300 hover:text-amber-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
              title="Open tgctours.com official directory"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>tgctours.com</span>
            </a>

            {onNavigateToMap && (
              <button
                onClick={onNavigateToMap}
                className="px-3 py-1.5 bg-[#12281c] hover:bg-[#1a3826] border border-[#234832] text-emerald-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                title="View courses on global interactive map"
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>Map View</span>
              </button>
            )}

            {onOpenAddCourseModal && (
              <button
                onClick={onOpenAddCourseModal}
                className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-md border border-emerald-500/50 cursor-pointer active:scale-95"
                title="Add a custom course to the library"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Course</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 mt-3 pt-3 border-t border-[#163323]">
          <div className="bg-[#0e2117] border border-[#1b3e2b] rounded-lg px-3 py-1.5 flex items-center justify-between">
            <div>
              <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Library Size</div>
              <div className="text-base font-bold text-white font-mono">{stats.total.toLocaleString()}</div>
            </div>
            <Award className="w-4 h-4 text-emerald-400 opacity-80" />
          </div>

          <div className="bg-[#0e2117] border border-[#1b3e2b] rounded-lg px-3 py-1.5 flex items-center justify-between">
            <div>
              <div className="text-[10px] text-amber-400/90 font-medium uppercase tracking-wider">Tour Worthy</div>
              <div className="text-base font-bold text-amber-300 font-mono">{stats.tourWorthyCount}</div>
            </div>
            <Sparkles className="w-4 h-4 text-amber-400 opacity-80" />
          </div>

          <div className="bg-[#0e2117] border border-[#1b3e2b] rounded-lg px-3 py-1.5 flex items-center justify-between">
            <div>
              <div className="text-[10px] text-purple-400 font-medium uppercase tracking-wider">Platinum & Elite</div>
              <div className="text-base font-bold text-purple-300 font-mono">{stats.platinumEliteCount}</div>
            </div>
            <Flame className="w-4 h-4 text-purple-400 opacity-80" />
          </div>

          <div className="bg-[#0e2117] border border-[#1b3e2b] rounded-lg px-3 py-1.5 flex items-center justify-between">
            <div>
              <div className="text-[10px] text-cyan-400 font-medium uppercase tracking-wider">LiDAR Replicas</div>
              <div className="text-base font-bold text-cyan-300 font-mono">{stats.lidarCount}</div>
            </div>
            <Globe className="w-4 h-4 text-cyan-400 opacity-80" />
          </div>

          <div className="bg-[#0e2117] border border-[#1b3e2b] rounded-lg px-3 py-1.5 flex items-center justify-between col-span-2 sm:col-span-1">
            <div>
              <div className="text-[10px] text-emerald-400 font-medium uppercase tracking-wider">Real Courses</div>
              <div className="text-base font-bold text-emerald-300 font-mono">{stats.realCourseCount}</div>
            </div>
            <ShieldCheck className="w-4 h-4 text-emerald-400 opacity-80" />
          </div>
        </div>
      </div>

      {/* 2. Interactive Criteria & Navigation Controls */}
      <div className="p-3 lg:p-4 bg-[#0a1811] border-b border-[#183626] space-y-2.5 shrink-0">
        {/* Search Bar, Quick Mode Criteria & View Switcher */}
        <div className="flex flex-col lg:flex-row lg:items-center gap-2.5">
          {/* Full Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search 1,000+ TGC courses by name, designer, location, theme, or tags..."
              className="w-full pl-9 pr-9 py-2 bg-[#06100a] border border-[#1d3d2a] rounded-lg text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Real vs LiDAR vs Original Selector */}
          <div className="flex items-center gap-1 p-1 bg-[#06100a] border border-[#1d3d2a] rounded-lg shrink-0">
            {(
              [
                { id: 'All', label: 'All Courses' },
                { id: 'Real', label: 'Real World' },
                { id: 'LiDAR', label: 'LiDAR' },
                { id: 'Original', label: 'Originals' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                onClick={() => setSelectedRealOrLidar(opt.id)}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                  selectedRealOrLidar === opt.id
                    ? 'bg-[#183827] text-emerald-300 border border-emerald-500/50 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* View Mode & Filter Drawer Toggle */}
          <div className="flex items-center gap-2 self-end lg:self-auto shrink-0">
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors border ${
                showAdvancedFilters || hasActiveFilters
                  ? 'bg-[#183827] border-emerald-500/50 text-emerald-300'
                  : 'bg-[#0e2117] border-[#1d3d2a] text-slate-300 hover:bg-[#142d1f]'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>More Filters</span>
              {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-emerald-400"></span>}
            </button>

            {/* Grid vs Table View switcher */}
            <div className="flex items-center p-0.5 bg-[#06100a] border border-[#1d3d2a] rounded-lg">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded text-xs transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-[#183827] text-emerald-300 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="24 Courses Per Page - Grid Card View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded text-xs transition-colors ${
                  viewMode === 'table'
                    ? 'bg-[#183827] text-emerald-300 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="24 Courses Per Page - Directory Table View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* A - Z Letter Index Bar (User requirement: "In A - Z order 24 courses at a time") */}
        <div className="flex items-center gap-1 overflow-x-auto py-1 text-xs no-scrollbar">
          <span className="text-[11px] font-semibold text-slate-400 mr-1 shrink-0 flex items-center gap-1">
            <ArrowUpDown className="w-3 h-3 text-amber-400" />
            <span>A - Z Index:</span>
          </span>
          {ALPHABET.map((letter) => {
            const isSelected = selectedLetter === letter;
            return (
              <button
                key={letter}
                onClick={() => setSelectedLetter(letter)}
                className={`min-w-[26px] h-6 px-1.5 rounded text-[11px] font-mono font-bold transition-all shrink-0 flex items-center justify-center ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold border border-amber-300'
                    : 'bg-[#06100a] hover:bg-[#12281c] text-slate-300 border border-[#183626]'
                }`}
                title={letter === 'All' ? 'Display all letters' : `Filter courses starting with ${letter}`}
              >
                {letter}
              </button>
            );
          })}
        </div>

        {/* 14 Official Themes Selector Bar (User requirement: "By themes such as: Autumn, Boreal, Countryside, Delta, Desert, Harvest, Highlands, Rustic, Steppe, Swiss, Links, Temperate, Tropical, Winter") */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 no-scrollbar">
          <span className="text-[11px] font-semibold text-slate-400 mr-1 shrink-0 flex items-center gap-1">
            <Trees className="w-3 h-3 text-emerald-400" />
            <span>Theme:</span>
          </span>
          {ALL_TGC_THEMES.map((th) => {
            const isSelected = selectedTheme === th.id;
            const count = themeCounts[th.id] || 0;
            return (
              <button
                key={th.id}
                onClick={() => setSelectedTheme(th.id)}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
                  isSelected
                    ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-md border border-emerald-400'
                    : 'bg-[#06100a] hover:bg-[#12281c] text-slate-300 border border-[#183626]'
                }`}
              >
                <span>{th.icon}</span>
                <span>{th.label}</span>
                {count > 0 && (
                  <span
                    className={`text-[10px] px-1 rounded font-mono ${
                      isSelected ? 'bg-black/30 text-white' : 'bg-[#0e2117] text-slate-400'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tour Status Filter Chips (User requirement: "By Tour 24 courses at a time") */}
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          <span className="text-[11px] text-slate-400 font-semibold mr-1 flex items-center gap-1 shrink-0">
            <Award className="w-3 h-3 text-amber-400" />
            <span>TGC Tour:</span>
          </span>

          {(
            [
              { id: 'All', label: 'All Tours' },
              { id: 'Tour Worthy', label: '★ Tour Worthy' },
              { id: 'Platinum Tour', label: '◆ Platinum Tour' },
              { id: 'Elite Tour', label: '❖ Elite Tour' },
              { id: 'Kinetic Tour', label: '▲ Kinetic Tour' },
              { id: 'Challenge Circuit', label: '● Challenge Circuit' },
              { id: 'Approved', label: '✓ TGC Approved' },
              { id: 'Beer League', label: '🍺 Beer League' },
            ] as const
          ).map((tier) => {
            const isSelected = selectedTour === tier.id;
            return (
              <button
                key={tier.id}
                onClick={() => setSelectedTour(tier.id)}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                  isSelected
                    ? tier.id === 'Tour Worthy'
                      ? 'bg-amber-600 text-white font-bold border border-amber-300 shadow-sm'
                      : tier.id === 'Platinum Tour'
                      ? 'bg-purple-600 text-white font-bold border border-purple-300 shadow-sm'
                      : tier.id === 'Elite Tour'
                      ? 'bg-blue-600 text-white font-bold border border-blue-300 shadow-sm'
                      : 'bg-emerald-600 text-white font-bold border border-emerald-400 shadow-sm'
                    : 'bg-[#06100a] hover:bg-[#12281c] text-slate-300 border border-[#1b3d2b]'
                }`}
              >
                <span>{tier.label}</span>
              </button>
            );
          })}
        </div>

        {/* Advanced Filters Drawer */}
        {showAdvancedFilters && (
          <div className="pt-2 border-t border-[#183626] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-[#06100a] p-3 rounded-lg border border-[#193926]">
            {/* Yardage Range */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1 flex items-center justify-between">
                <span>Yardage Range</span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {yardageUnit === 'metres' ? 'Metres' : 'Yards'}
                </span>
              </label>
              <select
                value={selectedYardagePreset}
                onChange={(e) => setSelectedYardagePreset(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-[#0c1c13] border border-[#1d3d2a] rounded text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="Any">Any Yardage</option>
                <option value="under-6500">Short (&lt; 6,500 yds / &lt; 5,944 m)</option>
                <option value="6500-7000">Medium (6,500 – 7,000 yds)</option>
                <option value="7000-7400">Tournament (7,000 – 7,400 yds)</option>
                <option value="over-7400">Championship Long (7,400+ yds)</option>
              </select>
            </div>

            {/* Min Community Rating */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Minimum Rating
              </label>
              <select
                value={selectedMinRating}
                onChange={(e) => setSelectedMinRating(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 bg-[#0c1c13] border border-[#1d3d2a] rounded text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value={0}>Any Rating</option>
                <option value={4.0}>4.0+ Stars</option>
                <option value={4.5}>4.5+ Stars</option>
                <option value={4.8}>4.8+ Stars (Elite)</option>
                <option value={4.9}>4.9+ Stars (Masterpiece)</option>
              </select>
            </div>

            {/* Green Speed */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Green Speed (Stimp)
              </label>
              <select
                value={selectedGreenSpeed}
                onChange={(e) => setSelectedGreenSpeed(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-[#0c1c13] border border-[#1d3d2a] rounded text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="All">All Green Speeds</option>
                <option value="lightning">Lightning (170+)</option>
                <option value="very-fast">Very Fast (160–169)</option>
                <option value="fast">Fast (150–159)</option>
              </select>
            </div>

            {/* Courses Per Page Selector */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Courses Per Page
              </label>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 bg-[#0c1c13] border border-[#1d3d2a] rounded text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value={24}>24 Courses (Standard)</option>
                <option value={48}>48 Courses</option>
                <option value={72}>72 Courses</option>
              </select>
            </div>
          </div>
        )}

        {/* Results Bar & Pagination Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs text-slate-400 border-t border-[#142d1f]">
          <div className="flex items-center gap-2 flex-wrap">
            <span>
              Showing <strong className="text-white font-mono">{startIndex}–{endIndex}</strong> of{' '}
              <strong className="text-amber-300 font-mono">{totalCount.toLocaleString()}</strong> TGC courses
              (Page <span className="font-mono text-white">{validCurrentPage}</span> of{' '}
              <span className="font-mono">{totalPages}</span>)
            </span>
            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="text-emerald-400 hover:text-emerald-300 text-[11px] underline flex items-center gap-1 cursor-pointer ml-1"
              >
                <X className="w-3 h-3" />
                <span>Reset all criteria</span>
              </button>
            )}
          </div>

          {/* Top Pagination Controls */}
          <div className="flex items-center gap-2.5">
            {/* Sort Selector */}
            <div className="flex items-center gap-1">
              <span className="text-slate-400 text-[11px] flex items-center gap-0.5">
                <ArrowUpDown className="w-3 h-3" />
                <span>Sort:</span>
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="bg-[#06100a] border border-[#1d3d2a] text-slate-200 text-xs rounded px-2 py-1 focus:outline-none focus:border-emerald-500 font-medium"
              >
                <option value="name-asc">A - Z (Alphabetical)</option>
                <option value="name-desc">Z - A (Reverse)</option>
                <option value="rating-desc">Highest Community Rating</option>
                <option value="reviews-desc">Most Reviewed / Popular</option>
                <option value="yardage-desc">Longest Yardage</option>
                <option value="yardage-asc">Shortest Yardage</option>
                <option value="difficulty-desc">Highest Difficulty</option>
                <option value="designer-asc">Designer Name (A-Z)</option>
              </select>
            </div>

            {/* Quick Page Steppers */}
            <div className="flex items-center gap-1">
              <button
                disabled={validCurrentPage <= 1}
                onClick={() => setCurrentPage(1)}
                className="p-1 rounded bg-[#06100a] hover:bg-[#12281c] border border-[#1d3d2a] text-slate-300 disabled:opacity-40 disabled:pointer-events-none"
                title="First Page"
              >
                <ChevronsLeft className="w-3.5 h-3.5" />
              </button>
              <button
                disabled={validCurrentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1 rounded bg-[#06100a] hover:bg-[#12281c] border border-[#1d3d2a] text-slate-300 disabled:opacity-40 disabled:pointer-events-none"
                title="Previous 24 Courses"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="px-2 py-0.5 text-xs font-mono font-bold text-white bg-[#0e2117] border border-[#1b3e2b] rounded">
                {validCurrentPage} / {totalPages}
              </span>
              <button
                disabled={validCurrentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="p-1 rounded bg-[#06100a] hover:bg-[#12281c] border border-[#1d3d2a] text-slate-300 disabled:opacity-40 disabled:pointer-events-none"
                title="Next 24 Courses"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button
                disabled={validCurrentPage >= totalPages}
                onClick={() => setCurrentPage(totalPages)}
                className="p-1 rounded bg-[#06100a] hover:bg-[#12281c] border border-[#1d3d2a] text-slate-300 disabled:opacity-40 disabled:pointer-events-none"
                title="Last Page"
              >
                <ChevronsRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Main Course Display Area (24 courses at a time) */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-5">
        {totalCount === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center max-w-md mx-auto">
            <div className="w-14 h-14 rounded-full bg-[#12281c] border border-[#1d3d2a] flex items-center justify-center text-amber-400 mb-4 shadow-inner">
              <Award className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">No TGC Courses Match Your Criteria</h3>
            <p className="text-xs text-slate-400 mb-5 leading-relaxed">
              No courses in the 1,000+ course library match your current letter, tour tier, theme, or origin filter. Try clearing filters or selecting another theme.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                onClick={handleClearFilters}
                className="px-4 py-2 bg-[#12281b] hover:bg-[#1a3826] text-emerald-300 rounded text-xs font-semibold transition-colors border border-[#234832]"
              >
                Reset All Criteria
              </button>
              {onOpenAddCourseModal && (
                <button
                  onClick={onOpenAddCourseModal}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold transition-colors flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Custom TGC Course</span>
                </button>
              )}
            </div>
          </div>
        ) : viewMode === 'grid' ? (
          /* Grid View: Exactly 24 courses rendered at a time */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {paginatedCourses.map((course) => {
              const isSaved = savedIds.has(course.CourseID) || course.IsSaved;
              const isFav = favIds.has(course.CourseID) || course.IsFavourite;
              const courseWithLocalState: Course = {
                ...course,
                IsSaved: isSaved,
                IsFavourite: isFav,
              };

              return (
                <div key={course.CourseID} className="relative group flex flex-col">
                  <CourseCard
                    course={courseWithLocalState}
                    personalReview={reviews.find((r) => r.CourseID === course.CourseID)}
                    yardageUnit={yardageUnit}
                    onViewCourse={onViewCourse}
                    onToggleSave={onToggleSave}
                    onToggleFavourite={onToggleFavourite}
                    onOpenAddToCollection={onOpenAddToCollection}
                  />

                  {/* Top-Right TGC Tour Floating Badge */}
                  <div className="absolute top-2.5 right-2.5 pointer-events-none z-10 flex flex-col items-end gap-1">
                    {course.TgcStatus === 'Tour Worthy' ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-black shadow-md border border-amber-300 uppercase tracking-wider">
                        Tour Worthy
                      </span>
                    ) : course.TgcStatus === 'Platinum Tour' ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-600 text-white shadow-md border border-purple-400 uppercase tracking-wider">
                        Platinum Tour
                      </span>
                    ) : course.TgcStatus === 'Elite Tour' ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-600 text-white shadow-md border border-blue-400 uppercase tracking-wider">
                        Elite Tour
                      </span>
                    ) : course.TgcStatus === 'Kinetic Tour' ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-600 text-white shadow-md border border-teal-400 uppercase tracking-wider">
                        Kinetic Tour
                      </span>
                    ) : course.TgcStatus === 'Challenge Circuit' ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-600 text-white shadow-md border border-emerald-400 uppercase tracking-wider">
                        Challenge Circuit
                      </span>
                    ) : course.TgcStatus === 'Beer League' ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-700 text-amber-100 shadow-md border border-amber-500 uppercase tracking-wider">
                        Beer League
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#143623] text-emerald-300 shadow-md border border-emerald-500/50 uppercase tracking-wider">
                        TGC Approved
                      </span>
                    )}

                    <div className="flex items-center gap-1">
                      {course.Theme && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-black/80 text-emerald-300 border border-emerald-500/40">
                          {course.Theme}
                        </span>
                      )}
                      {course.IsLidar && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-cyan-950/90 text-cyan-300 border border-cyan-500/40">
                          LiDAR
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Table View: Exactly 24 courses rendered at a time */
          <div className="bg-[#0a1811] border border-[#183626] rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0c1f15] text-slate-300 font-semibold border-b border-[#183626]">
                  <tr>
                    <th className="py-3 px-3 w-10 text-center text-slate-400">#</th>
                    <th className="py-3 px-3">TGC Tour</th>
                    <th className="py-3 px-4">Course Name & Location</th>
                    <th className="py-3 px-3">Theme</th>
                    <th className="py-3 px-3">Designer</th>
                    <th className="py-3 px-2 text-center">Par</th>
                    <th className="py-3 px-3 text-right">Yardage</th>
                    <th className="py-3 px-3">Greens / Stimp</th>
                    <th className="py-3 px-3 text-center">Rating</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#132c1e]">
                  {paginatedCourses.map((course, idx) => {
                    const isSaved = savedIds.has(course.CourseID) || course.IsSaved;
                    const isFav = favIds.has(course.CourseID) || course.IsFavourite;
                    const overallIndex = (validCurrentPage - 1) * pageSize + idx + 1;

                    return (
                      <tr
                        key={course.CourseID}
                        onClick={() => onViewCourse(course)}
                        className="hover:bg-[#0f2419] transition-colors cursor-pointer group"
                      >
                        {/* Number Index */}
                        <td className="py-3 px-3 text-center text-slate-400 font-mono text-[11px]">
                          {overallIndex}
                        </td>

                        {/* Status Badge */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            {course.TgcStatus === 'Tour Worthy' ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                Tour Worthy
                              </span>
                            ) : course.TgcStatus === 'Platinum Tour' ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                                Platinum
                              </span>
                            ) : course.TgcStatus === 'Elite Tour' ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40">
                                Elite
                              </span>
                            ) : course.TgcStatus === 'Kinetic Tour' ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/40">
                                Kinetic
                              </span>
                            ) : course.TgcStatus === 'Challenge Circuit' ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                                Challenge
                              </span>
                            ) : course.TgcStatus === 'Beer League' ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-700/30 text-amber-300 border border-amber-600/40">
                                Beer League
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#142d1f] text-emerald-400 border border-[#1e442f]">
                                Approved
                              </span>
                            )}
                            {course.IsLidar && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                                LiDAR
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Course Name & Location */}
                        <td className="py-3 px-4">
                          <div className="font-semibold text-white group-hover:text-emerald-300 transition-colors">
                            {course.CourseName}
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 text-slate-500" />
                            <span>{course.LocationText || `${course.City || ''}, ${course.Country || ''}`}</span>
                          </div>
                        </td>

                        {/* Theme */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span className="px-2 py-0.5 bg-[#12281b] border border-[#1c3e2b] rounded text-[11px] text-emerald-300 font-medium">
                            {course.Theme || course.CourseType}
                          </span>
                        </td>

                        {/* Designer */}
                        <td className="py-3 px-3 text-slate-300 whitespace-nowrap">
                          {course.CreatorName}
                        </td>

                        {/* Par */}
                        <td className="py-3 px-2 text-center font-mono font-bold text-white">
                          {course.Par || 72}
                        </td>

                        {/* Yardage */}
                        <td className="py-3 px-3 text-right font-mono font-semibold text-emerald-300 whitespace-nowrap">
                          {formatYardage(course.CourseYardage, yardageUnit)}
                        </td>

                        {/* Greens / Stimp */}
                        <td className="py-3 px-3 text-slate-300 text-[11px] whitespace-nowrap">
                          <div>{course.GreenSpeed || 'Tournament (160)'}</div>
                          <div className="text-[10px] text-slate-400">{course.Firmness || 'Firm'}</div>
                        </td>

                        {/* Rating */}
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1 text-amber-400 font-bold font-mono">
                            <Star className="w-3.5 h-3.5 fill-amber-400" />
                            <span>{(course.CommunityRating || 4.9).toFixed(2)}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {(course.ReviewCount || 100).toLocaleString()} revs
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => onViewCourse(course)}
                              className="p-1.5 bg-[#12281b] hover:bg-[#1a3826] text-slate-300 hover:text-white rounded border border-[#234832] transition-colors"
                              title="View full course specifications"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => onToggleSave(course)}
                              className={`p-1.5 rounded border transition-colors ${
                                isSaved
                                  ? 'bg-emerald-600 text-white border-emerald-500'
                                  : 'bg-[#12281b] hover:bg-[#1a3826] text-slate-300 border-[#234832]'
                              }`}
                              title={isSaved ? 'Remove from Saved' : 'Save to Offline Database'}
                            >
                              {isSaved ? <BookmarkCheck className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
                            </button>

                            {onOpenAddToCollection && (
                              <button
                                onClick={() => onOpenAddToCollection(course)}
                                className="p-1.5 bg-[#12281b] hover:bg-[#1a3826] text-slate-300 hover:text-white rounded border border-[#234832] transition-colors"
                                title="Add to custom collection"
                              >
                                <FolderPlus className="w-3.5 h-3.5 text-emerald-400" />
                              </button>
                            )}

                            <button
                              onClick={() => onToggleFavourite(course)}
                              className={`p-1.5 rounded border transition-colors ${
                                isFav
                                  ? 'bg-amber-600 text-white border-amber-500'
                                  : 'bg-[#12281b] hover:bg-[#1a3826] text-slate-300 border-[#234832]'
                              }`}
                              title={isFav ? 'Remove from Favourites' : 'Add to Favourites'}
                            >
                              <Star className={`w-3.5 h-3.5 ${isFav ? 'fill-white' : ''}`} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 4. Bottom Full Pagination Bar (24 courses at a time) */}
        {totalCount > 0 && (
          <div className="bg-[#0b1b12] border border-[#183626] rounded-xl p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
            <div className="text-xs text-slate-400 font-medium">
              Showing courses <strong className="text-white font-mono">{startIndex}–{endIndex}</strong> of{' '}
              <strong className="text-amber-300 font-mono">{totalCount.toLocaleString()}</strong> (24 per page)
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center gap-1.5 flex-wrap justify-center">
              <button
                disabled={validCurrentPage <= 1}
                onClick={() => setCurrentPage(1)}
                className="px-2.5 py-1.5 rounded bg-[#06100a] hover:bg-[#12281c] border border-[#1d3d2a] text-slate-200 text-xs font-semibold disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1 transition-colors"
                title="First Page"
              >
                <ChevronsLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">First</span>
              </button>

              <button
                disabled={validCurrentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded bg-[#06100a] hover:bg-[#12281c] border border-[#1d3d2a] text-slate-200 text-xs font-semibold disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1 transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Prev 24</span>
              </button>

              {/* Number buttons around current page */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let p = validCurrentPage - 2 + i;
                if (p < 1) p = i + 1;
                if (p > totalPages) p = totalPages - 4 + i;
                if (p < 1 || p > totalPages) return null;

                const isActive = p === validCurrentPage;
                return (
                  <button
                    key={p}
                    onClick={() => setCurrentPage(p)}
                    className={`w-8 h-8 rounded text-xs font-mono font-bold transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-extrabold shadow-md border border-amber-300'
                        : 'bg-[#06100a] hover:bg-[#12281c] text-slate-300 border border-[#1d3d2a]'
                    }`}
                  >
                    {p}
                  </button>
                );
              })}

              <button
                disabled={validCurrentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 rounded bg-[#06100a] hover:bg-[#12281c] border border-[#1d3d2a] text-slate-200 text-xs font-semibold disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1 transition-colors"
              >
                <span>Next 24</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>

              <button
                disabled={validCurrentPage >= totalPages}
                onClick={() => setCurrentPage(totalPages)}
                className="px-2.5 py-1.5 rounded bg-[#06100a] hover:bg-[#12281c] border border-[#1d3d2a] text-slate-200 text-xs font-semibold disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1 transition-colors"
                title="Last Page"
              >
                <span className="hidden sm:inline">Last</span>
                <ChevronsRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Jump to Page Form */}
            <form onSubmit={handleJumpPage} className="flex items-center gap-1.5 text-xs text-slate-400">
              <span>Go to:</span>
              <input
                type="number"
                min={1}
                max={totalPages}
                value={jumpPageInput}
                onChange={(e) => setJumpPageInput(e.target.value)}
                placeholder={`${validCurrentPage}`}
                className="w-14 px-2 py-1 bg-[#06100a] border border-[#1d3d2a] rounded text-white font-mono text-center focus:outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                className="px-2 py-1 bg-[#142d1f] hover:bg-[#1b3d2b] border border-[#234832] text-emerald-300 rounded font-semibold text-xs"
              >
                Go
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
