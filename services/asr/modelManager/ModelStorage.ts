/**
 * Model Storage
 *
 * Manages local storage of Moonshine models.
 */

import * as FileSystem from 'expo-file-system/legacy';
import type { MoonshineLanguage, ModelArch } from '@/types/asr';
import type { ModelId, LocalModelInfo, ModelFiles } from './types';
import { MODEL_DISPLAY_NAMES } from './types';

/**
 * Model directory name
 */
const MODELS_DIR_NAME = 'moonshine-models';

/**
 * Model files that must exist for a valid model
 */
const REQUIRED_MODEL_FILES: ModelFiles = {
  encoder: 'encoder_model.ort',
  decoder: 'decoder_model_merged.ort',
  tokenizer: 'tokenizer.bin',
};

/**
 * Get the base models directory path
 */
export async function getModelsDirectory(): Promise<string> {
  const baseDir = FileSystem.documentDirectory;
  if (!baseDir) {
    throw new Error('Document directory not available');
  }

  const modelsDir = `${baseDir}${MODELS_DIR_NAME}`;

  // Ensure directory exists
  const dirInfo = await FileSystem.getInfoAsync(modelsDir);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(modelsDir, { intermediates: true });
  }

  return modelsDir;
}

/**
 * Get the path for a specific model
 */
export async function getModelPath(
  language: MoonshineLanguage,
  arch: ModelArch
): Promise<string> {
  const modelsDir = await getModelsDirectory();
  return `${modelsDir}/moonshine-${arch}-${language}`;
}

/**
 * Check if a model is downloaded
 */
export async function isModelDownloaded(
  language: MoonshineLanguage,
  arch: ModelArch
): Promise<boolean> {
  const modelPath = await getModelPath(language, arch);
  return verifyModelFiles(modelPath);
}

/**
 * Verify that all required model files exist
 */
export async function verifyModelFiles(modelPath: string): Promise<boolean> {
  try {
    for (const file of Object.values(REQUIRED_MODEL_FILES)) {
      const filePath = `${modelPath}/${file}`;
      const info = await FileSystem.getInfoAsync(filePath);
      if (!info.exists) {
        return false;
      }
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Get list of downloaded models
 */
export async function getDownloadedModels(): Promise<LocalModelInfo[]> {
  const modelsDir = await getModelsDirectory();
  const models: LocalModelInfo[] = [];

  try {
    const entries = await FileSystem.readDirectoryAsync(modelsDir);

    for (const entry of entries) {
      const modelPath = `${modelsDir}/${entry}`;

      // Check if it's a valid model directory
      const info = await FileSystem.getInfoAsync(modelPath);
      if (!info.isDirectory) continue;

      // Verify model files
      if (!(await verifyModelFiles(modelPath))) continue;

      // Parse model ID
      const match = entry.match(/^moonshine-(small|base)-([a-z]{2})$/);
      if (!match) continue;

      const arch = match[1] as ModelArch;
      const language = match[2] as MoonshineLanguage;

      // Get model size
      const size = await getModelSize(modelPath);

      models.push({
        id: entry as ModelId,
        name: `${MODEL_DISPLAY_NAMES[language]} (${arch})`,
        language,
        arch,
        localPath: modelPath,
        size,
        downloadedAt: new Date(),
      });
    }
  } catch {
    // Directory doesn't exist or can't be read
  }

  return models;
}

/**
 * Get total size of a model directory
 */
export async function getModelSize(modelPath: string): Promise<number> {
  let totalSize = 0;

  try {
    const entries = await FileSystem.readDirectoryAsync(modelPath);

    for (const entry of entries) {
      const filePath = `${modelPath}/${entry}`;
      const info = await FileSystem.getInfoAsync(filePath);
      if (info.exists && 'size' in info) {
        totalSize += info.size || 0;
      }
    }
  } catch {
    // Ignore errors
  }

  return totalSize;
}

/**
 * Delete a model
 */
export async function deleteModel(
  language: MoonshineLanguage,
  arch: ModelArch
): Promise<void> {
  const modelPath = await getModelPath(language, arch);
  const info = await FileSystem.getInfoAsync(modelPath);

  if (info.exists) {
    await FileSystem.deleteAsync(modelPath);
  }
}

/**
 * Get the required model files structure
 */
export function getRequiredModelFiles(): ModelFiles {
  return { ...REQUIRED_MODEL_FILES };
}

/**
 * Format size for display
 */
export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
