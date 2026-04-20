import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Text } from 'tamagui';
import { LinearGradient } from 'expo-linear-gradient';
import { X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ViewerHeaderProps {
  currentIndex: number;
  totalCount: number;
  onClose: () => void;
}

export function ViewerHeader({ currentIndex, totalCount, onClose }: ViewerHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={['rgba(0,0,0,0.6)', 'transparent']}
      style={[styles.container, { paddingTop: insets.top + 8 }]}
    >
      <Text fontSize={14} fontWeight="500" color="#fff">
        {currentIndex + 1} / {totalCount}
      </Text>
      <Pressable
        onPress={onClose}
        style={styles.closeButton}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <X size={24} color="#fff" />
      </Pressable>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  closeButton: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center', justifyContent: 'center',
  },
});
