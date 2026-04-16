# Scraping Tools - Quick Start

## Testing Anime Sites

### Find Accessible Sites
```bash
# Test multiple sites at once
node test-site-compatibility.js

# Test a specific site
node inspect-html.js https://anime-site.com
```

### Discover Selectors
```bash
# Once you find an accessible site
node discover-selectors.js https://accessible-site.com
```

## Tools Available

| Tool | Purpose | Usage |
|------|---------|-------|
| `test-site-compatibility.js` | Test multiple sites | `node test-site-compatibility.js` |
| `inspect-html.js` | Save HTML + screenshot | `node inspect-html.js <url>` |
| `discover-selectors.js` | Find CSS selectors | `node discover-selectors.js <url>` |

## Output Files

- `page-inspection.html` - Full page HTML
- `page-screenshot.png` - Visual screenshot

## Current Challenge

Most anime sites use Cloudflare protection. See [../ANIME_SITES_WORKING_GUIDE.md](../ANIME_SITES_WORKING_GUIDE.md) for solutions.

## Quick Links

- [Implementation Status](../MULTI_SITE_IMPLEMENTATION_STATUS.md)
- [Cloudflare Guide](./docs/CLOUDFLARE_PROTECTION.md)
- [Architecture](../MULTI_SITE_ARCHITECTURE.md)
