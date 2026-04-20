/**
 * NativeMoonshineModule - TurboModule Spec for CodeGen
 */

import type { TurboModule } from 'react-native';
import type { EventEmitter } from 'react-native/Libraries/Types/CodegenTypes';
import { TurboModuleRegistry } from 'react-native';

export type StreamingEvent = {
  type: 'line_started' | 'line_text_changed' | 'line_completed';
  text: string;
  lineId: number;
  isFinal: boolean;
};

export interface Spec extends TurboModule {
  readonly onStreamingEvent: EventEmitter<StreamingEvent>;
  isAvailable(): Promise<boolean>;
  hasEventCallback(): Promise<boolean>;
  loadModel(modelPath: string, arch: string): Promise<void>;
  unloadModel(): Promise<void>;
  isModelLoaded(): Promise<boolean>;
  startStreaming(language?: string | null): Promise<void>;
  stopStreaming(): Promise<{ text: string }>;
  getDownloadedModels(): Promise<readonly string[]>;
  deleteModel(modelId: string): Promise<void>;
  getModelsDirectory(): Promise<string>;
  onMicPermissionGranted(): Promise<void>;
  addListener(eventName: string): Promise<void>;
  removeListeners(count: number): Promise<void>;
}

export default TurboModuleRegistry.get<Spec>('MoonshineModule');
