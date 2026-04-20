import React from 'react';
import { FlatList, Pressable, Image, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { MediaFile } from '@/db';
import { getMediaUri } from '@/services/mediaStorage';

interface ThumbnailStripProps {
  items: MediaFile[];
  currentIndex: number;
  onSelect: (index: number) => void;
}

export function ThumbnailStrip({ items, currentIndex, onSelect }: ThumbnailStripProps) {
  return (
    <LinearGradient colors={['transparent', 'rgba(0,0,0,0.6)']} style={styles.container}>
      <FlatList
        horizontal
        data={items}
        keyExtractor={(item) => String(item.id)}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <Pressable style={{ width: 8 }} />}
        renderItem={({ item, index }) => (
          <Pressable
            onPress={() => onSelect(index)}
            style={[
              styles.thumbnail,
              index === currentIndex && styles.thumbnailActive,
              index !== currentIndex && styles.thumbnailInactive,
            ]}
          >
            {item.type === 'image' ? (
              <Image source={{ uri: getMediaUri(item.uri) }} style={styles.image} />
            ) : null}
          </Pressable>
        )}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { height: 64, justifyContent: 'center', paddingHorizontal: 16 },
  listContent: { alignItems: 'center' },
  thumbnail: { width: 48, height: 48, borderRadius: 8, borderWidth: 2, overflow: 'hidden' },
  thumbnailActive: { borderColor: '#fff', transform: [{ scale: 1.1 }] },
  thumbnailInactive: { borderColor: 'transparent', opacity: 0.6 },
  image: { width: '100%', height: '100%' },
});
