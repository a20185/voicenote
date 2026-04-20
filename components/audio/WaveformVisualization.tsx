import { styled, YStack, XStack } from 'tamagui';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { useEffect, useMemo } from 'react';
import { useColorScheme } from 'react-native';

const AnimatedView = Animated.createAnimatedComponent(styled(YStack, {}));

const Bar = styled(AnimatedView, {
  name: 'WaveformBar',
  width: 3,
  borderRadius: 4,
  backgroundColor: '$text',
});

export interface WaveformVisualizationProps {
  isAnimating?: boolean;
  audioLevels?: number[];
  barCount?: number;
  minHeight?: number;
  maxHeight?: number;
  color?: string;
}

export function WaveformVisualization({
  isAnimating = false,
  audioLevels,
  barCount = 40,
  minHeight = 4,
  maxHeight = 60,
  color,
}: WaveformVisualizationProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const barColor = color || (isDark ? '#ffffff' : '#0a0a0a');

  // Create animated values for each bar
  const barHeights = useMemo(() => {
    return Array.from({ length: barCount }, () => useSharedValue(minHeight));
  }, [barCount]);

  // Animate bars when recording
  useEffect(() => {
    if (isAnimating) {
      // Start random animations for each bar
      barHeights.forEach((height, index) => {
        // Stagger the start of each bar's animation
        const delay = index * 20;

        height.value = withDelay(
          delay,
          withRepeat(
            withSequence(
              withTiming(Math.random() * (maxHeight - minHeight) + minHeight, {
                duration: 150 + Math.random() * 100,
                easing: Easing.inOut(Easing.quad),
              }),
              withTiming(Math.random() * (maxHeight - minHeight) + minHeight, {
                duration: 150 + Math.random() * 100,
                easing: Easing.inOut(Easing.quad),
              })
            ),
            -1, // Infinite
            true // Reverse
          )
        );
      });
    } else {
      // Reset all bars to minimum height
      barHeights.forEach((height) => {
        height.value = withTiming(minHeight, { duration: 300 });
      });
    }
  }, [isAnimating, barHeights]);

  // Use provided audio levels if available
  useEffect(() => {
    if (audioLevels && audioLevels.length > 0 && !isAnimating) {
      audioLevels.forEach((level, index) => {
        if (barHeights[index]) {
          const height = minHeight + level * (maxHeight - minHeight);
          barHeights[index].value = withTiming(height, { duration: 100 });
        }
      });
    }
  }, [audioLevels, isAnimating]);

  return (
    <XStack
      alignItems="center"
      justifyContent="center"
      gap={3}
      height={maxHeight + 10}
    >
      {barHeights.map((height, index) => {
        const animatedStyle = useAnimatedStyle(() => ({
          height: height.value,
        }));

        return (
          <Bar
            key={index}
            style={[
              animatedStyle,
              { backgroundColor: barColor },
            ]}
          />
        );
      })}
    </XStack>
  );
}
