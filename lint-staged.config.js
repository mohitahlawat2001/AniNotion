module.exports = {
  'aninotion-frontend/**/*.{js,jsx,ts,tsx}': (filenames) => {
    // Filter out config files
    const sourceFiles = filenames.filter(f => !f.includes('.eslintrc') && !f.includes('.config'));
    if (sourceFiles.length === 0) return [];
    
    const commands = [];
    // Run eslint from within the frontend directory
    commands.push(`cd aninotion-frontend && npx eslint --fix ${sourceFiles.map(f => f.replace(/^aninotion-frontend[\/\\]/, '')).join(' ')}`);
    commands.push(`prettier --write ${sourceFiles.join(' ')}`);
    return commands;
  },
  'aninotion-backend/**/*.{js,jsx,ts,tsx}': (filenames) => {
    // Filter out config files
    const sourceFiles = filenames.filter(f => !f.includes('.eslintrc') && !f.includes('.config'));
    if (sourceFiles.length === 0) return [];
    
    const commands = [];
    // Run eslint from within the backend directory
    commands.push(`cd aninotion-backend && npx eslint --fix ${sourceFiles.map(f => f.replace(/^aninotion-backend[\/\\]/, '')).join(' ')}`);
    commands.push(`prettier --write ${sourceFiles.join(' ')}`);
    return commands;
  },
  '**/*.{json,css,md}': [
    'prettier --write',
  ],
};