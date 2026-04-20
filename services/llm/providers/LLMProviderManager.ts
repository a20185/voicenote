/**
 * LLM Provider Manager
 *
 * Selects between local (llama.cpp) and cloud (OpenAI-compatible) providers.
 */

import type {
  LLMProviderType,
  LLMProviderInfo,
  LLMChatCompletionRequest,
  LLMChatCompletionResponse,
} from '@/types/llm';
import type { LLMProvider, LLMStreamCallback } from './types';
import { getLlamaProvider } from './local/LlamaProvider';
import { getOpenAIProvider } from './cloud/OpenAIProvider';
import { useSettingsStore } from '@/store/useSettingsStore';

class LLMProviderManagerImpl {
  private _currentProvider: LLMProvider | null = null;
  private _providers: Map<string, LLMProvider> = new Map();
  private _isInitialized = false;

  async initialize(): Promise<void> {
    if (this._isInitialized) return;

    this._providers.set('local:llama', getLlamaProvider());
    this._providers.set('cloud:openai', getOpenAIProvider());
    this._isInitialized = true;
  }

  private getPreferredProviderType(): LLMProviderType {
    const { aiConfig } = useSettingsStore.getState();
    const envProvider = process.env.EXPO_PUBLIC_AI_PROVIDER as LLMProviderType | undefined;
    return aiConfig.provider || envProvider || 'cloud';
  }

  private getProviderKey(type: LLMProviderType): string {
    return type === 'local' ? 'local:llama' : 'cloud:openai';
  }

  private async ensureProviderReady(provider: LLMProvider): Promise<boolean> {
    if (await provider.isReady()) {
      return true;
    }

    try {
      await provider.initialize();
    } catch {
      return false;
    }

    return provider.isReady();
  }

  async getCurrentProvider(): Promise<LLMProvider> {
    await this.initialize();

    const preferred = this.getPreferredProviderType();
    const key = this.getProviderKey(preferred);
    const provider = this._providers.get(key);

    if (!provider) {
      throw new Error(`LLM provider is not registered: ${preferred}`);
    }

    if (this._currentProvider && this._currentProvider !== provider) {
      await this._currentProvider.dispose();
      this._currentProvider = null;
    }

    if (this._currentProvider === provider && (await provider.isReady())) {
      return provider;
    }

    const ready = await this.ensureProviderReady(provider);
    if (!ready) {
      const defaultError = preferred === 'local'
        ? 'Local LLM is not ready. Ensure the bundled GGUF model is available.'
        : 'Cloud AI provider is not configured.';
      throw new Error(provider.error || defaultError);
    }

    this._currentProvider = provider;
    return provider;
  }

  async createChatCompletion(request: LLMChatCompletionRequest): Promise<LLMChatCompletionResponse> {
    const provider = await this.getCurrentProvider();
    return provider.chatCompletion(request);
  }

  async streamChatCompletion(
    request: LLMChatCompletionRequest,
    onChunk: LLMStreamCallback
  ): Promise<LLMChatCompletionResponse> {
    const provider = await this.getCurrentProvider();
    return provider.streamChatCompletion(request, onChunk);
  }

  async getProviderInfo(): Promise<LLMProviderInfo> {
    await this.initialize();
    const preferredType = this.getPreferredProviderType();
    const provider = this._providers.get(this.getProviderKey(preferredType));

    if (!provider) {
      return {
        type: preferredType,
        name: 'Unknown',
        status: 'error',
        capabilities: {
          supportsStreaming: false,
          supportsChat: false,
          requiresNetwork: preferredType === 'cloud',
          requiresModelDownload: preferredType === 'local',
        },
        error: `LLM provider is not registered: ${preferredType}`,
      };
    }

    try {
      const isReady = await this.ensureProviderReady(provider);
      const status = isReady
        ? provider.error ? 'error' : 'ready'
        : 'unavailable';

      if (isReady) {
        this._currentProvider = provider;
      }

      return {
        type: provider.type,
        name: provider.name,
        status,
        capabilities: provider.capabilities,
        error: provider.error || undefined,
      };
    } catch (error) {
      return {
        type: provider.type,
        name: provider.name,
        status: 'error',
        capabilities: provider.capabilities,
        error: provider.error || (error instanceof Error ? error.message : 'Unknown error'),
      };
    }
  }

  async dispose(): Promise<void> {
    if (this._currentProvider) {
      await this._currentProvider.dispose();
      this._currentProvider = null;
    }

    for (const provider of this._providers.values()) {
      await provider.dispose();
    }

    this._providers.clear();
    this._isInitialized = false;
  }
}

export const llmProviderManager = new LLMProviderManagerImpl();
