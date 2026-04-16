const ScrapingConfig = require('../models/ScrapingConfig');
const scrapingService = require('../services/scrapingService');

// Get all scraping configurations
exports.getAllConfigs = async (req, res) => {
  try {
    const configs = await ScrapingConfig.find()
      .populate('createdBy', 'username email')
      .populate('updatedBy', 'username email')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: configs
    });
  } catch (error) {
    console.error('Error fetching configs:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching scraping configurations',
      error: error.message
    });
  }
};

// Get single config by ID
exports.getConfigById = async (req, res) => {
  try {
    const config = await ScrapingConfig.findById(req.params.id)
      .populate('createdBy', 'username email')
      .populate('updatedBy', 'username email');
    
    if (!config) {
      return res.status(404).json({
        success: false,
        message: 'Scraping configuration not found'
      });
    }
    
    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    console.error('Error fetching config:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching scraping configuration',
      error: error.message
    });
  }
};

// Create new scraping configuration (Admin only)
exports.createConfig = async (req, res) => {
  try {
    const {
      name,
      sourceWebsite,
      sourceUrl,
      selectors,
      maxReleasesToScrape,
      requestDelayMs,
      scrapeIntervalHours,
      userAgents,
      customHeaders,
      useProxy,
      proxyUrl,
      enablePagination,
      maxPagesToScrape,
      paginationConfig
    } = req.body;
    
    // userId should come from auth middleware
    const userId = req.user?._id || req.body.createdBy;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required'
      });
    }

    const config = await ScrapingConfig.create({
      name,
      sourceWebsite,
      sourceUrl,
      selectors,
      maxReleasesToScrape,
      requestDelayMs,
      scrapeIntervalHours,
      userAgents,
      customHeaders,
      useProxy,
      proxyUrl,
      enablePagination,
      maxPagesToScrape,
      paginationConfig,
      createdBy: userId
    });
    
    res.status(201).json({
      success: true,
      message: 'Scraping configuration created successfully',
      data: config
    });
  } catch (error) {
    console.error('Error creating config:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating scraping configuration',
      error: error.message
    });
  }
};

// Update scraping configuration (Admin only)
exports.updateConfig = async (req, res) => {
  try {
    const configId = req.params.id;
    const userId = req.user?._id || req.body.updatedBy;
    
    const config = await ScrapingConfig.findById(configId);
    
    if (!config) {
      return res.status(404).json({
        success: false,
        message: 'Scraping configuration not found'
      });
    }
    
    // Update fields
    const updateFields = [
      'name', 'sourceWebsite', 'sourceUrl', 'selectors',
      'maxReleasesToScrape', 'requestDelayMs', 'isActive',
      'scrapeIntervalHours', 'userAgents', 'customHeaders',
      'useProxy', 'proxyUrl', 'enablePagination', 'maxPagesToScrape',
      'paginationConfig'
    ];
    
    updateFields.forEach(field => {
      if (req.body[field] !== undefined) {
        config[field] = req.body[field];
      }
    });
    
    if (userId) {
      config.updatedBy = userId;
    }
    
    await config.save();
    
    res.json({
      success: true,
      message: 'Scraping configuration updated successfully',
      data: config
    });
  } catch (error) {
    console.error('Error updating config:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating scraping configuration',
      error: error.message
    });
  }
};

// Delete scraping configuration (Admin only)
exports.deleteConfig = async (req, res) => {
  try {
    const config = await ScrapingConfig.findByIdAndDelete(req.params.id);
    
    if (!config) {
      return res.status(404).json({
        success: false,
        message: 'Scraping configuration not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Scraping configuration deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting config:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting scraping configuration',
      error: error.message
    });
  }
};

// Test a scraping configuration without saving results
exports.testConfig = async (req, res) => {
  try {
    const configId = req.params.id;
    const config = await ScrapingConfig.findById(configId);
    
    if (!config) {
      return res.status(404).json({
        success: false,
        message: 'Scraping configuration not found'
      });
    }
    
    // Run scraper but don't save
    const releases = await scrapingService.scrapeWithConfig(config);
    
    res.json({
      success: true,
      message: `Test scrape completed successfully`,
      data: {
        releasesFound: releases.length,
        sampleReleases: releases.slice(0, 5), // Return first 5 as sample
        config: {
          name: config.name,
          sourceWebsite: config.sourceWebsite,
          sourceUrl: config.sourceUrl
        }
      }
    });
  } catch (error) {
    console.error('Error testing config:', error);
    res.status(500).json({
      success: false,
      message: 'Error testing scraping configuration',
      error: error.message
    });
  }
};

// Trigger scrape for specific config
exports.triggerConfigScrape = async (req, res) => {
  try {
    const configId = req.params.id;
    const config = await ScrapingConfig.findById(configId);
    
    if (!config) {
      return res.status(404).json({
        success: false,
        message: 'Scraping configuration not found'
      });
    }
    
    if (!config.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Cannot scrape inactive configuration'
      });
    }
    
    // Run scraper and save
    const releases = await scrapingService.scrapeWithConfig(config);
    const result = await scrapingService.saveReleases(releases);
    
    // Update config stats
    config.lastScrapedAt = new Date();
    config.lastScrapeStatus = 'success';
    config.totalReleasesFetched += result.savedCount;
    await config.save();
    
    res.json({
      success: true,
      message: `Scraping completed for ${config.name}`,
      data: {
        ...result,
        config: {
          name: config.name,
          sourceWebsite: config.sourceWebsite
        }
      }
    });
  } catch (error) {
    console.error('Error triggering config scrape:', error);
    
    // Update config with error
    if (req.params.id) {
      const config = await ScrapingConfig.findById(req.params.id);
      if (config) {
        config.lastScrapedAt = new Date();
        config.lastScrapeStatus = 'failed';
        config.lastScrapeError = error.message;
        await config.save();
      }
    }
    
    res.status(500).json({
      success: false,
      message: 'Error triggering scrape',
      error: error.message
    });
  }
};

// Toggle config active status
exports.toggleConfigStatus = async (req, res) => {
  try {
    const config = await ScrapingConfig.findById(req.params.id);
    
    if (!config) {
      return res.status(404).json({
        success: false,
        message: 'Scraping configuration not found'
      });
    }
    
    config.isActive = !config.isActive;
    if (req.user?._id || req.body.updatedBy) {
      config.updatedBy = req.user?._id || req.body.updatedBy;
    }
    await config.save();
    
    res.json({
      success: true,
      message: `Configuration ${config.isActive ? 'activated' : 'deactivated'} successfully`,
      data: config
    });
  } catch (error) {
    console.error('Error toggling config status:', error);
    res.status(500).json({
      success: false,
      message: 'Error toggling configuration status',
      error: error.message
    });
  }
};

// Get scraping statistics
exports.getScrapingStats = async (req, res) => {
  try {
    const totalConfigs = await ScrapingConfig.countDocuments();
    const activeConfigs = await ScrapingConfig.countDocuments({ isActive: true });
    const successfulScrapes = await ScrapingConfig.countDocuments({ lastScrapeStatus: 'success' });
    const failedScrapes = await ScrapingConfig.countDocuments({ lastScrapeStatus: 'failed' });
    
    const totalReleasesFetched = await ScrapingConfig.aggregate([
      { $group: { _id: null, total: { $sum: '$totalReleasesFetched' } } }
    ]);
    
    const recentScrapes = await ScrapingConfig.find()
      .sort({ lastScrapedAt: -1 })
      .limit(10)
      .select('name sourceWebsite lastScrapedAt lastScrapeStatus totalReleasesFetched');
    
    res.json({
      success: true,
      data: {
        totalConfigs,
        activeConfigs,
        inactiveConfigs: totalConfigs - activeConfigs,
        successfulScrapes,
        failedScrapes,
        totalReleasesFetched: totalReleasesFetched[0]?.total || 0,
        recentScrapes
      }
    });
  } catch (error) {
    console.error('Error fetching scraping stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching scraping statistics',
      error: error.message
    });
  }
};

// NEW: Test scraping any URL without saving
exports.testScrapeUrl = async (req, res) => {
  try {
    const { url, maxReleases, enablePagination, maxPages } = req.body;
    
    if (!url) {
      return res.status(400).json({
        success: false,
        message: 'URL is required'
      });
    }
    
    console.log(`[API] Testing scrape for URL: ${url}`);
    
    const options = {
      maxReleases: maxReleases || 20,
      enablePagination: enablePagination || false,
      maxPages: maxPages || 1
    };
    
    const result = await scrapingService.testScrape(url, options);
    
    res.json({
      success: result.success,
      data: result
    });
    
  } catch (error) {
    console.error('Error testing scrape:', error);
    res.status(500).json({
      success: false,
      message: 'Error testing scrape',
      error: error.message
    });
  }
};

// NEW: Quick scrape and save from any URL
exports.quickScrapeUrl = async (req, res) => {
  try {
    const { url, maxReleases, enablePagination, maxPages } = req.body;
    
    if (!url) {
      return res.status(400).json({
        success: false,
        message: 'URL is required'
      });
    }
    
    console.log(`[API] Quick scrape and save for URL: ${url}`);
    
    const options = {
      maxReleases: maxReleases || 50,
      enablePagination: enablePagination !== undefined ? enablePagination : false,
      maxPages: maxPages || 1
    };
    
    const result = await scrapingService.quickScrapeAndSave(url, options);
    
    res.json({
      success: true,
      message: `Scraped and saved ${result.savedCount} new releases (${result.duplicateCount} duplicates skipped)`,
      data: result
    });
    
  } catch (error) {
    console.error('Error in quick scrape:', error);
    res.status(500).json({
      success: false,
      message: 'Error scraping and saving releases',
      error: error.message
    });
  }
};

// NEW: Create config from URL (auto-detect site)
exports.createConfigFromUrl = async (req, res) => {
  try {
    const { url, configName } = req.body;
    
    if (!url) {
      return res.status(400).json({
        success: false,
        message: 'URL is required'
      });
    }
    
    console.log(`[API] Creating config for URL: ${url}`);
    
    const config = await scrapingService.createConfigFromUrl(url, configName);
    
    res.status(201).json({
      success: true,
      message: 'Scraping configuration created successfully',
      data: config
    });
    
  } catch (error) {
    console.error('Error creating config from URL:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating configuration',
      error: error.message
    });
  }
};

// NEW: Get available site adapters
exports.getAvailableAdapters = async (req, res) => {
  try {
    const { getAllAdapters } = require('../config/siteAdapters');
    const adapters = getAllAdapters();
    
    // Format adapters for display
    const formattedAdapters = Object.entries(adapters).map(([key, adapter]) => ({
      key,
      name: adapter.name,
      sourceWebsite: adapter.sourceWebsite,
      domains: adapter.domains,
      defaultUrl: adapter.defaultUrl,
      supportsPagination: adapter.settings?.enablePagination || false,
      usesPuppeteer: adapter.settings?.usePuppeteer || false
    }));
    
    res.json({
      success: true,
      data: formattedAdapters
    });
    
  } catch (error) {
    console.error('Error fetching adapters:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching available adapters',
      error: error.message
    });
  }
};
