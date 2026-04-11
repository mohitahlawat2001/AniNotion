const cron = require('node-cron');
const scrapingService = require('../services/scrapingService');

let scheduledTask = null;

// Start the scheduled scraping job
const startScheduler = () => {
  const intervalHours = parseInt(process.env.SCRAPE_INTERVAL_HOURS) || 6;
  
  // Run every X hours (default: 6 hours)
  // Cron format: minute hour day month weekday
  const cronExpression = `0 */${intervalHours} * * *`;
  
  console.log(`[Scheduler] Starting scraper with interval: every ${intervalHours} hours`);
  
  scheduledTask = cron.schedule(cronExpression, async () => {
    console.log(`[Scheduler] Running scheduled scrape at ${new Date().toISOString()}`);
    try {
      // Use scrapeAllActiveConfigs instead of default scraper
      const result = await scrapingService.scrapeAllActiveConfigs();
      await scrapingService.markOldReleasesAsNotNew();
      console.log('[Scheduler] Scheduled scrape completed:', result);
    } catch (error) {
      console.error('[Scheduler] Scheduled scrape failed:', error.message);
    }
  });

  console.log('[Scheduler] Scheduler started successfully');
  
  // Run an initial scrape on startup (optional)
  if (process.env.RUN_SCRAPE_ON_STARTUP !== 'false') {
    console.log('[Scheduler] Running initial scrape on startup...');
    setTimeout(async () => {
      try {
        await scrapingService.scrapeAllActiveConfigs();
        console.log('[Scheduler] Initial scrape completed');
      } catch (error) {
        console.error('[Scheduler] Initial scrape failed:', error.message);
      }
    }, 5000); // Wait 5 seconds after startup
  }
};

// Stop the scheduled job
const stopScheduler = () => {
  if (scheduledTask) {
    scheduledTask.stop();
    console.log('[Scheduler] Scheduler stopped');
  }
};

module.exports = {
  startScheduler,
  stopScheduler
};
