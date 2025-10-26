/**
 * Test script for the Recommendation Engine
 * 
 * Run with: node scripts/test-recommendations.js
 */

const mongoose = require('mongoose');
require('dotenv').config();
const Post = require('../models/Post');
const recommendationService = require('../utils/recommendationService');
const logger = require('../config/logger');

async function testRecommendationEngine() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    logger.info('Connected to MongoDB');

    // Get published posts
    const posts = await Post.find({
      status: 'published',
      isDeleted: false
    })
      .populate('category', 'name slug')
      .limit(100)
      .lean();

    if (posts.length === 0) {
      logger.warn('No published posts found. Please create some posts first.');
      process.exit(0);
    }

    logger.info(`Found ${posts.length} posts for testing`);

    // Test 1: Find similar posts for the first post
    console.log('\n========================================');
    console.log('TEST 1: Finding Similar Posts');
    console.log('========================================\n');

    const targetPost = posts[0];
    console.log('Target Post:');
    console.log(`  ID: ${targetPost._id}`);
    console.log(`  Title: ${targetPost.title}`);
    console.log(`  Anime: ${targetPost.animeName}`);
    console.log(`  Tags: ${targetPost.tags.join(', ')}`);
    console.log(`  Category: ${targetPost.category.name}`);

    const startTime = Date.now();
    const similarPosts = recommendationService.findSimilarPosts(
      targetPost,
      posts,
      {
        limit: 5,
        minScore: 0.1
      }
    );
    const duration = Date.now() - startTime;

    console.log(`\nFound ${similarPosts.length} similar posts in ${duration}ms:\n`);

    similarPosts.forEach((item, index) => {
      console.log(`${index + 1}. ${item.post.title}`);
      console.log(`   Score: ${item.score.toFixed(3)}`);
      console.log(`   Breakdown:`);
      console.log(`     - Content: ${item.breakdown.content.toFixed(3)}`);
      console.log(`     - Tags: ${item.breakdown.tags.toFixed(3)}`);
      console.log(`     - Category: ${item.breakdown.category.toFixed(3)}`);
      console.log(`     - Anime: ${item.breakdown.anime.toFixed(3)}`);
      console.log('');
    });

    // Test 2: Text preprocessing
    console.log('\n========================================');
    console.log('TEST 2: Text Preprocessing');
    console.log('========================================\n');

    const sampleText = '<p>This is a <strong>sample</strong> anime post about Demon Slayer!</p>';
    const processed = recommendationService.preprocessText(sampleText);
    
    console.log('Original:', sampleText);
    console.log('Processed:', processed);

    // Test 3: Jaccard similarity
    console.log('\n========================================');
    console.log('TEST 3: Jaccard Similarity (Tags)');
    console.log('========================================\n');

    const tagsA = ['action', 'shounen', 'supernatural'];
    const tagsB = ['action', 'shounen', 'adventure'];
    const jaccardScore = recommendationService.jaccardSimilarity(tagsA, tagsB);

    console.log('Tags A:', tagsA.join(', '));
    console.log('Tags B:', tagsB.join(', '));
    console.log('Jaccard Similarity:', jaccardScore.toFixed(3));

    // Test 4: Anime similarity
    console.log('\n========================================');
    console.log('TEST 4: Anime Series Similarity');
    console.log('========================================\n');

    const testCases = [
      { animeA: 'Demon Slayer', seasonA: 1, animeB: 'Demon Slayer', seasonB: 1 },
      { animeA: 'Demon Slayer', seasonA: 1, animeB: 'Demon Slayer', seasonB: 2 },
      { animeA: 'Demon Slayer', seasonA: 1, animeB: 'Attack on Titan', seasonB: 1 },
    ];

    testCases.forEach(tc => {
      const score = recommendationService.animeSimilarity(
        tc.animeA, tc.animeB, tc.seasonA, tc.seasonB
      );
      console.log(`${tc.animeA} S${tc.seasonA} vs ${tc.animeB} S${tc.seasonB}: ${score.toFixed(3)}`);
    });

    // Test 5: Personalized recommendations
    if (posts.length >= 3) {
      console.log('\n========================================');
      console.log('TEST 5: Personalized Recommendations');
      console.log('========================================\n');

      const seedPosts = posts.slice(0, 3);
      console.log('Seed Posts:');
      seedPosts.forEach((post, i) => {
        console.log(`  ${i + 1}. ${post.title}`);
      });

      const personalizedStartTime = Date.now();
      const personalized = recommendationService.getRecommendationsFromHistory(
        seedPosts,
        posts,
        {
          limit: 5,
          diversityFactor: 0.3
        }
      );
      const personalizedDuration = Date.now() - personalizedStartTime;

      console.log(`\nGenerated ${personalized.length} recommendations in ${personalizedDuration}ms:\n`);

      personalized.forEach((item, index) => {
        console.log(`${index + 1}. ${item.post.title}`);
        console.log(`   Score: ${item.score.toFixed(3)}`);
        console.log(`   Anime: ${item.post.animeName}`);
        console.log('');
      });
    }

    // Test 6: Performance metrics
    console.log('\n========================================');
    console.log('TEST 6: Performance Metrics');
    console.log('========================================\n');

    const iterations = 10;
    const perfStartTime = Date.now();
    
    for (let i = 0; i < iterations; i++) {
      const randomPost = posts[Math.floor(Math.random() * posts.length)];
      recommendationService.findSimilarPosts(randomPost, posts, { limit: 5 });
    }
    
    const perfDuration = Date.now() - perfStartTime;
    const avgTime = perfDuration / iterations;

    console.log(`Total posts: ${posts.length}`);
    console.log(`Iterations: ${iterations}`);
    console.log(`Total time: ${perfDuration}ms`);
    console.log(`Average time per recommendation: ${avgTime.toFixed(2)}ms`);
    console.log(`Recommendations per second: ${(1000 / avgTime).toFixed(2)}`);

    // Summary
    console.log('\n========================================');
    console.log('TEST SUMMARY');
    console.log('========================================\n');

    console.log('✅ All tests completed successfully!');
    console.log('\nRecommendation Engine Status:');
    console.log(`  - Total Posts: ${posts.length}`);
    console.log(`  - Average Processing Time: ${avgTime.toFixed(2)}ms`);
    console.log(`  - Performance: ${avgTime < 500 ? 'Excellent' : avgTime < 2000 ? 'Good' : 'Needs Optimization'}`);
    console.log('\nNext Steps:');
    console.log('  1. Test API endpoints with curl or Postman');
    console.log('  2. Monitor cache hit rates in production');
    console.log('  3. Consider pre-computing for popular posts if dataset grows');

    await mongoose.connection.close();
    process.exit(0);

  } catch (error) {
    logger.error('Test failed:', error);
    console.error('Error:', error.message);
    process.exit(1);
  }
}

// Run tests
console.log('╔════════════════════════════════════════════╗');
console.log('║  AniNotion Recommendation Engine Tests    ║');
console.log('╚════════════════════════════════════════════╝\n');

testRecommendationEngine();
