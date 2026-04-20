import { useState, useCallback } from 'react';
import { optimizeTranscription } from '@services/transcription';
import { useSettingsStore } from '@store';
import type { OptimizationLevel } from '@/types/transcription';

interface UseTranscriptionOptimizationResult {
  optimizedText: string;
  cleanedText: string;
  isOptimizing: boolean;
  error: string | null;
  optimize: (text: string, level?: OptimizationLevel) => Promise<void>;
  reset: () => void;
}

export function useTranscriptionOptimization(): UseTranscriptionOptimizationResult {
  const [optimizedText, setOptimizedText] = useState('');
  const [cleanedText, setCleanedText] = useState('');
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const optimizationConfig = useSettingsStore((state) => state.optimizationConfig);

  const optimize = useCallback(async (text: string, level?: OptimizationLevel) => {
    if (!text.trim()) return;

    const optimizationLevel = level || optimizationConfig.level;

    setIsOptimizing(true);
    setError(null);

    try {
      const result = await optimizeTranscription(text, optimizationLevel);
      setCleanedText(result.cleaned);
      setOptimizedText(result.optimized);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Optimization failed');
      // Fallback to original text
      setOptimizedText(text);
      setCleanedText(text);
    } finally {
      setIsOptimizing(false);
    }
  }, [optimizationConfig.level]);

  const reset = useCallback(() => {
    setOptimizedText('');
    setCleanedText('');
    setError(null);
    setIsOptimizing(false);
  }, []);

  return {
    optimizedText,
    cleanedText,
    isOptimizing,
    error,
    optimize,
    reset,
  };
}
