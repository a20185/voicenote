import { File } from 'expo-file-system';
import i18n from 'i18next';
import { useSettingsStore } from '@/store';

const ASR_TIMEOUT = 120000; // 2 minutes

export interface ASRResponse {
  text: string;
}

function getASRConfig() {
  const { asrConfig } = useSettingsStore.getState();
  return {
    apiUrl: asrConfig.apiUrl || process.env.EXPO_PUBLIC_ASR_API_URL || '',
    apiKey: asrConfig.apiKey || process.env.EXPO_PUBLIC_ASR_API_KEY || '',
  };
}

export function isASRConfigured(): boolean {
  const { apiUrl, apiKey } = getASRConfig();
  return Boolean(apiUrl && apiKey);
}

export async function transcribeAudio(uri: string): Promise<string> {
  if (!isASRConfigured()) {
    throw new Error(i18n.t('errors:asrNotConfigured'));
  }

  const file = new File(uri);
  if (!file.exists) {
    throw new Error(i18n.t('errors:audioFileNotFound'));
  }

  const formData = new FormData();
  formData.append('file', {
    uri,
    type: 'audio/m4a',
    name: 'recording.m4a',
  } as any);
  formData.append('model', 'FunAudioLLM/SenseVoiceSmall');

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), ASR_TIMEOUT);

  const { apiUrl, apiKey } = getASRConfig();

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      body: formData,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(i18n.t('errors:asrApiError', { status: `${response.status} - ${errorText}` }));
    }

    const data: ASRResponse = await response.json();
    return data.text || '';
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(i18n.t('errors:transcriptionTimeout'), { cause: error });
    }
    throw error;
  }
}
