const Anime = require('../models/Anime');
const Episode = require('../models/Episode');

/**
 * Anime Controller
 * Handles API endpoints for anime and episodes
 */


const escapeRegex = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const toSlug = (value = '') =>
  value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

const normalizeWebsiteName = (website = '') => {
  const w = String(website || '').toLowerCase().trim();
  if (!w) return 'unknown';
  if (w.includes('animekai')) return 'animekai';
  if (w.includes('animepahe')) return 'animepahe';
  if (w.includes('gogoanime')) return 'gogoanime';
  if (w.includes('9anime')) return '9anime';
  return w.replace(/^www\./, '');
};

const inferWebsiteFromUrl = (url = '') => {
  try {
    const host = new URL(url).hostname.toLowerCase();
    if (host.includes('animekai')) return 'animekai';
    if (host.includes('animepahe')) return 'animepahe';
    if (host.includes('gogoanime')) return 'gogoanime';
    if (host.includes('9anime')) return '9anime';
    return host.replace(/^www\./, '');
  } catch {
    return '';
  }
};

const findAnimeByIdentifier = async (animeIdentifier) => {
  const decoded = decodeURIComponent(animeIdentifier || '');
  const escaped = escapeRegex(decoded);
  const exactNameRegex = new RegExp(`^${escaped}$`, 'i');

  return Anime.findOne({
    $or: [
      { slug: decoded },
      { name: exactNameRegex },
      { alternativeTitles: exactNameRegex }
    ]
  });
};

// Get all anime with pagination
exports.getAllAnime = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const { status, search } = req.query;
    
    // Build query
    const query = {};
    if (status) query.status = status;
    if (search) {
      query.$text = { $search: search };
    }
    
    const [anime, total] = await Promise.all([
      Anime.find(query)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('name coverImage status episodeCount latestEpisodeNumber updatedAt'),
      Anime.countDocuments(query)
    ]);
    
    res.json({
      success: true,
      data: anime,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page < Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching anime:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch anime',
      error: error.message
    });
  }
};

// Get single anime with episodes
exports.getAnimeById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const anime = await Anime.findById(id);
    
    if (!anime) {
      return res.status(404).json({
        success: false,
        message: 'Anime not found'
      });
    }
    
    // Get episodes for this anime
    const episodes = await Episode.find({ anime: id })
      .sort({ episodeNumber: 1 })
      .select('-postMetadata');
    
    res.json({
      success: true,
      data: {
        anime,
        episodes
      }
    });
  } catch (error) {
    console.error('Error fetching anime:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch anime',
      error: error.message
    });
  }
};

// Get episodes with pagination
exports.getAllEpisodes = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;
    
    const { animeId, isNew, source } = req.query;
    
    // Build query
    const query = {};
    if (animeId) query.anime = animeId;
    if (isNew === 'true') query.isNew = true;
    if (source) query['primarySource.website'] = source;
    
    const [episodes, total] = await Promise.all([
      Episode.find(query)
        .populate('anime', 'name coverImage status')
        .sort({ releaseDate: -1 })
        .skip(skip)
        .limit(limit),
      Episode.countDocuments(query)
    ]);
    
    res.json({
      success: true,
      data: episodes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page < Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching episodes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch episodes',
      error: error.message
    });
  }
};

// Get single episode
exports.getEpisodeById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const episode = await Episode.findById(id)
      .populate('anime', 'name coverImage description genres tags status');
    
    if (!episode) {
      return res.status(404).json({
        success: false,
        message: 'Episode not found'
      });
    }
    
    // Increment view count
    episode.views = (episode.views || 0) + 1;
    await episode.save();
    
    res.json({
      success: true,
      data: episode
    });
  } catch (error) {
    console.error('Error fetching episode:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch episode',
      error: error.message
    });
  }
};

// Mark episode as seen
exports.markEpisodeAsSeen = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id || req.body.userId;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required'
      });
    }
    
    const episode = await Episode.findById(id);
    
    if (!episode) {
      return res.status(404).json({
        success: false,
        message: 'Episode not found'
      });
    }
    
    await episode.markAsSeen(userId);
    
    res.json({
      success: true,
      message: 'Episode marked as seen'
    });
  } catch (error) {
    console.error('Error marking episode as seen:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark episode as seen',
      error: error.message
    });
  }
};

// Get unseen episodes for user
exports.getUnseenEpisodes = async (req, res) => {
  try {
    const userId = req.user?._id || req.query.userId;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required'
      });
    }
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;
    
    const [episodes, total] = await Promise.all([
      Episode.find({
        isNew: true,
        seenBy: { $ne: userId }
      })
        .populate('anime', 'name coverImage')
        .sort({ releaseDate: -1 })
        .skip(skip)
        .limit(limit),
      Episode.countDocuments({
        isNew: true,
        seenBy: { $ne: userId }
      })
    ]);
    
    res.json({
      success: true,
      data: episodes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page < Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching unseen episodes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch unseen episodes',
      error: error.message
    });
  }
};

// Get statistics
exports.getStats = async (req, res) => {
  try {
    const userId = req.query.userId;
    const mongoose = require('mongoose');
    
    const [totalAnime, totalEpisodes, newEpisodes] = await Promise.all([
      Anime.countDocuments(),
      Episode.countDocuments(),
      Episode.countDocuments({ isNew: true })
    ]);
    
    let unseenCount = 0;
    if (userId) {
      try {
        // Try to create ObjectId from userId - if it fails, it's not valid
        const userObjectId = new mongoose.Types.ObjectId(userId);
        unseenCount = await Episode.countDocuments({
          isNew: true,
          seenBy: { $ne: userObjectId }
        });
      } catch (e) {
        // If userId is not a valid ObjectId, return all new episodes as unseen
        unseenCount = newEpisodes;
      }
    }
    
    res.json({
      success: true,
      data: {
        totalAnime,
        totalEpisodes,
        newEpisodes,
        unseenCount
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch stats',
      error: error.message
    });
  }
};

// Search anime
exports.searchAnime = async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;
    
    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query required'
      });
    }
    
    const anime = await Anime.find({
      $text: { $search: q }
    })
      .limit(parseInt(limit))
      .select('name coverImage status episodeCount latestEpisodeNumber');
    
    res.json({
      success: true,
      data: anime
    });
  } catch (error) {
    console.error('Error searching anime:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search anime',
      error: error.message
    });
  }
};

// Get episodes ready for post generation
exports.getEpisodesForPosts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    const episodes = await Episode.findUngenerated(limit);
    
    res.json({
      success: true,
      data: episodes,
      count: episodes.length
    });
  } catch (error) {
    console.error('Error fetching episodes for posts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch episodes',
      error: error.message
    });
  }
};

// Get episodes for specific anime by name (with fallback to old schema)
exports.getEpisodesByAnimeName = async (req, res) => {
  try {
    const animeName = decodeURIComponent(req.params.animeName);
    
    console.log('Fetching episodes for anime:', animeName);
    console.log('Anime name length:', animeName.length);
    
    // Try new schema first - resolve by slug or name
    const anime = await findAnimeByIdentifier(animeName);
    
    if (anime) {
      // Found in new schema, get episodes
      const episodes = await Episode.find({ anime: anime._id })
        .populate('anime', 'name coverImage status episodeCount latestEpisodeNumber')
        .sort({ episodeNumber: 1 });
      
      console.log(`Found ${episodes.length} episodes in new schema`);
      
      return res.json({
        success: true,
        data: episodes,
        count: episodes.length,
        schema: 'new'
      });
    }
    
    // Not found in new schema, try old schema as fallback
    console.log('Not found in new schema, checking old schema...');
    
    const AnimeRelease = require('../models/AnimeRelease');
    const escapedName = animeName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const animeNameSlug = toSlug(animeName);

    const oldReleases = await AnimeRelease.find({
      $or: [
        { animeName: { $regex: new RegExp(`^${escapedName}$`, 'i') } },
        // Fallback for direct slug URL access (e.g. /anime/cardfight-vanguard-...)
        { animeName: { $regex: new RegExp(`^${animeNameSlug.replace(/-/g, '[\\s-]')}$`, 'i') } }
      ]
    }).sort({ episodeNumber: 1 });
    
    console.log(`Searched old schema, found: ${oldReleases.length}`);
    
    if (oldReleases.length > 0) {
      console.log(`Converting ${oldReleases.length} episodes from old schema`);
      
      // Convert old schema to new schema format
      const convertedEpisodes = oldReleases.map(release => ({
        _id: release._id,
        episodeNumber: release.episodeNumber,
        title: release.title,
        thumbnailUrl: release.thumbnailUrl,
        releaseDate: release.releaseDate || release.scrapedAt,
        views: 0,
        primarySource: {
          website: release.sourceWebsite || 'animepahe',
          watchUrl: release.watchUrl,
          url: release.animePageUrl,
          dataId: release.dataId
        },
        anime: {
          _id: null,
          name: release.animeName,
          coverImage: release.thumbnailUrl,
          status: release.isComplete ? 'completed' : 'ongoing'
        },
        isNew: release.isNew,
        seenBy: release.seenBy || [],
        createdAt: release.createdAt,
        updatedAt: release.updatedAt,
        _fromOldSchema: true
      }));
      
      return res.json({
        success: true,
        data: convertedEpisodes,
        count: convertedEpisodes.length,
        schema: 'old'
      });
    }
    
    // Not found in either schema
    console.log('Anime not found in any schema');
    
    return res.json({
      success: true,
      data: [],
      count: 0,
      message: `No episodes found for anime: ${animeName}`
    });
    
  } catch (error) {
    console.error('Error fetching episodes by anime name:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch episodes',
      error: error.message
    });
  }
};

/**
 * Get episode details with all sources
 * GET /api/anime/:animeName/episodes/:episodeNumber
 */
exports.getEpisodeDetails = async (req, res) => {
  try {
    const { animeName, episodeNumber } = req.params;
    const parsedEpisodeNumber = parseInt(episodeNumber);
    
    // Find anime
    const anime = await findAnimeByIdentifier(animeName);
    
    if (!anime) {
      // Fallback: check legacy schema directly by anime name + episode number
      const AnimeRelease = require('../models/AnimeRelease');
      const decodedAnimeName = decodeURIComponent(animeName || '');
      const escapedName = escapeRegex(decodedAnimeName);
      const exactNameRegex = new RegExp(`^${escapedName}$`, 'i');

      const oldRelease = await AnimeRelease.findOne({
        animeName: exactNameRegex,
        episodeNumber: parsedEpisodeNumber
      }).sort({ releaseDate: -1, scrapedAt: -1 });

      if (!oldRelease) {
        return res.status(404).json({
          success: false,
          message: 'Anime not found'
        });
      }

      return res.json({
        success: true,
        data: {
          episode: {
            _id: null,
            _fromOldSchema: true,
            number: oldRelease.episodeNumber,
            title: oldRelease.title,
            fullTitle: oldRelease.title,
            type: oldRelease.episodeNumber ? 'episode' : 'movie',
            thumbnail: oldRelease.thumbnailUrl,
            description: '',
            duration: null,
            airDate: null,
            releaseDate: oldRelease.releaseDate || oldRelease.scrapedAt,
            isComplete: !!oldRelease.isComplete,
            isNew: !!oldRelease.isNew,
            views: 0
          },
          anime: {
            id: null,
            name: oldRelease.animeName,
            slug: toSlug(oldRelease.animeName),
            coverImage: oldRelease.thumbnailUrl,
            genres: [],
            status: oldRelease.isComplete ? 'completed' : 'unknown'
          },
          sources: [
            {
              id: 'primary',
              isPrimary: true,
              website: oldRelease.sourceWebsite || 'unknown',
              watchUrl: oldRelease.watchUrl,
              url: oldRelease.animePageUrl,
              dataId: oldRelease.dataId,
              scrapedAt: oldRelease.scrapedAt || oldRelease.createdAt
            }
          ],
          sourceCount: 1,
          createdAt: oldRelease.createdAt,
          updatedAt: oldRelease.updatedAt
        }
      });
    }
    
    // Find episode
    const episode = await Episode.findOne({
      anime: anime._id,
      episodeNumber: parsedEpisodeNumber
    }).populate('anime', 'name slug coverImage genres status');
    
    if (!episode) {
      // Fallback: anime exists in new schema, but specific episode may still exist only in legacy schema
      const AnimeRelease = require('../models/AnimeRelease');
      const escapedAnimeName = escapeRegex(anime.name);
      const exactAnimeRegex = new RegExp(`^${escapedAnimeName}$`, 'i');

      const oldRelease = await AnimeRelease.findOne({
        animeName: exactAnimeRegex,
        episodeNumber: parsedEpisodeNumber
      }).sort({ releaseDate: -1, scrapedAt: -1 });

      if (!oldRelease) {
        return res.status(404).json({
          success: false,
          message: 'Episode not found'
        });
      }

      return res.json({
        success: true,
        data: {
          episode: {
            _id: null,
            _fromOldSchema: true,
            number: oldRelease.episodeNumber,
            title: oldRelease.title,
            fullTitle: oldRelease.title,
            type: oldRelease.episodeNumber ? 'episode' : 'movie',
            thumbnail: oldRelease.thumbnailUrl || anime.coverImage,
            description: '',
            duration: null,
            airDate: null,
            releaseDate: oldRelease.releaseDate || oldRelease.scrapedAt,
            isComplete: !!oldRelease.isComplete,
            isNew: !!oldRelease.isNew,
            views: 0
          },
          anime: {
            id: anime._id,
            name: anime.name,
            slug: anime.slug || toSlug(anime.name),
            coverImage: anime.coverImage || oldRelease.thumbnailUrl,
            genres: anime.genres || [],
            status: anime.status || 'unknown'
          },
          sources: [
            {
              id: 'primary',
              isPrimary: true,
              website: oldRelease.sourceWebsite || 'unknown',
              watchUrl: oldRelease.watchUrl,
              url: oldRelease.animePageUrl,
              dataId: oldRelease.dataId,
              scrapedAt: oldRelease.scrapedAt || oldRelease.createdAt
            }
          ],
          sourceCount: 1,
          createdAt: oldRelease.createdAt,
          updatedAt: oldRelease.updatedAt
        }
      });
    }
    
    // Prepare all sources (primary + additional), normalized + deduped by website
    const sourceCandidates = [
      {
        id: 'primary',
        isPrimary: true,
        ...episode.primarySource.toObject()
      },
      ...episode.additionalSources.map((source, index) => ({
        id: `source-${index}`,
        isPrimary: false,
        ...source.toObject()
      }))
    ];

    const sourceByWebsite = new Map();
    for (const source of sourceCandidates) {
      let normalizedWebsite = normalizeWebsiteName(source.website);
      if (normalizedWebsite === 'custom' || normalizedWebsite === 'unknown') {
        normalizedWebsite = inferWebsiteFromUrl(source.watchUrl || source.url) || normalizedWebsite;
      }
      const existing = sourceByWebsite.get(normalizedWebsite);
      const normalizedSource = {
        ...source,
        website: normalizedWebsite
      };

      if (!existing) {
        sourceByWebsite.set(normalizedWebsite, normalizedSource);
        continue;
      }

      if (!existing.isPrimary && normalizedSource.isPrimary) {
        sourceByWebsite.set(normalizedWebsite, normalizedSource);
        continue;
      }

      const existingTs = existing.scrapedAt ? new Date(existing.scrapedAt).getTime() : 0;
      const nextTs = normalizedSource.scrapedAt ? new Date(normalizedSource.scrapedAt).getTime() : 0;
      if (nextTs > existingTs && !existing.isPrimary) {
        sourceByWebsite.set(normalizedWebsite, normalizedSource);
      }
    }

    const allSources = Array.from(sourceByWebsite.values()).sort((a, b) =>
      a.website.localeCompare(b.website)
    );
    
    res.json({
      success: true,
      data: {
        episode: {
          _id: episode._id,
          number: episode.episodeNumber,
          title: episode.episodeTitle,
          fullTitle: episode.fullTitle,
          type: episode.type,
          thumbnail: episode.thumbnailUrl,
          description: episode.description,
          duration: episode.duration,
          airDate: episode.airDate,
          releaseDate: episode.releaseDate,
          isComplete: episode.isComplete,
          isNew: episode.isNew,
          views: episode.views
        },
        anime: {
          id: anime._id,
          name: anime.name,
          slug: anime.slug || toSlug(anime.name),
          coverImage: anime.coverImage,
          genres: anime.genres,
          status: anime.status
        },
        sources: allSources,
        sourceCount: allSources.length,
        createdAt: episode.createdAt,
        updatedAt: episode.updatedAt
      }
    });
    
  } catch (error) {
    console.error('Error fetching episode details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch episode details',
      error: error.message
    });
  }
};

/**
 * Get all episodes for an anime with source counts
 * GET /api/anime/:animeName/episodes-with-sources
 */
exports.getEpisodesWithSources = async (req, res) => {
  try {
    const { animeName } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    
    // Find anime
    const anime = await findAnimeByIdentifier(animeName);
    
    if (!anime) {
      return res.status(404).json({
        success: false,
        message: 'Anime not found'
      });
    }
    
    // Get episodes with source counts
    const [episodes, total] = await Promise.all([
      Episode.find({ anime: anime._id })
        .sort({ episodeNumber: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Episode.countDocuments({ anime: anime._id })
    ]);
    
    // Add deduped source counts to each episode
    const episodesWithSources = episodes.map(episode => {
      const websites = new Set([
        (() => {
          let w = normalizeWebsiteName(episode.primarySource?.website);
          if (w === 'custom' || w === 'unknown') {
            w = inferWebsiteFromUrl(episode.primarySource?.watchUrl || episode.primarySource?.url) || w;
          }
          return w;
        })(),
        ...(episode.additionalSources || []).map(s => {
          let w = normalizeWebsiteName(s.website);
          if (w === 'custom' || w === 'unknown') {
            w = inferWebsiteFromUrl(s.watchUrl || s.url) || w;
          }
          return w;
        })
      ]);

      return {
        ...episode,
        sourceCount: websites.size,
        hasMultipleSources: websites.size > 1
      };
    });
    
    res.json({
      success: true,
      data: episodesWithSources,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page < Math.ceil(total / limit)
      },
      anime: {
        name: anime.name,
        slug: anime.slug
      }
    });
    
  } catch (error) {
    console.error('Error fetching episodes with sources:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch episodes',
      error: error.message
    });
  }
};

module.exports = exports;
