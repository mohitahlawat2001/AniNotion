# Scraping & Notification Service - Usage Guide

## Overview
This microservice scrapes anime releases from external sources and provides a notification system for the frontend.

## Setup Instructions

### 1. Backend Setup

```bash
cd scraping-notification-backend
npm install
cp .env.example .env
```

Edit `.env` file:
```env
PORT=5001
MONGODB_URI=mongodb://localhost:27017/anime-scraping
SCRAPE_INTERVAL_HOURS=6
ANIME_SOURCE_URL=https://animepahe.com
MAX_RELEASES_TO_SCRAPE=50
FRONTEND_URL=http://localhost:5173
```

Start the service:
```bash
npm run dev
```

### 2. Frontend Setup

Add to `aninotion-frontend/.env`:
```env
VITE_SCRAPING_API_URL=http://localhost:5001/api
```

### 3. Usage in Frontend

#### Import Components:
```jsx
import { NotificationSection, NotificationBadge } from '../components/AnimeReleases';
```

#### Use Notification Section (Full Page):
```jsx
import { NotificationSection } from '../components/AnimeReleases';
import { useSelector } from 'react-redux';

function AnimeReleasesPage() {
  const currentUser = useSelector((state) => state.auth?.user);
  const currentUserId = currentUser?._id;

  return <NotificationSection currentUserId={currentUserId} />;
}
```

#### Use Notification Badge (In Navigation):
```jsx
import { NotificationBadge } from '../components/AnimeReleases';
import { useSelector } from 'react-redux';

function Navigation() {
  const currentUser = useSelector((state) => state.auth?.user);
  
  return (
    <nav>
      <Link to="/anime-releases">
        Releases
        <NotificationBadge currentUserId={currentUser?._id} />
      </Link>
    </nav>
  );
}
```

### 4. Add Route (React Router)

In your routing configuration:
```jsx
import AnimeReleasesPage from './pages/AnimeReleasesPage';

<Route path="/anime-releases" element={<AnimeReleasesPage />} />
```

## API Endpoints

### Get All Releases
```
GET http://localhost:5001/api/anime-releases?page=1&limit=12&isNew=true
```

### Get Unseen Releases for User
```
GET http://localhost:5001/api/anime-releases/unseen?userId=USER_ID&page=1&limit=12
```

### Get Statistics
```
GET http://localhost:5001/api/anime-releases/stats?userId=USER_ID
```

Response:
```json
{
  "success": true,
  "data": {
    "total": 150,
    "newCount": 25,
    "unseenCount": 15,
    "latestReleaseDate": "2026-03-29T05:00:00.000Z"
  }
}
```

### Mark as Seen
```
POST http://localhost:5001/api/anime-releases/mark-seen
Content-Type: application/json

{
  "releaseIds": ["release-id-1", "release-id-2"],
  "userId": "user-id"
}
```

### Trigger Manual Scrape (Admin)
```
POST http://localhost:5001/api/anime-releases/scrape
```

## Features

✅ **Automated Scraping**: Runs every 6 hours (configurable)
✅ **User-Specific Tracking**: Each user sees their own unseen count
✅ **Pagination**: Load releases in pages of 12
✅ **Filtering**: Show new only or all releases
✅ **Duplicate Prevention**: Won't add same release twice
✅ **Direct Watch Links**: Opens external anime site in new tab
✅ **Responsive Design**: Works on mobile and desktop

## Architecture

```
scraping-notification-backend/
├── models/
│   └── AnimeRelease.js         # Database schema
├── services/
│   └── scrapingService.js      # Web scraper logic
├── controllers/
│   └── animeReleasesController.js  # Business logic
├── routes/
│   └── animeReleases.js        # API routes
├── config/
│   ├── database.js             # MongoDB connection
│   └── scheduler.js            # Cron job scheduler
└── server.js                   # Express app

aninotion-frontend/
├── src/
│   ├── components/AnimeReleases/
│   │   ├── NotificationSection.jsx    # Main component
│   │   ├── AnimeReleaseCard.jsx       # Card component
│   │   ├── NotificationBadge.jsx      # Badge for nav
│   │   └── index.js
│   ├── services/
│   │   └── animeReleaseService.js     # API calls
│   └── pages/
│       └── AnimeReleasesPage.jsx      # Full page
```

## Customization

### Change Scraping Source
Edit `scraping-notification-backend/services/scrapingService.js` to scrape from different sites.

### Change Scraping Interval
Edit `.env`:
```env
SCRAPE_INTERVAL_HOURS=3  # Run every 3 hours
```

### Disable Auto-Scrape on Startup
Edit `.env`:
```env
RUN_SCRAPE_ON_STARTUP=false
```

### Change Items Per Page
Modify component:
```jsx
<NotificationSection currentUserId={userId} itemsPerPage={24} />
```

Or in NotificationSection.jsx:
```jsx
const [pagination, setPagination] = useState({
  page: 1,
  limit: 24,  // Change from 12 to 24
  // ...
});
```

## Troubleshooting

### Backend not connecting to MongoDB
- Ensure MongoDB is running
- Check `MONGODB_URI` in `.env`
- Try: `mongodb://127.0.0.1:27017/anime-scraping`

### Frontend not fetching data
- Check `VITE_SCRAPING_API_URL` in frontend `.env`
- Ensure backend is running on correct port
- Check browser console for CORS errors

### Scraping not working
- Check target site is accessible
- Site HTML structure may have changed
- Review scraper selectors in `scrapingService.js`

### CORS Errors
Add your frontend URL to backend `.env`:
```env
FRONTEND_URL=http://localhost:5173
```

## Production Deployment

1. Set production MongoDB URI
2. Use environment variables for sensitive data
3. Enable rate limiting
4. Consider using Redis for caching
5. Setup monitoring for scraper health
6. Respect robots.txt of target sites

## Notes

- This service scrapes public data only
- Links point to external sites (no hosting of content)
- Implement rate limiting to be respectful to source sites
- Monitor for changes in target site structure
- Consider legal implications of web scraping in your jurisdiction
