import React from 'react';
import { View, FlatList, Pressable, StyleSheet, Image } from 'react-native';
import { Text } from 'tamagui';
import { LinearGradient } from 'expo-linear-gradient';
import { X, Paperclip } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { AudioThumbnail } from './AudioThumbnail';
import { DocumentThumbnail } from './DocumentThumbnail';
import type { MediaFile, Recording } from '@/db';
import { getMediaUri } from '@/services/mediaStorage';

interface MediaGalleryProps {
  mediaFiles: MediaFile[];
  recordings: Recording[];
  playingRecordingId: number | null;
  playbackProgress: number;
  onPlayRecording: (recording: Recording) => void;
  onMediaPress: (index: number) => void;
  onDeleteMedia: (media: MediaFile) => void;
  onAdd: () => void;
}

export function MediaGallery({
  mediaFiles, recordings, playingRecordingId, playbackProgress,
  onPlayRecording, onMediaPress, onDeleteMedia, onAdd,
}: MediaGalleryProps) {
  const { t } = useTranslation('common');
  const allItems: Array<{ type: 'recording'; data: Recording } | { type: 'media'; data: MediaFile; index: number }> = [
    ...recordings.map((r) => ({ type: 'recording' as const, data: r })),
    ...mediaFiles.map((m, i) => ({ type: 'media' as const, data: m, index: i })),
  ];

  return (
    <View style={styles.container}>
      <FlatList
        horizontal
        data={allItems}
        keyExtractor={(item) => item.type === 'recording' ? `rec-${item.data.id}` : `media-${item.data.id}`}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
        renderItem={({ item }) => {
          if (item.type === 'recording') {
            const rec = item.data;
            return (
              <AudioThumbnail
                isPlaying={playingRecordingId === rec.id}
                progress={playingRecordingId === rec.id ? playbackProgress : 0}
                onPress={() => onPlayRecording(rec)}
              />
            );
          }
          const media = item.data;
          if (media.type === 'image') {
            return (
              <View>
                <Pressable onPress={() => onMediaPress(item.index)} style={styles.imageThumbnail}>
                  <Image source={{ uri: getMediaUri(media.uri) }} style={styles.image} />
                </Pressable>
                <Pressable onPress={() => onDeleteMedia(media)} style={styles.deleteButton}>
                  <X size={12} color="#fff" />
                </Pressable>
              </View>
            );
          }
          return (
            <View>
              <DocumentThumbnail fileName={media.fileName || 'file'} onPress={() => onMediaPress(item.index)} />
              <Pressable onPress={() => onDeleteMedia(media)} style={styles.deleteButton}>
                <X size={12} color="#fff" />
              </Pressable>
            </View>
          );
        }}
        ListFooterComponent={
          <Pressable onPress={onAdd} style={styles.addButton}>
            <Paperclip size={20} color="#9ca3af" />
            <Text fontSize={10} color="#9ca3af" marginTop={2}>{t('add')}</Text>
          </Pressable>
        }
      />
      <LinearGradient
        colors={['transparent', '#fff']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        style={styles.fadeGradient}
        pointerEvents="none"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { borderTopWidth: 1, borderTopColor: '#f3f4f6', paddingVertical: 8 },
  listContent: { paddingHorizontal: 16 },
  imageThumbnail: { width: 80, height: 80, borderRadius: 8, overflow: 'hidden' },
  image: { width: '100%', height: '100%' },
  deleteButton: {
    position: 'absolute', top: -4, right: -4,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: 'rgba(24,24,27,0.8)',
    alignItems: 'center', justifyContent: 'center',
  },
  addButton: {
    width: 80, height: 80, borderRadius: 8,
    borderWidth: 2, borderStyle: 'dashed', borderColor: '#d1d5db',
    alignItems: 'center', justifyContent: 'center',
  },
  fadeGradient: {
    position: 'absolute', top: 0, right: 0, bottom: 0, width: 32,
  },
});
