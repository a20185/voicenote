/**
 * Moonshine Turbo Module
 *
 * React Native Turbo Module interface for Moonshine local ASR.
 * Provides streaming speech recognition using ONNX Runtime.
 */

import { NativeEventEmitter, DeviceEventEmitter, NativeModules } from 'react-native';
import type { StreamingEvent } from '@/types/asr';

// Import the TurboModule spec (TypeScript file for codegen)
import TurboMoonshineModule from './src/NativeMoonshineModule';

/**
 * Moonshine module interface
 */
export interface MoonshineModuleInterface {
  isAvailable(): Promise<boolean>;
  hasEventCallback(): Promise<boolean>;
  loadModel(modelPath: string, arch: string): Promise<void>;
  unloadModel(): Promise<void>;
  isModelLoaded(): Promise<boolean>;
  startStreaming(language: string | null): Promise<void>;
  stopStreaming(): Promise<{ text: string }>;
  getDownloadedModels(): Promise<readonly string[]>;
  deleteModel(modelId: string): Promise<void>;
  getModelsDirectory(): Promise<string>;
  onMicPermissionGranted?: () => Promise<void>;
}

const legacyMoonshineModule = NativeModules.MoonshineModule as Partial<MoonshineModuleInterface> | undefined;
const turboMoonshineModule = TurboMoonshineModule as Partial<MoonshineModuleInterface> | null;
const resolvedMoonshineModule: Partial<MoonshineModuleInterface> | null =
  turboMoonshineModule && typeof turboMoonshineModule.isAvailable === 'function'
    ? turboMoonshineModule
    : legacyMoonshineModule && typeof legacyMoonshineModule.isAvailable === 'function'
      ? legacyMoonshineModule
      : null;

const MoonshineModule: MoonshineModuleInterface = resolvedMoonshineModule as MoonshineModuleInterface;

// Create NativeEventEmitter for proper event handling on New Architecture
// This ensures addListener/removeListeners are called on the native module
const moonshineEmitter = resolvedMoonshineModule
  ? new NativeEventEmitter(resolvedMoonshineModule as any)
  : null;

/**
 * Subscribe to Moonshine streaming events.
 * Uses NativeEventEmitter which properly notifies the native module about listeners.
 */
export function setEventListener(
  callback: (event: StreamingEvent) => void
): () => void {
  let lastEventKey = '';
  let lastEventTime = 0;
  const dedupe = (event: StreamingEvent, _source: 'native' | 'device') => {
    const key = `${event.type}|${event.lineId ?? 'na'}|${event.text ?? ''}|${event.isFinal ? '1' : '0'}`;
    const now = Date.now();
    if (key === lastEventKey && now - lastEventTime < 50) {
      return;
    }
    lastEventKey = key;
    lastEventTime = now;
    callback(event);
  };

  const nativeSubscription = moonshineEmitter
    ? moonshineEmitter.addListener(
      'onStreamingEvent',
      (event: StreamingEvent) => dedupe(event, 'native')
    )
    : null;

  const deviceSubscription = DeviceEventEmitter.addListener(
    'onStreamingEvent',
    (event: StreamingEvent) => dedupe(event, 'device')
  );

  return () => {
    nativeSubscription?.remove();
    deviceSubscription.remove();
  };
}

/**
 * Check if Moonshine module is available
 */
export function isMoonshineAvailable(): boolean {
  return resolvedMoonshineModule != null;
}

export { MoonshineModule, TurboMoonshineModule };
