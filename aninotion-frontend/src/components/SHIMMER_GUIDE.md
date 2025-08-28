# AniNotion Shimmer Loading System

This directory contains reusable UI components for the AniNotion frontend, including a comprehensive shimmer loading system.

## Loading Components

### LoadingSpinner.jsx
Enhanced loading component that supports multiple loading types:

```jsx
// Simple spinner
<LoadingSpinner />

// Shimmer cards (adapts to current layout context)
<LoadingSpinner type="shimmer" count={6} />

// Full post page shimmer
<LoadingSpinner type="post" />

// Sidebar shimmer
<LoadingSpinner type="sidebar" />

// Form shimmer
<LoadingSpinner type="form" />
```

### Shimmer Components

- **ShimmerCard.jsx** - Individual post card shimmer (responsive grid/list)
- **ShimmerContainer.jsx** - Container for multiple shimmer cards
- **ShimmerPostPage.jsx** - Full post page loading state
- **ShimmerSidebar.jsx** - Sidebar content loading state
- **ShimmerForm.jsx** - Form loading state

### LoadingWrapper.jsx
Conditional loading wrapper component:

```jsx
import { useLoadingContext } from '../hooks/useLoadingContext';
import LoadingWrapper from './LoadingWrapper';

<LoadingWrapper loadingKey="posts" showMessage={true}>
  {/* Your content here */}
</LoadingWrapper>
```

## Usage Examples

### Basic Shimmer Loading

```jsx
import LoadingSpinner from './components/LoadingSpinner';

// In your component
if (isLoading) {
  return <LoadingSpinner type="shimmer" count={6} />;
}
```

### Advanced Loading Context

```jsx
import { useLoadingContext } from '../hooks/useLoadingContext';

function MyComponent() {
  const { setLoading, getLoadingState } = useLoadingContext();

  const fetchData = async () => {
    setLoading('posts', true, 'shimmer', 'Loading posts...');
    try {
      const data = await api.getPosts();
      // handle data
    } finally {
      setLoading('posts', false);
    }
  };

  const { isLoading, type, message } = getLoadingState('posts');
  
  if (isLoading) {
    return <LoadingSpinner type={type} />;
  }
  
  return <div>{/* content */}</div>;
}
```

### Layout-Aware Shimmer

The shimmer system automatically adapts to the current layout context:

```jsx
import { useLayout } from '../hooks/useLayout';
import ShimmerContainer from './ShimmerContainer';

function PostList() {
  const { layout } = useLayout(); // 'grid' or 'list'
  
  if (isLoading) {
    return <ShimmerContainer count={8} layout={layout} />;
  }
  
  return <PostsContainer posts={posts} />;
}
```

## Responsive Design

All shimmer components are mobile-first and responsive:

- **Mobile**: Simplified layouts, smaller text, touch-friendly spacing
- **Desktop**: Full layouts, larger text, hover states

## Animation Details

The shimmer animation is configured in `tailwind.config.js`:

```javascript
animation: {
  shimmer: 'shimmer 2s ease-in-out infinite',
  'shimmer-slow': 'shimmer 3s ease-in-out infinite',
  'shimmer-fast': 'shimmer 1.5s ease-in-out infinite',
},
keyframes: {
  shimmer: {
    '0%': { 'background-position': '-200% 0' },
    '100%': { 'background-position': '200% 0' },
  },
},
```

## Implementation in Pages

### Home.jsx & CategoryPage.jsx
```jsx
if (isLoading) {
  return (
    <div>
      {/* Header */}
      <div className="header-content">...</div>
      
      {/* Shimmer Loading */}
      <LoadingSpinner type="shimmer" count={6} />
    </div>
  );
}
```

### PostPage.jsx
```jsx
if (isLoading) {
  return <LoadingSpinner type="post" />;
}
```

## Best Practices

1. **Use appropriate count**: Match the expected number of items
2. **Layout context**: Let shimmer adapt to grid/list automatically
3. **Loading messages**: Provide context for longer operations
4. **Performance**: Shimmer components are lightweight but use sparingly
5. **Accessibility**: Shimmer provides visual feedback for screen readers

## Customization

### Colors
Shimmer uses a neutral gray palette that works with light/dark themes:
- Primary: `bg-gray-200`
- Secondary: `bg-gray-300`
- Light: `bg-gray-100`

### Timing
Adjust animation speed by using different shimmer classes:
- `animate-shimmer` (2s) - Default
- `animate-shimmer-slow` (3s) - Slower, more subtle
- `animate-shimmer-fast` (1.5s) - Faster, more dynamic

### Size Variations
Most shimmer components automatically scale with responsive classes:
- `h-4 sm:h-5` - Text lines
- `w-10 h-10 sm:w-12 sm:h-12` - Avatars
- `aspect-[4/3] sm:aspect-[3/2]` - Images
