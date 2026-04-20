/** @type {import('jest').Config} */
module.exports = {
  // Don't use jest-expo preset - it causes issues with import.meta
  testEnvironment: 'node',
  setupFilesAfterEnv: [
    '@testing-library/jest-native/extend-expect',
    '<rootDir>/jest.setup.js',
  ],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        // Override for tests
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
      },
    }],
  },
  moduleNameMapper: {
    // Specific mocks should come before general patterns
    '^@/store$': '<rootDir>/__mocks__/store.js',
    '^@/(.*)$': '<rootDir>/$1',
    '^@components/(.*)$': '<rootDir>/components/$1',
    '^@hooks/(.*)$': '<rootDir>/hooks/$1',
    '^@store/(.*)$': '<rootDir>/store/$1',
    '^@services/(.*)$': '<rootDir>/services/$1',
    '^@db/(.*)$': '<rootDir>/db/$1',
    '^@theme/(.*)$': '<rootDir>/theme/$1',
    '^@types/(.*)$': '<rootDir>/types/$1',
    '^@utils/(.*)$': '<rootDir>/utils/$1',
    // Mock expo modules
    '^expo$': '<rootDir>/__mocks__/expo.js',
    '^expo-file-system(/legacy)?$': '<rootDir>/__mocks__/expo-file-system/legacy.js',
    '^expo-asset$': '<rootDir>/__mocks__/expo-asset.js',
    '^@react-native-async-storage/async-storage$': '<rootDir>/__mocks__/async-storage.js',
    '^react-native$': '<rootDir>/__mocks__/react-native.js',
    // Mock i18n
    '^i18next$': '<rootDir>/__mocks__/i18next.js',
  },
  testMatch: ['**/__tests__/**/*.test.{ts,tsx}'],
  collectCoverageFrom: [
    'services/asr/**/*.{ts,tsx}',
    'hooks/useStreamingASR.ts',
    '!**/*.d.ts',
    '!**/__tests__/**',
  ],
};
