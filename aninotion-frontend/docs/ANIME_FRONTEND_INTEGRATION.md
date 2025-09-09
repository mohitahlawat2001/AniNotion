# Frontend Anime API Integration

This document describes the frontend implementation for integrating with the MyAnimeList API through the AniNotion backend.

## Files Added/Created

### 1. API Service (`src/services/api.js`)
Added `animeAPI` object with the following methods:

#### Core Methods
- `checkHealth()` - Check anime API connection
- `search(query, options)` - Search for anime
- `getDetails(animeId, fields)` - Get detailed anime information
- `getRanking(options)` - Get anime rankings
- `getSeasonal(year, season, options)` - Get seasonal anime

#### Convenience Methods
- `getCurrentSeason(options)` - Get current season anime
- `getNextSeason(options)` - Get next season anime
- `getPopular(options)` - Get popular anime
- `getTopRated(options)` - Get top rated anime
- `getCurrentlyAiring(options)` - Get currently airing anime
- `getUpcoming(options)` - Get upcoming anime

### 2. React Hooks (`src/hooks/useAnime.js`)
Custom hooks for managing anime data and state:

- `useAnimeSearch(initialQuery)` - For searching anime with pagination
- `useAnimeDetails(animeId, fields)` - For fetching anime details
- `useAnimeRanking(rankingType, autoFetch)` - For fetching anime rankings
- `useSeasonalAnime(year, season, autoFetch)` - For fetching seasonal anime
- `useCurrentSeasonAnime(autoFetch)` - For fetching current season anime
- `useAnimeAPIHealth()` - For checking API health
- `usePopularAnime(autoFetch)` - Convenience hook for popular anime
- `useTopRatedAnime(autoFetch)` - Convenience hook for top rated anime
- `useCurrentlyAiringAnime(autoFetch)` - Convenience hook for airing anime
- `useUpcomingAnime(autoFetch)` - Convenience hook for upcoming anime

### 3. React Components

#### `AnimeCard.jsx`
Displays individual anime information in a card format.

**Props:**
- `anime` - Anime data object
- `showRank` - Whether to show ranking badge
- `showScore` - Whether to show score badge
- `onClick` - Click handler function
- `className` - Additional CSS classes
- `linkTo` - Link destination for the card

#### `AnimeGrid.jsx`
Displays a grid of anime cards with loading states and pagination.

**Props:**
- `animes` - Array of anime objects
- `loading` - Loading state
- `error` - Error message
- `hasMore` - Whether more results are available
- `onLoadMore` - Load more handler
- `onAnimeClick` - Anime click handler
- `showRank` - Whether to show ranks
- `showScore` - Whether to show scores
- `emptyMessage` - Message when no results
- `generateLinkTo` - Function to generate links

#### `AnimeSearch.jsx`
Complete search interface with history and results.

**Props:**
- `onAnimeSelect` - Anime selection handler
- `showSearchHistory` - Whether to show search history
- `maxHistoryItems` - Maximum history items to store
- `generateLinkTo` - Function to generate links
- `placeholder` - Search input placeholder

### 4. Sample Page (`src/pages/AnimePage.jsx`)
Complete anime page demonstrating all functionality:

- Search interface
- Top rated anime list
- Currently airing anime list
- Current season anime list
- API health status indicator
- Tab-based navigation

## Usage Examples

### Basic Search
```jsx
import { useAnimeSearch } from '../hooks/useAnime';

function SearchComponent() {
  const { data, loading, error, search } = useAnimeSearch();
  
  const handleSearch = (query) => {
    search(query);
  };
  
  return (
    <div>
      {/* Search UI */}
      {data.map(anime => (
        <div key={anime.node.id}>{anime.node.title}</div>
      ))}
    </div>
  );
}
```

### Anime Details
```jsx
import { useAnimeDetails } from '../hooks/useAnime';

function AnimeDetailsComponent({ animeId }) {
  const { data, loading, error } = useAnimeDetails(animeId);
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!data) return null;
  
  return (
    <div>
      <h1>{data.title}</h1>
      <p>{data.synopsis}</p>
      <p>Score: {data.mean}</p>
    </div>
  );
}
```

### Using Components
```jsx
import AnimeSearch from '../components/AnimeSearch';
import AnimeGrid from '../components/AnimeGrid';
import { useTopRatedAnime } from '../hooks/useAnime';

function AnimeListPage() {
  const { data, loading, error, hasMore, loadMore } = useTopRatedAnime();
  
  const handleAnimeSelect = (anime) => {
    console.log('Selected:', anime.node.title);
  };
  
  return (
    <div>
      <AnimeSearch onAnimeSelect={handleAnimeSelect} />
      
      <AnimeGrid
        animes={data}
        loading={loading}
        error={error}
        hasMore={hasMore}
        onLoadMore={loadMore}
        onAnimeClick={handleAnimeSelect}
        showRank={true}
      />
    </div>
  );
}
```

## Features

### Search Functionality
- Real-time anime search
- Search history with localStorage persistence
- Pagination support
- Error handling
- Loading states

### Anime Display
- Responsive card layout
- Anime posters and metadata
- Genre tags
- Ranking and score badges
- Multiple grid layouts

### Data Management
- Automatic caching through React hooks
- Pagination support
- Error boundaries
- Loading states
- Real-time API health monitoring

### Responsive Design
- Mobile-first approach
- Flexible grid layouts
- Touch-friendly interactions
- Accessibility considerations

## Configuration

### Environment Variables
Make sure your frontend has the backend URL configured:

```env
VITE_BACKEND_URL=http://localhost:5000/api
```

### Dependencies
The implementation uses existing dependencies:
- React
- React Router (optional for navigation)
- Tailwind CSS (for styling)

## API Response Formats

### Search Results
```json
{
  "success": true,
  "data": [
    {
      "node": {
        "id": 1735,
        "title": "Naruto: Shippuuden",
        "main_picture": {
          "medium": "...",
          "large": "..."
        }
      }
    }
  ],
  "paging": {
    "next": "..."
  },
  "query": {
    "q": "naruto",
    "limit": 20,
    "offset": 0
  }
}
```

### Anime Details
```json
{
  "success": true,
  "data": {
    "id": 1735,
    "title": "Naruto: Shippuuden",
    "synopsis": "...",
    "mean": 8.28,
    "rank": 319,
    "genres": [...],
    "pictures": [...],
    // ... full anime details
  }
}
```

## Error Handling

All hooks and components include comprehensive error handling:
- Network errors
- API errors
- Invalid data
- Rate limiting
- Graceful degradation

## Performance Considerations

- Lazy loading of images
- Pagination to limit data transfer
- Debounced search input
- Memoized components
- Efficient re-renders

## Customization

### Styling
All components use Tailwind CSS classes that can be customized or replaced with your own styling system.

### Data Fields
You can specify which fields to fetch from the MyAnimeList API using the `fields` parameter in API calls.

### Layouts
Components are designed to be flexible and can be easily customized for different layouts and use cases.

## Next Steps

1. **Add to Router**: Integrate the `AnimePage` component into your React Router setup
2. **Styling**: Customize the Tailwind classes to match your design system
3. **Navigation**: Implement anime detail pages and navigation
4. **Caching**: Consider adding more sophisticated caching if needed
5. **Testing**: Add unit tests for hooks and components
6. **Optimization**: Add image optimization and lazy loading
