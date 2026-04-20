import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ASRConfig, AIConfig, Skill, SkillsConfig, OptimizationConfig, OptimizationLevel } from '@/types/settings';

type ThemeMode = 'light' | 'dark' | 'system';
type AudioQuality = 'low' | 'medium' | 'high';

interface SettingsState {
  theme: ThemeMode;
  audioQuality: AudioQuality;
  autoSave: boolean;
  autoSync: boolean;
  syncOnWifiOnly: boolean;
  notificationsEnabled: boolean;
  hapticFeedback: boolean;
  language: string;
  asrConfig: ASRConfig;
  aiConfig: AIConfig;
  skillsConfig: SkillsConfig;
  optimizationConfig: OptimizationConfig;
}

interface SettingsActions {
  setTheme: (theme: ThemeMode) => void;
  setAudioQuality: (quality: AudioQuality) => void;
  setAutoSave: (autoSave: boolean) => void;
  setAutoSync: (autoSync: boolean) => void;
  setSyncOnWifiOnly: (wifiOnly: boolean) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  setHapticFeedback: (enabled: boolean) => void;
  setLanguage: (language: string) => void;
  setASRConfig: (config: ASRConfig) => void;
  setASRProvider: (provider: ASRConfig['provider']) => void;
  setASRCloudConfig: (apiUrl: string, apiKey: string, cloudProvider?: ASRConfig['cloudProvider']) => void;
  setASRLocalConfig: (defaultLanguage: ASRConfig['defaultLanguage'], defaultModelArch: ASRConfig['defaultModelArch']) => void;
  setAIConfig: (config: AIConfig) => void;
  setSkillsEnabled: (enabled: boolean) => void;
  addSkill: (skill: Skill) => void;
  removeSkill: (id: string) => void;
  updateSkill: (id: string, updates: Partial<Skill>) => void;
  setOptimizationEnabled: (enabled: boolean) => void;
  setOptimizationLevel: (level: OptimizationLevel) => void;
  reset: () => void;
}

const LEGACY_MODEL_ARCH_MAP: Record<string, ASRConfig['defaultModelArch']> = {
  tiny: 'small',
  tinyStreaming: 'small',
  baseStreaming: 'base',
  smallStreaming: 'base',
  mediumStreaming: 'base',
};

function normalizeModelArch(value: unknown): ASRConfig['defaultModelArch'] {
  if (value === 'small' || value === 'base') {
    return value;
  }
  if (typeof value === 'string' && value in LEGACY_MODEL_ARCH_MAP) {
    return LEGACY_MODEL_ARCH_MAP[value];
  }
  return 'base';
}

function normalizeASRConfig(config?: Partial<ASRConfig>): ASRConfig {
  return {
    ...defaultASRConfig,
    ...config,
    defaultModelArch: normalizeModelArch(config?.defaultModelArch),
  };
}

const defaultASRConfig: ASRConfig = {
  // Provider selection - default to cloud for backward compatibility
  provider: 'cloud',

  // Cloud settings
  cloudProvider: 'sensevoice',
  apiUrl: process.env.EXPO_PUBLIC_ASR_API_URL || '',
  apiKey: process.env.EXPO_PUBLIC_ASR_API_KEY || '',

  // Local settings
  localProvider: 'moonshine',
  defaultLanguage: 'zh',
  defaultModelArch: 'base',
  modelDownloadSource: 'default',
  customModelUrl: undefined,
};

const envLocalContextTokens = Number(process.env.EXPO_PUBLIC_AI_LOCAL_CONTEXT_TOKENS);
const envLocalThreads = Number(process.env.EXPO_PUBLIC_AI_LOCAL_THREADS);
const envLocalGpuLayers = Number(process.env.EXPO_PUBLIC_AI_LOCAL_GPU_LAYERS);
const envLocalBatchSize = Number(process.env.EXPO_PUBLIC_AI_LOCAL_BATCH_SIZE);

const defaultAIConfig: AIConfig = {
  provider: (process.env.EXPO_PUBLIC_AI_PROVIDER as AIConfig['provider']) || 'cloud',
  apiUrl: process.env.EXPO_PUBLIC_AI_API_URL || 'https://api.openai.com/v1',
  apiKey: process.env.EXPO_PUBLIC_AI_API_KEY || '',
  model: process.env.EXPO_PUBLIC_AI_MODEL || 'gpt-4o-mini',
  localModelPath: process.env.EXPO_PUBLIC_AI_LOCAL_MODEL_PATH || undefined,
  localContextTokens: Number.isFinite(envLocalContextTokens) ? envLocalContextTokens : undefined,
  localThreads: Number.isFinite(envLocalThreads) ? envLocalThreads : undefined,
  localGpuLayers: Number.isFinite(envLocalGpuLayers) ? envLocalGpuLayers : undefined,
  localBatchSize: Number.isFinite(envLocalBatchSize) ? envLocalBatchSize : undefined,
};

const defaultSkillsConfig: SkillsConfig = {
  enabled: false,
  skills: [],
};

const defaultOptimizationConfig: OptimizationConfig = {
  enabled: false,
  level: 'medium',
};

const defaultSettings: SettingsState = {
  theme: 'system',
  audioQuality: 'high',
  autoSave: true,
  autoSync: true,
  syncOnWifiOnly: true,
  notificationsEnabled: true,
  hapticFeedback: true,
  language: 'en',
  asrConfig: defaultASRConfig,
  aiConfig: defaultAIConfig,
  skillsConfig: defaultSkillsConfig,
  optimizationConfig: defaultOptimizationConfig,
};

export { defaultASRConfig, defaultAIConfig, defaultSkillsConfig, defaultOptimizationConfig };

export const useSettingsStore = create<SettingsState & SettingsActions>()(
  persist(
    (set) => ({
      ...defaultSettings,

      setTheme: (theme) => set({ theme }),
      setAudioQuality: (audioQuality) => set({ audioQuality }),
      setAutoSave: (autoSave) => set({ autoSave }),
      setAutoSync: (autoSync) => set({ autoSync }),
      setSyncOnWifiOnly: (syncOnWifiOnly) => set({ syncOnWifiOnly }),
      setNotificationsEnabled: (notificationsEnabled) => set({ notificationsEnabled }),
      setHapticFeedback: (hapticFeedback) => set({ hapticFeedback }),
      setLanguage: (language) => set({ language }),
      setASRConfig: (asrConfig) => set({ asrConfig }),
      setASRProvider: (provider) =>
        set((state) => ({ asrConfig: { ...state.asrConfig, provider } })),
      setASRCloudConfig: (apiUrl, apiKey, cloudProvider = 'sensevoice') =>
        set((state) => ({
          asrConfig: { ...state.asrConfig, apiUrl, apiKey, cloudProvider },
        })),
      setASRLocalConfig: (defaultLanguage, defaultModelArch) =>
        set((state) => ({
          asrConfig: { ...state.asrConfig, defaultLanguage, defaultModelArch },
        })),
      setAIConfig: (aiConfig) => set({ aiConfig }),
      setSkillsEnabled: (enabled) =>
        set((state) => ({ skillsConfig: { ...state.skillsConfig, enabled } })),
      addSkill: (skill) =>
        set((state) => ({
          skillsConfig: { ...state.skillsConfig, skills: [...state.skillsConfig.skills, skill] },
        })),
      removeSkill: (id) =>
        set((state) => ({
          skillsConfig: {
            ...state.skillsConfig,
            skills: state.skillsConfig.skills.filter((s) => s.id !== id),
          },
        })),
      updateSkill: (id, updates) =>
        set((state) => ({
          skillsConfig: {
            ...state.skillsConfig,
            skills: state.skillsConfig.skills.map((s) => (s.id === id ? { ...s, ...updates } : s)),
          },
        })),
      setOptimizationEnabled: (enabled) =>
        set((state) => ({
          optimizationConfig: { ...state.optimizationConfig, enabled },
        })),
      setOptimizationLevel: (level) =>
        set((state) => ({
          optimizationConfig: { ...state.optimizationConfig, level },
        })),
      reset: () => set(defaultSettings),
    }),
    {
      name: 'settings-storage',
      storage: createJSONStorage(() => AsyncStorage),
      merge: (persisted, current) => {
        const persistedState = (persisted as Partial<SettingsState>) || {};
        return {
          ...current,
          ...persistedState,
          asrConfig: normalizeASRConfig(persistedState.asrConfig),
          aiConfig: {
            ...current.aiConfig,
            ...(persistedState.aiConfig || {}),
          },
          skillsConfig: {
            ...current.skillsConfig,
            ...(persistedState.skillsConfig || {}),
            skills: Array.isArray(persistedState.skillsConfig?.skills)
              ? persistedState.skillsConfig!.skills
              : current.skillsConfig.skills,
          },
          optimizationConfig: {
            ...current.optimizationConfig,
            ...(persistedState.optimizationConfig || {}),
          },
        };
      },
    }
  )
);
