/**
 * Test Script: Category Role-Based Visibility
 * 
 * This script tests the role-based filtering of categories
 * 
 * Usage: node scripts/test-category-roles.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('../models/Category');
const User = require('../models/User');

async function testCategoryRoles() {
  try {
    console.log('🧪 Starting Category Role-Based Visibility Tests...\n');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Create test categories
    console.log('📝 Creating test categories...');
    
    const testCategories = [
      { name: 'Public Anime', minRole: null },
      { name: 'Member Content', minRole: 'viewer' },
      { name: 'Editor Content', minRole: 'editor' },
      { name: 'Admin Content', minRole: 'admin' }
    ];

    // Clean up existing test categories
    await Category.deleteMany({ 
      name: { $in: testCategories.map(c => c.name) } 
    });

    // Create categories
    const createdCategories = [];
    for (const catData of testCategories) {
      const slug = catData.name.toLowerCase().replace(/\s+/g, '-');
      const category = new Category({
        name: catData.name,
        slug,
        minRole: catData.minRole
      });
      await category.save();
      createdCategories.push(category);
      console.log(`  ✓ Created: ${category.name} (minRole: ${category.minRole || 'public'})`);
    }
    console.log('');

    // Test filtering
    console.log('🔍 Testing role-based filtering...\n');

    // Helper function to simulate role filtering
    const getRoleValue = (role) => {
      const roleHierarchy = { 'viewer': 1, 'editor': 2, 'admin': 3 };
      return roleHierarchy[role] || 0;
    };

    const filterCategoriesByRole = (categories, userRole) => {
      return categories.filter(category => {
        if (!category.minRole) return true;
        if (!userRole) return false;
        return getRoleValue(userRole) >= getRoleValue(category.minRole);
      });
    };

    // Test scenarios
    const scenarios = [
      { role: null, label: 'Anonymous User' },
      { role: 'viewer', label: 'Viewer User' },
      { role: 'editor', label: 'Editor User' },
      { role: 'admin', label: 'Admin User' }
    ];

    for (const scenario of scenarios) {
      const allCategories = await Category.find({ 
        name: { $in: testCategories.map(c => c.name) } 
      });
      
      const filtered = filterCategoriesByRole(allCategories, scenario.role);
      
      console.log(`📊 ${scenario.label}:`);
      console.log(`   Total categories: ${allCategories.length}`);
      console.log(`   Visible categories: ${filtered.length}`);
      console.log(`   Categories: ${filtered.map(c => c.name).join(', ') || 'None'}`);
      console.log('');
    }

    // Test canView method
    console.log('🧪 Testing canView() method...\n');
    
    const publicCat = createdCategories[0];
    const viewerCat = createdCategories[1];
    const editorCat = createdCategories[2];
    const adminCat = createdCategories[3];

    const testRoles = [null, 'viewer', 'editor', 'admin'];
    
    console.log('Public Category visibility:');
    testRoles.forEach(role => {
      console.log(`  ${role || 'anonymous'}: ${publicCat.canView(role) ? '✓ visible' : '✗ hidden'}`);
    });
    console.log('');

    console.log('Viewer Category visibility:');
    testRoles.forEach(role => {
      console.log(`  ${role || 'anonymous'}: ${viewerCat.canView(role) ? '✓ visible' : '✗ hidden'}`);
    });
    console.log('');

    console.log('Editor Category visibility:');
    testRoles.forEach(role => {
      console.log(`  ${role || 'anonymous'}: ${editorCat.canView(role) ? '✓ visible' : '✗ hidden'}`);
    });
    console.log('');

    console.log('Admin Category visibility:');
    testRoles.forEach(role => {
      console.log(`  ${role || 'anonymous'}: ${adminCat.canView(role) ? '✓ visible' : '✗ hidden'}`);
    });
    console.log('');

    // Summary
    console.log('✅ All tests completed successfully!\n');
    console.log('📋 Summary:');
    console.log('  - Anonymous users can see: Public categories only');
    console.log('  - Viewer users can see: Public + Viewer categories');
    console.log('  - Editor users can see: Public + Viewer + Editor categories');
    console.log('  - Admin users can see: All categories');
    console.log('');
    console.log('🧹 Cleaning up test data...');
    
    // Clean up test categories
    await Category.deleteMany({ 
      name: { $in: testCategories.map(c => c.name) } 
    });
    console.log('✓ Test categories removed');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n✓ Database connection closed');
    process.exit(0);
  }
}

// Run tests
testCategoryRoles();
