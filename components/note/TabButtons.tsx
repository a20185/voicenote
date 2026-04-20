import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Text } from 'tamagui';
import { useTranslation } from 'react-i18next';

interface TabButtonsProps {
  activeTab: 'active' | 'archived' | 'categorized';
  onTabChange: (tab: 'active' | 'archived' | 'categorized') => void;
}

const TAB_KEYS: TabButtonsProps['activeTab'][] = ['active', 'archived', 'categorized'];

export function TabButtons({ activeTab, onTabChange }: TabButtonsProps) {
  const { t } = useTranslation('note');
  const TAB_LABELS: Record<string, string> = {
    active: t('tabRecent'),
    archived: t('tabArchived'),
    categorized: t('tabCategorized'),
  };

  return (
    <View style={styles.container}>
      {TAB_KEYS.map((key) => {
        const isActive = activeTab === key;
        return (
          <Pressable
            key={key}
            style={[
              styles.pill,
              isActive ? styles.pillActive : styles.pillInactive,
            ]}
            onPress={() => onTabChange(key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
          >
            <Text
              fontSize={12}
              color={isActive ? 'white' : '#6b7280'}
              fontWeight="500"
            >
              {TAB_LABELS[key]}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
  },
  pill: {
    borderRadius: 9999,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  pillActive: {
    backgroundColor: '#18181b',
  },
  pillInactive: {
    backgroundColor: 'transparent',
  },
});

export type TabButtonsPropsType = TabButtonsProps;
