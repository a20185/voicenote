import { styled, YStack, Text } from 'tamagui';
import { Pressable, useColorScheme } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import * as Haptics from 'expo-haptics';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const ButtonContainer = styled(YStack, {
  name: 'RecordButtonContainer',
  width: 80,
  height: 80,
  borderRadius: 40,
  alignItems: 'center',
  justifyContent: 'center',
  borderWidth: 4,
  borderColor: 'white',
});

const PulseRing = styled(Animated.View, {
  name: 'RecordButtonPulseRing',
  position: 'absolute',
  width: 80,
  height: 80,
  borderRadius: 40,
  borderWidth: 2,
});

const InnerShape = styled(Animated.View, {
  name: 'RecordButtonInnerShape',
  width: 24,
  height: 24,
  borderRadius: 6,
});

export interface RecordButtonProps {
  isRecording: boolean;
  onPress: () => void;
  disabled?: boolean;
}

export function RecordButton({ isRecording, onPress, disabled }: RecordButtonProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Animation values
  const scale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0);
  const pulseScale = useSharedValue(1);
  const innerCornerRadius = useSharedValue(24); // Full circle when not recording

  // Pulse animation for recording state
  useEffect(() => {
    if (isRecording) {
      pulseOpacity.value = withRepeat(
        withSequence(
          withTiming(0.6, { duration: 1000 }),
          withTiming(0, { duration: 1000 })
        ),
        -1, // Infinite
        true
      );
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.3, { duration: 1000 }),
          withTiming(1, { duration: 1000 })
        ),
        -1,
        true
      );
      innerCornerRadius.value = withSpring(6); // Square when recording
    } else {
      pulseOpacity.value = withTiming(0);
      pulseScale.value = withTiming(1);
      innerCornerRadius.value = withSpring(24); // Circle when idle
    }
  }, [isRecording]);

  const handlePress = async () => {
    if (disabled) return;

    // Haptic feedback
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Scale animation
    scale.value = withSequence(
      withSpring(0.95, { damping: 15, stiffness: 300 }),
      withSpring(1, { damping: 15, stiffness: 300 })
    );

    onPress();
  };

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    backgroundColor: isRecording ? '#ef4444' : isDark ? '#171717' : '#0a0a0a',
  }));

  const pulseAnimatedStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
    transform: [{ scale: pulseScale.value }],
    borderColor: '#ef4444',
  }));

  const innerAnimatedStyle = useAnimatedStyle(() => ({
    borderRadius: innerCornerRadius.value,
    backgroundColor: 'white',
  }));

  return (
    <YStack alignItems="center" justifyContent="center">
      {/* Pulse ring */}
      <PulseRing style={pulseAnimatedStyle} />

      {/* Main button */}
      <AnimatedPressable onPress={handlePress} disabled={disabled}>
        <ButtonContainer style={buttonAnimatedStyle}>
          <InnerShape style={innerAnimatedStyle} />
        </ButtonContainer>
      </AnimatedPressable>
    </YStack>
  );
}
