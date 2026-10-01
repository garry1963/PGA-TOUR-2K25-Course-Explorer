/**
 * Core type definitions for PGA TOUR 2K25 Course Explorer
 * Adheres strictly to requirements: No distance-from-user fields or filtering.
 * Course yardage/length is the primary distance-related criterion.
 */

export type SourceType = 'Official' | 'User Created';

export type CourseType =
  | 'Resort'
  | 'Parkland'
  | 'Links'
  | 'Heathland'
  | 'Desert'
  | 'Mountain'
  | 'Coastal'
  | 'Forest'
  | 'Fantasy'
  | 'Championship'
  | 'Other';

export type DifficultyTier =
  | 'Very Easy'
  | 'Easy'
  | 'Moderate'
  | 'Difficult'
  | 'Very Difficult';

export type TgcTourStatus =
  | 'Tour Worthy'
  | 'Approved'
  | 'Platinum Tour'
  | 'Elite Tour'
  | 'Challenge Circuit'
  | 'Under Review';

export interface Course {
  CourseID: string;
  ExternalCourseID: string;
  CourseName: string;
  CreatorName: string;
  SourceType: SourceType;
  CourseType: CourseType;
  Country: string;
  Region: string;
  City: string;
  LocationText: string;
  Latitude: number | null;
  Longitude: number | null;
  CourseYardage: number; // in yards
  CourseYardageUnit: 'yards' | 'metres';
  Difficulty: number; // 0.0 - 10.0 scale, e.g. 8.2
  DifficultyTier: DifficultyTier;
  CommunityRating: number; // 0.0 - 5.0 scale
  ReviewCount: number;
  Description: string;
  NumberOfHoles: number; // 9, 18, etc.
  Par: number;
  CourseImagePath: string;
  CourseImageURL: string;
  CourseURL?: string;
  TeeInformation?: string;
  GreenInformation?: string;
  FairwayInformation?: string;
  CourseTags?: string[];
  Popularity?: number;
  PlayCount?: number;
  CreatedDate: string;
  UpdatedDate: string;
  LastRetrievedDate: string;
  IsFavourite: boolean;
  IsSaved: boolean;
  PersonalNotes?: string;
  WebSource?: { title: string; url: string };
  isWebResult?: boolean;
  // TGC Tours Specifics (https://www.tgctours.com/Course/Tgc2k25Listings)
  TgcStatus?: TgcTourStatus;
  TgcListingUrl?: string;
  IsLidar?: boolean;
  GreenSpeed?: string;
  Firmness?: string;
}

export interface PersonalReview {
  ReviewID: string;
  CourseID: string;
  Rating: number; // 1 - 5 stars, half-stars allowed
  ReviewTitle: string;
  ReviewText: string;
  DateCreated: string;
  DateModified: string;
}

export interface SearchHistoryItem {
  SearchID: string;
  SearchText: string;
  SourceFilter: string;
  CourseTypeFilter: string;
  LocationFilter: string;
  CourseYardageMin: number | null;
  CourseYardageMax: number | null;
  DifficultyFilter: string;
  RatingFilter: number | null;
  DateSearched: string;
  ResultCount: number;
}

export interface RecentlyViewedItem {
  ViewID: string;
  CourseID: string;
  ViewedDate: string;
}

export interface CourseCollection {
  CollectionID: string;
  CollectionName: string;
  Description: string;
  CreatedDate: string;
  CourseIDs: string[];
}

export type SortOption =
  | 'relevance'
  | 'name_asc'
  | 'name_desc'
  | 'rating_desc'
  | 'rating_asc'
  | 'yardage_asc' // Course Length - Shortest First
  | 'yardage_desc' // Course Length - Longest First
  | 'difficulty_asc' // Difficulty - Easiest First
  | 'difficulty_desc' // Difficulty - Most Difficult First
  | 'official_first'
  | 'user_created_first'
  | 'recently_added';

export interface SearchFilters {
  query: string;
  creator: string;
  source: 'All' | 'Official' | 'User Created';
  courseTypes: CourseType[];
  location: string;
  yardagePreset: string; // 'Any' | 'under_5000' | '5000_5999' | '6000_6499' | '6500_6999' | '7000_7499' | '7500_plus' | 'custom'
  minYardage: number | null;
  maxYardage: number | null;
  difficulty: string; // 'Any' | 'Very Easy' | 'Easy' | 'Moderate' | 'Difficult' | 'Very Difficult'
  minRating: number | null; // null | 1 | 2 | 3 | 4 | 4.5 | 5
  holes: string; // 'Any' | '9' | '18' | 'Other'
  sortBy: SortOption;
  searchMode: 'tgctours' | 'catalog' | 'web';
  tgcStatus?: string; // 'All' | 'Tour Worthy' | 'Approved' | 'Platinum Tour' | 'Elite Tour' | 'Challenge Circuit' | 'LiDAR Only'
}

export interface WebCitation {
  title: string;
  url: string;
}

export interface AppSettings {
  yardageUnit: 'yards' | 'metres' | 'both';
  defaultSource: 'All' | 'Official' | 'User Created';
  defaultCourseType: string;
  defaultYardageRange: string;
  defaultMinRating: number;
  defaultDifficulty: string;
  cacheImages: boolean;
  maxImageCacheMB: number;
  simulateOffline: boolean;
}
