import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Music, Play, Pause } from 'lucide-react-native';

interface AudioThumbnailProps {
  isPlaying?: boolean;
  progress?: number; // 0-1
  onPress: () => void;
}

export function AudioThumbnail({ isPlaying = false, progress = 0, onPress }: AudioThumbnailProps) {
  return (
    <Pressable onPress={onPress} style={styles.container}>
      <LinearGradient
        colors={['#a78bfa', '#9333ea']}
        style={styles.gradient}
      >
        <Music size={40} color="rgba(255,255,255,0.3)" style={styles.bgIcon} />
        <View style={[styles.playButton, isPlaying && styles.playButtonActive]}>
          {isPlaying ? (
            <Pause size={24} color={isPlaying ? '#fff' : '#9333ea'} />
          ) : (
            <Play size={24} color="#9333ea" style={{ marginLeft: 2 }} />
          )}
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { width: 80, height: 80, borderRadius: 8, overflow: 'hidden' },
  gradient: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  bgIcon: { position: 'absolute' },
  playButton: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25, shadowRadius: 8, elevation: 8,
  },
  playButtonActive: { backgroundColor: '#ef4444' },
  progressTrack: {
    position: 'absolute', bottom: 4, left: 8, right: 8,
    height: 4, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 2,
  },
  progressFill: { height: '100%', backgroundColor: '#fff', borderRadius: 2 },
});
