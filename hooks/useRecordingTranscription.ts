/**
 * useRecordingTranscription Hook
 *
 * Unified hook that routes between streaming and file-based transcription
 * based on the current ASR provider type.
 *
 * - Local (Moonshine): Real-time streaming during recording
 * - Cloud: File-based transcription after recording completes
 */

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useSettingsStore } from '@store';
import { useStreamingASR } from './useStreamingASR';
import { useTranscription } from './useTranscription';

/**
 * Unified recording transcription result
 */
export interface UseRecordingTranscriptionResult {
  /** Whether using streaming mode (local provider) */
  isStreamingMode: boolean;

  /** Current transcription text (from streaming or file-based) */
  currentText: string;

  /** Is currently transcribing (streaming or file-based) */
  isTranscribing: boolean;

  /** Is provider ready */
  isReady: boolean;

  /** Last error */
  error: string | null;

  // Streaming-specific methods
  /** Start streaming (call when recording starts for local provider) */
  startStreaming: () => Promise<void>;

  /** Stop streaming (call when recording stops for local provider) */
  stopStreaming: () => Promise<{ text: string }>;

  // File-based methods
  /** Transcribe audio file (for cloud provider) */
  transcribe: (audioUri: string) => Promise<string>;

  /** Reset state */
  reset: () => void;

  /** Retry last transcription (file-based only) */
  retry: () => Promise<void>;

  /** Whether ASR is configured */
  isConfigured: boolean;

  // File-based specific
  /** Optimized text (file-based only) */
  optimizedText: string;

  /** Is optimizing (file-based only) */
  isOptimizing: boolean;

  /** Text mode for switching between raw and optimized */
  textMode: 'raw' | 'optimized';

  /** Set text mode */
  setTextMode: (mode: 'raw' | 'optimized') => void;
}

/**
 * Unified hook for recording transcription
 *
 * Automatically selects streaming vs file-based transcription based on provider type.
 */
export function useRecordingTranscription(): UseRecordingTranscriptionResult {
  const asrConfig = useSettingsStore((state) => state.asrConfig);
  const isStreamingMode = asrConfig.provider === 'local';

  // Hooks for both modes
  const streaming = useStreamingASR();
  const fileBased = useTranscription();

  // Track streaming result for final text (after stopStreaming)
  const [streamingResult, setStreamingResult] = useState<string>('');

  // Store refs to reset functions for stable reference
  const streamingResetRef = useRef(streaming.reset);
  const fileBasedResetRef = useRef(fileBased.reset);

  // Update refs when they change
  useEffect(() => {
    streamingResetRef.current = streaming.reset;
    fileBasedResetRef.current = fileBased.reset;
  }, [streaming.reset, fileBased.reset]);

  /**
   * Start transcription based on mode
   */
  const startStreaming = useCallback(async () => {
    if (!isStreamingMode) {
      console.warn('startStreaming called in non-streaming mode');
      return;
    }

    setStreamingResult('');
    await streaming.startStreaming();
  }, [isStreamingMode, streaming]);

  /**
   * Stop transcription based on mode
   */
  const stopStreaming = useCallback(async (): Promise<{ text: string }> => {
    if (!isStreamingMode) {
      console.warn('stopStreaming called in non-streaming mode');
      return { text: '' };
    }

    const result = await streaming.stopStreaming();
    setStreamingResult(result.text);
    return { text: result.text };
  }, [isStreamingMode, streaming]);

  /**
   * Transcribe audio file (file-based mode)
   */
  const transcribe = useCallback(async (audioUri: string): Promise<string> => {
    if (isStreamingMode) {
      if (streamingResult.trim()) {
        return streamingResult;
      }

      if (fileBased.isConfigured) {
        return fileBased.transcribe(audioUri);
      }

      return '';
    }

    return fileBased.transcribe(audioUri);
  }, [isStreamingMode, fileBased, streamingResult]);

  /**
   * Reset all state
   * Uses refs to avoid dependency on streaming/fileBased objects
   */
  const reset = useCallback(() => {
    streamingResetRef.current();
    fileBasedResetRef.current();
    setStreamingResult('');
  }, []);  // No dependencies - stable reference

  /**
   * Retry (file-based only)
   */
  const retry = useCallback(async () => {
    if (!isStreamingMode) {
      await fileBased.retry();
    }
  }, [isStreamingMode, fileBased]);

  // Get current text based on mode:
  // - Streaming mode: Use streaming.text while isStreaming is true, otherwise use streamingResult
  // - File-based mode: Use fileBased.currentText
  const currentText = isStreamingMode
    ? (streaming.isStreaming ? streaming.text : streamingResult)
    : fileBased.currentText;

  // Compute derived values
  const isTranscribing = isStreamingMode ? streaming.isStreaming : fileBased.isTranscribing;
  const isReady = isStreamingMode ? streaming.isReady : fileBased.isConfigured;
  const error = isStreamingMode ? streaming.error : fileBased.error;
  const isConfigured = isStreamingMode ? streaming.isReady : fileBased.isConfigured;
  const optimizedText = isStreamingMode ? '' : fileBased.optimizedText;
  const isOptimizing = isStreamingMode ? false : fileBased.isOptimizing;
  const textMode = isStreamingMode ? 'raw' : fileBased.textMode;
  const setTextMode = isStreamingMode ? noop : fileBased.setTextMode;

  // Memoize the return object to prevent unnecessary re-renders
  return useMemo(() => ({
    isStreamingMode,
    currentText,
    isTranscribing,
    isReady,
    error,
    startStreaming,
    stopStreaming,
    transcribe,
    reset,
    retry,
    isConfigured,
    optimizedText,
    isOptimizing,
    textMode,
    setTextMode,
  }), [isStreamingMode, currentText, isTranscribing, isReady, error, startStreaming, stopStreaming, transcribe, reset, retry, isConfigured, optimizedText, isOptimizing, textMode, setTextMode]);
}

// No-op function for streaming mode setTextMode
const noop = () => {};
