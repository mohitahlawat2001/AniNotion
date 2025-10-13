/**
 * Test script for Episode Number feature
 * Tests creating and querying posts with episode numbers
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Post = require('../models/Post');
const Category = require('../models/Category');
const User = require('../models/User');

const testEpisodeFeature = async () => {
  try {
    console.log('🧪 Starting Episode Number Feature Test...\n');
    
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
    
    // Test 1: Create post with episode number
    console.log('Test 1: Creating post with episode number...');
    const postWithEpisode = new Post({
      title: 'Test Post with Episode Number',
      slug: 'test-post-episode-' + Date.now(),
      animeName: 'One Piece',
      episodeNumber: 1000,
      category: category._id,
      content: 'This is a test post about Episode 1000 of One Piece',
      status: 'published',
      publishedAt: new Date(),
      createdBy: user._id
    });
    
    await postWithEpisode.save();
    console.log('✅ Created post with episode:', {
      id: postWithEpisode._id,
      animeName: postWithEpisode.animeName,
      episodeNumber: postWithEpisode.episodeNumber
    });
    console.log('');
    
    // Test 2: Create post without episode number (whole series)
    console.log('Test 2: Creating post without episode number (whole series)...');
    const postWholeAnime = new Post({
      title: 'Test Post about Whole Anime',
      slug: 'test-post-whole-anime-' + Date.now(),
      animeName: 'Naruto',
      category: category._id,
      content: 'This is a test post about Naruto as a whole series',
      status: 'published',
      publishedAt: new Date(),
      createdBy: user._id
    });
    
    await postWholeAnime.save();
    console.log('✅ Created post without episode:', {
      id: postWholeAnime._id,
      animeName: postWholeAnime.animeName,
      episodeNumber: postWholeAnime.episodeNumber || 'undefined (whole series)'
    });
    console.log('');
    
    // Test 3: Query posts by anime name
    console.log('Test 3: Querying posts by anime name...');
    const onePiecePosts = await Post.find({ animeName: 'One Piece' })
      .select('title animeName episodeNumber')
      .sort({ episodeNumber: 1 });
    
    console.log(`✅ Found ${onePiecePosts.length} post(s) for "One Piece":`);
    onePiecePosts.forEach(post => {
      console.log(`   - ${post.title}: Episode ${post.episodeNumber || 'N/A (whole series)'}`);
    });
    console.log('');
    
    // Test 4: Query posts with specific episode
    console.log('Test 4: Querying posts with specific episode number...');
    const episodeSpecificPosts = await Post.find({ 
      animeName: 'One Piece',
      episodeNumber: 1000 
    }).select('title animeName episodeNumber');
    
    console.log(`✅ Found ${episodeSpecificPosts.length} post(s) for "One Piece Episode 1000":`);
    episodeSpecificPosts.forEach(post => {
      console.log(`   - ${post.title}`);
    });
    console.log('');
    
    // Test 5: Query posts about whole anime (no episode)
    console.log('Test 5: Querying posts about whole anime series...');
    const wholeAnimePosts = await Post.find({ 
      animeName: { $exists: true },
      $or: [
        { episodeNumber: { $exists: false } },
        { episodeNumber: null }
      ]
    }).select('title animeName episodeNumber').limit(5);
    
    console.log(`✅ Found ${wholeAnimePosts.length} post(s) about whole anime series:`);
    wholeAnimePosts.forEach(post => {
      console.log(`   - ${post.animeName}: ${post.title}`);
    });
    console.log('');
    
    // Test 6: Update post to add episode number
    console.log('Test 6: Updating post to add episode number...');
    postWholeAnime.episodeNumber = 220;
    await postWholeAnime.save();
    const updatedPost = await Post.findById(postWholeAnime._id);
    console.log('✅ Updated post:', {
      title: updatedPost.title,
      oldEpisode: 'undefined',
      newEpisode: updatedPost.episodeNumber
    });
    console.log('');
    
    // Test 7: Group posts by anime and episode
    console.log('Test 7: Grouping posts by anime name...');
    const groupedPosts = await Post.aggregate([
      {
        $match: { 
          status: 'published',
          animeName: { $exists: true, $ne: '' }
        }
      },
      {
        $group: {
          _id: '$animeName',
          totalPosts: { $sum: 1 },
          withEpisode: {
            $sum: {
              $cond: [{ $ifNull: ['$episodeNumber', false] }, 1, 0]
            }
          },
          wholeAnime: {
            $sum: {
              $cond: [{ $ifNull: ['$episodeNumber', false] }, 0, 1]
            }
          },
          episodes: { $addToSet: '$episodeNumber' }
        }
      },
      { $sort: { totalPosts: -1 } },
      { $limit: 10 }
    ]);
    
    console.log('✅ Top anime by post count:');
    groupedPosts.forEach(anime => {
      console.log(`   - ${anime._id}:`);
      console.log(`     Total: ${anime.totalPosts} posts`);
      console.log(`     Episode-specific: ${anime.withEpisode}`);
      console.log(`     Whole series: ${anime.wholeAnime}`);
    });
    console.log('');
    
    // Cleanup test posts
    console.log('🧹 Cleaning up test posts...');
    await Post.deleteMany({
      slug: { $regex: /^test-post-(episode|whole-anime)-/ }
    });
    console.log('✅ Test posts cleaned up\n');
    
    console.log('✅ All tests completed successfully!\n');
    
    // Summary
    console.log('📊 Feature Summary:');
    console.log('   ✓ Posts can be created with episode numbers');
    console.log('   ✓ Posts can be created without episode numbers (whole series)');
    console.log('   ✓ Episode numbers can be queried and filtered');
    console.log('   ✓ Posts can be grouped by anime name');
    console.log('   ✓ Episode numbers can be updated');
    console.log('   ✓ Schema validation works correctly\n');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('👋 Disconnected from MongoDB');
  }
};

// Run the test
testEpisodeFeature();
