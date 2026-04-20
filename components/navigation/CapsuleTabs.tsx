import React, { useCallback } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Text } from 'tamagui';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';

export interface CapsuleTabsProps<T extends string> {
  tabs: { key: T; label: string }[];
  activeKey: T;
  onChange: (key: T) => void;
}

const TIMING_CONFIG = { duration: 250, easing: Easing.out(Easing.cubic) };

export function CapsuleTabs<T extends string>({
  tabs,
  activeKey,
  onChange,
}: CapsuleTabsProps<T>) {
  const activeIndex = tabs.findIndex((t) => t.key === activeKey);
  const translateX = useSharedValue(0);
  const tabWidth = useSharedValue(0);

  const onContainerLayout = useCallback(
    (e: { nativeEvent: { layout: { width: number } } }) => {
      const containerWidth = e.nativeEvent.layout.width - 8; // subtract padding
      const w = containerWidth / tabs.length;
      tabWidth.value = w;
      translateX.value = withTiming(activeIndex * w, TIMING_CONFIG);
    },
    [activeIndex, tabs.length],
  );

  const indicatorStyle = useAnimatedStyle(() => ({
    width: tabWidth.value,
    transform: [{ translateX: translateX.value }],
  }));

  const handlePress = useCallback(
    (key: T, index: number) => {
      translateX.value = withTiming(index * tabWidth.value, TIMING_CONFIG);
      onChange(key);
    },
    [onChange, tabWidth],
  );

  return (
    <View style={styles.container} onLayout={onContainerLayout}>
      {/* Animated active indicator */}
      <Animated.View style={[styles.indicator, indicatorStyle]} />

      {/* Tab buttons */}
      {tabs.map((tab, index) => {
        const isActive = activeKey === tab.key;
        return (
          <Pressable
            key={tab.key}
            style={styles.tab}
            onPress={() => handlePress(tab.key, index)}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
          >
            <Text
              fontSize={12}
              fontWeight="700"
              color={isActive ? '$text' : '$textSecondary'}
            >
              {tab.label}
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
    backgroundColor: '#f4f4f5',
    borderRadius: 9999,
    padding: 4,
    position: 'relative',
    width: 144,
  },
  indicator: {
    position: 'absolute',
    top: 4,
    left: 4,
    bottom: 4,
    backgroundColor: 'white',
    borderRadius: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    zIndex: 1,
  },
});
