import React from 'react';
import {
  LayoutDashboard,
  Search,
  BookmarkCheck,
  Star,
  MessageSquareText,
  Clock,
  FolderTree,
  MapPin,
  Settings as SettingsIcon,
  Ruler,
  Award,
  ExternalLink,
  Plus,
} from 'lucide-react';
import { AppSettings } from '../types/golf';

export type NavView =
  | 'dashboard'
  | 'search'
  | 'saved'
  | 'favourites'
  | 'reviews'
  | 'recent'
  | 'collections'
  | 'map'
  | 'settings';

interface SidebarProps {
  currentView: NavView;
  onSelectView: (view: NavView) => void;
  stats: {
    savedCount: number;
    favouritesCount: number;
    reviewsCount: number;
    collectionsCount: number;
  };
  settings: AppSettings;
  onToggleUnit: () => void;
  onOpenAddCourseModal?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onSelectView,
  stats,
  settings,
  onToggleUnit,
  onOpenAddCourseModal,
}) => {
  const navItems: { id: NavView; label: string; icon: React.ReactNode; count?: number; badge?: string }[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      id: 'search',
      label: 'TGC Tours 2K25 Search',
      icon: <Award className="w-4 h-4 text-amber-400" />,
      badge: 'Main',
    },
    {
      id: 'saved',
      label: 'Saved Courses',
      icon: <BookmarkCheck className="w-4 h-4" />,
      count: stats.savedCount,
    },
    {
      id: 'favourites',
      label: 'Favourites',
      icon: <Star className="w-4 h-4" />,
      count: stats.favouritesCount,
    },
    {
      id: 'reviews',
      label: 'My Reviews',
      icon: <MessageSquareText className="w-4 h-4" />,
      count: stats.reviewsCount,
    },
    {
      id: 'recent',
      label: 'Recently Viewed',
      icon: <Clock className="w-4 h-4" />,
    },
    {
      id: 'collections',
      label: 'Course Collections',
      icon: <FolderTree className="w-4 h-4" />,
      count: stats.collectionsCount,
    },
    {
      id: 'map',
      label: 'Map View',
      icon: <MapPin className="w-4 h-4" />,
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <SettingsIcon className="w-4 h-4" />,
    },
  ];

  return (
    <aside className="w-64 bg-[#0a1610] border-r border-[#193223] flex flex-col justify-between shrink-0 select-none">
      {/* Top Section */}
      <div className="p-3">
        {/* Navigation list */}
        <div className="space-y-1">
          {navItems.map((item) => {
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectView(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded transition-colors text-left group ${
                  isActive
                    ? 'bg-[#183726] text-emerald-300 font-semibold border-l-2 border-emerald-400'
                    : 'text-slate-300 hover:bg-[#122419] hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={`${
                      isActive ? 'text-emerald-400' : 'text-slate-400 group-hover:text-emerald-300'
                    }`}
                  >
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded text-[9px] font-bold uppercase tracking-wider">
                      {item.badge}
                    </span>
                  )}
                </div>
                {item.count !== undefined && item.count > 0 && (
                  <span
                    className={`text-[11px] font-mono tabular-nums px-1.5 py-0.5 rounded ${
                      isActive ? 'bg-emerald-950/60 text-emerald-300' : 'bg-[#14261b] text-slate-400'
                    }`}
                  >
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Add Course Quick Action */}
      {onOpenAddCourseModal && (
        <div className="p-3 border-t border-[#193223] bg-[#08120c]">
          <button
            onClick={onOpenAddCourseModal}
            className="w-full py-2 px-3 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white rounded-lg text-xs font-semibold shadow-sm transition-all flex items-center justify-center gap-2 border border-emerald-500/50 cursor-pointer active:scale-95"
            title="Add a custom course and assign to collections"
          >
            <Plus className="w-4 h-4" />
            <span>Add Course</span>
          </button>
        </div>
      )}

      {/* Bottom Section: TGC Tours 2K25 Quick Launcher & Yardage Bar */}
      <div className="border-t border-[#193223] bg-[#07100b] space-y-2 p-3 text-xs">
        {/* TGC Tours 2K25 Link */}
        <a
          href="https://www.tgctours.com/Course/Tgc2k25Listings"
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 bg-[#0e1f15] hover:bg-[#153122] border border-amber-600/30 hover:border-amber-500/60 rounded flex items-center justify-between transition-colors group"
          title="Open TGC Tours 2K25 Course Listings"
        >
          <div className="flex items-center gap-1.5 truncate">
            <Award className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="text-[11px] font-bold text-amber-300 group-hover:text-amber-200 truncate">
              TGC Tours 2K25
            </span>
          </div>
          <ExternalLink className="w-3 h-3 text-amber-400/80 group-hover:text-amber-300 shrink-0" />
        </a>

        {/* Yardage Display Toggle */}
        <div className="flex items-center justify-between text-slate-400 pt-1">
          <span className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-slate-400">
            <Ruler className="w-3.5 h-3.5 text-emerald-400" />
            Yardage Display
          </span>
          <button
            onClick={onToggleUnit}
            className="text-[11px] font-medium text-emerald-400 hover:text-emerald-300 underline underline-offset-2"
            title="Click to toggle between Yards, Metres, and Dual display"
          >
            {settings.yardageUnit === 'yards'
              ? 'Yards'
              : settings.yardageUnit === 'metres'
              ? 'Metres'
              : 'Yards & Metres'}
          </button>
        </div>
        <p className="text-[11px] text-slate-400 leading-tight">
          Strict non-proximity metrics: Course length in exact yardage.
        </p>
      </div>
    </aside>
  );
};
