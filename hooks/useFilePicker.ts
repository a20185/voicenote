import { useState, useCallback } from 'react';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import i18n from 'i18next';

export interface PickedFile {
  uri: string;
  name: string;
  size?: number;
  mimeType?: string;
  type: 'image' | 'video' | 'document';
  width?: number;
  height?: number;
  duration?: number;
}

export function useFilePicker() {
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  // Pick image from library
  const pickImage = useCallback(async (): Promise<PickedFile | null> => {
    try {
      setIsPickerOpen(true);

      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        throw new Error(i18n.t('errors:mediaLibraryPermissionDenied'));
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (result.canceled || !result.assets[0]) {
        return null;
      }

      const asset = result.assets[0];
      const fileName = asset.uri.split('/').pop() || 'image.jpg';

      return {
        uri: asset.uri,
        name: fileName,
        size: asset.fileSize ?? undefined,
        mimeType: asset.mimeType ?? 'image/jpeg',
        type: 'image',
        width: asset.width,
        height: asset.height,
      };
    } catch (error) {
      console.error('Failed to pick image:', error);
      return null;
    } finally {
      setIsPickerOpen(false);
    }
  }, []);

  // Pick video from library
  const pickVideo = useCallback(async (): Promise<PickedFile | null> => {
    try {
      setIsPickerOpen(true);

      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        throw new Error(i18n.t('errors:mediaLibraryPermissionDenied'));
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['videos'],
        videoQuality: 1,
        videoMaxDuration: 300, // 5 minutes max
      });

      if (result.canceled || !result.assets[0]) {
        return null;
      }

      const asset = result.assets[0];
      const fileName = asset.uri.split('/').pop() || 'video.mp4';

      return {
        uri: asset.uri,
        name: fileName,
        size: asset.fileSize ?? undefined,
        mimeType: asset.mimeType ?? 'video/mp4',
        type: 'video',
        width: asset.width,
        height: asset.height,
        duration: asset.duration ?? undefined,
      };
    } catch (error) {
      console.error('Failed to pick video:', error);
      return null;
    } finally {
      setIsPickerOpen(false);
    }
  }, []);

  // Take photo with camera
  const takePhoto = useCallback(async (): Promise<PickedFile | null> => {
    try {
      setIsPickerOpen(true);

      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      if (!permissionResult.granted) {
        throw new Error(i18n.t('errors:cameraPermissionDenied'));
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (result.canceled || !result.assets[0]) {
        return null;
      }

      const asset = result.assets[0];
      const fileName = `photo_${Date.now()}.jpg`;

      return {
        uri: asset.uri,
        name: fileName,
        size: asset.fileSize ?? undefined,
        mimeType: asset.mimeType ?? 'image/jpeg',
        type: 'image',
        width: asset.width,
        height: asset.height,
      };
    } catch (error) {
      console.error('Failed to take photo:', error);
      return null;
    } finally {
      setIsPickerOpen(false);
    }
  }, []);

  // Record video with camera
  const recordVideo = useCallback(async (): Promise<PickedFile | null> => {
    try {
      setIsPickerOpen(true);

      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      if (!permissionResult.granted) {
        throw new Error(i18n.t('errors:cameraPermissionDenied'));
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['videos'],
        videoQuality: 1,
        videoMaxDuration: 300,
      });

      if (result.canceled || !result.assets[0]) {
        return null;
      }

      const asset = result.assets[0];
      const fileName = `video_${Date.now()}.mp4`;

      return {
        uri: asset.uri,
        name: fileName,
        size: asset.fileSize ?? undefined,
        mimeType: asset.mimeType ?? 'video/mp4',
        type: 'video',
        width: asset.width,
        height: asset.height,
        duration: asset.duration ?? undefined,
      };
    } catch (error) {
      console.error('Failed to record video:', error);
      return null;
    } finally {
      setIsPickerOpen(false);
    }
  }, []);

  // Pick document
  const pickDocument = useCallback(async (): Promise<PickedFile | null> => {
    try {
      setIsPickerOpen(true);

      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets[0]) {
        return null;
      }

      const asset = result.assets[0];

      return {
        uri: asset.uri,
        name: asset.name,
        size: asset.size ?? undefined,
        mimeType: asset.mimeType ?? 'application/octet-stream',
        type: 'document',
      };
    } catch (error) {
      console.error('Failed to pick document:', error);
      return null;
    } finally {
      setIsPickerOpen(false);
    }
  }, []);

  // Pick multiple images
  const pickMultipleImages = useCallback(async (): Promise<PickedFile[]> => {
    try {
      setIsPickerOpen(true);

      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        throw new Error(i18n.t('errors:mediaLibraryPermissionDenied'));
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        quality: 0.8,
      });

      if (result.canceled || result.assets.length === 0) {
        return [];
      }

      return result.assets.map((asset, index) => ({
        uri: asset.uri,
        name: asset.fileName ?? `image_${index}.jpg`,
        size: asset.fileSize ?? undefined,
        mimeType: asset.mimeType ?? 'image/jpeg',
        type: 'image' as const,
        width: asset.width,
        height: asset.height,
      }));
    } catch (error) {
      console.error('Failed to pick images:', error);
      return [];
    } finally {
      setIsPickerOpen(false);
    }
  }, []);

  // Get file info
  const getFileInfo = useCallback(async (uri: string): Promise<{ exists: boolean; size?: number; uri: string } | null> => {
    try {
      const file = new File(uri);
      return { exists: file.exists, size: file.exists ? file.size : undefined, uri: file.uri };
    } catch (error) {
      console.error('Failed to get file info:', error);
      return null;
    }
  }, []);

  return {
    isPickerOpen,
    pickImage,
    pickVideo,
    takePhoto,
    recordVideo,
    pickDocument,
    pickMultipleImages,
    getFileInfo,
  };
}
