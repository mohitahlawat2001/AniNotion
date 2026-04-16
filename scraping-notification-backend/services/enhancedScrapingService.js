const Anime = require('../models/Anime');
const Episode = require('../models/Episode');
const AnimeRelease = require('../models/AnimeRelease'); // Keep for backward compatibility

/**
 * Enhanced Scraping Service with normalized schema support
 * Stores data in Anime + Episode models while maintaining backward compatibility
 */
class EnhancedScrapingService {
  _resolveSourceWebsite(episodeData, config) {
    const explicit = (episodeData?.sourceWebsite || config?.sourceWebsite || '').toLowerCase().trim();
    if (explicit && explicit !== 'custom') return explicit;

    const urlCandidate = episodeData?.watchUrl || episodeData?.animePageUrl || '';
    try {
      const host = new URL(urlCandidate).hostname.toLowerCase();
      if (host.includes('animekai.')) return 'animekai';
      if (host.includes('animepahe.')) return 'animepahe';
      if (host.includes('gogoanime.')) return 'gogoanime';
      if (host.includes('9anime.')) return '9anime';
      return host.replace(/^www\./, '') || 'custom';
    } catch {
      return explicit || 'custom';
    }
  }
  
  /**
   * Save scraped episode data to normalized schema
   * @param {Object} episodeData - Raw episode data from scraper
   * @param {Object} config - Scraping configuration
   * @returns {Object} - Created/updated episode and anime
   */
  async saveEpisode(episodeData, config) {
    try {
      // 1. Find or create anime
      const anime = await this._findOrCreateAnime(episodeData, config);
      
      // 2. Find or create episode
      const episode = await this._findOrCreateEpisode(episodeData, anime, config);
      
      // 3. Update anime metadata
      await anime.updateEpisodeCount();
      
      // 4. Also save to old schema for backward compatibility (optional)
      if (config.maintainLegacySchema) {
        await this._saveLegacyRelease(episodeData, config);
      }
      
      return {
        anime,
        episode,
        isNew: episode.isNew
      };
      
    } catch (error) {
      console.error('Error saving episode:', error);
      throw error;
    }
  }
  
  /**
   * Save multiple episodes from scraping
   */
  async saveEpisodes(episodesData, config) {
    const results = {
      saved: 0,
      updated: 0,
      duplicates: 0,
      errors: 0,
      episodes: []
    };
    
    for (const episodeData of episodesData) {
      try {
        const result = await this.saveEpisode(episodeData, config);
        
        if (result.isNew) {
          results.saved++;
        } else {
          results.updated++;
        }
        
        results.episodes.push(result.episode);
        
      } catch (error) {
        if (error.code === 11000) {
          results.duplicates++;
        } else {
          results.errors++;
          console.error(`Error saving episode ${episodeData.animeName} ${episodeData.episodeNumber}:`, error);
        }
      }
    }
    
    return results;
  }
  
  /**
   * Find or create anime document
   */
  async _findOrCreateAnime(episodeData, config) {
    const animeName = this._normalizeAnimeName(episodeData.animeName);
    const sourceWebsite = this._resolveSourceWebsite(episodeData, config);
    
    let anime = await Anime.findOne({ name: animeName });
    
    if (!anime) {
      // Extract anime-level data
      anime = await Anime.create({
        name: animeName,
        coverImage: episodeData.thumbnailUrl, // Use first episode thumbnail as cover
        status: episodeData.isComplete ? 'completed' : 'ongoing',
        primarySource: {
          website: sourceWebsite,
          url: episodeData.animePageUrl || episodeData.watchUrl,
          scrapedAt: new Date()
        },
        externalIds: {
          custom: episodeData.dataId
        }
      });
      
      console.log(`✅ Created new anime: ${animeName}`);
    } else {
      // Update source if not already present
      const hasSource = [anime.primarySource, ...anime.additionalSources]
        .some(s => s.website === sourceWebsite);
      
      if (!hasSource) {
        anime.addSource({
          website: sourceWebsite,
          url: episodeData.animePageUrl,
          dataId: episodeData.dataId
        });
        await anime.save();
      }
    }
    
    return anime;
  }
  
  /**
   * Find or create episode document
   */
  async _findOrCreateEpisode(episodeData, anime, config) {
    const episodeNumber = episodeData.episodeNumber || 1;
    const sourceWebsite = this._resolveSourceWebsite(episodeData, config);
    
    let episode = await Episode.findOne({
      anime: anime._id,
      episodeNumber: episodeNumber
    });
    
    if (!episode) {
      // Create new episode
      episode = await Episode.create({
        anime: anime._id,
        episodeNumber: episodeNumber,
        type: this._determineEpisodeType(episodeData),
        thumbnailUrl: episodeData.thumbnailUrl,
        isComplete: episodeData.isComplete || false,
        isNew: true,
        releaseDate: new Date(),
        primarySource: {
          website: sourceWebsite,
          url: episodeData.animePageUrl || episodeData.watchUrl,
          watchUrl: episodeData.watchUrl,
          dataId: episodeData.dataId,
          scrapedAt: new Date()
        }
      });
      
      // Generate post metadata
      await episode.generatePostMetadata(anime.name);
      
      console.log(`   ✅ Created episode ${episodeNumber} for ${anime.name}`);
      
    } else {
      // Episode exists, add as additional source if different
      const hasSameWebsiteAsPrimary = episode.primarySource?.website === sourceWebsite;
      const existingAdditionalIndex = episode.additionalSources.findIndex(
        s => s.website === sourceWebsite
      );
      
      if (hasSameWebsiteAsPrimary) {
        // Refresh primary source fields from latest scrape without creating duplicate source rows
        episode.primarySource.url = episodeData.animePageUrl || episodeData.watchUrl;
        episode.primarySource.watchUrl = episodeData.watchUrl;
        episode.primarySource.dataId = episodeData.dataId;
        episode.primarySource.scrapedAt = new Date();
        await episode.save();
      } else if (existingAdditionalIndex >= 0) {
        // Update existing additional source for same website
        episode.additionalSources[existingAdditionalIndex].url = episodeData.animePageUrl || episodeData.watchUrl;
        episode.additionalSources[existingAdditionalIndex].watchUrl = episodeData.watchUrl;
        episode.additionalSources[existingAdditionalIndex].dataId = episodeData.dataId;
        episode.additionalSources[existingAdditionalIndex].scrapedAt = new Date();
        await episode.save();
      } else {
        episode.addSource({
          website: sourceWebsite,
          url: episodeData.animePageUrl,
          watchUrl: episodeData.watchUrl,
          dataId: episodeData.dataId
        });
        await episode.save();
        console.log(`   ℹ️  Added source for episode ${episodeNumber} of ${anime.name}`);
      }
      
      episode.isNew = false; // Mark as not new if already exists
    }
    
    return episode;
  }
  
  /**
   * Maintain backward compatibility with old AnimeRelease schema
   */
  async _saveLegacyRelease(episodeData, config) {
    try {
      const sourceWebsite = this._resolveSourceWebsite(episodeData, config);
      const releaseData = {
        title: `${episodeData.animeName} - Episode ${episodeData.episodeNumber || 'Movie'}`,
        animeName: episodeData.animeName,
        episodeNumber: episodeData.episodeNumber,
        thumbnailUrl: episodeData.thumbnailUrl,
        watchUrl: episodeData.watchUrl,
        animePageUrl: episodeData.animePageUrl,
        sourceWebsite,
        dataId: episodeData.dataId,
        isComplete: episodeData.isComplete || false,
        releaseDate: new Date(),
        scrapedAt: new Date()
      };
      
      await AnimeRelease.findOneAndUpdate(
        { dataId: episodeData.dataId, episodeNumber: episodeData.episodeNumber },
        releaseData,
        { upsert: true, new: true }
      );
      
    } catch (error) {
      console.warn('Failed to save legacy release:', error.message);
    }
  }
  
  /**
   * Normalize anime name for consistency
   */
  _normalizeAnimeName(name) {
    return name.trim()
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s-:'!]/g, '');
  }
  
  /**
   * Determine episode type from data
   */
  _determineEpisodeType(episodeData) {
    if (!episodeData.episodeNumber) {
      return 'movie';
    }
    
    const name = episodeData.animeName.toLowerCase();
    if (name.includes('ova')) return 'ova';
    if (name.includes('special')) return 'special';
    
    return 'regular';
  }
  
  /**
   * Get episodes ready for post generation
   */
  async getEpisodesForPostGeneration(limit = 10) {
    const episodes = await Episode.findUngenerated(limit);
    return episodes;
  }
  
  /**
   * Mark episode as having post generated
   */
  async markPostGenerated(episodeId, postId) {
    const episode = await Episode.findById(episodeId);
    if (episode) {
      episode.postGenerated = true;
      episode.generatedPostId = postId;
      episode.postGeneratedAt = new Date();
      await episode.save();
    }
    return episode;
  }
  
  /**
   * Get anime with episodes
   */
  async getAnimeWithEpisodes(animeId) {
    const anime = await Anime.findById(animeId);
    const episodes = await Episode.find({ anime: animeId })
      .sort({ episodeNumber: 1 });
    
    return {
      anime,
      episodes
    };
  }
  
  /**
   * Search anime by name
   */
  async searchAnime(query, limit = 10) {
    const anime = await Anime.find({
      $text: { $search: query }
    })
    .limit(limit)
    .select('name coverImage status episodeCount latestEpisodeNumber');
    
    return anime;
  }
}

module.exports = new EnhancedScrapingService();
