import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// TGC Tours 2K25 Listings Curated Database (https://www.tgctours.com/Course/Tgc2k25Listings)
import { TGC_2K25_LISTINGS_DATA } from './src/data/tgc2k25Listings';
export { TGC_2K25_LISTINGS_DATA };

// Fallback curated web search results if GEMINI_API_KEY is not set or network fails
const WEB_FALLBACK_COURSES = [
  ...TGC_2K25_LISTINGS_DATA.slice(0, 5).map(c => ({
    CourseName: c.CourseName,
    CreatorName: c.CreatorName,
    SourceType: c.SourceType,
    CourseType: c.CourseType,
    Country: c.Country,
    Region: c.Region,
    City: c.City,
    LocationText: c.LocationText,
    CourseYardage: c.CourseYardage,
    Par: c.Par,
    NumberOfHoles: c.NumberOfHoles,
    Difficulty: c.Difficulty,
    DifficultyTier: c.DifficultyTier,
    CommunityRating: c.CommunityRating,
    ReviewCount: c.ReviewCount,
    Description: c.Description,
    CourseTags: c.CourseTags,
    SourceUrl: 'https://www.tgctours.com/Course/Tgc2k25Listings',
    WebSourceTitle: 'TGC Tours 2K25 Listings (https://www.tgctours.com/Course/Tgc2k25Listings)'
  }))
];

// Helper: SVG image generator for web courses
function createSvgDataUrl(title: string, sub: string, accentHex: string, bgHex: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450" width="800" height="450">
    <defs>
      <linearGradient id="sky" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#12251a" />
        <stop offset="60%" stop-color="#183626" />
        <stop offset="100%" stop-color="#234934" />
      </linearGradient>
      <linearGradient id="fairway" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${bgHex}" />
        <stop offset="100%" stop-color="#0c1b13" />
      </linearGradient>
    </defs>
    <rect width="800" height="450" fill="url(#sky)" />
    <circle cx="680" cy="90" r="110" fill="${accentHex}" opacity="0.15" />
    <path d="M0,230 Q120,180 240,210 T480,195 T720,220 L800,215 L800,450 L0,450 Z" fill="#0f2216" opacity="0.9" />
    <path d="M0,260 Q180,220 360,250 T720,235 L800,245 L800,450 L0,450 Z" fill="url(#fairway)" />
    <ellipse cx="400" cy="320" rx="90" ry="34" fill="#2d5e44" />
    <line x1="410" y1="320" x2="410" y2="250" stroke="#f1f5f9" stroke-width="2.5" />
    <polygon points="410,250 440,260 410,270" fill="${accentHex}" />
    <rect y="360" width="800" height="90" fill="rgba(8,16,12,0.85)" />
    <line x1="0" y1="360" x2="800" y2="360" stroke="${accentHex}" stroke-width="1.5" opacity="0.6" />
    <text x="32" y="396" fill="#f8fafc" font-family="'Plus Jakarta Sans', sans-serif" font-size="20" font-weight="700">${title}</text>
    <text x="32" y="424" fill="#94a3b8" font-family="'Plus Jakarta Sans', sans-serif" font-size="13" font-weight="500">${sub}</text>
    <text x="768" y="405" text-anchor="end" fill="${accentHex}" font-family="'JetBrains Mono', monospace" font-size="14" font-weight="600">LIVE WEB RESULT</text>
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

// Helper: SVG image generator for TGC Tours courses
function createTgcSvgDataUrl(title: string, sub: string, status: string, accentHex: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450" width="800" height="450">
    <defs>
      <linearGradient id="tgcSky" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#0a1a12" />
        <stop offset="60%" stop-color="#122a1d" />
        <stop offset="100%" stop-color="#183625" />
      </linearGradient>
      <linearGradient id="tgcFairway" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#19472e" />
        <stop offset="100%" stop-color="#091b11" />
      </linearGradient>
    </defs>
    <rect width="800" height="450" fill="url(#tgcSky)" />
    <!-- Golden sun/moon halo -->
    <circle cx="680" cy="85" r="95" fill="${accentHex}" opacity="0.12" />
    <path d="M0,210 Q140,170 280,195 T560,185 T740,210 L800,205 L800,450 L0,450 Z" fill="#0d2116" opacity="0.95" />
    <path d="M0,245 Q200,210 400,235 T800,230 L800,450 L0,450 Z" fill="url(#tgcFairway)" />
    <!-- Championship pin and flag -->
    <ellipse cx="420" cy="315" rx="80" ry="28" fill="#2d6a45" />
    <line x1="435" y1="315" x2="435" y2="230" stroke="#f8fafc" stroke-width="2.5" />
    <polygon points="435,230 475,242 435,255" fill="${accentHex}" />
    <!-- Bottom overlay banner -->
    <rect y="350" width="800" height="100" fill="rgba(6,16,11,0.92)" />
    <line x1="0" y1="350" x2="800" y2="350" stroke="${accentHex}" stroke-width="1.8" opacity="0.8" />
    <text x="32" y="390" fill="#f8fafc" font-family="'Plus Jakarta Sans', sans-serif" font-size="20" font-weight="700">${title}</text>
    <text x="32" y="420" fill="#94a3b8" font-family="'Plus Jakarta Sans', sans-serif" font-size="13" font-weight="500">${sub}</text>
    <rect x="620" y="372" width="150" height="28" rx="6" fill="#143623" stroke="${accentHex}" stroke-width="1" />
    <text x="695" y="391" text-anchor="middle" fill="${accentHex}" font-family="'JetBrains Mono', monospace" font-size="11" font-weight="700">${status.toUpperCase()}</text>
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

// GET/POST /api/tgc-listings: TGC Tours 2K25 Listings (https://www.tgctours.com/Course/Tgc2k25Listings)
app.all('/api/tgc-listings', async (req, res) => {
  const params = req.method === 'POST' ? req.body : req.query;
  const {
    query = '',
    tgcStatus = 'All',
    yardagePreset = 'Any',
    minYardage,
    maxYardage,
    courseType,
    designer
  } = params;

  try {
    let results = [...TGC_2K25_LISTINGS_DATA];

    // Filter by query
    if (query && typeof query === 'string' && query.trim()) {
      const q = query.toLowerCase().trim();
      results = results.filter((c) =>
        c.CourseName.toLowerCase().includes(q) ||
        c.CreatorName.toLowerCase().includes(q) ||
        c.LocationText.toLowerCase().includes(q) ||
        c.CourseType.toLowerCase().includes(q) ||
        c.CourseTags.some((t: string) => t.toLowerCase().includes(q))
      );
    }

    // Filter by TGC Status
    if (tgcStatus && tgcStatus !== 'All') {
      if (tgcStatus === 'Tour Worthy') {
        results = results.filter((c) => c.TgcStatus === 'Tour Worthy');
      } else if (tgcStatus === 'Approved') {
        results = results.filter((c) => c.TgcStatus === 'Approved' || c.TgcStatus === 'Tour Worthy');
      } else if (tgcStatus === 'Platinum Tour') {
        results = results.filter((c) => c.TgcStatus === 'Platinum Tour');
      } else if (tgcStatus === 'Elite Tour') {
        results = results.filter((c) => c.TgcStatus === 'Elite Tour' || c.TgcStatus === 'Platinum Tour');
      } else if (tgcStatus === 'LiDAR Only') {
        results = results.filter((c) => c.IsLidar === true);
      }
    }

    // Filter by designer
    if (designer && typeof designer === 'string' && designer.trim()) {
      const d = designer.toLowerCase().trim();
      results = results.filter((c) => c.CreatorName.toLowerCase().includes(d));
    }

    // Filter by courseType
    if (courseType && typeof courseType === 'string' && courseType !== 'All') {
      results = results.filter((c) => c.CourseType.toLowerCase() === courseType.toLowerCase());
    }

    // Filter by yardage
    const minY = minYardage ? Number(minYardage) : null;
    const maxY = maxYardage ? Number(maxYardage) : null;
    if (minY !== null) {
      results = results.filter((c) => c.CourseYardage >= minY);
    }
    if (maxY !== null) {
      results = results.filter((c) => c.CourseYardage <= maxY);
    }

    // Format into standard Course objects with SVG image URLs
    const formattedCourses = results.map((item) => {
      const accent = item.TgcStatus === 'Tour Worthy' ? '#eab308' : item.TgcStatus === 'Platinum Tour' ? '#c084fc' : '#34d399';
      return {
        CourseID: item.CourseID,
        ExternalCourseID: item.ExternalCourseID,
        CourseName: item.CourseName,
        CreatorName: item.CreatorName,
        SourceType: item.SourceType as any,
        CourseType: item.CourseType as any,
        Country: item.Country,
        Region: item.Region,
        City: item.City,
        LocationText: item.LocationText,
        Latitude: null,
        Longitude: null,
        CourseYardage: item.CourseYardage,
        CourseYardageUnit: 'yards' as const,
        Difficulty: item.Difficulty,
        DifficultyTier: item.DifficultyTier as any,
        CommunityRating: item.CommunityRating,
        ReviewCount: item.ReviewCount,
        Description: item.Description,
        NumberOfHoles: item.NumberOfHoles,
        Par: item.Par,
        CourseImagePath: '',
        CourseImageURL: createTgcSvgDataUrl(
          item.CourseName,
          `${item.LocationText} · ${item.CourseYardage.toLocaleString()} yds`,
          item.TgcStatus || 'TGC Approved',
          accent
        ),
        CourseURL: item.TgcListingUrl || 'https://www.tgctours.com/Course/Tgc2k25Listings',
        CourseTags: item.CourseTags,
        CreatedDate: new Date().toISOString().slice(0, 10),
        UpdatedDate: new Date().toISOString().slice(0, 10),
        LastRetrievedDate: new Date().toISOString(),
        IsFavourite: false,
        IsSaved: false,
        TgcStatus: item.TgcStatus as any,
        TgcListingUrl: item.TgcListingUrl,
        IsLidar: item.IsLidar,
        GreenSpeed: item.GreenSpeed,
        Firmness: item.Firmness,
      };
    });

    return res.json({
      success: true,
      officialListingUrl: 'https://www.tgctours.com/Course/Tgc2k25Listings',
      totalCount: formattedCourses.length,
      courses: formattedCourses,
    });
  } catch (err: any) {
    console.error('TGC listings error:', err);
    return res.status(500).json({ success: false, error: err.message, courses: [] });
  }
});

// POST /api/web-search: Grounded Web Search for PGA TOUR 2K25 Courses
app.post('/api/web-search', async (req, res) => {
  const { query = '', yardagePreset = 'Any', minYardage, maxYardage } = req.body;

  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.log('No GEMINI_API_KEY present; serving curated web search results');
      const filtered = WEB_FALLBACK_COURSES.filter((c) => {
        if (!query.trim()) return true;
        const q = query.toLowerCase();
        return (
          c.CourseName.toLowerCase().includes(q) ||
          c.CreatorName.toLowerCase().includes(q) ||
          c.LocationText.toLowerCase().includes(q) ||
          c.CourseType.toLowerCase().includes(q)
        );
      });

      const mapped = (filtered.length > 0 ? filtered : WEB_FALLBACK_COURSES).map((item, idx) => ({
        CourseID: `web-${Date.now()}-${idx}`,
        ExternalCourseID: `WEB-2K25-${Math.floor(1000 + Math.random() * 9000)}`,
        CourseName: item.CourseName,
        CreatorName: item.CreatorName,
        SourceType: item.SourceType as any,
        CourseType: item.CourseType as any,
        Country: item.Country,
        Region: item.Region,
        City: item.City,
        LocationText: item.LocationText,
        Latitude: null,
        Longitude: null,
        CourseYardage: item.CourseYardage,
        CourseYardageUnit: 'yards',
        Difficulty: item.Difficulty,
        DifficultyTier: item.DifficultyTier as any,
        CommunityRating: item.CommunityRating,
        ReviewCount: item.ReviewCount,
        Description: item.Description,
        NumberOfHoles: item.NumberOfHoles,
        Par: item.Par,
        CourseImagePath: '',
        CourseImageURL: createSvgDataUrl(item.CourseName, `${item.LocationText} · ${item.CourseYardage.toLocaleString()} yds`, '#38bdf8', '#163121'),
        CourseURL: item.SourceUrl,
        CourseTags: item.CourseTags,
        CreatedDate: new Date().toISOString().slice(0, 10),
        UpdatedDate: new Date().toISOString().slice(0, 10),
        LastRetrievedDate: new Date().toISOString(),
        IsFavourite: false,
        IsSaved: false,
        WebSource: {
          title: item.WebSourceTitle,
          url: item.SourceUrl
        }
      }));

      return res.json({ courses: mapped, citations: [], queryUsed: query });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const searchQuery = query.trim() || 'top popular rated user created and official golf courses in PGA TOUR 2K25';
    let prompt = `Search the live web for golf courses available in PGA TOUR 2K25 (including TGC Tours approved courses, HB Studios official courses, and community designer creations) matching: "${searchQuery}".
Find 4 to 6 real PGA TOUR 2K25 courses with real course yardage (in yards), creator name, location, and description.

Return ONLY a valid JSON array of courses matching this format:
[
  {
    "CourseName": "Full Course Name",
    "CreatorName": "Designer Name or 'HB Studios / Official'",
    "SourceType": "Official" or "User Created",
    "CourseType": "Links" or "Parkland" or "Coastal" or "Mountain" or "Desert" or "Heathland" or "Resort" or "Championship" or "Fantasy",
    "Country": "Country Name",
    "Region": "State or Region",
    "City": "City or Area",
    "LocationText": "City, Region, Country",
    "CourseYardage": 7150,
    "Par": 72,
    "NumberOfHoles": 18,
    "Difficulty": 8.2,
    "DifficultyTier": "Difficult",
    "CommunityRating": 4.9,
    "ReviewCount": 450,
    "Description": "2-3 sentences about this course's holes, green speeds, terrain, and wind play in PGA TOUR 2K25.",
    "CourseTags": ["TGC Tours", "Championship", "Links"],
    "SourceUrl": "URL where course was mentioned or reviewed",
    "WebSourceTitle": "Title of the website"
  }
]`;

    if (minYardage || maxYardage) {
      prompt += `\nEnsure course yardage is approximately between ${minYardage || 5000} and ${maxYardage || 7800} yards.`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '[]';
    let rawCourses: any[] = [];
    try {
      rawCourses = JSON.parse(text);
      if (!Array.isArray(rawCourses)) {
        rawCourses = (rawCourses as any).courses || [];
      }
    } catch {
      console.warn('Failed to parse JSON directly from Gemini, using regex fallback');
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        rawCourses = JSON.parse(jsonMatch[0]);
      }
    }

    // Extract grounding citations
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const citations = chunks
      .filter((chunk: any) => chunk.web?.uri)
      .map((chunk: any) => ({
        url: chunk.web.uri,
        title: chunk.web.title || chunk.web.uri,
      }));

    // Transform into standard Course objects
    const mappedCourses = rawCourses.map((item: any, idx: number) => {
      const yardage = Number(item.CourseYardage) || 7100;
      const difficulty = Number(item.Difficulty) || 8.0;
      let diffTier = item.DifficultyTier;
      if (!diffTier) {
        if (difficulty < 5.0) diffTier = 'Easy';
        else if (difficulty < 7.5) diffTier = 'Moderate';
        else if (difficulty < 9.0) diffTier = 'Difficult';
        else diffTier = 'Very Difficult';
      }

      return {
        CourseID: `web-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
        ExternalCourseID: `WEB-2K25-${Math.floor(1000 + Math.random() * 9000)}`,
        CourseName: item.CourseName || `PGA 2K25 Web Course ${idx + 1}`,
        CreatorName: item.CreatorName || 'Community Designer',
        SourceType: item.SourceType === 'Official' ? 'Official' : 'User Created',
        CourseType: item.CourseType || 'Championship',
        Country: item.Country || 'United States',
        Region: item.Region || '',
        City: item.City || '',
        LocationText: item.LocationText || (item.Country ? `${item.Country}` : 'Global'),
        Latitude: null,
        Longitude: null,
        CourseYardage: yardage,
        CourseYardageUnit: 'yards',
        Difficulty: difficulty,
        DifficultyTier: diffTier,
        CommunityRating: Number(item.CommunityRating) || 4.8,
        ReviewCount: Number(item.ReviewCount) || 120,
        Description: item.Description || 'Course discovered via PGA TOUR 2K25 web search.',
        NumberOfHoles: Number(item.NumberOfHoles) || 18,
        Par: Number(item.Par) || 72,
        CourseImagePath: '',
        CourseImageURL: createSvgDataUrl(
          item.CourseName || 'PGA 2K25 Course',
          `${item.LocationText || ''} · ${yardage.toLocaleString()} yds`,
          '#38bdf8',
          '#143322'
        ),
        CourseURL: item.SourceUrl || '',
        CourseTags: Array.isArray(item.CourseTags) ? item.CourseTags : ['Live Web Result'],
        CreatedDate: new Date().toISOString().slice(0, 10),
        UpdatedDate: new Date().toISOString().slice(0, 10),
        LastRetrievedDate: new Date().toISOString(),
        IsFavourite: false,
        IsSaved: false,
        WebSource: {
          title: item.WebSourceTitle || 'Web Search Result',
          url: item.SourceUrl || (citations[0]?.url || '')
        }
      };
    });

    return res.json({
      courses: mappedCourses.length > 0 ? mappedCourses : WEB_FALLBACK_COURSES,
      citations,
      queryUsed: searchQuery
    });
  } catch (error: any) {
    console.error('Error during web search:', error);
    // Return fallback rather than hard 500 so UI continues working
    return res.status(200).json({
      courses: WEB_FALLBACK_COURSES.map((item, idx) => ({
        CourseID: `web-fallback-${idx}`,
        ExternalCourseID: `WEB-2K25-${2000 + idx}`,
        CourseName: item.CourseName,
        CreatorName: item.CreatorName,
        SourceType: item.SourceType as any,
        CourseType: item.CourseType as any,
        Country: item.Country,
        Region: item.Region,
        City: item.City,
        LocationText: item.LocationText,
        Latitude: null,
        Longitude: null,
        CourseYardage: item.CourseYardage,
        CourseYardageUnit: 'yards',
        Difficulty: item.Difficulty,
        DifficultyTier: item.DifficultyTier as any,
        CommunityRating: item.CommunityRating,
        ReviewCount: item.ReviewCount,
        Description: item.Description,
        NumberOfHoles: item.NumberOfHoles,
        Par: item.Par,
        CourseImagePath: '',
        CourseImageURL: createSvgDataUrl(item.CourseName, `${item.LocationText} · ${item.CourseYardage.toLocaleString()} yds`, '#38bdf8', '#163121'),
        CourseURL: item.SourceUrl,
        CourseTags: item.CourseTags,
        CreatedDate: new Date().toISOString().slice(0, 10),
        UpdatedDate: new Date().toISOString().slice(0, 10),
        LastRetrievedDate: new Date().toISOString(),
        IsFavourite: false,
        IsSaved: false,
        WebSource: {
          title: item.WebSourceTitle,
          url: item.SourceUrl
        }
      })),
      citations: [],
      error: error.message,
      queryUsed: query
    });
  }
});

async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`PGA TOUR 2K25 Course Explorer Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
