import { useState, useCallback, useRef, useEffect } from 'react';
import {
  useAudioRecorder as useExpoAudioRecorder,
  useAudioRecorderState,
  useAudioPlayer,
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
} from 'expo-audio';
import { File } from 'expo-file-system';
import i18n from 'i18next';

export interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number; // in milliseconds
  uri: string | null;
}

export interface AudioRecorderResult {
  uri: string;
  duration: number;
  fileSize: number | undefined;
}

export function useAudioRecorder() {
  const [state, setState] = useState<RecordingState>({
    isRecording: false,
    isPaused: false,
    duration: 0,
    uri: null,
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackPosition, setPlaybackPosition] = useState(0);
  const [playbackDuration, setPlaybackDuration] = useState(0);
  const [playerSource, setPlayerSource] = useState<string | null>(null);

  // Use expo-audio's recorder hook
  const recorder = useExpoAudioRecorder(RecordingPresets.HIGH_QUALITY);

  // Get real-time recording state
  const recorderState = useAudioRecorderState(recorder);

  // Use expo-audio's player hook for playback
  const player = useAudioPlayer(playerSource);

  // Track recording state
  const isRecordingRef = useRef(false);

  // Update duration from recorder state
  useEffect(() => {
    if (recorderState.isRecording) {
      setState((prev) => ({
        ...prev,
        isRecording: true,
        duration: recorderState.durationMillis,
      }));
    }
  }, [recorderState.isRecording, recorderState.durationMillis]);

  // Update playing state from player
  useEffect(() => {
    const checkPlaying = setInterval(() => {
      if (player) {
        setIsPlaying(player.playing);
        setPlaybackPosition((player.currentTime || 0) * 1000);
        setPlaybackDuration((player.duration || 0) * 1000);
      }
    }, 100);
    return () => clearInterval(checkPlaying);
  }, [player]);

  // Request permissions
  const requestPermission = useCallback(async () => {
    const { status } = await requestRecordingPermissionsAsync();
    return status === 'granted';
  }, []);

  // Start recording
  const startRecording = useCallback(async () => {
    try {
      const hasPermission = await requestPermission();
      if (!hasPermission) {
        throw new Error(i18n.t('errors:audioPermissionDenied'));
      }

      // Enable recording mode on iOS
      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });

      // Prepare and start recording
      await recorder.prepareToRecordAsync();
      recorder.record();
      isRecordingRef.current = true;

      setState((prev) => ({
        ...prev,
        isRecording: true,
        isPaused: false,
        uri: null,
        duration: 0,
      }));
    } catch (error) {
      console.error('Failed to start recording:', error);
      throw error;
    }
  }, [requestPermission, recorder]);

  // Pause recording
  const pauseRecording = useCallback(async () => {
    if (!isRecordingRef.current) return;

    try {
      recorder.pause();
      setState((prev) => ({ ...prev, isPaused: true }));
    } catch (error) {
      console.error('Failed to pause recording:', error);
    }
  }, [recorder]);

  // Resume recording
  const resumeRecording = useCallback(async () => {
    if (!state.isPaused) return;

    try {
      recorder.record();
      setState((prev) => ({ ...prev, isPaused: false }));
    } catch (error) {
      console.error('Failed to resume recording:', error);
    }
  }, [state.isPaused, recorder]);

  // Stop recording
  const stopRecording = useCallback(async (): Promise<AudioRecorderResult | null> => {
    if (!isRecordingRef.current) return null;

    try {
      await recorder.stop();
      // Disable recording mode so playback works
      await setAudioModeAsync({ allowsRecording: false });
      const uri = recorder.uri;
      const duration = state.duration;

      // Get file info
      let fileSize: number | undefined;
      if (uri) {
        const file = new File(uri);
        if (file.exists) {
          fileSize = file.size;
        }
      }

      const result: AudioRecorderResult = {
        uri: uri || '',
        duration,
        fileSize,
      };

      isRecordingRef.current = false;

      setState((prev) => ({
        ...prev,
        isRecording: false,
        isPaused: false,
        uri: uri,
      }));

      return result;
    } catch (error) {
      console.error('Failed to stop recording:', error);
      return null;
    }
  }, [state.duration, recorder]);

  // Cancel recording
  const cancelRecording = useCallback(async () => {
    try {
      await recorder.stop();
      // Disable recording mode
      await setAudioModeAsync({ allowsRecording: false });
      const uri = recorder.uri;

      // Delete the recording file
      if (uri) {
        const file = new File(uri);
        if (file.exists) {
          file.delete();
        }
      }

      isRecordingRef.current = false;

      setState({
        isRecording: false,
        isPaused: false,
        duration: 0,
        uri: null,
      });
    } catch (error) {
      console.error('Failed to cancel recording:', error);
    }
  }, [recorder]);

  // Playback functions
  const loadSound = useCallback((uri: string) => {
    // Setting playerSource will cause useAudioPlayer to create a new player
    setPlayerSource(uri);
    setIsPlaying(false);
    setPlaybackPosition(0);
    setPlaybackDuration(0);
  }, []);

  const playSound = useCallback(() => {
    if (player) {
      player.play();
      setIsPlaying(true);
    }
  }, [player]);

  const pauseSound = useCallback(() => {
    if (player) {
      player.pause();
      setIsPlaying(false);
    }
  }, [player]);

  const stopSound = useCallback(() => {
    if (player) {
      player.pause();
      player.seekTo(0);
      setIsPlaying(false);
      setPlaybackPosition(0);
    }
  }, [player]);

  const seekTo = useCallback(
    (position: number) => {
      if (player) {
        // Convert milliseconds to seconds
        player.seekTo(position / 1000);
      }
    },
    [player]
  );

  return {
    // Recording state
    ...state,
    // Recording actions
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    cancelRecording,
    requestPermission,
    // Playback state
    isPlaying,
    playbackPosition,
    playbackDuration,
    // Playback actions
    loadSound,
    playSound,
    pauseSound,
    stopSound,
    seekTo,
  };
}
