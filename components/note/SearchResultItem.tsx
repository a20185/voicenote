import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { SearchResult } from '@/types/search';

interface SearchResultItemProps {
  result: SearchResult;
  query: string;
  onPress: () => void;
}

function HighlightedText({ text, query }: { text: string; query: string }) {
  if (!query.trim() || !text) {
    return <Text style={styles.contentText} numberOfLines={1}>{text}</Text>;
  }

  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'));

  return (
    <Text style={styles.contentText} numberOfLines={1}>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <Text key={i} style={styles.highlight}>{part}</Text>
        ) : (
          <Text key={i}>{part}</Text>
        )
      )}
    </Text>
  );
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  const h = d.getHours().toString().padStart(2, '0');
  const m = d.getMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
}


export function SearchResultItem({ result, query, onPress }: SearchResultItemProps) {
  const { t } = useTranslation('note');

  const STATUS_LABELS: Record<string, string> = {
    archived: t('note:archived'),
    snoozed: t('note:snoozed'),
  };

  const statusLabel = STATUS_LABELS[result.status];
  const displayTags = result.tags.slice(0, 3);
  const extraCount = result.tags.length - 3;

  return (
    <Pressable
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
      onPress={onPress}
    >
      {/* Top row: time + status */}
      <View style={styles.topRow}>
        <Text style={styles.timeText}>{formatTime(result.createdAt)}</Text>
        {statusLabel && (
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>{statusLabel}</Text>
          </View>
        )}
      </View>

      {/* Content snippet with highlight */}
      <HighlightedText text={result.contentSnippet || result.title} query={query} />

      {/* Tags row */}
      {result.tags.length > 0 && (
        <View style={styles.tagsRow}>
          {displayTags.map((tag) => (
            <View key={tag} style={styles.tagPill}>
              <Text style={styles.tagPillText}>{tag}</Text>
            </View>
          ))}
          {extraCount > 0 && (
            <Text style={styles.tagCount}>+{extraCount}</Text>
          )}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  pressed: {
    backgroundColor: '#f9fafb',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  timeText: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: '#9ca3af',
  },
  statusBadge: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    color: '#9ca3af',
  },
  contentText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 22,
    marginBottom: 6,
  },
  highlight: {
    backgroundColor: '#fef3c7',
    color: '#78350f',
    borderRadius: 4,
    paddingHorizontal: 2,
  },
  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  tagPill: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  tagPillText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#1d4ed8',
  },
  tagCount: {
    fontSize: 10,
    color: '#9ca3af',
  },
});
