/**
 * LLM Model Manager
 *
 * Resolves a single local GGUF model path for llama.rn.
 *
 * Notes:
 * - Large GGUF files should not be imported into the JS bundle.
 * - Prefer EXPO_PUBLIC_AI_LOCAL_MODEL_PATH for local development.
 */

import * as FileSystem from 'expo-file-system/legacy';

const MODELS_DIR_NAME = 'llm-models';
const MIN_VALID_MODEL_BYTES = 1_048_576;

export const FIXED_LOCAL_MODEL_FILENAME = 'Qwen3.5-0.8B-UD-Q4_K_XL.gguf';

export type LocalLLMModelStatus = 'ready' | 'missing' | 'preparing' | 'error';

export interface LocalLLMModelInfo {
  status: LocalLLMModelStatus;
  source: 'bundled' | 'custom';
  filename: string;
  path?: string;
  error?: string;
}

function ensureTrailingSlash(path: string): string {
  return path.endsWith('/') ? path : `${path}/`;
}

function normalizeModelFilename(path: string): string {
  const pathWithoutQuery = path.split('?')[0];
  const parts = pathWithoutQuery.split('/');
  return parts[parts.length - 1] || FIXED_LOCAL_MODEL_FILENAME;
}

function normalizePathCandidate(path: string): string {
  return path.startsWith('file://') ? path.replace('file://', '') : path;
}

function isValidGGUF(info: FileSystem.FileInfo): boolean {
  if (!info.exists || info.isDirectory) {
    return false;
  }

  if (typeof info.size !== 'number') {
    return false;
  }

  return info.size >= MIN_VALID_MODEL_BYTES;
}

function getConfiguredModelPath(preferredPath?: string): string | undefined {
  const envPath = process.env.EXPO_PUBLIC_AI_LOCAL_MODEL_PATH;
  if (envPath) {
    return envPath;
  }

  if (preferredPath) {
    return preferredPath;
  }

  return undefined;
}

export async function getModelsDirectory(): Promise<string> {
  const baseDir = FileSystem.documentDirectory || FileSystem.cacheDirectory;
  if (!baseDir) {
    throw new Error('No writable directory available for model storage');
  }

  const dir = `${ensureTrailingSlash(baseDir)}${MODELS_DIR_NAME}`;
  const info = await FileSystem.getInfoAsync(dir);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  }

  return dir;
}

export async function listLocalModels(): Promise<string[]> {
  const dir = await getModelsDirectory();
  const entries = await FileSystem.readDirectoryAsync(dir);
  return entries.filter((entry) => entry.toLowerCase().endsWith('.gguf'));
}

async function resolveExistingModelPath(path: string): Promise<string | null> {
  const normalized = normalizePathCandidate(path);
  const info = await FileSystem.getInfoAsync(normalized);
  return isValidGGUF(info) ? normalized : null;
}

async function resolveModelPath(path: string): Promise<string | null> {
  const candidates = new Set<string>();

  candidates.add(path);
  candidates.add(normalizePathCandidate(path));

  if (!path.includes('/') && !path.includes('\\')) {
    const dir = await getModelsDirectory();
    const withExt = path.toLowerCase().endsWith('.gguf') ? path : `${path}.gguf`;
    candidates.add(`${ensureTrailingSlash(dir)}${withExt}`);
  }

  for (const candidate of candidates) {
    const resolved = await resolveExistingModelPath(candidate);
    if (resolved) {
      return resolved;
    }
  }

  return null;
}

export async function getLocalLLMModelInfo(options?: {
  preferredPath?: string;
  prepareBundled?: boolean;
}): Promise<LocalLLMModelInfo> {
  const configuredPath = getConfiguredModelPath(options?.preferredPath);

  if (configuredPath) {
    const resolved = await resolveModelPath(configuredPath);
    if (resolved) {
      return {
        status: 'ready',
        source: 'custom',
        filename: normalizeModelFilename(resolved),
        path: resolved,
      };
    }

    return {
      status: 'missing',
      source: 'custom',
      filename: normalizeModelFilename(configuredPath),
      error: `Configured local model not found: ${configuredPath}`,
    };
  }

  const fallback = await resolveLocalModelPath();
  if (fallback) {
    return {
      status: 'ready',
      source: 'custom',
      filename: normalizeModelFilename(fallback),
      path: fallback,
    };
  }

  return {
    status: 'missing',
    source: 'custom',
    filename: FIXED_LOCAL_MODEL_FILENAME,
    error: 'No local GGUF model found. Set EXPO_PUBLIC_AI_LOCAL_MODEL_PATH.',
  };
}

export async function resolveLocalModelPath(preferredPath?: string): Promise<string | null> {
  const configuredPath = getConfiguredModelPath(preferredPath);
  if (configuredPath) {
    const resolved = await resolveModelPath(configuredPath);
    if (resolved) {
      return resolved;
    }
  }

  const fixedModel = await resolveModelPath(FIXED_LOCAL_MODEL_FILENAME);
  if (fixedModel) {
    return fixedModel;
  }

  try {
    const entries = await listLocalModels();
    for (const entry of entries) {
      const resolved = await resolveModelPath(entry);
      if (resolved) {
        return resolved;
      }
    }
  } catch {
    // Ignore directory read failures
  }

  return null;
}

export async function importModelFromUri(uri: string, filename?: string): Promise<string> {
  const dir = await getModelsDirectory();
  const targetName = filename || uri.split('/').pop() || FIXED_LOCAL_MODEL_FILENAME;
  const targetPath = `${ensureTrailingSlash(dir)}${targetName}`;

  await FileSystem.copyAsync({ from: uri, to: targetPath });
  return targetPath;
}
