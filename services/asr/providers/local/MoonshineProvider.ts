/**
 * Moonshine Local ASR Provider
 *
 * Provides streaming speech recognition using the Moonshine ONNX models
 * running locally on the device through a native Turbo Module.
 */

import { Platform } from 'react-native';
import type {
  ASRProviderType,
  ASRProviderCapabilities,
  ASRTranscriptionResult,
  StreamingEvent,
  MoonshineLanguage,
  ModelArch,
} from '@/types/asr';
import type { StreamingProvider, StreamingOptions, StreamingCallback } from '../types';
import { ASRProviderBase } from '../base/ASRProviderBase';
import {
  MoonshineModule,
  setEventListener,
  isMoonshineAvailable,
} from '@/modules/moonshine';
import {
  getModelPath,
  isModelDownloaded,
  extractBundledModel,
  isBundledModel,
} from '../../modelManager';
import { useSettingsStore } from '@/store/useSettingsStore';

function toNativeModelArch(arch: ModelArch): string {
  return arch === 'small' ? 'tiny' : arch;
}

/**
 * Moonshine ASR Provider
 *
 * Implements streaming ASR using local Moonshine ONNX models.
 * Supports real-time transcription with incremental results.
 */
export class MoonshineProvider extends ASRProviderBase implements StreamingProvider {
  readonly type = 'streaming' as const;
  readonly name = 'Moonshine';

  readonly capabilities: ASRProviderCapabilities = {
    supportsStreaming: true,
    supportsRealTime: true,
    supportedLanguages: ['zh', 'en', 'ja', 'ko', 'ar', 'es', 'vi', 'uk'],
    requiresNetwork: false,
    requiresModelDownload: true,
  };

  private unsubscribeEvents: (() => void) | null = null;
  private callbacks: Set<StreamingCallback> = new Set();
  private isStreaming = false;
  private currentModelPath: string | null = null;
  private streamingStartTime: number = 0;

  /**
   * Check if provider is ready for use
   */
  override async isReady(): Promise<boolean> {
    if (!isMoonshineAvailable()) {
      return false;
    }

    const { defaultLanguage, defaultModelArch } = useSettingsStore.getState().asrConfig;
    const modelLoaded = await MoonshineModule.isModelLoaded();

    if (modelLoaded) {
      return true;
    }

    // Check if default model is downloaded or bundled
    const downloaded = await isModelDownloaded(defaultLanguage, defaultModelArch);
    if (downloaded) {
      return true;
    }

    // Check if it's a bundled model
    return isBundledModel(defaultLanguage, defaultModelArch);
  }

  /**
   * Initialize provider by loading the default model
   */
  override async initialize(): Promise<void> {
    await super.initialize();

    if (!isMoonshineAvailable()) {
      const message = 'Moonshine native module is not available on this build';
      this.setError(message);
      throw new Error(message);
    }

    try {
      const { defaultLanguage, defaultModelArch } = useSettingsStore.getState().asrConfig;

      // Check if model is already loaded
      if (await MoonshineModule.isModelLoaded()) {
        this.clearError();
        return;
      }

      // Check if model is downloaded
      let modelDownloaded = await isModelDownloaded(defaultLanguage, defaultModelArch);

      // If not downloaded but it's a bundled model, try to extract it
      if (!modelDownloaded && isBundledModel(defaultLanguage, defaultModelArch)) {
        const extractedPath = await extractBundledModel(defaultLanguage, defaultModelArch);
        if (extractedPath) {
          modelDownloaded = true;
        }
      }

      if (!modelDownloaded) {
        this.setError(
          `Model not downloaded. Please download the ${defaultModelArch} model for ${defaultLanguage}.`
        );
        return;
      }

      // Load model
      const modelPath = await getModelPath(defaultLanguage, defaultModelArch);
      await MoonshineModule.loadModel(modelPath, toNativeModelArch(defaultModelArch));
      this.currentModelPath = modelPath;

      this.clearError();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to initialize Moonshine';
      this.setError(message);
      throw error;
    }
  }

  /**
   * Dispose provider resources
   */
  override async dispose(): Promise<void> {
    // Stop streaming if active
    if (this.isStreaming) {
      await this.stopStreaming();
    }

    // Unload model
    try {
      if (await MoonshineModule.isModelLoaded()) {
        await MoonshineModule.unloadModel();
      }
    } catch {
      // Ignore unload errors
    }

    // Clear event subscriptions
    if (this.unsubscribeEvents) {
      this.unsubscribeEvents();
      this.unsubscribeEvents = null;
    }

    this.callbacks.clear();
    this.currentModelPath = null;
    await super.dispose();
  }

  /**
   * Load a specific model
   */
  async loadModel(language: MoonshineLanguage, arch: ModelArch): Promise<void> {
    if (!isMoonshineAvailable()) {
      throw new Error('Moonshine native module is not available on this build');
    }

    if (!(await isModelDownloaded(language, arch))) {
      throw new Error(`Model moonshine-${arch}-${language} is not downloaded`);
    }

    // Unload current model if any
    if (await MoonshineModule.isModelLoaded()) {
      await MoonshineModule.unloadModel();
    }

    const modelPath = await getModelPath(language, arch);
    await MoonshineModule.loadModel(modelPath, toNativeModelArch(arch));
    this.currentModelPath = modelPath;
    this.clearError();
  }

  /**
   * Start streaming transcription
   */
  async startStreaming(options?: StreamingOptions): Promise<void> {
    if (!isMoonshineAvailable()) {
      throw new Error('Moonshine native module is not available on this build');
    }

    if (this.isStreaming) {
      throw new Error('Streaming is already in progress');
    }

    if (!(await MoonshineModule.isModelLoaded())) {
      // Try to initialize
      await this.initialize();

      if (!(await MoonshineModule.isModelLoaded())) {
        throw new Error(this.error || 'No model loaded. Please download and load a model first.');
      }
    }

    // CRITICAL: Notify native module about mic permission (Android only)
    // This must be called before startStreaming on Android
    if (Platform.OS === 'android') {
      await MoonshineModule.onMicPermissionGranted?.();
    }

    // Set up event listener
    this.unsubscribeEvents = setEventListener((event: StreamingEvent) => {
      this.handleStreamingEvent(event);
    });

    // Start streaming
    const language = options?.language || useSettingsStore.getState().asrConfig.defaultLanguage;
    await MoonshineModule.startStreaming(language ?? null);

    this.isStreaming = true;
    this.streamingStartTime = Date.now();
  }

  /**
   * Stop streaming and get final result
   */
  async stopStreaming(): Promise<ASRTranscriptionResult> {
    if (!this.isStreaming) {
      return {
        text: '',
        provider: 'local' as ASRProviderType,
        processingTime: 0,
      };
    }

    try {
      const result = await MoonshineModule.stopStreaming();
      const processingTime = Date.now() - this.streamingStartTime;

      return {
        text: result.text,
        provider: 'local' as ASRProviderType,
        processingTime,
      };
    } finally {
      this.isStreaming = false;

      // Clean up event listener
      if (this.unsubscribeEvents) {
        this.unsubscribeEvents();
        this.unsubscribeEvents = null;
      }
    }
  }

  /**
   * Subscribe to streaming events
   */
  subscribe(callback: StreamingCallback): () => void {
    this.callbacks.add(callback);

    // Return unsubscribe function
    return () => {
      this.callbacks.delete(callback);
    };
  }

  /**
   * Handle streaming events from native module
   */
  private handleStreamingEvent(event: StreamingEvent): void {
    // Forward to all subscribers
    for (const callback of this.callbacks) {
      try {
        callback(event);
      } catch (error) {
        console.error('Error in streaming callback:', error);
      }
    }

    // Handle error events
    if (event.type === 'error') {
      this.setError(event.error || 'Streaming error occurred');
    }
  }
}

/**
 * Singleton instance
 */
let moonshineProviderInstance: MoonshineProvider | null = null;

/**
 * Get the Moonshine provider instance
 */
export function getMoonshineProvider(): MoonshineProvider {
  if (!moonshineProviderInstance) {
    moonshineProviderInstance = new MoonshineProvider();
  }
  return moonshineProviderInstance;
}
