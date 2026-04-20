import React, { useState } from 'react';
import { View, Pressable, StyleSheet, LayoutAnimation } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { Text } from 'tamagui';
import { ChevronDown } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import type { AIKeyInsight } from '@/types/ai';

const INSIGHT_DOT_COLORS: Record<string, string> = {
  pattern: '#a855f7',
  opportunity: '#22c55e',
  issue: '#ef4444',
  trend: '#3b82f6',
};

const INSIGHT_TYPE_BADGE: Record<string, { bg: string; color: string; labelKey: string }> = {
  pattern: { bg: '#faf5ff', color: '#7c3aed', labelKey: 'ai:pattern' },
  opportunity: { bg: '#f0fdf4', color: '#16a34a', labelKey: 'ai:opportunity' },
  issue: { bg: '#fef2f2', color: '#dc2626', labelKey: 'ai:issue' },
  trend: { bg: '#eff6ff', color: '#2563eb', labelKey: 'ai:trend' },
};

interface CollapsibleInsightProps {
  insight: AIKeyInsight;
  defaultExpanded?: boolean;
}

export const CollapsibleInsight = React.memo(function CollapsibleInsight({
  insight,
  defaultExpanded = false,
}: CollapsibleInsightProps) {
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

  const dotColor = INSIGHT_DOT_COLORS[insight.type] || '#a855f7';
  const badge = INSIGHT_TYPE_BADGE[insight.type] || INSIGHT_TYPE_BADGE.pattern;

  return (
    <Pressable onPress={toggle} style={styles.container}>
      <View style={styles.row}>
        <View style={[styles.dot, { backgroundColor: dotColor }]} />
        <Text
          fontSize={14}
          color="#374151"
          flex={1}
          numberOfLines={expanded ? undefined : 1}
        >
          {insight.content}
        </Text>
        <View style={[styles.badge, { backgroundColor: badge.bg }]}>
          <Text fontSize={10} color={badge.color as any}>{t(badge.labelKey)}</Text>
        </View>
        <Animated.View style={chevronStyle}>
          <ChevronDown size={14} color="#9ca3af" style={{ marginLeft: 4 }} />
        </Animated.View>
      </View>

      {expanded && (
        <View>
          {!!insight.evidence && (
            <Text
              fontSize={12}
              color="#9ca3af"
              fontStyle="italic"
              marginTop={6}
              marginLeft={16}
            >
              {insight.evidence}
            </Text>
          )}
          <View style={styles.confidenceRow}>
            <Text fontSize={11} color="#a855f7">
              {Math.round(insight.confidence * 100)}%
            </Text>
            <View style={styles.confidenceBarBg}>
              <View
                style={[
                  styles.confidenceBarFill,
                  { width: `${Math.round(insight.confidence * 100)}%` },
                ]}
              />
            </View>
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
    marginRight: 10,
  },
  badge: {
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },
  confidenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
    marginLeft: 16,
  },
  confidenceBarBg: {
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#f3e8ff',
    flex: 1,
  },
  confidenceBarFill: {
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#a855f7',
  },
});
