// Mock for @/store (Zustand store)
const mockSettingsStore = {
  getState: jest.fn(() => ({
    asrConfig: {
      provider: 'cloud',
      apiUrl: 'https://test-api.example.com',
      apiKey: 'test-api-key',
      cloudProvider: 'sensevoice',
      localProvider: 'moonshine',
      defaultLanguage: 'zh',
      defaultModelArch: 'base',
      modelDownloadSource: 'default',
    },
    setAsrConfig: jest.fn(),
  })),
  setState: jest.fn(),
  subscribe: jest.fn(),
  destroy: jest.fn(),
};

module.exports = {
  useSettingsStore: mockSettingsStore,
};
