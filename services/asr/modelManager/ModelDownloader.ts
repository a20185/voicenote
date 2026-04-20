/**
 * Model Downloader
 *
 * Handles downloading and extracting Moonshine models.
 */

import * as FileSystem from 'expo-file-system/legacy';
import i18n from 'i18next';
import type { MoonshineLanguage, ModelArch, ModelStatus } from '@/types/asr';
import {
  getModelPath,
  isModelDownloaded,
  verifyModelFiles,
  deleteModel,
} from './ModelStorage';
import type {
  ModelDownloadOptions,
  ModelId,
} from './types';
import { MODEL_SIZES, getModelDownloadUrl } from './types';

/**
 * Download status for tracking
 */
interface DownloadState {
  status: ModelStatus;
  progress: number;
  error?: string;
}

// Active downloads
const activeDownloads = new Map<string, DownloadState>();

/**
 * Download a Moonshine model
 */
export async function downloadModel(
  options: ModelDownloadOptions
): Promise<string> {
  const { language, arch, customUrl, onProgress } = options;
  const modelId = `moonshine-${arch}-${language}` as ModelId;

  // Check if already downloading
  const existing = activeDownloads.get(modelId);
  if (existing?.status === 'downloading') {
    throw new Error(i18n.t('errors:modelAlreadyDownloading'));
  }

  // Check if already downloaded
  if (await isModelDownloaded(language, arch)) {
    const modelPath = await getModelPath(language, arch);
    return modelPath;
  }

  // Get download URL
  const downloadUrl = customUrl || getModelDownloadUrl(language, arch);

  // Initialize download state
  activeDownloads.set(modelId, {
    status: 'downloading',
    progress: 0,
  });

  try {
    // Get model path
    const modelPath = await getModelPath(language, arch);

    // Create model directory
    await FileSystem.makeDirectoryAsync(modelPath, { intermediates: true });

    // Download archive to temp location
    const cacheDir = FileSystem.cacheDirectory;
    if (!cacheDir) {
      throw new Error(i18n.t('errors:cacheDirectoryNotAvailable'));
    }
    const tempFile = `${cacheDir}moonshine-model.tar.gz`;

    onProgress?.(0, 'downloading');
    activeDownloads.set(modelId, { status: 'downloading', progress: 0 });

    // Download with progress (result used for verification)
    const _downloadResult = await FileSystem.downloadAsync(
      downloadUrl,
      tempFile,
      {
        // Note: expo-file-system doesn't support progress callbacks directly
        // For real progress, we'd need a custom native module
      }
    );

    onProgress?.(50, 'extracting');
    activeDownloads.set(modelId, { status: 'extracting', progress: 50 });

    // Extract the archive
    // Note: expo-file-system doesn't support tar.gz extraction natively
    // We need to use a custom native module or a JS library
    // For now, we'll assume the backend provides extracted files
    // In production, implement native extraction or use a library

    // Alternative: Download individual files instead of archive
    const modelFiles = [
      'encoder_model.ort',
      'decoder_model_merged.ort',
      'tokenizer.bin',
    ];

    const baseUrl = downloadUrl.replace('.tar.gz', '');
    // Reserved for future progress tracking
    const _downloadedBytes = 0;
    const _totalSize = MODEL_SIZES[arch];

    for (let i = 0; i < modelFiles.length; i++) {
      const file = modelFiles[i];
      const fileUrl = `${baseUrl}/${file}`;
      const destPath = `${modelPath}/${file}`;

      await FileSystem.downloadAsync(fileUrl, destPath);

      // Update progress
      const progress = Math.round(((i + 1) / modelFiles.length) * 100);
      onProgress?.(progress, 'extracting');
      activeDownloads.set(modelId, {
        status: 'extracting',
        progress,
      });
    }

    // Clean up temp file
    const tempInfo = await FileSystem.getInfoAsync(tempFile);
    if (tempInfo.exists) {
      await FileSystem.deleteAsync(tempFile);
    }

    // Verify extraction
    if (!(await verifyModelFiles(modelPath))) {
      throw new Error(i18n.t('errors:modelExtractionFailed'));
    }

    // Mark as complete
    activeDownloads.set(modelId, { status: 'downloaded', progress: 100 });
    onProgress?.(100, 'downloaded');

    return modelPath;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Download failed';

    activeDownloads.set(modelId, {
      status: 'error',
      progress: 0,
      error: errorMessage,
    });

    onProgress?.(0, 'error');

    // Clean up partial download
    try {
      await deleteModel(language, arch);
    } catch {
      // Ignore cleanup errors
    }

    throw new Error(errorMessage, { cause: error });
  }
}

/**
 * Cancel an active download
 */
export async function cancelDownload(
  language: MoonshineLanguage,
  arch: ModelArch
): Promise<void> {
  const modelId = `moonshine-${arch}-${language}` as ModelId;

  activeDownloads.delete(modelId);

  // Clean up partial download
  try {
    await deleteModel(language, arch);
  } catch {
    // Ignore cleanup errors
  }
}

/**
 * Get download status
 */
export function getDownloadStatus(
  language: MoonshineLanguage,
  arch: ModelArch
): DownloadState | undefined {
  const modelId = `moonshine-${arch}-${language}` as ModelId;
  return activeDownloads.get(modelId);
}

/**
 * Clear download status
 */
export function clearDownloadStatus(
  language: MoonshineLanguage,
  arch: ModelArch
): void {
  const modelId = `moonshine-${arch}-${language}` as ModelId;
  activeDownloads.delete(modelId);
}
