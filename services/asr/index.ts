/**
 * ASR Service Module
 *
 * Provides speech recognition capabilities through multiple providers.
 */

// Legacy API (deprecated - kept for backward compatibility)
export { transcribeAudio, isASRConfigured, type ASRResponse } from './asrService';

// New Provider API
export {
  // Types
  type ASRProvider,
  type NonStreamingProvider,
  type StreamingProvider,
  type TranscribeOptions,
  type StreamingOptions,
  type StreamingCallback,
  // Type guards
  isStreamingProvider,
  isNonStreamingProvider,
  // Provider implementations
  SenseVoiceProvider,
  getSenseVoiceProvider,
  MoonshineProvider,
  getMoonshineProvider,
  // Provider manager
  asrProviderManager,
} from './providers';

// Model Manager
export {
  // Types
  type ModelId,
  type DownloadProgressCallback,
  type ModelDownloadOptions,
  type RemoteModelInfo,
  type LocalModelInfo,
  type ModelFiles,
  // Constants
  DEFAULT_MODEL_BASE_URL,
  MODEL_DISPLAY_NAMES,
  MODEL_SIZES,
  getModelDownloadUrl,
  getModelId,
  parseModelId,
  // Storage
  getModelsDirectory,
  getModelPath,
  isModelDownloaded,
  verifyModelFiles,
  getDownloadedModels,
  getModelSize,
  deleteModel,
  getRequiredModelFiles,
  formatSize,
  // Downloader
  downloadModel,
  cancelDownload,
  getDownloadStatus,
  clearDownloadStatus,
  // Bundled Models
  BUNDLED_MODELS,
  isBundledModel,
  getBundledModels,
  extractBundledModel,
  extractAllBundledModels,
  checkBundledModelsAvailability,
} from './modelManager';
