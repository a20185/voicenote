import { useCallback } from 'react';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as Haptics from 'expo-haptics';
import { mediaQueries } from '@/db/queries';
import { saveMediaFile, deleteMediaFile } from '@/services/mediaStorage';
import type { MediaFile } from '@/db';

interface UseNoteMediaOptions {
  noteId: number | null;
  onMediaChanged: () => void;
}

export function useNoteMedia({ noteId, onMediaChanged }: UseNoteMediaOptions) {
  const addFromImagePicker = useCallback(async () => {
    if (!noteId) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (result.canceled || result.assets.length === 0) return;

    for (const asset of result.assets) {
      const fileName = `media_${Date.now()}_${asset.fileName || 'image.jpg'}`;
      const savedFileName = await saveMediaFile(asset.uri, fileName);
      await mediaQueries.create({
        noteId,
        type: asset.type === 'video' ? 'video' : 'image',
        uri: savedFileName,
        fileName: asset.fileName || fileName,
        mimeType: asset.mimeType || (asset.type === 'video' ? 'video/mp4' : 'image/jpeg'),
        createdAt: new Date(),
      });
    }
    onMediaChanged();
  }, [noteId, onMediaChanged]);

  const addFromDocumentPicker = useCallback(async () => {
    if (!noteId) return;
    const result = await DocumentPicker.getDocumentAsync({
      multiple: true,
      copyToCacheDirectory: true,
    });
    if (result.canceled || result.assets.length === 0) return;

    for (const asset of result.assets) {
      const fileName = `doc_${Date.now()}_${asset.name}`;
      const savedFileName = await saveMediaFile(asset.uri, fileName);
      await mediaQueries.create({
        noteId,
        type: 'document',
        uri: savedFileName,
        fileName: asset.name,
        mimeType: asset.mimeType || 'application/octet-stream',
        createdAt: new Date(),
      });
    }
    onMediaChanged();
  }, [noteId, onMediaChanged]);

  const deleteMedia = useCallback(async (media: MediaFile) => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    await deleteMediaFile(media.uri);
    await mediaQueries.delete(media.id);
    onMediaChanged();
  }, [onMediaChanged]);

  return {
    addFromImagePicker,
    addFromDocumentPicker,
    deleteMedia,
  };
}
