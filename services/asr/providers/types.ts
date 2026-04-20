/**
 * ASR Provider Interface Definitions
 *
 * Defines interfaces for streaming and non-streaming ASR providers.
 */

import type {
  ASRTranscriptionResult,
  StreamingEvent,
  ASRProviderCapabilities,
} from '@/types/asr';

// ============================================================================
// Options Types
// ============================================================================

/**
 * Options for non-streaming transcription
 */
export interface TranscribeOptions {
  /** Language code for transcription */
  language?: string;
  /** Timeout in milliseconds */
  timeout?: number;
}

/**
 * Options for streaming transcription
 */
export interface StreamingOptions {
  /** Language code for transcription */
  language?: string;
  /** Specific model ID to use */
  modelId?: string;
}

// ============================================================================
// Callback Types
// ============================================================================

/**
 * Callback for streaming events
 */
export type StreamingCallback = (event: StreamingEvent) => void;

// ============================================================================
// Provider Interfaces
// ============================================================================

/**
 * Base provider interface with common methods
 */
export interface BaseProvider {
  /** Provider display name */
  readonly name: string;

  /** Provider capabilities */
  readonly capabilities: ASRProviderCapabilities;

  /** Last error message, if any */
  readonly error: string | null;

  /**
   * Check if provider is ready for use
   */
  isReady(): Promise<boolean>;

  /**
   * Initialize provider resources
   */
  initialize(): Promise<void>;

  /**
   * Dispose provider resources
   */
  dispose(): Promise<void>;
}

/**
 * Non-streaming ASR provider interface
 * Used for cloud providers like SenseVoice
 */
export interface NonStreamingProvider extends BaseProvider {
  /** Provider type identifier */
  readonly type: 'non-streaming';

  /**
   * Transcribe audio file
   * @param uri - Local file URI of audio
   * @param options - Transcription options
   * @returns Transcription result
   */
  transcribe(uri: string, options?: TranscribeOptions): Promise<ASRTranscriptionResult>;
}

/**
 * Streaming ASR provider interface
 * Used for local providers like Moonshine
 */
export interface StreamingProvider extends BaseProvider {
  /** Provider type identifier */
  readonly type: 'streaming';

  /**
   * Start streaming transcription
   * Audio is captured internally by the native module
   * @param options - Streaming options
   */
  startStreaming(options?: StreamingOptions): Promise<void>;

  /**
   * Stop streaming and get final result
   * @returns Final transcription result
   */
  stopStreaming(): Promise<ASRTranscriptionResult>;

  /**
   * Subscribe to streaming events
   * @param callback - Event callback
   * @returns Unsubscribe function
   */
  subscribe(callback: StreamingCallback): () => void;
}

/**
 * Union type for all ASR providers
 */
export type ASRProvider = NonStreamingProvider | StreamingProvider;

/**
 * Type guard for streaming provider
 */
export function isStreamingProvider(provider: ASRProvider): provider is StreamingProvider {
  return provider.type === 'streaming';
}

/**
 * Type guard for non-streaming provider
 */
export function isNonStreamingProvider(provider: ASRProvider): provider is NonStreamingProvider {
  return provider.type === 'non-streaming';
}
