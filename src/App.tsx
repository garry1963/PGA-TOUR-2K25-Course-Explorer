/**
 * PGA TOUR 2K25 COURSE EXPLORER
 * Master Windows Desktop Web Application
 * Strict Requirement: No distance-from-user filtering. Course length/yardage is the only distance criterion.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Course,
  CourseCollection,
  PersonalReview,
  AppSettings,
} from './types/golf';
import { localDatabase } from './services/LocalDatabase';
import { courseDataProvider } from './services/CourseDataProvider';
import { WindowsTitleBar } from './components/WindowsTitleBar';
import { Sidebar, NavView } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { CourseSearchView } from './components/CourseSearchView';
import { SavedCoursesView } from './components/SavedCoursesView';
import { FavouritesView } from './components/FavouritesView';
import { MyReviewsView } from './components/MyReviewsView';
import { RecentlyViewedView } from './components/RecentlyViewedView';
import { CollectionsView } from './components/CollectionsView';
import { MapView } from './components/MapView';
import { SettingsView } from './components/SettingsView';
import { CourseDetailsModal } from './components/CourseDetailsModal';
import { SyncModal } from './components/SyncModal';
import { AddCourseModal } from './components/AddCourseModal';
import { AddToCollectionModal } from './components/AddToCollectionModal';

export default function App() {
  const [currentView, setCurrentView] = useState<NavView>('dashboard');
  const [settings, setSettings] = useState<AppSettings>(localDatabase.getSettings());
  const [savedCourses, setSavedCourses] = useState<Course[]>([]);
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [reviews, setReviews] = useState<PersonalReview[]>([]);
  const [collections, setCollections] = useState<CourseCollection[]>([]);
  const [recentlyViewedCourses, setRecentlyViewedCourses] = useState<Course[]>([]);

  // Selected course for details view
  const [activeCourse, setActiveCourse] = useState<Course | null>(null);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [showAddCourseModal, setShowAddCourseModal] = useState(false);
  const [addCourseDefaultCollectionId, setAddCourseDefaultCollectionId] = useState<string | undefined>(undefined);
  const [courseToAddToCollection, setCourseToAddToCollection] = useState<Course | null>(null);

  // Helper to combine course arrays while deduplicating by CourseID
  const combineCourses = (...courseLists: Course[][]): Course[] => {
    const seen = new Set<string>();
    const combined: Course[] = [];
    for (const list of courseLists) {
      if (!Array.isArray(list)) continue;
      for (const course of list) {
        if (course && course.CourseID && !seen.has(course.CourseID)) {
          seen.add(course.CourseID);
          combined.push(course);
        }
      }
    }
    return combined;
  };

  // Load all local data
  const refreshLocalData = useCallback(async () => {
    await localDatabase.init();
    const saved = await localDatabase.getAllSavedCourses();
    const dedupedSaved = combineCourses(saved);
    setSavedCourses(dedupedSaved);

    const revs = await localDatabase.getAllReviews();
    setReviews(revs);

    const cols = await localDatabase.getCollections();
    setCollections(cols);

    // Fetch provider courses for all-round exploration
    try {
      const all = await courseDataProvider.searchCourses({}, false);
      setAllCourses(all);

      // Load recently viewed with strict deduplication by CourseID
      const viewedItems = await localDatabase.getRecentlyViewed();
      const seenViewed = new Set<string>();
      const viewedCourses: Course[] = [];
      for (const item of viewedItems) {
        if (!seenViewed.has(item.CourseID)) {
          seenViewed.add(item.CourseID);
          const found = all.find((c) => c.CourseID === item.CourseID) || saved.find((c) => c.CourseID === item.CourseID);
          if (found) viewedCourses.push(found);
        }
      }
      setRecentlyViewedCourses(viewedCourses);
    } catch {
      // Offline fallback: Use saved courses
      setAllCourses(saved);
    }
  }, []);

  useEffect(() => {
    refreshLocalData();
  }, [refreshLocalData]);

  // Keyboard shortcut listener for Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCurrentView('search');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Update settings handler
  const handleUpdateSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    localDatabase.saveSettings(newSettings);
  };

  // Toggle Yardage display unit (Yards -> Metres -> Both)
  const handleToggleYardageUnit = () => {
    const nextUnit: Record<'yards' | 'metres' | 'both', 'yards' | 'metres' | 'both'> = {
      yards: 'metres',
      metres: 'both',
      both: 'yards',
    };
    handleUpdateSettings({
      ...settings,
      yardageUnit: nextUnit[settings.yardageUnit] || 'yards',
    });
  };

  // View course handler (records view in recently viewed)
  const handleViewCourse = async (course: Course) => {
    setActiveCourse(course);
    await localDatabase.recordCourseView(course.CourseID);
    const viewedItems = await localDatabase.getRecentlyViewed();
    const seenViewed = new Set<string>();
    const viewed: Course[] = [];
    for (const item of viewedItems) {
      if (!seenViewed.has(item.CourseID)) {
        seenViewed.add(item.CourseID);
        const found = allCourses.find((c) => c.CourseID === item.CourseID) || savedCourses.find((c) => c.CourseID === item.CourseID);
        if (found) viewed.push(found);
      }
    }
    setRecentlyViewedCourses(viewed);
  };

  // Toggle Save Course
  const handleToggleSaveCourse = async (course: Course) => {
    if (course.IsSaved) {
      await localDatabase.removeSavedCourse(course.CourseID);
    } else {
      await localDatabase.saveCourse(course);
    }
    await refreshLocalData();
    if (activeCourse && activeCourse.CourseID === course.CourseID) {
      setActiveCourse({ ...activeCourse, IsSaved: !activeCourse.IsSaved });
    }
  };

  // Toggle Favourite
  const handleToggleFavourite = async (course: Course) => {
    const newStatus = await localDatabase.toggleFavourite(course);
    await refreshLocalData();
    if (activeCourse && activeCourse.CourseID === course.CourseID) {
      setActiveCourse({ ...activeCourse, IsFavourite: newStatus, IsSaved: activeCourse.IsSaved || newStatus });
    }
  };

  // Save personal review (Section 21, 25, 26)
  const handleSaveReview = async (reviewInput: { Rating: number; ReviewTitle: string; ReviewText: string }) => {
    if (!activeCourse) return;
    await localDatabase.saveReview({
      CourseID: activeCourse.CourseID,
      Rating: reviewInput.Rating,
      ReviewTitle: reviewInput.ReviewTitle,
      ReviewText: reviewInput.ReviewText,
    });
    // Ensure course is marked as saved when reviewed
    if (!activeCourse.IsSaved) {
      await localDatabase.saveCourse(activeCourse);
    }
    await refreshLocalData();
  };

  // Delete review
  const handleDeleteReview = async (reviewId: string) => {
    await localDatabase.deleteReview(reviewId);
    await refreshLocalData();
  };

  // Save personal private notes (Section 49)
  const handleSavePersonalNotes = async (courseId: string, notes: string) => {
    await localDatabase.updatePersonalNotes(courseId, notes);
    await refreshLocalData();
    if (activeCourse && activeCourse.CourseID === courseId) {
      setActiveCourse({ ...activeCourse, PersonalNotes: notes });
    }
  };

  // Add course to collection
  const handleAddToCollection = async (collectionId: string, courseId: string) => {
    await localDatabase.addCourseToCollection(collectionId, courseId);
    await refreshLocalData();
  };

  // Remove course from collection
  const handleRemoveCourseFromCollection = async (collectionId: string, courseId: string) => {
    await localDatabase.removeCourseFromCollection(collectionId, courseId);
    await refreshLocalData();
  };

  // Create collection
  const handleCreateCollection = async (name: string, description: string) => {
    const newCol: CourseCollection = {
      CollectionID: `col-${Date.now()}`,
      CollectionName: name,
      Description: description,
      CreatedDate: new Date().toISOString(),
      CourseIDs: [],
    };
    await localDatabase.saveCollection(newCol);
    await refreshLocalData();
  };

  // Update collection
  const handleUpdateCollection = async (col: CourseCollection) => {
    await localDatabase.saveCollection(col);
    await refreshLocalData();
  };

  // Delete collection
  const handleDeleteCollection = async (colId: string) => {
    await localDatabase.deleteCollection(colId);
    await refreshLocalData();
  };

  // Clear history
  const handleClearHistory = async () => {
    await localDatabase.clearRecentlyViewed();
    setRecentlyViewedCourses([]);
  };

  // Open Add Course Modal with optional default collection
  const handleOpenAddCourseModal = (collectionId?: string) => {
    setAddCourseDefaultCollectionId(collectionId);
    setShowAddCourseModal(true);
  };

  // Save new course with full specifications and associate with selected collections
  const handleSaveNewCourse = async (
    courseData: Omit<
      Course,
      'CourseID' | 'ExternalCourseID' | 'CreatedDate' | 'UpdatedDate' | 'LastRetrievedDate' | 'IsSaved'
    >,
    selectedCollectionIds: string[]
  ): Promise<Course> => {
    const timestamp = Date.now();
    const newCourseId = `custom-${timestamp}-${Math.random().toString(36).slice(2, 7)}`;
    const newExternalId = `USR-2K25-${Math.floor(1000 + Math.random() * 9000)}`;
    const nowIso = new Date().toISOString();

    const fullCourse: Course = {
      ...courseData,
      CourseID: newCourseId,
      ExternalCourseID: newExternalId,
      CreatedDate: nowIso.slice(0, 10),
      UpdatedDate: nowIso.slice(0, 10),
      LastRetrievedDate: nowIso,
      IsSaved: true,
      Popularity: courseData.Popularity || 85,
      PlayCount: courseData.PlayCount || 1500,
    };

    // 1. Save course to persistent database
    await localDatabase.saveCourse(fullCourse);

    // 2. Add course to in-memory data provider catalog
    courseDataProvider.addCustomCourse(fullCourse);

    // 3. Add to each selected collection
    for (const colId of selectedCollectionIds) {
      await localDatabase.addCourseToCollection(colId, newCourseId);
    }

    // 4. Refresh local data across app
    await refreshLocalData();

    return fullCourse;
  };

  // Create new collection directly from modal
  const handleCreateCollectionFromModal = async (name: string, description: string): Promise<CourseCollection> => {
    const newCol: CourseCollection = {
      CollectionID: `col-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      CollectionName: name,
      Description: description,
      CreatedDate: new Date().toISOString().slice(0, 10),
      CourseIDs: [],
    };
    await localDatabase.saveCollection(newCol);
    await refreshLocalData();
    return newCol;
  };

  // Save existing course and its specifications into selected collections
  const handleSaveCourseToCollections = async (course: Course, selectedCollectionIds: string[]) => {
    // 1. Ensure course is saved in local persistent database with all specifications
    await localDatabase.saveCourse(course);
    courseDataProvider.addCustomCourse(course);

    // 2. Synchronize selected collections
    for (const col of collections) {
      const isSelected = selectedCollectionIds.includes(col.CollectionID);
      const hasCourse = col.CourseIDs.includes(course.CourseID);
      if (isSelected && !hasCourse) {
        await localDatabase.addCourseToCollection(col.CollectionID, course.CourseID);
      } else if (!isSelected && hasCourse) {
        await localDatabase.removeCourseFromCollection(col.CollectionID, course.CourseID);
      }
    }

    await refreshLocalData();
  };

  const favourites = combineCourses(savedCourses.filter((c) => c.IsFavourite));

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#07110b] text-slate-100 font-sans">
      {/* 1. Windows 11 Title Bar */}
      <WindowsTitleBar
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        onOpenSearch={() => setCurrentView('search')}
        onOpenSyncModal={() => setShowSyncModal(true)}
        onOpenAddCourseModal={() => handleOpenAddCourseModal()}
        onNavigate={(view) => setCurrentView(view as NavView)}
      />

      {/* 2. Main Desktop Window Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Persistent Left Sidebar (Section 4) */}
        <Sidebar
          currentView={currentView}
          onSelectView={setCurrentView}
          stats={{
            savedCount: savedCourses.length,
            favouritesCount: favourites.length,
            reviewsCount: reviews.length,
            collectionsCount: collections.length,
          }}
          settings={settings}
          onToggleUnit={handleToggleYardageUnit}
          onOpenAddCourseModal={() => handleOpenAddCourseModal()}
        />

        {/* Dynamic Main Content Area */}
        <main className="flex-1 flex flex-col overflow-hidden bg-[#09140e]">
          {currentView === 'dashboard' && (
            <DashboardView
              savedCourses={savedCourses}
              favourites={favourites}
              recentCourses={recentlyViewedCourses}
              reviews={reviews}
              yardageUnit={settings.yardageUnit}
              onViewCourse={handleViewCourse}
              onToggleSave={handleToggleSaveCourse}
              onToggleFavourite={handleToggleFavourite}
              onNavigate={setCurrentView}
              onOpenAddCourseModal={() => handleOpenAddCourseModal()}
              onOpenAddToCollection={(course) => setCourseToAddToCollection(course)}
            />
          )}

          {currentView === 'search' && (
            <CourseSearchView
              yardageUnit={settings.yardageUnit}
              reviews={reviews}
              simulateOffline={settings.simulateOffline}
              onViewCourse={handleViewCourse}
              onToggleSave={handleToggleSaveCourse}
              onToggleFavourite={handleToggleFavourite}
              onOpenAddCourseModal={() => handleOpenAddCourseModal()}
              onOpenAddToCollection={(course) => setCourseToAddToCollection(course)}
            />
          )}

          {currentView === 'saved' && (
            <SavedCoursesView
              savedCourses={savedCourses}
              reviews={reviews}
              yardageUnit={settings.yardageUnit}
              onViewCourse={handleViewCourse}
              onToggleSave={handleToggleSaveCourse}
              onToggleFavourite={handleToggleFavourite}
              onOpenSyncModal={() => setShowSyncModal(true)}
              onOpenAddCourseModal={() => handleOpenAddCourseModal()}
              onOpenAddToCollection={(course) => setCourseToAddToCollection(course)}
            />
          )}

          {currentView === 'favourites' && (
            <FavouritesView
              favourites={favourites}
              reviews={reviews}
              yardageUnit={settings.yardageUnit}
              onViewCourse={handleViewCourse}
              onToggleSave={handleToggleSaveCourse}
              onToggleFavourite={handleToggleFavourite}
              onOpenAddToCollection={(course) => setCourseToAddToCollection(course)}
            />
          )}

          {currentView === 'reviews' && (
            <MyReviewsView
              reviews={reviews}
              courses={combineCourses(allCourses, savedCourses)}
              yardageUnit={settings.yardageUnit}
              onViewCourse={handleViewCourse}
              onDeleteReview={handleDeleteReview}
              onNavigateToSearch={() => setCurrentView('search')}
            />
          )}

          {currentView === 'recent' && (
            <RecentlyViewedView
              recentCourses={recentlyViewedCourses}
              reviews={reviews}
              yardageUnit={settings.yardageUnit}
              onViewCourse={handleViewCourse}
              onToggleSave={handleToggleSaveCourse}
              onToggleFavourite={handleToggleFavourite}
              onClearHistory={handleClearHistory}
            />
          )}

          {currentView === 'collections' && (
            <CollectionsView
              collections={collections}
              allCourses={combineCourses(allCourses, savedCourses)}
              reviews={reviews}
              yardageUnit={settings.yardageUnit}
              onViewCourse={handleViewCourse}
              onToggleSave={handleToggleSaveCourse}
              onToggleFavourite={handleToggleFavourite}
              onCreateCollection={handleCreateCollection}
              onUpdateCollection={handleUpdateCollection}
              onDeleteCollection={handleDeleteCollection}
              onRemoveCourseFromCollection={handleRemoveCourseFromCollection}
              onOpenAddCourseModal={handleOpenAddCourseModal}
              onAddToCollection={handleAddToCollection}
              onOpenAddToCollection={(course) => setCourseToAddToCollection(course)}
            />
          )}

          {currentView === 'map' && (
            <MapView
              courses={combineCourses(allCourses, savedCourses)}
              yardageUnit={settings.yardageUnit}
              onViewCourse={handleViewCourse}
            />
          )}

          {currentView === 'settings' && (
            <SettingsView
              settings={settings}
              onUpdateSettings={handleUpdateSettings}
              onDataRestored={refreshLocalData}
            />
          )}
        </main>
      </div>

      {/* Course Details Modal (Sections 14-16, 25-27, 49) */}
      {activeCourse && (
        <CourseDetailsModal
          course={activeCourse}
          personalReview={reviews.find((r) => r.CourseID === activeCourse.CourseID)}
          collections={collections}
          yardageUnit={settings.yardageUnit}
          onClose={() => setActiveCourse(null)}
          onToggleSave={handleToggleSaveCourse}
          onToggleFavourite={handleToggleFavourite}
          onSaveReview={handleSaveReview}
          onDeleteReview={handleDeleteReview}
          onSavePersonalNotes={handleSavePersonalNotes}
          onAddToCollection={handleAddToCollection}
          onOpenAddToCollection={(course) => setCourseToAddToCollection(course)}
        />
      )}

      {/* Add Course To Collection Modal */}
      {courseToAddToCollection && (
        <AddToCollectionModal
          course={courseToAddToCollection}
          collections={collections}
          yardageUnit={settings.yardageUnit}
          onClose={() => setCourseToAddToCollection(null)}
          onSaveToCollections={handleSaveCourseToCollections}
          onCreateCollection={handleCreateCollectionFromModal}
        />
      )}

      {/* Sync Modal (Section 33) */}
      {showSyncModal && (
        <SyncModal
          savedCourses={savedCourses}
          simulateOffline={settings.simulateOffline}
          onClose={() => setShowSyncModal(false)}
          onSyncCompleted={refreshLocalData}
        />
      )}

      {/* Add Course Modal (Add Course with full specs & save to selected collections) */}
      {showAddCourseModal && (
        <AddCourseModal
          collections={collections}
          defaultCollectionId={addCourseDefaultCollectionId}
          onClose={() => {
            setShowAddCourseModal(false);
            setAddCourseDefaultCollectionId(undefined);
          }}
          onSaveCourse={handleSaveNewCourse}
          onCreateCollection={handleCreateCollectionFromModal}
        />
      )}
    </div>
  );
}
