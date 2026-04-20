import React, { useMemo, useRef, useCallback } from 'react';
import { View, RefreshControl, StyleSheet } from 'react-native';
import { Text } from 'tamagui';
import { FlashList } from '@shopify/flash-list';
import { Swipeable } from 'react-native-gesture-handler';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import type { Note } from '@/db';
import { mediaQueries } from '@/db/queries';
import { SwipeableNoteBlock } from './SwipeableNoteBlock';

export interface NoteListProps {
  notes: Note[];
  isLoading?: boolean;
  isSelectionMode: boolean;
  selectedIds: Set<number>;
  onNotePress: (note: Note) => void;
  onNoteLongPress: (note: Note) => void;
  onArchive: (noteId: number) => void;
  onDelete: (noteId: number) => void;
  onShare?: (note: Note) => void;
  onRefresh?: () => void;
  hideArchiveAction?: boolean;
}

type DateGroupKey =
  | 'today' | 'yesterday' | 'dayBeforeYesterday' | 'thisWeek' | 'thisMonth'
  | 'lastMonth' | 'thisQuarter' | 'thisYear' | 'lastYear' | 'overAYear';

interface SectionedNote {
  type: 'note';
  note: Note;
  index: number;
}

interface SectionHeader {
  type: 'header';
  section: DateGroupKey;
}

type ListItem = SectionedNote | SectionHeader;

function getDateGroupKey(date: Date | string): DateGroupKey {
  const now = new Date();
  const d = typeof date === 'string' ? new Date(date) : date;
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const noteDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.floor(
    (today.getTime() - noteDay.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diffDays === 0) return 'today';
  if (diffDays === 1) return 'yesterday';
  if (diffDays === 2) return 'dayBeforeYesterday';

  const dayOfWeek = now.getDay() || 7;
  if (diffDays < dayOfWeek) return 'thisWeek';

  if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear())
    return 'thisMonth';

  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  if (
    d.getMonth() === lastMonth.getMonth() &&
    d.getFullYear() === lastMonth.getFullYear()
  )
    return 'lastMonth';

  const quarter = Math.floor(now.getMonth() / 3);
  const noteQuarter = Math.floor(d.getMonth() / 3);
  if (noteQuarter === quarter && d.getFullYear() === now.getFullYear())
    return 'thisQuarter';

  if (d.getFullYear() === now.getFullYear()) return 'thisYear';
  if (d.getFullYear() === now.getFullYear() - 1) return 'lastYear';

  return 'overAYear';
}

function groupNotesByDate(notes: Note[]): ListItem[] {
  if (notes.length === 0) return [];

  const items: ListItem[] = [];
  let currentSection: DateGroupKey | null = null;
  let noteIndex = 0;

  notes.forEach((note) => {
    const section = getDateGroupKey(note.updatedAt);
    if (section !== currentSection) {
      items.push({ type: 'header', section });
      currentSection = section;
    }
    items.push({ type: 'note', note, index: noteIndex++ });
  });

  return items;
}

function DateSeparator({ label }: { label: string }) {
  return (
    <View style={styles.separatorContainer}>
      <View style={styles.dashedLine} />
      <Text style={styles.separatorLabel}>{label}</Text>
      <View style={styles.dashedLine} />
    </View>
  );
}

export function NoteList({
  notes,
  isLoading,
  isSelectionMode,
  selectedIds,
  onNotePress,
  onNoteLongPress,
  onArchive,
  onDelete,
  onShare,
  onRefresh,
  hideArchiveAction = false,
}: NoteListProps) {
  const { t } = useTranslation(['dates', 'note', 'common']);
  const listItems = useMemo(() => groupNotesByDate(notes), [notes]);
  const swipeableRefs = useRef<Map<number, Swipeable>>(new Map());

  const closeAllSwipeables = useCallback((exceptId?: number) => {
    swipeableRefs.current.forEach((ref, id) => {
      if (id !== exceptId) ref.close();
    });
  }, []);

  const noteIds = useMemo(() => notes.map(n => n.id), [notes]);
  const { data: attachmentCounts = {} } = useQuery({
    queryKey: ['attachmentCounts', noteIds],
    queryFn: () => mediaQueries.getCountsByNoteIds(noteIds),
    enabled: noteIds.length > 0,
  });

  if (isLoading && notes.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text fontSize={16} color="$textSecondary">
          {t('common:loading')}
        </Text>
      </View>
    );
  }

  if (!isLoading && notes.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text fontSize={16} color="$textSecondary">
          {t('note:emptyState')}
        </Text>
      </View>
    );
  }

  const renderItem = ({ item }: { item: ListItem }) => {
    if (item.type === 'header') {
      return <DateSeparator label={t(`dates:${item.section}`)} />;
    }

    const { note, index } = item;
    return (
      <SwipeableNoteBlock
        note={note}
        index={index}
        isSelected={selectedIds.has(note.id)}
        isSelectionMode={isSelectionMode}
        onPress={() => onNotePress(note)}
        onLongPress={() => onNoteLongPress(note)}
        onShare={() => onShare?.(note)}
        onArchive={() => onArchive(note.id)}
        onDelete={() => onDelete(note.id)}
        closeOthers={() => closeAllSwipeables(note.id)}
        hideArchiveAction={hideArchiveAction}
        attachmentCount={attachmentCounts[note.id] ?? 0}
      />
    );
  };

  return (
    <View style={styles.container}>
      <FlashList<ListItem>
        data={listItems}
        renderItem={renderItem}
        keyExtractor={(item) =>
          item.type === 'header'
            ? `header-${item.section}`
            : `note-${item.note.id}`
        }
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={isLoading || false}
              onRefresh={onRefresh}
              tintColor="#999"
            />
          ) : undefined
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  separatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  dashedLine: {
    height: 1,
    flex: 1,
    borderTopWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#e5e7eb',
  },
  separatorLabel: {
    fontSize: 10,
    color: '#9ca3af',
    letterSpacing: 2,
    fontWeight: '500',
  },
});

export type NoteListPropsType = NoteListProps;
