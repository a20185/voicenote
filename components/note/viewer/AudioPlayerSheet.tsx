import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Text } from 'tamagui';
import { Music, Play, Pause, SkipBack, SkipForward } from 'lucide-react-native';

interface AudioPlayerSheetProps {
  fileName: string;
  duration: number; // ms
  position: number; // ms
  isPlaying: boolean;
  onPlayPause: () => void;
  onSkipBack: () => void;
  onSkipForward: () => void;
  onSeek: (positionMs: number) => void;
}

function formatTime(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

export function AudioPlayerSheet({
  fileName, duration, position, isPlaying,
  onPlayPause, onSkipBack, onSkipForward,
}: AudioPlayerSheetProps) {
  const progress = duration > 0 ? position / duration : 0;

  return (
    <View style={styles.container}>
      <View style={styles.albumArt}>
        <Music size={64} color="#4b5563" />
      </View>
      <Text fontSize={18} fontWeight="600" color="#fff" marginTop={24}>{fileName}</Text>
      <Text fontSize={14} color="#9ca3af" marginTop={4}>{formatTime(duration)}</Text>

      <View style={styles.progressContainer}>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
        <View style={styles.timeRow}>
          <Text style={styles.timeText}>{formatTime(position)}</Text>
          <Text style={styles.timeText}>{formatTime(duration)}</Text>
        </View>
      </View>
      <View style={styles.controls}>
        <Pressable onPress={onSkipBack} style={styles.skipButton}>
          <SkipBack size={20} color="#fff" />
        </Pressable>
        <Pressable onPress={onPlayPause} style={styles.playButton}>
          {isPlaying ? <Pause size={24} color="#111827" /> : <Play size={24} color="#111827" style={{ marginLeft: 2 }} />}
        </Pressable>
        <Pressable onPress={onSkipForward} style={styles.skipButton}>
          <SkipForward size={20} color="#fff" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  albumArt: {
    width: 192, height: 192, borderRadius: 16,
    backgroundColor: '#1f2937',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5, shadowRadius: 24, elevation: 24,
  },
  progressContainer: { width: '100%', marginTop: 32 },
  progressTrack: { height: 4, backgroundColor: '#374151', borderRadius: 2 },
  progressFill: { height: '100%', backgroundColor: '#fff', borderRadius: 2 },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  timeText: { fontSize: 11, fontFamily: 'monospace', color: '#9ca3af' },
  controls: { flexDirection: 'row', alignItems: 'center', marginTop: 32, gap: 24 },
  skipButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  playButton: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
  },
});
