require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('./models/Category');

const getRoleValue = (role) => {
  const roleHierarchy = { 'viewer': 1, 'paid': 2, 'editor': 3, 'admin': 4 };
  return roleHierarchy[role] || 0;
};

const filterCategoriesByRole = (categories, userRole) => {
  return categories.filter(category => {
    console.log(`Checking category: ${category.name}, minRole: ${category.minRole}, userRole: ${userRole}`);
    // If no minRole is set, category is visible to everyone
    if (!category.minRole) {
      console.log('  -> Visible (no minRole)');
      return true;
    }
    
    // If no user role provided (not authenticated), can only see categories with no minRole
    if (!userRole) {
      console.log('  -> Hidden (no user role)');
      return false;
    }
    
    // Check role hierarchy
    const result = getRoleValue(userRole) >= getRoleValue(category.minRole);
    console.log(`  -> Role check: ${getRoleValue(userRole)} >= ${getRoleValue(category.minRole)} = ${result}`);
    return result;
  });
};

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  console.log('Connected to MongoDB\n');
  const categories = await Category.find().sort({ createdAt: -1 });
  
  console.log('=== Testing with editor role ===\n');
  const filtered = filterCategoriesByRole(categories, 'editor');
  console.log('\nFiltered result:', filtered.map(c => c.name).join(', '));
  console.log(`Total: ${filtered.length} out of ${categories.length}`);
  
  await mongoose.connection.close();
  process.exit(0);
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
