import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Archive, GitMerge, Wand2, X, FolderPlus, Share2 } from 'lucide-react-native';

export interface SelectionBarProps {
  visible: boolean;
  selectionCount: number;
  onClear: () => void;
  onArchive: () => void;
  onMerge: () => void;
  onAI: () => void;
  onCategorize?: () => void;
  onShare?: () => void;
  hideArchiveAction?: boolean;
}

export type SelectionBarPropsType = SelectionBarProps;

export function SelectionBar({
  visible,
  selectionCount,
  onClear,
  onArchive,
  onMerge,
  onAI,
  onCategorize,
  onShare,
  hideArchiveAction,
}: SelectionBarProps) {
  const { t } = useTranslation('selection');
  const translateY = useSharedValue(100);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, { damping: 30, stiffness: 300 });
      opacity.value = withSpring(1, { damping: 30, stiffness: 300 });
    } else {
      translateY.value = withSpring(100, { damping: 30, stiffness: 300 });
      opacity.value = withSpring(0, { damping: 30, stiffness: 300 });
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <View style={styles.outer} pointerEvents={visible ? 'auto' : 'none'}>
      <Animated.View style={[styles.capsule, animatedStyle]}>
        {/* Left side: cancel + count */}
        <Pressable onPress={onClear} accessibilityLabel="Clear selection" accessibilityRole="button">
          <X size={20} color="#ffffff" />
        </Pressable>
        <Text style={styles.countText}>{t('selected', { count: selectionCount })}</Text>

        {/* Spacer */}
        <View style={{ flex: 1 }} />

        {/* Right side: action buttons */}
        <View style={styles.actions}>
          {onShare && (
            <Pressable
              onPress={onShare}
              style={({ pressed }) => [
                styles.actionButton,
                pressed && styles.actionButtonPressed,
              ]}
              accessibilityLabel="Share selected notes"
              accessibilityRole="button"
            >
              <Share2 size={20} color="#ffffff" />
            </Pressable>
          )}
          {!hideArchiveAction && (
            <Pressable
              onPress={onArchive}
              style={({ pressed }) => [
                styles.actionButton,
                pressed && styles.actionButtonPressed,
              ]}
              accessibilityLabel="Archive selected notes"
              accessibilityRole="button"
            >
              <Archive size={20} color="#ffffff" />
            </Pressable>
          )}
          <Pressable
            onPress={onMerge}
            style={({ pressed }) => [
              styles.actionButton,
              pressed && styles.actionButtonPressed,
            ]}
            accessibilityLabel="Merge selected notes"
            accessibilityRole="button"
          >
            <GitMerge size={20} color="#ffffff" />
          </Pressable>

          {onCategorize && (
            <Pressable
              onPress={onCategorize}
              style={({ pressed }) => [
                styles.actionButton,
                pressed && styles.actionButtonPressed,
              ]}
              accessibilityLabel="Categorize selected notes"
              accessibilityRole="button"
            >
              <FolderPlus size={20} color="#ffffff" />
            </Pressable>
          )}

          <Pressable
            onPress={onAI}
            style={({ pressed }) => [
              styles.actionButton,
              styles.aiButton,
              pressed && styles.aiButtonPressed,
            ]}
            accessibilityLabel="AI actions"
            accessibilityRole="button"
          >
            <Wand2 size={20} color="#111827" />
          </Pressable>
        </View>
      </Animated.View>
    </View>
  );
}
const styles = StyleSheet.create({
  outer: {
    position: 'absolute',
    bottom: 32,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 100,
  },
  capsule: {
    maxWidth: 384,
    width: '100%',
    backgroundColor: '#111827',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    paddingTop: 8,
    paddingBottom: 8,
    paddingLeft: 16,
    paddingRight: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  countText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#d1d5db',
  },
  actions: {
    flexDirection: 'row',
    gap: 4,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  actionButtonPressed: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  aiButton: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  aiButtonPressed: {
    backgroundColor: '#e5e7eb',
  },
});
