# Database Schema Migration Guide

## Overview

This document describes the migration from the flat `AnimeRelease` schema to a normalized `Anime` + `Episode` schema for better data organization and post generation capabilities.

## Why Migrate?

### Problems with Old Schema
- ❌ **Data duplication**: Anime name repeated for every episode
- ❌ **No anime-level metadata**: Can't store series information
- ❌ **Source tracking limited**: Hard to track multiple sources per episode
- ❌ **Post generation difficult**: No structured data for creating posts
- ❌ **Queries inefficient**: Can't easily get all episodes for an anime

### Benefits of New Schema
- ✅ **Normalized data**: Anime info stored once, episodes reference it
- ✅ **Rich metadata**: Store anime descriptions, genres, images
- ✅ **Multi-source support**: Track multiple sources per anime/episode
- ✅ **Post-ready data**: Pre-generated post metadata
- ✅ **Better queries**: Efficient anime→episodes lookups
- ✅ **Scalable**: Easier to add new features

## New Schema Structure

### Anime Collection

Stores master anime series information:

```javascript
{
  _id: ObjectId,
  name: String,                    // "One Piece"
  alternativeTitles: [String],     // ["ワンピース"]
  description: String,
  coverImage: String,              // Main poster/cover
  bannerImage: String,             // Header banner
  genres: [String],                // ["Action", "Adventure"]
  tags: [String],                  // ["Shounen", "Pirates"]
  status: String,                  // "ongoing" | "completed" | "upcoming"
  totalEpisodes: Number,           // null if ongoing
  
  // External IDs
  externalIds: {
    mal: String,                   // MyAnimeList ID
    anilist: String,               // AniList ID
    custom: String                 // From scraping site
  },
  
  // Source tracking
  primarySource: {
    website: "animepahe",
    url: "https://animepahe.com/anime/one-piece",
    scrapedAt: Date
  },
  additionalSources: [
    {
      website: "othersite",
      url: "...",
      dataId: "...",
      scrapedAt: Date
    }
  ],
  
  // Computed fields
  latestEpisodeNumber: 1100,
  episodeCount: 1100,
  
  // Post generation
  postGenerated: false,
  lastPostGeneratedAt: Date,
  postTemplate: "anime-release",
  
  createdAt: Date,
  updatedAt: Date
}
```

### Episode Collection

Stores individual episode information:

```javascript
{
  _id: ObjectId,
  anime: ObjectId,                 // Reference to Anime
  episodeNumber: 1100,
  episodeTitle: "Luffy's Dream",
  type: String,                    // "regular" | "special" | "ova" | "movie"
  
  // Visual content
  thumbnailUrl: String,
  screenshotUrls: [String],
  
  // Episode metadata
  description: String,
  duration: 24,                    // minutes
  airDate: Date,
  
  // Primary source
  primarySource: {
    website: "animepahe",
    url: "https://animepahe.com/anime/one-piece",
    watchUrl: "https://animepahe.com/play/...",
    dataId: "abc123",
    quality: "1080p",
    subtitles: ["English", "Spanish"],
    dubbed: false,
    scrapedAt: Date
  },
  
  // Additional sources
  additionalSources: [
    {
      website: "othersite",
      watchUrl: "...",
      quality: "720p",
      ...
    }
  ],
  
  // Status
  isComplete: false,
  isNew: true,
  releaseDate: Date,
  
  // User tracking
  seenBy: [ObjectId],              // User IDs
  views: 0,
  
  // Post generation
  postGenerated: false,
  generatedPostId: ObjectId,       // Reference to Post
  postGeneratedAt: Date,
  
  // Post metadata (auto-generated)
  postMetadata: {
    title: "One Piece - Episode 1100: Luffy's Dream",
    excerpt: "Watch One Piece Episode 1100 online now!",
    content: "<h2>...</h2>",       // Full HTML content
    images: [String],               // Images for post
    tags: ["anime", "one-piece", "episode-1100"],
    category: "anime-release"
  },
  
  createdAt: Date,
  updatedAt: Date
}
```

## Migration Process

### Step 1: Backup Current Data

```bash
# Backup AnimeRelease collection
mongodump --uri="mongodb://localhost:27017/aninotion" --collection=animereleases --out=backup/
```

### Step 2: Run Migration

```bash
cd scraping-notification-backend
node scripts/migrateToNewSchema.js migrate
```

**What the migration does:**
1. Groups `AnimeRelease` records by anime name
2. Creates one `Anime` document per unique anime
3. Creates one `Episode` document per release
4. Links episodes to their anime via `anime` field
5. Preserves all source information
6. Auto-generates post metadata

### Step 3: Verify Migration

```bash
node scripts/migrateToNewSchema.js verify
```

**Verification checks:**
- Count of original releases matches episodes created
- No orphaned episodes (episodes without anime)
- Sample data integrity checks

### Step 4: Test New API

```bash
# Get all anime
curl http://localhost:5001/api/anime

# Get anime with episodes
curl http://localhost:5001/api/anime/{animeId}

# Get all episodes
curl http://localhost:5001/api/episodes

# Get episodes for specific anime
curl http://localhost:5001/api/episodes?animeId={animeId}

# Get new episodes only
curl http://localhost:5001/api/episodes?isNew=true

# Get unseen episodes for user
curl http://localhost:5001/api/episodes/unseen?userId={userId}
```

### Step 5: Update Frontend

Update frontend services to use new API endpoints:

```javascript
// Old
animeReleaseService.getAnimeReleases()

// New
animeService.getAllAnime()
animeService.getAnimeById(id)
episodeService.getAllEpisodes()
episodeService.getEpisodesByAnime(animeId)
```

### Step 6: Optional - Remove Old Schema

Once verified, you can optionally drop the old collection:

```bash
# Only do this after thorough testing!
mongosh aninotion --eval "db.animereleases.drop()"
```

## API Endpoints

### Anime Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/anime` | Get all anime (paginated) |
| GET | `/api/anime/search?q={query}` | Search anime by name |
| GET | `/api/anime/:id` | Get anime with episodes |

### Episode Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/episodes` | Get all episodes (paginated) |
| GET | `/api/episodes?animeId={id}` | Get episodes for anime |
| GET | `/api/episodes?isNew=true` | Get new episodes only |
| GET | `/api/episodes/unseen?userId={id}` | Get unseen episodes for user |
| GET | `/api/episodes/:id` | Get single episode |
| POST | `/api/episodes/:id/seen` | Mark episode as seen |
| GET | `/api/episodes/for-posts` | Get episodes ready for post generation |

### Stats Endpoint

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/stats?userId={id}` | Get statistics |

## Updated Scraping Service

The enhanced scraping service (`enhancedScrapingService.js`) now:

1. **Finds or creates Anime** for each scraped series
2. **Creates Episodes** linked to the anime
3. **Tracks multiple sources** for same anime/episode
4. **Auto-generates post metadata** for each episode
5. **Maintains backward compatibility** (optional)

### Using Enhanced Service

```javascript
const enhancedScrapingService = require('./services/enhancedScrapingService');

// Save single episode
const result = await enhancedScrapingService.saveEpisode(episodeData, config);
// Returns: { anime, episode, isNew }

// Save multiple episodes
const results = await enhancedScrapingService.saveEpisodes(episodesArray, config);
// Returns: { saved, updated, duplicates, errors, episodes }

// Get episodes ready for post generation
const episodes = await enhancedScrapingService.getEpisodesForPostGeneration(10);
```

## Post Generation Workflow

### Automatic Post Metadata

Each episode automatically generates structured post data:

```javascript
episode.postMetadata = {
  title: "One Piece - Episode 1100: Luffy's Dream",
  excerpt: "Watch One Piece Episode 1100 online now!",
  content: "<h2>One Piece - Episode 1100</h2><p>...</p>",
  images: ["thumbnail.jpg", "screenshot1.jpg"],
  tags: ["anime", "one-piece", "episode-1100"],
  category: "anime-release"
};
```

### Creating Posts from Episodes

```javascript
// Get episodes ready for posts
const episodes = await Episode.findUngenerated(10);

for (const episode of episodes) {
  // Create post using episode.postMetadata
  const post = await Post.create({
    title: episode.postMetadata.title,
    content: episode.postMetadata.content,
    excerpt: episode.postMetadata.excerpt,
    images: episode.postMetadata.images,
    tags: episode.postMetadata.tags,
    category: episode.postMetadata.category,
    // ... other post fields
  });
  
  // Mark as generated
  episode.postGenerated = true;
  episode.generatedPostId = post._id;
  await episode.save();
}
```

## Rollback

If you need to rollback (remove new schema, keep old):

```bash
node scripts/migrateToNewSchema.js rollback
```

**⚠️ Warning**: This deletes all `Anime` and `Episode` documents but preserves `AnimeRelease` data.

## Performance Considerations

### Indexes

The new schema includes optimized indexes:

**Anime**:
- `name` (unique)
- `status`
- `latestEpisodeNumber`
- `updatedAt`
- Text search on `name` and `alternativeTitles`

**Episode**:
- `anime` + `episodeNumber` (compound unique)
- `anime` + `releaseDate` (compound)
- `isNew` + `releaseDate` (compound)
- `primarySource.website` + `primarySource.dataId`
- `postGenerated` + `isNew`

### Query Patterns

```javascript
// Efficient: Get anime with all episodes
const anime = await Anime.findById(animeId);
const episodes = await Episode.find({ anime: animeId }).sort({ episodeNumber: 1 });

// Efficient: Get latest episodes across all anime
const latestEpisodes = await Episode.find({ isNew: true })
  .populate('anime', 'name coverImage')
  .sort({ releaseDate: -1 })
  .limit(20);

// Efficient: Search anime
const results = await Anime.find({ $text: { $search: 'naruto' } });
```

## Backward Compatibility

To maintain backward compatibility with existing frontend:

1. **Keep `AnimeRelease` collection** temporarily
2. **Enable dual-write** in config:
   ```javascript
   config.maintainLegacySchema = true;
   ```
3. **Use adapter** to convert new schema to old format:
   ```javascript
   const legacyFormat = episode.toLegacyFormat(anime);
   ```

## Troubleshooting

### Migration fails with duplicate key error

**Problem**: Anime names with slight variations treated as different

**Solution**: Normalize anime names before migration or merge manually

### Episodes not linking to anime

**Problem**: Orphaned episodes

**Solution**: Run verification and check console output for issues

### Post metadata not generating

**Problem**: `generatePostMetadata()` not called

**Solution**: Manually regenerate:
```javascript
const episodes = await Episode.find({ postMetadata: null });
for (const ep of episodes) {
  const anime = await Anime.findById(ep.anime);
  await ep.generatePostMetadata(anime.name);
}
```

## Future Enhancements

Potential additions to the schema:

1. **Anime Relations**: Link related anime (prequels, sequels)
2. **Character Database**: Store character information
3. **Studio Information**: Track animation studios
4. **User Watch Lists**: Track user's watching progress
5. **Ratings & Reviews**: User-generated content
6. **Streaming Sources**: Automatic source discovery
7. **Quality Preferences**: User-preferred quality settings

---

**Last Updated**: 2026-04-02  
**Version**: 2.0  
**Status**: Ready for production use
