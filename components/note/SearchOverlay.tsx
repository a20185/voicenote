import React, { useRef, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, Pressable, FlatList, Modal,
  StyleSheet, Dimensions, KeyboardAvoidingView, Platform,
} from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import { Search, X, Clock, Trash2 } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import type { Note } from '@/db';
import type { SearchResult, GroupedSearchResults } from '@/types/search';
import { useSearch } from '@/hooks/useSearch';
import { useSearchHistory } from '@/hooks/useSearchHistory';
import { SearchTagFilter } from './SearchTagFilter';
import { SearchResultItem } from './SearchResultItem';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const PANEL_HEIGHT = SCREEN_HEIGHT * 0.85;

interface SearchOverlayProps {
  visible: boolean;
  notes: Note[];
  onNotePress: (noteId: number) => void;
  onClose: () => void;
}

// Flatten grouped results into a renderable list
type ListItem =
  | { type: 'category-header'; title: string; count: number }
  | { type: 'status-header'; label: string; count: number }
  | { type: 'result'; data: SearchResult };

function buildListItems(grouped: GroupedSearchResults, t: (key: string) => string): ListItem[] {
  const items: ListItem[] = [];
  const { active, archived, snoozed } = grouped.notes;
  const total = active.length + archived.length + snoozed.length;
  if (total === 0) return items;

  items.push({ type: 'category-header', title: t('search:categories.notes'), count: total });
  if (active.length > 0) {
    items.push({ type: 'status-header', label: t('search:filters.active'), count: active.length });
    active.forEach((r) => items.push({ type: 'result', data: r }));
  }
  if (archived.length > 0) {
    items.push({ type: 'status-header', label: t('search:filters.archived'), count: archived.length });
    archived.forEach((r) => items.push({ type: 'result', data: r }));
  }
  if (snoozed.length > 0) {
    items.push({ type: 'status-header', label: t('search:filters.snoozed'), count: snoozed.length });
    snoozed.forEach((r) => items.push({ type: 'result', data: r }));
  }
  return items;
}

const ANIM_CONFIG = { duration: 280, easing: Easing.out(Easing.cubic) };

export function SearchOverlay({ visible, notes, onNotePress, onClose }: SearchOverlayProps) {
  const { t } = useTranslation('search');
  const inputRef = useRef<TextInput>(null);
  const translateY = useSharedValue(PANEL_HEIGHT);
  const backdropOpacity = useSharedValue(0);

  const {
    query, setQuery, results, isSearching,
    selectedTags, toggleTag, clearTags, allTags, clearSearch,
  } = useSearch({ notes });

  const { history, addToHistory, clearHistory } = useSearchHistory();

  useEffect(() => {
    if (visible) {
      translateY.value = withTiming(0, ANIM_CONFIG);
      backdropOpacity.value = withTiming(1, { duration: 200 });
      setTimeout(() => inputRef.current?.focus(), 150);
    } else {
      translateY.value = withTiming(PANEL_HEIGHT, ANIM_CONFIG);
      backdropOpacity.value = withTiming(0, { duration: 150 });
      clearSearch();
    }
  }, [visible]);

  const panelStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const handleResultPress = useCallback((result: SearchResult) => {
    const noteId = parseInt(result.id.replace('note-', ''), 10);
    if (query.trim()) addToHistory(query);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onNotePress(noteId);
  }, [query, addToHistory, onNotePress]);

  const handleHistoryPress = useCallback((q: string) => {
    setQuery(q);
  }, [setQuery]);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const listItems = results ? buildListItems(results, t) : [];
  const hasQuery = query.trim().length > 0;
  const hasResults = listItems.length > 0;

  const renderItem = ({ item }: { item: ListItem }) => {
    if (item.type === 'category-header') {
      return (
        <View style={styles.categoryHeader}>
          <Text style={styles.categoryTitle}>{item.title}</Text>
          <Text style={styles.categoryCount}>{t('search:resultCount', { count: item.count })}</Text>
        </View>
      );
    }
    if (item.type === 'status-header') {
      return (
        <View style={styles.statusHeader}>
          <Text style={styles.statusHeaderText}>{item.label} ({item.count})</Text>
        </View>
      );
    }
    return (
      <SearchResultItem
        result={item.data}
        query={query}
        onPress={() => handleResultPress(item.data)}
      />
    );
  };

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none" statusBarTranslucent>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Animated.View style={[styles.backdrop, backdropStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
        </Animated.View>

        <Animated.View style={[styles.panel, panelStyle]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.inputContainer}>
              <Search size={16} color="#9ca3af" style={styles.searchIcon} />
              <TextInput
                ref={inputRef}
                style={styles.input}
                value={query}
                onChangeText={setQuery}
                placeholder={t('search:placeholder')}
                placeholderTextColor="#9ca3af"
                returnKeyType="search"
              />
            </View>
            <Pressable onPress={handleClose} style={styles.closeButton} hitSlop={8}>
              <X size={20} color="#9ca3af" />
            </Pressable>
          </View>

          {/* Tag filter */}
          <SearchTagFilter
            tags={allTags}
            selectedTags={selectedTags}
            onToggleTag={toggleTag}
            onClearTags={clearTags}
          />

          {/* Searching indicator */}
          {isSearching && (
            <View style={styles.searchingBadge}>
              <Text style={styles.searchingText}>{t('search:searching')}</Text>
            </View>
          )}

          {/* Content area — fixed flex container, no height jump */}
          <View style={styles.contentArea}>
            {hasQuery && hasResults ? (
              <FlatList
                data={listItems}
                renderItem={renderItem}
                keyExtractor={(item, i) =>
                  item.type === 'result' ? item.data.id : `${item.type}-${i}`
                }
                keyboardShouldPersistTaps="handled"
              />
            ) : hasQuery && !hasResults && !isSearching ? (
              <View style={styles.emptyState}>
                <View style={styles.emptyIconCircle}>
                  <Search size={32} color="#d1d5db" />
                </View>
                <Text style={styles.emptyTitle}>{t('search:noResults')}</Text>
                <Text style={styles.emptySubtitle}>{t('search:tryOther')}</Text>
              </View>
            ) : !hasQuery && history.length > 0 ? (
              <View style={styles.historyContainer}>
                <View style={styles.historyHeader}>
                  <Text style={styles.historyTitle}>{t('search:history')}</Text>
                  <Pressable onPress={clearHistory} style={styles.historyClear} hitSlop={8}>
                    <Trash2 size={12} color="#9ca3af" />
                    <Text style={styles.historyClearText}>{t('search:clear')}</Text>
                  </Pressable>
                </View>
                {history.map((item) => (
                  <Pressable
                    key={item}
                    style={styles.historyItem}
                    onPress={() => handleHistoryPress(item)}
                  >
                    <Clock size={16} color="#9ca3af" />
                    <Text style={styles.historyItemText}>{item}</Text>
                  </Pressable>
                ))}
              </View>
            ) : !hasQuery ? (
              <View style={styles.emptyState}>
                <View style={styles.emptyIconCircle}>
                  <Search size={32} color="#d1d5db" />
                </View>
                <Text style={styles.emptyTitle}>{t('search:searchNotes')}</Text>
              </View>
            ) : null}
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  panel: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: PANEL_HEIGHT,
    overflow: 'hidden',
  },
  header: {
    backgroundColor: '#f9fafb',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  inputContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  searchIcon: {
    position: 'absolute',
    left: 12,
    zIndex: 1,
  },
  input: {
    width: '100%',
    height: 44,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingLeft: 40,
    paddingRight: 16,
    fontSize: 15,
    color: '#111827',
  },
  closeButton: {
    padding: 8,
  },
  contentArea: {
    flex: 1,
  },
  searchingBadge: {
    alignSelf: 'center',
    backgroundColor: '#111827',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    marginTop: 12,
    position: 'absolute',
    top: 80,
    zIndex: 10,
  },
  searchingText: {
    color: '#ffffff',
    fontSize: 12,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f9fafb',
  },
  categoryTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  categoryCount: {
    fontSize: 12,
    color: '#9ca3af',
  },
  statusHeader: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  statusHeaderText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#9ca3af',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 64,
    paddingHorizontal: 16,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#9ca3af',
  },
  historyContainer: {
    paddingVertical: 8,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  historyTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
  },
  historyClear: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  historyClearText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  historyItemText: {
    fontSize: 14,
    color: '#374151',
  },
});
