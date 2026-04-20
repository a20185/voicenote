import { useState, useEffect, useRef } from 'react';
import { Modal, Pressable, StyleSheet, Keyboard } from 'react-native';
import { YStack, XStack, Text, styled, Theme } from 'tamagui';
import * as Haptics from 'expo-haptics';
import { AlertCircle, RefreshCw } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useAudioRecorder } from '@hooks/useAudioRecorder';
import { useRecordingTranscription } from '@hooks/useRecordingTranscription';
import { useSwipeGesture } from '@hooks/useSwipeGesture';
import { RecordingOverlayHeader } from './RecordingOverlayHeader';
import { TranscriptionTextArea } from './TranscriptionTextArea';
import { RecordingTimer } from './RecordingTimer';
import { RecordingSlideTrack } from './RecordingSlideTrack';
import { SwipeableMicButton } from './SwipeableMicButton';
import { TextModeSwitcher } from './TextModeSwitcher';

export interface RecordingOverlayProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: { uri?: string; duration: number; title?: string; transcriptionText?: string }) => void;
}

const OverlayContainer = styled(YStack, {
  flex: 1,
  justifyContent: 'flex-end',
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
});

const BottomSheet = styled(YStack, {
  backgroundColor: '$background',
  borderTopLeftRadius: 40,
  borderTopRightRadius: 40,
  paddingHorizontal: 24,
  paddingTop: 16,
  paddingBottom: 48,
  maxHeight: '85%',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: -4 },
  shadowOpacity: 0.15,
  shadowRadius: 12,
  elevation: 20,
});

const ErrorContainer = styled(XStack, {
  paddingHorizontal: 16,
  paddingVertical: 8,
  backgroundColor: '#fef2f2',
  borderRadius: 8,
  alignItems: 'center',
  gap: 8,
  marginBottom: 16,
});

const WarningContainer = styled(XStack, {
  paddingHorizontal: 16,
  paddingVertical: 8,
  backgroundColor: '#fefce8',
  borderRadius: 8,
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 8,
  marginBottom: 16,
});

const TrackContainer = styled(YStack, {
  position: 'relative',
  width: '100%',
  maxWidth: 280,
  height: 80,
  alignItems: 'center',
  justifyContent: 'center',
  alignSelf: 'center',
});

export function RecordingOverlay({ visible, onClose, onSave }: RecordingOverlayProps) {
  const { t } = useTranslation(['recording', 'common']);
  const {
    isRecording,
    isPaused,
    duration,
    startRecording,
    stopRecording,
    cancelRecording,
  } = useAudioRecorder();

  const {
    isStreamingMode,
    currentText: transcriptionCurrentText,
    isTranscribing,
    isReady,
    error: transcriptionError,
    startStreaming,
    stopStreaming,
    transcribe,
    reset: resetTranscription,
    retry,
    isConfigured,
    optimizedText,
    isOptimizing,
    textMode,
    setTextMode,
  } = useRecordingTranscription();

  const [recordingResult, setRecordingResult] = useState<{ uri: string; duration: number } | null>(null);
  const [editedText, setEditedText] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trackWidth, setTrackWidth] = useState(280);
  const [hasRecorded, setHasRecorded] = useState(false);
  const [localStartAt, setLocalStartAt] = useState<number | null>(null);
  const [localDuration, setLocalDuration] = useState(0);
  const pendingSaveRef = useRef(false);

  // Store resetTranscription in ref to avoid dependency issues
  const resetTranscriptionRef = useRef(resetTranscription);
  useEffect(() => {
    resetTranscriptionRef.current = resetTranscription;
  }, [resetTranscription]);

  const effectiveIsRecording = isStreamingMode ? isTranscribing : isRecording;

  // Convert duration from ms to seconds for timer
  const effectiveDuration = isStreamingMode ? localDuration : duration;
  const seconds = Math.floor(effectiveDuration / 1000);

  // Get title based on state
  const getTitle = () => {
    if (effectiveIsRecording) return t('recordingInProgress');
    if (!isStreamingMode && isTranscribing) return t('transcribing');
    if (hasRecorded) return t('recordingComplete');
    return t('recording');
  };

  // Reset state when overlay opens - only depends on visible
  useEffect(() => {
    if (visible) {
      setRecordingResult(null);
      setEditedText('');
      setIsEditing(false);
      setError(null);
      setHasRecorded(false);
      setLocalStartAt(null);
      setLocalDuration(0);
      pendingSaveRef.current = false;
      resetTranscriptionRef.current();
    }
  }, [visible]);

  useEffect(() => {
    if (!isStreamingMode || localStartAt == null || !isTranscribing) {
      return;
    }

    const timer = setInterval(() => {
      setLocalDuration(Date.now() - localStartAt);
    }, 200);

    return () => clearInterval(timer);
  }, [isStreamingMode, localStartAt, isTranscribing]);

  const handleStartRecording = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setError(null);
      setEditedText('');
      setIsEditing(false);
      setHasRecorded(false);
      resetTranscription();

      if (isStreamingMode) {
        await startStreaming();
        setLocalStartAt(Date.now());
        setLocalDuration(0);
      } else {
        // Start recording first
        await startRecording();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start recording');
    }
  };

  const handleStopRecording = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      if (isStreamingMode) {
        const streamResult = await stopStreaming();
        const elapsed = localStartAt ? Date.now() - localStartAt : localDuration;
        setLocalStartAt(null);
        setLocalDuration(elapsed);
        setRecordingResult({ uri: '', duration: elapsed });
        setHasRecorded(true);
        setEditedText(streamResult.text || '');
        setIsEditing(true);
        return;
      }

      // Stop recording
      const result = await stopRecording();
      if (!result) {
        setError('Failed to stop recording');
        return;
      }

      setRecordingResult({ uri: result.uri, duration: result.duration });
      setHasRecorded(true);

      // Handle transcription based on mode
      if (isConfigured) {
        // File-based mode - transcribe after recording
        const text = await transcribe(result.uri);
        setEditedText(text || '');
      } else {
        // No ASR configured
        setEditedText('');
      }
      setIsEditing(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to finish recording');
    }
  };

  const handleMicButtonPress = () => {
    if (effectiveIsRecording) {
      void handleStopRecording();
    } else {
      void handleStartRecording();
    }
  };

  const handleCancel = async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    if (isStreamingMode && isTranscribing) {
      try {
        await stopStreaming();
      } catch {
        // Ignore stop errors on cancel
      }
    }
    if (!isStreamingMode && isRecording) {
      await cancelRecording();
    }
    pendingSaveRef.current = false;
    setRecordingResult(null);
    setEditedText('');
    setError(null);
    setHasRecorded(false);
    setIsEditing(false);
    setLocalStartAt(null);
    setLocalDuration(0);
    resetTranscription();
    onClose();
  };

  const handleSave = async () => {
    if (effectiveIsRecording) {
      pendingSaveRef.current = true;
      await handleStopRecording();
      return;
    }

    if (!recordingResult) return;

    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSave({
      uri: recordingResult.uri || undefined,
      duration: recordingResult.duration,
      transcriptionText: editedText || (textMode === 'optimized' ? optimizedText : transcriptionCurrentText) || undefined,
    });

    // Reset state
    pendingSaveRef.current = false;
    setRecordingResult(null);
    setEditedText('');
    setError(null);
    setHasRecorded(false);
    setIsEditing(false);
    setLocalStartAt(null);
    setLocalDuration(0);
    resetTranscription();
  };

  // Auto-save after stop+transcription completes when user tapped save while recording
  useEffect(() => {
    if (pendingSaveRef.current && recordingResult && !effectiveIsRecording && !isTranscribing) {
      handleSave();
    }
  }, [recordingResult, effectiveIsRecording, isTranscribing]);

  const handleRetryTranscription = async () => {
    if (recordingResult?.uri) {
      setEditedText('');
      const text = await transcribe(recordingResult.uri);
      setEditedText(text || '');
    }
  };

  const { progress, isCommitted, gesture, buttonAnimatedStyle } = useSwipeGesture({
    trackWidth,
    onCancel: handleCancel,
    onSave: handleSave,
  });

  const handleModalClose = () => {
    if (effectiveIsRecording) {
      handleCancel();
    } else {
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleModalClose}
    >
      <Theme name="light">
        <OverlayContainer>
          <Pressable style={StyleSheet.absoluteFill} onPress={handleModalClose} />

          <BottomSheet>
            {/* Header */}
            <RecordingOverlayHeader
              title={getTitle()}
              onCancel={handleCancel}
              onSave={handleSave}
              saveDisabled={isTranscribing}
              saveLabel={t('common:done')}
            />

            {/* Text mode switcher - only for file-based mode with optimization */}
            {!isStreamingMode && hasRecorded && !isRecording && optimizedText && (
              <YStack marginBottom={16} alignItems="center">
                <TextModeSwitcher
                  mode={textMode}
                  hasOptimized={!!optimizedText && !isOptimizing}
                  onChange={setTextMode}
                />
              </YStack>
            )}

            {/* Transcription text area */}
            <TranscriptionTextArea
              text={editedText || transcriptionCurrentText}
              isEditing={isEditing}
              isTranscribing={isTranscribing}
              isRecording={effectiveIsRecording}
              isOptimizing={isOptimizing}
              placeholder={t('tapToRecord')}
              onTextChange={setEditedText}
            />

            {/* Recording error */}
            {error && (
              <ErrorContainer>
                <AlertCircle size={16} color="#dc2626" />
                <Text fontSize={14} color="#dc2626" flex={1}>
                  {error}
                </Text>
              </ErrorContainer>
            )}

            {/* Transcription error with retry */}
            {transcriptionError && (isEditing || effectiveIsRecording || hasRecorded) && (
              <WarningContainer>
                <XStack alignItems="center" gap={8} flex={1}>
                  <AlertCircle size={16} color="#ca8a04" />
                  <Text fontSize={14} color="#a16207" flex={1}>
                    {transcriptionError}
                  </Text>
                </XStack>
                {recordingResult && (
                  <Pressable onPress={handleRetryTranscription}>
                    <XStack alignItems="center" gap={4}>
                      <RefreshCw size={12} color="#a16207" />
                      <Text fontSize={14} color="#a16207" fontWeight="500">
                        {t('common:retry')}
                      </Text>
                    </XStack>
                  </Pressable>
                )}
              </WarningContainer>
            )}

            {/* ASR not configured warning */}
            {!isConfigured && hasRecorded && !isRecording && !isStreamingMode && (
              <WarningContainer>
                <Text fontSize={12} color="#3b82f6" flex={1} textAlign="center">
                  {t('asrNotConfigured')}
                </Text>
              </WarningContainer>
            )}

            {/* Timer */}
            <YStack alignItems="center" marginBottom={32}>
              <RecordingTimer seconds={seconds} />
            </YStack>

            {/* Swipe track with mic button */}
            <TrackContainer onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}>
              <RecordingSlideTrack progress={progress} isCommitted={isCommitted} trackWidth={trackWidth} />
              <SwipeableMicButton
                isRecording={effectiveIsRecording}
                isTranscribing={!isStreamingMode && isTranscribing}
                buttonAnimatedStyle={buttonAnimatedStyle}
                gesture={gesture}
                onPress={handleMicButtonPress}
              />
            </TrackContainer>
          </BottomSheet>
        </OverlayContainer>
      </Theme>
    </Modal>
  );
}
