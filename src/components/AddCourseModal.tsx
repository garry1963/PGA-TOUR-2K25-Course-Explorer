import React, { useState } from 'react';
import {
  X,
  Plus,
  Compass,
  FolderTree,
  Check,
  CheckCircle2,
  Sparkles,
  Award,
  Layers,
  Flag,
  Globe,
  Tag,
  FileText,
  Sliders,
  Ruler,
  AlertCircle,
  FolderPlus,
  Eye,
  MapPin,
  Search,
} from 'lucide-react';
import {
  Course,
  CourseCollection,
  CourseType,
  DifficultyTier,
  SourceType,
  TgcTourStatus,
} from '../types/golf';
import { createGolfSvgDataUrl } from '../services/CourseDataProvider';

interface AddCourseModalProps {
  collections: CourseCollection[];
  defaultCollectionId?: string;
  onClose: () => void;
  onSaveCourse: (
    courseData: Omit<
      Course,
      'CourseID' | 'ExternalCourseID' | 'CreatedDate' | 'UpdatedDate' | 'LastRetrievedDate' | 'IsSaved'
    >,
    selectedCollectionIds: string[]
  ) => Promise<Course>;
  onCreateCollection?: (name: string, description: string) => Promise<CourseCollection | void>;
}

const PRESET_TAGS = [
  'Tour Worthy',
  'TGC Approved',
  'LiDAR Accurate',
  'Major Championship',
  'Island Green',
  'Links Style',
  'Oceanfront',
  'Desert Target',
  'Mountain Alpine',
  'Fast Greens',
  'Pete Dye Style',
  'Firm Fairways',
];

const ACCENT_COLORS = [
  { label: 'Emerald', hex: '#10b981' },
  { label: 'Gold / Tour', hex: '#eab308' },
  { label: 'Sky Azure', hex: '#38bdf8' },
  { label: 'Purple / Elite', hex: '#c084fc' },
  { label: 'Rose Red', hex: '#f43f5e' },
  { label: 'Amber / Sand', hex: '#f59e0b' },
];

interface QuickTemplate {
  label: string;
  courseName: string;
  creator: string;
  sourceType: SourceType;
  courseType: CourseType;
  country: string;
  region: string;
  city: string;
  yardage: number;
  par: number;
  holes: number;
  difficulty: number;
  rating: number;
  reviews: number;
  tgcStatus: TgcTourStatus | 'None';
  isLidar: boolean;
  greenSpeed: string;
  firmness: string;
  lat: number | null;
  lng: number | null;
  teeInfo: string;
  greenInfo: string;
  fairwayInfo: string;
  desc: string;
  tags: string[];
  accent: string;
}

const QUICK_TEMPLATES: QuickTemplate[] = [
  {
    label: '🏆 Championship Tour (7,340 yds)',
    courseName: 'Highland Pines Championship Club',
    creator: 'Alister Craig',
    sourceType: 'User Created',
    courseType: 'Championship',
    country: 'United States',
    region: 'North Carolina',
    city: 'Pinehurst',
    yardage: 7340,
    par: 72,
    holes: 18,
    difficulty: 8.5,
    rating: 4.9,
    reviews: 142,
    tgcStatus: 'Tour Worthy',
    isLidar: true,
    greenSpeed: 'Championship Lightning (170)',
    firmness: 'Firm',
    lat: 35.1954,
    lng: -79.4695,
    teeInfo: 'Tour Black: 7,340 yds · Blue: 6,890 yds · White: 6,420 yds',
    greenInfo: 'Firm undulating bentgrass with subtle crowning and shaved run-offs',
    fairwayInfo: 'Generous landing areas pinched by deep sand flashed bunkers',
    desc: 'An authentic tour-tested championship layout engineered for high-stakes competition with dramatic risk-reward hole designs and punishing bunker complexes.',
    tags: ['Tour Worthy', 'Championship', 'LiDAR Accurate', 'Fast Greens'],
    accent: '#10b981',
  },
  {
    label: '🌊 Scottish Seaside Links (6,860 yds)',
    courseName: 'Dunehaven Links & Seaside',
    creator: 'Hamish MacLeod',
    sourceType: 'User Created',
    courseType: 'Links',
    country: 'Scotland',
    region: 'Fife',
    city: 'St Andrews Coast',
    yardage: 6860,
    par: 71,
    holes: 18,
    difficulty: 7.9,
    rating: 4.8,
    reviews: 98,
    tgcStatus: 'Platinum Tour',
    isLidar: true,
    greenSpeed: 'Tournament Fast (160)',
    firmness: 'Very Firm',
    lat: 56.3432,
    lng: -2.8027,
    teeInfo: 'Championship: 6,860 yds · Medal: 6,450 yds · Forward: 5,920 yds',
    greenInfo: 'Massive double greens with authentic links slopes and roll-offs',
    fairwayInfo: 'Fast-running fescue fairways routed through steep natural sand dunes',
    desc: 'Pure seaside golf where fierce coastal wind and ground play dictate every shot. Punishing sod-walled revetted bunkers guard blind landing zones.',
    tags: ['Links Style', 'LiDAR Accurate', 'Firm Fairways', 'Oceanfront'],
    accent: '#38bdf8',
  },
  {
    label: '🏜️ Desert Target Oasis (7,210 yds)',
    courseName: 'Mirage Canyon Golf Resort',
    creator: 'Sierra Designs',
    sourceType: 'User Created',
    courseType: 'Desert',
    country: 'United States',
    region: 'Arizona',
    city: 'Scottsdale',
    yardage: 7210,
    par: 72,
    holes: 18,
    difficulty: 8.1,
    rating: 4.7,
    reviews: 86,
    tgcStatus: 'Approved',
    isLidar: false,
    greenSpeed: 'Fast (155)',
    firmness: 'Normal',
    lat: 33.6842,
    lng: -111.8653,
    teeInfo: 'Gold: 7,210 yds · Silver: 6,750 yds · Copper: 6,100 yds',
    greenInfo: 'True-rolling TifEagle greens framed by red rock canyon walls',
    fairwayInfo: 'Lush manicured fairways requiring accurate carries over natural desert washes',
    desc: 'Scenic desert target golf featuring elevated tees, majestic mountain silhouettes, and emerald green islands contrasting with rugged desert terrain.',
    tags: ['Desert Target', 'Resort', 'TGC Approved'],
    accent: '#f59e0b',
  },
];

export const AddCourseModal: React.FC<AddCourseModalProps> = ({
  collections,
  defaultCollectionId,
  onClose,
  onSaveCourse,
  onCreateCollection,
}) => {
  // Active Tab: 'specs' | 'conditions' | 'tags' | 'collections'
  const [activeTab, setActiveTab] = useState<'specs' | 'conditions' | 'tags' | 'collections'>('specs');

  // Form Fields - Basic Info
  const [courseName, setCourseName] = useState('');
  const [creatorName, setCreatorName] = useState('Community Designer');
  const [sourceType, setSourceType] = useState<SourceType>('User Created');
  const [courseType, setCourseType] = useState<CourseType>('Championship');

  // Location & Coordinates
  const [country, setCountry] = useState('United States');
  const [region, setRegion] = useState('');
  const [city, setCity] = useState('');
  const [locationText, setLocationText] = useState('');
  const [latitude, setLatitude] = useState<string>('');
  const [longitude, setLongitude] = useState<string>('');

  // Playing Specifications
  const [courseYardage, setCourseYardage] = useState<number>(7210);
  const [par, setPar] = useState<number>(72);
  const [numberOfHoles, setNumberOfHoles] = useState<number>(18);
  const [difficulty, setDifficulty] = useState<number>(8.2);
  const [communityRating, setCommunityRating] = useState<number>(4.9);
  const [reviewCount, setReviewCount] = useState<number>(120);

  // TGC Tours & Playing Setup
  const [tgcStatus, setTgcStatus] = useState<TgcTourStatus | 'None'>('Tour Worthy');
  const [isLidar, setIsLidar] = useState<boolean>(true);
  const [greenSpeed, setGreenSpeed] = useState<string>('Tournament Fast (160)');
  const [firmness, setFirmness] = useState<string>('Firm');
  const [teeInfo, setTeeInfo] = useState<string>('Tour: 7,210 yds · Members: 6,780 yds');
  const [greenInfo, setGreenInfo] = useState<string>('Undulating bentgrass with severe run-off areas');
  const [fairwayInfo, setFairwayInfo] = useState<string>('Firm championship fairways');

  // Description & Tags
  const [description, setDescription] = useState(
    'A premier championship golf course designed for competitive tournament play with strategic bunkering and undulating green complexes.'
  );
  const [courseTags, setCourseTags] = useState<string[]>(['Tour Worthy', 'Championship', 'LiDAR Accurate']);
  const [tagInput, setTagInput] = useState('');
  const [courseUrl, setCourseUrl] = useState('');
  const [personalNotes, setPersonalNotes] = useState('');

  // Visual Styling
  const [accentColor, setAccentColor] = useState('#10b981');
  const [customImageUrl, setCustomImageUrl] = useState('');

  // Collections selection
  const [selectedColIds, setSelectedColIds] = useState<string[]>(
    defaultCollectionId ? [defaultCollectionId] : collections.length > 0 ? [collections[0].CollectionID] : []
  );
  const [collectionFilter, setCollectionFilter] = useState('');

  // Inline collection creation
  const [showCreateCol, setShowCreateCol] = useState(false);
  const [inlineColName, setInlineColName] = useState('');
  const [inlineColDesc, setInlineColDesc] = useState('');
  const [creatingCol, setCreatingCol] = useState(false);

  // Submission & Validation State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Auto-calculate difficulty tier based on 0-10 rating
  const calculateDifficultyTier = (val: number): DifficultyTier => {
    if (val < 4.0) return 'Very Easy';
    if (val < 6.0) return 'Easy';
    if (val < 7.5) return 'Moderate';
    if (val < 9.0) return 'Difficult';
    return 'Very Difficult';
  };

  const difficultyTier = calculateDifficultyTier(difficulty);

  const applyTemplate = (t: QuickTemplate) => {
    setCourseName(t.courseName);
    setCreatorName(t.creator);
    setSourceType(t.sourceType);
    setCourseType(t.courseType);
    setCountry(t.country);
    setRegion(t.region);
    setCity(t.city);
    setLocationText(`${t.city}, ${t.region}, ${t.country}`);
    setCourseYardage(t.yardage);
    setPar(t.par);
    setNumberOfHoles(t.holes);
    setDifficulty(t.difficulty);
    setCommunityRating(t.rating);
    setReviewCount(t.reviews);
    setTgcStatus(t.tgcStatus);
    setIsLidar(t.isLidar);
    setGreenSpeed(t.greenSpeed);
    setFirmness(t.firmness);
    setLatitude(t.lat !== null ? String(t.lat) : '');
    setLongitude(t.lng !== null ? String(t.lng) : '');
    setTeeInfo(t.teeInfo);
    setGreenInfo(t.greenInfo);
    setFairwayInfo(t.fairwayInfo);
    setDescription(t.desc);
    setCourseTags(t.tags);
    setAccentColor(t.accent);
    setErrorMsg(null);
  };

  const toggleTag = (tag: string) => {
    if (courseTags.includes(tag)) {
      setCourseTags(courseTags.filter((t) => t !== tag));
    } else {
      setCourseTags([...courseTags, tag]);
    }
  };

  const handleAddCustomTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !courseTags.includes(trimmed)) {
      setCourseTags([...courseTags, trimmed]);
      setTagInput('');
    }
  };

  const toggleCollection = (colId: string) => {
    if (selectedColIds.includes(colId)) {
      setSelectedColIds(selectedColIds.filter((id) => id !== colId));
    } else {
      setSelectedColIds([...selectedColIds, colId]);
    }
  };

  const handleSelectAllCollections = () => {
    setSelectedColIds(collections.map((c) => c.CollectionID));
  };

  const handleClearCollectionSelection = () => {
    setSelectedColIds([]);
  };

  const handleCreateInlineCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inlineColName.trim() || !onCreateCollection) return;
    setCreatingCol(true);
    try {
      const created = await onCreateCollection(inlineColName.trim(), inlineColDesc.trim());
      if (created && created.CollectionID) {
        setSelectedColIds((prev) => [...prev, created.CollectionID]);
      }
      setInlineColName('');
      setInlineColDesc('');
      setShowCreateCol(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create collection');
    } finally {
      setCreatingCol(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!courseName.trim()) {
      setErrorMsg('Course Name is required.');
      setActiveTab('specs');
      return;
    }

    if (!courseYardage || courseYardage < 1000 || courseYardage > 12000) {
      setErrorMsg('Please specify a realistic course yardage between 1,000 and 12,000 yards.');
      setActiveTab('specs');
      return;
    }

    if (!par || par < 50 || par > 80) {
      setErrorMsg('Please specify a valid Par (typically 68–74).');
      setActiveTab('specs');
      return;
    }

    // Compose formatted location string
    const locParts = [city.trim(), region.trim(), country.trim()].filter(Boolean);
    const finalLocation = locationText.trim() || locParts.join(', ') || 'Global';

    // Parse coordinates if provided
    const parsedLat = latitude.trim() !== '' && !isNaN(Number(latitude)) ? Number(latitude) : null;
    const parsedLng = longitude.trim() !== '' && !isNaN(Number(longitude)) ? Number(longitude) : null;

    // Generate SVG image if no custom image URL is provided
    const finalImageUrl =
      customImageUrl.trim() ||
      createGolfSvgDataUrl(
        courseName.trim(),
        `${finalLocation} · ${courseYardage.toLocaleString()} yds`,
        accentColor,
        '#12271c'
      );

    setIsSubmitting(true);
    try {
      const coursePayload: Omit<
        Course,
        'CourseID' | 'ExternalCourseID' | 'CreatedDate' | 'UpdatedDate' | 'LastRetrievedDate' | 'IsSaved'
      > = {
        CourseName: courseName.trim(),
        CreatorName: creatorName.trim() || 'Community Designer',
        SourceType: sourceType,
        CourseType: courseType,
        Country: country.trim() || 'United States',
        Region: region.trim(),
        City: city.trim(),
        LocationText: finalLocation,
        Latitude: parsedLat,
        Longitude: parsedLng,
        CourseYardage: Number(courseYardage),
        CourseYardageUnit: 'yards',
        Difficulty: Number(difficulty),
        DifficultyTier: difficultyTier,
        CommunityRating: Number(communityRating),
        ReviewCount: Number(reviewCount),
        Description: description.trim(),
        NumberOfHoles: Number(numberOfHoles),
        Par: Number(par),
        CourseImagePath: '',
        CourseImageURL: finalImageUrl,
        CourseURL: courseUrl.trim() || 'https://www.tgctours.com/Course/Tgc2k25Listings',
        TeeInformation: teeInfo.trim(),
        GreenInformation: greenInfo.trim(),
        FairwayInformation: fairwayInfo.trim(),
        CourseTags: courseTags,
        Popularity: Math.round(communityRating * 19 + 5),
        PlayCount: Math.round(reviewCount * 28 + 2000),
        IsFavourite: false,
        PersonalNotes: personalNotes.trim(),
        TgcStatus: tgcStatus === 'None' ? undefined : (tgcStatus as TgcTourStatus),
        TgcListingUrl: courseUrl.trim() || (tgcStatus !== 'None' ? 'https://www.tgctours.com/Course/Tgc2k25Listings' : undefined),
        IsLidar: isLidar,
        GreenSpeed: greenSpeed,
        Firmness: firmness,
      };

      await onSaveCourse(coursePayload, selectedColIds);
      setSuccessMsg(
        `"${courseName.trim()}" successfully added and saved to ${selectedColIds.length} collection(s)!`
      );
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save course. Please try again.');
      setIsSubmitting(false);
    }
  };

  const filteredCollections = collections.filter(
    (c) =>
      c.CollectionName.toLowerCase().includes(collectionFilter.toLowerCase()) ||
      c.Description.toLowerCase().includes(collectionFilter.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 overflow-y-auto animate-fade-in">
      <div className="bg-[#0b1710] border border-[#1e402c] rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-[#08120c] border-b border-[#1a3826] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-600/30 to-amber-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-inner">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <span>Add PGA TOUR 2K25 Course</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-600/50 text-emerald-300">
                  Custom Entry
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Define comprehensive course specifications and save directly into selected collections.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Autofill Preset Bar */}
        <div className="px-6 py-2.5 bg-[#07130b] border-b border-[#162e20] flex items-center gap-2 overflow-x-auto text-xs shrink-0 select-none">
          <span className="text-slate-400 text-[11px] font-semibold shrink-0 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Quick Presets:</span>
          </span>
          <div className="flex items-center gap-1.5 flex-nowrap">
            {QUICK_TEMPLATES.map((tmpl) => (
              <button
                key={tmpl.label}
                type="button"
                onClick={() => applyTemplate(tmpl)}
                className="px-2.5 py-1 rounded bg-[#0e2217] hover:bg-[#183926] border border-[#1e422c] hover:border-emerald-500/60 text-slate-300 hover:text-emerald-300 text-[11px] font-medium transition-all shrink-0 cursor-pointer active:scale-95"
                title="Fill all course information with this layout template"
              >
                {tmpl.label}
              </button>
            ))}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 pt-3 pb-2 bg-[#09150e] border-b border-[#183324] flex items-center gap-2 overflow-x-auto text-xs shrink-0 select-none">
          <button
            type="button"
            onClick={() => setActiveTab('specs')}
            className={`px-3.5 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition-all ${
              activeTab === 'specs'
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#102419]'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Course &amp; Specs</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('conditions')}
            className={`px-3.5 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition-all ${
              activeTab === 'conditions'
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#102419]'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>TGC Tours &amp; Conditions</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('tags')}
            className={`px-3.5 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition-all ${
              activeTab === 'tags'
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#102419]'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            <span>Description &amp; Tags</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('collections')}
            className={`px-3.5 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition-all ${
              activeTab === 'collections'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#102419]'
            }`}
          >
            <FolderTree className="w-3.5 h-3.5" />
            <span>Assign Collections</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                selectedColIds.length > 0 ? 'bg-amber-950 text-amber-300' : 'bg-black/30 text-slate-400'
              }`}
            >
              {selectedColIds.length}
            </span>
          </button>
        </div>

        {/* Modal Body / Form Container */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {errorMsg && (
            <div className="p-3 bg-rose-950/60 border border-rose-800/80 rounded-xl text-rose-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-950/70 border border-emerald-700/80 rounded-xl text-emerald-200 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="font-semibold">{successMsg}</span>
            </div>
          )}

          {/* TAB 1: Specs & Basic Info */}
          {activeTab === 'specs' && (
            <div className="space-y-5 animate-fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Course Name */}
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                    <span>Course Name</span>
                    <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={courseName}
                    onChange={(e) => setCourseName(e.target.value)}
                    placeholder="e.g. Cypress Point Links, Tara Iti Golf Club"
                    className="w-full px-3 py-2 bg-[#06100a] border border-[#21432f] rounded-lg text-slate-100 text-xs focus:outline-none focus:border-emerald-500 font-semibold"
                  />
                </div>

                {/* Creator / Designer Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">Designer / Creator Name</label>
                  <input
                    type="text"
                    value={creatorName}
                    onChange={(e) => setCreatorName(e.target.value)}
                    placeholder="e.g. Crazycanuck1985, Justin, Alister MacKenzie"
                    className="w-full px-3 py-2 bg-[#06100a] border border-[#21432f] rounded-lg text-slate-100 text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Source Type */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">Source Type</label>
                  <select
                    value={sourceType}
                    onChange={(e) => setSourceType(e.target.value as SourceType)}
                    className="w-full px-3 py-2 bg-[#06100a] border border-[#21432f] rounded-lg text-slate-100 text-xs focus:outline-none focus:border-emerald-500"
                  >
                    <option value="User Created">User Created / Community Designer</option>
                    <option value="Official">Official HB Studios / 2K Recreation</option>
                  </select>
                </div>

                {/* Course Type */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">Course Style / Type</label>
                  <select
                    value={courseType}
                    onChange={(e) => setCourseType(e.target.value as CourseType)}
                    className="w-full px-3 py-2 bg-[#06100a] border border-[#21432f] rounded-lg text-slate-100 text-xs focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Championship">Championship</option>
                    <option value="Links">Links</option>
                    <option value="Parkland">Parkland</option>
                    <option value="Mountain">Mountain</option>
                    <option value="Coastal">Coastal</option>
                    <option value="Desert">Desert</option>
                    <option value="Heathland">Heathland</option>
                    <option value="Resort">Resort</option>
                    <option value="Forest">Forest</option>
                    <option value="Fantasy">Fantasy</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Country */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">Country</label>
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="e.g. United States, Scotland, Ireland, Canada"
                    className="w-full px-3 py-2 bg-[#06100a] border border-[#21432f] rounded-lg text-slate-100 text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Region / State */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">Region / State / County</label>
                  <input
                    type="text"
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    placeholder="e.g. California, Highlands, Ontario, Victoria"
                    className="w-full px-3 py-2 bg-[#06100a] border border-[#21432f] rounded-lg text-slate-100 text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* City */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">City / Township</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Pebble Beach, St Andrews, Melbourne"
                    className="w-full px-3 py-2 bg-[#06100a] border border-[#21432f] rounded-lg text-slate-100 text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Coordinates (Latitude & Longitude for Map View) */}
                <div className="space-y-1.5 sm:col-span-2 pt-2 border-t border-[#183324]/60">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Geographic Coordinates (Optional for Map View)</span>
                    </label>
                    <span className="text-[10px] text-slate-400">e.g. 36.5688, -121.9506</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={latitude}
                      onChange={(e) => setLatitude(e.target.value)}
                      placeholder="Latitude (e.g. 36.5688)"
                      className="w-full px-3 py-1.5 bg-[#06100a] border border-[#21432f] rounded-lg text-slate-100 text-xs focus:outline-none focus:border-emerald-500 font-mono"
                    />
                    <input
                      type="text"
                      value={longitude}
                      onChange={(e) => setLongitude(e.target.value)}
                      placeholder="Longitude (e.g. -121.9506)"
                      className="w-full px-3 py-1.5 bg-[#06100a] border border-[#21432f] rounded-lg text-slate-100 text-xs focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Playing Specs Section */}
              <div className="pt-3 border-t border-[#183324] space-y-4">
                <div className="flex items-center gap-2">
                  <Ruler className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Playing Specifications (PGA TOUR 2K25)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Course Yardage */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-emerald-300 flex items-center justify-between">
                      <span>Total Course Yardage</span>
                      <span className="font-mono text-[11px] text-emerald-400 font-bold">
                        {courseYardage ? `${courseYardage.toLocaleString()} yds` : ''}
                      </span>
                    </label>
                    <input
                      type="number"
                      required
                      min={1000}
                      max={12000}
                      value={courseYardage}
                      onChange={(e) => setCourseYardage(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-[#06100a] border border-[#21432f] rounded-lg text-slate-100 text-xs focus:outline-none focus:border-emerald-500 font-mono font-bold"
                    />
                    <span className="text-[10px] text-slate-400">
                      Primary distance criteria (championship tees · approx {Math.round(courseYardage * 0.9144)} m)
                    </span>
                  </div>

                  {/* Par */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-200">Par</label>
                    <input
                      type="number"
                      required
                      min={54}
                      max={76}
                      value={par}
                      onChange={(e) => setPar(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-[#06100a] border border-[#21432f] rounded-lg text-slate-100 text-xs focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>

                  {/* Holes */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-200">Number of Holes</label>
                    <select
                      value={numberOfHoles}
                      onChange={(e) => setNumberOfHoles(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-[#06100a] border border-[#21432f] rounded-lg text-slate-100 text-xs focus:outline-none focus:border-emerald-500"
                    >
                      <option value={18}>18 Holes (Championship Standard)</option>
                      <option value={9}>9 Holes</option>
                      <option value={27}>27 Holes</option>
                      <option value={36}>36 Holes (Dual Courses)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Difficulty Slider */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-300">Difficulty Rating</span>
                      <span className="font-mono font-bold text-amber-300">{difficulty.toFixed(1)} / 10.0</span>
                    </div>
                    <input
                      type="range"
                      min="1.0"
                      max="10.0"
                      step="0.1"
                      value={difficulty}
                      onChange={(e) => setDifficulty(parseFloat(e.target.value))}
                      className="w-full accent-emerald-500 cursor-pointer"
                    />
                    <div className="text-[10px] text-slate-400 flex items-center justify-between">
                      <span>Tier: <strong className="text-slate-200">{difficultyTier}</strong></span>
                      <span>(1.0 easy — 10.0 brutal)</span>
                    </div>
                  </div>

                  {/* Community Rating */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-300">Community Rating</span>
                      <span className="font-mono font-bold text-emerald-400">{communityRating.toFixed(1)} ★</span>
                    </div>
                    <input
                      type="range"
                      min="1.0"
                      max="5.0"
                      step="0.1"
                      value={communityRating}
                      onChange={(e) => setCommunityRating(parseFloat(e.target.value))}
                      className="w-full accent-emerald-500 cursor-pointer"
                    />
                    <span className="text-[10px] text-slate-400">Out of 5.0 stars</span>
                  </div>

                  {/* Review Count */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-300">Review Count</label>
                    <input
                      type="number"
                      min={0}
                      value={reviewCount}
                      onChange={(e) => setReviewCount(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-[#06100a] border border-[#21432f] rounded-lg text-slate-100 text-xs focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: TGC Tours & Playing Setup */}
          {activeTab === 'conditions' && (
            <div className="space-y-5 animate-fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* TGC Status */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-amber-400" />
                    <span>TGC Tours Certification Status</span>
                  </label>
                  <select
                    value={tgcStatus}
                    onChange={(e) => setTgcStatus(e.target.value as any)}
                    className="w-full px-3 py-2 bg-[#06100a] border border-[#21432f] rounded-lg text-slate-100 text-xs focus:outline-none focus:border-emerald-500 font-semibold"
                  >
                    <option value="Tour Worthy">Tour Worthy (Flagship Championship)</option>
                    <option value="Approved">Approved (Certified for Societies)</option>
                    <option value="Platinum Tour">Platinum Tour (Premier Tier)</option>
                    <option value="Elite Tour">Elite Tour (Pro Circuit)</option>
                    <option value="Challenge Circuit">Challenge Circuit (Developmental)</option>
                    <option value="Under Review">Under Review</option>
                    <option value="None">None (Standard Community)</option>
                  </select>
                </div>

                {/* LiDAR elevation checkbox */}
                <div className="space-y-1.5 flex flex-col justify-end">
                  <label className="flex items-center gap-2.5 p-2.5 bg-[#09150e] border border-[#1d3d2a] rounded-lg cursor-pointer hover:bg-[#0f2217] transition-colors">
                    <input
                      type="checkbox"
                      checked={isLidar}
                      onChange={(e) => setIsLidar(e.target.checked)}
                      className="accent-emerald-500 w-4 h-4 rounded cursor-pointer"
                    />
                    <span className="text-xs text-slate-200 font-medium">
                      Built with 1:1 Real-World LiDAR Elevation Data
                    </span>
                  </label>
                </div>

                {/* Green Speed */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">Green Speed (Stimpmeter)</label>
                  <select
                    value={greenSpeed}
                    onChange={(e) => setGreenSpeed(e.target.value)}
                    className="w-full px-3 py-2 bg-[#06100a] border border-[#21432f] rounded-lg text-slate-100 text-xs focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Championship Lightning (174)">Championship Lightning (174)</option>
                    <option value="Championship Lightning (170)">Championship Lightning (170)</option>
                    <option value="Very Fast (164)">Very Fast (164)</option>
                    <option value="Tournament Fast (160)">Tournament Fast (160)</option>
                    <option value="Fast (155)">Fast (155)</option>
                    <option value="Medium (145)">Medium (145)</option>
                    <option value="Soft / Normal (135)">Soft / Normal (135)</option>
                  </select>
                </div>

                {/* Firmness */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">Turf &amp; Green Firmness</label>
                  <select
                    value={firmness}
                    onChange={(e) => setFirmness(e.target.value)}
                    className="w-full px-3 py-2 bg-[#06100a] border border-[#21432f] rounded-lg text-slate-100 text-xs focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Very Firm">Very Firm (Fast Links Rollout)</option>
                    <option value="Firm">Firm (Tournament Standard)</option>
                    <option value="Normal">Normal</option>
                    <option value="Soft">Soft (Target / Dartboard)</option>
                  </select>
                </div>

                {/* Tee Information */}
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-medium text-slate-300">Tee Setup Information</label>
                  <input
                    type="text"
                    value={teeInfo}
                    onChange={(e) => setTeeInfo(e.target.value)}
                    placeholder="e.g. Black: 7,450 yds · Blue: 7,020 yds · White: 6,580 yds"
                    className="w-full px-3 py-2 bg-[#06100a] border border-[#21432f] rounded-lg text-slate-100 text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Green & Fairway Information */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">Green Surface Characteristics</label>
                  <input
                    type="text"
                    value={greenInfo}
                    onChange={(e) => setGreenInfo(e.target.value)}
                    placeholder="e.g. Subtly tiered bentgrass, severe false fronts"
                    className="w-full px-3 py-2 bg-[#06100a] border border-[#21432f] rounded-lg text-slate-100 text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">Fairway / Rough Conditions</label>
                  <input
                    type="text"
                    value={fairwayInfo}
                    onChange={(e) => setFairwayInfo(e.target.value)}
                    placeholder="e.g. Firm fescue fairways with generous runouts"
                    className="w-full px-3 py-2 bg-[#06100a] border border-[#21432f] rounded-lg text-slate-100 text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Accent Color for Course Card */}
              <div className="pt-3 border-t border-[#183324] space-y-2">
                <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Card Visual Accent Color</span>
                </label>
                <div className="flex items-center gap-3 flex-wrap">
                  {ACCENT_COLORS.map((col) => (
                    <button
                      key={col.hex}
                      type="button"
                      onClick={() => setAccentColor(col.hex)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs transition-all ${
                        accentColor === col.hex
                          ? 'border-white bg-white/10 text-white font-bold'
                          : 'border-[#1b3a27] bg-[#07130b] text-slate-300 hover:border-slate-500'
                      }`}
                    >
                      <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: col.hex }} />
                      <span>{col.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Description & Tags */}
          {activeTab === 'tags' && (
            <div className="space-y-5 animate-fade-in">
              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Course Description &amp; Strategic Notes</span>
                </label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe signature holes, elevation changes, visual backdrop, and wind play in PGA TOUR 2K25..."
                  className="w-full px-3 py-2 bg-[#06100a] border border-[#21432f] rounded-lg text-slate-100 text-xs focus:outline-none focus:border-emerald-500 leading-relaxed resize-none"
                />
              </div>

              {/* Tags Selection */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-200 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Course Tags ({courseTags.length})</span>
                  </span>
                  <span className="text-[10px] text-slate-400">Click to add/remove tags</span>
                </label>

                {/* Preset Tag Chips */}
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_TAGS.map((tag) => {
                    const active = courseTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1 ${
                          active
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'bg-[#09150e] border border-[#1b3a27] text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {active && <Check className="w-3 h-3" />}
                        <span>{tag}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Custom Tag Input */}
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustomTag();
                      }
                    }}
                    placeholder="Add custom tag (e.g. 'Donald Ross', 'Gorse', 'Par 3 17th')..."
                    className="flex-1 px-3 py-1.5 bg-[#06100a] border border-[#21432f] rounded-lg text-slate-100 text-xs focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomTag}
                    className="px-3 py-1.5 bg-[#142e1f] hover:bg-[#1d422c] border border-[#234832] text-emerald-300 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Tag</span>
                  </button>
                </div>
              </div>

              {/* TGC / Website URL */}
              <div className="space-y-1.5 pt-2 border-t border-[#183324]">
                <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-sky-400" />
                  <span>External Website / TGC Tours Listing URL</span>
                </label>
                <input
                  type="url"
                  value={courseUrl}
                  onChange={(e) => setCourseUrl(e.target.value)}
                  placeholder="https://www.tgctours.com/Course/Tgc2k25Listings..."
                  className="w-full px-3 py-2 bg-[#06100a] border border-[#21432f] rounded-lg text-slate-100 text-xs focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              {/* Personal Notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Personal Private Notes</label>
                <input
                  type="text"
                  value={personalNotes}
                  onChange={(e) => setPersonalNotes(e.target.value)}
                  placeholder="e.g. Played with Society on Friday, watch the wind on hole 14..."
                  className="w-full px-3 py-2 bg-[#06100a] border border-[#21432f] rounded-lg text-slate-100 text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          )}

          {/* TAB 4: Assign Collections (Core Feature) */}
          {activeTab === 'collections' && (
            <div className="space-y-5 animate-fade-in">
              <div className="p-4 bg-[#08150f] border border-[#1b3d27] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <FolderTree className="w-4 h-4 text-amber-400" />
                    <span>Select Course Collections</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Choose one or more collections to immediately organize and save this new course into.
                  </p>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <button
                    type="button"
                    onClick={handleSelectAllCollections}
                    className="px-2.5 py-1 rounded bg-[#102519] hover:bg-[#183524] text-slate-300 hover:text-white border border-[#1f3f2a] transition-colors"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={handleClearCollectionSelection}
                    className="px-2.5 py-1 rounded bg-[#102519] hover:bg-[#183524] text-slate-400 hover:text-white border border-[#1f3f2a] transition-colors"
                  >
                    Clear
                  </button>
                  {onCreateCollection && (
                    <button
                      type="button"
                      onClick={() => setShowCreateCol(!showCreateCol)}
                      className="px-3 py-1 rounded bg-emerald-700 hover:bg-emerald-600 text-white font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <FolderPlus className="w-3.5 h-3.5" />
                      <span>New Collection</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Collections Search Filter if multiple exist */}
              {collections.length > 4 && (
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={collectionFilter}
                    onChange={(e) => setCollectionFilter(e.target.value)}
                    placeholder="Filter collections by name..."
                    className="w-full pl-8 pr-3 py-1.5 bg-[#07130b] border border-[#1c3826] rounded-lg text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
              )}

              {/* Inline New Collection Creation */}
              {showCreateCol && (
                <div className="p-4 bg-[#0d2216] border border-emerald-600/40 rounded-xl space-y-3 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                      <Plus className="w-3.5 h-3.5" /> Create New Collection
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowCreateCol(false)}
                      className="text-slate-400 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={inlineColName}
                      onChange={(e) => setInlineColName(e.target.value)}
                      placeholder="Collection Name (e.g. 'Championship Rotation 2026')..."
                      className="w-full px-3 py-1.5 bg-[#06100a] border border-[#21432f] rounded-lg text-slate-100 text-xs focus:outline-none focus:border-emerald-500 font-semibold"
                    />
                    <input
                      type="text"
                      value={inlineColDesc}
                      onChange={(e) => setInlineColDesc(e.target.value)}
                      placeholder="Short description..."
                      className="w-full px-3 py-1.5 bg-[#06100a] border border-[#21432f] rounded-lg text-slate-100 text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      disabled={creatingCol || !inlineColName.trim()}
                      onClick={handleCreateInlineCollection}
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold rounded-lg text-xs transition-colors flex items-center gap-1.5"
                    >
                      {creatingCol ? 'Creating...' : 'Create & Select Collection'}
                    </button>
                  </div>
                </div>
              )}

              {/* Collections Checkbox Grid */}
              {filteredCollections.length === 0 ? (
                <div className="p-8 text-center bg-[#07130b] border border-[#162e20] rounded-xl space-y-3">
                  <FolderTree className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="text-xs text-slate-300 font-semibold">No custom collections match</p>
                  <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                    Click &quot;New Collection&quot; above to create a collection and save this course into it.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {filteredCollections.map((col) => {
                    const isChecked = selectedColIds.includes(col.CollectionID);
                    return (
                      <div
                        key={col.CollectionID}
                        onClick={() => toggleCollection(col.CollectionID)}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 select-none ${
                          isChecked
                            ? 'bg-[#153422] border-emerald-500/70 shadow-md text-white'
                            : 'bg-[#08150f] border-[#183523] text-slate-300 hover:bg-[#0e2216]'
                        }`}
                      >
                        <div
                          className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                            isChecked
                              ? 'bg-emerald-500 border-emerald-400 text-white'
                              : 'border-[#264b34] bg-[#06100a]'
                          }`}
                        >
                          {isChecked && <Check className="w-3.5 h-3.5" />}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-xs truncate">{col.CollectionName}</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/40 text-slate-300 shrink-0">
                              {col.CourseIDs.length} courses
                            </span>
                          </div>
                          {col.Description && (
                            <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">
                              {col.Description}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Persistent Footer Actions */}
          <div className="pt-4 border-t border-[#183324] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="font-semibold text-slate-300">
                {selectedColIds.length === 0
                  ? 'No collection selected (course will save to Saved Courses library)'
                  : `Saving to ${selectedColIds.length} collection${selectedColIds.length === 1 ? '' : 's'}`}
              </span>
            </div>

            <div className="flex items-center gap-2.5 justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-slate-400 hover:text-white rounded-lg text-xs font-medium transition-colors"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 disabled:opacity-50 text-white font-bold text-xs rounded-lg shadow-lg hover:shadow-emerald-900/40 border border-emerald-500/50 flex items-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Saving Course...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Save Course &amp; Add to Collections</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
