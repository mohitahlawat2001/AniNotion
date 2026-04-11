const express = require('express');
const router = express.Router();
const scrapingConfigController = require('../controllers/scrapingConfigController');

// Note: Add your admin authentication middleware here
// e.g., const { requireAuth, requireAdmin } = require('../middleware/auth');

// Get all scraping configurations
router.get('/', scrapingConfigController.getAllConfigs);

// Get scraping statistics
router.get('/stats', scrapingConfigController.getScrapingStats);

// Get single configuration
router.get('/:id', scrapingConfigController.getConfigById);

// Create new configuration (Admin only)
router.post('/', scrapingConfigController.createConfig);

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
