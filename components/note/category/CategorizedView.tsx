import React, { useCallback } from 'react';
import { View, Pressable, FlatList, StyleSheet } from 'react-native';
import { Text } from 'tamagui';
import { Settings2, FolderPlus } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import type { Note } from '@/db';
import type { CategorizedGroup } from '@/types/category';
import { useCategories } from '@/hooks/useCategories';
import { useCategorizedNotes } from '@/hooks/useCategorizedNotes';
import { useCategoryStore } from '@/store/useCategoryStore';
import { CategoryFilterBar } from './CategoryFilterBar';
import { CategorySection } from './CategorySection';

interface CategorizedViewProps {
  notes: Note[];
  isSelectionMode: boolean;
  selectedIds: Set<number>;
  onNotePress: (note: Note) => void;
  onNoteLongPress: (note: Note) => void;
  onArchive: (id: number) => void;
  onDelete: (id: number) => void;
  onShare: (note: Note) => void;
  hideArchiveAction?: boolean;
  onOpenManagement: () => void;
}

export function CategorizedView({
  notes,
  isSelectionMode,
  selectedIds,
  onNotePress,
  onNoteLongPress,
  onArchive,
  onDelete,
  onShare,
  hideArchiveAction = false,
  onOpenManagement,
}: CategorizedViewProps) {
  const { t } = useTranslation('category');
  const { data: categories = [] } = useCategories();
  const groups = useCategorizedNotes(notes, categories);
  const { filter, expandedIds, setFilter, toggleExpanded } = useCategoryStore();

  const uncategorizedCount = groups.find((g) => g.category === null)?.notes.length ?? 0;

  // Apply filter
  const filteredGroups = groups.filter((group) => {
    if (filter.type === 'all') return true;
    if (filter.type === 'uncategorized') return group.category === null;
    return filter.type === 'category' && group.category?.id === filter.categoryId;
  });

  const renderSection = useCallback(
    ({ item }: { item: CategorizedGroup }) => {
      const key = item.category?.id ?? 'uncategorized';
      return (
        <CategorySection
          category={item.category}
          notes={item.notes}
          expanded={expandedIds.has(key)}
          onToggle={() => toggleExpanded(key)}
          isSelectionMode={isSelectionMode}
          selectedIds={selectedIds}
          onNotePress={onNotePress}
          onNoteLongPress={onNoteLongPress}
          onArchive={onArchive}
          onDelete={onDelete}
          onShare={onShare}
          hideArchiveAction={hideArchiveAction}
        />
      );
    },
    [expandedIds, toggleExpanded, isSelectionMode, selectedIds, onNotePress, onNoteLongPress, onArchive, onDelete, onShare, hideArchiveAction],
  );

  // Empty state - no categories created yet
  if (categories.length === 0) {
    return (
      <View style={styles.container}>
        <TitleBar title={t('title')} onManage={onOpenManagement} />
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <FolderPlus size={32} color="#a1a1aa" />
          </View>
          <Text fontSize={15} color="#71717a" textAlign="center">
            {t('emptyTitle')}
          </Text>
          <Text fontSize={13} color="#a1a1aa" textAlign="center" marginTop={4}>
            {t('emptyHint')}
          </Text>
          <Pressable style={styles.createButton} onPress={onOpenManagement}>
            <Text fontSize={14} fontWeight="500" color="white">
              {t('createCategory')}
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TitleBar title={t('title')} onManage={onOpenManagement} />
      <CategoryFilterBar
        categories={categories}
        filter={filter}
        onFilterChange={setFilter}
        uncategorizedCount={uncategorizedCount}
      />
      {filteredGroups.length === 0 ? (
        <View style={styles.filterEmpty}>
          <Text fontSize={13} color="#a1a1aa" textAlign="center">
            {t('filterEmpty')}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredGroups}
          renderItem={renderSection}
          keyExtractor={(item) => String(item.category?.id ?? 'uncategorized')}
        />
      )}
    </View>
  );
}

function TitleBar({ title, onManage }: { title: string; onManage: () => void }) {
  return (
    <View style={styles.titleBar}>
      <Text fontSize={14} fontWeight="500" color="#3f3f46" flex={1}>
        {title}
      </Text>
      <Pressable
        style={({ pressed }) => [styles.manageButton, pressed && styles.manageButtonPressed]}
        onPress={onManage}
      >
        <Settings2 size={16} color="#71717a" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  titleBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#ffffff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#f3f4f6',
  },
  manageButton: {
    padding: 8,
    borderRadius: 8,
  },
  manageButtonPressed: {
    backgroundColor: '#f4f4f5',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#f4f4f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  createButton: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#18181b',
    borderRadius: 9999,
  },
  filterEmpty: {
    paddingVertical: 64,
    alignItems: 'center',
  },
});
