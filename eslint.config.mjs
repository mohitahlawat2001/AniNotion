import js from '@eslint/js'
import frontendConfig from './aninotion-frontend/eslint.config.js'

const nodeGlobals = {
  Buffer: 'readonly',
  clearInterval: 'readonly',
  clearTimeout: 'readonly',
  console: 'readonly',
  exports: 'readonly',
  global: 'readonly',
  globalThis: 'readonly',
  module: 'readonly',
  process: 'readonly',
  require: 'readonly',
  setInterval: 'readonly',
  setTimeout: 'readonly',
  __dirname: 'readonly',
  __filename: 'readonly',
}

export default [
  {
    ignores: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/coverage/**', '.git/**'],
  },
  ...frontendConfig,
  {
    files: ['**/*.js'],
    ignores: ['aninotion-frontend/**'],
    languageOptions: {
      ecmaVersion: 'latest',
      globals: nodeGlobals,
      sourceType: 'commonjs',
    },
    rules: {
      ...js.configs.recommended.rules,
    },
  },
]