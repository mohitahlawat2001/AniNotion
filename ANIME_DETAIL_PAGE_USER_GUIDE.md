# How to Use the New Anime Detail Page Feature

## Quick Start Guide

### Step 1: View Anime Releases
1. Go to the **Anime Releases** page
2. Click the **"Switch to New Schema"** button at the top
3. You'll see episode cards with anime names

### Step 2: Navigate to Anime Detail Page
There are **TWO ways** to go to an anime's detail page:

#### Option A: Click the Anime Name
- Click on the **anime title** (bold text at top of card)
- The title will turn blue when you hover over it
- A small info icon (ℹ️) appears on hover

#### Option B: Click the Info Button
- Look for the **green button** with an info icon (ℹ️)
- It's located at the bottom-right of each episode card
- Tooltip says: "View all episodes for this anime"

### Step 3: Explore the Anime Detail Page
Once you click, you'll see:

```
┌─────────────────────────────────────────────────┐
│  ← Back to Home                                 │
│                                                 │
│  📺 Digimon Beatbreak                          │
│  📄 51 Posts  ▶️ 1 Episode Posts  📺 0 Series  │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  🎬 Available Episodes              [Cover]     │
│  51 episodes available to watch                 │
├─────────────────────────────────────────────────┤
│  [EP 1]    [EP 2]    [EP 3]                    │
│  [Image]   [Image]   [Image]                    │
│  Title     Title     Title                      │
│  Date      Date      Date                       │
│  Sources   Sources   Sources                    │
│  [Watch]   [Watch]   [Watch]                    │
│                                                  │
│  ... (all episodes displayed) ...               │
│                                                  │
│  Status: ONGOING │ Latest: 51 │ Total: 51      │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  📺 Whole Series Posts                          │
│  (Blog posts about the entire series)           │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  ▶️ Season & Episode Posts                     │
│  (Timeline of episode-specific blog posts)      │
└─────────────────────────────────────────────────┘
```

## What You Can Do on the Anime Detail Page

### Watch Episodes
- Click the **"Watch Now"** button on any episode
- Opens the episode in a new tab
- Maintains your position on the page

### View Episode Info
Each episode card shows:
- ✅ Episode number badge
- ✅ Thumbnail image
- ✅ Release date
- ✅ View count (if available)
- ✅ Multiple sources (if available)
- ✅ "NEW" badge for recent episodes

### Browse Related Content
- **Available Episodes** - Direct watch links
- **Whole Series Posts** - Reviews, guides, discussions
- **Episode Posts** - Specific episode reviews/recaps

## Features to Notice

### Multi-Source Support
If an episode has multiple sources, you'll see:
```
Sources: [animepahe] [gogoanime] +2
```

### Visual Indicators
- 🔴 **NEW** badge - Recently added episodes
- ✅ **Complete** badge - Finished series
- 🎬 **Episode badges** - Clear episode numbers

### Responsive Design
- **Desktop:** 3 columns of episodes
- **Tablet:** 2 columns
- **Mobile:** 1 column (full width)

## Navigation Flow

```
Anime Releases Page
     ↓
Click anime name or info button
     ↓
Anime Detail Page
     ├─ View all episodes
     ├─ Read blog posts
     └─ Watch episodes
```

## Tips & Tricks

### Finding Specific Episodes
1. Go to anime detail page
2. Scroll through the episode grid
3. Episodes are sorted by episode number
4. Look for episode badges (EP 1, EP 2, etc.)

### Checking for New Episodes
- Look for the pulsing red **"NEW"** badge
- It appears on recently added episodes
- Click to watch immediately

### Multiple Viewing Sources
- Some episodes have multiple sources
- Primary source is shown in the main button
- Additional sources shown in badges
- Click sources badge to see all options (future feature)

### Going Back
- Click **"← Back to Home"** at the top
- Or use your browser's back button
- Your position in the releases page is maintained

## Example URLs

```
Releases Page:
/anime-releases

Anime Detail Page:
/anime/Digimon%20Beatbreak
/anime/Star%20Detective%20Precure!
/anime/Scum%20of%20the%20Brave
```

## Troubleshooting

### No Episodes Showing?
- Make sure you've switched to "New Schema"
- Migration must be complete (51 episodes should exist)
- Check that backend is running on port 5001

### Anime Page Not Loading?
- Check the URL encoding (spaces become %20)
- Ensure anime name matches exactly
- Try refreshing the page

### Watch Button Not Working?
- Check that the episode has a valid watch URL
- Try a different browser
- Check if popup blocker is enabled

## Keyboard Shortcuts

- **Escape** - Close any open modals (future feature)
- **Tab** - Navigate between episode cards
- **Enter** - Activate focused button
- **Ctrl/Cmd + Click** - Open episode in new tab

## Mobile Experience

On mobile devices:
- Episodes display in a single column
- Tap anime name to navigate
- Tap info button for details
- Tap "Watch Now" to open episode
- Smooth scrolling through episodes

## What's Coming Next

Future enhancements:
- 🔮 Source selector modal
- 🔮 Watch progress tracking
- 🔮 Episode search and filters
- 🔮 Season grouping
- 🔮 Anime descriptions and metadata
- 🔮 Related anime suggestions

---

**Enjoy discovering and watching your favorite anime! 🎌**
