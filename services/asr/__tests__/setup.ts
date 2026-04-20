/**
 * Jest setup file for ASR module tests
 */

// Mock AsyncStorage first
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn().mockResolvedValue(undefined),
  getItem: jest.fn().mockResolvedValue(null),
  removeItem: jest.fn().mockResolvedValue(undefined),
  clear: jest.fn().mockResolvedValue(undefined),
  getAllKeys: jest.fn().mockResolvedValue([]),
  multiGet: jest.fn().mockResolvedValue([]),
  multiSet: jest.fn().mockResolvedValue(undefined),
  multiRemove: jest.fn().mockResolvedValue(undefined),
}));

// Mock expo-file-system
jest.mock('expo-file-system/legacy', () => ({
  documentDirectory: '/mock/document/',
  bundleDirectory: '/mock/bundle/',
  getInfoAsync: jest.fn().mockResolvedValue({ exists: false }),
  makeDirectoryAsync: jest.fn().mockResolvedValue(undefined),
  deleteAsync: jest.fn().mockResolvedValue(undefined),
  copyAsync: jest.fn().mockResolvedValue(undefined),
  readDirectoryAsync: jest.fn().mockResolvedValue([]),
  downloadAsync: jest.fn().mockResolvedValue({ uri: '/mock/downloaded' }),
}));

// Mock expo-asset
jest.mock('expo-asset', () => ({
  Asset: {
    loadAsync: jest.fn().mockResolvedValue([]),
    fromModule: jest.fn().mockReturnValue({
      downloadAsync: jest.fn().mockResolvedValue({ localUri: '/mock/asset' }),
    }),
  },
}));

// Mock NativeModules for moonshine module
jest.mock('react-native', () => ({
  NativeModules: {
    MoonshineModule: {
      isAvailable: jest.fn().mockReturnValue(false),
      loadModel: jest.fn().mockResolvedValue(undefined),
      unloadModel: jest.fn().mockResolvedValue(undefined),
      isModelLoaded: jest.fn().mockResolvedValue(false),
      startStreaming: jest.fn().mockResolvedValue(undefined),
      stopStreaming: jest.fn().mockResolvedValue({ text: '' }),
    },
  },
  NativeEventEmitter: jest.fn().mockImplementation(() => ({
    addListener: jest.fn().mockReturnValue({ remove: jest.fn() }),
    removeSubscription: jest.fn(),
  })),
  Platform: {
    OS: 'ios',
    select: jest.fn((obj) => obj.ios),
  },
}));

// Mock zustand store
jest.mock('@/store/useSettingsStore', () => ({
  useSettingsStore: {
    getState: jest.fn().mockReturnValue({
      asrConfig: {
        provider: 'cloud',
        defaultLanguage: 'zh',
        defaultModelArch: 'base',
        cloudProvider: 'sensevoice',
        apiUrl: 'https://api.example.com',
        apiKey: 'test-key',
      },
    }),
  },
  defaultASRConfig: {
    provider: 'cloud',
    defaultLanguage: 'zh',
    defaultModelArch: 'base',
    cloudProvider: 'sensevoice',
    apiUrl: '',
    apiKey: '',
  },
}));

// Suppress console.warn in tests
const originalWarn = console.warn;
beforeAll(() => {
  console.warn = (...args: unknown[]) => {
    if (typeof args[0] === 'string' && args[0].includes('Bundled')) {
      return;
    }
    originalWarn(...args);
  };
});

afterAll(() => {
  console.warn = originalWarn;
});
