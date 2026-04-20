export { useCamera } from './useCamera';
export type { CameraResult } from './useCamera';

export { useAudioRecorder } from './useAudioRecorder';
export type { RecordingState, AudioRecorderResult } from './useAudioRecorder';

export { useFilePicker } from './useFilePicker';
export type { PickedFile } from './useFilePicker';

export { useFileUpload } from './useFileUpload';
export type { UploadState } from './useFileUpload';

export { useNoteSelection } from './useNoteSelection';

export { useMediaStorage } from './useMediaStorage';
export type { MediaStorageState, StorageQuota } from './useMediaStorage';

export {
  useNotes,
  useNote,
  useCreateNote,
  useUpdateNote,
  useDeleteNote,
  useArchiveNotes,
  useMergeNotes,
  noteQueryKeys
} from './useNotes';

export { useTranscription } from './useTranscription';
export { useStreamingASR } from './useStreamingASR';
export { useRecordingTranscription } from './useRecordingTranscription';
export type { UseRecordingTranscriptionResult } from './useRecordingTranscription';
export { useSwipeGesture } from './useSwipeGesture';
export type { DragZone } from './useSwipeGesture';

export { useMarkdownEditor } from './useMarkdownEditor';
export type { MarkdownAction } from './useMarkdownEditor';

export { useNoteActions } from './useNoteActions';

export { useBatchNoteActions } from './useBatchNoteActions';

export { useSearch } from './useSearch';
export { useSearchHistory } from './useSearchHistory';

export { useNotePreview } from './useNotePreview';
export { useNoteMedia } from './useNoteMedia';
export { useAudioPlayback } from './useAudioPlayback';

export {
  useInspirations,
  useInspiration,
  useCreateInspiration,
  useDeleteInspiration,
  inspirationQueryKeys,
} from './useInspirations';

export {
  useCategories,
  useCategory,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  useReorderCategories,
  useAssignNotesToCategory,
  useRemoveNotesFromCategory,
  categoryQueryKeys,
} from './useCategories';

export {
  useCategorizedNotes,
  useNoteCategoryIds,
} from './useCategorizedNotes';
export type { CategorizedGroup } from './useCategorizedNotes';

export { useDeepLinkHandler } from './useDeepLinkHandler';

export { useTranscriptionOptimization } from './useTranscriptionOptimization';
