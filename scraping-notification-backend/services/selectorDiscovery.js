const cheerio = require('cheerio');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

// Add stealth plugin for Cloudflare bypass
puppeteer.use(StealthPlugin());

/**
 * Selector Discovery Tool
 * Automatically analyzes anime site HTML to find correct selectors
 */
class SelectorDiscovery {
  constructor() {
    this.browser = null;
  }

  async getBrowser() {
    if (!this.browser || !this.browser.isConnected()) {
      this.browser = await puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-blink-features=AutomationControlled',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
          '--window-size=1920,1080'
        ]
      });
    }
    return this.browser;
  }

  async closeBrowser() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  /**
   * Fetch page HTML using Puppeteer with Cloudflare bypass
   */
  async fetchPage(url) {
    const browser = await this.getBrowser();
    const page = await browser.newPage();
    
    try {
      // Set realistic user agent
      await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
        '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      );
      await page.setViewport({ width: 1920, height: 1080 });
      
      // Set additional headers to look more like a real browser
      await page.setExtraHTTPHeaders({
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      });
      
      console.log(`[SelectorDiscovery] Fetching ${url}...`);
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
      
      // Wait for Cloudflare check and dynamic content (10 seconds)
      console.log(`[SelectorDiscovery] Waiting for Cloudflare check...`);
      await new Promise(resolve => setTimeout(resolve, 10000));
      
      const html = await page.content();
      console.log(`[SelectorDiscovery] Page loaded, HTML length: ${html.length}`);
      
      return html;
    } finally {
      await page.close();
    }
  }

  /**
   * Analyze HTML structure to find anime/episode containers
   */
  analyzeStructure(html) {
    const $ = cheerio.load(html);
    const analysis = {
      possibleContainers: [],
      possibleImages: [],
      possibleTitles: [],
      possibleLinks: [],
      possibleEpisodeNumbers: [],
      structure: {}
    };

    // Common container patterns
    const containerPatterns = [
      '[class*="episode"]',
      '[class*="anime"]',
      '[class*="item"]',
      '[class*="card"]',
      '[class*="release"]',
      '[class*="video"]',
      'article',
      '.grid > div',
      '.row > div',
      '[data-id]'
    ];

    containerPatterns.forEach(pattern => {
      const elements = $(pattern);
      if (elements.length > 3 && elements.length < 100) {
        const sample = elements.first();
        const hasImage = sample.find('img').length > 0;
        const hasLink = sample.find('a').length > 0;
        const hasText = sample.text().trim().length > 0;
        
        if (hasImage && hasLink && hasText) {
          analysis.possibleContainers.push({
            selector: pattern,
            count: elements.length,
            hasImage,
            hasLink,
            sample: this._getSampleData(sample, $)
          });
        }
      }
    });

    // Find images that might be thumbnails
    $('img').each((i, el) => {
      const $img = $(el);
      const src = $img.attr('src') || $img.attr('data-src');
      const parent = $img.parent();
      
      if (src && (src.includes('thumb') || src.includes('poster') || src.includes('cover'))) {
        analysis.possibleImages.push({
          selector: this._getSelector($img),
          src: src.substring(0, 100),
          alt: $img.attr('alt'),
          parentClass: parent.attr('class')
        });
      }
    });

    // Find titles
    $('h1, h2, h3, h4, .title, [class*="title"]').each((i, el) => {
      const $el = $(el);
      const text = $el.text().trim();
      
      if (text.length > 3 && text.length < 100) {
        analysis.possibleTitles.push({
          selector: this._getSelector($el),
          text: text.substring(0, 50),
          tag: el.name,
          class: $el.attr('class')
        });
      }
    });

    // Find links that might be watch/play links
    $('a').each((i, el) => {
      const $a = $(el);
      const href = $a.attr('href');
      const text = $a.text().trim().toLowerCase();
      
      if (href && (
        href.includes('watch') || 
        href.includes('play') || 
        href.includes('episode') ||
        text.includes('watch') ||
        text.includes('play')
      )) {
        analysis.possibleLinks.push({
          selector: this._getSelector($a),
          href: href.substring(0, 100),
          text: text.substring(0, 30),
          class: $a.attr('class')
        });
      }
    });

    // Find episode numbers
    $('[class*="episode"], [class*="ep"]').each((i, el) => {
      const $el = $(el);
      const text = $el.text().trim();
      const match = text.match(/\d+/);
      
      if (match) {
        analysis.possibleEpisodeNumbers.push({
          selector: this._getSelector($el),
          text: text.substring(0, 30),
          number: match[0],
          class: $el.attr('class')
        });
      }
    });

    return analysis;
  }

  /**
   * Get sample data from an element
   */
  _getSampleData(element, $) {
    const $el = $(element);
    return {
      html: $el.html()?.substring(0, 200) + '...',
      classes: $el.attr('class'),
      image: $el.find('img').attr('src') || $el.find('img').attr('data-src'),
      links: $el.find('a').map((i, a) => $(a).attr('href')).get().slice(0, 3),
      text: $el.text().trim().substring(0, 100)
    };
  }

  /**
   * Generate CSS selector for an element
   */
  _getSelector(element) {
    const el = element[0] || element;
    
    // Try ID first
    if (el.attribs?.id) {
      return `#${el.attribs.id}`;
    }
    
    // Try class
    if (el.attribs?.class) {
      const classes = el.attribs.class.split(' ').filter(c => c.length > 0);
      if (classes.length > 0) {
        return `.${classes.join('.')}`;
      }
    }
    
    // Fallback to tag name
    return el.name;
  }

  /**
   * Suggest selectors based on analysis
   */
  suggestSelectors(analysis) {
    const suggestions = {
      episodeWrap: null,
      thumbnail: null,
      animeName: null,
      watchLink: null,
      episodeNumber: null,
      confidence: 'low'
    };

    // Find best container
    if (analysis.possibleContainers.length > 0) {
      // Sort by count (prefer moderate numbers)
      const sorted = analysis.possibleContainers
        .filter(c => c.count >= 5 && c.count <= 50)
        .sort((a, b) => {
          // Prefer containers with more specific classes
          const scoreA = (a.sample.classes?.split(' ').length || 0) * 10 + a.count;
          const scoreB = (b.sample.classes?.split(' ').length || 0) * 10 + b.count;
          return scoreB - scoreA;
        });
      
      if (sorted.length > 0) {
        suggestions.episodeWrap = sorted[0].selector;
        suggestions.confidence = 'medium';
        
        // Analyze the first container's children
        const sample = sorted[0].sample;
        
        // Find thumbnail within container
        if (sample.image) {
          const imgPattern = this._extractPattern(sample.image);
          suggestions.thumbnail = 'img';
        }
        
        // Find watch link
        if (sample.links && sample.links.length > 0) {
          suggestions.watchLink = 'a';
        }
      }
    }

    // Find title selector
    if (analysis.possibleTitles.length > 0) {
      const titleWithClass = analysis.possibleTitles.find(t => t.class && t.class.includes('title'));
      suggestions.animeName = titleWithClass ? titleWithClass.selector : analysis.possibleTitles[0].selector;
    }

    // Find episode number selector
    if (analysis.possibleEpisodeNumbers.length > 0) {
      suggestions.episodeNumber = analysis.possibleEpisodeNumbers[0].selector;
    }

    // Find watch link
    if (analysis.possibleLinks.length > 0) {
      const watchLink = analysis.possibleLinks.find(l => 
        l.href.includes('watch') || l.text.includes('watch')
      );
      if (watchLink) {
        suggestions.watchLink = watchLink.selector;
        suggestions.confidence = 'high';
      }
    }

    return suggestions;
  }

  _extractPattern(text) {
    // Extract common patterns from text
    if (text.includes('thumb')) return 'thumb';
    if (text.includes('poster')) return 'poster';
    if (text.includes('cover')) return 'cover';
    if (text.includes('image')) return 'image';
    return 'img';
  }

  /**
   * Main discovery method
   */
  async discoverSelectors(url) {
    try {
      console.log(`\n=== Selector Discovery for ${url} ===\n`);
      
      // Fetch page
      const html = await this.fetchPage(url);
      
      // Analyze structure
      console.log('[SelectorDiscovery] Analyzing page structure...');
      const analysis = this.analyzeStructure(html);
      
      // Generate suggestions
      console.log('[SelectorDiscovery] Generating selector suggestions...');
      const suggestions = this.suggestSelectors(analysis);
      
      // Format report
      const report = {
        url,
        timestamp: new Date().toISOString(),
        suggestions,
        analysis: {
          containerCount: analysis.possibleContainers.length,
          imageCount: analysis.possibleImages.length,
          titleCount: analysis.possibleTitles.length,
          linkCount: analysis.possibleLinks.length
        },
        details: {
          topContainers: analysis.possibleContainers.slice(0, 3),
          topImages: analysis.possibleImages.slice(0, 3),
          topTitles: analysis.possibleTitles.slice(0, 3),
          topLinks: analysis.possibleLinks.slice(0, 3)
        }
      };
      
      // Print report
      this.printReport(report);
      
      return report;
      
    } catch (error) {
      console.error('[SelectorDiscovery] Error:', error.message);
      throw error;
    } finally {
      await this.closeBrowser();
    }
  }

  /**
   * Print formatted report
   */
  printReport(report) {
    console.log('\n╔════════════════════════════════════════════════╗');
    console.log('║         Selector Discovery Report             ║');
    console.log('╚════════════════════════════════════════════════╝\n');
    
    console.log(`URL: ${report.url}`);
    console.log(`Confidence: ${report.suggestions.confidence.toUpperCase()}\n`);
    
    console.log('📋 SUGGESTED SELECTORS:\n');
    console.log(`  episodeWrap:    ${report.suggestions.episodeWrap || 'NOT FOUND'}`);
    console.log(`  thumbnail:      ${report.suggestions.thumbnail || 'NOT FOUND'}`);
    console.log(`  animeName:      ${report.suggestions.animeName || 'NOT FOUND'}`);
    console.log(`  watchLink:      ${report.suggestions.watchLink || 'NOT FOUND'}`);
    console.log(`  episodeNumber:  ${report.suggestions.episodeNumber || 'NOT FOUND'}`);
    
    console.log('\n📊 ANALYSIS SUMMARY:\n');
    console.log(`  Possible Containers: ${report.analysis.containerCount}`);
    console.log(`  Possible Images:     ${report.analysis.imageCount}`);
    console.log(`  Possible Titles:     ${report.analysis.titleCount}`);
    console.log(`  Possible Links:      ${report.analysis.linkCount}`);
    
    if (report.details.topContainers.length > 0) {
      console.log('\n🎯 TOP CONTAINER CANDIDATES:\n');
      report.details.topContainers.forEach((container, i) => {
        console.log(`  ${i + 1}. ${container.selector}`);
        console.log(`     Count: ${container.count} elements`);
        console.log(`     Sample classes: ${container.sample.classes || 'none'}`);
        console.log(`     Has image: ${container.sample.image ? 'Yes' : 'No'}`);
        console.log(`     Has links: ${container.sample.links?.length || 0}`);
        console.log('');
      });
    }
    
    console.log('\n💡 NEXT STEPS:\n');
    console.log('  1. Review the suggested selectors above');
    console.log('  2. Test with the test-selectors command');
    console.log('  3. Update the site adapter if selectors work');
    console.log('  4. If not working, inspect the top container candidates');
    console.log('\n');
  }

  /**
   * Test selectors on a page
   */
  async testSelectors(url, selectors) {
    try {
      const html = await this.fetchPage(url);
      const $ = cheerio.load(html);
      
      const results = {
        episodeWrap: { found: false, count: 0, sample: null },
        thumbnail: { found: false, count: 0, sample: null },
        animeName: { found: false, count: 0, sample: null },
        watchLink: { found: false, count: 0, sample: null },
        episodeNumber: { found: false, count: 0, sample: null }
      };
      
      // Test episode wrap
      if (selectors.episodeWrap) {
        const $containers = $(selectors.episodeWrap);
        results.episodeWrap.count = $containers.length;
        results.episodeWrap.found = $containers.length > 0;
        
        if ($containers.length > 0) {
          const $first = $containers.first();
          
          // Test nested selectors
          if (selectors.thumbnail) {
            const $img = $first.find(selectors.thumbnail);
            results.thumbnail.count = $img.length;
            results.thumbnail.found = $img.length > 0;
            results.thumbnail.sample = $img.attr('src') || $img.attr('data-src');
          }
          
          if (selectors.animeName) {
            const $title = $first.find(selectors.animeName);
            results.animeName.count = $title.length;
            results.animeName.found = $title.length > 0;
            results.animeName.sample = $title.text().trim();
          }
          
          if (selectors.watchLink) {
            const $link = $first.find(selectors.watchLink);
            results.watchLink.count = $link.length;
            results.watchLink.found = $link.length > 0;
            results.watchLink.sample = $link.attr('href');
          }
          
          if (selectors.episodeNumber) {
            const $ep = $first.find(selectors.episodeNumber);
            results.episodeNumber.count = $ep.length;
            results.episodeNumber.found = $ep.length > 0;
            results.episodeNumber.sample = $ep.text().trim();
          }
        }
      }
      
      return results;
      
    } finally {
      await this.closeBrowser();
    }
  }
}

module.exports = SelectorDiscovery;
