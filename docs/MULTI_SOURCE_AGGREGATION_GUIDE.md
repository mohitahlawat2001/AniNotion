# Multi-Source Episode Aggregation Guide

## Overview

The AniNotion scraping system now **automatically aggregates episodes from multiple anime sites**. When the same anime episode is found on different sites, the system intelligently merges them into a single episode entry with multiple source options.

## 🎯 How It Works

### Automatic Episode Matching

When scraping from different sites:

1. **Site A scrapes**: "One Piece Episode 1100" → Creates episode with Site A as primary source
2. **Site B scrapes**: "One Piece Episode 1100" → Detects existing episode, adds Site B as additional source
3. **Site C scrapes**: "One Piece Episode 1100" → Adds Site C as another source

Result: **One episode with 3 watch sources**

### Database Schema

Each episode stores:
- **Primary Source**: The first source that was scraped
- **Additional Sources**: All subsequently discovered sources
- Each source includes: website name, watch URL, quality, subtitles, dubbed status

## 📊 User Experience

### Episode Cards

Episode cards now show:
- **Single Source**: "Watch Now" button → Direct watch link
- **Multiple Sources**: "Choose Source (N)" button → Links to episode detail page

### Episode Detail Page

New page at `/anime/:animeName/episode/:episodeNumber` shows:
- **All available sources** for the episode
- **Source comparison**: Quality, subtitles, dubbed/subbed
- **One-click watch** for any source
- **Quick navigation** to previous/next episodes

## 🔧 API Endpoints

### Get Episode Details with All Sources

```bash
GET /api/anime/:animeName/episodes/:episodeNumber
```

**Example:**
```bash
curl http://localhost:5001/api/anime/one-piece/episodes/1100
```

**Response:**
```json
{
  "success": true,
  "data": {
    "episode": {
      "number": 1100,
      "title": "The Ultimate Power",
      "thumbnail": "https://...",
      "isComplete": true,
      "isNew": false,
      "views": 1523
    },
    "anime": {
      "name": "One Piece",
      "slug": "one-piece",
      "coverImage": "https://...",
      "status": "ongoing"
    },
    "sources": [
      {
        "id": "primary",
        "isPrimary": true,
        "website": "animepahe",
        "watchUrl": "https://animepahe.com/play/...",
        "quality": "1080p",
        "subtitles": ["English"],
        "dubbed": false,
        "scrapedAt": "2025-03-15T10:30:00.000Z"
      },
      {
        "id": "source-0",
        "isPrimary": false,
        "website": "gogoanime",
        "watchUrl": "https://gogoanime.com/watch/...",
        "quality": "720p",
        "subtitles": ["English", "Spanish"],
        "dubbed": true,
        "scrapedAt": "2025-03-15T11:00:00.000Z"
      },
      {
        "id": "source-1",
        "isPrimary": false,
        "website": "animekai",
        "watchUrl": "https://animekai.to/watch/...",
        "quality": "1080p",
        "subtitles": ["English"],
        "dubbed": false,
        "scrapedAt": "2025-03-15T11:30:00.000Z"
      }
    ],
    "sourceCount": 3
  }
}
```

### Get Episodes with Source Counts

```bash
GET /api/anime/:animeName/episodes-with-sources
```

**Example:**
```bash
curl http://localhost:5001/api/anime/one-piece/episodes-with-sources?page=1&limit=20
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "episodeNumber": 1100,
      "thumbnailUrl": "https://...",
      "sourceCount": 3,
      "hasMultipleSources": true,
      ...
    },
    {
      "episodeNumber": 1099,
      "thumbnailUrl": "https://...",
      "sourceCount": 1,
      "hasMultipleSources": false,
      ...
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1100,
    "hasMore": true
  }
}
```

## 🔄 Scraping Flow

### Enhanced Scraping Service

The `enhancedScrapingService.js` handles source aggregation:

```javascript
async _findOrCreateEpisode(episodeData, anime, config) {
  const episode = await Episode.findOne({
    anime: anime._id,
    episodeNumber: episodeData.episodeNumber
  });
  
  if (!episode) {
    // Create new episode with primary source
    return await Episode.create({
      anime: anime._id,
      episodeNumber: episodeData.episodeNumber,
      primarySource: {
        website: config.sourceWebsite,
        watchUrl: episodeData.watchUrl,
        ...
      }
    });
  } else {
    // Episode exists - add as additional source
    episode.addSource({
      website: config.sourceWebsite,
      watchUrl: episodeData.watchUrl,
      ...
    });
    
    return await episode.save();
  }
}
```

### Multi-Site Scraping Example

```javascript
const scrapingService = require('./services/scrapingService');

// Scrape multiple sites for the same anime
const sites = [
  'https://animepahe.com',
  'https://gogoanime.com',
  'https://animekai.to'
];

for (const url of sites) {
  await scrapingService.quickScrapeAndSave(url, {
    maxReleases: 50
  });
  
  // Wait between requests
  await new Promise(resolve => setTimeout(resolve, 3000));
}

// Result: Episodes automatically aggregated by anime name + episode number
```

## 🎨 Frontend Implementation

### Route Configuration

```javascript
// App.jsx
<Route 
  path="/anime/:animeName/episode/:episodeNumber" 
  element={<EpisodeDetailPage />} 
/>
```

### Episode Card Logic

```javascript
// EpisodeCard.jsx
const hasMultipleSources = episode.additionalSources?.length > 0;
const totalSources = 1 + (episode.additionalSources?.length || 0);

{hasMultipleSources ? (
  // Multiple sources - Link to detail page
  <button onClick={handleEpisodeClick}>
    <Tv /> Choose Source ({totalSources})
  </button>
) : (
  // Single source - Direct watch
  <button onClick={() => handleWatch(primaryWatchUrl)}>
    <Play /> Watch Now
  </button>
)}
```

### Episode Detail Page

```javascript
// EpisodeDetailPage.jsx
const [selectedSource, setSelectedSource] = useState(null);

// Display all sources
{sources.map(source => (
  <SourceCard
    source={source}
    selected={selectedSource?.id === source.id}
    onClick={() => setSelectedSource(source)}
    onWatch={() => handleWatchNow(source)}
  />
))}
```

## 🚀 Usage Scenarios

### Scenario 1: User Prefers Specific Site

```
1. User browses anime releases
2. Sees "One Piece Ep 1100" with "Choose Source (3)"
3. Clicks → Goes to episode detail page
4. Sees AnimePahe, GogoAnime, AnimeKai options
5. Selects preferred site (e.g., GogoAnime for dubbed)
6. Clicks "Watch on GogoAnime"
```

### Scenario 2: Fallback When Site is Down

```
1. User tries AnimePahe → Site is down
2. Returns to episode detail page
3. Tries GogoAnime → Works!
4. Continues watching
```

### Scenario 3: Quality/Subtitle Preference

```
1. User wants 1080p with Spanish subs
2. Checks episode detail page
3. Compares sources:
   - AnimePahe: 1080p, English only
   - GogoAnime: 720p, English + Spanish
   - AnimeKai: 1080p, English + Spanish ✓
4. Selects AnimeKai
```

## 📈 Benefits

### For Users
- ✅ **Choice**: Pick their preferred anime site
- ✅ **Reliability**: Fallback if one site is down
- ✅ **Quality**: Compare quality/subtitles across sources
- ✅ **Convenience**: All sources in one place

### For Admins
- ✅ **Deduplicated Data**: No duplicate episodes
- ✅ **Comprehensive Coverage**: Multiple sources = better reliability
- ✅ **Source Tracking**: Know which sites have which episodes
- ✅ **Analytics**: Track which sources users prefer

## 🔧 Configuration

### Enable Multi-Site Scraping

```javascript
// Create configs for multiple sites
const sites = [
  { url: 'https://animepahe.com', name: 'AnimePahe Daily' },
  { url: 'https://gogoanime.com', name: 'GogoAnime Hourly' },
  { url: 'https://animekai.to', name: 'AnimeKai Daily' }
];

for (const site of sites) {
  await scrapingService.createConfigFromUrl(site.url, site.name);
}

// Schedule scraping for all active configs
await scrapingService.scrapeAllActiveConfigs();
```

### Episode Model Methods

```javascript
// Add a new source to an episode
episode.addSource({
  website: 'animekai',
  watchUrl: 'https://animekai.to/watch/...',
  quality: '1080p',
  subtitles: ['English', 'Spanish'],
  dubbed: false
});

await episode.save();
```

## 🎯 Best Practices

### 1. Scrape Multiple Sites Regularly

```javascript
// Schedule daily scraping from 3 sites
cron.schedule('0 6 * * *', async () => {
  await scrapingService.scrapeAllActiveConfigs();
});
```

### 2. Prioritize Quality Sources

The first scraped source becomes the primary source. Scrape high-quality sites first:
1. AnimePahe (high quality, good reliability)
2. GogoAnime (dubbed options)
3. AnimeKai (fast updates)

### 3. Handle Source Failures Gracefully

```javascript
// Frontend - Try next source if one fails
const handleWatch = (source) => {
  window.open(source.watchUrl, '_blank');
  
  // Track failed sources
  trackSourceAttempt(source.website);
};
```

### 4. Display Source Metadata

Always show:
- Website name (capitalize for branding)
- Quality (720p, 1080p, etc.)
- Audio type (Dubbed/Subbed)
- Available subtitles
- When the source was added

## 🐛 Troubleshooting

### Issue: Duplicate Episodes Not Merging

**Symptom**: Same episode appears multiple times

**Cause**: Anime name mismatch (e.g., "One Piece" vs "OnePiece")

**Solution**: Normalize anime names during scraping

```javascript
function normalizeAnimeName(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-');
}
```

### Issue: Sources Not Showing on Detail Page

**Symptom**: Episode detail page shows 0 sources

**Cause**: Episode not populated with sources

**Solution**: Check API response includes all sources

```javascript
// Backend - Ensure additionalSources are included
const episode = await Episode.findOne({...})
  .populate('anime', 'name slug coverImage')
  .lean(); // Important: .lean() includes all fields
```

### Issue: Wrong Primary Source

**Symptom**: Low-quality source set as primary

**Solution**: Scrape preferred sites first, or manually update:

```javascript
// Manually set preferred source as primary
const episode = await Episode.findById(episodeId);

// Swap primary with an additional source
const betterSource = episode.additionalSources[0];
episode.additionalSources[0] = episode.primarySource;
episode.primarySource = betterSource;

await episode.save();
```

## 📊 Analytics

### Track Source Popularity

```javascript
// Track which sources users click
app.post('/api/episodes/:id/track-source', async (req, res) => {
  const { sourceWebsite } = req.body;
  
  await Analytics.create({
    type: 'source_click',
    episodeId: req.params.id,
    sourceWebsite,
    timestamp: new Date()
  });
});
```

### Query Source Statistics

```javascript
// Find most popular sources
const stats = await Analytics.aggregate([
  { $match: { type: 'source_click' } },
  { $group: {
      _id: '$sourceWebsite',
      clicks: { $sum: 1 }
    }
  },
  { $sort: { clicks: -1 } }
]);

// Result: [{ _id: 'gogoanime', clicks: 1523 }, ...]
```

## 🔮 Future Enhancements

### Planned Features

1. **Source Quality Ratings**: Users rate source quality
2. **Auto Source Selection**: AI picks best source for user
3. **Source Health Monitoring**: Track uptime/downtime
4. **Smart Fallback**: Auto-try next source if first fails
5. **Source Preferences**: Remember user's preferred sites
6. **Batch Source Updates**: Update multiple episodes at once

### Potential Improvements

```javascript
// User source preferences
const userPrefs = {
  preferredSites: ['animepahe', 'gogoanime'],
  preferredQuality: '1080p',
  preferredAudio: 'subbed',
  preferredSubtitles: ['English']
};

// Filter and sort sources by preferences
function getSortedSources(episode, userPrefs) {
  return episode.sources
    .filter(s => matchesPreferences(s, userPrefs))
    .sort((a, b) => scoreSource(b, userPrefs) - scoreSource(a, userPrefs));
}
```

## 📝 Summary

The multi-source episode aggregation system:
- ✅ **Automatically merges** duplicate episodes from different sites
- ✅ **Provides user choice** of which site to watch from
- ✅ **Ensures reliability** with fallback options
- ✅ **Enhances UX** with source comparison
- ✅ **Maintains data integrity** with deduplication
- ✅ **Scales easily** as more sites are added

Users get the best of all worlds: comprehensive coverage, reliable access, and freedom of choice!

---

**Ready to use?** Just scrape multiple anime sites and watch the aggregation happen automatically! 🚀
