import React, { useState, useEffect } from 'react';
import {
  Search,
  SlidersHorizontal,
  RotateCcw,
  Sparkles,
  LayoutGrid,
  List,
  AlertCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  BookmarkCheck,
  Globe,
  ExternalLink,
  BookOpen,
  Compass,
  Award,
  Check,
  Copy,
  ShieldCheck,
  Layers,
  Plus,
} from 'lucide-react';
import {
  Course,
  CourseType,
  PersonalReview,
  SearchFilters,
  SearchHistoryItem,
  SortOption,
  WebCitation,
} from '../types/golf';
import { CourseCard } from './CourseCard';
import { courseDataProvider } from '../services/CourseDataProvider';
import { localDatabase } from '../services/LocalDatabase';

interface CourseSearchViewProps {
  yardageUnit: 'yards' | 'metres' | 'both';
  reviews: PersonalReview[];
  simulateOffline: boolean;
  onViewCourse: (course: Course) => void;
  onToggleSave: (course: Course) => void;
  onToggleFavourite: (course: Course) => void;
  initialQuery?: string;
  onOpenAddCourseModal?: () => void;
  onOpenAddToCollection?: (course: Course) => void;
  onNavigateToTgcLibrary?: () => void;
}

const ALL_COURSE_TYPES: CourseType[] = [
  'Resort',
  'Parkland',
  'Links',
  'Heathland',
  'Desert',
  'Mountain',
  'Coastal',
  'Forest',
  'Fantasy',
  'Championship',
  'Other',
];

const TGC_SEARCH_SUGGESTIONS = [
  'Tour Worthy championship links',
  'TPC Harding Park Tour Version',
  'GreyWolf Golf Club 2K25',
  'Squire Creek CC LiDAR',
  'Seven Mile Beach Tasmania',
  'Cabot Cliffs Inverness',
  'Crazycanuck1985 Royal County Down',
  'Over 7,200 Yards',
];

const WEB_SEARCH_SUGGESTIONS = [
  'TGC Tours top rated links courses',
  'Best championship courses over 7,400 yards',
  'Crazycanuck1985 newest alpine designs',
  'Bandon Dunes community recreation',
  'Seven Mile Beach Tasmania 2K25',
  'Top user created desert courses',
];

export const CourseSearchView: React.FC<CourseSearchViewProps> = ({
  yardageUnit,
  reviews,
  simulateOffline,
  onViewCourse,
  onToggleSave,
  onToggleFavourite,
  initialQuery = '',
  onOpenAddCourseModal,
  onOpenAddToCollection,
  onNavigateToTgcLibrary,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Search filter states - DEFAULT TO TGC TOURS LISTINGS AS MAIN OPTION
  const [filters, setFilters] = useState<SearchFilters>({
    query: initialQuery,
    creator: '',
    source: 'All',
    courseTypes: [],
    location: '',
    yardagePreset: 'Any',
    minYardage: null,
    maxYardage: null,
    difficulty: 'Any',
    minRating: null,
    holes: 'Any',
    sortBy: 'relevance',
    searchMode: 'tgctours', // 'tgctours' (MAIN) | 'catalog' | 'web'
    tgcStatus: 'All',
  });

  const [results, setResults] = useState<Course[]>([]);
  const [visibleCount, setVisibleCount] = useState<number>(10);
  const [webCitations, setWebCitations] = useState<WebCitation[]>([]);
  const [webNotice, setWebNotice] = useState<string | null>(null);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);

  // Load search history on mount
  useEffect(() => {
    localDatabase.getSearchHistory().then(setSearchHistory);
  }, []);

  // Perform search
  const executeSearch = async (currentFilters: SearchFilters) => {
    setVisibleCount(10);
    setLoading(true);
    setErrorMsg(null);
    setWebNotice(null);
    try {
      if (currentFilters.searchMode === 'tgctours') {
        // MAIN OPTION: Search TGC Tours 2K25 Listings (https://www.tgctours.com/Course/Tgc2k25Listings)
        setWebCitations([]);
        const tgcData = await courseDataProvider.searchTgc2k25Listings(currentFilters, simulateOffline);
        
        // Apply sorting
        const sorted = sortCourses(tgcData.courses, currentFilters.sortBy);
        setResults(sorted);

        if (currentFilters.query || (currentFilters.tgcStatus && currentFilters.tgcStatus !== 'All')) {
          await localDatabase.addSearchHistory({
            SearchText: `[TGC] ${currentFilters.query || currentFilters.tgcStatus || 'TGC 2K25 Listings'}`,
            SourceFilter: `TGC Tours (${currentFilters.tgcStatus || 'All'})`,
            CourseTypeFilter: currentFilters.courseTypes.join(', ') || 'All',
            LocationFilter: currentFilters.location || 'Any',
            CourseYardageMin: currentFilters.minYardage,
            CourseYardageMax: currentFilters.maxYardage,
            DifficultyFilter: currentFilters.difficulty,
            RatingFilter: currentFilters.minRating,
            ResultCount: sorted.length,
          });
          const updated = await localDatabase.getSearchHistory();
          setSearchHistory(updated);
        }
      } else if (currentFilters.searchMode === 'web') {
        const webResult = await courseDataProvider.searchWebCourses(currentFilters, simulateOffline);
        const sorted = sortCourses(webResult.courses, currentFilters.sortBy);
        setResults(sorted);
        setWebCitations(webResult.citations);
        setWebNotice(webResult.notice || null);

        if (currentFilters.query) {
          await localDatabase.addSearchHistory({
            SearchText: `[Web] ${currentFilters.query}`,
            SourceFilter: 'Web Search',
            CourseTypeFilter: currentFilters.courseTypes.join(', ') || 'All',
            LocationFilter: currentFilters.location || 'Any',
            CourseYardageMin: currentFilters.minYardage,
            CourseYardageMax: currentFilters.maxYardage,
            DifficultyFilter: currentFilters.difficulty,
            RatingFilter: currentFilters.minRating,
            ResultCount: sorted.length,
          });
          const updated = await localDatabase.getSearchHistory();
          setSearchHistory(updated);
        }
      } else {
        // 'catalog' search
        setWebCitations([]);
        const searchResults = await courseDataProvider.searchCourses(currentFilters, simulateOffline);
        setResults(searchResults);

        if (
          currentFilters.query ||
          currentFilters.creator ||
          currentFilters.location ||
          currentFilters.yardagePreset !== 'Any' ||
          currentFilters.minYardage ||
          currentFilters.source !== 'All'
        ) {
          await localDatabase.addSearchHistory({
            SearchText: currentFilters.query || 'All Catalog Courses',
            SourceFilter: currentFilters.source,
            CourseTypeFilter: currentFilters.courseTypes.join(', ') || 'All',
            LocationFilter: currentFilters.location || 'Any',
            CourseYardageMin: currentFilters.minYardage,
            CourseYardageMax: currentFilters.maxYardage,
            DifficultyFilter: currentFilters.difficulty,
            RatingFilter: currentFilters.minRating,
            ResultCount: searchResults.length,
          });
          const updated = await localDatabase.getSearchHistory();
          setSearchHistory(updated);
        }
      }
    } catch (err: any) {
      console.warn('Search execution error, serving verified catalog courses:', err?.message || err);
      try {
        const fallbackCourses = await courseDataProvider.searchCourses(currentFilters, false);
        setResults(sortCourses(fallbackCourses, currentFilters.sortBy));
        setWebNotice('Live search is synchronizing; displaying verified courses from course database.');
      } catch {
        setErrorMsg('Unable to retrieve courses. Please check your connection.');
        setResults([]);
      }
    } finally {
      setLoading(false);
    }
  };

  // Helper sorting function
  const sortCourses = (list: Course[], sortBy: SortOption = 'relevance'): Course[] => {
    const copy = [...list];
    return copy.sort((a, b) => {
      switch (sortBy) {
        case 'name_asc':
          return a.CourseName.localeCompare(b.CourseName);
        case 'name_desc':
          return b.CourseName.localeCompare(a.CourseName);
        case 'rating_desc':
          return b.CommunityRating - a.CommunityRating;
        case 'rating_asc':
          return a.CommunityRating - b.CommunityRating;
        case 'yardage_asc':
          return a.CourseYardage - b.CourseYardage;
        case 'yardage_desc':
          return b.CourseYardage - a.CourseYardage;
        case 'difficulty_asc':
          return a.Difficulty - b.Difficulty;
        case 'difficulty_desc':
          return b.Difficulty - a.Difficulty;
        case 'official_first':
          if (a.SourceType === 'Official' && b.SourceType !== 'Official') return -1;
          if (b.SourceType === 'Official' && a.SourceType !== 'Official') return 1;
          return b.CommunityRating - a.CommunityRating;
        case 'user_created_first':
          if (a.SourceType === 'User Created' && b.SourceType !== 'User Created') return -1;
          if (b.SourceType === 'User Created' && a.SourceType !== 'User Created') return 1;
          return b.CommunityRating - a.CommunityRating;
        case 'recently_added':
          return new Date(b.CreatedDate).getTime() - new Date(a.CreatedDate).getTime();
        case 'relevance':
        default:
          return (b.Popularity || 50) - (a.Popularity || 50);
      }
    });
  };

  // Run on filter change or initial mount
  useEffect(() => {
    executeSearch(filters);
  }, [
    filters.searchMode,
    filters.tgcStatus,
    filters.yardagePreset,
    filters.minYardage,
    filters.maxYardage,
    filters.difficulty,
    filters.minRating,
    filters.holes,
    filters.source,
    filters.courseTypes,
    filters.sortBy,
    simulateOffline,
  ]);

  const handleManualSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    executeSearch(filters);
  };

  const handleClearFilters = () => {
    setVisibleCount(10);
    const defaultFilters: SearchFilters = {
      query: '',
      creator: '',
      source: 'All',
      courseTypes: [],
      location: '',
      yardagePreset: 'Any',
      minYardage: null,
      maxYardage: null,
      difficulty: 'Any',
      minRating: null,
      holes: 'Any',
      sortBy: 'relevance',
      searchMode: filters.searchMode,
      tgcStatus: 'All',
    };
    setFilters(defaultFilters);
  };

  const toggleCourseType = (type: CourseType) => {
    setFilters((prev) => {
      const exists = prev.courseTypes.includes(type);
      return {
        ...prev,
        courseTypes: exists ? prev.courseTypes.filter((t) => t !== type) : [...prev.courseTypes, type],
      };
    });
  };

  const handleRepeatSearch = (item: SearchHistoryItem) => {
    const isTgc = item.SearchText.startsWith('[TGC] ');
    const isWeb = item.SearchText.startsWith('[Web] ');
    let cleanedText = item.SearchText;
    if (isTgc) cleanedText = item.SearchText.replace('[TGC] ', '');
    else if (isWeb) cleanedText = item.SearchText.replace('[Web] ', '');
    else if (item.SearchText === 'All Catalog Courses') cleanedText = '';

    setFilters({
      query: cleanedText,
      creator: '',
      source: (item.SourceFilter.includes('Official') ? 'Official' : item.SourceFilter.includes('User Created') ? 'User Created' : 'All') as any,
      courseTypes: item.CourseTypeFilter && item.CourseTypeFilter !== 'All'
        ? (item.CourseTypeFilter.split(', ') as CourseType[])
        : [],
      location: item.LocationFilter === 'Any' ? '' : item.LocationFilter,
      yardagePreset: 'Any',
      minYardage: item.CourseYardageMin,
      maxYardage: item.CourseYardageMax,
      difficulty: item.DifficultyFilter || 'Any',
      minRating: item.RatingFilter,
      holes: 'Any',
      sortBy: 'relevance',
      searchMode: isTgc ? 'tgctours' : isWeb ? 'web' : 'catalog',
      tgcStatus: 'All',
    });
  };

  const handleSelectSuggestion = (suggestion: string) => {
    const newFilters = { ...filters, query: suggestion };
    setFilters(newFilters);
    executeSearch(newFilters);
  };

  const handleCopyTgcUrl = () => {
    navigator.clipboard.writeText('https://www.tgctours.com/Course/Tgc2k25Listings');
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  // Deduplicate results and calculate chunked / paginated display (10 courses initially + 10 more on request)
  const deduplicatedResults = results.filter(
    (course, index, self) => index === self.findIndex((c) => c.CourseID === course.CourseID)
  );
  const totalAvailable = deduplicatedResults.length;
  const displayedCourses = deduplicatedResults.slice(0, visibleCount);
  const remainingCount = Math.max(0, totalAvailable - displayedCourses.length);
  const nextBatchCount = Math.min(10, remainingCount);
  const hasMore = remainingCount > 0;

  return (
    <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4">
      {/* Search Mode Segmented Control Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-[#0b1710] border border-[#1b3b28] p-3 rounded-xl shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <span>PGA TOUR 2K25 Course Search</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                TGC Tours Main Option
              </span>
            </h1>
            <span className="text-xs text-slate-400">
              Primary source: <strong className="text-slate-300">https://www.tgctours.com/Course/Tgc2k25Listings</strong>
            </span>
          </div>
        </div>

        {/* Search Mode Switcher & Add Course Action */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap items-center gap-1 p-1 bg-[#06100a] border border-[#1d3d2a] rounded-lg">
            {/* 1. TGC TOURS 2K25 LISTINGS - MAIN OPTION */}
            <button
              onClick={() => setFilters({ ...filters, searchMode: 'tgctours' })}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
                filters.searchMode === 'tgctours'
                  ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-md border border-amber-400/60 font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-[#12281b]'
              }`}
            >
              <Award className="w-3.5 h-3.5 text-amber-200" />
              <span>TGC Tours 2K25 Listings</span>
              <span className="text-[9px] uppercase px-1 py-0.2 bg-black/40 rounded text-amber-200 ml-0.5 font-mono">
                Main
              </span>
            </button>

            {/* 2. CATALOG SEARCH */}
            <button
              onClick={() => setFilters({ ...filters, searchMode: 'catalog' })}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                filters.searchMode === 'catalog'
                  ? 'bg-[#183726] text-emerald-300 shadow-sm border border-emerald-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#12281b]'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Local Catalog</span>
            </button>

            {/* 3. LIVE WEB SEARCH */}
            <button
              onClick={() => setFilters({ ...filters, searchMode: 'web' })}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                filters.searchMode === 'web'
                  ? 'bg-sky-950/80 text-sky-300 shadow-sm border border-sky-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#12281b]'
              }`}
            >
              <Globe className="w-3.5 h-3.5 text-sky-400" />
              <span>Live Web Search</span>
            </button>
          </div>

          {/* Dedicated Full TGC Library Quick Link */}
          {onNavigateToTgcLibrary && (
            <button
              onClick={onNavigateToTgcLibrary}
              className="px-3 py-2 bg-[#172e20] hover:bg-[#1f3f2b] text-amber-300 border border-amber-500/40 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm shrink-0 cursor-pointer"
              title="Open the complete TGC Tours 2K25 course library with full directory view"
            >
              <Award className="w-3.5 h-3.5 text-amber-400" />
              <span>TGC Full Library</span>
              <span className="text-[9px] uppercase px-1.5 py-0.2 bg-amber-500/20 text-amber-300 rounded font-mono">
                1,000+
              </span>
            </button>
          )}

          {/* Add Course & Assign to Collections Button */}
          {onOpenAddCourseModal && (
            <button
              onClick={onOpenAddCourseModal}
              className="px-3 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white rounded-lg text-xs font-bold shadow-md transition-all flex items-center gap-1.5 border border-emerald-500/50 cursor-pointer active:scale-95 shrink-0"
              title="Add a course and all associated information and save it to any selected collection"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Course</span>
            </button>
          )}
        </div>
      </div>

      {/* TGC TOURS MAIN SEARCH HERO BANNER */}
      {filters.searchMode === 'tgctours' && (
        <div className="p-4 bg-gradient-to-r from-[#122318] via-[#162e20] to-[#0f2115] border border-amber-600/40 rounded-xl space-y-3 shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500 text-slate-950 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                Official TGC Tours 2K25 Database
              </span>
              <span className="text-xs text-amber-300/80 font-mono hidden md:inline">
                https://www.tgctours.com/Course/Tgc2k25Listings
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyTgcUrl}
                className="px-2.5 py-1 rounded bg-[#0a160f] hover:bg-[#132c1e] text-slate-300 hover:text-white border border-[#21432f] text-xs flex items-center gap-1 transition-colors"
                title="Copy TGC Tours Listings URL"
              >
                {copiedUrl ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedUrl ? 'Copied URL!' : 'Copy Link'}</span>
              </button>

              {onNavigateToTgcLibrary && (
                <button
                  type="button"
                  onClick={onNavigateToTgcLibrary}
                  className="px-3 py-1 rounded bg-[#173624] hover:bg-[#204931] border border-amber-500/50 text-amber-300 font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-sm"
                  title="Open the dedicated full library viewer"
                >
                  <Award className="w-3.5 h-3.5 text-amber-400" />
                  <span>Full Library Directory</span>
                </button>
              )}

              <a
                href="https://www.tgctours.com/Course/Tgc2k25Listings"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1 rounded bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <span>Open TGCTours.com</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          <p className="text-slate-200 text-xs leading-relaxed max-w-3xl">
            TGC Tours is the definitive competitive registry for PGA TOUR 2K25. Every course here is vetted for championship design, minimum 6,500+ yard distances, pristine fairway and green sculpting, and tournament pin positions.
          </p>

          {/* TGC Status Quick Filter Chips */}
          <div className="pt-1 flex flex-wrap items-center gap-1.5 border-t border-amber-900/30">
            <span className="text-[11px] text-amber-300 font-semibold mr-1">TGC Status:</span>
            {[
              { id: 'All', label: 'All TGC 2K25 Listings' },
              { id: 'Tour Worthy', label: '★ Tour Worthy (Gold Standard)' },
              { id: 'Approved', label: '✓ TGC Approved' },
              { id: 'Platinum Tour', label: '◆ Platinum Tour' },
              { id: 'Elite Tour', label: '❖ Elite Tour' },
              { id: 'LiDAR Only', label: '◈ LiDAR Recreations' },
            ].map((chip) => {
              const active = (filters.tgcStatus || 'All') === chip.id;
              return (
                <button
                  type="button"
                  key={chip.id}
                  onClick={() => setFilters({ ...filters, tgcStatus: chip.id })}
                  className={`px-2.5 py-1 rounded text-xs transition-colors font-medium ${
                    active
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                      : 'bg-[#09170f] hover:bg-[#132d1d] text-slate-300 border border-[#21432e]'
                  }`}
                >
                  {chip.label}
                </button>
              );
            })}
          </div>

          {/* Quick Suggestions for TGC Tours */}
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            <span className="text-[11px] text-slate-400 font-medium">Quick Searches:</span>
            {TGC_SEARCH_SUGGESTIONS.map((item) => (
              <button
                type="button"
                key={item}
                onClick={() => handleSelectSuggestion(item)}
                className="px-2 py-0.5 rounded text-[11px] bg-[#0a1710] hover:bg-[#143220] border border-amber-800/40 text-amber-200 hover:text-white transition-colors"
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Web Search Notice Banner when in Web Search Mode */}
      {filters.searchMode === 'web' && (
        <div className="p-3.5 bg-gradient-to-r from-[#0a1b24] via-[#0d222e] to-[#0a1b24] border border-sky-800/40 rounded-xl space-y-2 text-xs text-slate-200">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-sky-300 flex items-center gap-1.5 text-xs">
              <Globe className="w-4 h-4 text-sky-400" />
              Live Web Course Discovery (Google Grounding across forums & community)
            </span>
            <span className="text-[11px] text-sky-400 font-mono">Google Grounded</span>
          </div>
          <p className="text-slate-300 text-xs leading-relaxed">
            Search live across online databases, Reddit, 2K forums, and designer showcases. Any discovered course can be imported into your local offline database with full yardage and review tracking.
          </p>

          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[11px] text-slate-400 font-medium">Suggestions:</span>
            {WEB_SEARCH_SUGGESTIONS.map((item) => (
              <button
                type="button"
                key={item}
                onClick={() => handleSelectSuggestion(item)}
                className="px-2 py-0.5 rounded text-[11px] bg-[#071720] hover:bg-[#0f2838] border border-sky-700/40 text-sky-200 hover:text-white transition-colors"
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Search Bar Form */}
      <form onSubmit={handleManualSearchSubmit} className="bg-[#0b1710] border border-[#1b3b28] rounded-xl p-4 lg:p-5 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row gap-2.5">
          <div className="relative flex-1">
            {filters.searchMode === 'tgctours' ? (
              <Award className="w-4 h-4 text-amber-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            ) : filters.searchMode === 'web' ? (
              <Globe className="w-4 h-4 text-sky-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            ) : (
              <Search className="w-4 h-4 text-emerald-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            )}
            <input
              type="text"
              value={filters.query}
              onChange={(e) => setFilters({ ...filters, query: e.target.value })}
              placeholder={
                filters.searchMode === 'tgctours'
                  ? 'Search TGC Tours 2K25 Listings (e.g. Tour Worthy, GreyWolf, Seven Mile Beach, b101)...'
                  : filters.searchMode === 'web'
                  ? 'Search web for PGA TOUR 2K25 courses, designer releases, TGC Tours...'
                  : 'Search catalog by course name, creator, location, or tag...'
              }
              className={`w-full pl-10 pr-4 py-2.5 bg-[#07100b] border rounded-lg text-sm text-slate-100 placeholder-slate-400 focus:outline-none transition-colors ${
                filters.searchMode === 'tgctours'
                  ? 'border-amber-700/60 focus:border-amber-400 focus:ring-1 focus:ring-amber-400'
                  : filters.searchMode === 'web'
                  ? 'border-sky-800/60 focus:border-sky-400 focus:ring-1 focus:ring-sky-400'
                  : 'border-[#224731] focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'
              }`}
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="submit"
              className={`px-4 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors text-white ${
                filters.searchMode === 'tgctours'
                  ? 'bg-amber-600 hover:bg-amber-500 shadow-sm font-bold'
                  : filters.searchMode === 'web'
                  ? 'bg-sky-600 hover:bg-sky-500 shadow-sm'
                  : 'bg-emerald-600 hover:bg-emerald-500 shadow-sm'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>
                {filters.searchMode === 'tgctours'
                  ? 'Search TGC 2K25'
                  : filters.searchMode === 'web'
                  ? 'Search Web'
                  : 'Search'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className={`px-3.5 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border ${
                showAdvanced ||
                filters.courseTypes.length > 0 ||
                filters.yardagePreset !== 'Any' ||
                filters.minYardage ||
                filters.difficulty !== 'Any' ||
                filters.minRating
                  ? 'bg-emerald-900/50 border-emerald-600 text-emerald-300'
                  : 'bg-[#122419] border-[#224731] text-slate-300 hover:text-white hover:bg-[#1a3323]'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filters</span>
              {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            <button
              type="button"
              onClick={handleClearFilters}
              className="px-3 py-2.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-[#122419] border border-[#224731] transition-colors flex items-center gap-1"
              title="Reset all search filters"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          </div>
        </div>

        {/* Advanced Search Drawer */}
        {showAdvanced && (
          <div className="pt-3 border-t border-[#183624] space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Creator Name */}
              <div>
                <label className="block text-slate-400 font-medium mb-1">Course Designer / Creator</label>
                <input
                  type="text"
                  value={filters.creator}
                  onChange={(e) => setFilters({ ...filters, creator: e.target.value })}
                  placeholder="e.g. Crazycanuck1985, Rodger, Justin, b101"
                  className="w-full px-2.5 py-1.5 bg-[#07100b] border border-[#21432f] rounded text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Course Source */}
              <div>
                <label className="block text-slate-400 font-medium mb-1">Course Source</label>
                <select
                  value={filters.source}
                  onChange={(e) => setFilters({ ...filters, source: e.target.value as any })}
                  className="w-full px-2.5 py-1.5 bg-[#07100b] border border-[#21432f] rounded text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="All">All Sources</option>
                  <option value="User Created">User Created / TGC Designers Only</option>
                  <option value="Official">Official 2K25 Courses Only</option>
                </select>
              </div>

              {/* Location (Strictly course location, no distance from user) */}
              <div>
                <label className="block text-slate-400 font-medium mb-1">
                  Location (Country, Region, City)
                </label>
                <input
                  type="text"
                  value={filters.location}
                  onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                  placeholder="e.g. Scotland, California, Australia"
                  className="w-full px-2.5 py-1.5 bg-[#07100b] border border-[#21432f] rounded text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Number of Holes */}
              <div>
                <label className="block text-slate-400 font-medium mb-1">Number of Holes</label>
                <select
                  value={filters.holes}
                  onChange={(e) => setFilters({ ...filters, holes: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-[#07100b] border border-[#21432f] rounded text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="Any">Any Holes</option>
                  <option value="18">18 Holes (Championship Standard)</option>
                  <option value="9">9 Holes (Executive/Par 3)</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            {/* COURSE LENGTH / YARDAGE FILTER */}
            <div className="p-3 bg-[#08130c] border border-[#1d3d2a] rounded-lg space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <span className="font-semibold text-emerald-400 uppercase tracking-wider text-[11px]">
                  Course Length / Yardage Filter
                </span>
                <span className="text-[11px] text-slate-400">
                  TGC Tours Tour Worthy standard requires 6,500+ yards
                </span>
              </div>

              {/* Yardage Presets */}
              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: 'Any', label: 'Any Length' },
                  { id: 'under_5000', label: 'Under 5,000 yds' },
                  { id: '5000_5999', label: '5,000–5,999 yds' },
                  { id: '6000_6499', label: '6,000–6,499 yds' },
                  { id: '6500_6999', label: '6,500–6,999 yds' },
                  { id: '7000_7499', label: '7,000–7,499 yds' },
                  { id: '7500_plus', label: '7,500+ yds (Long Monster)' },
                ].map((range) => (
                  <button
                    type="button"
                    key={range.id}
                    onClick={() => {
                      setFilters({
                        ...filters,
                        yardagePreset: range.id,
                        minYardage: null,
                        maxYardage: null,
                      });
                    }}
                    className={`px-2.5 py-1 rounded text-xs transition-colors ${
                      filters.yardagePreset === range.id
                        ? 'bg-emerald-600 text-white font-semibold'
                        : 'bg-[#102217] text-slate-300 hover:bg-[#183323]'
                    }`}
                  >
                    {range.label}
                  </button>
                ))}
              </div>

              {/* Custom Yardage Inputs */}
              <div className="flex items-center gap-3 pt-1">
                <span className="text-slate-400 text-xs">Custom Exact Range:</span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={filters.minYardage ?? ''}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        minYardage: e.target.value ? Number(e.target.value) : null,
                        yardagePreset: 'Any',
                      })
                    }
                    placeholder="Min (e.g. 6500)"
                    className="w-28 px-2 py-1 bg-[#07100b] border border-[#21432f] rounded text-slate-200 focus:outline-none focus:border-emerald-500 font-mono text-xs"
                  />
                  <span className="text-slate-400">to</span>
                  <input
                    type="number"
                    value={filters.maxYardage ?? ''}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        maxYardage: e.target.value ? Number(e.target.value) : null,
                        yardagePreset: 'Any',
                      })
                    }
                    placeholder="Max (e.g. 7600)"
                    className="w-28 px-2 py-1 bg-[#07100b] border border-[#21432f] rounded text-slate-200 focus:outline-none focus:border-emerald-500 font-mono text-xs"
                  />
                  <span className="text-slate-400 text-xs font-mono">yards</span>
                </div>
              </div>
            </div>

            {/* Course Types Multi-Select */}
            <div>
              <label className="block text-slate-400 font-medium mb-1.5">
                Course Classification / Terrain
              </label>
              <div className="flex flex-wrap gap-1.5">
                {ALL_COURSE_TYPES.map((type) => {
                  const selected = filters.courseTypes.includes(type);
                  return (
                    <button
                      type="button"
                      key={type}
                      onClick={() => toggleCourseType(type)}
                      className={`px-2.5 py-1 rounded text-xs transition-colors border ${
                        selected
                          ? 'bg-emerald-800/80 border-emerald-500 text-white font-medium'
                          : 'bg-[#09150f] border-[#1d3d2a] text-slate-300 hover:bg-[#112419]'
                      }`}
                    >
                      {type}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Difficulty & Community Rating Filter */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Course Difficulty</label>
                <select
                  value={filters.difficulty}
                  onChange={(e) => setFilters({ ...filters, difficulty: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-[#07100b] border border-[#21432f] rounded text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="Any">Any Difficulty</option>
                  <option value="Very Easy">Very Easy (&lt; 5.0)</option>
                  <option value="Easy">Easy (5.0 – 6.5)</option>
                  <option value="Moderate">Moderate (6.5 – 7.8)</option>
                  <option value="Difficult">Difficult (7.8 – 9.0)</option>
                  <option value="Very Difficult">Very Difficult (9.0+)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Minimum Review Rating</label>
                <select
                  value={filters.minRating ?? ''}
                  onChange={(e) =>
                    setFilters({ ...filters, minRating: e.target.value ? Number(e.target.value) : null })
                  }
                  className="w-full px-2.5 py-1.5 bg-[#07100b] border border-[#21432f] rounded text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="">Any Rating</option>
                  <option value="3">3.0+ Stars</option>
                  <option value="4">4.0+ Stars</option>
                  <option value="4.5">4.5+ Stars</option>
                  <option value="4.8">4.8+ Stars</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Recent Searches Quick Pills */}
        {searchHistory.length > 0 && !showAdvanced && (
          <div className="pt-2 border-t border-[#173322] flex items-center gap-2 overflow-x-auto text-xs text-slate-400">
            <span className="shrink-0 flex items-center gap-1 text-[11px] text-slate-400">
              <Clock className="w-3 h-3" /> Recent:
            </span>
            {searchHistory.slice(0, 4).map((hist) => (
              <button
                type="button"
                key={hist.SearchID}
                onClick={() => handleRepeatSearch(hist)}
                className="px-2 py-0.5 bg-[#09150f] hover:bg-[#13271b] border border-[#1b3a27] rounded text-slate-300 text-[11px] truncate max-w-[200px] transition-colors"
                title={`Repeat search: ${hist.SearchText} (${hist.ResultCount} results)`}
              >
                {hist.SearchText} ({hist.ResultCount})
              </button>
            ))}
          </div>
        )}
      </form>

      {/* Web Search Citations Bar (when in Web Search Mode) */}
      {filters.searchMode === 'web' && webCitations.length > 0 && (
        <div className="p-3 bg-[#08151c] border border-sky-800/40 rounded-lg text-xs space-y-1.5">
          <span className="text-sky-300 font-semibold flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
            <Globe className="w-3.5 h-3.5" />
            Verified Web Sources & Citations
          </span>
          <div className="flex flex-wrap gap-2 pt-0.5">
            {webCitations.map((cite, i) => (
              <a
                key={`cite-${i}`}
                href={cite.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] px-2 py-1 bg-[#0d222e] hover:bg-[#133244] border border-sky-700/50 rounded text-sky-200 hover:text-white flex items-center gap-1 transition-colors truncate max-w-xs"
                title={cite.url}
              >
                <span className="truncate">{cite.title}</span>
                <ExternalLink className="w-2.5 h-2.5 shrink-0 opacity-70" />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Web Search Notice if quota limited */}
      {filters.searchMode === 'web' && webNotice && (
        <div className="p-3 bg-amber-950/30 border border-amber-800/50 rounded-lg text-xs text-amber-200 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{webNotice}</span>
        </div>
      )}

      {/* Control Bar: Result Count, Sort By, Grid/List toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0a160f] border border-[#183324] px-4 py-2.5 rounded-lg text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-slate-200 tabular-nums">
            {totalAvailable > 10
              ? `Displaying ${displayedCourses.length} of ${totalAvailable} courses`
              : `${totalAvailable} ${totalAvailable === 1 ? 'course' : 'courses'} found`}
          </span>
          {hasMore && (
            <span className="px-2 py-0.5 bg-emerald-950/90 text-emerald-300 rounded border border-emerald-700/50 text-[10px] font-mono font-medium">
              {remainingCount} more available
            </span>
          )}
          {filters.query && (
            <span className="text-slate-400">
              matching &quot;<strong>{filters.query}</strong>&quot;
            </span>
          )}
          {filters.searchMode === 'tgctours' && (
            <span className="px-2 py-0.5 bg-amber-950/80 text-amber-300 rounded border border-amber-600/40 text-[10px] uppercase font-bold tracking-wider flex items-center gap-1">
              <Award className="w-3 h-3 text-amber-400" />
              TGC 2K25 Listings Mode
            </span>
          )}
          {filters.searchMode === 'web' && (
            <span className="px-2 py-0.5 bg-sky-950 text-sky-300 rounded border border-sky-700/40 text-[10px] uppercase font-bold tracking-wider">
              Web Search Mode
            </span>
          )}
          {filters.searchMode === 'catalog' && (
            <span className="px-2 py-0.5 bg-emerald-950 text-emerald-300 rounded border border-emerald-700/40 text-[10px] uppercase font-bold tracking-wider">
              Catalog Mode
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* SORT CONTROLS - Strictly NO Distance sorting */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Sort By:</span>
            <select
              value={filters.sortBy}
              onChange={(e) => {
                setFilters({ ...filters, sortBy: e.target.value as SortOption });
                setVisibleCount(10);
              }}
              className="px-2.5 py-1 bg-[#07100b] border border-[#21432f] rounded text-slate-200 text-xs focus:outline-none focus:border-emerald-500 font-medium"
            >
              <option value="relevance">Relevance & Popularity</option>
              <option value="name_asc">Course Name (A – Z)</option>
              <option value="name_desc">Course Name (Z – A)</option>
              <option value="rating_desc">Highest Rated</option>
              <option value="rating_asc">Lowest Rated</option>
              <option value="yardage_asc">Course Length — Shortest First</option>
              <option value="yardage_desc">Course Length — Longest First</option>
              <option value="difficulty_asc">Difficulty — Easiest First</option>
              <option value="difficulty_desc">Difficulty — Most Difficult First</option>
              <option value="official_first">Official First</option>
              <option value="user_created_first">User Created First</option>
              <option value="recently_added">Recently Added</option>
            </select>
          </div>

          {/* Grid / List toggle */}
          <div className="flex items-center bg-[#07100b] border border-[#1b3827] rounded p-0.5">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1 rounded ${
                viewMode === 'grid' ? 'bg-[#183826] text-emerald-300' : 'text-slate-400 hover:text-white'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1 rounded ${
                viewMode === 'list' ? 'bg-[#183826] text-emerald-300' : 'text-slate-400 hover:text-white'
              }`}
              title="List View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Error state */}
      {errorMsg && (
        <div className="p-4 bg-rose-950/40 border border-rose-800/60 rounded-lg text-rose-300 flex items-start gap-3 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
          <div>
            <span className="font-semibold block mb-0.5">{errorMsg}</span>
            <span className="text-slate-400">
              When offline, the application will display stored courses from your local database.
            </span>
          </div>
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-2 p-4 text-xs text-amber-300 bg-[#121f16] border border-amber-600/40 rounded-lg">
            <Award className="w-4 h-4 animate-spin text-amber-400" />
            <span>
              {filters.searchMode === 'tgctours'
                ? 'Retrieving certified courses from TGC Tours 2K25 Listings (https://www.tgctours.com/Course/Tgc2k25Listings)...'
                : filters.searchMode === 'web'
                ? 'Searching the live web for PGA TOUR 2K25 courses...'
                : 'Searching course catalog...'}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-pulse">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <div key={`skeleton-${n}`} className="h-64 bg-[#0d1c14] rounded-lg border border-[#1b3827]" />
            ))}
          </div>
        </div>
      ) : results.length === 0 && !errorMsg ? (
        <div className="p-12 text-center bg-[#09150e] border border-[#193524] rounded-xl space-y-3">
          <div className="w-12 h-12 mx-auto rounded-full bg-[#12281c] flex items-center justify-center text-slate-400">
            {filters.searchMode === 'tgctours' ? (
              <Award className="w-6 h-6 text-amber-400" />
            ) : filters.searchMode === 'web' ? (
              <Globe className="w-6 h-6 text-sky-400" />
            ) : (
              <Search className="w-6 h-6" />
            )}
          </div>
          <h3 className="text-base font-semibold text-slate-200">
            {filters.searchMode === 'tgctours'
              ? 'No TGC Tours 2K25 courses matched your criteria'
              : filters.searchMode === 'web'
              ? 'No live web courses found for this query'
              : 'No PGA TOUR 2K25 courses matched your criteria'}
          </h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Try adjusting your course yardage filter, TGC Status, difficulty, or search terms to broaden results.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
            <button
              onClick={handleClearFilters}
              className="px-4 py-2 bg-[#12281b] hover:bg-[#1a3826] text-slate-200 rounded text-xs font-semibold transition-colors border border-[#234932]"
            >
              Clear All Filters
            </button>
            {onOpenAddCourseModal && (
              <button
                onClick={onOpenAddCourseModal}
                className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white rounded text-xs font-bold transition-all shadow-md flex items-center gap-1.5 border border-emerald-500/50 cursor-pointer active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Course &amp; Save to Collection</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Results Section with 10 Courses Initially + Option to Display Another 10 Courses */
        <div className="space-y-4">
          <div
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
                : 'space-y-3'
            }
          >
            {displayedCourses.map((course, idx) => {
              const review = reviews.find((r) => r.CourseID === course.CourseID);
              return (
                <CourseCard
                  key={`search-card-${filters.searchMode}-${course.CourseID}-${idx}`}
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

          {/* Pagination / Reusable "Display Another 10 Courses" Controls */}
          {totalAvailable > 10 && (
            <div className="mt-6 p-4 rounded-xl bg-gradient-to-b from-[#091710] to-[#06110b] border border-[#1b3b27] shadow-lg flex flex-col items-center gap-3">
              <div className="w-full flex items-center justify-between text-xs text-slate-400 px-1">
                <span className="flex items-center gap-1.5 font-medium text-slate-300">
                  <Layers className="w-4 h-4 text-emerald-400" />
                  Showing <span className="font-bold text-white tabular-nums">{displayedCourses.length}</span> of{' '}
                  <span className="font-bold text-white tabular-nums">{totalAvailable}</span> available courses
                </span>
                <span className="tabular-nums font-mono text-[11px] text-emerald-400/90 font-semibold">
                  {Math.round((displayedCourses.length / totalAvailable) * 100)}% displayed
                </span>
              </div>

              {/* Visual progress track */}
              <div className="w-full h-1.5 bg-[#0e2417] rounded-full overflow-hidden border border-[#1a3826]">
                <div
                  className="h-full bg-gradient-to-r from-emerald-600 via-emerald-400 to-amber-400 transition-all duration-300 rounded-full"
                  style={{ width: `${Math.min(100, Math.round((displayedCourses.length / totalAvailable) * 100))}%` }}
                />
              </div>

              {hasMore ? (
                <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full sm:w-auto pt-1">
                  {/* Reusable Primary Option: Display Another 10 Courses */}
                  <button
                    type="button"
                    onClick={() => setVisibleCount((prev) => prev + 10)}
                    className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-semibold text-xs rounded-lg shadow-md hover:shadow-emerald-900/40 border border-emerald-500/50 flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
                  >
                    <ChevronDown className="w-4 h-4 animate-bounce" />
                    <span>Display Another 10 Courses</span>
                    <span className="px-2 py-0.5 bg-emerald-950/80 border border-emerald-400/40 rounded-full text-[10px] font-mono text-emerald-200">
                      +{nextBatchCount} ({remainingCount} remaining)
                    </span>
                  </button>

                  {/* Option to display all remaining courses at once */}
                  {remainingCount > 10 && (
                    <button
                      type="button"
                      onClick={() => setVisibleCount(totalAvailable)}
                      className="w-full sm:w-auto px-4 py-2.5 bg-[#0a1b12] hover:bg-[#122a1d] text-slate-300 hover:text-white text-xs font-medium rounded-lg border border-[#1d3d29] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <span>Display All {totalAvailable} Courses</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-center justify-between w-full pt-1 px-1 gap-2">
                  <div className="flex items-center gap-2 text-xs text-emerald-300">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="font-semibold">
                      All available courses from search results have been displayed ({totalAvailable} total)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="text-xs text-slate-400 hover:text-emerald-300 flex items-center gap-1 underline transition-colors cursor-pointer"
                  >
                    <span>Back to Top</span>
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
