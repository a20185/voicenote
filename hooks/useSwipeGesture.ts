import { useCallback } from 'react';
import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import type { SharedValue } from 'react-native-reanimated';
import type { GestureType } from 'react-native-gesture-handler';

export type DragZone = 'neutral' | 'cancel' | 'save';

interface SwipeGestureConfig {
  trackWidth: number;
  feedbackThreshold?: number;
  commitThreshold?: number;
  velocityThreshold?: number;
  onCancel: () => void;
  onSave: () => void;
}

interface UseSwipeGestureResult {
  dragX: SharedValue<number>;
  progress: SharedValue<number>;
  isCommitted: SharedValue<boolean>;
  gesture: GestureType;
  buttonAnimatedStyle: ReturnType<typeof useAnimatedStyle>;
}

function clamp(value: number, min: number, max: number): number {
  'worklet';
  return Math.min(Math.max(value, min), max);
}

export function useSwipeGesture(config: SwipeGestureConfig): UseSwipeGestureResult {
  const {
    trackWidth,
    feedbackThreshold = 0.5,
    commitThreshold = 0.85,
    velocityThreshold = 800,
    onCancel,
    onSave,
  } = config;

  const dragX = useSharedValue(0);
  const progress = useSharedValue(0);
  const isCommitted = useSharedValue(false);
  const hasTriggeredFeedback = useSharedValue(false);

  const maxDrag = Math.max((trackWidth - 80) / 2, 60);

  const triggerLightHaptic = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const triggerSuccessHaptic = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  const triggerWarningHaptic = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  }, []);

  const gesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .onUpdate((e) => {
      if (isCommitted.value) return;

      dragX.value = clamp(e.translationX, -maxDrag, maxDrag);
      progress.value = dragX.value / maxDrag;

      const absProgress = Math.abs(progress.value);

      // Haptic feedback when crossing feedback threshold
      if (absProgress >= feedbackThreshold && !hasTriggeredFeedback.value) {
        hasTriggeredFeedback.value = true;
        runOnJS(triggerLightHaptic)();
      } else if (absProgress < feedbackThreshold - 0.05) {
        hasTriggeredFeedback.value = false;
      }
    })
    .onEnd((e) => {
      if (isCommitted.value) return;

      const velocity = e.velocityX;

      // Check commit: position past threshold OR velocity + position combo
      if (progress.value < -commitThreshold) {
        // Cancel
        isCommitted.value = true;
        runOnJS(triggerWarningHaptic)();
        dragX.value = withTiming(-maxDrag, { duration: 150 });
        progress.value = withTiming(-1, { duration: 150 });
        runOnJS(onCancel)();
      } else if (
        progress.value > commitThreshold ||
        (velocity > velocityThreshold && progress.value > 0.4)
      ) {
        // Save
        isCommitted.value = true;
        runOnJS(triggerSuccessHaptic)();
        dragX.value = withTiming(maxDrag, { duration: 150 });
        progress.value = withTiming(1, { duration: 150 });
        runOnJS(onSave)();
      } else {
        // Spring back to center
        dragX.value = withSpring(0, { damping: 20, stiffness: 300, mass: 0.8 });
        progress.value = withSpring(0, { damping: 20, stiffness: 300, mass: 0.8 });
        hasTriggeredFeedback.value = false;
      }
    });

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: dragX.value }],
  }));

  return { dragX, progress, isCommitted, gesture, buttonAnimatedStyle };
}
