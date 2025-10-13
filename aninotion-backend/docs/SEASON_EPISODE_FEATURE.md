# Season & Episode Feature Documentation

## Overview
The Season and Episode feature allows posts to be associated with specific seasons and/or episodes of an anime series. This enables better organization and creates an infographic-style view of all posts related to an anime.

## Features Implemented

### 1. Database Schema (Backend)
**File**: `/aninotion-backend/models/Post.js`

Added two optional fields to the Post model:
- `seasonNumber` (Number, optional) - The season number (1, 2, 3, etc.)
- `episodeNumber` (Number, optional) - The episode number within the season

```javascript
seasonNumber: {
  type: Number,
  required: false
},
episodeNumber: {
  type: Number,
  required: false
}
```

### 2. API Routes (Backend)
**Files**: `/aninotion-backend/routes/posts.js`

Updated both CREATE and UPDATE routes to handle:
- `seasonNumber` field in request body
- `episodeNumber` field in request body

The fields are properly validated and stored when creating or updating posts.

### 3. Post Form (Frontend)
**File**: `/aninotion-frontend/src/components/PostForm.jsx`

Added input fields for:
- Season Number (optional, positive integers only)
- Episode Number (optional, positive integers only)

Features:
- Side-by-side layout on larger screens
- Validation for positive numbers
- Helpful placeholder text
- Clear indication that both fields are optional
- Message explaining that leaving both empty means the post is about the whole series

### 4. Post Card Display (Frontend)
**File**: `/aninotion-frontend/src/components/PostCard.jsx`

Enhanced display logic to show:
- **S{season}E{episode}** format when both are present (e.g., "S1E12")
- **Episode {number}** when only episode is present
- **Season {number}** when only season is present  
- **Whole Series** when neither is present

The anime name is now clickable and navigates to the anime info page.

### 5. Anime Info Page (Frontend)
**File**: `/aninotion-frontend/src/pages/AnimeInfoPage.jsx`
**Route**: `/anime/:animeName`

A dedicated page that displays all posts for a specific anime, organized by:

#### Layout Sections:
1. **Header**: Shows anime name and statistics (total posts, episode posts, series posts)
2. **Whole Series Posts**: Grid of posts about the entire anime
3. **Season & Episode Posts**: Timeline/infographic view grouped by season

#### Season Organization:
- Posts are grouped by season number
- Each season has its own section with a header
- Posts without a season are grouped in "Other Posts"
- Within each season, posts are sorted by episode number

#### Post Display:
- Timeline-style infographic with connecting lines
- Circular badges showing season/episode info:
  - "S1 E12" for posts with both
  - "EP 12" for episode-only posts
  - "S 1" for season-only posts
- Post title, excerpt, images, and engagement metrics
- Click any post to navigate to full post page
- Hover effects for better UX

## Use Cases

### 1. Whole Series Reviews
Leave both season and episode empty:
```
Title: "Attack on Titan - Complete Series Review"
Season: (empty)
Episode: (empty)
```
Display: "📺 Attack on Titan - Whole Series"

### 2. Season Reviews
Set season number, leave episode empty:
```
Title: "Attack on Titan Season 1 Overview"
Season: 1
Episode: (empty)
```
Display: "📺 Attack on Titan - Season 1"

### 3. Episode Reviews
Set both season and episode:
```
Title: "Attack on Titan S1E1 - To You, in 2000 Years"
Season: 1
Episode: 1
```
Display: "📺 Attack on Titan - S1E1"

### 4. Episode-Only (No Season Context)
Set episode, leave season empty:
```
Title: "One Piece Episode 1000 Special"
Season: (empty)
Episode: 1000
```
Display: "📺 One Piece - Episode 1000"

### 5. Multiple Posts Per Episode
Multiple perspectives on the same episode:
```
Post 1: "Attack on Titan S1E1 - Plot Analysis"
Post 2: "Attack on Titan S1E1 - Character Study"  
Post 3: "Attack on Titan S1E1 - Animation Breakdown"
```
All appear under Season 1, sorted by creation date for the same episode.

## Navigation Flow

1. **Home/Category Page** → View posts with season/episode info
2. **Click Anime Name** → Navigate to Anime Info Page (`/anime/:animeName`)
3. **Anime Info Page** → See all posts organized by season/episode
4. **Click Post** → View full post details

## Technical Details

### Sorting Logic
Posts are sorted in this order:
1. Season number (ascending)
2. Episode number (ascending)
3. Creation date (descending) for same season/episode

### Grouping Logic
```javascript
// Group by season
const episodesBySeason = {
  1: [posts for season 1],
  2: [posts for season 2],
  'unsorted': [posts without season]
}
```

### URL Encoding
Anime names in URLs are properly encoded/decoded:
```javascript
navigate(`/anime/${encodeURIComponent(animeName)}`);
const decodedName = decodeURIComponent(animeName);
```

## Testing

Run the test suite:
```bash
cd aninotion-backend
node scripts/test-season-episode.js
```

Tests cover:
- Creating posts with season and episode
- Creating posts with only season
- Creating posts with only episode
- Multiple posts for same episode
- Querying by season
- Grouping by season
- Sorting order

## Benefits

1. **Better Organization**: Posts are logically grouped by anime, season, and episode
2. **Visual Appeal**: Timeline infographic view is more engaging
3. **Discovery**: Users can find all posts related to a specific anime
4. **Flexibility**: Supports various content types (series, season, episode reviews)
5. **Scalability**: Can handle multiple posts per episode
6. **User Experience**: Clear navigation and visual indicators

## Future Enhancements

Potential additions:
- Filter by season on anime info page
- Search within anime posts
- Episode range support (e.g., "Episodes 1-12")
- Season/episode autocomplete based on anime API
- Share anime info page link
- Export anime infographic as image
- Statistics dashboard (most reviewed episodes, etc.)
