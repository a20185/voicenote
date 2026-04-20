/**
 * LLM Provider Interface Definitions
 */

import type {
  LLMProviderCapabilities,
  LLMChatCompletionRequest,
  LLMChatCompletionResponse,
  LLMChatCompletionChunk,
} from '@/types/llm';

export type LLMStreamCallback = (chunk: LLMChatCompletionChunk) => void;

export interface LLMProvider {
  readonly name: string;
  readonly type: 'local' | 'cloud';
  readonly capabilities: LLMProviderCapabilities;
  readonly error: string | null;

  isReady(): Promise<boolean>;
  initialize(): Promise<void>;
  dispose(): Promise<void>;

  chatCompletion(request: LLMChatCompletionRequest): Promise<LLMChatCompletionResponse>;
  streamChatCompletion(
    request: LLMChatCompletionRequest,
    onChunk: LLMStreamCallback
  ): Promise<LLMChatCompletionResponse>;
}
