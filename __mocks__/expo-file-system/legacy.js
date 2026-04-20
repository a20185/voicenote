// Mock for expo-file-system/legacy
module.exports = {
  documentDirectory: '/mock/document/',
  bundleDirectory: '/mock/bundle/',
  getInfoAsync: jest.fn().mockResolvedValue({ exists: false }),
  makeDirectoryAsync: jest.fn().mockResolvedValue(undefined),
  deleteAsync: jest.fn().mockResolvedValue(undefined),
  copyAsync: jest.fn().mockResolvedValue(undefined),
  readDirectoryAsync: jest.fn().mockResolvedValue([]),
  downloadAsync: jest.fn().mockResolvedValue({ uri: '/mock/downloaded' }),
};
