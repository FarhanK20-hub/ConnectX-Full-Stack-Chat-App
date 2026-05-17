module.exports = {
  testEnvironment: 'node',
  collectCoverageFrom: ['**/*.js', '!server.js', '!tests/**'],
  coverageDirectory: 'coverage',
  coverageThreshold: {
    global: {
      lines: 80,
      functions: 80,
      branches: 75,
      statements: 80,
    },
  },
  setupFilesAfterEnv: ['./tests/setup.js'],
  testTimeout: 10000,
};
