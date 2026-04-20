/**
 * ASR (Automatic Speech Recognition) Type Definitions
 *
 * These types define the core ASR architecture with support for
 * multiple providers (local Moonshine, cloud SenseVoice).
 */

// ============================================================================
// Provider Types
// ============================================================================

/**
 * Available ASR provider types
 */
export type ASRProviderType = 'local' | 'cloud';

/**
 * Moonshine supported languages
 */
export type MoonshineLanguage = 'ar' | 'es' | 'en' | 'ja' | 'ko' | 'vi' | 'uk' | 'zh';

/**
 * Model architecture variants
 * App-level model ids match downloaded/bundled model names.
 */
export type ModelArch = 'small' | 'base';

/**
 * Default model architecture for streaming transcription
 */
export const DEFAULT_MODEL_ARCH: ModelArch = 'base';

/**
 * Legacy model architecture values from older app builds.
 * Used for persisted settings migration.
 */
export type LegacyModelArch =
  | 'tiny'
  | 'tinyStreaming'
  | 'baseStreaming'
  | 'smallStreaming'
  | 'mediumStreaming';

/**
 * Model download/installation status
 */
export type ModelStatus =
  | 'not_downloaded'
  | 'downloading'
  | 'extracting'
  | 'downloaded'
  | 'error';

/**
 * Provider operational status
 */
export type ProviderStatus = 'unavailable' | 'ready' | 'busy' | 'error';

// ============================================================================
// Streaming Types
// ============================================================================

/**
 * Streaming event types from Moonshine
 */
export type StreamingEventType =
  | 'line_started'
  | 'line_text_changed'
  | 'line_completed'
  | 'error';

/**
 * Streaming event from real-time transcription
 */
export interface StreamingEvent {
  type: StreamingEventType;
  text: string;
  isFinal: boolean;
  lineId?: number;
  error?: string;
}

// ============================================================================
// Model Types
// ============================================================================

/**
 * ASR model information
 */
export interface ASRModel {
  id: string;
  name: string;
  language: MoonshineLanguage;
  arch: ModelArch;
  status: ModelStatus;
  size: number; // in bytes
  downloadUrl?: string;
  localPath?: string;
  progress?: number; // download progress 0-100
  error?: string;
}

// ============================================================================
// Result Types
// ============================================================================

/**
 * ASR transcription result
 * Note: Different from TranscriptionResult in types/transcription.ts
 * which handles optimization results.
 */
export interface ASRTranscriptionResult {
  text: string;
  provider: ASRProviderType;
  language?: string;
  processingTime?: number; // in milliseconds
}

// ============================================================================
// Provider Info Types
// ============================================================================

/**
 * Provider capabilities description
 */
export interface ASRProviderCapabilities {
  supportsStreaming: boolean;
  supportsRealTime: boolean;
  supportedLanguages: string[];
  requiresNetwork: boolean;
  requiresModelDownload: boolean;
}

/**
 * Provider status information
 */
export interface ASRProviderInfo {
  type: ASRProviderType;
  name: string;
  status: ProviderStatus;
  capabilities: ASRProviderCapabilities;
  currentModel?: ASRModel;
  error?: string;
}

// ============================================================================
// Cloud Provider Types
// ============================================================================

/**
 * Available cloud ASR providers
 */
export type CloudASRProvider = 'sensevoice' | 'openai-whisper' | 'custom';

/**
 * Available local ASR providers
 */
export type LocalASRProvider = 'moonshine';

/**
 * Model download source configuration
 */
export type ModelDownloadSource = 'default' | 'custom';
