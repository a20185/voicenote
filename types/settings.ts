import type {
  ASRProviderType,
  CloudASRProvider,
  LocalASRProvider,
  MoonshineLanguage,
  ModelArch,
  ModelDownloadSource,
} from './asr';

/**
 * ASR configuration
 * Supports both cloud and local ASR providers
 */
export interface ASRConfig {
  // Provider selection
  provider: ASRProviderType;

  // Cloud settings (used when provider === 'cloud')
  cloudProvider: CloudASRProvider;
  apiUrl: string;
  apiKey: string;

  // Local settings (used when provider === 'local')
  localProvider: LocalASRProvider;
  defaultLanguage: MoonshineLanguage;
  defaultModelArch: ModelArch;
  modelDownloadSource: ModelDownloadSource;
  customModelUrl?: string;
}

export interface AIConfig {
  provider: 'local' | 'cloud';
  apiUrl: string;
  apiKey: string;
  model: string;
  localModelPath?: string;
  localContextTokens?: number;
  localThreads?: number;
  localGpuLayers?: number;
  localBatchSize?: number;
}

export interface Skill {
  id: string;
  name: string;
  url: string;
  description: string;
  status: 'loaded' | 'loading' | 'error';
  error?: string;
}

export interface SkillsConfig {
  enabled: boolean;
  skills: Skill[];
}

export type { OptimizationLevel, OptimizationConfig } from './transcription';
