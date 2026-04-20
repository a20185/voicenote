import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Text } from 'tamagui';
import { useTranslation } from 'react-i18next';
import type { Inspiration } from '@/db';
import type { AITag, EnhancedAIAnalysisResult } from '@/types/ai';

interface InspirationCardProps {
  inspiration: Inspiration;
  onPress: (inspiration: Inspiration) => void;
}

function parseJSON<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

function formatDate(date: Date | string | number, t: (key: string, opts?: any) => string): string {
  const d = date instanceof Date ? date : new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return t('dates:today');
  if (days === 1) return t('dates:yesterday');
  if (days < 7) return t('dates:daysAgo', { count: days });
  return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
}

export function InspirationCard({ inspiration, onPress }: InspirationCardProps) {
  const { t } = useTranslation(['inspiration', 'note', 'dates']);
  const analysisData = parseJSON<EnhancedAIAnalysisResult | null>(inspiration.analysisData, null);
  const tags: AITag[] = analysisData?.tags ?? [];
  const sourceNoteIds: number[] = parseJSON<number[]>(inspiration.sourceNoteIds, []);

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={() => onPress(inspiration)}
    >
      <Text fontSize={15} fontWeight="600" color="#111827" numberOfLines={2} style={styles.title}>
        {inspiration.title}
      </Text>
      <Text fontSize={13} color="#6b7280" lineHeight={19} numberOfLines={3} style={styles.summary}>
        {inspiration.summary}
      </Text>
      {tags.length > 0 && (
        <View style={styles.tagsContainer}>
          {tags.slice(0, 3).map((tag, i) => (
            <View key={i} style={styles.tagPill}>
              <Text fontSize={10} fontWeight="600" color="#7c3aed">{tag.name}</Text>
            </View>
          ))}
        </View>
      )}
      <View style={styles.footer}>
        <Text fontSize={11} color="#9ca3af">{t('note:noteCount', { count: sourceNoteIds.length })}</Text>
        <Text fontSize={11} color="#d1d5db">{formatDate(inspiration.createdAt, t)}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardPressed: {
    opacity: 0.9,
  },
  title: {
    marginBottom: 6,
  },
  summary: {
    marginBottom: 10,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 10,
  },
  tagPill: {
    backgroundColor: '#faf5ff',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
