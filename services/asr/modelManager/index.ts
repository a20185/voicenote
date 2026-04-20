/**
 * Model Manager Module
 *
 * Exports model download and storage utilities.
 */

// Types
export type {
  ModelId,
  DownloadProgressCallback,
  ModelDownloadOptions,
  RemoteModelInfo,
  LocalModelInfo,
  ModelFiles,
} from './types';

export {
  DEFAULT_MODEL_BASE_URL,
  MODEL_DISPLAY_NAMES,
  MODEL_SIZES,
  getModelDownloadUrl,
  getModelId,
  parseModelId,
} from './types';

// Storage
export {
  getModelsDirectory,
  getModelPath,
  isModelDownloaded,
  verifyModelFiles,
  getDownloadedModels,
  getModelSize,
  deleteModel,
  getRequiredModelFiles,
  formatSize,
} from './ModelStorage';

// Downloader
export {
  downloadModel,
  cancelDownload,
  getDownloadStatus,
  clearDownloadStatus,
} from './ModelDownloader';

// Bundled Models
export {
  BUNDLED_MODELS,
  isBundledModel,
  getBundledModels,
  extractBundledModel,
  extractAllBundledModels,
  checkBundledModelsAvailability,
} from './BundledModels';
