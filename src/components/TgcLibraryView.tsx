import React, { useState, useMemo } from 'react';
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
} from 'lucide-react';
import { Course, CourseCollection, PersonalReview } from '../types/golf';
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

type TgcTourTier =
  | 'All'
  | 'Tour Worthy'
  | 'Platinum Tour'
  | 'Elite Tour'
  | 'Challenge Circuit'
  | 'Approved'
  | 'LiDAR Only';

type SortOption =
  | 'rating-desc'
  | 'reviews-desc'
  | 'yardage-desc'
  | 'yardage-asc'
  | 'difficulty-desc'
  | 'name-asc'
  | 'designer-asc';

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
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTier, setSelectedTier] = useState<TgcTourTier>('All');
  const [selectedType, setSelectedType] = useState<string>('All');
  const [selectedYardagePreset, setSelectedYardagePreset] = useState<string>('Any');
  const [selectedMinRating, setSelectedMinRating] = useState<number>(0);
  const [selectedGreenSpeed, setSelectedGreenSpeed] = useState<string>('All');
  const [sortBy, setSortBy] = useState<SortOption>('rating-desc');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Extract all TGC Tours courses from the global dataset
  const tgcCourses = useMemo(() => {
    // Collect all courses with TGC identifiers, status, or tags
    const filtered = allCourses.filter((course) => {
      const hasTgcStatus = Boolean(course.TgcStatus);
      const hasTgcId = course.CourseID.toLowerCase().startsWith('tgc-');
      const hasTgcTags = course.CourseTags && course.CourseTags.some((t) =>
        t.toLowerCase().includes('tgc') ||
        t.toLowerCase().includes('tour worthy') ||
        t.toLowerCase().includes('approved') ||
        t.toLowerCase().includes('platinum') ||
        t.toLowerCase().includes('elite')
      );
      const hasTgcUrl = course.TgcListingUrl || (course.CourseURL && course.CourseURL.includes('tgctours.com'));
      return hasTgcStatus || hasTgcId || hasTgcTags || hasTgcUrl;
    });

    return filtered.length > 0 ? filtered : allCourses;
  }, [allCourses]);

  // Saved and Favourites ID sets for fast lookup
  const savedIds = useMemo(() => new Set(savedCourses.map((c) => c.CourseID)), [savedCourses]);
  const favIds = useMemo(() => new Set(favourites.map((c) => c.CourseID)), [favourites]);

  // Library statistics
  const stats = useMemo(() => {
    const total = tgcCourses.length;
    const tourWorthyCount = tgcCourses.filter(
      (c) => c.TgcStatus === 'Tour Worthy' || (c.CourseTags && c.CourseTags.includes('Tour Worthy'))
    ).length;
    const platinumCount = tgcCourses.filter((c) => c.TgcStatus === 'Platinum Tour').length;
    const eliteCount = tgcCourses.filter((c) => c.TgcStatus === 'Elite Tour').length;
    const challengeCount = tgcCourses.filter((c) => c.TgcStatus === 'Challenge Circuit').length;
    const approvedCount = tgcCourses.filter((c) => c.TgcStatus === 'Approved').length;
    const lidarCount = tgcCourses.filter((c) => c.IsLidar === true).length;
    const avgYardage = total > 0 ? Math.round(tgcCourses.reduce((acc, c) => acc + (c.CourseYardage || 0), 0) / total) : 7100;

    return {
      total,
      tourWorthyCount,
      platinumCount,
      eliteCount,
      challengeCount,
      approvedCount,
      lidarCount,
      avgYardage,
    };
  }, [tgcCourses]);

  // Filtered & Sorted Courses
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
          (c.CourseTags && c.CourseTags.some((t) => t.toLowerCase().includes(q))) ||
          (c.Description && c.Description.toLowerCase().includes(q))
        );
      });
    }

    // 2. TGC Tour Tier
    if (selectedTier !== 'All') {
      if (selectedTier === 'Tour Worthy') {
        result = result.filter(
          (c) => c.TgcStatus === 'Tour Worthy' || (c.CourseTags && c.CourseTags.includes('Tour Worthy'))
        );
      } else if (selectedTier === 'Platinum Tour') {
        result = result.filter((c) => c.TgcStatus === 'Platinum Tour');
      } else if (selectedTier === 'Elite Tour') {
        result = result.filter((c) => c.TgcStatus === 'Elite Tour');
      } else if (selectedTier === 'Challenge Circuit') {
        result = result.filter((c) => c.TgcStatus === 'Challenge Circuit');
      } else if (selectedTier === 'Approved') {
        result = result.filter((c) => c.TgcStatus === 'Approved' || c.TgcStatus === 'Tour Worthy');
      } else if (selectedTier === 'LiDAR Only') {
        result = result.filter((c) => c.IsLidar === true);
      }
    }

    // 3. Course Environment / Type
    if (selectedType !== 'All') {
      result = result.filter((c) => c.CourseType.toLowerCase() === selectedType.toLowerCase());
    }

    // 4. Yardage Presets
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

    // 5. Min Community Rating
    if (selectedMinRating > 0) {
      result = result.filter((c) => (c.CommunityRating || 0) >= selectedMinRating);
    }

    // 6. Green Speed Filter
    if (selectedGreenSpeed !== 'All') {
      result = result.filter((c) => {
        const gs = (c.GreenSpeed || '').toLowerCase();
        if (selectedGreenSpeed === 'lightning') return gs.includes('lightning') || gs.includes('17');
        if (selectedGreenSpeed === 'very-fast') return gs.includes('very fast') || gs.includes('16');
        if (selectedGreenSpeed === 'fast') return gs.includes('fast');
        return true;
      });
    }

    // 7. Sort Order
    result.sort((a, b) => {
      switch (sortBy) {
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
        case 'name-asc':
          return a.CourseName.localeCompare(b.CourseName);
        case 'designer-asc':
          return a.CreatorName.localeCompare(b.CreatorName);
        default:
          return 0;
      }
    });

    return result;
  }, [
    tgcCourses,
    searchQuery,
    selectedTier,
    selectedType,
    selectedYardagePreset,
    selectedMinRating,
    selectedGreenSpeed,
    sortBy,
  ]);

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedTier('All');
    setSelectedType('All');
    setSelectedYardagePreset('Any');
    setSelectedMinRating(0);
    setSelectedGreenSpeed('All');
    setSortBy('rating-desc');
  };

  const hasActiveFilters =
    Boolean(searchQuery.trim()) ||
    selectedTier !== 'All' ||
    selectedType !== 'All' ||
    selectedYardagePreset !== 'Any' ||
    selectedMinRating > 0 ||
    selectedGreenSpeed !== 'All';

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#09140e]">
      {/* 1. Header & Hero Section */}
      <div className="p-4 lg:p-6 pb-3 border-b border-[#183626] bg-[#0b1b12] shrink-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-bold uppercase tracking-wider">
                <Award className="w-3.5 h-3.5 text-amber-400" />
                <span>TGC Tours Official Library</span>
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                {stats.total} Verified 2K25 Courses
              </span>
            </div>
            <h1 className="text-xl lg:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <span>TGC Tours Full Course Library</span>
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Explore and search the complete directory of Tour Worthy layouts, Platinum & Elite championship venues, and LiDAR accurate replicas curated for PGA TOUR 2K25.
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
                title="Add a course and save to collection"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Course</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4 pt-3 border-t border-[#163323]">
          <div className="bg-[#0e2117] border border-[#1b3e2b] rounded-lg px-3 py-2 flex items-center justify-between">
            <div>
              <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Total Library</div>
              <div className="text-base font-bold text-white font-mono">{stats.total}</div>
            </div>
            <Award className="w-4 h-4 text-emerald-400 opacity-80" />
          </div>

          <div className="bg-[#0e2117] border border-[#1b3e2b] rounded-lg px-3 py-2 flex items-center justify-between">
            <div>
              <div className="text-[10px] text-amber-400/90 font-medium uppercase tracking-wider">Tour Worthy</div>
              <div className="text-base font-bold text-amber-300 font-mono">{stats.tourWorthyCount}</div>
            </div>
            <Sparkles className="w-4 h-4 text-amber-400 opacity-80" />
          </div>

          <div className="bg-[#0e2117] border border-[#1b3e2b] rounded-lg px-3 py-2 flex items-center justify-between">
            <div>
              <div className="text-[10px] text-purple-400 font-medium uppercase tracking-wider">Platinum & Elite</div>
              <div className="text-base font-bold text-purple-300 font-mono">
                {stats.platinumCount + stats.eliteCount}
              </div>
            </div>
            <Flame className="w-4 h-4 text-purple-400 opacity-80" />
          </div>

          <div className="bg-[#0e2117] border border-[#1b3e2b] rounded-lg px-3 py-2 flex items-center justify-between">
            <div>
              <div className="text-[10px] text-cyan-400 font-medium uppercase tracking-wider">LiDAR Replicas</div>
              <div className="text-base font-bold text-cyan-300 font-mono">{stats.lidarCount}</div>
            </div>
            <Globe className="w-4 h-4 text-cyan-400 opacity-80" />
          </div>
        </div>
      </div>

      {/* 2. Interactive Search & Filter Controls */}
      <div className="p-4 bg-[#0a1811] border-b border-[#183626] space-y-3 shrink-0">
        {/* Search Bar & Primary Tier Tabs */}
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search TGC Tours full library by course name, designer, location, or tags..."
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

          {/* View Mode & Filter Toggle */}
          <div className="flex items-center gap-2 self-end lg:self-auto">
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors border ${
                showAdvancedFilters || hasActiveFilters
                  ? 'bg-[#183827] border-emerald-500/50 text-emerald-300'
                  : 'bg-[#0e2117] border-[#1d3d2a] text-slate-300 hover:bg-[#142d1f]'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filters</span>
              {hasActiveFilters && (
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              )}
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
                title="Grid Card View"
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
                title="Directory Table View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Tour Status Filter Chips */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[11px] text-slate-400 font-medium mr-1 flex items-center gap-1">
            <Award className="w-3 h-3 text-amber-400" />
            <span>Tour Status:</span>
          </span>

          {(
            [
              { id: 'All', label: 'All Courses', count: stats.total },
              { id: 'Tour Worthy', label: 'Tour Worthy', count: stats.tourWorthyCount, color: 'amber' },
              { id: 'Platinum Tour', label: 'Platinum Tour', count: stats.platinumCount, color: 'purple' },
              { id: 'Elite Tour', label: 'Elite Tour', count: stats.eliteCount, color: 'blue' },
              { id: 'Challenge Circuit', label: 'Challenge Circuit', count: stats.challengeCount, color: 'emerald' },
              { id: 'Approved', label: 'TGC Approved', count: stats.approvedCount, color: 'green' },
              { id: 'LiDAR Only', label: 'LiDAR Replicas', count: stats.lidarCount, color: 'cyan' },
            ] as const
          ).map((tier) => {
            const isSelected = selectedTier === tier.id;
            return (
              <button
                key={tier.id}
                onClick={() => setSelectedTier(tier.id)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? tier.id === 'Tour Worthy'
                      ? 'bg-amber-600/90 text-white font-bold border border-amber-400/80 shadow-sm'
                      : tier.id === 'Platinum Tour'
                      ? 'bg-purple-600/90 text-white font-bold border border-purple-400/80 shadow-sm'
                      : tier.id === 'Elite Tour'
                      ? 'bg-blue-600/90 text-white font-bold border border-blue-400/80 shadow-sm'
                      : tier.id === 'LiDAR Only'
                      ? 'bg-cyan-700 text-white font-bold border border-cyan-400/80 shadow-sm'
                      : 'bg-emerald-600 text-white font-bold border border-emerald-400 shadow-sm'
                    : 'bg-[#0a1811] hover:bg-[#12281c] text-slate-300 border border-[#1b3d2b]'
                }`}
              >
                <span>{tier.label}</span>
                <span
                  className={`text-[10px] px-1 py-0.2 rounded font-mono ${
                    isSelected ? 'bg-black/30 text-white' : 'bg-[#142d1f] text-slate-400'
                  }`}
                >
                  {tier.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Advanced Filters Expandable Drawer */}
        {showAdvancedFilters && (
          <div className="pt-3 border-t border-[#183626] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-[#07130b] p-3 rounded-lg border">
            {/* Course Environment/Type */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Course Environment
              </label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-[#0c1c13] border border-[#1d3d2a] rounded text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="All">All Environments</option>
                <option value="Championship">Championship</option>
                <option value="Links">Links</option>
                <option value="Parkland">Parkland</option>
                <option value="Coastal">Coastal</option>
                <option value="Mountain">Mountain</option>
                <option value="Desert">Desert</option>
                <option value="Heathland">Heathland</option>
                <option value="Resort">Resort</option>
                <option value="Forest">Forest</option>
              </select>
            </div>

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
          </div>
        )}

        {/* Results Bar & Sort Order */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span>
              Showing <strong className="text-white font-mono">{filteredCourses.length}</strong> of{' '}
              <span className="font-mono">{stats.total}</span> TGC courses
            </span>
            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="text-emerald-400 hover:text-emerald-300 text-[11px] underline flex items-center gap-1 cursor-pointer"
              >
                <X className="w-3 h-3" />
                <span>Reset filters</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-[11px] flex items-center gap-1">
              <ArrowUpDown className="w-3 h-3" />
              <span>Sort:</span>
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="bg-[#06100a] border border-[#1d3d2a] text-slate-200 text-xs rounded px-2 py-1 focus:outline-none focus:border-emerald-500"
            >
              <option value="rating-desc">Highest Community Rating</option>
              <option value="reviews-desc">Most Reviewed / Popular</option>
              <option value="yardage-desc">Longest Yardage</option>
              <option value="yardage-asc">Shortest Yardage</option>
              <option value="difficulty-desc">Highest Difficulty</option>
              <option value="name-asc">Course Name (A-Z)</option>
              <option value="designer-asc">Designer Name (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. Main Course Display Area */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-6">
        {filteredCourses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center max-w-md mx-auto">
            <div className="w-14 h-14 rounded-full bg-[#12281c] border border-[#1d3d2a] flex items-center justify-center text-amber-400 mb-4 shadow-inner">
              <Award className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">
              No TGC Tours Courses Found
            </h3>
            <p className="text-xs text-slate-400 mb-5 leading-relaxed">
              No courses in the TGC Tours library match your current filter selection. Try adjusting your search query, tour tier, or yardage criteria.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                onClick={handleClearFilters}
                className="px-4 py-2 bg-[#12281b] hover:bg-[#1a3826] text-emerald-300 rounded text-xs font-semibold transition-colors border border-[#234832]"
              >
                Clear All Filters
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
          /* Grid View Mode */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredCourses.map((course) => {
              const isSaved = savedIds.has(course.CourseID) || course.IsSaved;
              const isFav = favIds.has(course.CourseID) || course.IsFavourite;
              const courseWithLocalState: Course = {
                ...course,
                IsSaved: isSaved,
                IsFavourite: isFav,
              };

              return (
                <div key={course.CourseID} className="relative group">
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
                    ) : course.TgcStatus === 'Challenge Circuit' ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-600 text-white shadow-md border border-emerald-400 uppercase tracking-wider">
                        Challenge Circuit
                      </span>
                    ) : course.TgcStatus === 'Approved' ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#143623] text-emerald-300 shadow-md border border-emerald-500/50 uppercase tracking-wider">
                        TGC Approved
                      </span>
                    ) : null}

                    {course.IsLidar && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-cyan-950/90 text-cyan-300 border border-cyan-500/40">
                        LiDAR
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Professional Table / Directory View Mode */
          <div className="bg-[#0a1811] border border-[#183626] rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0c1f15] text-slate-300 font-semibold border-b border-[#183626]">
                  <tr>
                    <th className="py-3 px-4">TGC Status</th>
                    <th className="py-3 px-4">Course Name & Location</th>
                    <th className="py-3 px-4">Designer</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4 text-center">Par</th>
                    <th className="py-3 px-4 text-right">Yardage</th>
                    <th className="py-3 px-4">Greens / Stimp</th>
                    <th className="py-3 px-4 text-center">Rating</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#132c1e]">
                  {filteredCourses.map((course) => {
                    const isSaved = savedIds.has(course.CourseID) || course.IsSaved;
                    const isFav = favIds.has(course.CourseID) || course.IsFavourite;

                    return (
                      <tr
                        key={course.CourseID}
                        onClick={() => onViewCourse(course)}
                        className="hover:bg-[#0f2419] transition-colors cursor-pointer group"
                      >
                        {/* Status Badge */}
                        <td className="py-3 px-4 whitespace-nowrap">
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
                            ) : course.TgcStatus === 'Challenge Circuit' ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                                Challenge
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

                        {/* Designer */}
                        <td className="py-3 px-4 text-slate-300 whitespace-nowrap">
                          {course.CreatorName}
                        </td>

                        {/* Type */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="px-2 py-0.5 bg-[#12281b] border border-[#1c3e2b] rounded text-[11px] text-slate-300">
                            {course.CourseType}
                          </span>
                        </td>

                        {/* Par */}
                        <td className="py-3 px-4 text-center font-mono font-bold text-white">
                          {course.Par || 72}
                        </td>

                        {/* Yardage */}
                        <td className="py-3 px-4 text-right font-mono font-semibold text-emerald-300 whitespace-nowrap">
                          {formatYardage(course.CourseYardage, yardageUnit)}
                        </td>

                        {/* Greens / Stimp */}
                        <td className="py-3 px-4 text-slate-300 text-[11px] whitespace-nowrap">
                          <div>{course.GreenSpeed || 'Tournament (160)'}</div>
                          <div className="text-[10px] text-slate-400">{course.Firmness || 'Firm'}</div>
                        </td>

                        {/* Rating */}
                        <td className="py-3 px-4 text-center whitespace-nowrap">
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
      </div>
    </div>
  );
};
