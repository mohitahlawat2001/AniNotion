# Anime Scraping & Notification Service - Quick Start

## 🎉 What Was Created

A **complete microservice** for scraping anime releases and displaying them with notifications!

### Backend Service (`scraping-notification-backend/`)
- ✅ Express API server (Port 5001)
- ✅ MongoDB data model with indexing
- ✅ Web scraper using Cheerio
- ✅ Automated cron scheduler (runs every 6 hours)
- ✅ RESTful API endpoints
- ✅ User-specific notification tracking
- ✅ CORS enabled for frontend

### Frontend Components (`aninotion-frontend/src/`)
- ✅ NotificationSection component (full grid layout)
- ✅ AnimeReleaseCard component (individual cards)
- ✅ NotificationBadge component (for navigation)
- ✅ API service layer
- ✅ Example page implementation

---

## 🚀 Quick Start (5 Minutes)

### 1. Start Backend Service

```bash
cd scraping-notification-backend
npm install  # Already done!
npm run dev
```

The backend will:
- Start on http://localhost:5001
- Connect to MongoDB
- Run initial scrape after 5 seconds
- Schedule scraping every 6 hours

### 2. Configure Frontend

Add to `aninotion-frontend/.env` (already added to .env.example):
```env
VITE_SCRAPING_API_URL=http://localhost:5001/api
```

### 3. Use in Your App

#### Option A: Create a dedicated page

Already created: `aninotion-frontend/src/pages/AnimeReleasesPage.jsx`

Add route in your router:
```jsx
import AnimeReleasesPage from './pages/AnimeReleasesPage';

// In your routes:
<Route path="/anime-releases" element={<AnimeReleasesPage />} />
```

#### Option B: Add to existing page

```jsx
import { NotificationSection } from '../components/AnimeReleases';
import { useSelector } from 'react-redux';

function HomePage() {
  const currentUser = useSelector((state) => state.auth?.user);
  
  return (
    <div>
      <h1>Welcome</h1>
      <NotificationSection currentUserId={currentUser?._id} />
    </div>
  );
}
```

#### Option C: Add notification badge to navigation

```jsx
import { NotificationBadge } from '../components/AnimeReleases';
import { Link } from 'react-router-dom';

function Navbar() {
  const currentUser = useSelector((state) => state.auth?.user);
  
  return (
    <nav>
      <Link to="/anime-releases" className="relative">
        Latest Releases
        <NotificationBadge currentUserId={currentUser?._id} />
      </Link>
    </nav>
  );
}
```

---

## 📡 API Endpoints

All endpoints available at `http://localhost:5001/api/anime-releases`

### Get Latest Releases
```bash
GET /api/anime-releases?page=1&limit=12&isNew=true
```

### Get User's Unseen Releases
```bash
GET /api/anime-releases/unseen?userId=USER_ID&page=1&limit=12
```

### Get Statistics
```bash
GET /api/anime-releases/stats?userId=USER_ID
```

### Mark as Seen
```bash
POST /api/anime-releases/mark-seen
Body: { "releaseIds": ["id1"], "userId": "USER_ID" }
```

### Manual Scrape (Admin)
```bash
POST /api/anime-releases/scrape
```

---

## 🧪 Test It Out

### 1. Test Backend Health
```bash
curl http://localhost:5001/health
```

### 2. Trigger Manual Scrape
```bash
curl -X POST http://localhost:5001/api/anime-releases/scrape
```

### 3. View Scraped Data
```bash
curl http://localhost:5001/api/anime-releases?page=1&limit=5
```

### 4. Get Stats
```bash
curl http://localhost:5001/api/anime-releases/stats
```

---

## 📂 File Structure

```
AniNotion/
├── scraping-notification-backend/     # NEW MICROSERVICE
│   ├── models/
│   │   └── AnimeRelease.js           # MongoDB schema
│   ├── services/
│   │   └── scrapingService.js        # Web scraper
│   ├── controllers/
│   │   └── animeReleasesController.js # Business logic
│   ├── routes/
│   │   └── animeReleases.js          # API routes
│   ├── config/
│   │   ├── database.js               # DB connection
│   │   └── scheduler.js              # Cron jobs
│   ├── server.js                     # Express app
│   ├── package.json
│   ├── .env                          # Configuration
│   └── README.md
│
├── aninotion-frontend/
│   ├── src/
│   │   ├── components/AnimeReleases/ # NEW COMPONENTS
│   │   │   ├── NotificationSection.jsx
│   │   │   ├── AnimeReleaseCard.jsx
│   │   │   ├── NotificationBadge.jsx
│   │   │   └── index.js
│   │   ├── services/
│   │   │   └── animeReleaseService.js # API client
│   │   └── pages/
│   │       └── AnimeReleasesPage.jsx  # Example page
│   └── .env.example (updated)
│
└── ANIME_SCRAPING_GUIDE.md           # Full documentation
```

---

## ⚙️ Configuration

### Backend (.env)
```env
PORT=5001                              # API port
MONGODB_URI=mongodb://localhost:27017/anime-scraping
SCRAPE_INTERVAL_HOURS=6                # How often to scrape
ANIME_SOURCE_URL=https://animepahe.com # Source website
MAX_RELEASES_TO_SCRAPE=50              # Limit per scrape
FRONTEND_URL=http://localhost:5173     # CORS
```

### Frontend (.env)
```env
VITE_SCRAPING_API_URL=http://localhost:5001/api
```

---

## 🎨 Component Props

### NotificationSection
```jsx
<NotificationSection 
  currentUserId={string}  // User ID for tracking seen releases
/>
```

### NotificationBadge
```jsx
<NotificationBadge 
  currentUserId={string}  // User ID for unseen count
/>
```

### AnimeReleaseCard
```jsx
<AnimeReleaseCard 
  release={object}            // Release data from API
  onMarkAsSeen={function}     // Callback when user watches
  currentUserId={string}      // User ID
/>
```

---

## 🔄 How It Works

1. **Scraper runs** (every 6 hours or on demand)
   - Fetches HTML from anime site
   - Parses episode data (title, thumbnail, links)
   - Saves to MongoDB (prevents duplicates)

2. **User visits page**
   - Frontend requests latest releases
   - Backend returns data with pagination
   - UI displays cards in grid layout

3. **User clicks watch link**
   - Opens external anime site
   - Marks release as "seen" for that user
   - Updates notification count

4. **Notification badge**
   - Shows count of unseen releases
   - Auto-refreshes every 5 minutes
   - Per-user tracking

---

## 🛠️ Customization

### Change Scraping Interval
Edit `.env`: `SCRAPE_INTERVAL_HOURS=3` (scrape every 3 hours)

### Change Items Per Page
In `NotificationSection.jsx`:
```jsx
const [pagination, setPagination] = useState({
  page: 1,
  limit: 24,  // Change from 12
  // ...
});
```

### Add More Anime Sources
Extend `scrapingService.js` to scrape from multiple sites

### Custom Styling
All components use Tailwind CSS classes - easy to customize

---

## ✅ What's Included

- [x] Complete backend microservice
- [x] MongoDB data model with indexes
- [x] Web scraping with Cheerio
- [x] Automated scheduling with node-cron
- [x] RESTful API with pagination
- [x] User-specific notification tracking
- [x] Frontend React components
- [x] API service layer
- [x] Example page implementation
- [x] Responsive design
- [x] Loading & error states
- [x] Notification badge for navigation
- [x] CORS configuration
- [x] Environment setup
- [x] Documentation

---

## 📚 Documentation

- **Full Guide**: `ANIME_SCRAPING_GUIDE.md`
- **Backend README**: `scraping-notification-backend/README.md`
- **API Docs**: See backend README

---

## 🐛 Troubleshooting

### Backend won't start
- Check MongoDB is running: `mongosh` or `mongo`
- Verify port 5001 is available: `lsof -i :5001`

### No data showing
- Trigger manual scrape: `curl -X POST http://localhost:5001/api/anime-releases/scrape`
- Check backend logs for errors

### CORS errors
- Ensure `FRONTEND_URL` in backend `.env` matches your frontend URL
- Restart backend after changing `.env`

### Frontend can't connect
- Verify `VITE_SCRAPING_API_URL` in frontend `.env`
- Check backend is running on correct port
- Open http://localhost:5001 in browser

---

## 🎯 Next Steps

1. **Test the backend**: `cd scraping-notification-backend && npm run dev`
2. **Add route** to your frontend router
3. **Import component** in your page
4. **Customize styling** as needed
5. **Deploy** both services

---

## 💡 Tips

- The scraper respects rate limits (2 second delay between requests)
- Releases older than 24 hours are automatically marked as "not new"
- Duplicate prevention uses compound indexes
- All external links open in new tabs
- User tracking is optional (works without userId)

---

## 🚀 Ready to Use!

Everything is set up and ready. Just:
1. Start the backend: `cd scraping-notification-backend && npm run dev`
2. Add the route/component to your frontend
3. Start your frontend: `cd aninotion-frontend && npm run dev`
4. Visit the page and see the latest anime releases!

**API is live at**: http://localhost:5001
**Docs**: http://localhost:5001 (shows available endpoints)

Enjoy! 🎉
