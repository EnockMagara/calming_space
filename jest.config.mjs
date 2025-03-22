export default {
  testEnvironment: 'node',
  transform: {},
  extensionsToTreatAsEsm: ['.js', '.mjs'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  testMatch: ['**/__tests__/**/*.mjs', '**/?(*.)+(spec|test).mjs'],
}; 