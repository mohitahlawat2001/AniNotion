const express = require('express');
const router = express.Router();
const animeReleasesController = require('../controllers/animeReleasesController');

// Get all anime releases with pagination and filters
router.get('/', animeReleasesController.getAnimeReleases);

// Get statistics
router.get('/stats', animeReleasesController.getStats);

// Get unseen releases for a user
router.get('/unseen', animeReleasesController.getUnseenReleases);

// Get single anime release by ID
router.get('/:id', animeReleasesController.getAnimeReleaseById);

// Mark releases as seen
router.post('/mark-seen', animeReleasesController.markAsSeen);

// Trigger manual scrape (admin)
router.post('/scrape', animeReleasesController.triggerScrape);

module.exports = router;
