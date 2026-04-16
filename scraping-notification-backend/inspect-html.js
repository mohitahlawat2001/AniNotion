#!/usr/bin/env node

/**
 * HTML Inspector - Save page HTML for manual analysis
 * Useful when automatic discovery doesn't work
 */

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const path = require('path');

// Add stealth plugin to bypass Cloudflare
puppeteer.use(StealthPlugin());

const url = process.argv[2];

if (!url) {
  console.log(`
Usage: node inspect-html.js <url>

Example: node inspect-html.js https://animekai.to/home

This will:
1. Fetch the page with Puppeteer
2. Wait for content to load
3. Save HTML to 'page-inspection.html'
4. Take a screenshot  
5. Print useful debugging info
  `);
  process.exit(0);
}

async function inspectPage() {
  console.log(`🔍 Inspecting: ${url}\n`);
  
  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox', 
      '--disable-setuid-sandbox', 
      '--disable-dev-shm-usage',
      '--disable-blink-features=AutomationControlled',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu'
    ]
  });
  
  const page = await browser.newPage();
  
  try {
    // Set realistic user agent and headers
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
      '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );
    await page.setViewport({ width: 1920, height: 1080 });
    
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
    });
    
    console.log('📡 Loading page...');
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
    
    // Wait for body content
    await page.waitForSelector('body');
    
    // Additional waits for dynamic content and Cloudflare
    console.log('⏳ Waiting for content and Cloudflare check (10 seconds)...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // Get HTML
    const html = await page.content();
    console.log(`✅ Page loaded: ${html.length} characters\n`);
    
    // Save HTML
    const htmlPath = path.join(__dirname, 'page-inspection.html');
    fs.writeFileSync(htmlPath, html);
    console.log(`💾 HTML saved to: ${htmlPath}`);
    
    // Take screenshot
    const screenshotPath = path.join(__dirname, 'page-screenshot.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`📸 Screenshot saved to: ${screenshotPath}\n`);
    
    // Analyze page structure
    const analysis = await page.evaluate(() => {
      const results = {
        title: document.title,
        bodyClasses: document.body.className,
        mainContainers: [],
        imageCount: 0,
        linkCount: 0,
        videoCount: 0
      };
      
      // Count elements
      results.imageCount = document.querySelectorAll('img').length;
      results.linkCount = document.querySelectorAll('a').length;
      results.videoCount = document.querySelectorAll('video, iframe').length;
      
      // Find main containers
      const containers = [
        ...document.querySelectorAll('[class*="container"]'),
        ...document.querySelectorAll('[class*="wrapper"]'),
        ...document.querySelectorAll('[class*="content"]'),
        ...document.querySelectorAll('main'),
        ...document.querySelectorAll('[class*="grid"]'),
        ...document.querySelectorAll('[class*="list"]')
      ];
      
      const seen = new Set();
      containers.forEach(el => {
        const selector = el.tagName.toLowerCase() + (el.className ? '.' + el.className.split(' ').join('.') : '');
        if (!seen.has(selector) && el.children.length > 2) {
          seen.add(selector);
          results.mainContainers.push({
            selector,
            childCount: el.children.length,
            hasImages: el.querySelectorAll('img').length > 0,
            hasLinks: el.querySelectorAll('a').length > 0
          });
        }
      });
      
      return results;
    });
    
    // Print analysis
    console.log('📊 PAGE ANALYSIS:\n');
    console.log(`  Title: ${analysis.title}`);
    console.log(`  Body Classes: ${analysis.bodyClasses || 'none'}`);
    console.log(`  Images: ${analysis.imageCount}`);
    console.log(`  Links: ${analysis.linkCount}`);
    console.log(`  Videos/iframes: ${analysis.videoCount}\n`);
    
    if (analysis.mainContainers.length > 0) {
      console.log('🎯 MAIN CONTAINERS FOUND:\n');
      analysis.mainContainers.slice(0, 5).forEach((container, i) => {
        console.log(`  ${i + 1}. ${container.selector.substring(0, 60)}`);
        console.log(`     Children: ${container.childCount}`);
        console.log(`     Has images: ${container.hasImages}`);
        console.log(`     Has links: ${container.hasLinks}\n`);
      });
    }
    
    // Try to find anime items
    console.log('🔍 SEARCHING FOR ANIME ITEMS:\n');
    
    const animeItems = await page.evaluate(() => {
      const patterns = [
        '[class*="anime"]',
        '[class*="episode"]',
        '[class*="item"]',
        '[class*="card"]',
        'article',
        '[data-id]'
      ];
      
      const found = [];
      patterns.forEach(pattern => {
        const elements = document.querySelectorAll(pattern);
        if (elements.length > 0 && elements.length < 100) {
          const first = elements[0];
          const hasImg = first.querySelector('img') !== null;
          const hasLink = first.querySelector('a') !== null;
          
          if (hasImg && hasLink) {
            found.push({
              selector: pattern,
              count: elements.length,
              sample: {
                html: first.outerHTML.substring(0, 200),
                classes: first.className
              }
            });
          }
        }
      });
      
      return found;
    });
    
    if (animeItems.length > 0) {
      animeItems.forEach(item => {
        console.log(`  ✓ Found ${item.count} items matching: ${item.selector}`);
        console.log(`    Classes: ${item.sample.classes}\n`);
      });
    } else {
      console.log('  ❌ No anime item containers found');
      console.log('     This might be a dynamic/lazy-loaded page');
      console.log('     Check the screenshot and HTML file manually\n');
    }
    
    console.log('💡 NEXT STEPS:\n');
    console.log('  1. Open page-inspection.html in a browser');
    console.log('  2. Use browser DevTools to inspect elements');
    console.log('  3. Look for repeating patterns of anime/episode items');
    console.log('  4. Note the CSS selectors for containers, images, titles, links');
    console.log('  5. Update the adapter in config/siteAdapters.js\n');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await browser.close();
  }
}

inspectPage().catch(console.error);
