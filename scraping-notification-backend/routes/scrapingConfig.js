const express = require('express');
const router = express.Router();
const scrapingConfigController = require('../controllers/scrapingConfigController');

// Note: Add your admin authentication middleware here
// e.g., const { requireAuth, requireAdmin } = require('../middleware/auth');

// Get all scraping configurations
router.get('/', scrapingConfigController.getAllConfigs);

// Get scraping statistics
router.get('/stats', scrapingConfigController.getScrapingStats);

// NEW: Get available site adapters
router.get('/adapters/available', scrapingConfigController.getAvailableAdapters);

// Get single configuration
router.get('/:id', scrapingConfigController.getConfigById);

// Create new configuration (Admin only)
router.post('/', scrapingConfigController.createConfig);

// NEW: Test scraping any URL (without saving)
router.post('/test-url', scrapingConfigController.testScrapeUrl);

// NEW: Quick scrape and save from any URL
router.post('/quick-scrape', scrapingConfigController.quickScrapeUrl);

// NEW: Create config from URL (auto-detect site)
router.post('/from-url', scrapingConfigController.createConfigFromUrl);

// Update configuration (Admin only)
router.put('/:id', scrapingConfigController.updateConfig);

// Delete configuration (Admin only)
router.delete('/:id', scrapingConfigController.deleteConfig);

// Test configuration (doesn't save results)
router.post('/:id/test', scrapingConfigController.testConfig);

// Trigger scrape for specific configuration
router.post('/:id/scrape', scrapingConfigController.triggerConfigScrape);

// Toggle configuration active status
router.patch('/:id/toggle', scrapingConfigController.toggleConfigStatus);

module.exports = router;
