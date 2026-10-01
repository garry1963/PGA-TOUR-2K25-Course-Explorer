/**
 * LocalDatabase: Persistent offline storage for Windows desktop web app.
 * Matches Sections 19-24, 38-39, 47-49 of the master build specification.
 * SQLite schema structure backed by IndexedDB and LocalStorage persistence.
 * Zero distance fields. CourseYardage is the primary metric.
 */

import {
  Course,
  PersonalReview,
  SearchHistoryItem,
  RecentlyViewedItem,
  CourseCollection,
  AppSettings,
} from '../types/golf';

const DB_NAME = 'PGATour2K25CourseExplorerDB';
const DB_VERSION = 1;

export class LocalDatabase {
  private db: IDBDatabase | null = null;
  private isInitialized = false;

  public async init(): Promise<void> {
    if (this.isInitialized && this.db) return;

    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        console.warn('IndexedDB not supported in current environment; using memory/localStorage fallback.');
        this.isInitialized = true;
        resolve();
        return;
      }

      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = (event) => {
        console.error('Failed to open IndexedDB:', event);
        this.isInitialized = true;
        resolve(); // Fallback gracefully
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        this.isInitialized = true;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // 1. Table Courses (Section 20 & 47 indexes)
        if (!db.objectStoreNames.contains('Courses')) {
          const courseStore = db.createObjectStore('Courses', { keyPath: 'CourseID' });
          courseStore.createIndex('ExternalCourseID', 'ExternalCourseID', { unique: false });
          courseStore.createIndex('CourseName', 'CourseName', { unique: false });
          courseStore.createIndex('CreatorName', 'CreatorName', { unique: false });
          courseStore.createIndex('SourceType', 'SourceType', { unique: false });
          courseStore.createIndex('CourseType', 'CourseType', { unique: false });
          courseStore.createIndex('Country', 'Country', { unique: false });
          courseStore.createIndex('Region', 'Region', { unique: false });
          courseStore.createIndex('City', 'City', { unique: false });
          courseStore.createIndex('CourseYardage', 'CourseYardage', { unique: false });
          courseStore.createIndex('Difficulty', 'Difficulty', { unique: false });
          courseStore.createIndex('CommunityRating', 'CommunityRating', { unique: false });
          courseStore.createIndex('IsFavourite', 'IsFavourite', { unique: false });
          courseStore.createIndex('IsSaved', 'IsSaved', { unique: false });
        }

        // 2. Table PersonalReviews (Section 21)
        if (!db.objectStoreNames.contains('PersonalReviews')) {
          const reviewStore = db.createObjectStore('PersonalReviews', { keyPath: 'ReviewID' });
          reviewStore.createIndex('CourseID', 'CourseID', { unique: false });
        }

        // 3. Table SearchHistory (Section 22)
        if (!db.objectStoreNames.contains('SearchHistory')) {
          const searchStore = db.createObjectStore('SearchHistory', { keyPath: 'SearchID' });
          searchStore.createIndex('DateSearched', 'DateSearched', { unique: false });
        }

        // 4. Table RecentlyViewed (Section 23 & 50)
        if (!db.objectStoreNames.contains('RecentlyViewed')) {
          const viewedStore = db.createObjectStore('RecentlyViewed', { keyPath: 'ViewID' });
          viewedStore.createIndex('CourseID', 'CourseID', { unique: false });
          viewedStore.createIndex('ViewedDate', 'ViewedDate', { unique: false });
        }

        // 5. Table Collections (Section 24)
        if (!db.objectStoreNames.contains('Collections')) {
          db.createObjectStore('Collections', { keyPath: 'CollectionID' });
        }

        // 6. Table CachedImages (Section 17 & 38)
        if (!db.objectStoreNames.contains('CachedImages')) {
          db.createObjectStore('CachedImages', { keyPath: 'url' });
        }
      };
    });
  }

  // --- LocalStorage Fallback Helper ---
  private getFallback<T>(key: string, defaultValue: T): T {
    try {
      const data = localStorage.getItem(`pga2k25_${key}`);
      return data ? JSON.parse(data) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  private setFallback<T>(key: string, value: T): void {
    try {
      localStorage.setItem(`pga2k25_${key}`, JSON.stringify(value));
    } catch (e) {
      console.warn('LocalStorage quota or access issue:', e);
    }
  }

  // ================= COURSES OPERATIONS =================
  public async getAllSavedCourses(): Promise<Course[]> {
    await this.init();
    const deduplicate = (courses: Course[]): Course[] => {
      const seen = new Set<string>();
      const result: Course[] = [];
      for (const c of courses) {
        if (c && c.CourseID && !seen.has(c.CourseID)) {
          seen.add(c.CourseID);
          result.push(c);
        }
      }
      return result;
    };

    if (this.db) {
      return new Promise((resolve) => {
        try {
          const tx = this.db!.transaction('Courses', 'readonly');
          const store = tx.objectStore('Courses');
          const request = store.getAll();
          request.onsuccess = () => {
            const raw = (request.result as Course[]).filter((c) => c.IsSaved);
            resolve(deduplicate(raw));
          };
          request.onerror = () => resolve(deduplicate(this.getFallback<Course[]>('saved_courses', [])));
        } catch {
          resolve(deduplicate(this.getFallback<Course[]>('saved_courses', [])));
        }
      });
    }
    return deduplicate(this.getFallback<Course[]>('saved_courses', []));
  }

  public async getSavedCourse(courseId: string): Promise<Course | null> {
    await this.init();
    if (this.db) {
      return new Promise((resolve) => {
        try {
          const tx = this.db!.transaction('Courses', 'readonly');
          const store = tx.objectStore('Courses');
          const request = store.get(courseId);
          request.onsuccess = () => resolve(request.result || null);
          request.onerror = () => resolve(null);
        } catch {
          resolve(null);
        }
      });
    }
    const all = this.getFallback<Course[]>('saved_courses', []);
    return all.find((c) => c.CourseID === courseId) || null;
  }

  public async saveCourse(course: Course): Promise<{ success: boolean; alreadySaved: boolean }> {
    await this.init();
    const existing = await this.getSavedCourse(course.CourseID);
    const updatedCourse: Course = {
      ...course,
      IsSaved: true,
      LastRetrievedDate: new Date().toISOString(),
      // Preserve local personal notes if already exist
      PersonalNotes: existing?.PersonalNotes || course.PersonalNotes || '',
      IsFavourite: existing ? existing.IsFavourite : course.IsFavourite,
    };

    if (this.db) {
      await new Promise<void>((resolve, reject) => {
        try {
          const tx = this.db!.transaction('Courses', 'readwrite');
          const store = tx.objectStore('Courses');
          store.put(updatedCourse);
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
        } catch (e) {
          reject(e);
        }
      });
    }

    // Mirror to fallback storage
    const list = this.getFallback<Course[]>('saved_courses', []);
    const idx = list.findIndex((c) => c.CourseID === course.CourseID);
    if (idx >= 0) {
      list[idx] = updatedCourse;
    } else {
      list.push(updatedCourse);
    }
    this.setFallback('saved_courses', list);

    return {
      success: true,
      alreadySaved: !!existing && existing.IsSaved,
    };
  }

  public async removeSavedCourse(courseId: string): Promise<void> {
    await this.init();
    const course = await this.getSavedCourse(courseId);
    if (course) {
      // If favourite or has notes, just unmark IsSaved, otherwise remove
      if (course.IsFavourite) {
        course.IsSaved = false;
        if (this.db) {
          const tx = this.db.transaction('Courses', 'readwrite');
          tx.objectStore('Courses').put(course);
        }
      } else {
        if (this.db) {
          const tx = this.db.transaction('Courses', 'readwrite');
          tx.objectStore('Courses').delete(courseId);
        }
      }
    }
    const list = this.getFallback<Course[]>('saved_courses', []).filter((c) => c.CourseID !== courseId);
    this.setFallback('saved_courses', list);
  }

  public async toggleFavourite(course: Course): Promise<boolean> {
    await this.init();
    const newStatus = !course.IsFavourite;
    const updatedCourse: Course = {
      ...course,
      IsFavourite: newStatus,
      // If marking favourite, ensure it exists in db
      IsSaved: course.IsSaved || newStatus,
    };

    if (this.db) {
      const tx = this.db.transaction('Courses', 'readwrite');
      tx.objectStore('Courses').put(updatedCourse);
    }

    const list = this.getFallback<Course[]>('saved_courses', []);
    const idx = list.findIndex((c) => c.CourseID === course.CourseID);
    if (idx >= 0) {
      list[idx] = updatedCourse;
    } else if (updatedCourse.IsSaved) {
      list.push(updatedCourse);
    }
    this.setFallback('saved_courses', list);

    return newStatus;
  }

  public async updatePersonalNotes(courseId: string, notes: string): Promise<void> {
    await this.init();
    const course = await this.getSavedCourse(courseId);
    if (course) {
      course.PersonalNotes = notes;
      if (this.db) {
        const tx = this.db.transaction('Courses', 'readwrite');
        tx.objectStore('Courses').put(course);
      }
      const list = this.getFallback<Course[]>('saved_courses', []);
      const idx = list.findIndex((c) => c.CourseID === courseId);
      if (idx >= 0) {
        list[idx] = course;
        this.setFallback('saved_courses', list);
      }
    }
  }

  // ================= REVIEWS OPERATIONS (Section 21) =================
  public async getAllReviews(): Promise<PersonalReview[]> {
    await this.init();
    if (this.db) {
      return new Promise((resolve) => {
        try {
          const tx = this.db!.transaction('PersonalReviews', 'readonly');
          const store = tx.objectStore('PersonalReviews');
          const req = store.getAll();
          req.onsuccess = () => resolve(req.result || []);
          req.onerror = () => resolve(this.getFallback<PersonalReview[]>('reviews', []));
        } catch {
          resolve(this.getFallback<PersonalReview[]>('reviews', []));
        }
      });
    }
    return this.getFallback<PersonalReview[]>('reviews', []);
  }

  public async getReviewForCourse(courseId: string): Promise<PersonalReview | null> {
    const reviews = await this.getAllReviews();
    return reviews.find((r) => r.CourseID === courseId) || null;
  }

  public async saveReview(review: Omit<PersonalReview, 'ReviewID' | 'DateCreated' | 'DateModified'> & { ReviewID?: string }): Promise<PersonalReview> {
    await this.init();
    const now = new Date().toISOString();
    const existing = review.ReviewID ? (await this.getAllReviews()).find((r) => r.ReviewID === review.ReviewID) : await this.getReviewForCourse(review.CourseID);

    const fullReview: PersonalReview = {
      ReviewID: existing ? existing.ReviewID : (review.ReviewID || `rev-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`),
      CourseID: review.CourseID,
      Rating: review.Rating,
      ReviewTitle: review.ReviewTitle,
      ReviewText: review.ReviewText,
      DateCreated: existing ? existing.DateCreated : now,
      DateModified: now,
    };

    if (this.db) {
      const tx = this.db.transaction('PersonalReviews', 'readwrite');
      tx.objectStore('PersonalReviews').put(fullReview);
    }

    const all = this.getFallback<PersonalReview[]>('reviews', []);
    const idx = all.findIndex((r) => r.ReviewID === fullReview.ReviewID);
    if (idx >= 0) {
      all[idx] = fullReview;
    } else {
      all.push(fullReview);
    }
    this.setFallback('reviews', all);

    return fullReview;
  }

  public async deleteReview(reviewId: string): Promise<void> {
    await this.init();
    if (this.db) {
      const tx = this.db.transaction('PersonalReviews', 'readwrite');
      tx.objectStore('PersonalReviews').delete(reviewId);
    }
    const all = this.getFallback<PersonalReview[]>('reviews', []).filter((r) => r.ReviewID !== reviewId);
    this.setFallback('reviews', all);
  }

  // ================= RECENTLY VIEWED (Section 23 & 50) =================
  public async recordCourseView(courseId: string): Promise<void> {
    await this.init();
    const item: RecentlyViewedItem = {
      ViewID: `view-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      CourseID: courseId,
      ViewedDate: new Date().toISOString(),
    };

    if (this.db) {
      try {
        const tx = this.db.transaction('RecentlyViewed', 'readwrite');
        const store = tx.objectStore('RecentlyViewed');
        // Delete previous entries for this course to prevent duplicates
        const index = store.index('CourseID');
        const req = index.getAll(courseId);
        req.onsuccess = () => {
          const oldItems = req.result as RecentlyViewedItem[];
          for (const old of oldItems) {
            store.delete(old.ViewID);
          }
          store.put(item);
        };
      } catch (err) {
        console.warn('Error saving recently viewed in IndexedDB:', err);
      }
    }

    let all = this.getFallback<RecentlyViewedItem[]>('recently_viewed', []);
    all = all.filter((v) => v.CourseID !== courseId);
    all.unshift(item);
    if (all.length > 50) all = all.slice(0, 50);
    this.setFallback('recently_viewed', all);
  }

  public async getRecentlyViewed(): Promise<RecentlyViewedItem[]> {
    await this.init();
    if (this.db) {
      return new Promise((resolve) => {
        try {
          const tx = this.db!.transaction('RecentlyViewed', 'readonly');
          const store = tx.objectStore('RecentlyViewed');
          const req = store.getAll();
          req.onsuccess = () => {
            const list = (req.result || []) as RecentlyViewedItem[];
            list.sort((a, b) => new Date(b.ViewedDate).getTime() - new Date(a.ViewedDate).getTime());
            // Deduplicate by CourseID
            const seen = new Set<string>();
            const unique: RecentlyViewedItem[] = [];
            for (const it of list) {
              if (!seen.has(it.CourseID)) {
                seen.add(it.CourseID);
                unique.push(it);
              }
            }
            resolve(unique.slice(0, 50));
          };
          req.onerror = () => resolve(this.getFallback<RecentlyViewedItem[]>('recently_viewed', []));
        } catch {
          resolve(this.getFallback<RecentlyViewedItem[]>('recently_viewed', []));
        }
      });
    }
    const fallbackList = this.getFallback<RecentlyViewedItem[]>('recently_viewed', []);
    const seen = new Set<string>();
    const uniqueFallback: RecentlyViewedItem[] = [];
    for (const it of fallbackList) {
      if (!seen.has(it.CourseID)) {
        seen.add(it.CourseID);
        uniqueFallback.push(it);
      }
    }
    return uniqueFallback;
  }

  public async clearRecentlyViewed(): Promise<void> {
    await this.init();
    if (this.db) {
      const tx = this.db.transaction('RecentlyViewed', 'readwrite');
      tx.objectStore('RecentlyViewed').clear();
    }
    this.setFallback('recently_viewed', []);
  }

  // ================= SEARCH HISTORY (Section 22 & 51) =================
  public async addSearchHistory(item: Omit<SearchHistoryItem, 'SearchID' | 'DateSearched'>): Promise<void> {
    await this.init();
    const historyItem: SearchHistoryItem = {
      ...item,
      SearchID: `search-${Date.now()}`,
      DateSearched: new Date().toISOString(),
    };

    if (this.db) {
      const tx = this.db.transaction('SearchHistory', 'readwrite');
      tx.objectStore('SearchHistory').put(historyItem);
    }

    let list = this.getFallback<SearchHistoryItem[]>('search_history', []);
    list.unshift(historyItem);
    if (list.length > 25) list = list.slice(0, 25);
    this.setFallback('search_history', list);
  }

  public async getSearchHistory(): Promise<SearchHistoryItem[]> {
    await this.init();
    if (this.db) {
      return new Promise((resolve) => {
        try {
          const tx = this.db!.transaction('SearchHistory', 'readonly');
          const req = tx.objectStore('SearchHistory').getAll();
          req.onsuccess = () => {
            const list = (req.result || []) as SearchHistoryItem[];
            list.sort((a, b) => new Date(b.DateSearched).getTime() - new Date(a.DateSearched).getTime());
            resolve(list);
          };
          req.onerror = () => resolve(this.getFallback<SearchHistoryItem[]>('search_history', []));
        } catch {
          resolve(this.getFallback<SearchHistoryItem[]>('search_history', []));
        }
      });
    }
    return this.getFallback<SearchHistoryItem[]>('search_history', []);
  }

  public async clearSearchHistory(): Promise<void> {
    await this.init();
    if (this.db) {
      const tx = this.db.transaction('SearchHistory', 'readwrite');
      tx.objectStore('SearchHistory').clear();
    }
    this.setFallback('search_history', []);
  }

  // ================= COLLECTIONS (Section 24 & 31) =================
  public async getCollections(): Promise<CourseCollection[]> {
    await this.init();
    if (this.db) {
      return new Promise((resolve) => {
        try {
          const tx = this.db!.transaction('Collections', 'readonly');
          const req = tx.objectStore('Collections').getAll();
          req.onsuccess = () => {
            let cols = req.result as CourseCollection[];
            if (!cols || cols.length === 0) {
              cols = this.seedDefaultCollections();
            }
            resolve(cols);
          };
          req.onerror = () => resolve(this.seedDefaultCollections());
        } catch {
          resolve(this.seedDefaultCollections());
        }
      });
    }
    return this.seedDefaultCollections();
  }

  private seedDefaultCollections(): CourseCollection[] {
    const defaults: CourseCollection[] = [
      {
        CollectionID: 'col-default-1',
        CollectionName: 'Major Championship Venues',
        Description: 'Iconic test venues featuring historic PGA & Major championship challenges.',
        CreatedDate: '2025-01-01',
        CourseIDs: ['pga-sawgrass-01', 'pga-pebble-02', 'pga-standrews-03', 'pga-whistling-08'],
      },
      {
        CollectionID: 'col-default-2',
        CollectionName: 'Best Links & Seaside Courses',
        Description: 'Windblown fescue, coastal cliffs, and authentic bump-and-run golf.',
        CreatedDate: '2025-01-02',
        CourseIDs: ['pga-pebble-02', 'pga-standrews-03', 'user-duneland-13', 'user-blacksalt-12'],
      },
      {
        CollectionID: 'col-default-3',
        CollectionName: 'Long Distance Monsters (7,500+ Yds)',
        Description: 'Courses exceeding 7,500 yards where pure ball-striking power and precision reign.',
        CreatedDate: '2025-01-03',
        CourseIDs: ['pga-pinehurst-04', 'pga-quailhollow-07', 'pga-whistling-08', 'pga-kapalua-10', 'user-oasissands-16'],
      }
    ];
    this.setFallback('collections', defaults);
    return defaults;
  }

  public async saveCollection(col: CourseCollection): Promise<void> {
    await this.init();
    if (this.db) {
      const tx = this.db.transaction('Collections', 'readwrite');
      tx.objectStore('Collections').put(col);
    }
    const all = await this.getCollections();
    const idx = all.findIndex((c) => c.CollectionID === col.CollectionID);
    if (idx >= 0) all[idx] = col;
    else all.push(col);
    this.setFallback('collections', all);
  }

  public async deleteCollection(collectionId: string): Promise<void> {
    await this.init();
    if (this.db) {
      const tx = this.db.transaction('Collections', 'readwrite');
      tx.objectStore('Collections').delete(collectionId);
    }
    const all = (await this.getCollections()).filter((c) => c.CollectionID !== collectionId);
    this.setFallback('collections', all);
  }

  public async addCourseToCollection(collectionId: string, courseId: string): Promise<void> {
    const cols = await this.getCollections();
    const col = cols.find((c) => c.CollectionID === collectionId);
    if (col && !col.CourseIDs.includes(courseId)) {
      col.CourseIDs.push(courseId);
      await this.saveCollection(col);
    }
  }

  public async removeCourseFromCollection(collectionId: string, courseId: string): Promise<void> {
    const cols = await this.getCollections();
    const col = cols.find((c) => c.CollectionID === collectionId);
    if (col) {
      col.CourseIDs = col.CourseIDs.filter((id) => id !== courseId);
      await this.saveCollection(col);
    }
  }

  // ================= SETTINGS & STORAGE STATS (Section 38 & 39) =================
  public getSettings(): AppSettings {
    const def: AppSettings = {
      yardageUnit: 'yards',
      defaultSource: 'All',
      defaultCourseType: 'All',
      defaultYardageRange: 'Any',
      defaultMinRating: 0,
      defaultDifficulty: 'Any',
      cacheImages: true,
      maxImageCacheMB: 50,
      simulateOffline: false,
    };
    return this.getFallback<AppSettings>('settings', def);
  }

  public saveSettings(settings: AppSettings): void {
    this.setFallback('settings', settings);
  }

  public async getDatabaseStats(): Promise<{
    savedCoursesCount: number;
    favouritesCount: number;
    reviewsCount: number;
    collectionsCount: number;
    approxSizeKB: number;
  }> {
    const saved = await this.getAllSavedCourses();
    const reviews = await this.getAllReviews();
    const collections = await this.getCollections();
    const favourites = saved.filter((c) => c.IsFavourite);

    const serialized = JSON.stringify({ saved, reviews, collections });
    const approxSizeKB = Math.round((serialized.length * 2) / 1024);

    return {
      savedCoursesCount: saved.length,
      favouritesCount: favourites.length,
      reviewsCount: reviews.length,
      collectionsCount: collections.length,
      approxSizeKB: Math.max(12, approxSizeKB),
    };
  }

  // ================= BACKUP & EXPORT (Section 38 & 39) =================
  public async exportCompleteDatabaseJSON(): Promise<string> {
    const savedCourses = await this.getAllSavedCourses();
    const reviews = await this.getAllReviews();
    const collections = await this.getCollections();
    const history = await this.getSearchHistory();
    const viewed = await this.getRecentlyViewed();
    const settings = this.getSettings();

    const backupPayload = {
      appName: 'PGA TOUR 2K25 Course Explorer',
      version: '1.0.0',
      databaseType: 'SQLite Compatible Local Store',
      exportDate: new Date().toISOString(),
      schema: {
        CoursesCount: savedCourses.length,
        ReviewsCount: reviews.length,
        CollectionsCount: collections.length,
      },
      data: {
        Courses: savedCourses,
        PersonalReviews: reviews,
        Collections: collections,
        SearchHistory: history,
        RecentlyViewed: viewed,
        Settings: settings,
      },
    };

    return JSON.stringify(backupPayload, null, 2);
  }

  public async exportSavedCoursesCSV(): Promise<string> {
    const courses = await this.getAllSavedCourses();
    const reviews = await this.getAllReviews();

    const headers = [
      'CourseID',
      'ExternalCourseID',
      'CourseName',
      'CreatorName',
      'SourceType',
      'CourseType',
      'Country',
      'Region',
      'City',
      'LocationText',
      'CourseYardage',
      'CourseYardageUnit',
      'Difficulty',
      'DifficultyTier',
      'CommunityRating',
      'ReviewCount',
      'Par',
      'NumberOfHoles',
      'IsFavourite',
      'MyRating',
      'MyReviewTitle',
      'PersonalNotes'
    ];

    const rows = courses.map((c) => {
      const review = reviews.find((r) => r.CourseID === c.CourseID);
      return [
        `"${c.CourseID}"`,
        `"${c.ExternalCourseID}"`,
        `"${c.CourseName.replace(/"/g, '""')}"`,
        `"${c.CreatorName.replace(/"/g, '""')}"`,
        `"${c.SourceType}"`,
        `"${c.CourseType}"`,
        `"${c.Country}"`,
        `"${c.Region}"`,
        `"${c.City}"`,
        `"${c.LocationText.replace(/"/g, '""')}"`,
        c.CourseYardage,
        `"${c.CourseYardageUnit}"`,
        c.Difficulty,
        `"${c.DifficultyTier}"`,
        c.CommunityRating,
        c.ReviewCount,
        c.Par,
        c.NumberOfHoles,
        c.IsFavourite ? 'YES' : 'NO',
        review ? review.Rating : '',
        review ? `"${review.ReviewTitle.replace(/"/g, '""')}"` : '',
        c.PersonalNotes ? `"${c.PersonalNotes.replace(/"/g, '""')}"` : '',
      ].join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  }

  public async exportSQLiteSQLScript(): Promise<string> {
    const courses = await this.getAllSavedCourses();
    const reviews = await this.getAllReviews();
    const collections = await this.getCollections();

    let sql = `-- PGA TOUR 2K25 Course Explorer - SQLite Database Dump
-- Generated: ${new Date().toISOString()}
-- Strictly No Distance-From-User fields. CourseYardage is primary.

CREATE TABLE IF NOT EXISTS Courses (
  CourseID TEXT PRIMARY KEY,
  ExternalCourseID TEXT,
  CourseName TEXT NOT NULL,
  CreatorName TEXT,
  SourceType TEXT,
  CourseType TEXT,
  Country TEXT,
  Region TEXT,
  City TEXT,
  LocationText TEXT,
  Latitude REAL,
  Longitude REAL,
  CourseYardage INTEGER NOT NULL,
  CourseYardageUnit TEXT DEFAULT 'yards',
  Difficulty REAL,
  CommunityRating REAL,
  ReviewCount INTEGER,
  Description TEXT,
  NumberOfHoles INTEGER,
  Par INTEGER,
  CourseImagePath TEXT,
  CourseImageURL TEXT,
  CourseURL TEXT,
  CreatedDate TEXT,
  UpdatedDate TEXT,
  LastRetrievedDate TEXT,
  IsFavourite INTEGER DEFAULT 0,
  IsSaved INTEGER DEFAULT 1,
  PersonalNotes TEXT
);

CREATE INDEX IF NOT EXISTS idx_courses_name ON Courses(CourseName);
CREATE INDEX IF NOT EXISTS idx_courses_creator ON Courses(CreatorName);
CREATE INDEX IF NOT EXISTS idx_courses_yardage ON Courses(CourseYardage);
CREATE INDEX IF NOT EXISTS idx_courses_type ON Courses(CourseType);
CREATE INDEX IF NOT EXISTS idx_courses_favourite ON Courses(IsFavourite);

CREATE TABLE IF NOT EXISTS PersonalReviews (
  ReviewID TEXT PRIMARY KEY,
  CourseID TEXT NOT NULL,
  Rating REAL NOT NULL,
  ReviewTitle TEXT,
  ReviewText TEXT,
  DateCreated TEXT,
  DateModified TEXT,
  FOREIGN KEY (CourseID) REFERENCES Courses(CourseID)
);

CREATE TABLE IF NOT EXISTS Collections (
  CollectionID TEXT PRIMARY KEY,
  CollectionName TEXT NOT NULL,
  Description TEXT,
  CreatedDate TEXT
);

CREATE TABLE IF NOT EXISTS CollectionCourses (
  CollectionID TEXT,
  CourseID TEXT,
  PRIMARY KEY (CollectionID, CourseID),
  FOREIGN KEY (CollectionID) REFERENCES Collections(CollectionID),
  FOREIGN KEY (CourseID) REFERENCES Courses(CourseID)
);

-- Insert Saved Courses
`;

    for (const c of courses) {
      const escape = (val: string | null | undefined) => (val ? `'${val.replace(/'/g, "''")}'` : 'NULL');
      sql += `INSERT OR REPLACE INTO Courses VALUES (${escape(c.CourseID)}, ${escape(c.ExternalCourseID)}, ${escape(c.CourseName)}, ${escape(c.CreatorName)}, ${escape(c.SourceType)}, ${escape(c.CourseType)}, ${escape(c.Country)}, ${escape(c.Region)}, ${escape(c.City)}, ${escape(c.LocationText)}, ${c.Latitude ?? 'NULL'}, ${c.Longitude ?? 'NULL'}, ${c.CourseYardage}, 'yards', ${c.Difficulty}, ${c.CommunityRating}, ${c.ReviewCount}, ${escape(c.Description)}, ${c.NumberOfHoles}, ${c.Par}, ${escape(c.CourseImagePath)}, ${escape(c.CourseImageURL)}, ${escape(c.CourseURL)}, ${escape(c.CreatedDate)}, ${escape(c.UpdatedDate)}, ${escape(c.LastRetrievedDate)}, ${c.IsFavourite ? 1 : 0}, 1, ${escape(c.PersonalNotes)});\n`;
    }

    for (const r of reviews) {
      const escape = (val: string | null | undefined) => (val ? `'${val.replace(/'/g, "''")}'` : 'NULL');
      sql += `INSERT OR REPLACE INTO PersonalReviews VALUES (${escape(r.ReviewID)}, ${escape(r.CourseID)}, ${r.Rating}, ${escape(r.ReviewTitle)}, ${escape(r.ReviewText)}, ${escape(r.DateCreated)}, ${escape(r.DateModified)});\n`;
    }

    for (const col of collections) {
      const escape = (val: string | null | undefined) => (val ? `'${val.replace(/'/g, "''")}'` : 'NULL');
      sql += `INSERT OR REPLACE INTO Collections VALUES (${escape(col.CollectionID)}, ${escape(col.CollectionName)}, ${escape(col.Description)}, ${escape(col.CreatedDate)});\n`;
      for (const courseId of col.CourseIDs) {
        sql += `INSERT OR REPLACE INTO CollectionCourses VALUES (${escape(col.CollectionID)}, ${escape(courseId)});\n`;
      }
    }

    return sql;
  }

  public async restoreDatabaseFromJSON(jsonString: string): Promise<{ success: boolean; count: number; error?: string }> {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed.data) {
        return { success: false, count: 0, error: 'Invalid backup file structure: missing "data" key.' };
      }

      const { Courses, PersonalReviews, Collections, SearchHistory, RecentlyViewed, Settings } = parsed.data;

      if (Array.isArray(Courses)) {
        for (const c of Courses) {
          await this.saveCourse(c);
        }
      }

      if (Array.isArray(PersonalReviews)) {
        for (const r of PersonalReviews) {
          await this.saveReview(r);
        }
      }

      if (Array.isArray(Collections)) {
        for (const col of Collections) {
          await this.saveCollection(col);
        }
      }

      if (Settings) {
        this.saveSettings(Settings);
      }

      return {
        success: true,
        count: (Courses?.length || 0) + (PersonalReviews?.length || 0),
      };
    } catch (err: any) {
      return { success: false, count: 0, error: err.message || 'Corrupt JSON data' };
    }
  }
}

export const localDatabase = new LocalDatabase();
