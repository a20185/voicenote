/**
 * Llama.cpp Local LLM Provider
 *
 * Uses llama.rn (llama.cpp binding) to run GGUF models on-device.
 */

import type {
  LLMChatCompletionRequest,
  LLMChatCompletionResponse,
  LLMChatCompletionChunk,
  LLMChatMessage,
  LLMProviderCapabilities,
} from '@/types/llm';
import type { LLMProvider, LLMStreamCallback } from '../types';
import { LLMProviderBase } from '../base/LLMProviderBase';
import { useSettingsStore } from '@/store/useSettingsStore';
import { resolveLocalModelPath } from '../../modelManager';
import {
  initLlama,
  type CompletionParams,
  type TokenData,
  type RNLlamaOAICompatibleMessage,
} from 'llama.rn';

const DEFAULT_CONTEXT_TOKENS = 2048;
const DEFAULT_THREADS = 4;
const DEFAULT_GPU_LAYERS = 0;
const DEFAULT_BATCH_SIZE = 256;
const DEFAULT_MAX_TOKENS = 512;
const DEFAULT_TEMPERATURE = 0.7;
const DEFAULT_TOP_P = 0.9;

function makeCompletionResponse(text: string, model: string): LLMChatCompletionResponse {
  return {
    id: `llm-local-${Date.now()}`,
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

function makeChunk(
  id: string,
  model: string,
  delta: Partial<LLMChatMessage>,
  finishReason: LLMChatCompletionChunk['choices'][number]['finish_reason'] = null
): LLMChatCompletionChunk {
  return {
    id,
    object: 'chat.completion.chunk',
    created: Math.floor(Date.now() / 1000),
    model,
    choices: [
      {
        index: 0,
        delta,
        finish_reason: finishReason,
      },
    ],
  };
}

function toRNLlamaMessages(messages: LLMChatMessage[]): RNLlamaOAICompatibleMessage[] {
  return messages.map((message) => ({
    role: message.role,
    content: message.content,
  }));
}

function getLocalRuntimeConfig() {
  const { aiConfig } = useSettingsStore.getState();
  const modelPath = process.env.EXPO_PUBLIC_AI_LOCAL_MODEL_PATH || aiConfig.localModelPath || undefined;

  return {
    modelPath,
    contextTokens: aiConfig.localContextTokens ?? DEFAULT_CONTEXT_TOKENS,
    threads: aiConfig.localThreads ?? DEFAULT_THREADS,
    gpuLayers: aiConfig.localGpuLayers ?? DEFAULT_GPU_LAYERS,
    batchSize: aiConfig.localBatchSize ?? DEFAULT_BATCH_SIZE,
  };
}

export class LlamaProvider extends LLMProviderBase implements LLMProvider {
  readonly type = 'local' as const;
  readonly name = 'Llama.cpp';

  readonly capabilities: LLMProviderCapabilities = {
    supportsStreaming: true,
    supportsChat: true,
    requiresNetwork: false,
    requiresModelDownload: true,
  };

  private currentModelPath: string | null = null;
  private isGenerating = false;
  private context: Awaited<ReturnType<typeof initLlama>> | null = null;

  override async isReady(): Promise<boolean> {
    if (this.context) {
      return true;
    }

    const runtimeConfig = getLocalRuntimeConfig();
    const path = await resolveLocalModelPath(runtimeConfig.modelPath);
    return path != null;
  }

  override async initialize(): Promise<void> {
    await super.initialize();

    try {
      const runtimeConfig = getLocalRuntimeConfig();
      const modelPath = await resolveLocalModelPath(runtimeConfig.modelPath);

      if (!modelPath) {
        this.setError('Local LLM model is unavailable. Add the bundled GGUF model or configure EXPO_PUBLIC_AI_LOCAL_MODEL_PATH.');
        return;
      }

      const normalizedPath = modelPath.startsWith('file://')
        ? modelPath.replace('file://', '')
        : modelPath;

      if (this.context && this.currentModelPath === normalizedPath) {
        this.clearError();
        return;
      }

      if (this.context) {
        await this.context.release();
        this.context = null;
      }

      this.context = await initLlama({
        model: normalizedPath,
        n_ctx: runtimeConfig.contextTokens,
        n_threads: runtimeConfig.threads,
        n_gpu_layers: runtimeConfig.gpuLayers,
        n_batch: runtimeConfig.batchSize,
      });

      this.currentModelPath = normalizedPath;
      this.clearError();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to initialize Llama.cpp';
      this.setError(message);
      throw error;
    }
  }

  override async dispose(): Promise<void> {
    if (this.isGenerating) {
      try {
        await this.context?.stopCompletion();
      } catch {
        // Ignore stop errors
      }
    }

    try {
      await this.context?.release();
    } catch {
      // Ignore unload errors
    }

    this.currentModelPath = null;
    this.isGenerating = false;
    this.context = null;
    await super.dispose();
  }

  async chatCompletion(request: LLMChatCompletionRequest): Promise<LLMChatCompletionResponse> {
    if (!(await this.isReady())) {
      await this.initialize();
    }

    if (!this.context) {
      throw new Error('No local model loaded');
    }

    const temperature = request.temperature ?? DEFAULT_TEMPERATURE;
    const maxTokens = request.max_tokens ?? DEFAULT_MAX_TOKENS;
    const topP = request.top_p ?? DEFAULT_TOP_P;

    const params: CompletionParams = {
      messages: toRNLlamaMessages(request.messages),
      n_predict: maxTokens,
      temperature,
      top_p: topP,
      stop: request.stop,
    };

    const result = await this.context.completion(params);
    return makeCompletionResponse(result.text ?? '', request.model);
  }

  async streamChatCompletion(
    request: LLMChatCompletionRequest,
    onChunk: LLMStreamCallback
  ): Promise<LLMChatCompletionResponse> {
    if (!(await this.isReady())) {
      await this.initialize();
    }

    if (!this.context) {
      throw new Error('No local model loaded');
    }

    if (this.isGenerating) {
      throw new Error('A local generation is already in progress');
    }

    const temperature = request.temperature ?? DEFAULT_TEMPERATURE;
    const maxTokens = request.max_tokens ?? DEFAULT_MAX_TOKENS;
    const topP = request.top_p ?? DEFAULT_TOP_P;

    const id = `llm-local-${Date.now()}`;
    let output = '';
    let roleEmitted = false;
    let aborted = false;

    const handleEvent = (event: TokenData) => {
      const token = event.token;
      const accumulated = event.accumulated_text ?? event.content;

      if (token) {
        if (!roleEmitted) {
          onChunk(makeChunk(id, request.model, { role: 'assistant' }));
          roleEmitted = true;
        }
        output += token;
        onChunk(makeChunk(id, request.model, { content: token }));
      } else if (typeof accumulated === 'string') {
        const delta = accumulated.slice(output.length);
        if (delta) {
          if (!roleEmitted) {
            onChunk(makeChunk(id, request.model, { role: 'assistant' }));
            roleEmitted = true;
          }
          output = accumulated;
          onChunk(makeChunk(id, request.model, { content: delta }));
        }
      }
    };

    const params: CompletionParams = {
      messages: toRNLlamaMessages(request.messages),
      n_predict: maxTokens,
      temperature,
      top_p: topP,
      stop: request.stop,
    };

    const abortSignal = request.signal;
    const handleAbort = async () => {
      aborted = true;
      try {
        await this.context?.stopCompletion();
      } catch {
        // Ignore abort errors
      }
    };

    abortSignal?.addEventListener?.('abort', handleAbort);

    try {
      this.isGenerating = true;
      if (abortSignal?.aborted) {
        await handleAbort();
      }

      const result = await this.context.completion(params, handleEvent);
      if (!roleEmitted) {
        onChunk(makeChunk(id, request.model, { role: 'assistant' }));
        roleEmitted = true;
      }

      output = result.text ?? output;
      onChunk(makeChunk(id, request.model, {}, 'stop'));
      return makeCompletionResponse(output, request.model);
    } catch (error) {
      if (aborted) {
        throw new Error('Local generation aborted', { cause: error });
      }
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to start local generation', { cause: error });
    } finally {
      this.isGenerating = false;
      abortSignal?.removeEventListener?.('abort', handleAbort);
    }
  }
}

let llamaProviderInstance: LlamaProvider | null = null;

export function getLlamaProvider(): LlamaProvider {
  if (!llamaProviderInstance) {
    llamaProviderInstance = new LlamaProvider();
  }
  return llamaProviderInstance;
}
