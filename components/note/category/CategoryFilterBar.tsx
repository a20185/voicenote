import React from 'react';
import { View, ScrollView, Pressable, StyleSheet } from 'react-native';
import { Text } from 'tamagui';
import { useTranslation } from 'react-i18next';
import type { Category } from '@/db';
import type { CategoryFilter } from '@/types/category';

interface CategoryFilterBarProps {
  categories: Category[];
  filter: CategoryFilter;
  onFilterChange: (f: CategoryFilter) => void;
  uncategorizedCount: number;
}

export const CategoryFilterBar = React.memo(function CategoryFilterBar({
  categories,
  filter,
  onFilterChange,
  uncategorizedCount,
}: CategoryFilterBarProps) {
  const { t } = useTranslation('category');

  const isAllSelected = filter.type === 'all';

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* All button - always first */}
        <Pressable
          style={[styles.pill, isAllSelected ? styles.pillSelected : styles.pillUnselected]}
          onPress={() => onFilterChange({ type: 'all' })}
        >
          <Text
            fontSize={12}
            fontWeight="500"
            color={isAllSelected ? 'white' : '#52525b'}
          >
            {t('all')}
          </Text>
        </Pressable>

        {/* Category pills */}
        {categories.map((cat) => {
          const isSelected = filter.type === 'category' && filter.categoryId === cat.id;
          return (
            <Pressable
              key={cat.id}
              style={[
                styles.pill,
                isSelected
                  ? styles.pillSelected
                  : [styles.pillUnselected, cat.color ? { borderWidth: 1, borderColor: cat.color } : undefined],
              ]}
              onPress={() => onFilterChange({ type: 'category', categoryId: cat.id })}
            >
              <Text
                fontSize={12}
                fontWeight="500"
                color={isSelected ? 'white' : '#52525b'}
              >
                {cat.name}
              </Text>
            </Pressable>
          );
        })}

        {/* Uncategorized - last, only if count > 0 */}
        {uncategorizedCount > 0 && (
          <Pressable
            style={[
              styles.pill,
              filter.type === 'uncategorized' ? styles.pillSelected : styles.pillUnselected,
            ]}
            onPress={() => onFilterChange({ type: 'uncategorized' })}
          >
            <Text
              fontSize={12}
              fontWeight="500"
              color={filter.type === 'uncategorized' ? 'white' : '#52525b'}
            >
              {t('uncategorized')}
              <Text fontSize={10} opacity={0.7}>
                {' '}({uncategorizedCount})
              </Text>
            </Text>
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#f3f4f6',
  },
  scrollContent: {
    gap: 8,
  },
  pill: {
    borderRadius: 9999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    minHeight: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pillSelected: {
    backgroundColor: '#18181b',
  },
  pillUnselected: {
    backgroundColor: '#f3f4f6',
  },
});
