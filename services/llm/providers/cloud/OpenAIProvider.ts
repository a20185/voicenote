/**
 * OpenAI-compatible Cloud LLM Provider
 */

import type {
  LLMChatCompletionRequest,
  LLMChatCompletionResponse,
  LLMChatCompletionChunk,
  LLMProviderCapabilities,
} from '@/types/llm';
import type { LLMProvider, LLMStreamCallback } from '../types';
import { LLMProviderBase } from '../base/LLMProviderBase';
import { useSettingsStore } from '@/store/useSettingsStore';

const DEFAULT_TIMEOUT_MS = 60000;

function getCloudConfig() {
  const { aiConfig } = useSettingsStore.getState();
  return {
    apiUrl: aiConfig.apiUrl || process.env.EXPO_PUBLIC_AI_API_URL || 'https://api.openai.com/v1',
    apiKey: aiConfig.apiKey || process.env.EXPO_PUBLIC_AI_API_KEY || '',
  };
}

function makeResponse(text: string, model: string): LLMChatCompletionResponse {
  return {
    id: `llm-cloud-${Date.now()}`,
    object: 'chat.completion',
    created: Math.floor(Date.now() / 1000),
    model,
    choices: [
      {
        index: 0,
        message: { role: 'assistant', content: text },
        finish_reason: 'stop',
      },
    ],
    usage: {
      prompt_tokens: 0,
      completion_tokens: 0,
      total_tokens: 0,
    },
  };
}

function makeFallbackChunk(content: string, model: string): LLMChatCompletionChunk {
  return {
    id: `llm-cloud-${Date.now()}`,
    object: 'chat.completion.chunk',
    created: Math.floor(Date.now() / 1000),
    model,
    choices: [
      {
        index: 0,
        delta: { role: 'assistant', content },
        finish_reason: 'stop',
      },
    ],
  };
}

async function streamChatCompletionResponse(
  response: Response,
  requestModel: string,
  onChunk: LLMStreamCallback
): Promise<LLMChatCompletionResponse> {
  const reader = response.body?.getReader?.();
  if (!reader || typeof TextDecoder === 'undefined') {
    throw new Error('Streaming is not supported in this environment');
  }

  const decoder = new TextDecoder();
  let buffer = '';
  let done = false;
  let fullText = '';
  let model = requestModel;
  let finishReason: string | undefined;

  while (!done) {
    const { value, done: readerDone } = await reader.read();
    if (readerDone) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });

    let boundaryIndex = buffer.indexOf('\n\n');
    while (boundaryIndex !== -1) {
      const packet = buffer.slice(0, boundaryIndex).trim();
      buffer = buffer.slice(boundaryIndex + 2);

      if (packet.length > 0) {
        const lines = packet.split('\n');
        for (const line of lines) {
          if (!line.startsWith('data:')) {
            continue;
          }

          const data = line.replace(/^data:\s*/, '');
          if (data === '[DONE]') {
            done = true;
            break;
          }

          try {
            const chunk = JSON.parse(data) as LLMChatCompletionChunk;
            model = chunk.model || model;
            const deltaContent = chunk.choices?.[0]?.delta?.content;
            if (deltaContent) {
              fullText += deltaContent;
            }
            const chunkFinish = chunk.choices?.[0]?.finish_reason;
            if (chunkFinish) {
              finishReason = chunkFinish;
            }
            onChunk(chunk);
          } catch {
            // Ignore malformed chunks
          }
        }
      }

      boundaryIndex = buffer.indexOf('\n\n');
    }
  }

  if (finishReason && finishReason !== 'stop') {
    return {
      id: `llm-cloud-${Date.now()}`,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model,
      choices: [
        {
          index: 0,
          message: { role: 'assistant', content: fullText },
          finish_reason: finishReason,
        },
      ],
    };
  }

  return makeResponse(fullText, model);
}

export class OpenAIProvider extends LLMProviderBase implements LLMProvider {
  readonly type = 'cloud' as const;
  readonly name = 'OpenAI';

  readonly capabilities: LLMProviderCapabilities = {
    supportsStreaming: true,
    supportsChat: true,
    requiresNetwork: true,
    requiresModelDownload: false,
  };

  override async isReady(): Promise<boolean> {
    const { apiUrl, apiKey } = getCloudConfig();
    return Boolean(apiUrl && apiKey);
  }

  async chatCompletion(request: LLMChatCompletionRequest): Promise<LLMChatCompletionResponse> {
    const { apiUrl, apiKey } = getCloudConfig();
    if (!apiUrl) {
      throw new Error('AI API endpoint not configured');
    }
    if (!apiKey) {
      throw new Error('AI API key not configured');
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

    try {
      const response = await fetch(`${apiUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: request.model,
          messages: request.messages,
          temperature: request.temperature,
          top_p: request.top_p,
          max_tokens: request.max_tokens,
          stream: false,
          stop: request.stop,
        }),
        signal: request.signal ?? controller.signal,
      });

      if (!response.ok) {
        throw new Error(`AI API error: ${response.status}`);
      }

      const data = await response.json();
      return data as LLMChatCompletionResponse;
    } finally {
      clearTimeout(timeout);
    }
  }

  async streamChatCompletion(
    request: LLMChatCompletionRequest,
    onChunk: LLMStreamCallback
  ): Promise<LLMChatCompletionResponse> {
    const { apiUrl, apiKey } = getCloudConfig();
    if (!apiUrl) {
      throw new Error('AI API endpoint not configured');
    }
    if (!apiKey) {
      throw new Error('AI API key not configured');
    }

    const response = await fetch(`${apiUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: request.model,
        messages: request.messages,
        temperature: request.temperature,
        top_p: request.top_p,
        max_tokens: request.max_tokens,
        stream: true,
        stop: request.stop,
      }),
      signal: request.signal,
    });

    if (!response.ok) {
      throw new Error(`AI API error: ${response.status}`);
    }

    const canStream = Boolean(response.body?.getReader) && typeof TextDecoder !== 'undefined';
    if (!canStream) {
      const fallback = await this.chatCompletion({ ...request, stream: false });
      const content = fallback.choices?.[0]?.message?.content ?? '';
      if (content) {
        onChunk(makeFallbackChunk(content, request.model));
      }
      return fallback;
    }

    return streamChatCompletionResponse(response, request.model, onChunk);
  }
}

let openAIProviderInstance: OpenAIProvider | null = null;

export function getOpenAIProvider(): OpenAIProvider {
  if (!openAIProviderInstance) {
    openAIProviderInstance = new OpenAIProvider();
  }
  return openAIProviderInstance;
}
