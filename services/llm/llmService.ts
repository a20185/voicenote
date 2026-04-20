/**
 * LLM Service
 *
 * Provides a unified interface for local (llama.cpp) and cloud LLM calls.
 */

import type {
  LLMChatCompletionRequest,
  LLMChatCompletionResponse,
  LLMChatCompletionChunk,
  LLMProviderInfo,
  LLMProviderType,
} from '@/types/llm';
import { llmProviderManager } from './providers/LLMProviderManager';
import { useSettingsStore } from '@/store/useSettingsStore';
import { getLocalLLMModelInfo } from './modelManager';

export function isLLMConfigured(): boolean {
  const { aiConfig } = useSettingsStore.getState();
  const envProvider = process.env.EXPO_PUBLIC_AI_PROVIDER as LLMProviderType | undefined;
  const provider = aiConfig.provider || envProvider || 'cloud';

  if (provider === 'local') {
    return true;
  }

  const apiUrl = aiConfig.apiUrl || process.env.EXPO_PUBLIC_AI_API_URL || '';
  const apiKey = aiConfig.apiKey || process.env.EXPO_PUBLIC_AI_API_KEY || '';
  return Boolean(apiUrl && apiKey);
}

export async function createChatCompletion(
  request: LLMChatCompletionRequest
): Promise<LLMChatCompletionResponse> {
  await llmProviderManager.initialize();
  return llmProviderManager.createChatCompletion(request);
}

export async function streamChatCompletion(
  request: LLMChatCompletionRequest,
  onChunk: (chunk: LLMChatCompletionChunk) => void
): Promise<LLMChatCompletionResponse> {
  await llmProviderManager.initialize();
  return llmProviderManager.streamChatCompletion(request, onChunk);
}

export async function getLLMProviderInfo(): Promise<LLMProviderInfo> {
  await llmProviderManager.initialize();
  return llmProviderManager.getProviderInfo();
}

export async function getLocalModelInfo(options?: {
  prepareBundled?: boolean;
}) {
  const { aiConfig } = useSettingsStore.getState();
  return getLocalLLMModelInfo({
    preferredPath: process.env.EXPO_PUBLIC_AI_LOCAL_MODEL_PATH || aiConfig.localModelPath || undefined,
    prepareBundled: options?.prepareBundled ?? false,
  });
}
