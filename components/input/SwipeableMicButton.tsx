import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Mic, Loader2 } from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withTiming,
  cancelAnimation,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import type { GestureType } from 'react-native-gesture-handler';

interface SwipeableMicButtonProps {
  isRecording: boolean;
  isTranscribing: boolean;
  buttonAnimatedStyle: ReturnType<typeof useAnimatedStyle>;
  gesture: GestureType;
  onPress: () => void;
}

const springConfig = { damping: 15, stiffness: 300 };

export function SwipeableMicButton({
  isRecording,
  isTranscribing,
  buttonAnimatedStyle,
  gesture,
  onPress,
}: SwipeableMicButtonProps) {
  const scale = useSharedValue(1);
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.6);
  const rotation = useSharedValue(0);

  // Pulse animation during recording
  useEffect(() => {
    if (isRecording) {
      pulseScale.value = withRepeat(
        withTiming(1.3, { duration: 1000, easing: Easing.ease }),
        -1,
        true
      );
      pulseOpacity.value = withRepeat(
        withTiming(0.2, { duration: 1000, easing: Easing.ease }),
        -1,
        true
      );
    } else {
      cancelAnimation(pulseScale);
      cancelAnimation(pulseOpacity);
      pulseScale.value = 1;
      pulseOpacity.value = 0.6;
    }
  }, [isRecording]);

  // Loading spinner rotation
  useEffect(() => {
    if (isTranscribing) {
      rotation.value = withRepeat(
        withTiming(360, { duration: 1000, easing: Easing.linear }),
        -1,
        false
      );
    } else {
      cancelAnimation(rotation);
      rotation.value = 0;
    }
  }, [isTranscribing]);

  const baseButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    backgroundColor: isRecording ? '#ef4444' : '#111827',
    borderColor: isRecording ? '#fecaca' : '#ffffff',
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  const spinnerStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const tapGesture = Gesture.Tap()
    .onBegin(() => {
      scale.value = withSpring(0.95, springConfig);
    })
    .onEnd(() => {
      runOnJS(onPress)();
    })
    .onFinalize(() => {
      scale.value = withSpring(1, springConfig);
    });

  const combinedGesture = Gesture.Simultaneous(gesture, tapGesture);

  return (
    <Animated.View style={[styles.outerContainer, buttonAnimatedStyle]}>
      <GestureDetector gesture={combinedGesture}>
        <Animated.View style={[styles.buttonContainer, baseButtonStyle]}>
          {/* Pulse ring during recording */}
          {isRecording && <Animated.View style={[styles.pulseRing, pulseStyle]} />}

          {/* Icon */}
          {isTranscribing ? (
            <Animated.View style={spinnerStyle}>
              <Loader2 size={32} color="#ffffff" />
            </Animated.View>
          ) : (
            <Mic size={32} color="#ffffff" />
          )}
        </Animated.View>
      </GestureDetector>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    borderWidth: 4,
  },
  pulseRing: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: '#fca5a5',
  },
});
