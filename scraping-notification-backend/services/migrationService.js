const AnimeRelease = require('../models/AnimeRelease');
const Anime = require('../models/Anime');
const Episode = require('../models/Episode');

/**
 * Migration Service
 * Migrates data from old AnimeRelease model to new Anime + Episode models
 */
class MigrationService {
  
  /**
   * Migrate all existing AnimeRelease records to new schema
   */
  async migrateToNewSchema() {
    console.log('🔄 Starting migration from AnimeRelease to Anime + Episode models...');
    
    try {
      // Get all releases
      const releases = await AnimeRelease.find({}).sort({ animeName: 1, episodeNumber: 1 });
      console.log(`📊 Found ${releases.length} releases to migrate`);
      
      let animeCreated = 0;
      let episodesCreated = 0;
      let errors = 0;
      
      // Group releases by anime name
      const animeGroups = this._groupByAnime(releases);
      
      console.log(`📚 Found ${Object.keys(animeGroups).length} unique anime series`);
      
      // Process each anime
      for (const [animeName, animeReleases] of Object.entries(animeGroups)) {
        try {
          // Create or find anime
          const anime = await this._createOrUpdateAnime(animeName, animeReleases);
          animeCreated++;
          
          // Create episodes for this anime
          for (const release of animeReleases) {
            try {
              await this._createEpisode(anime, release);
              episodesCreated++;
            } catch (err) {
              console.error(`❌ Error creating episode ${release.episodeNumber} for ${animeName}:`, err.message);
              errors++;
            }
          }
          
          // Update anime episode count
          await anime.updateEpisodeCount();
          
        } catch (err) {
          console.error(`❌ Error processing anime ${animeName}:`, err.message);
          errors++;
        }
      }
      
      console.log('\n✅ Migration completed!');
      console.log(`   📺 Anime created: ${animeCreated}`);
      console.log(`   🎬 Episodes created: ${episodesCreated}`);
      console.log(`   ❌ Errors: ${errors}`);
      
      return {
        success: true,
        animeCreated,
        episodesCreated,
        errors
      };
      
    } catch (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    }
  }
  
  /**
   * Group releases by anime name
   */
  _groupByAnime(releases) {
    const groups = {};
    
    releases.forEach(release => {
      const name = release.animeName;
      if (!groups[name]) {
        groups[name] = [];
      }
      groups[name].push(release);
    });
    
    return groups;
  }
  
  /**
   * Create or update anime document
   */
  async _createOrUpdateAnime(animeName, releases) {
    // Check if anime already exists
    let anime = await Anime.findOne({ name: animeName });
    
    if (anime) {
      console.log(`   ℹ️  Anime "${animeName}" already exists, updating...`);
      return anime;
    }
    
    // Get first release for source info
    const firstRelease = releases[0];
    
    // Find max episode number
    const maxEpisode = Math.max(
      ...releases
        .filter(r => r.episodeNumber)
        .map(r => r.episodeNumber),
      0
    );
    
    // Check if complete
    const hasComplete = releases.some(r => r.isComplete);
    
    // Create new anime
    anime = await Anime.create({
      name: animeName,
      coverImage: firstRelease.thumbnailUrl,
      status: hasComplete ? 'completed' : 'ongoing',
      latestEpisodeNumber: maxEpisode,
      episodeCount: releases.length,
      primarySource: {
        website: firstRelease.sourceWebsite,
        url: firstRelease.animePageUrl || firstRelease.watchUrl,
        scrapedAt: firstRelease.scrapedAt || new Date()
      }
    });
    
    console.log(`   ✅ Created anime: ${animeName} (${releases.length} episodes)`);
    
    return anime;
  }
  
  /**
   * Create episode document from release
   */
  async _createEpisode(anime, release) {
    // Check if episode already exists
    const existing = await Episode.findOne({
      anime: anime._id,
      episodeNumber: release.episodeNumber || 1
    });
    
    if (existing) {
      // Add as additional source if different
      if (existing.primarySource.website !== release.sourceWebsite) {
        existing.addSource({
          website: release.sourceWebsite,
          url: release.animePageUrl,
          watchUrl: release.watchUrl,
          dataId: release.dataId,
          scrapedAt: release.scrapedAt
        });
        await existing.save();
      }
      return existing;
    }
    
    // Create new episode
    const episode = await Episode.create({
      anime: anime._id,
      episodeNumber: release.episodeNumber || 1,
      type: release.episodeNumber ? 'regular' : 'movie',
      thumbnailUrl: release.thumbnailUrl,
      isComplete: release.isComplete || false,
      isNew: release.isNew || false,
      releaseDate: release.releaseDate || release.scrapedAt,
      seenBy: release.seenBy || [],
      primarySource: {
        website: release.sourceWebsite,
        url: release.animePageUrl || release.watchUrl,
        watchUrl: release.watchUrl,
        dataId: release.dataId,
        scrapedAt: release.scrapedAt || new Date()
      }
    });
    
    return episode;
  }
  
  /**
   * Verify migration integrity
   */
  async verifyMigration() {
    console.log('\n🔍 Verifying migration...');
    
    const releaseCount = await AnimeRelease.countDocuments();
    const animeCount = await Anime.countDocuments();
    const episodeCount = await Episode.countDocuments();
    
    console.log(`   📊 Original releases: ${releaseCount}`);
    console.log(`   📚 New anime: ${animeCount}`);
    console.log(`   🎬 New episodes: ${episodeCount}`);
    
    // Check for orphaned episodes
    const orphans = await Episode.countDocuments({ anime: null });
    console.log(`   👻 Orphaned episodes: ${orphans}`);
    
    // Sample check
    const sampleAnime = await Anime.findOne().populate('_id');
    if (sampleAnime) {
      const episodesForAnime = await Episode.countDocuments({ anime: sampleAnime._id });
      console.log(`   📝 Sample: "${sampleAnime.name}" has ${episodesForAnime} episodes`);
    }
    
    return {
      releaseCount,
      animeCount,
      episodeCount,
      orphans
    };
  }
  
  /**
   * Rollback migration (delete new data)
   */
  async rollback() {
    console.log('⚠️  Rolling back migration...');
    
    const episodesDeleted = await Episode.deleteMany({});
    const animeDeleted = await Anime.deleteMany({});
    
    console.log(`   🗑️  Deleted ${episodesDeleted.deletedCount} episodes`);
    console.log(`   🗑️  Deleted ${animeDeleted.deletedCount} anime`);
    console.log('   ℹ️  Original AnimeRelease data preserved');
    
    return {
      episodesDeleted: episodesDeleted.deletedCount,
      animeDeleted: animeDeleted.deletedCount
    };
  }
}

module.exports = new MigrationService();
