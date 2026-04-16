# Robust Database Schema - Quick Start

## Overview

✅ **New normalized database schema with Anime + Episode collections**  
✅ **Multi-source tracking for each anime and episode**  
✅ **Auto-generated post metadata for easy content creation**  
✅ **Backward compatible with existing AnimeRelease schema**

## New Collections

### 1. Anime (Master Data)
- One document per anime series
- Stores: name, description, cover, genres, tags, status
- Tracks: multiple sources, episode counts, post generation status
- **Relations**: One-to-many with Episodes

### 2. Episode (Episode Data)
- One document per episode
- References parent Anime
- Stores: episode number, title, thumbnails, watch links
- Tracks: multiple sources per episode, user views, seen status
- **Auto-generates**: Post metadata (title, content, tags, images)

## Key Features

### Multi-Source Support
```javascript
// Each episode can have multiple sources
episode: {
  primarySource: {
    website: "animepahe",
    watchUrl: "https://...",
    quality: "1080p"
  },
  additionalSources: [
    { website: "othersite", watchUrl: "...", quality: "720p" },
    { website: "another", watchUrl: "...", quality: "1080p" }
  ]
}
```

### Post-Ready Metadata
```javascript
// Every episode has pre-generated post data
episode.postMetadata: {
  title: "One Piece - Episode 1100: Luffy's Dream",
  excerpt: "Watch One Piece Episode 1100 online now!",
  content: "<h2>...</h2><p>Full HTML content</p>",
  images: ["thumbnail.jpg", "screenshot1.jpg"],
  tags: ["anime", "one-piece", "episode-1100"],
  category: "anime-release"
}
```

## Quick Start

### 1. Run Migration

```bash
cd scraping-notification-backend

# Backup first (recommended)
mongodump --uri="mongodb://localhost:27017/aninotion" --out=backup/

# Run migration
node scripts/migrateToNewSchema.js migrate

# Verify
node scripts/migrateToNewSchema.js verify
```

### 2. Update server.js

Add new routes:

```javascript
const animeRoutes = require('./routes/anime');
app.use('/api', animeRoutes);
```

### 3. Test API

```bash
# Get all anime
curl http://localhost:5001/api/anime

# Get anime with episodes
curl http://localhost:5001/api/anime/{id}

# Get latest episodes
curl http://localhost:5001/api/episodes?isNew=true

# Get unseen episodes for user
curl http://localhost:5001/api/episodes/unseen?userId={userId}

# Get episodes ready for post creation
curl http://localhost:5001/api/episodes/for-posts
```

## Using Enhanced Scraping Service

```javascript
const enhancedScrapingService = require('./services/enhancedScrapingService');

// Save scraped episode (auto-creates anime if needed)
const result = await enhancedScrapingService.saveEpisode({
  animeName: "One Piece",
  episodeNumber: 1100,
  thumbnailUrl: "https://...",
  watchUrl: "https://...",
  animePageUrl: "https://...",
  dataId: "abc123"
}, config);

// Result: { anime, episode, isNew }
```

## Creating Posts from Episodes

```javascript
// Get episodes that need posts
const episodes = await Episode.findUngenerated(10);

for (const episode of episodes) {
  await episode.populate('anime');
  
  // Create post using pre-generated metadata
  const post = await Post.create({
    title: episode.postMetadata.title,
    content: episode.postMetadata.content,
    excerpt: episode.postMetadata.excerpt,
    images: episode.postMetadata.images,
    tags: episode.postMetadata.tags,
    category: episode.postMetadata.category
  });
  
  // Mark episode as posted
  await enhancedScrapingService.markPostGenerated(episode._id, post._id);
}
```

## API Endpoints

### Anime
- `GET /api/anime` - List all anime (paginated)
- `GET /api/anime/search?q={query}` - Search anime
- `GET /api/anime/:id` - Get anime with episodes
- `GET /api/stats` - Get statistics

### Episodes
- `GET /api/episodes` - List all episodes (paginated)
- `GET /api/episodes?animeId={id}` - Filter by anime
- `GET /api/episodes?isNew=true` - Only new episodes
- `GET /api/episodes/unseen?userId={id}` - Unseen by user
- `GET /api/episodes/:id` - Single episode details
- `POST /api/episodes/:id/seen` - Mark as seen
- `GET /api/episodes/for-posts` - Episodes needing posts

## Database Queries

```javascript
// Get anime with all episodes
const anime = await Anime.findById(id);
const episodes = await Episode.find({ anime: id }).sort({ episodeNumber: 1 });

// Get latest episodes across all anime
const latest = await Episode.find({ isNew: true })
  .populate('anime', 'name coverImage')
  .sort({ releaseDate: -1 })
  .limit(20);

// Search anime by name
const results = await Anime.find({ $text: { $search: 'naruto' } });

// Get anime with most episodes
const popular = await Anime.find().sort({ episodeCount: -1 }).limit(10);
```

## Models & Methods

### Anime Model Methods

```javascript
anime.addSource(source)           // Add additional source
anime.updateEpisodeCount()        // Recalculate episode counts
```

### Episode Model Methods

```javascript
episode.addSource(source)                    // Add additional source
episode.markAsSeen(userId)                   // Mark as seen by user
episode.generatePostMetadata(animeName)      // Generate post data
Episode.findByAnime(animeId, options)        // Static: Find by anime
Episode.findUngenerated(limit)               // Static: Episodes needing posts
```

## Benefits Over Old Schema

| Feature | Old Schema | New Schema |
|---------|------------|------------|
| **Data Structure** | Flat | Normalized |
| **Anime Info** | ❌ Repeated per episode | ✅ Stored once |
| **Multi-Source** | ❌ Single source only | ✅ Multiple sources |
| **Post Generation** | ❌ Manual | ✅ Auto-generated |
| **Queries** | ❌ Inefficient | ✅ Optimized indexes |
| **Scalability** | ❌ Limited | ✅ Highly scalable |
| **Relationships** | ❌ None | ✅ Anime ↔ Episodes |

## Rollback

If needed, you can rollback the migration:

```bash
node scripts/migrateToNewSchema.js rollback
```

This deletes Anime and Episode collections but keeps AnimeRelease intact.

## Files Created

```
scraping-notification-backend/
├── models/
│   ├── Anime.js                      # Anime master model
│   └── Episode.js                    # Episode model
├── services/
│   ├── enhancedScrapingService.js    # New scraping service
│   └── migrationService.js           # Migration utilities
├── controllers/
│   └── animeController.js            # API controllers
├── routes/
│   └── anime.js                      # API routes
├── scripts/
│   └── migrateToNewSchema.js         # Migration script
└── docs/
    ├── SCHEMA_MIGRATION_GUIDE.md     # Full documentation
    └── SCHEMA_QUICKSTART.md          # This file
```

## Next Steps

1. ✅ Run migration
2. ✅ Test API endpoints
3. ✅ Update frontend to use new endpoints
4. ✅ Integrate enhanced scraping service
5. ✅ Implement automatic post generation
6. ✅ Test post creation workflow
7. ⚡ Deploy to production

## Support

See detailed documentation:
- **SCHEMA_MIGRATION_GUIDE.md** - Complete migration guide
- **Anime.js** - Anime model comments
- **Episode.js** - Episode model comments
- **enhancedScrapingService.js** - Service usage examples

---

**Version**: 2.0  
**Date**: 2026-04-02  
**Status**: Ready for production
