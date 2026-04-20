import { useState, useCallback, useRef } from 'react';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';

export interface CameraResult {
  uri: string;
  type: 'image' | 'video';
  width?: number;
  height?: number;
  duration?: number;
}

export function useCamera() {
  const [permission, requestPermission] = useCameraPermissions();
  const [mediaLibraryPermission, requestMediaLibraryPermission] = MediaLibrary.usePermissions();
  const [isReady, setIsReady] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [cameraRef, setCameraRef] = useState<CameraView | null>(null);
  const [facing, setFacing] = useState<CameraType>('back');
  const recordingPromiseRef = useRef<Promise<{ uri: string } | undefined> | null>(null);

  const toggleFacing = useCallback(() => {
    setFacing((current) => (current === 'back' ? 'front' : 'back'));
  }, []);

  const takePicture = useCallback(async (): Promise<CameraResult | null> => {
    if (!cameraRef || !permission?.granted) {
      return null;
    }

    try {
      const result = await cameraRef.takePictureAsync({
        quality: 0.8,
        base64: false,
        skipProcessing: false,
      });

      if (!result) {
        return null;
      }

      // Save to media library
      if (mediaLibraryPermission?.granted) {
        await MediaLibrary.saveToLibraryAsync(result.uri);
      }

      return {
        uri: result.uri,
        type: 'image',
        width: result.width,
        height: result.height,
      };
    } catch (error) {
      console.error('Failed to take picture:', error);
      return null;
    }
  }, [cameraRef, permission, mediaLibraryPermission]);

  const startRecording = useCallback(async () => {
    if (!cameraRef || !permission?.granted || isRecording) {
      return;
    }

    setIsRecording(true);
    // Store the promise instead of awaiting it — stopRecording will await it
    recordingPromiseRef.current = cameraRef.recordAsync({
      maxDuration: 300, // 5 minutes max
    });
  }, [cameraRef, permission, isRecording]);

  const stopRecording = useCallback(async (): Promise<CameraResult | null> => {
    if (!cameraRef || !isRecording) return null;

    cameraRef.stopRecording(); // triggers recordAsync promise to resolve
    try {
      const result = await recordingPromiseRef.current;
      if (result) {
        if (mediaLibraryPermission?.granted) {
          await MediaLibrary.saveToLibraryAsync(result.uri);
        }
        return { uri: result.uri, type: 'video' };
      }
    } catch (error) {
      console.error('Failed to get recording result:', error);
    } finally {
      setIsRecording(false);
      recordingPromiseRef.current = null;
    }
    return null;
  }, [cameraRef, isRecording, mediaLibraryPermission]);

  const requestPermissions = useCallback(async () => {
    const cameraStatus = await requestPermission();
    const mediaLibraryStatus = await requestMediaLibraryPermission();
    return cameraStatus.granted && mediaLibraryStatus.granted;
  }, [requestPermission, requestMediaLibraryPermission]);

  return {
    cameraRef,
    setCameraRef,
    permission,
    mediaLibraryPermission,
    isReady,
    setIsReady,
    isRecording,
    facing,
    toggleFacing,
    takePicture,
    startRecording,
    stopRecording,
    requestPermissions,
    hasPermission: permission?.granted && mediaLibraryPermission?.granted,
  };
}
