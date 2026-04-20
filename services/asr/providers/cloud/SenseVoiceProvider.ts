/**
 * SenseVoice Cloud ASR Provider
 *
 * Non-streaming ASR provider using SenseVoice API.
 * This is the default cloud provider for VoiceNote.
 */

import { File } from 'expo-file-system';
import i18n from 'i18next';
import { ASRProviderBase } from '../base';
import type { NonStreamingProvider, TranscribeOptions } from '../types';
import type { ASRTranscriptionResult, ASRProviderCapabilities } from '@/types/asr';
import { useSettingsStore } from '@/store';

const DEFAULT_TIMEOUT = 120000; // 2 minutes

/**
 * SenseVoice API response structure
 */
interface SenseVoiceResponse {
  text: string;
}

/**
 * SenseVoice cloud ASR provider
 */
export class SenseVoiceProvider
  extends ASRProviderBase
  implements NonStreamingProvider
{
  readonly type = 'non-streaming' as const;
  readonly name = 'SenseVoice';

  readonly capabilities: ASRProviderCapabilities = {
    supportsStreaming: false,
    supportsRealTime: false,
    supportedLanguages: ['zh', 'en', 'ja', 'ko'],
    requiresNetwork: true,
    requiresModelDownload: false,
  };

  /**
   * Get API configuration from settings
   */
  private getApiConfig(): { apiUrl: string; apiKey: string } {
    const { asrConfig } = useSettingsStore.getState();
    return {
      apiUrl: asrConfig.apiUrl || process.env.EXPO_PUBLIC_ASR_API_URL || '',
      apiKey: asrConfig.apiKey || process.env.EXPO_PUBLIC_ASR_API_KEY || '',
    };
  }

  /**
   * Check if provider is configured
   */
  isConfigured(): boolean {
    const { apiUrl, apiKey } = this.getApiConfig();
    return Boolean(apiUrl && apiKey);
  }

  /**
   * Check if provider is ready
   */
  async isReady(): Promise<boolean> {
    return this.isConfigured() && this._isInitialized;
  }

  /**
   * Initialize provider
   */
  async initialize(): Promise<void> {
    if (!this.isConfigured()) {
      this.setError(i18n.t('errors:asrNotConfigured'));
      throw new Error(i18n.t('errors:asrNotConfigured'));
    }
    await super.initialize();
  }

  /**
   * Transcribe audio file
   */
  async transcribe(
    uri: string,
    options?: TranscribeOptions
  ): Promise<ASRTranscriptionResult> {
    const startTime = Date.now();

    if (!this.isConfigured()) {
      throw new Error(i18n.t('errors:asrNotConfigured'));
    }

    // Verify file exists
    const file = new File(uri);
    if (!file.exists) {
      throw new Error(i18n.t('errors:audioFileNotFound'));
    }

    const { apiUrl, apiKey } = this.getApiConfig();
    const timeout = options?.timeout || DEFAULT_TIMEOUT;

    // Build form data
    const formData = new FormData();
    formData.append('file', {
      uri,
      type: 'audio/m4a',
      name: 'recording.m4a',
    } as any);
    formData.append('model', 'FunAudioLLM/SenseVoiceSmall');

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          i18n.t('errors:asrApiError', {
            status: `${response.status} - ${errorText}`,
          })
        );
      }

      const data: SenseVoiceResponse = await response.json();
      const processingTime = Date.now() - startTime;

      return {
        text: data.text || '',
        provider: 'cloud',
        processingTime,
      };
    } catch (error: any) {
      clearTimeout(timeoutId);

      if (error.name === 'AbortError') {
        throw new Error(i18n.t('errors:transcriptionTimeout'), { cause: error });
      }

      throw error;
    }
  }
}

// Singleton instance
let _instance: SenseVoiceProvider | null = null;

/**
 * Get the SenseVoice provider instance
 */
export function getSenseVoiceProvider(): SenseVoiceProvider {
  if (!_instance) {
    _instance = new SenseVoiceProvider();
  }
  return _instance;
}
