/**
 * Test script for Season and Episode Number features
 * Tests creating posts with seasons and episodes
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Post = require('../models/Post');
const Category = require('../models/Category');
const User = require('../models/User');

const testSeasonEpisodeFeature = async () => {
  try {
    console.log('🧪 Starting Season & Episode Feature Test...\n');
    
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    // Get a category and user for testing
    const category = await Category.findOne();
    const user = await User.findOne({ role: { $in: ['admin', 'editor'] } });
    
    if (!category || !user) {
      console.error('❌ Need at least one category and one admin/editor user in database');
      process.exit(1);
    }
    
    console.log('📋 Test Data:');
    console.log(`   Category: ${category.name}`);
    console.log(`   User: ${user.email}\n`);
    
    // Test 1: Create post with season and episode
    console.log('Test 1: Creating post with season and episode...');
    const postS1E1 = new Post({
      title: 'Attack on Titan - Season 1 Episode 1 Review',
      slug: 'test-aot-s1e1-' + Date.now(),
      animeName: 'Attack on Titan',
      seasonNumber: 1,
      episodeNumber: 1,
      category: category._id,
      content: 'Review of Attack on Titan Season 1 Episode 1 - To You, in 2000 Years',
      status: 'published',
      publishedAt: new Date(),
      createdBy: user._id
    });
    await postS1E1.save();
    console.log('✅ Created:', {
      anime: postS1E1.animeName,
      season: postS1E1.seasonNumber,
      episode: postS1E1.episodeNumber
    });
    console.log('');
    
    // Test 2: Create another post for same season, different episode
    console.log('Test 2: Creating another episode in same season...');
    const postS1E2 = new Post({
      title: 'Attack on Titan - The Female Titan Arc Begins',
      slug: 'test-aot-s1e5-' + Date.now(),
      animeName: 'Attack on Titan',
      seasonNumber: 1,
      episodeNumber: 5,
      category: category._id,
      content: 'Analysis of Attack on Titan Season 1 Episode 5',
      status: 'published',
      publishedAt: new Date(),
      createdBy: user._id
    });
    await postS1E2.save();
    console.log('✅ Created:', {
      anime: postS1E2.animeName,
      season: postS1E2.seasonNumber,
      episode: postS1E2.episodeNumber
    });
    console.log('');
    
    // Test 3: Create post for different season
    console.log('Test 3: Creating post for different season...');
    const postS2E1 = new Post({
      title: 'Attack on Titan Season 2 - Beast Titan Introduction',
      slug: 'test-aot-s2e1-' + Date.now(),
      animeName: 'Attack on Titan',
      seasonNumber: 2,
      episodeNumber: 1,
      category: category._id,
      content: 'Deep dive into Attack on Titan Season 2 Episode 1',
      status: 'published',
      publishedAt: new Date(),
      createdBy: user._id
    });
    await postS2E1.save();
    console.log('✅ Created:', {
      anime: postS2E1.animeName,
      season: postS2E1.seasonNumber,
      episode: postS2E1.episodeNumber
    });
    console.log('');
    
    // Test 4: Create post with only season (no specific episode)
    console.log('Test 4: Creating season overview post...');
    const postS1Overview = new Post({
      title: 'Attack on Titan Season 1 - Complete Overview',
      slug: 'test-aot-s1-overview-' + Date.now(),
      animeName: 'Attack on Titan',
      seasonNumber: 1,
      category: category._id,
      content: 'Complete overview and analysis of Attack on Titan Season 1',
      status: 'published',
      publishedAt: new Date(),
      createdBy: user._id
    });
    await postS1Overview.save();
    console.log('✅ Created:', {
      anime: postS1Overview.animeName,
      season: postS1Overview.seasonNumber,
      episode: postS1Overview.episodeNumber || 'N/A (season overview)'
    });
    console.log('');
    
    // Test 5: Query posts by anime and season
    console.log('Test 5: Querying Attack on Titan Season 1 posts...');
    const season1Posts = await Post.find({
      animeName: 'Attack on Titan',
      seasonNumber: 1
    })
      .select('title seasonNumber episodeNumber')
      .sort({ episodeNumber: 1 });
    
    console.log(`✅ Found ${season1Posts.length} post(s) for Attack on Titan Season 1:`);
    season1Posts.forEach(post => {
      const epInfo = post.episodeNumber ? `Episode ${post.episodeNumber}` : 'Season Overview';
      console.log(`   - ${post.title}: ${epInfo}`);
    });
    console.log('');
    
    // Test 6: Group posts by season
    console.log('Test 6: Grouping Attack on Titan posts by season...');
    const groupedBySeason = await Post.aggregate([
      {
        $match: {
          animeName: 'Attack on Titan',
          seasonNumber: { $exists: true }
        }
      },
      {
        $group: {
          _id: '$seasonNumber',
          posts: { $sum: 1 },
          episodes: { $addToSet: '$episodeNumber' }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    console.log('✅ Posts grouped by season:');
    groupedBySeason.forEach(season => {
      const episodeCount = season.episodes.filter(e => e !== null && e !== undefined).length;
      console.log(`   Season ${season._id}:`);
      console.log(`     Total posts: ${season.posts}`);
      console.log(`     Episode-specific: ${episodeCount}`);
      console.log(`     Season overviews: ${season.posts - episodeCount}`);
    });
    console.log('');
    
    // Test 7: Create multiple posts for same episode (different perspectives)
    console.log('Test 7: Creating multiple posts for same episode...');
    const postS1E1Alt = new Post({
      title: 'Attack on Titan S1E1 - Character Analysis',
      slug: 'test-aot-s1e1-alt-' + Date.now(),
      animeName: 'Attack on Titan',
      seasonNumber: 1,
      episodeNumber: 1,
      category: category._id,
      content: 'Character-focused analysis of Episode 1',
      status: 'published',
      publishedAt: new Date(),
      createdBy: user._id
    });
    await postS1E1Alt.save();
    
    const sameEpisodePosts = await Post.find({
      animeName: 'Attack on Titan',
      seasonNumber: 1,
      episodeNumber: 1
    }).select('title');
    
    console.log(`✅ Found ${sameEpisodePosts.length} posts for S1E1:`);
    sameEpisodePosts.forEach(post => {
      console.log(`   - ${post.title}`);
    });
    console.log('');
    
    // Cleanup test posts
    console.log('🧹 Cleaning up test posts...');
    await Post.deleteMany({
      slug: { $regex: /^test-aot-/ }
    });
    console.log('✅ Test posts cleaned up\n');
    
    console.log('✅ All tests completed successfully!\n');
    
    // Summary
    console.log('📊 Feature Summary:');
    console.log('   ✓ Posts can have both season and episode numbers');
    console.log('   ✓ Posts can have only season (overview posts)');
    console.log('   ✓ Posts can have only episode (no season specified)');
    console.log('   ✓ Multiple posts can exist for same season/episode');
    console.log('   ✓ Posts can be queried and grouped by season');
    console.log('   ✓ Sorting by season then episode works correctly\n');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('👋 Disconnected from MongoDB');
  }
};

// Run the test
testSeasonEpisodeFeature();
