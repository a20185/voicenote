// Mock for react-native
const NativeEventEmitter = jest.fn().mockImplementation(() => ({
  addListener: jest.fn().mockReturnValue({ remove: jest.fn() }),
  removeSubscription: jest.fn(),
  emit: jest.fn(),
}));

module.exports = {
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
  NativeEventEmitter,
  Platform: {
    OS: 'ios',
    select: jest.fn((obj) => obj?.ios || obj?.default),
  },
  StyleSheet: {
    create: jest.fn((styles) => styles),
    flatten: jest.fn((style) => style),
  },
  View: 'View',
  Text: 'Text',
  Image: 'Image',
  TouchableOpacity: 'TouchableOpacity',
  Pressable: 'Pressable',
  ActivityIndicator: 'ActivityIndicator',
  ScrollView: 'ScrollView',
  TextInput: 'TextInput',
};
