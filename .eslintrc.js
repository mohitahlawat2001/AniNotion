module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: ['eslint:recommended'],
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module',
  },
  rules: {
    'no-unused-vars': 'warn',
    'no-console': 'off',
    'prefer-const': 'error',
    'no-var': 'error',
  },
  overrides: [
    {
      files: ['aninotion-frontend/**/*.{js,jsx}'],
      env: {
        browser: true,
        es2021: true,
      },
      extends: ['eslint:recommended'],
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
        ecmaVersion: 2021,
        sourceType: 'module',
      },
    },
    {
      files: ['aninotion-backend/**/*.js'],
      env: {
        node: true,
        es2021: true,
      },
      extends: ['eslint:recommended'],
      parserOptions: {
        ecmaVersion: 2021,
        sourceType: 'module',
      },
    },
  ],
};
