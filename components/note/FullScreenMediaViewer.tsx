import React, { useState } from 'react';
import { Modal, View, Image, Pressable, StyleSheet, Dimensions } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { ViewerHeader } from './viewer/ViewerHeader';
import { ThumbnailStrip } from './viewer/ThumbnailStrip';
import { AudioPlayerSheet } from './viewer/AudioPlayerSheet';
import type { MediaFile } from '@/db';
import { getMediaUri } from '@/services/mediaStorage';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface FullScreenMediaViewerProps {
  visible: boolean;
  mediaFiles: MediaFile[];
  initialIndex: number;
  audioState?: {
    isPlaying: boolean;
    position: number;
    duration: number;
    onPlayPause: () => void;
    onSeek: (ms: number) => void;
  };
  onClose: () => void;
}

export function FullScreenMediaViewer({
  visible, mediaFiles, initialIndex, audioState, onClose,
}: FullScreenMediaViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const currentMedia = mediaFiles[currentIndex];

  const goTo = (index: number) => {
    if (index >= 0 && index < mediaFiles.length) setCurrentIndex(index);
  };

  if (!visible || !currentMedia) return null;

  const isAudio = currentMedia.mimeType?.startsWith('audio/');

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.container}>
        <ViewerHeader currentIndex={currentIndex} totalCount={mediaFiles.length} onClose={onClose} />

        <View style={styles.content}>
          {isAudio && audioState ? (
            <AudioPlayerSheet
              fileName={currentMedia.fileName || 'Audio'}
              duration={audioState.duration}
              position={audioState.position}
              isPlaying={audioState.isPlaying}
              onPlayPause={audioState.onPlayPause}
              onSkipBack={() => audioState.onSeek(Math.max(0, audioState.position - 15000))}
              onSkipForward={() => audioState.onSeek(Math.min(audioState.duration, audioState.position + 15000))}
              onSeek={audioState.onSeek}
            />
          ) : currentMedia.type === 'image' ? (
            <Image
              source={{ uri: getMediaUri(currentMedia.uri) }}
              style={styles.fullImage}
              resizeMode="contain"
            />
          ) : null}

          {mediaFiles.length > 1 && currentIndex > 0 && (
            <Pressable onPress={() => goTo(currentIndex - 1)} style={[styles.navButton, styles.navLeft]}>
              <ChevronLeft size={24} color="#fff" />
            </Pressable>
          )}
          {mediaFiles.length > 1 && currentIndex < mediaFiles.length - 1 && (
            <Pressable onPress={() => goTo(currentIndex + 1)} style={[styles.navButton, styles.navRight]}>
              <ChevronRight size={24} color="#fff" />
            </Pressable>
          )}
        </View>

        {mediaFiles.length > 1 && (
          <ThumbnailStrip items={mediaFiles} currentIndex={currentIndex} onSelect={setCurrentIndex} />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  fullImage: { width: SCREEN_WIDTH, height: SCREEN_HEIGHT * 0.7 },
  navButton: {
    position: 'absolute', width: 48, height: 48, borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center', justifyContent: 'center',
  },
  navLeft: { left: 16 },
  navRight: { right: 16 },
});
