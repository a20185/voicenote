import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { XStack, YStack, Text } from 'tamagui';
import { RefreshCw, Trash2 } from 'lucide-react-native';
import { useColorScheme } from 'react-native';
import Animated, { useAnimatedStyle, withRepeat, withTiming, useSharedValue, cancelAnimation } from 'react-native-reanimated';
import type { Skill } from '@/types/settings';

interface SkillItemRowProps {
  skill: Skill;
  onReload: (id: string) => void;
  onRemove: (id: string) => void;
}

const STATUS_COLORS = {
  loaded: '#22c55e',
  loading: '#f59e0b',
  error: '#ef4444',
};

export const SkillItemRow = React.memo(function SkillItemRow({
  skill,
  onReload,
  onRemove,
}: SkillItemRowProps) {
  const isDark = useColorScheme() === 'dark';
  const spinValue = useSharedValue(0);

  React.useEffect(() => {
    if (skill.status === 'loading') {
      spinValue.value = withRepeat(withTiming(360, { duration: 1000 }), -1, false);
    } else {
      cancelAnimation(spinValue);
      spinValue.value = 0;
    }
  }, [skill.status, spinValue]);

  const spinStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spinValue.value}deg` }],
  }));

  return (
    <XStack
      alignItems="center"
      padding={12}
      borderRadius={12}
      backgroundColor={isDark ? '#1f2937' : '#f9fafb'}
      gap={10}
    >
      <Animated.View style={skill.status === 'loading' ? spinStyle : undefined}>
        <RefreshCw size={16} color={STATUS_COLORS[skill.status]} />
      </Animated.View>
      <YStack flex={1} gap={2}>
        <Text fontSize={14} fontWeight="600" color={isDark ? '#e5e7eb' : '#111827'}>
          {skill.name}
        </Text>
        <Text fontSize={12} color="#9ca3af" numberOfLines={1}>
          {skill.url}
        </Text>
        {skill.status === 'error' && skill.error && (
          <Text fontSize={11} color="#ef4444">{skill.error}</Text>
        )}
      </YStack>
      <XStack gap={8}>
        <Pressable onPress={() => onReload(skill.id)} hitSlop={8}>
          <RefreshCw size={16} color={isDark ? '#9ca3af' : '#6b7280'} />
        </Pressable>
        <Pressable onPress={() => onRemove(skill.id)} hitSlop={8}>
          <Trash2 size={16} color="#ef4444" />
        </Pressable>
      </XStack>
    </XStack>
  );
});
