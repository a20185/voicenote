import React, { useCallback } from 'react';
import { View, Pressable, StyleSheet, Platform } from 'react-native';
import { Text } from 'tamagui';
import { Paperclip } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import type { Note } from '@/db';

export interface NoteBlockProps {
  note: Note;
  index: number;
  isSelected: boolean;
  isSelectionMode: boolean;
  onPress: () => void;
  onLongPress: () => void;
  onArchive?: () => void;
  onDelete?: () => void;
  attachmentCount?: number;
}

const formatNoteTime = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

const MONO_FONT = Platform.select({
  ios: 'Menlo',
  android: 'monospace',
  default: 'monospace',
});

export function NoteBlock({
  note,
  index,
  isSelected,
  isSelectionMode,
  onPress,
  onLongPress,
  attachmentCount,
}: NoteBlockProps) {
  const isEven = index % 2 === 0;

  const handleLongPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onLongPress();
  }, [onLongPress]);

  const handlePress = useCallback(() => {
    if (isSelectionMode) {
      onLongPress();
    } else {
      onPress();
    }
  }, [isSelectionMode, onPress, onLongPress]);

  const count = attachmentCount ?? 0;

  return (
    <Pressable
      onPress={handlePress}
      onLongPress={handleLongPress}
      delayLongPress={500}
      style={[
        styles.container,
        { backgroundColor: isEven ? '#fafafa' : 'transparent' },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${note.type} note`}
    >
      {/* Selection checkbox */}
      {isSelectionMode && (
        <View
          style={[
            styles.checkbox,
            isSelected && styles.checkboxSelected,
          ]}
        >
          {isSelected && (
            <Text fontSize={12} fontWeight="bold" color="white">
              ✓
            </Text>
          )}
        </View>
      )}

      {/* Time - absolute top-left */}
      <Text
        style={[
          styles.time,
          isSelectionMode && { left: 40 },
        ]}
      >
        {formatNoteTime(note.updatedAt)}
      </Text>

      {/* Attachment count - absolute top-right */}
      {count > 0 && (
        <View style={styles.attachmentBadge}>
          <Paperclip size={12} color="#9ca3af" />
          <Text style={styles.attachmentCount}>{count}</Text>
        </View>
      )}

      {/* Content */}
      {note.content ? (
        <Text
          fontSize={13}
          color="#374151"
          lineHeight={20}
          numberOfLines={4}
          style={styles.content}
        >
          {note.content}
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 60,
  },
  checkbox: {
    position: 'absolute',
    top: 10,
    left: 12,
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  checkboxSelected: {
    backgroundColor: '#18181b',
    borderColor: '#18181b',
  },
  time: {
    position: 'absolute',
    top: 10,
    left: 12,
    fontSize: 11,
    fontFamily: MONO_FONT,
    color: '#9ca3af',
    zIndex: 1,
  },
  attachmentBadge: {
    position: 'absolute',
    top: 10,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    zIndex: 1,
  },
  attachmentCount: {
    fontSize: 11,
    color: '#9ca3af',
  },
  content: {
    paddingTop: 24,
  },
});

export type NoteBlockPropsType = NoteBlockProps;
