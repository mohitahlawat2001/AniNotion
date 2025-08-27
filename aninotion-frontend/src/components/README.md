# Reusable UI Components

This directory contains reusable UI components that can be used across different pages and layouts in the AniNotion application.

## Components

### 1. ClickableCorner
An animated corner CTA component with diagonal fold and hover effects.

**Props:**
- `onClick` (function): Click handler
- `text` (string): Text to display (default: "READ")
- `size` (string): Base size (default: "3.4rem")
- `hoverSize` (string): Size on hover (default: "3.9rem")
- `color` (string): Color theme - "emerald", "blue", "purple", "red" (default: "emerald")
- `layout` (string): "grid" or "list" (default: "grid")
- `className` (string): Additional CSS classes
- `title` (string): Tooltip text

**Usage:**
```jsx
import ClickableCorner from './components/ClickableCorner';

<ClickableCorner
  onClick={handleClick}
  text="VIEW"
  color="blue"
  layout="list"
/>
```

### 2. CategoryBadge
A reusable category badge component.

**Props:**
- `category` (object|string): Category object or string
- `showIcon` (boolean): Show tag icon (default: true)
- `size` (string): "sm", "md", "lg" (default: "sm")
- `className` (string): Additional CSS classes

**Usage:**
```jsx
import CategoryBadge from './components/CategoryBadge';

<CategoryBadge category={post.category} size="md" />
<CategoryBadge category="Anime" showIcon={false} />
```

### 3. ImageGallery
A reusable image gallery with navigation controls.

**Props:**
- `images` (array): Array of image URLs
- `alt` (string): Alt text for images
- `layout` (string): "grid" or "list" (default: "grid")
- `showCounter` (boolean): Show image counter (default: true)
- `maxHeight` (string): Maximum height class (default: "h-48")
- `className` (string): Additional CSS classes

**Usage:**
```jsx
import ImageGallery from './components/ImageGallery';

<ImageGallery
  images={post.images}
  alt={post.title}
  layout="grid"
/>
```

### 4. DateDisplay
A reusable date display component with consistent formatting.

**Props:**
- `date` (string): Date string
- `showIcon` (boolean): Show calendar icon (default: true)
- `format` (string): "short", "medium", "long" (default: "short")
- `className` (string): Additional CSS classes
- `iconSize` (number): Icon size (default: 14)

**Usage:**
```jsx
import DateDisplay from './components/DateDisplay';

<DateDisplay date={post.createdAt} format="medium" />
<DateDisplay date={post.createdAt} showIcon={false} />
```

## Benefits

1. **Consistency**: All components use the same styling and behavior patterns
2. **Maintainability**: Changes to one component affect all usages
3. **Reusability**: Components can be easily used in new pages/features
4. **Customization**: Flexible props allow for different use cases
5. **Accessibility**: Built-in accessibility features (ARIA labels, focus management)

## Example Usage in PostCard

The PostCard component now uses these reusable components:

```jsx
// Before: Inline styles and logic
<div className="absolute bottom-0 right-0 ...">...</div>

// After: Reusable component
<ClickableCorner onClick={handleClick} layout="grid" />
```

This approach makes the code cleaner, more maintainable, and allows for easy reuse across the application.</content>
<parameter name="filePath">/workspaces/AniNotion/aninotion-frontend/src/components/README.md
