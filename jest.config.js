module.exports = {
  setupFilesAfterEnv: ['<rootDir>/setupTestFramework.js'],
  moduleNameMapper: {
    'netlify-cms-lib-auth': '<rootDir>/packages/netlify-cms-lib-auth/src/index.js',
    'netlify-cms-lib-util': '<rootDir>/packages/netlify-cms-lib-util/src/index.ts',
    'netlify-cms-ui-default': '<rootDir>/packages/netlify-cms-ui-default/src/index.js',
    'netlify-cms-backend-github': '<rootDir>/packages/netlify-cms-backend-github/src/index.ts',
    'netlify-cms-lib-widgets': '<rootDir>/packages/netlify-cms-lib-widgets/src/index.ts',
    'netlify-cms-widget-object': '<rootDir>/packages/netlify-cms-widget-object/src/index.js',
    '\\.(css|less)$': '<rootDir>/__mocks__/styleMock.js',
  },
  testURL: 'http://localhost:8080',
  snapshotSerializers: ['jest-emotion'],
  transformIgnorePatterns: ['node_modules/(?!copy-text-to-clipboard)'],
  testEnvironment: 'jsdom',
};
