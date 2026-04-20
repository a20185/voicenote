/**
 * Tests for ASRProviderManager
 */

import { asrProviderManager } from '../providers/ASRProviderManager';
import { isStreamingProvider, isNonStreamingProvider } from '../providers';
import type { ASRProviderCapabilities } from '@/types/asr';

describe('ASRProviderManager', () => {
  beforeEach(async () => {
    await asrProviderManager.initialize();
  });

  afterEach(async () => {
    await asrProviderManager.dispose();
  });

  describe('initialization', () => {
    it('should initialize successfully', async () => {
      await asrProviderManager.initialize();
      // Should not throw on double initialize
      await expect(asrProviderManager.initialize()).resolves.not.toThrow();
    });
  });

  describe('provider type', () => {
    it('should get provider type from settings', () => {
      const providerType = asrProviderManager.getProviderType();
      expect(['cloud', 'local']).toContain(providerType);
    });
  });

  describe('current provider', () => {
    it('should get current provider', async () => {
      const provider = await asrProviderManager.getCurrentProvider();
      expect(provider).toBeDefined();
      expect(provider.name).toBeDefined();
    });
  });

  describe('provider info', () => {
    it('should return provider info', async () => {
      const info = await asrProviderManager.getProviderInfo();
      expect(info).toBeDefined();
      expect(info.type).toBeDefined();
      expect(info.name).toBeDefined();
      expect(info.status).toBeDefined();
      expect(info.capabilities).toBeDefined();
    });
  });

  describe('streaming support', () => {
    it('should check streaming support', async () => {
      const supports = await asrProviderManager.supportsStreaming();
      expect(typeof supports).toBe('boolean');
    });
  });
});

describe('Type guards', () => {
  const baseCapabilities: ASRProviderCapabilities = {
    supportsStreaming: true,
    supportsRealTime: true,
    supportedLanguages: ['en'],
    requiresNetwork: false,
    requiresModelDownload: false,
  };

  describe('isStreamingProvider', () => {
    it('should return true for streaming provider type', () => {
      const mockStreamingProvider = {
        type: 'streaming' as const,
        name: 'TestStreaming',
        capabilities: baseCapabilities,
        error: null,
        isReady: jest.fn(),
        startStreaming: jest.fn(),
        stopStreaming: jest.fn(),
        subscribe: jest.fn(),
        initialize: jest.fn(),
        dispose: jest.fn(),
      };
      expect(isStreamingProvider(mockStreamingProvider)).toBe(true);
    });

    it('should return false for non-streaming provider type', () => {
      const mockNonStreamingProvider = {
        type: 'non-streaming' as const,
        name: 'TestNonStreaming',
        capabilities: { ...baseCapabilities, supportsStreaming: false },
        error: null,
        isReady: jest.fn(),
        transcribe: jest.fn(),
        initialize: jest.fn(),
        dispose: jest.fn(),
      };
      expect(isStreamingProvider(mockNonStreamingProvider)).toBe(false);
    });
  });

  describe('isNonStreamingProvider', () => {
    it('should return true for non-streaming provider type', () => {
      const mockNonStreamingProvider = {
        type: 'non-streaming' as const,
        name: 'TestNonStreaming',
        capabilities: { ...baseCapabilities, supportsStreaming: false },
        error: null,
        isReady: jest.fn(),
        transcribe: jest.fn(),
        initialize: jest.fn(),
        dispose: jest.fn(),
      };
      expect(isNonStreamingProvider(mockNonStreamingProvider)).toBe(true);
    });

    it('should return false for streaming provider type', () => {
      const mockStreamingProvider = {
        type: 'streaming' as const,
        name: 'TestStreaming',
        capabilities: baseCapabilities,
        error: null,
        isReady: jest.fn(),
        startStreaming: jest.fn(),
        stopStreaming: jest.fn(),
        subscribe: jest.fn(),
        initialize: jest.fn(),
        dispose: jest.fn(),
      };
      expect(isNonStreamingProvider(mockStreamingProvider)).toBe(false);
    });
  });
});
