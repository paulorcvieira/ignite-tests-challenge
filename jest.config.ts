export default {
  roots: ['<rootDir>/src'],
  collectCoverageFrom: ['<rootDir>/src/**/*.ts', '!<rootDir>/src/main/**'],
  coverageDirectory: 'coverage',
  bail: true,
  clearMocks: true,
  coverageProvider: 'babel',
  collectCoverage: true,
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: {
    '.+\\.ts$': 'ts-jest'
  },
  testMatch: ['**/?(*.)+(spec|test).[jt]s?(x)'],
  setupFiles: ['dotenv/config', 'reflect-metadata'],
  testPathIgnorePatterns: ['/node_modules/']
}
