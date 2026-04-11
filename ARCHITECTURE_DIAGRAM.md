# Architecture Diagram - Anime Scraping & Notification Service

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         ANIME SCRAPING SYSTEM                                │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                           EXTERNAL SOURCES                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   🌐 AnimePahe.com  ──→  HTML Pages  ──→  Latest Release Data              │
│                                                                              │
└──────────────────────────────┬──────────────────────────────────────────────┘
                               │
                               │ HTTPS Request
                               │ (every 6 hours)
                               ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│              SCRAPING-NOTIFICATION-BACKEND (Port 5001)                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────┐         ┌──────────────────────┐                  │
│  │   CRON SCHEDULER    │         │   SCRAPING SERVICE   │                  │
│  │                     │────────▶│                      │                  │
│  │ • Every 6 hours     │         │ • Axios + Cheerio    │                  │
│  │ • On startup        │         │ • Parse HTML         │                  │
│  │ • Manual trigger    │         │ • Extract data       │                  │
│  └─────────────────────┘         │ • Rate limiting      │                  │
│                                   └──────────┬───────────┘                  │
│                                              │                              │
│                                              │ Save                         │
│                                              ↓                              │
│  ┌────────────────────────────────────────────────────────────┐            │
│  │                  MONGODB DATABASE                           │            │
│  │                                                             │            │
│  │  Collection: anime_releases                                │            │
│  │  ┌──────────────────────────────────────────────────────┐ │            │
│  │  │ • _id                                                 │ │            │
│  │  │ • title: "Anime Name - Episode 12"                   │ │            │
│  │  │ • animeName: "Anime Name"                            │ │            │
│  │  │ • episodeNumber: 12                                  │ │            │
│  │  │ • thumbnailUrl: "https://..."                        │ │            │
│  │  │ • watchUrl: "https://..."                            │ │            │
│  │  │ • animePageUrl: "https://..."                        │ │            │
│  │  │ • sourceWebsite: "animepahe"                         │ │            │
│  │  │ • dataId: "6394"                                     │ │            │
│  │  │ • releaseDate: Date                                  │ │            │
│  │  │ • isNew: true                                        │ │            │
│  │  │ • isComplete: false                                  │ │            │
│  │  │ • seenBy: [userId1, userId2]                         │ │            │
│  │  │ • createdAt, updatedAt                               │ │            │
│  │  └──────────────────────────────────────────────────────┘ │            │
│  └────────────────────────────────────────────────────────────┘            │
│                                   ↑                                         │
│                                   │ CRUD                                    │
│                                   │                                         │
│  ┌────────────────────────────────┴───────────────────────┐                │
│  │           ANIME RELEASES CONTROLLER                     │                │
│  │                                                         │                │
│  │  • getAnimeReleases()      - List with pagination      │                │
│  │  • getUnseenReleases()     - User-specific unseen      │                │
│  │  • getStats()              - Counts & statistics       │                │
│  │  • getAnimeReleaseById()   - Single release            │                │
│  │  • markAsSeen()            - Track user views          │                │
│  │  • triggerScrape()         - Manual scrape trigger     │                │
│  └────────────────────────────────┬───────────────────────┘                │
│                                   │                                         │
│  ┌────────────────────────────────┴───────────────────────┐                │
│  │              REST API ROUTES                            │                │
│  │                                                         │                │
│  │  GET    /api/anime-releases                            │                │
│  │  GET    /api/anime-releases/unseen                     │                │
│  │  GET    /api/anime-releases/stats                      │                │
│  │  GET    /api/anime-releases/:id                        │                │
│  │  POST   /api/anime-releases/mark-seen                  │                │
│  │  POST   /api/anime-releases/scrape                     │                │
│  └────────────────────────────────┬───────────────────────┘                │
│                                   │                                         │
└───────────────────────────────────┼─────────────────────────────────────────┘
                                    │
                                    │ HTTP/JSON
                                    │ (CORS Enabled)
                                    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│              ANINOTION-FRONTEND (React + Vite)                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────┐      │
│  │             animeReleaseService.js (API Client)                   │      │
│  │                                                                   │      │
│  │  • getAnimeReleases(params)                                      │      │
│  │  • getUnseenReleases(userId, params)                             │      │
│  │  • getStats(userId)                                              │      │
│  │  • markAsSeen(releaseIds, userId)                                │      │
│  │  • triggerScrape()                                               │      │
│  └──────────────────────────┬───────────────────────────────────────┘      │
│                             │                                               │
│                             │ Fetch Data                                    │
│                             ↓                                               │
│  ┌──────────────────────────────────────────────────────────────────┐      │
│  │         NotificationSection Component                             │      │
│  │                                                                   │      │
│  │  • Fetches releases from API                                     │      │
│  │  • Manages pagination state                                      │      │
│  │  • Filters (new only / all)                                      │      │
│  │  • Shows unseen count                                            │      │
│  │  • Renders grid of cards                                         │      │
│  │                                                                   │      │
│  │  ┌───────────────────────────────────────────────────────────┐  │      │
│  │  │                                                            │  │      │
│  │  │  [Card] [Card] [Card] [Card]                              │  │      │
│  │  │  [Card] [Card] [Card] [Card]                              │  │      │
│  │  │  [Card] [Card] [Card] [Card]                              │  │      │
│  │  │                                                            │  │      │
│  │  │  ◄ 1 2 3 ... ►  Pagination                                │  │      │
│  │  │                                                            │  │      │
│  │  └───────────────────────────────────────────────────────────┘  │      │
│  └──────────────────────────┬───────────────────────────────────────┘      │
│                             │                                               │
│                             │ Renders                                       │
│                             ↓                                               │
│  ┌──────────────────────────────────────────────────────────────────┐      │
│  │         AnimeReleaseCard Component (Individual)                   │      │
│  │                                                                   │      │
│  │  ┌──────────────────────────────────────────────────┐            │      │
│  │  │  ┌──────────────────────────────────┐            │            │      │
│  │  │  │   [Thumbnail Image]              │            │            │      │
│  │  │  │   [▶ Play Button Overlay]        │            │            │      │
│  │  │  │   [Watch Link]                   │            │            │      │
│  │  │  └──────────────────────────────────┘            │            │      │
│  │  │                                                   │            │      │
│  │  │  📺 Anime Name                                    │            │      │
│  │  │  🔢 Episode 12                                    │            │      │
│  │  │  🔴 NEW                                           │            │      │
│  │  └──────────────────────────────────────────────────┘            │      │
│  └──────────────────────────────────────────────────────────────────┘      │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────┐      │
│  │         NotificationBadge Component (Navigation)                  │      │
│  │                                                                   │      │
│  │  Navbar: [ Home ] [ Releases 🔴15 ] [ Profile ]                  │      │
│  │                                                                   │      │
│  │  • Shows unseen count                                            │      │
│  │  • Auto-refreshes every 5 min                                    │      │
│  │  • Only visible if count > 0                                     │      │
│  └──────────────────────────────────────────────────────────────────┘      │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                              USER INTERACTION                                 │
└─────────────────────────────────────────────────────────────────────────────┘

1. 👤 User visits /anime-releases page
2. 📡 Frontend fetches latest releases from backend API
3. 🎨 Displays grid of anime cards with thumbnails
4. 🔔 Shows notification badge with unseen count
5. 🖱️ User clicks "Watch" link → Opens external anime site
6. ✅ Frontend marks release as seen for that user
7. 🔄 Badge count updates automatically

┌─────────────────────────────────────────────────────────────────────────────┐
│                          AUTOMATED WORKFLOW                                   │
└─────────────────────────────────────────────────────────────────────────────┘

Every 6 hours:
  1. ⏰ Cron job triggers
  2. 🕷️ Scraper fetches anime site HTML
  3. 📝 Parser extracts release data
  4. 💾 Saves new releases to MongoDB (skips duplicates)
  5. 🆕 Marks releases >24h as "not new"
  6. 📊 Stats update automatically
  7. 🔔 Users see new notifications

┌─────────────────────────────────────────────────────────────────────────────┐
│                           DATA FLOW SUMMARY                                   │
└─────────────────────────────────────────────────────────────────────────────┘

Anime Site → Scraper → MongoDB → REST API → Frontend → User
     ↑                                                      │
     └──────────────── Scheduled Every 6h ─────────────────┘
