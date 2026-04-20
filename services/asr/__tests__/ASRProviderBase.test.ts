/**
 * Tests for ASRProviderBase
 */

import { ASRProviderBase } from '../providers/base/ASRProviderBase';
import type { ASRProviderCapabilities } from '@/types/asr';

// Create a concrete implementation for testing
class TestProvider extends ASRProviderBase {
  readonly type = 'non-streaming' as const;
  readonly name = 'TestProvider';
  readonly capabilities: ASRProviderCapabilities = {
    supportsStreaming: false,
    supportsRealTime: false,
    supportedLanguages: ['en'],
    requiresNetwork: false,
    requiresModelDownload: false,
  };

  async transcribe(): Promise<{ text: string }> {
    return { text: 'test' };
  }
}

describe('ASRProviderBase', () => {
  let provider: TestProvider;

  beforeEach(() => {
    provider = new TestProvider();
  });

  afterEach(async () => {
    await provider.dispose();
  });

  describe('initialization', () => {
    it('should start uninitialized', async () => {
      // Base class starts with _isInitialized = false
      const ready = await provider.isReady();
      expect(ready).toBe(false);
    });

    it('should be ready after initialize()', async () => {
      await provider.initialize();
      const ready = await provider.isReady();
      expect(ready).toBe(true);
    });

    it('should not throw on double initialize', async () => {
      await provider.initialize();
      await expect(provider.initialize()).resolves.not.toThrow();
    });
  });

  describe('error handling', () => {
    it('should have no error initially', () => {
      expect(provider.error).toBeNull();
    });

    it('should expose error as readonly property', () => {
      // error is a getter that returns _error
      expect(typeof provider.error).toBe('object');
    });
  });

  describe('dispose', () => {
    it('should reset initialized state', async () => {
      await provider.initialize();
      expect(await provider.isReady()).toBe(true);

      await provider.dispose();
      expect(await provider.isReady()).toBe(false);
    });

    it('should clear error on dispose', async () => {
      await provider.initialize();
      await provider.dispose();
      expect(provider.error).toBeNull();
    });
  });

  describe('capabilities', () => {
    it('should expose capabilities', () => {
      expect(provider.capabilities).toBeDefined();
      expect(provider.capabilities.supportsStreaming).toBe(false);
      expect(provider.capabilities.supportedLanguages).toContain('en');
    });
  });
});
