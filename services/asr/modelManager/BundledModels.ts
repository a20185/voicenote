/**
 * Bundled Model Manager
 *
 * Handles extraction of bundled models from app assets to the document directory.
 * This allows the app to ship with a default model (e.g., moonshine-base-zh)
 * that works offline without requiring an initial download.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';
import type { MoonshineLanguage, ModelArch } from '@/types/asr';
import { getModelPath, isModelDownloaded, getModelsDirectory } from './ModelStorage';
import { getModelId } from './types';

/**
 * Bundled model configuration
 */
interface BundledModelConfig {
  language: MoonshineLanguage;
  arch: ModelArch;
  assetFiles: string[]; // Names of files in assets/models/
  assetModules?: Record<string, number>; // Expo Asset module ids keyed by file name
}

const EXTRACT_ATTEMPT_KEY_PREFIX = 'asr:bundled-extract-attempt:';

function getExtractAttemptKey(language: MoonshineLanguage, arch: ModelArch): string {
  return `${EXTRACT_ATTEMPT_KEY_PREFIX}moonshine-${arch}-${language}`;
}

async function hasExtractAttempted(language: MoonshineLanguage, arch: ModelArch): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(getExtractAttemptKey(language, arch))) === '1';
  } catch {
    return false;
  }
}

async function markExtractAttempted(language: MoonshineLanguage, arch: ModelArch): Promise<void> {
  try {
    await AsyncStorage.setItem(getExtractAttemptKey(language, arch), '1');
  } catch {
    // Ignore storage errors
  }
}

/**
 * Configuration of bundled models
 *
 * To add a bundled model:
 * 1. Create a directory in assets/models/ with the model name (e.g., moonshine-base-zh/)
 * 2. Place the model files there: encoder_model.ort, decoder_model_merged.ort, tokenizer.bin
 * 3. Add the configuration here
 *
 * Note: Model files are large (~50-150MB). Only bundle the most commonly used model.
 */
export const BUNDLED_MODELS: BundledModelConfig[] = [
  {
    language: 'zh',
    arch: 'base',
    assetFiles: [
      'encoder_model.ort',
      'decoder_model_merged.ort',
      'tokenizer.bin',
    ],
    assetModules: {
      'encoder_model.ort': require('../../../assets/models/moonshine-base-zh/encoder_model.ort'),
      'decoder_model_merged.ort': require('../../../assets/models/moonshine-base-zh/decoder_model_merged.ort'),
      'tokenizer.bin': require('../../../assets/models/moonshine-base-zh/tokenizer.bin'),
    },
  },
];

/**
 * Check if a model is bundled with the app
 */
export function isBundledModel(language: MoonshineLanguage, arch: ModelArch): boolean {
  return BUNDLED_MODELS.some(
    (m) => m.language === language && m.arch === arch
  );
}

/**
 * Get list of all bundled models
 */
export function getBundledModels(): Array<{ language: MoonshineLanguage; arch: ModelArch }> {
  return BUNDLED_MODELS.map(({ language, arch }) => ({ language, arch }));
}

/**
 * Extract a bundled model from assets to the document directory
 *
 * @returns Path to the extracted model, or null if extraction failed
 */
export async function extractBundledModel(
  language: MoonshineLanguage,
  arch: ModelArch
): Promise<string | null> {
  const config = BUNDLED_MODELS.find(
    (m) => m.language === language && m.arch === arch
  );

  if (!config) {
    console.warn(`No bundled model found for ${language}/${arch}`);
    return null;
  }

  // Check if already extracted
  if (await isModelDownloaded(language, arch)) {
    return getModelPath(language, arch);
  }

  if (await hasExtractAttempted(language, arch)) {
    return null;
  }

  try {
    const modelPath = await getModelPath(language, arch);
    const modelsDir = await getModelsDirectory();

    // Ensure models directory exists
    const dirInfo = await FileSystem.getInfoAsync(modelsDir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(modelsDir, { intermediates: true });
    }

    // Create model directory
    await FileSystem.makeDirectoryAsync(modelPath, { intermediates: true });

    // Copy each file from assets to the model directory
    for (const fileName of config.assetFiles) {
      // In Expo, bundled assets are available via the Asset module
      // For native platforms, we need to use a different approach
      // since assets are bundled differently on iOS vs Android

      // On iOS: Assets are in the main bundle
      // On Android: Assets are in the assets/ directory

      // For now, we'll read from the document directory where
      // the build process should copy the model files

      // Alternative: Use expo-file-system to copy from bundle assets
      // This requires native module support or expo-asset

      const bundleRoot = FileSystem.bundleDirectory || '';
      const sourcePaths = [
        `${bundleRoot}models/moonshine-${arch}-${language}/${fileName}`,
        `${bundleRoot}assets/models/moonshine-${arch}-${language}/${fileName}`,
      ];
      const destPath = `${modelPath}/${fileName}`;

      // Try to copy from bundle assets
      try {
        // On native platforms, check if asset exists in bundle
        let resolvedPath: string | null = null;
        for (const sourcePath of sourcePaths) {
          const assetInfo = await FileSystem.getInfoAsync(sourcePath);
          if (assetInfo.exists) {
            resolvedPath = sourcePath;
            break;
          }
        }

        if (resolvedPath) {
          await FileSystem.copyAsync({ from: resolvedPath, to: destPath });
          continue;
        }

        const assetModule = config.assetModules?.[fileName];
        if (assetModule != null) {
          const asset = Asset.fromModule(assetModule);
          await asset.downloadAsync();
          const assetUri = asset.localUri ?? asset.uri;
          if (assetUri) {
            await FileSystem.copyAsync({ from: assetUri, to: destPath });
            continue;
          }
        }

        console.warn(`Bundled asset not found: ${sourcePaths.join(' | ')}`);
        // Clean up partial extraction
        await FileSystem.deleteAsync(modelPath, { idempotent: true });
        return null;
      } catch (copyError) {
        console.error(`Failed to copy asset ${fileName}:`, copyError);
        // Clean up partial extraction
        await FileSystem.deleteAsync(modelPath, { idempotent: true });
        return null;
      }
    }

    console.log(`Successfully extracted bundled model: ${getModelId(language, arch)}`);
    return modelPath;
  } catch (error) {
    console.error(`Failed to extract bundled model:`, error);
    return null;
  } finally {
    await markExtractAttempted(language, arch);
  }
}

/**
 * Extract all bundled models on first launch
 *
 * This should be called during app initialization if local ASR is enabled.
 */
export async function extractAllBundledModels(): Promise<void> {
  for (const { language, arch } of BUNDLED_MODELS) {
    try {
      // Only extract if not already present
      if (!(await isModelDownloaded(language, arch))) {
        await extractBundledModel(language, arch);
      }
    } catch (error) {
      console.error(`Failed to extract bundled model ${language}/${arch}:`, error);
    }
  }
}

/**
 * Check if any bundled models exist in the app
 */
export async function checkBundledModelsAvailability(): Promise<boolean> {
  // Check if we have any bundled models configured
  if (BUNDLED_MODELS.length === 0) {
    return false;
  }

  // Try to verify at least one bundled model file exists
  // This is a quick check to see if models were included in the build
  for (const { language, arch, assetFiles, assetModules } of BUNDLED_MODELS) {
    for (const fileName of assetFiles) {
      try {
        if (assetModules?.[fileName] != null) {
          return true;
        }

        const bundleRoot = FileSystem.bundleDirectory || '';
        const assetPaths = [
          `${bundleRoot}models/moonshine-${arch}-${language}/${fileName}`,
          `${bundleRoot}assets/models/moonshine-${arch}-${language}/${fileName}`,
        ];
        for (const assetPath of assetPaths) {
          const info = await FileSystem.getInfoAsync(assetPath);
          if (info.exists) {
            return true;
          }
        }
      } catch {
        // Continue checking other files
      }
    }
  }

  return false;
}
