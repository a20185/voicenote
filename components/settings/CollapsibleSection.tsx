import React, { useState } from 'react';
import { Pressable, StyleSheet, LayoutAnimation } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { XStack, YStack, Text } from 'tamagui';
import { ChevronDown } from 'lucide-react-native';
import { useColorScheme } from 'react-native';

interface CollapsibleSectionProps {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
}

export const CollapsibleSection = React.memo(function CollapsibleSection({
  icon,
  title,
  children,
  defaultExpanded = false,
}: CollapsibleSectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [pressed, setPressed] = useState(false);
  const rotation = useSharedValue(defaultExpanded ? 180 : 0);
  const isDark = useColorScheme() === 'dark';

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const next = !expanded;
    setExpanded(next);
    rotation.value = withTiming(next ? 180 : 0, { duration: 200 });
  };

  return (
    <YStack>
      <Pressable
        onPress={toggle}
        onPressIn={() => setPressed(true)}
        onPressOut={() => setPressed(false)}
        style={[
          styles.header,
          pressed && { backgroundColor: isDark ? '#1f2937' : '#f9fafb' },
        ]}
      >
        <XStack alignItems="center" flex={1} gap={10}>
          {icon}
          <Text fontSize={14} fontWeight="600" color={isDark ? '#d1d5db' : '#374151'}>
            {title}
          </Text>
        </XStack>
        <Animated.View style={chevronStyle}>
          <ChevronDown size={16} color={isDark ? '#9ca3af' : '#6b7280'} />
        </Animated.View>
      </Pressable>
      {expanded && (
        <YStack paddingHorizontal={16} paddingBottom={12}>
          {children}
        </YStack>
      )}
    </YStack>
  );
});

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#f3f4f6',
  },
});
