# Rich Text Editor Implementation

## Overview

The AniNotion platform now features a **Rich Text Editor** for creating and editing post content. Users can format their anime/manga reviews and thoughts with various text styles, lists, links, and more.

## Features

### Text Formatting
- **Bold** (`Ctrl+B`) - Make text stand out
- *Italic* (`Ctrl+I`) - Emphasize text
- <u>Underline</u> (`Ctrl+U`) - Underline important text
- ~~Strikethrough~~ - Strike through text

### Structure
- **Headings** - Create section headers (H2)
- **Normal Text** - Return to paragraph format
- **Bullet Lists** - Create unordered lists
- **Numbered Lists** - Create ordered lists

### Alignment
- Align Left
- Align Center
- Align Right

### Advanced Features
- **Links** - Insert hyperlinks to external content
- **Quotes** - Create blockquote sections
- **Code Blocks** - Format code snippets
- **Undo/Redo** - Revert or reapply changes

## How to Use

### Creating a Post

1. Click on "Create Post" button
2. Fill in the required fields (Title, Anime Name, Category)
3. Use the **rich text toolbar** above the content area to format your text:
   - Select text and click formatting buttons
   - Use keyboard shortcuts for quick formatting
   - Click the link icon to add URLs
4. Your formatting is saved automatically

### Editing a Post

1. Click the edit button on any post
2. The content will load with all existing formatting preserved
3. Make your changes using the rich text editor
4. Click "Update Post" to save

## Components

### `RichTextEditor.jsx`
The main rich text editing component with a toolbar for formatting options.

**Props:**
- `value` (string) - HTML content to display
- `onChange` (function) - Callback when content changes
- `placeholder` (string) - Placeholder text
- `minHeight` (string) - Minimum height (e.g., "200px")

**Example:**
```jsx
<RichTextEditor
  value={contentHtml}
  onChange={(html) => setContentHtml(html)}
  placeholder="Write your content..."
  minHeight="300px"
/>
```

### `RichTextDisplay.jsx`
Component to safely display HTML content with proper styling.

**Props:**
- `content` (string) - HTML content to display
- `className` (string) - Additional CSS classes

**Example:**
```jsx
<RichTextDisplay 
  content={post.content} 
  className="my-4"
/>
```

## Integration

### In Post Forms

Both `PostForm.jsx` and `PostFormV1.jsx` now use the rich text editor:

```jsx
// State for rich text content
const [contentHtml, setContentHtml] = useState('');

// In the form
<RichTextEditor
  value={contentHtml}
  onChange={(html) => {
    setContentHtml(html);
    setValue('content', html);
  }}
  placeholder="Share your thoughts..."
  minHeight="300px"
/>
```

### Displaying Posts

When displaying post content, use the `RichTextDisplay` component to ensure proper HTML rendering:

```jsx
import RichTextDisplay from './RichTextDisplay';

// In your component
<RichTextDisplay content={post.content} />
```

## Backend Considerations

The backend stores content as HTML strings in the database. No changes are required to the backend API as it already handles string content.

### Data Format
```json
{
  "title": "My Anime Review",
  "content": "<p>This is <strong>bold</strong> text with a <a href='...'>link</a></p>",
  "animeName": "Attack on Titan"
}
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+B` | Bold |
| `Ctrl+I` | Italic |
| `Ctrl+U` | Underline |
| `Ctrl+Z` | Undo |
| `Ctrl+Y` | Redo |

## Browser Compatibility

The rich text editor uses standard browser APIs:
- `contentEditable` - Supported in all modern browsers
- `document.execCommand` - Widely supported (legacy API but stable)

**Compatible with:**
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Styling

The editor applies consistent styling that matches between editing and display modes:

- **Headings**: Larger, bold text for section titles
- **Lists**: Proper indentation and bullets/numbers
- **Links**: Blue, underlined, hover effects
- **Quotes**: Left border with italic text
- **Code**: Gray background, monospace font

## Security

⚠️ **Important**: The content uses `dangerouslySetInnerHTML` for display. Always ensure:
1. Content is sanitized on the backend if accepting from untrusted sources
2. Only authenticated users can create/edit posts
3. Consider adding HTML sanitization library like `DOMPurify` for additional protection

## Future Enhancements

Potential improvements for future versions:

1. **Image Upload in Editor** - Drag & drop images directly into content
2. **Emoji Picker** - Quick emoji insertion
3. **Table Support** - Create data tables
4. **Font Colors** - Custom text and background colors
5. **Font Size** - Adjustable text sizes
6. **Markdown Support** - Alternative markdown input mode
7. **Auto-save Drafts** - Save content as user types
8. **Character Counter** - Show word/character count
9. **Fullscreen Mode** - Distraction-free writing
10. **Custom Styles** - User-defined text styles

## Troubleshooting

### Content Not Saving
- Ensure the hidden input field is properly registered with `react-hook-form`
- Check that `onChange` handler calls `setValue('content', html)`

### Formatting Lost on Edit
- Verify that `setContentHtml()` is called in the `useEffect` when loading initial data
- Check that HTML content is properly loaded from the API

### Toolbar Buttons Not Working
- Ensure `document.execCommand` is supported in the browser
- Check that the editor div has `contentEditable` attribute

### Styling Issues
- Verify the `prose` CSS classes are being applied
- Check that the inline `<style>` tag is rendered

## Support

For issues or questions about the rich text editor, please:
1. Check this documentation
2. Review the component code in `/src/components/RichTextEditor.jsx`
3. Open an issue on the repository with details

---

**Last Updated**: January 2025
**Version**: 1.0.0
