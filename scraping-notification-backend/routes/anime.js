const express = require('express');
const router = express.Router();
const animeController = require('../controllers/animeController');

/**
 * Anime & Episode Routes
 * RESTful API endpoints for normalized schema
 */

// Anime routes
router.get('/anime', animeController.getAllAnime);
router.get('/anime/search', animeController.searchAnime);
router.get('/anime/:id', animeController.getAnimeById);

// Episode routes
router.get('/episodes', animeController.getAllEpisodes);
router.get('/episodes/unseen', animeController.getUnseenEpisodes);
router.get('/episodes/for-posts', animeController.getEpisodesForPosts);
router.get('/episodes/:id', animeController.getEpisodeById);
router.post('/episodes/:id/seen', animeController.markEpisodeAsSeen);

// NEW: Episode detail with all sources
router.get('/anime/:animeName/episodes/:episodeNumber', animeController.getEpisodeDetails);

// NEW: Get all episodes for anime with source counts
router.get('/anime/:animeName/episodes-with-sources', animeController.getEpisodesWithSources);

// Get episodes by anime name (existing endpoint - should be after specific routes)
router.get('/anime/:animeName/episodes', animeController.getEpisodesByAnimeName);

// Statistics
router.get('/stats', animeController.getStats);

module.exports = router;
