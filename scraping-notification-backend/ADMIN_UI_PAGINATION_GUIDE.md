# Admin UI Quick Reference - Pagination Settings

## Accessing Pagination Settings

1. Navigate to **Admin > Scraping Configurations**
2. Click **"New Configuration"** or **Edit** existing config
3. Scroll to **"Pagination Settings (Multi-Page Scraping)"** section
4. Click the arrow to expand the section

## Configuration Fields

### Basic Settings

#### Enable Multi-Page Scraping
- **Type**: Checkbox
- **Default**: Unchecked
- **Description**: Turn on/off multi-page scraping for this configuration

#### Max Pages to Scrape
- **Type**: Number input
- **Range**: 1-100 pages
- **Default**: 1
- **Description**: Maximum number of pages to scrape per run
- **Tip**: Shows estimated total items (pages × items per page)

### Auto-Detection Settings (Recommended)

#### Auto-detect next page links
- **Type**: Checkbox
- **Default**: Checked
- **Description**: Let the scraper automatically find pagination
- **How it works**: Tries multiple strategies to find the next page

#### URL Pattern
- **Type**: Text input
- **Placeholder**: `?page={page}`
- **Description**: URL pattern for pagination
- **Examples**:
  - `?page={page}` → `https://site.com/?page=2`
  - `/page/{page}` → `https://site.com/page/2`
  - `?p={page}&sort=latest` → `https://site.com/?p=2&sort=latest`
- **Note**: Use `{page}` as placeholder for page number

#### Next Link Selectors
- **Type**: Comma-separated text
- **Placeholder**: `a.next-page, a[rel=next]`
- **Description**: CSS selectors to find next page button/link
- **Examples**:
  - `a.next-page` - Link with class "next-page"
  - `a[rel="next"]` - Link with rel="next" attribute
  - `.pagination a:last-child` - Last link in pagination
- **Note**: Multiple selectors tried in order until one matches

#### Pagination Container
- **Type**: Text input
- **Placeholder**: `.pagination`
- **Description**: Parent element containing pagination controls
- **Examples**:
  - `.pagination` - Element with "pagination" class
  - `nav[role="navigation"]` - Nav element with navigation role
  - `.pager` - Element with "pager" class

## Detection Strategies

The scraper tries these methods **in order**:

### 1. Next Link Selectors (Highest Priority)
- Looks for elements matching configured selectors
- Extracts `href` attribute from found links
- **Best for**: Sites with "Next" buttons or links

### 2. URL Pattern
- Uses configured pattern to construct next page URL
- Increments page number automatically
- **Best for**: Sites with predictable URLs

### 3. Data Attributes
- Looks for `data-page` or similar attributes
- Extracts page numbers from HTML
- **Best for**: Sites using JavaScript pagination

### 4. Auto-Detection Fallback
- Analyzes pagination HTML structure
- Extracts page numbers from text content
- Constructs URLs based on pattern
- **Best for**: Standard pagination patterns

## Configuration Examples

### Example 1: Simple Query Parameter Pagination
```
URL Pattern: ?page={page}
Next Link Selectors: a.next-page
Container: .pagination
```
- Works with: `https://site.com/?page=2`

### Example 2: Path-Based Pagination
```
URL Pattern: /page/{page}
Next Link Selectors: a[rel="next"]
Container: nav.pagination
```
- Works with: `https://site.com/page/2`

### Example 3: Complex Query String
```
URL Pattern: ?p={page}&sort=latest&type=anime
Next Link Selectors: .next-button, a.pagination-next
Container: .pagination-wrapper
```
- Works with: `https://site.com/?p=2&sort=latest&type=anime`

### Example 4: Auto-Detect Only
```
Auto-detect: ✓ (checked)
URL Pattern: (leave empty)
Next Link Selectors: (leave empty)
Container: (leave empty)
```
- Scraper analyzes site and finds pagination automatically

## Best Practices

### 1. Start Small
- Begin with `maxPagesToScrape: 3` to test
- Increase gradually after confirming it works
- Monitor for rate limiting or blocks

### 2. Use Auto-Detect First
- Enable auto-detect for initial testing
- Only configure manual selectors if it fails
- Check browser console for detection logs

### 3. Respect Rate Limits
- Keep delays between pages (5-10 seconds)
- Don't scrape too many pages at once
- Consider scraping during off-peak hours

### 4. Monitor Results
- Check "Total Releases Fetched" after scraping
- Verify expected count (pages × items per page)
- Look for duplicate rates (should be low)

### 5. Test Configuration
- Use "Test Configuration" button before saving
- Verify it finds pagination correctly
- Check extracted URLs in test results

## Troubleshooting

### Problem: Only 1 page scraped
**Possible Causes**:
- Auto-detect failed to find next page
- URL pattern incorrect
- Selectors don't match site structure

**Solutions**:
1. Open browser dev tools on target site
2. Find the "Next" button in HTML
3. Copy its CSS selector
4. Add to "Next Link Selectors" field
5. Test again

### Problem: Wrong pages scraped
**Possible Causes**:
- URL pattern doesn't match site
- Page numbers start at 0 instead of 1

**Solutions**:
1. Check actual pagination URLs on site
2. Adjust URL pattern to match
3. Consider using relative URLs

### Problem: Too many duplicates
**Possible Causes**:
- Pages overlap (showing same content)
- Site updated while scraping

**Solutions**:
1. Reduce scraping frequency
2. Check if site uses infinite scroll
3. Verify page numbers are correct

### Problem: Scraping times out
**Possible Causes**:
- Too many pages requested
- Site has aggressive rate limiting
- Slow network or server

**Solutions**:
1. Reduce `maxPagesToScrape`
2. Increase `requestDelayMs` between pages
3. Enable proxy if available

## Performance Tips

### Optimal Settings for Different Scenarios

#### Daily Update (Frequent)
```
maxPagesToScrape: 3-5
requestDelayMs: 5000
scrapeIntervalHours: 6
```
- Captures recent releases
- Low server load
- Fast completion

#### Full Catalog Sync (Rare)
```
maxPagesToScrape: 20-50
requestDelayMs: 10000
scrapeIntervalHours: 168 (weekly)
```
- Complete data capture
- Respectful of server
- Long-running job

#### Test/Development
```
maxPagesToScrape: 2
requestDelayMs: 2000
scrapeIntervalHours: 24
```
- Quick testing
- Minimal impact
- Fast iteration

## Field Validation

### Max Pages to Scrape
- ✅ Valid: 1-100
- ❌ Invalid: 0, negative, > 100
- **Default**: 1 (if invalid)

### URL Pattern
- ✅ Valid: Contains `{page}` placeholder
- ⚠️ Warning: Without `{page}`, same URL used for all pages
- **Example**: `?page={page}`, `/p{page}`, `/page/{page}/`

### Next Link Selectors
- ✅ Valid: Valid CSS selectors
- ⚠️ Optional: Can be empty if using auto-detect
- **Format**: Comma-separated list

## API Integration

The pagination settings are saved in the config as:

```json
{
  "enablePagination": true,
  "maxPagesToScrape": 3,
  "paginationConfig": {
    "autoDetect": true,
    "urlPattern": "?page={page}",
    "nextLinkSelectors": ["a.next-page", "a[rel=\"next\"]"],
    "pageAttributeSelector": "[data-page]",
    "containerSelector": ".pagination"
  }
}
```

## Keyboard Shortcuts

- **Tab**: Move between fields
- **Space**: Toggle checkboxes
- **Enter**: Submit form (when in text input)
- **Esc**: Cancel form

## Visual Indicators

- 📊 **Estimated Total**: Shows `pages × items` calculation
- 💡 **Tip Box**: Blue box with helpful information
- ⚠️ **Warnings**: Yellow alerts for potential issues
- ✅ **Success**: Green indicators for valid settings

## Getting Help

If pagination isn't working:
1. Check PAGINATION_GUIDE.md for detailed strategies
2. Review MULTI_PAGE_SCRAPING_TEST.md for examples
3. Enable debug logging in backend
4. Test with browser dev tools open
5. Contact admin if issue persists

---

**Last Updated**: 2026-04-01
**Version**: 1.0
