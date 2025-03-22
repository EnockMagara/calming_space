export default {
  testEnvironment: 'node',
  transform: {},
  extensionsToTreatAsEsm: [],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  },
  testMatch: ['**/__tests__/**/*.mjs', '**/?(*.)+(spec|test).mjs'],
  transformIgnorePatterns: [
    '/node_modules/(?!(@babel/runtime)/)'
  ],
  cacheDirectory: '~/.npm/jest-cache' // Specify cache directory for CI
};