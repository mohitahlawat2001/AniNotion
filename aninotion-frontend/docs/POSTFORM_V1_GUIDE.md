# PostFormV1 - List View Style Form with Live Preview

## Overview

PostFormV1 is a modern, user-friendly post creation/editing form that features a split-screen layout with real-time preview. It's designed to mimic the Twitter/X-style list view appearance that users see in the feed, making it easier to visualize how posts will look before publishing.

## Key Features

### 1. Split-Screen Layout
- **Left Panel**: All form inputs in a scrollable container
- **Right Panel**: Live preview that updates in real-time as you type

### 2. Live Preview
- Shows exactly how your post will appear in the list view feed
- Updates automatically as you fill in the form
- Includes:
  - Title and content preview with truncation
  - Anime name with season/episode information
  - Category badge
  - Image gallery preview (supports 1-4 images with different layouts)
  - Engagement stats placeholder (views, likes, bookmarks)
  - Date display

### 3. Twitter/X-Style Design
- Circular avatar/category icon
- Horizontal layout similar to social media posts
- Clean, modern aesthetic matching PostCard list view

### 4. Form Features
All the same powerful features as the classic PostForm:
- Category selection
- Title and content fields
- Anime/Manga name with auto-suggest from MyAnimeList
- Season and episode number tracking
- Multiple image upload
- Paste images directly (Ctrl+V)
- Image URL support
- Tags and excerpt fields
- Status selection (Published/Draft)

## Usage

### Basic Usage
```jsx
import PostFormV1 from '../components/PostFormV1';

function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);
  
  const handleSubmit = async (postData) => {
    console.log('New post:', postData);
    // Handle post creation
  };
  
  return (
    <PostFormV1
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      onSubmit={handleSubmit}
    />
  );
}
```

### Edit Mode
```jsx
<PostFormV1
  isOpen={isEditOpen}
  onClose={() => setIsEditOpen(false)}
  onSubmit={handleUpdate}
  initialData={existingPost}
  isEdit={true}
/>
```

## Toggle Between Forms

Use `PostFormWithToggle` to allow users to switch between Classic and V1 forms:

```jsx
import PostFormWithToggle from '../components/PostFormWithToggle';

<PostFormWithToggle
  isOpen={isFormOpen}
  onClose={() => setIsFormOpen(false)}
  onSubmit={handleCreatePost}
/>
```

The component automatically:
- Saves user's preference to localStorage
- Displays a toggle button in the top-right corner
- Persists the selection across sessions

## Layout Comparison

### Classic PostForm
- Vertical single-column layout
- All fields stacked top to bottom
- Traditional form appearance
- Good for users who prefer traditional forms

### PostFormV1
- Split-screen horizontal layout
- Form inputs on left, live preview on right
- Social media-style preview
- Better visualization of final post appearance
- Ideal for users who want instant feedback

## Responsive Design

- **Desktop (≥1024px)**: Full split-screen with both panels visible
- **Tablet (768px - 1023px)**: Stacked layout, preview below form
- **Mobile (≤767px)**: Optimized mobile layout with compact inputs

## Image Preview Layouts

PostFormV1 intelligently handles different numbers of images:

### 1 Image
- Full-width display
- Max height of 320px

### 2 Images
- Side-by-side grid (2 columns)
- Equal height at 192px each

### 3 Images
- First image takes left side (full height)
- Second and third images stacked on right (96px each)

### 4+ Images
- 2x2 grid showing first 4 images
- Each image at 128px height

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `isOpen` | boolean | Yes | - | Controls form visibility |
| `onClose` | function | Yes | - | Called when form is closed |
| `onSubmit` | function | Yes | - | Called when form is submitted |
| `initialData` | object | No | null | Initial post data for editing |
| `isEdit` | boolean | No | false | Whether in edit mode |

## Form Data Structure

```javascript
{
  title: string,           // Required
  animeName: string,       // Required
  category: string,        // Required (category ID)
  content: string,         // Required
  seasonNumber: number,    // Optional
  episodeNumber: number,   // Optional
  images: array,           // Optional (base64 or URLs)
  imageTypes: array,       // Optional (boolean array)
  tags: string,           // Optional (comma-separated)
  excerpt: string,        // Optional
  status: string          // 'published' or 'draft'
}
```

## Benefits

1. **Instant Feedback**: See exactly how your post will look before publishing
2. **Better UX**: Split-screen design reduces cognitive load
3. **Consistency**: Preview matches actual PostCard appearance
4. **Modern Design**: Twitter/X-style interface feels familiar to users
5. **Same Power**: All features of classic form with better visualization

## Environment Configuration

### VITE_ENABLE_POST_FORM_TOGGLE

Controls whether the toggle button between Classic and List View forms is shown.

- **Type**: `boolean` (as string)
- **Default**: `false`
- **Values**: `"true"` or `"false"`

**Behavior:**
- `false` (default): Only List View (PostFormV1) is available, no toggle button shown
- `true`: Toggle button appears allowing users to switch between Classic and List View

**Usage:**
```bash
# In .env file
VITE_ENABLE_POST_FORM_TOGGLE=true  # Show toggle
VITE_ENABLE_POST_FORM_TOGGLE=false # Hide toggle, use List View only
```

**Default Behavior:**
By default, the application uses List View (PostFormV1) exclusively. The toggle is hidden to provide a cleaner, more focused user experience. Developers can enable the toggle during development or for A/B testing by setting the environment variable to `true`.

## Migration Guide

If you're upgrading from PostForm to PostFormWithToggle:

1. Replace imports:
   ```jsx
   // Old
   import PostForm from '../components/PostForm';
   
   // New
   import PostFormWithToggle from '../components/PostFormWithToggle';
   ```

2. Update component usage:
   ```jsx
   // Old
   <PostForm isOpen={...} onClose={...} onSubmit={...} />
   
   // New (same props!)
   <PostFormWithToggle isOpen={...} onClose={...} onSubmit={...} />
   ```

3. **Optional**: Enable toggle in development:
   ```bash
   # In .env
   VITE_ENABLE_POST_FORM_TOGGLE=true
   ```

4. That's it! The wrapper handles everything else.

## Technical Details

- Built with React hooks (useState, useEffect, useRef)
- Uses react-hook-form for form management
- Integrates with MyAnimeList API for anime suggestions
- Supports keyboard navigation in anime suggestions
- Implements debounced search for better performance
- Base64 encoding for image uploads
- LocalStorage for form version preference

## Future Enhancements

Potential improvements:
- Rich text editor for content
- Drag-and-drop image reordering
- Image cropping/editing
- Auto-save drafts
- Character counter
- Emoji picker
- Markdown support
