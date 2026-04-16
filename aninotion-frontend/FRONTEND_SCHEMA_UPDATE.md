# Frontend Updates for New Schema

## Overview

Updated the frontend to support both legacy `AnimeRelease` schema and new normalized `Anime + Episode` schema with seamless switching.

## Files Created/Modified

### New Services

#### 1. `services/animeService.js`
API client for anime-related endpoints:
- `getAllAnime(params)` - Get all anime with pagination
- `getAnimeById(id)` - Get single anime with episodes
- `searchAnime(query, limit)` - Search anime by name
- `getStats(userId)` - Get statistics

#### 2. `services/episodeService.js`
API client for episode-related endpoints:
- `getAllEpisodes(params)` - Get all episodes with filters
- `getEpisodeById(id)` - Get single episode details
- `getEpisodesByAnime(animeId, params)` - Get episodes for specific anime
- `getUnseenEpisodes(userId, params)` - Get user's unseen episodes
- `markAsSeen(episodeId, userId)` - Mark episode as seen
- `getEpisodesForPosts(limit)` - Get episodes ready for post generation

### New Components

#### 3. `components/AnimeReleases/EpisodeCard.jsx`
Enhanced episode card component:
- Displays episode with anime reference
- Shows anime name, episode number, title
- Multi-source support with badge
- Watch button with click tracking
- Release time formatting
- View counter
- Complete/New badges
- Quality and subtitle info support

### Modified Components

#### 4. `components/AnimeReleases/NotificationSection.jsx`
Updated to support both schemas:
- `useNewSchema` prop to toggle between old/new API
- Conditional API calls based on schema
- Dynamic component rendering (AnimeReleaseCard vs EpisodeCard)
- Unified pagination and filtering
- Stats fetching from appropriate endpoint

#### 5. `pages/AnimeReleasesPage.jsx`
Added schema toggle:
- Toggle button to switch between schemas
- Visual indicator showing current schema
- Passes `useNewSchema` prop to NotificationSection

#### 6. `components/AnimeReleases/index.js`
Added exports:
- Exported `EpisodeCard` component

## Features

### Backward Compatibility
✅ Old schema (AnimeRelease) still works  
✅ New schema (Anime + Episode) fully supported  
✅ Toggle between schemas without code changes  
✅ Same UI/UX for both schemas

### Enhanced Episode Card
- **Multi-Source Display**: Shows number of available sources
- **Better Metadata**: Episode title, type, quality, views
- **Improved UX**: Smooth animations, better button layout
- **Click Tracking**: Automatically marks as seen when watching
- **Fallback Images**: Uses anime cover if episode thumbnail fails

### New Schema Benefits
- **Anime Reference**: Shows anime name clearly
- **Episode Grouping**: Can group by anime series
- **Source Tracking**: See which sites have the episode
- **View Analytics**: Track episode popularity
- **Post Integration**: Episodes ready for post generation

## Usage

### Legacy Schema (Default)
```jsx
<NotificationSection 
  currentUserId={userId}
  useNewSchema={false}  // or omit
/>
```

### New Schema
```jsx
<NotificationSection 
  currentUserId={userId}
  useNewSchema={true}
/>
```

## API Endpoints

### New Schema Endpoints

**Anime:**
```
GET /api/anime                    - List all anime
GET /api/anime/search?q={query}   - Search anime
GET /api/anime/:id                - Get anime with episodes
```

**Episodes:**
```
GET /api/episodes                 - List all episodes
GET /api/episodes?animeId={id}    - Filter by anime
GET /api/episodes?isNew=true      - Only new episodes
GET /api/episodes/unseen          - User's unseen episodes
GET /api/episodes/:id             - Single episode
POST /api/episodes/:id/seen       - Mark as seen
```

**Stats:**
```
GET /api/stats?userId={id}        - Get statistics
```

### Legacy Schema Endpoints (Still Supported)

```
GET /api/anime-releases           - List all releases
GET /api/anime-releases/unseen    - User's unseen
GET /api/anime-releases/:id       - Single release
POST /api/anime-releases/mark-seen - Mark as seen
GET /api/anime-releases/stats     - Get statistics
```

## Migration Path

### Phase 1: Testing (Current)
- Both schemas work side-by-side
- Toggle available for testing
- No data migration required yet

### Phase 2: Data Migration
```bash
# In backend
cd scraping-notification-backend
node scripts/migrateToNewSchema.js migrate
node scripts/migrateToNewSchema.js verify
```

### Phase 3: Switch Default
```jsx
// In AnimeReleasesPage.jsx
const [useNewSchema, setUseNewSchema] = useState(true); // Change to true
```

### Phase 4: Production
- Remove toggle UI
- Use new schema exclusively
- Optionally remove old AnimeRelease endpoints

## Component Props

### NotificationSection

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| currentUserId | String | undefined | Current user ID for personalization |
| useNewSchema | Boolean | false | Use new schema (Anime + Episode) |

### EpisodeCard

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| episode | Object | Yes | Episode object with populated anime |
| onMarkAsSeen | Function | No | Callback when episode is watched |
| currentUserId | String | No | Current user ID |

### AnimeReleaseCard (Legacy)

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| release | Object | Yes | AnimeRelease object |
| onMarkAsSeen | Function | No | Callback when release is watched |
| currentUserId | String | No | Current user ID |

## Episode Object Structure

```javascript
{
  _id: "episode_id",
  anime: {                        // Populated
    _id: "anime_id",
    name: "One Piece",
    coverImage: "https://...",
    status: "ongoing"
  },
  episodeNumber: 1100,
  episodeTitle: "Luffy's Dream",
  type: "regular",               // "regular" | "special" | "ova" | "movie"
  thumbnailUrl: "https://...",
  screenshotUrls: ["https://..."],
  description: "...",
  duration: 24,
  airDate: "2024-01-15",
  
  primarySource: {
    website: "animepahe",
    url: "https://...",
    watchUrl: "https://...",
    dataId: "abc123",
    quality: "1080p",
    subtitles: ["English"],
    dubbed: false
  },
  
  additionalSources: [
    {
      website: "othersite",
      watchUrl: "https://...",
      quality: "720p",
      ...
    }
  ],
  
  isComplete: false,
  isNew: true,
  releaseDate: "2024-01-15T10:00:00Z",
  seenBy: ["user_id"],
  views: 1250,
  
  createdAt: "2024-01-15T10:00:00Z",
  updatedAt: "2024-01-15T10:00:00Z"
}
```

## Environment Variables

No new environment variables needed. Uses existing:

```env
VITE_SCRAPING_API_URL=https://...5001.app.github.dev/api
```

## Testing

### Test New Schema Locally

1. **Start Backend**:
```bash
cd scraping-notification-backend
npm start
```

2. **Add New Routes** (if not already added):
```javascript
// server.js
const animeRoutes = require('./routes/anime');
app.use('/api', animeRoutes);
```

3. **Run Migration** (optional, to test with real data):
```bash
node scripts/migrateToNewSchema.js migrate
```

4. **Start Frontend**:
```bash
cd aninotion-frontend
npm run dev
```

5. **Toggle Schema**:
- Visit `/anime-releases`
- Click "Switch to New Schema" button
- Verify episodes load correctly

### Test Cases

- [ ] Legacy schema loads releases
- [ ] New schema loads episodes with anime names
- [ ] Toggle switches between schemas
- [ ] Pagination works in both schemas
- [ ] Mark as seen works in both schemas
- [ ] Stats update correctly
- [ ] Filter (new only) works
- [ ] Multi-source badge shows when applicable
- [ ] Episode card shows all metadata
- [ ] Watch button opens correct URL

## Future Enhancements

### Planned Features
1. **Anime Details Page**: Click anime name to see all episodes
2. **Source Selector Modal**: Choose from multiple sources
3. **Watch Progress**: Track watched episodes per anime
4. **Anime Search**: Dedicated search page
5. **Favorites/Watchlist**: Save favorite anime
6. **Notifications**: Real-time updates for new episodes
7. **Quality Filter**: Filter by video quality
8. **Sub/Dub Toggle**: Filter by subtitle/dub preference

### Component Ideas
- `AnimeDetailsPage.jsx` - Full anime page with all episodes
- `SourceSelectorModal.jsx` - Choose episode source
- `AnimeSearchPage.jsx` - Search and filter anime
- `WatchlistPage.jsx` - User's watchlist
- `EpisodePlayerModal.jsx` - In-app video player

## Troubleshooting

### Episodes not loading
- Check backend is running on port 5001
- Verify `/api/episodes` endpoint works: `curl http://localhost:5001/api/episodes`
- Check browser console for errors
- Ensure migration was run if using new schema

### Toggle not working
- Clear browser cache
- Check React state updates in dev tools
- Verify `useNewSchema` prop is passed correctly

### Missing anime names
- Ensure episodes are populated: check API response
- Run migration if data not in new schema
- Check `populate('anime', 'name coverImage')` in backend

### Images not loading
- Check CORS settings on image hosts
- Verify image URLs are absolute, not relative
- Check fallback to anime cover is working

## Documentation Links

- **Backend Schema**: `/scraping-notification-backend/SCHEMA_MIGRATION_GUIDE.md`
- **Quick Start**: `/scraping-notification-backend/SCHEMA_QUICKSTART.md`
- **API Routes**: `/scraping-notification-backend/routes/anime.js`
- **Models**: `/scraping-notification-backend/models/`

---

**Last Updated**: 2026-04-02  
**Status**: Ready for testing  
**Next Step**: Run migration and test with real data
