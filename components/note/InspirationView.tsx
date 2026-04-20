import React from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { Text } from 'tamagui';
import { Sparkles } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import type { Inspiration } from '@/db';
import { useInspirations } from '@/hooks/useInspirations';
import { InspirationCard } from './InspirationCard';

interface InspirationViewProps {
  onInspirationPress: (inspiration: Inspiration) => void;
}

function EmptyState() {
  const { t } = useTranslation('inspiration');

  return (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIcon}>
        <Sparkles size={36} color="#a855f7" />
      </View>
      <Text fontSize={17} fontWeight="600" color="#111827" marginBottom={8} textAlign="center">
        {t('inspiration:emptyTitle')}
      </Text>
      <Text fontSize={14} color="#9ca3af" textAlign="center" lineHeight={22}>
        {t('inspiration:emptyHint')}
      </Text>
    </View>
  );
}

export function InspirationView({ onInspirationPress }: InspirationViewProps) {
  const { data: inspirations = [] } = useInspirations();

  if (inspirations.length === 0) {
    return <EmptyState />;
  }

  return (
    <FlatList
      data={inspirations}
      numColumns={2}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={styles.grid}
      columnWrapperStyle={styles.row}
      renderItem={({ item }) => (
        <InspirationCard inspiration={item} onPress={onInspirationPress} />
      )}
    />
  );
}

const styles = StyleSheet.create({
  grid: {
    padding: 12,
  },
  row: {
    gap: 12,
    marginBottom: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#faf5ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
});
