/**
 * ASR Provider Manager
 *
 * Coordinates between different ASR providers (cloud and local).
 * Manages provider lifecycle, selection, and state.
 */

import { useSettingsStore } from '@/store';
import type {
  ASRProvider,
  TranscribeOptions,
  StreamingOptions,
  StreamingCallback,
} from './types';
import { isStreamingProvider } from './types';
import { getSenseVoiceProvider } from './cloud';
import { getMoonshineProvider } from './local';
import type {
  ASRProviderType,
  ASRProviderInfo,
  ASRTranscriptionResult,
  ProviderStatus,
} from '@/types/asr';

/**
 * ASR Provider Manager
 *
 * Singleton that manages ASR provider selection and coordination.
 */
class ASRProviderManagerImpl {
  private _currentProvider: ASRProvider | null = null;
  private _providers: Map<string, ASRProvider> = new Map();
  private _isInitialized = false;

  /**
   * Initialize the provider manager
   */
  async initialize(): Promise<void> {
    if (this._isInitialized) return;

    // Register cloud provider
    const senseVoiceProvider = getSenseVoiceProvider();
    this._providers.set('cloud:sensevoice', senseVoiceProvider);

    // Register local provider (Moonshine)
    const moonshineProvider = getMoonshineProvider();
    this._providers.set('local:moonshine', moonshineProvider);

    this._isInitialized = true;
  }

  /**
   * Get current provider type from settings
   */
  getProviderType(): ASRProviderType {
    const { asrConfig } = useSettingsStore.getState();
    return asrConfig.provider;
  }

  /**
   * Get the current active provider
   */
  async getCurrentProvider(): Promise<ASRProvider> {
    const providerType = this.getProviderType();

    // Check if we need to switch providers
    const providerKey = this.getProviderKey(providerType);

    if (this._currentProvider && this.getProviderKeyFromProvider(this._currentProvider) === providerKey) {
      return this._currentProvider;
    }

    // Dispose old provider
    if (this._currentProvider) {
      await this._currentProvider.dispose();
    }

    // Get or create new provider
    let provider = this._providers.get(providerKey);

    if (!provider) {
      const newProvider = await this.createProvider(providerType);
      if (newProvider) {
        this._providers.set(providerKey, newProvider);
        provider = newProvider;
      }
    }

    if (!provider) {
      throw new Error(`Provider not available: ${providerType}`);
    }

    // Initialize provider if needed
    if (!(await provider.isReady())) {
      await provider.initialize();
    }

    this._currentProvider = provider;
    return provider;
  }

  /**
   * Get provider key for storage
   */
  private getProviderKey(type: ASRProviderType): string {
    const { asrConfig } = useSettingsStore.getState();

    if (type === 'cloud') {
      return `cloud:${asrConfig.cloudProvider}`;
    } else {
      return `local:${asrConfig.localProvider}`;
    }
  }

  /**
   * Get provider key from provider instance
   */
  private getProviderKeyFromProvider(provider: ASRProvider): string {
    if (isStreamingProvider(provider)) {
      return `local:${provider.name.toLowerCase()}`;
    } else {
      return `cloud:${provider.name.toLowerCase()}`;
    }
  }

  /**
   * Create a new provider instance
   */
  private async createProvider(type: ASRProviderType): Promise<ASRProvider | null> {
    if (type === 'cloud') {
      // Currently only SenseVoice is supported
      return getSenseVoiceProvider();
    } else {
      // Local provider (Moonshine)
      return getMoonshineProvider();
    }
  }

  /**
   * Transcribe audio using current provider
   */
  async transcribe(
    uri: string,
    options?: TranscribeOptions
  ): Promise<ASRTranscriptionResult> {
    const provider = await this.getCurrentProvider();

    if (isStreamingProvider(provider)) {
      // Streaming providers don't support file transcription directly
      // This should not happen in normal flow
      throw new Error('Streaming provider does not support file transcription');
    }

    return provider.transcribe(uri, options);
  }

  /**
   * Start streaming transcription (for streaming providers)
   */
  async startStreaming(options?: StreamingOptions): Promise<void> {
    const provider = await this.getCurrentProvider();

    if (!isStreamingProvider(provider)) {
      throw new Error('Current provider does not support streaming');
    }

    return provider.startStreaming(options);
  }

  /**
   * Stop streaming transcription
   */
  async stopStreaming(): Promise<ASRTranscriptionResult> {
    const provider = await this.getCurrentProvider();

    if (!isStreamingProvider(provider)) {
      throw new Error('Current provider does not support streaming');
    }

    return provider.stopStreaming();
  }

  /**
   * Subscribe to streaming events
   */
  subscribe(callback: StreamingCallback): () => void {
    if (!this._currentProvider || !isStreamingProvider(this._currentProvider)) {
      return () => {};
    }

    return this._currentProvider.subscribe(callback);
  }

  /**
   * Get provider information
   */
  async getProviderInfo(): Promise<ASRProviderInfo> {
    try {
      const provider = await this.getCurrentProvider();
      const isReady = await provider.isReady();

      let status: ProviderStatus;
      if (!isReady) {
        status = 'unavailable';
      } else if (provider.error) {
        status = 'error';
      } else {
        status = 'ready';
      }

      return {
        type: isStreamingProvider(provider) ? 'local' : 'cloud',
        name: provider.name,
        status,
        capabilities: provider.capabilities,
        error: provider.error || undefined,
      };
    } catch (error) {
      return {
        type: this.getProviderType(),
        name: 'Unknown',
        status: 'error',
        capabilities: {
          supportsStreaming: false,
          supportsRealTime: false,
          supportedLanguages: [],
          requiresNetwork: true,
          requiresModelDownload: false,
        },
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Check if current provider supports streaming
   */
  async supportsStreaming(): Promise<boolean> {
    const provider = await this.getCurrentProvider();
    return isStreamingProvider(provider);
  }

  /**
   * Dispose all providers
   */
  async dispose(): Promise<void> {
    if (this._currentProvider) {
      await this._currentProvider.dispose();
      this._currentProvider = null;
    }

    for (const provider of this._providers.values()) {
      await provider.dispose();
    }

    this._providers.clear();
    this._isInitialized = false;
  }
}

// Singleton instance
export const asrProviderManager = new ASRProviderManagerImpl();
