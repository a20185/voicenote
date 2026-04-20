export type OptimizationLevel = 'light' | 'medium' | 'heavy';

export interface TranscriptionResult {
  raw: string;
  optimized?: string;
  level: OptimizationLevel;
  isOptimizing: boolean;
  error?: string;
}

export interface OptimizationConfig {
  enabled: boolean;
  level: OptimizationLevel;
}
