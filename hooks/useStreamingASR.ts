/**
 * useStreamingASR Hook
 *
 * React hook for streaming ASR (Automatic Speech Recognition).
 * Provides real-time transcription using the Moonshine local ASR provider.
 */

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import type { StreamingEvent, ASRTranscriptionResult } from '@/types/asr';
import { getMoonshineProvider } from '@services/asr';
import { useSettingsStore } from '@store';

// Singleton provider instance - stable across renders
let moonshineProviderInstance: ReturnType<typeof getMoonshineProvider> | null = null;

function getStableMoonshineProvider() {
  if (!moonshineProviderInstance) {
    moonshineProviderInstance = getMoonshineProvider();
  }
  return moonshineProviderInstance;
}

/**
 * Streaming line state
 */
interface StreamingLine {
  id: number;
  text: string;
  isFinal: boolean;
}

/**
 * Hook result interface
 */
interface UseStreamingASRResult {
  /** Current transcription lines */
  lines: StreamingLine[];

  /** All text combined */
  text: string;

  /** Is currently streaming */
  isStreaming: boolean;

  /** Is provider ready */
  isReady: boolean;

  /** Last error message */
  error: string | null;

  /** Start streaming */
  startStreaming: () => Promise<void>;

  /** Stop streaming and get final result */
  stopStreaming: () => Promise<ASRTranscriptionResult>;

  /** Reset state */
  reset: () => void;

  /** Provider name */
  providerName: string;
}

/**
 * Hook for streaming ASR
 */
export function useStreamingASR(): UseStreamingASRResult {
  const [lines, setLines] = useState<StreamingLine[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const unsubscribeRef = useRef<(() => void) | null>(null);
  const linesRef = useRef<StreamingLine[]>([]);
  const nextLineIdRef = useRef(1);

  const asrConfig = useSettingsStore((state) => state.asrConfig);
  const provider = getStableMoonshineProvider();

  // Check provider readiness
  useEffect(() => {
    const checkReady = async () => {
      try {
        const ready = await provider.isReady();
        setIsReady(ready);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to check Moonshine readiness';
        setIsReady(false);
        setError(message);
      }
    };

    checkReady();
  }, [provider, asrConfig.defaultLanguage, asrConfig.defaultModelArch]);

  // Keep a ref to the latest lines for stopStreaming finalization
  useEffect(() => {
    linesRef.current = lines;
  }, [lines]);

  // Subscribe to streaming events
  useEffect(() => {
    unsubscribeRef.current = provider.subscribe((event: StreamingEvent) => {
      handleStreamingEvent(event);
    });

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [provider]);

  /**
   * Handle streaming events from the provider
   */
  const handleStreamingEvent = useCallback((event: StreamingEvent) => {
    switch (event.type) {
      case 'line_started':
        // Use text from SDK event (may have initial partial transcription)
        {
          const lineId = typeof event.lineId === 'number' ? event.lineId : nextLineIdRef.current++;
          setLines((prev) => [
            ...prev,
            { id: lineId, text: event.text ?? '', isFinal: false },
          ]);
        }
        break;

      case 'line_text_changed':
        setLines((prev) => {
          if (typeof event.lineId === 'number') {
            const index = prev.findIndex((line) => line.id === event.lineId);
            if (index !== -1) {
              const next = [...prev];
              next[index] = { ...next[index], text: event.text };
              return next;
            }
          }
          if (prev.length === 0) {
            return prev;
          }
          const next = [...prev];
          const lastIndex = next.length - 1;
          next[lastIndex] = { ...next[lastIndex], text: event.text };
          return next;
        });
        break;

      case 'line_completed':
        setLines((prev) => {
          const shouldRemove = !event.text;
          if (typeof event.lineId === 'number') {
            const index = prev.findIndex((line) => line.id === event.lineId);
            if (index !== -1) {
              if (shouldRemove) {
                const next = [...prev];
                next.splice(index, 1);
                return next;
              }
              const next = [...prev];
              next[index] = { ...next[index], text: event.text, isFinal: true };
              return next;
            }
          }
          if (prev.length === 0) {
            return prev;
          }
          if (shouldRemove) {
            return prev.slice(0, -1);
          }
          const next = [...prev];
          const lastIndex = next.length - 1;
          next[lastIndex] = { ...next[lastIndex], text: event.text, isFinal: true };
          return next;
        });
        break;

      case 'error':
        setError(event.error || 'Streaming error occurred');
        setIsStreaming(false);
        break;
    }
  }, []);

  /**
   * Start streaming
   */
  const startStreaming = useCallback(async () => {
    setError(null);
    setLines([]);
    nextLineIdRef.current = 1;

    try {
      // Initialize provider if needed
      if (!(await provider.isReady())) {
        await provider.initialize();
      }

      const readyNow = await provider.isReady();
      setIsReady(readyNow);

      // Start streaming
      await provider.startStreaming({
        language: asrConfig.defaultLanguage,
      });

      setIsStreaming(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start streaming';
      setIsReady(false);
      setError(message);
      throw err;
    }
  }, [provider, asrConfig.defaultLanguage]);

  /**
   * Stop streaming
   */
  const stopStreaming = useCallback(async (): Promise<ASRTranscriptionResult> => {
    try {
      const result = await provider.stopStreaming();
      const combinedText = linesRef.current.map((line) => line.text).join('\n');
      const finalText = combinedText || result.text || '';
      setIsStreaming(false);
      return {
        ...result,
        text: finalText,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to stop streaming';
      setError(message);
      setIsStreaming(false);
      return {
        text: '',
        provider: 'local',
        processingTime: 0,
      };
    }
  }, [provider]);

  /**
   * Reset state
   */
  const reset = useCallback(() => {
    setLines([]);
    setError(null);
    setIsStreaming(false);
    nextLineIdRef.current = 1;
  }, []);

  // Combine all lines into text
  const text = lines.map((line) => line.text).join('\n');

  // Memoize the return object to prevent unnecessary re-renders
  return useMemo(() => ({
    lines,
    text,
    isStreaming,
    isReady,
    error,
    startStreaming,
    stopStreaming,
    reset,
    providerName: provider.name,
  }), [lines, text, isStreaming, isReady, error, startStreaming, stopStreaming, reset, provider.name]);
}
