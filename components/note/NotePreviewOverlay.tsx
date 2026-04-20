import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  TextInput,
  Pressable,
  StyleSheet,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import type { Note, Recording } from '@/db';
import { useNotePreview } from '@/hooks/useNotePreview';
import { useNoteMedia } from '@/hooks/useNoteMedia';
import { useAudioPlayback } from '@/hooks/useAudioPlayback';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { useMarkdownEditor } from '@/hooks/useMarkdownEditor';
import { useTranscription } from '@/hooks/useTranscription';
import { recordingQueries } from '@/db/queries';
import { saveMediaFile, getMediaUri } from '@/services/mediaStorage';
import { useTranslation } from 'react-i18next';
import { MarkdownToolbar } from '@/components/input/MarkdownToolbar';
import { PreviewHeader } from './preview/PreviewHeader';
import { MediaGallery } from './preview/MediaGallery';
import { EmptyMediaState } from './preview/EmptyMediaState';
import { FullScreenMediaViewer } from './FullScreenMediaViewer';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const PANEL_HEIGHT = Math.min(SCREEN_HEIGHT * 0.6, 600);
const CLOSE_THRESHOLD = 150;
const VELOCITY_THRESHOLD = 500;

interface NotePreviewOverlayProps {
  visible: boolean;
  note: Note | null;
  onClose: () => void;
  onArchive: () => void;
  onDelete: () => void;
}

export function NotePreviewOverlay({
  visible,
  note,
  onClose,
  onArchive,
  onDelete,
}: NotePreviewOverlayProps) {
  const { t } = useTranslation('note');
  const [mounted, setMounted] = useState(false);
  const [mediaViewerVisible, setMediaViewerVisible] = useState(false);
  const [mediaViewerIndex, setMediaViewerIndex] = useState(0);
  const [playingRecordingId, setPlayingRecordingId] = useState<number | null>(null);

  const translateY = useSharedValue(SCREEN_HEIGHT);
  const startY = useSharedValue(0);

  // Hooks
  const preview = useNotePreview({ noteId: note?.id ?? null });
  const noteMedia = useNoteMedia({
    noteId: note?.id ?? null,
    onMediaChanged: preview.refreshMedia,
  });
  const audio = useAudioPlayback();
  const recorder = useAudioRecorder();
  const markdown = useMarkdownEditor(preview.content);
  const transcription = useTranscription();

  // Reset playingRecordingId when audio finishes playing
  useEffect(() => {
    if (!audio.isPlaying && playingRecordingId !== null) {
      setPlayingRecordingId(null);
    }
  }, [audio.isPlaying]);

  // Sync markdown text → preview auto-save
  const prevMarkdownText = useRef(preview.content);
  const isUserEditing = useRef(false);
  useEffect(() => {
    if (markdown.text !== prevMarkdownText.current) {
      prevMarkdownText.current = markdown.text;
      isUserEditing.current = true;
      preview.setContent(markdown.text);
      requestAnimationFrame(() => { isUserEditing.current = false; });
    }
  }, [markdown.text]);

  // Sync preview content → markdown editor (on note load)
  useEffect(() => {
    if (!isUserEditing.current && preview.content !== markdown.text) {
      markdown.setText(preview.content);
      prevMarkdownText.current = preview.content;
    }
  }, [note?.id, preview.content]);

  // Animation: open/close
  useEffect(() => {
    if (visible) {
      setMounted(true);
      requestAnimationFrame(() => {
        translateY.value = withSpring(0, {
          damping: 30,
          stiffness: 300,
          overshootClamping: true,
        });
      });
    } else if (mounted) {
      translateY.value = withTiming(SCREEN_HEIGHT, {
        duration: 250,
        easing: Easing.in(Easing.cubic),
      }, (finished) => {
        if (finished) runOnJS(setMounted)(false);
      });
    }
  }, [visible]);

  // Cleanup on unmount
  useEffect(() => {
    if (!mounted) {
      audio.unload();
      setPlayingRecordingId(null);
    }
  }, [mounted]);

  const handleClose = useCallback(async () => {
    if (recorder.isRecording) {
      await recorder.cancelRecording();
    }
    if (preview.isDirty) {
      await preview.saveNow();
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    onClose();
  }, [recorder.isRecording, preview.isDirty, preview.saveNow, onClose]);

  const handleSave = useCallback(async () => {
    await preview.saveNow();
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [preview.saveNow]);

  // Toggle recording in preview
  const handleToggleRecording = useCallback(async () => {
    if (!note) return;

    if (recorder.isRecording) {
      // Stop and save
      const result = await recorder.stopRecording();
      if (result && result.uri) {
        try {
          const fileName = `recording_${Date.now()}.m4a`;
          const savedPath = await saveMediaFile(result.uri, fileName);

          // Create recording record
          await recordingQueries.create({
            noteId: note.id,
            uri: savedPath,
            duration: result.duration,
            fileSize: result.fileSize ?? null,
            createdAt: new Date(),
          });

          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          preview.refreshMedia();

          // Transcribe and insert text at cursor
          if (transcription.isConfigured) {
            try {
              const text = await transcription.transcribe(result.uri);
              if (text) {
                markdown.insertTextAtCursor(text);
              }
            } catch (e) {
              console.error('Transcription failed:', e);
            }
          }
        } catch (e) {
          console.error('Failed to save recording:', e);
        }
      }
    } else {
      // Start recording
      try {
        await recorder.startRecording();
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (e) {
        console.error('Failed to start recording:', e);
      }
    }
  }, [note, recorder, preview, transcription, markdown]);

  // Drag gesture for close
  const panGesture = Gesture.Pan()
    .onStart(() => {
      startY.value = translateY.value;
    })
    .onUpdate((e) => {
      const newY = startY.value + e.translationY;
      translateY.value = Math.max(0, newY);
    })
    .onEnd((e) => {
      if (e.translationY > CLOSE_THRESHOLD || e.velocityY > VELOCITY_THRESHOLD) {
        translateY.value = withTiming(SCREEN_HEIGHT, {
          duration: 250,
          easing: Easing.in(Easing.cubic),
        }, (finished) => {
          if (finished) runOnJS(handleClose)();
        });
      } else {
        translateY.value = withSpring(0, {
          damping: 30,
          stiffness: 300,
          overshootClamping: true,
        });
      }
    });

  // Audio playback handlers
  const handlePlayRecording = useCallback((recording: Recording) => {
    if (playingRecordingId === recording.id) {
      if (audio.isPlaying) {
        audio.pauseSound();
      } else {
        audio.playSound();
      }
    } else {
      audio.loadAndPlay(getMediaUri(recording.uri));
      setPlayingRecordingId(recording.id);
    }
  }, [playingRecordingId, audio]);

  const playbackProgress = audio.playbackDuration > 0
    ? audio.playbackPosition / audio.playbackDuration
    : 0;

  // Media viewer
  const handleMediaPress = useCallback((index: number) => {
    setMediaViewerIndex(index);
    setMediaViewerVisible(true);
  }, []);

  const handleAddMedia = useCallback(() => {
    noteMedia.addFromImagePicker();
  }, [noteMedia]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  if (!mounted || !note) return null;

  const hasMedia = preview.recordings.length > 0 || preview.mediaFiles.length > 0;

  return (
    <View style={styles.overlay}>
      <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.sheet, sheetStyle]}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.keyboardView}
          >
            {/* Drag handle */}
            <View style={styles.handleContainer}>
              <View style={styles.handleBar} />
            </View>

            {/* Header */}
            <PreviewHeader
              saveStatus={preview.saveStatus}
              isDirty={preview.isDirty}
              isRecording={recorder.isRecording}
              isTranscribing={transcription.isTranscribing}
              onClose={handleClose}
              onSave={handleSave}
              onToggleRecording={handleToggleRecording}
            />

            {/* Markdown toolbar */}
            <MarkdownToolbar onAction={markdown.insertMarkdown} />

            {/* Content editor */}
            <TextInput
              ref={markdown.inputRef}
              style={styles.textInput}
              value={markdown.text}
              onChangeText={markdown.setText}
              onSelectionChange={(e) => markdown.onSelectionChange(e.nativeEvent.selection)}
              multiline
              placeholder={t('writeSomething')}
              placeholderTextColor="#d1d5db"
              textAlignVertical="top"
            />

            {/* Media gallery or empty state */}
            {hasMedia ? (
              <MediaGallery
                mediaFiles={preview.mediaFiles}
                recordings={preview.recordings}
                playingRecordingId={playingRecordingId}
                playbackProgress={playbackProgress}
                onPlayRecording={handlePlayRecording}
                onMediaPress={handleMediaPress}
                onDeleteMedia={noteMedia.deleteMedia}
                onAdd={handleAddMedia}
              />
            ) : (
              <EmptyMediaState onAdd={handleAddMedia} />
            )}
          </KeyboardAvoidingView>
        </Animated.View>
      </GestureDetector>

      {/* Full screen media viewer */}
      <FullScreenMediaViewer
        visible={mediaViewerVisible}
        mediaFiles={preview.mediaFiles}
        initialIndex={mediaViewerIndex}
        audioState={{
          isPlaying: audio.isPlaying,
          position: audio.playbackPosition,
          duration: audio.playbackDuration,
          onPlayPause: () => audio.isPlaying ? audio.pauseSound() : audio.playSound(),
          onSeek: audio.seekTo,
        }}
        onClose={() => setMediaViewerVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.05)',
    zIndex: 50,
  },
  sheet: {
    height: PANEL_HEIGHT,
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 20,
  },
  keyboardView: {
    flex: 1,
  },
  handleContainer: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 4,
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: '#1f2937',
    lineHeight: 24.4,
    paddingHorizontal: 16,
    paddingVertical: 12,
    textAlignVertical: 'top',
  },
});
