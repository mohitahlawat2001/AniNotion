# Sidebar and Page Templates - Usage Guide

## Overview
This document explains how to use the reusable sidebar and page templates in AniNotion. These templates provide a standardized, consistent layout across different content types (trending, recommendations, similar posts, etc.).

---

## 🎨 **RightSidebar Component** (Template)

### Description
A generic, reusable sticky sidebar component for displaying lists of posts. Can be customized with different icons, colors, and badge styles.

### Location
`/src/components/RightSidebar.jsx`

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | string | required | Sidebar title (e.g., "Trending", "Recommended For You") |
| `icon` | React.Element | required | Lucide React icon component |
| `iconColor` | string | `'text-gray-500'` | Tailwind color class for icon |
| `headerBgColor` | string | `'bg-gray-50'` | Tailwind background class for section header |
| `badgeConfig` | function | default ranking | Function `(index) => { bg, text, content }` for badge styling |
| `items` | array | `[]` | Array of post items to display |
| `loading` | boolean | `false` | Loading state |
| `error` | string | `null` | Error message |
| `emptyMessage` | string | `'No items available'` | Message when no items |
| `viewMoreLink` | string | `null` | Optional link for "View More" button |
| `viewMoreText` | string | `'Show more'` | Text for view more button |
| `className` | string | `''` | Additional CSS classes |

### Features
- ✅ Sticky positioning with `top-6` offset
- ✅ Scrollable content with `max-h-[calc(100vh-16rem)]`
- ✅ Automatic loading skeleton
- ✅ Error and empty states
- ✅ Click navigation to post pages
- ✅ Custom badge styling per item

### Example Usage

```jsx
<RightSidebar
  title="Trending"
  icon={Flame}
  iconColor="text-orange-500"
  headerBgColor="bg-orange-50"
  badgeConfig={(index) => ({
    bg: index === 0 ? 'bg-yellow-100' : 'bg-gray-100',
    text: index === 0 ? 'text-yellow-700' : 'text-gray-700',
    content: index + 1
  })}
  items={trendingPosts}
  loading={loading}
  error={error}
  viewMoreLink="/trending"
  viewMoreText="Show more"
/>
```

---

## 🔥 **TrendingSidebar Component**

### Description
Pre-configured sidebar for displaying trending posts with ranking badges.

### Location
`/src/components/TrendingSidebar.jsx`

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `limit` | number | `5` | Number of trending posts to display |
| `timeframe` | number | `7` | Timeframe in days for trending calculation |
| `className` | string | `''` | Additional CSS classes |

### Features
- 🏆 Top 3 posts get special badge colors (gold, silver, bronze)
- 🔥 Orange/flame theme
- 📊 Ranking numbers (1, 2, 3, ...)
- 🔗 "Show more" button linking to `/trending`

### Example Usage

```jsx
<TrendingSidebar limit={5} timeframe={7} />
```

---

## ✨ **RecommendationsSidebar Component**

### Description
Pre-configured sidebar for displaying personalized recommendations.

### Location
`/src/components/RecommendationsSidebar.jsx`

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `limit` | number | `5` | Number of recommendations to display |
| `className` | string | `''` | Additional CSS classes |

### Features
- ✨ Sparkle icon badges (all items)
- 💙 Blue theme
- 🎯 Personalized content (currently demo mode using trending slice)
- 🚫 No "view more" link

### Example Usage

```jsx
<RecommendationsSidebar limit={5} />
```

---

## 🔮 **SimilarPostsSidebar Component**

### Description
Pre-configured sidebar for displaying similar posts to a given post.

### Location
`/src/components/SimilarPostsSidebar.jsx`

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `postId` | string | required | ID of the post to find similar posts for |
| `limit` | number | `5` | Number of similar posts to display |
| `className` | string | `''` | Additional CSS classes |

### Features
- 💜 Purple theme
- 🔢 Numbered badges
- 🔗 "View all similar posts" button linking to `/post/:id/similar`

### Example Usage

```jsx
<SimilarPostsSidebar postId={post._id} limit={5} />
```

---

## 📄 **PageWithSidebar Component** (Template)

### Description
A standardized page layout with optional sidebar for content listing pages.

### Location
`/src/components/PageWithSidebar.jsx`

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `pageTitle` | string | required | Page title |
| `pageDescription` | string | optional | Page description subtitle |
| `seoTitle` | string | required | SEO title |
| `seoDescription` | string | required | SEO description |
| `seoUrl` | string | required | SEO URL |
| `icon` | React.Element | optional | Lucide React icon for page header |
| `iconColor` | string | `'text-gray-500'` | Tailwind color class for icon |
| `posts` | array | `[]` | Array of posts to display |
| `loading` | boolean | `false` | Loading state |
| `error` | string | `null` | Error message |
| `emptyMessage` | string | `'No posts available'` | Message when no posts |
| `sidebar` | React.Element | `null` | Optional sidebar component |
| `showBackButton` | boolean | `true` | Show back button |
| `backButtonText` | string | `'Back'` | Text for back button |

### Features
- ✅ Consistent header with icon and description
- ✅ Back button navigation
- ✅ Two-column responsive layout (posts + sidebar)
- ✅ SEO optimization
- ✅ Loading, error, and empty states
- ✅ Scroll to top button
- ✅ Desktop-only sidebar (hidden on mobile)

### Example Usage

```jsx
<PageWithSidebar
  pageTitle="Trending This Week"
  pageDescription="Most popular posts based on views, likes, and engagement"
  seoTitle="Trending Posts - AniNotion"
  seoDescription="Discover trending anime content"
  seoUrl="/trending"
  icon={Flame}
  iconColor="text-orange-500"
  posts={posts}
  loading={loading}
  error={error}
  sidebar={<RecommendationsSidebar limit={5} />}
/>
```

---

## 📱 **Pre-built Pages Using Templates**

### 1. **TrendingPage**
- **Location:** `/src/pages/TrendingPage.jsx`
- **Route:** `/trending`
- **Sidebar:** RecommendationsSidebar
- **Theme:** Orange/Flame

### 2. **PersonalizedPage**
- **Location:** `/src/pages/PersonalizedPage.jsx`
- **Route:** `/recommendations` (needs to be added to routing)
- **Sidebar:** TrendingSidebar
- **Theme:** Blue/Sparkles

---

## 🎯 **Common Use Cases**

### Use Case 1: Adding a New Content Page

```jsx
import { Star } from 'lucide-react';
import PageWithSidebar from '../components/PageWithSidebar';
import TrendingSidebar from '../components/TrendingSidebar';

const FeaturedPage = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch logic here...

  return (
    <PageWithSidebar
      pageTitle="Featured Posts"
      pageDescription="Hand-picked anime content from our editors"
      seoTitle="Featured Posts - AniNotion"
      seoDescription="Explore featured anime content"
      seoUrl="/featured"
      icon={Star}
      iconColor="text-yellow-500"
      posts={posts}
      loading={loading}
      sidebar={<TrendingSidebar limit={5} />}
    />
  );
};
```

### Use Case 2: Creating a Custom Sidebar

```jsx
import RightSidebar from './RightSidebar';
import { Heart } from 'lucide-react';

const FavoritesSidebar = ({ userId, limit = 5 }) => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch user favorites...

  const favoriteBadgeConfig = (index) => ({
    bg: 'bg-red-100',
    text: 'text-red-700',
    content: <Heart size={12} fill="currentColor" />
  });

  return (
    <RightSidebar
      title="Your Favorites"
      icon={Heart}
      iconColor="text-red-500"
      headerBgColor="bg-red-50"
      badgeConfig={favoriteBadgeConfig}
      items={favorites}
      loading={loading}
      viewMoreLink="/saved"
      viewMoreText="View all favorites"
    />
  );
};
```

---

## 🐛 **Troubleshooting**

### Sidebar Overlapping Issue
**Problem:** Sidebar overlaps content when scrolling down.

**Solution:** Use `sticky top-6` positioning (already implemented in templates). The `top-6` creates space from the top of the viewport.

```jsx
// Correct - Built into RightSidebar
<div className="sticky top-6 ...">

// Wrong - Don't use fixed positioning
<div className="fixed top-0 ...">
```

### Sidebar Not Scrolling
**Problem:** Sidebar content is cut off and not scrollable.

**Solution:** Max height is set to `calc(100vh-16rem)` in RightSidebar template. This accounts for header, padding, and footer space.

```jsx
// Correct - Built into RightSidebar
<div className="max-h-[calc(100vh-16rem)] overflow-y-auto">

// Wrong - Fixed height
<div className="max-h-96 overflow-y-auto">
```

---

## 🚀 **Best Practices**

1. **Always use templates** - Don't recreate sidebar layouts from scratch
2. **Consistent theming** - Stick to established color themes:
   - 🔥 Trending = Orange
   - ✨ Recommendations = Blue
   - 💜 Similar Posts = Purple
3. **Responsive design** - Sidebars are desktop-only (hidden on mobile)
4. **Loading states** - Always handle loading, error, and empty states
5. **SEO optimization** - Use PageWithSidebar for proper SEO headers

---

## 📊 **Component Hierarchy**

```
Home Page
├── TrendingSidebar (uses RightSidebar)
└── RecommendationsSidebar (uses RightSidebar)

TrendingPage (uses PageWithSidebar)
└── RecommendationsSidebar (uses RightSidebar)

PersonalizedPage (uses PageWithSidebar)
└── TrendingSidebar (uses RightSidebar)

PostPage (future)
└── SimilarPostsSidebar (uses RightSidebar)
```

---

## 📝 **Migration Checklist**

When migrating old pages to use the new templates:

- [ ] Import `PageWithSidebar` component
- [ ] Replace manual header/SEO/layout code
- [ ] Configure page props (title, description, icon)
- [ ] Add sidebar component
- [ ] Remove duplicate loading/error handling
- [ ] Test responsive behavior
- [ ] Verify sticky positioning works correctly
- [ ] Check scroll behavior on long content

---

## 🎨 **Customization Options**

### Badge Styles
- **Ranking:** Numbers 1, 2, 3 with colored backgrounds
- **Icons:** Custom icons (Sparkles, Hearts, Stars, etc.)
- **Colors:** Any Tailwind color combination

### Themes
| Theme | Icon | Color | Background |
|-------|------|-------|------------|
| Trending | Flame | `text-orange-500` | `bg-orange-50` |
| Recommendations | Sparkles | `text-blue-500` | `bg-blue-50` |
| Similar | Sparkles | `text-purple-500` | `bg-purple-50` |
| Custom | Any | Any | Any |

---

## 🔄 **Future Enhancements**

- [ ] Real personalized recommendation API integration
- [ ] Infinite scroll support for sidebars
- [ ] Keyboard navigation for sidebar items
- [ ] Accessibility improvements (ARIA labels)
- [ ] Sidebar skeleton loading animations
- [ ] Mobile sidebar drawer variant
- [ ] Sidebar preferences (collapse/expand)

---

## 📚 **Related Documentation**

- [API Documentation](/docs/API_V0.5.md)
- [Recommendation Engine](/docs/RECOMMENDATION_ENGINE.md)
- [Frontend Components](/docs/FRONTEND_COMPONENTS.md)

---

**Last Updated:** 2025-10-26
**Version:** 1.0.0
