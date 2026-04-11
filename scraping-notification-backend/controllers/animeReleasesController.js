const AnimeRelease = require('../models/AnimeRelease');
const scrapingService = require('../services/scrapingService');

// Get all anime releases with pagination and filters
exports.getAnimeReleases = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;
    
    // Filter options
    const filter = {};
    if (req.query.isNew === 'true') filter.isNew = true;
    if (req.query.animeName) filter.animeName = new RegExp(req.query.animeName, 'i');
    
    // Get releases with pagination
    const releases = await AnimeRelease.find(filter)
      .sort({ releaseDate: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    
    // Get total count
    const total = await AnimeRelease.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);
    
    res.json({
      success: true,
      data: releases,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore: page < totalPages
      }
    });
  } catch (error) {
    console.error('Error fetching anime releases:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching anime releases',
      error: error.message
    });
  }
};

// Get single anime release by ID
exports.getAnimeReleaseById = async (req, res) => {
  try {
    const release = await AnimeRelease.findById(req.params.id);
    
    if (!release) {
      return res.status(404).json({
        success: false,
        message: 'Anime release not found'
      });
    }
    
    res.json({
      success: true,
      data: release
    });
  } catch (error) {
    console.error('Error fetching anime release:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching anime release',
      error: error.message
    });
  }
};

// Mark releases as seen by user
exports.markAsSeen = async (req, res) => {
  try {
    const { releaseIds, userId } = req.body;
    
    if (!releaseIds || !Array.isArray(releaseIds)) {
      return res.status(400).json({
        success: false,
        message: 'releaseIds array is required'
      });
    }
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'userId is required'
      });
    }
    
    // Update releases to add userId to seenBy array
    const result = await AnimeRelease.updateMany(
      { 
        _id: { $in: releaseIds },
        seenBy: { $ne: userId }
      },
      { 
        $addToSet: { seenBy: userId }
      }
    );
    
    res.json({
      success: true,
      message: `Marked ${result.modifiedCount} releases as seen`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Error marking releases as seen:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking releases as seen',
      error: error.message
    });
  }
};

// Get statistics about anime releases
exports.getStats = async (req, res) => {
  try {
    const { userId } = req.query;
    
    const total = await AnimeRelease.countDocuments();
    const newCount = await AnimeRelease.countDocuments({ isNew: true });
    
    let unseenCount = newCount;
    if (userId) {
      unseenCount = await AnimeRelease.countDocuments({
        isNew: true,
        seenBy: { $ne: userId }
      });
    }
    
    // Get latest release date
    const latestRelease = await AnimeRelease.findOne()
      .sort({ releaseDate: -1 })
      .select('releaseDate')
      .lean();
    
    res.json({
      success: true,
      data: {
        total,
        newCount,
        unseenCount,
        latestReleaseDate: latestRelease?.releaseDate
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching stats',
      error: error.message
    });
  }
};

// Trigger manual scrape (admin only)
exports.triggerScrape = async (req, res) => {
  try {
    console.log('[Controller] Manual scrape triggered');
    const result = await scrapingService.scrapeAndSave();
    
    res.json({
      success: true,
      message: 'Scraping completed successfully',
      data: result
    });
  } catch (error) {
    console.error('Error triggering scrape:', error);
    res.status(500).json({
      success: false,
      message: 'Error triggering scrape',
      error: error.message
    });
  }
};

// Get unseen releases for a specific user
exports.getUnseenReleases = async (req, res) => {
  try {
    const { userId } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'userId is required'
      });
    }
    
    const filter = {
      isNew: true,
      seenBy: { $ne: userId }
    };
    
    const releases = await AnimeRelease.find(filter)
      .sort({ releaseDate: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    
    const total = await AnimeRelease.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);
    
    res.json({
      success: true,
      data: releases,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore: page < totalPages
      }
    });
  } catch (error) {
    console.error('Error fetching unseen releases:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching unseen releases',
      error: error.message
    });
  }
};
