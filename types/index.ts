export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

// LLM Types
export type {
  LLMProviderType,
  LLMProviderStatus,
  LLMProviderCapabilities,
  LLMProviderInfo,
  LLMChatMessage,
  LLMChatCompletionRequest,
  LLMChatCompletionResponse,
  LLMChatCompletionChunk,
} from './llm';

// ASR Types
export type {
  ASRProviderType,
  MoonshineLanguage,
  ModelArch,
  ModelStatus,
  ProviderStatus,
  StreamingEventType,
  StreamingEvent,
  ASRModel,
  ASRTranscriptionResult,
  ASRProviderCapabilities,
  ASRProviderInfo,
  CloudASRProvider,
  LocalASRProvider,
  ModelDownloadSource,
} from './asr';

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Note {
  id: number;
  title: string;
  content?: string;
  createdAt: string;
  updatedAt: string;
  recordings?: Recording[];
  media?: MediaFile[];
}

export interface Recording {
  id: number;
  noteId?: number;
  uri: string;
  duration: number;
  fileSize?: number;
  mimeType?: string;
  createdAt: string;
}

export interface MediaFile {
  id: number;
  noteId?: number;
  type: 'image' | 'video' | 'document';
  uri: string;
  thumbnailUri?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  width?: number;
  height?: number;
  createdAt: string;
}

export interface SyncStatus {
  lastSyncAt?: string;
  pendingCount: number;
  isSyncing: boolean;
  lastError?: string;
}

export type MediaType = 'image' | 'video' | 'document';
export type SyncAction = 'create' | 'update' | 'delete';
export type EntityType = 'note' | 'recording' | 'media';
