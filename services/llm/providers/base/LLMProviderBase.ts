/**
 * Base class for LLM providers
 */

import type { LLMProvider } from '../types';
import type { LLMProviderCapabilities } from '@/types/llm';

export abstract class LLMProviderBase implements LLMProvider {
  abstract readonly name: string;
  abstract readonly type: 'local' | 'cloud';
  abstract readonly capabilities: LLMProviderCapabilities;

  protected _error: string | null = null;

  get error(): string | null {
    return this._error;
  }

  protected setError(message: string): void {
    this._error = message;
  }

  protected clearError(): void {
    this._error = null;
  }

  async isReady(): Promise<boolean> {
    return true;
  }

  async initialize(): Promise<void> {
    this.clearError();
  }

  async dispose(): Promise<void> {
    this.clearError();
  }

  abstract chatCompletion(...args: Parameters<LLMProvider['chatCompletion']>): ReturnType<LLMProvider['chatCompletion']>;
  abstract streamChatCompletion(...args: Parameters<LLMProvider['streamChatCompletion']>): ReturnType<LLMProvider['streamChatCompletion']>;
}
