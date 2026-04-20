/**
 * Model Manager Types
 *
 * Types for model download and storage management.
 */

import type { MoonshineLanguage, ModelArch, ModelStatus } from '@/types/asr';

/**
 * Model identifier format: moonshine-{arch}-{lang}
 * e.g., moonshine-base-zh, moonshine-small-en
 */
export type ModelId = `moonshine-${ModelArch}-${MoonshineLanguage}`;

/**
 * Model download progress callback
 */
export type DownloadProgressCallback = (
  progress: number, // 0-100
  status: ModelStatus
) => void;

/**
 * Model download options
 */
export interface ModelDownloadOptions {
  /** Language to download */
  language: MoonshineLanguage;
  /** Model architecture */
  arch: ModelArch;
  /** Custom download URL (optional) */
  customUrl?: string;
  /** Progress callback */
  onProgress?: DownloadProgressCallback;
}

/**
 * Remote model information
 */
export interface RemoteModelInfo {
  id: ModelId;
  name: string;
  language: MoonshineLanguage;
  arch: ModelArch;
  size: number; // in bytes
  downloadUrl: string;
  checksum?: string;
}

/**
 * Local model information
 */
export interface LocalModelInfo {
  id: ModelId;
  name: string;
  language: MoonshineLanguage;
  arch: ModelArch;
  localPath: string;
  size: number; // in bytes
  downloadedAt: Date;
}

/**
 * Model file structure
 */
export interface ModelFiles {
  encoder: string; // encoder_model.ort
  decoder: string; // decoder_model_merged.ort
  tokenizer: string; // tokenizer.bin
}

/**
 * Default model URLs
 */
export const DEFAULT_MODEL_BASE_URL =
  'https://github.com/nickyoung-github/moonshine-models/releases/download/v0.0.49';

/**
 * Get model download URL
 */
export function getModelDownloadUrl(
  language: MoonshineLanguage,
  arch: ModelArch,
  baseUrl: string = DEFAULT_MODEL_BASE_URL
): string {
  return `${baseUrl}/moonshine-${arch}-${language}.tar.gz`;
}

/**
 * Get model ID
 */
export function getModelId(language: MoonshineLanguage, arch: ModelArch): ModelId {
  return `moonshine-${arch}-${language}` as ModelId;
}

/**
 * Parse model ID to components
 */
export function parseModelId(modelId: string): { language: MoonshineLanguage; arch: ModelArch } | null {
  const match = modelId.match(/^moonshine-(small|base)-([a-z]{2})$/);
  if (!match) return null;
  return {
    arch: match[1] as ModelArch,
    language: match[2] as MoonshineLanguage,
  };
}

/**
 * Model display names
 */
export const MODEL_DISPLAY_NAMES: Record<MoonshineLanguage, string> = {
  zh: '中文',
  en: 'English',
  ja: '日本語',
  ko: '한국어',
  ar: 'العربية',
  es: 'Español',
  vi: 'Tiếng Việt',
  uk: 'Українська',
};

/**
 * Model sizes (approximate, in bytes)
 */
export const MODEL_SIZES: Record<ModelArch, number> = {
  small: 50 * 1024 * 1024, // ~50MB
  base: 150 * 1024 * 1024, // ~150MB
};
