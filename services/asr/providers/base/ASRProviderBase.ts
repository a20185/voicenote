/**
 * ASR Provider Base Class
 *
 * Abstract base class providing common functionality for ASR providers.
 */

import type { ASRProviderCapabilities } from '@/types/asr';
import type { BaseProvider } from '../types';

/**
 * Abstract base class for ASR providers
 */
export abstract class ASRProviderBase implements BaseProvider {
  abstract readonly name: string;
  abstract readonly capabilities: ASRProviderCapabilities;

  protected _isInitialized = false;
  protected _error: string | null = null;

  /**
   * Check if provider is ready for use
   */
  async isReady(): Promise<boolean> {
    return this._isInitialized && !this._error;
  }

  /**
   * Initialize provider resources
   * Override in subclass to add initialization logic
   */
  async initialize(): Promise<void> {
    this._isInitialized = true;
    this._error = null;
  }

  /**
   * Dispose provider resources
   * Override in subclass to add cleanup logic
   */
  async dispose(): Promise<void> {
    this._isInitialized = false;
    this._error = null;
  }

  /**
   * Get last error message
   */
  get error(): string | null {
    return this._error;
  }

  /**
   * Set error state
   */
  protected setError(message: string | null): void {
    this._error = message;
  }

  /**
   * Clear error state
   */
  protected clearError(): void {
    this._error = null;
  }
}
