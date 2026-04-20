import { useState, useCallback } from 'react';
import { fileUploader, UploadProgress, UploadResult } from '@/services/upload';
import { PickedFile } from './useFilePicker';
import i18n from 'i18next';

export interface UploadState {
  isUploading: boolean;
  progress: number;
  error: string | null;
  result: UploadResult | null;
}

export function useFileUpload() {
  const [state, setState] = useState<UploadState>({
    isUploading: false,
    progress: 0,
    error: null,
    result: null,
  });

  const uploadFile = useCallback(async (
    file: PickedFile,
    type: 'recording' | 'media'
  ): Promise<UploadResult | null> => {
    setState({
      isUploading: true,
      progress: 0,
      error: null,
      result: null,
    });

    try {
      const result = await fileUploader.uploadFile(
        file.uri,
        type,
        (progress: UploadProgress) => {
          setState((prev) => ({
            ...prev,
            progress: progress.progress,
          }));
        }
      );

      setState({
        isUploading: false,
        progress: 100,
        error: null,
        result,
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : i18n.t('errors:uploadFailed');
      setState({
        isUploading: false,
        progress: 0,
        error: errorMessage,
        result: null,
      });
      return null;
    }
  }, []);

  const uploadMultiple = useCallback(async (
    files: PickedFile[],
    type: 'recording' | 'media'
  ): Promise<UploadResult[]> => {
    setState({
      isUploading: true,
      progress: 0,
      error: null,
      result: null,
    });

    try {
      const results = await fileUploader.uploadMultiple(
        files.map((f) => ({ uri: f.uri, type })),
        (fileIndex: number, progress: UploadProgress) => {
          const overallProgress = ((fileIndex + progress.progress / 100) / files.length) * 100;
          setState((prev) => ({
            ...prev,
            progress: overallProgress,
          }));
        }
      );

      setState({
        isUploading: false,
        progress: 100,
        error: null,
        result: results[results.length - 1] || null,
      });

      return results;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : i18n.t('errors:uploadFailed');
      setState({
        isUploading: false,
        progress: 0,
        error: errorMessage,
        result: null,
      });
      return [];
    }
  }, []);

  const reset = useCallback(() => {
    setState({
      isUploading: false,
      progress: 0,
      error: null,
      result: null,
    });
  }, []);

  return {
    ...state,
    uploadFile,
    uploadMultiple,
    reset,
  };
}
