/**
 * LLM (Large Language Model) Type Definitions
 *
 * Defines OpenAI-compatible chat completion request/response shapes
 * and provider capability metadata for local and cloud providers.
 */

// ============================================================================
// Provider Types
// ============================================================================

export type LLMProviderType = 'local' | 'cloud';

export type LLMProviderStatus = 'unavailable' | 'ready' | 'busy' | 'error';

export interface LLMProviderCapabilities {
  supportsStreaming: boolean;
  supportsChat: boolean;
  requiresNetwork: boolean;
  requiresModelDownload: boolean;
}

export interface LLMProviderInfo {
  type: LLMProviderType;
  name: string;
  status: LLMProviderStatus;
  capabilities: LLMProviderCapabilities;
  error?: string;
}

// ============================================================================
// Chat Completion Types (OpenAI-compatible)
// ============================================================================

export type LLMRole = 'system' | 'user' | 'assistant' | 'tool';

export interface LLMChatMessage {
  role: LLMRole;
  content: string;
  name?: string;
}

export interface LLMChatCompletionRequest {
  model: string;
  messages: LLMChatMessage[];
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
  stream?: boolean;
  stop?: string[];
  signal?: AbortSignal;
}

export interface LLMChatCompletionChoice {
  index: number;
  message: LLMChatMessage;
  finish_reason?: 'stop' | 'length' | 'content_filter' | string;
}

export interface LLMChatCompletionUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface LLMChatCompletionResponse {
  id: string;
  object: 'chat.completion';
  created: number;
  model: string;
  choices: LLMChatCompletionChoice[];
  usage?: LLMChatCompletionUsage;
}

export interface LLMChatCompletionDelta {
  role?: LLMRole;
  content?: string;
}

export interface LLMChatCompletionChunkChoice {
  index: number;
  delta: LLMChatCompletionDelta;
  finish_reason?: 'stop' | 'length' | 'content_filter' | string | null;
}

export interface LLMChatCompletionChunk {
  id: string;
  object: 'chat.completion.chunk';
  created: number;
  model: string;
  choices: LLMChatCompletionChunkChoice[];
}
