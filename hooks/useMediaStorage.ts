import { useState, useCallback } from 'react';
import { mediaStorage } from '@services/mediaStorage';
import i18n from 'i18next';

export interface MediaStorageState {
  isLoading: boolean;
  error: string | null;
}

export interface StorageQuota {
  availableBytes: number;
  totalBytes: number;
}

export function useMediaStorage() {
  const [state, setState] = useState<MediaStorageState>({
    isLoading: false,
    error: null,
  });

  const saveMedia = useCallback(
    async (sourceUri: string, fileName: string): Promise<string | null> => {
      setState({ isLoading: true, error: null });

      try {
        const relativePath = await mediaStorage.saveMediaFile(sourceUri, fileName);
        setState({ isLoading: false, error: null });
        return relativePath;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : i18n.t('errors:failedToSaveMedia');
        setState({ isLoading: false, error: errorMessage });
        return null;
      }
    },
    []
  );

  const getUri = useCallback((relativePath: string): string => {
    return mediaStorage.getMediaUri(relativePath);
  }, []);

  const deleteMedia = useCallback(async (relativePath: string): Promise<boolean> => {
    setState({ isLoading: true, error: null });

    try {
      await mediaStorage.deleteMediaFile(relativePath);
      setState({ isLoading: false, error: null });
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : i18n.t('errors:failedToDeleteMedia');
      setState({ isLoading: false, error: errorMessage });
      return false;
    }
  }, []);

  const getQuota = useCallback(async (): Promise<StorageQuota | null> => {
    setState({ isLoading: true, error: null });

    try {
      const quota = await mediaStorage.getStorageQuota();
      setState({ isLoading: false, error: null });
      return quota;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : i18n.t('errors:failedToGetStorageQuota');
      setState({ isLoading: false, error: errorMessage });
      return null;
    }
  }, []);

  const cleanupOrphaned = useCallback(async (): Promise<number> => {
    setState({ isLoading: true, error: null });

    try {
      const deletedCount = await mediaStorage.cleanupOrphanedMedia();
      setState({ isLoading: false, error: null });
      return deletedCount;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : i18n.t('errors:failedToCleanupMedia');
      setState({ isLoading: false, error: errorMessage });
      return 0;
    }
  }, []);

  const reset = useCallback(() => {
    setState({ isLoading: false, error: null });
  }, []);

  return {
    ...state,
    saveMedia,
    getUri,
    deleteMedia,
    getQuota,
    cleanupOrphaned,
    reset,
  };
}
