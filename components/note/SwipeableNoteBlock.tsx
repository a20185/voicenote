import React, { useRef, useCallback } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Share2, Archive, Trash2 } from 'lucide-react-native';
import { NoteBlock, type NoteBlockProps } from './NoteBlock';

interface SwipeableNoteBlockProps extends NoteBlockProps {
  onShare?: () => void;
  onArchive?: () => void;
  onDelete?: () => void;
  closeOthers?: () => void;
  hideArchiveAction?: boolean;
}

export function SwipeableNoteBlock({
  onShare,
  onArchive,
  onDelete,
  closeOthers,
  hideArchiveAction = false,
  ...noteBlockProps
}: SwipeableNoteBlockProps) {
  const swipeableRef = useRef<Swipeable>(null);

  const close = useCallback(() => {
    swipeableRef.current?.close();
  }, []);

  const handleAction = useCallback((action?: () => void) => {
    close();
    action?.();
  }, [close]);

  const renderRightActions = useCallback(() => {
    return (
      <View style={[styles.actionsContainer, hideArchiveAction ? styles.actionsNarrow : styles.actionsWide]}>
        {/* Share */}
        <Pressable
          style={({ pressed }) => [
            styles.circleButton,
            styles.grayButton,
            pressed && styles.grayButtonPressed,
          ]}
          onPress={() => handleAction(onShare)}
        >
          <Share2 color="#4b5563" size={16} />
        </Pressable>

        {/* Archive - hidden in archive tab */}
        {!hideArchiveAction && (
          <Pressable
            style={({ pressed }) => [
              styles.circleButton,
              styles.grayButton,
              pressed && styles.grayButtonPressed,
            ]}
            onPress={() => handleAction(onArchive)}
          >
            <Archive color="#4b5563" size={16} />
          </Pressable>
        )}

        {/* Delete */}
        <Pressable
          style={({ pressed }) => [
            styles.circleButton,
            styles.deleteButton,
            pressed && styles.deleteButtonPressed,
          ]}
          onPress={() => handleAction(onDelete)}
        >
          <Trash2 color="#ef4444" size={16} />
        </Pressable>
      </View>
    );
  }, [onShare, onArchive, onDelete, handleAction, hideArchiveAction]);

  const handleSwipeOpen = useCallback(() => {
    closeOthers?.();
  }, [closeOthers]);

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={renderRightActions}
      overshootRight={false}
      rightThreshold={40}
      onSwipeableWillOpen={handleSwipeOpen}
    >
      <NoteBlock {...noteBlockProps} />
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    backgroundColor: '#f9fafb',
    paddingHorizontal: 16,
    gap: 12,
  },
  actionsWide: {
    width: 140,
  },
  actionsNarrow: {
    width: 100,
  },
  circleButton: {
    width: 32,
    height: 32,
    borderRadius: 9999,
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  grayButton: {
    backgroundColor: '#e5e7eb',
  },
  grayButtonPressed: {
    backgroundColor: '#d1d5db',
  },
  deleteButton: {
    backgroundColor: '#fee2e2',
  },
  deleteButtonPressed: {
    backgroundColor: '#fecaca',
  },
});
