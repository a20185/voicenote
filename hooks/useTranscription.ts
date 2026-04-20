import { useState, useCallback, useMemo } from 'react';
import { transcribeAudio, isASRConfigured } from '@services/asr';
import { optimizeTranscription } from '@services/transcription';
import { useSettingsStore } from '@store';
import i18n from 'i18next';

interface UseTranscriptionResult {
  transcriptionText: string;
  optimizedText: string;
  isTranscribing: boolean;
  isOptimizing: boolean;
  error: string | null;
  transcribe: (audioUri: string) => Promise<string>;
  reset: () => void;
  retry: () => Promise<void>;
  isConfigured: boolean;
  textMode: 'raw' | 'optimized';
  setTextMode: (mode: 'raw' | 'optimized') => void;
  currentText: string;
}

export function useTranscription(): UseTranscriptionResult {
  const [transcriptionText, setTranscriptionText] = useState('');
  const [optimizedText, setOptimizedText] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUri, setLastUri] = useState<string | null>(null);
  const [textMode, setTextMode] = useState<'raw' | 'optimized'>('raw');

  const optimizationConfig = useSettingsStore((state) => state.optimizationConfig);

  const transcribe = useCallback(async (audioUri: string): Promise<string> => {
    setLastUri(audioUri);
    setIsTranscribing(true);
    setError(null);

    try {
      const text = await transcribeAudio(audioUri);
      setTranscriptionText(text);

      // Auto-optimize if enabled
      if (optimizationConfig.enabled && text) {
        setIsOptimizing(true);
        try {
          const result = await optimizeTranscription(text, optimizationConfig.level);
          setOptimizedText(result.optimized);
          setTextMode('optimized'); // Switch to optimized view
        } catch {
          // Fallback silently
          setOptimizedText(text);
        } finally {
          setIsOptimizing(false);
        }
      }

      return text;
    } catch (err) {
      const message = err instanceof Error ? err.message : i18n.t('errors:transcriptionFailed');
      setError(message);
      return '';
    } finally {
      setIsTranscribing(false);
    }
  }, [optimizationConfig.enabled, optimizationConfig.level]);

  const reset = useCallback(() => {
    setTranscriptionText('');
    setOptimizedText('');
    setError(null);
    setLastUri(null);
    setTextMode('raw');
    setIsOptimizing(false);
  }, []);

  const retry = useCallback(async () => {
    if (lastUri) {
      await transcribe(lastUri);
    }
  }, [lastUri, transcribe]);

  const currentText = textMode === 'optimized' && optimizedText
    ? optimizedText
    : transcriptionText;

  const isConfigured = isASRConfigured();

  // Memoize the return object to prevent unnecessary re-renders
  return useMemo(() => ({
    transcriptionText,
    optimizedText,
    isTranscribing,
    isOptimizing,
    error,
    transcribe,
    reset,
    retry,
    isConfigured,
    textMode,
    setTextMode,
    currentText,
  }), [transcriptionText, optimizedText, isTranscribing, isOptimizing, error, transcribe, reset, retry, isConfigured, textMode, setTextMode, currentText]);
}
