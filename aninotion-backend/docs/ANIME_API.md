# Anime API Routes Documentation

This document describes the anime-related API endpoints that integrate with MyAnimeList API.

## Base URL
All anime endpoints are prefixed with `/api/anime`

## Authentication
These endpoints use client authentication with MyAnimeList API via the `X-MAL-CLIENT-ID` header, which is automatically handled by the server using the `MYANIME_LIST_CLIENT_ID` environment variable.

## Endpoints

### 1. Health Check
**GET** `/api/anime/health`

Checks the connection to MyAnimeList API and verifies configuration.

**Response:**
```json
{
  "success": true,
  "message": "MyAnimeList API connection is healthy",
  "clientIdConfigured": true
}
```

---

### 2. Search Anime
**GET** `/api/anime/search`

Search for anime by title or keywords.

**Query Parameters:**
- `q` (required): Search query
- `limit` (optional): Number of results (default: 100, max: 100)
- `offset` (optional): Offset for pagination (default: 0)
- `fields` (optional): Comma-separated list of fields to include

**Example:**
```bash
GET /api/anime/search?q=naruto&limit=5
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "node": {
        "id": 1735,
        "title": "Naruto: Shippuuden",
        "main_picture": {
          "medium": "https://cdn.myanimelist.net/images/anime/1565/111305.jpg",
          "large": "https://cdn.myanimelist.net/images/anime/1565/111305l.jpg"
        }
      }
    }
  ],
  "paging": {
    "next": "https://api.myanimelist.net/v2/anime?offset=5&q=naruto&limit=5"
  },
  "query": {
    "q": "naruto",
    "limit": 5,
    "offset": 0
  }
}
```

---

### 3. Get Anime Details
**GET** `/api/anime/details/:anime_id`

Get detailed information about a specific anime.

**Path Parameters:**
- `anime_id` (required): Numeric ID of the anime

**Query Parameters:**
- `fields` (optional): Comma-separated list of fields to include

**Example:**
```bash
GET /api/anime/details/1735
```

**Default Fields Included:**
- Basic info (id, title, main_picture, alternative_titles)
- Dates (start_date, end_date, created_at, updated_at)
- Stats (mean, rank, popularity, num_list_users, num_scoring_users)
- Details (synopsis, media_type, status, genres, num_episodes)
- Season info (start_season, broadcast, source, average_episode_duration, rating)
- Media (pictures, background)
- Related content (related_anime, related_manga, recommendations)
- Production (studios, statistics)

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1735,
    "title": "Naruto: Shippuuden",
    "synopsis": "It has been two and a half years since...",
    "mean": 8.28,
    "rank": 319,
    "genres": [
      {"id": 1, "name": "Action"},
      {"id": 2, "name": "Adventure"}
    ]
    // ... full anime details
  }
}
```

---

### 4. Get Anime Ranking
**GET** `/api/anime/ranking`

Get ranked lists of anime by various criteria.

**Query Parameters:**
- `ranking_type` (optional): Type of ranking (default: "all")
  - `all`: Top Anime Series
  - `airing`: Top Airing Anime
  - `upcoming`: Top Upcoming Anime
  - `tv`: Top Anime TV Series
  - `ova`: Top Anime OVA Series
  - `movie`: Top Anime Movies
  - `special`: Top Anime Specials
  - `bypopularity`: Top Anime by Popularity
  - `favorite`: Top Favorited Anime
- `limit` (optional): Number of results (default: 100, max: 500)
- `offset` (optional): Offset for pagination (default: 0)
- `fields` (optional): Comma-separated list of fields to include

**Example:**
```bash
GET /api/anime/ranking?ranking_type=all&limit=10
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "node": {
        "id": 52991,
        "title": "Sousou no Frieren",
        "main_picture": {
          "medium": "https://cdn.myanimelist.net/images/anime/1015/138006.jpg"
        }
      },
      "ranking": {
        "rank": 1
      }
    }
  ],
  "paging": {
    "next": "https://api.myanimelist.net/v2/anime/ranking?offset=10&ranking_type=all&limit=10"
  },
  "ranking_type": "all"
}
```

---

### 5. Get Seasonal Anime
**GET** `/api/anime/season/:year/:season`

Get anime from a specific season and year.

**Path Parameters:**
- `year` (required): Four-digit year
- `season` (required): Season name
  - `winter`: January, February, March
  - `spring`: April, May, June
  - `summer`: July, August, September
  - `fall`: October, November, December

**Query Parameters:**
- `sort` (optional): Sort order
  - `anime_score`: By score (descending)
  - `anime_num_list_users`: By popularity (descending)
- `limit` (optional): Number of results (default: 100, max: 500)
- `offset` (optional): Offset for pagination (default: 0)
- `fields` (optional): Comma-separated list of fields to include

**Example:**
```bash
GET /api/anime/season/2024/summer?limit=10&sort=anime_score
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "node": {
        "id": 59612,
        "title": "Monogatari Series: Off & Monster Season",
        "main_picture": {
          "medium": "https://cdn.myanimelist.net/images/anime/1887/144936.jpg"
        }
      }
    }
  ],
  "paging": {
    "next": "https://api.myanimelist.net/v2/anime/season/2024/summer?offset=10&limit=10"
  },
  "season": {
    "year": 2024,
    "season": "summer"
  }
}
```

---

## Error Responses

All endpoints return consistent error responses:

```json
{
  "error": "Error type",
  "message": "Detailed error message"
}
```

**Common HTTP Status Codes:**
- `400`: Bad Request (invalid parameters)
- `404`: Not Found (anime not found)
- `500`: Internal Server Error (API connection issues)

---

## Environment Variables Required

```env
MYANIME_LIST_CLIENT_ID=your_client_id_here
```

---

## Rate Limiting

Please note that MyAnimeList API has rate limiting. The current implementation uses client authentication which should provide sufficient quota for most use cases.

---

## Examples

### Search for popular anime
```bash
curl "http://localhost:5000/api/anime/search?q=attack+on+titan&limit=5"
```

### Get detailed info for a specific anime
```bash
curl "http://localhost:5000/api/anime/details/16498"
```

### Get top 10 anime of all time
```bash
curl "http://localhost:5000/api/anime/ranking?ranking_type=all&limit=10"
```

### Get current season anime
```bash
curl "http://localhost:5000/api/anime/season/2024/fall?limit=20"
```
