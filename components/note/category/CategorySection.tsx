import React, { useCallback } from 'react';
import { View, Pressable, StyleSheet, LayoutAnimation } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { Text } from 'tamagui';
import { ChevronDown } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import type { Category, Note } from '@/db';
import { SwipeableNoteBlock } from '@/components/note/SwipeableNoteBlock';

interface CategorySectionProps {
  category: Category | null;
  notes: Note[];
  expanded: boolean;
  onToggle: () => void;
  isSelectionMode: boolean;
  selectedIds: Set<number>;
  onNotePress: (note: Note) => void;
  onNoteLongPress: (note: Note) => void;
  onArchive: (id: number) => void;
  onDelete: (id: number) => void;
  onShare: (note: Note) => void;
  hideArchiveAction?: boolean;
}

export const CategorySection = React.memo(function CategorySection({
  category,
  notes,
  expanded,
  onToggle,
  isSelectionMode,
  selectedIds,
  onNotePress,
  onNoteLongPress,
  onArchive,
  onDelete,
  onShare,
  hideArchiveAction = false,
}: CategorySectionProps) {
  const { t } = useTranslation('category');
  const rotation = useSharedValue(expanded ? 0 : -90);

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const handleToggle = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const next = !expanded;
    rotation.value = withTiming(next ? 0 : -90, { duration: 200 });
    onToggle();
  }, [expanded, onToggle, rotation]);

  const name = category ? category.name : t('uncategorized');

  return (
    <View style={styles.container}>
      {/* Section header */}
      <Pressable
        style={({ pressed }) => [styles.header, pressed && styles.headerPressed]}
        onPress={handleToggle}
      >
        <Animated.View style={chevronStyle}>
          <ChevronDown size={16} color="#a1a1aa" />
        </Animated.View>
        <Text fontSize={14} fontWeight="500" color="#3f3f46" flex={1} marginLeft={8}>
          {name}
        </Text>
        {category?.color && (
          <View style={[styles.colorDot, { backgroundColor: category.color }]} />
        )}
        <Text fontSize={12} color="#a1a1aa" marginLeft={8}>
          {notes.length}
        </Text>
      </Pressable>

      {/* Expanded content */}
      {expanded && (
        <View style={styles.content}>
          {notes.map((note, index) => (
            <SwipeableNoteBlock
              key={note.id}
              note={note}
              index={index}
              isSelected={selectedIds.has(note.id)}
              isSelectionMode={isSelectionMode}
              onPress={() => onNotePress(note)}
              onLongPress={() => onNoteLongPress(note)}
              onShare={() => onShare(note)}
              onArchive={() => onArchive(note.id)}
              onDelete={() => onDelete(note.id)}
              hideArchiveAction={hideArchiveAction}
            />
          ))}
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#f3f4f6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#fafafa',
  },
  headerPressed: {
    backgroundColor: '#f4f4f5',
  },
  colorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  content: {
    backgroundColor: '#ffffff',
  },
});
