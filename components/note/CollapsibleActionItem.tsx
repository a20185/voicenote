import React, { useState } from 'react';
import { View, Pressable, StyleSheet, LayoutAnimation } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { Text } from 'tamagui';
import { ChevronDown } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import type { AIActionItem } from '@/types/ai';

const PRIORITY_STYLES: Record<string, { bg: string; color: string; labelKey: string }> = {
  high: { bg: '#fef2f2', color: '#dc2626', labelKey: 'ai:priorityHigh' },
  medium: { bg: '#fffbeb', color: '#d97706', labelKey: 'ai:priorityMedium' },
  low: { bg: '#f0fdf4', color: '#16a34a', labelKey: 'ai:priorityLow' },
};

const CATEGORY_STYLES: Record<string, { bg: string; color: string; labelKey: string }> = {
  immediate: { bg: '#eff6ff', color: '#2563eb', labelKey: 'ai:categoryImmediate' },
  short_term: { bg: '#faf5ff', color: '#7c3aed', labelKey: 'ai:categoryShortTerm' },
  long_term: { bg: '#f9fafb', color: '#6b7280', labelKey: 'ai:categoryLongTerm' },
};

interface CollapsibleActionItemProps {
  action: AIActionItem;
  defaultExpanded?: boolean;
}

export const CollapsibleActionItem = React.memo(function CollapsibleActionItem({
  action,
  defaultExpanded = false,
}: CollapsibleActionItemProps) {
  const { t } = useTranslation('ai');
  const [expanded, setExpanded] = useState(defaultExpanded);
  const rotation = useSharedValue(defaultExpanded ? 180 : 0);

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const next = !expanded;
    setExpanded(next);
    rotation.value = withTiming(next ? 180 : 0, { duration: 200 });
  };

  const priority = PRIORITY_STYLES[action.priority] || PRIORITY_STYLES.medium;
  const category = CATEGORY_STYLES[action.category] || CATEGORY_STYLES.short_term;

  return (
    <Pressable onPress={toggle} style={styles.container}>
      <View style={styles.row}>
        <View style={styles.dot} />
        <Text
          fontSize={14}
          fontWeight="600"
          color="#111827"
          flex={1}
          numberOfLines={expanded ? undefined : 1}
        >
          {action.title}
        </Text>
        <View style={[styles.badge, { backgroundColor: priority.bg }]}>
          <Text fontSize={10} color={priority.color as any}>{t(priority.labelKey)}</Text>
        </View>
        <Animated.View style={chevronStyle}>
          <ChevronDown size={14} color="#9ca3af" style={{ marginLeft: 4 }} />
        </Animated.View>
      </View>

      {expanded && (
        <View>
          {!!action.description && (
            <Text
              fontSize={13}
              color="#6b7280"
              lineHeight={20}
              marginTop={6}
              marginLeft={16}
            >
              {action.description}
            </Text>
          )}
          <View style={styles.infoRow}>
            <View style={[styles.categoryBadge, { backgroundColor: category.bg }]}>
              <Text fontSize={10} color={category.color as any}>{t(category.labelKey)}</Text>
            </View>
            {!!action.deadline && (
              <Text fontSize={11} color="#9ca3af">{action.deadline}</Text>
            )}
          </View>
        </View>
      )}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  container: {
    paddingVertical: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22c55e',
    marginRight: 10,
  },
  badge: {
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
    marginLeft: 16,
  },
  categoryBadge: {
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
});
