/**
 * ASR Providers Module
 *
 * Exports provider interfaces and implementations.
 */

// Types
export type {
  ASRProvider,
  NonStreamingProvider,
  StreamingProvider,
  BaseProvider,
  TranscribeOptions,
  StreamingOptions,
  StreamingCallback,
} from './types';

export {
  isStreamingProvider,
  isNonStreamingProvider,
} from './types';

// Base class
export { ASRProviderBase } from './base';

// Provider implementations
export { SenseVoiceProvider, getSenseVoiceProvider } from './cloud';
export { MoonshineProvider, getMoonshineProvider } from './local';

// Provider manager
export { asrProviderManager } from './ASRProviderManager';
