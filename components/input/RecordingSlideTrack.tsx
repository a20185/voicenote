import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { Trash2, ArrowUp, ChevronLeft, ChevronRight } from 'lucide-react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withRepeat,
  withTiming,
  withSequence,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';

interface RecordingSlideTrackProps {
  progress: SharedValue<number>;
  isCommitted: SharedValue<boolean>;
  trackWidth: number;
}

const springConfig = { damping: 12, stiffness: 200 };

export function RecordingSlideTrack({ progress, isCommitted, trackWidth }: RecordingSlideTrackProps) {
  const halfWidth = trackWidth / 2;
  const chevronPulse = useSharedValue(0.2);

  // Chevron pulse animation
  useEffect(() => {
    chevronPulse.value = withRepeat(
      withSequence(
        withTiming(0.6, { duration: 800 }),
        withTiming(0.2, { duration: 800 }),
      ),
      -1,
      false,
    );
  }, []);

  // Cancel fill (left side, grows from left when dragging left)
  const cancelFillStyle = useAnimatedStyle(() => {
    const width = interpolate(
      progress.value,
      [-1, 0],
      [halfWidth, 0],
      Extrapolation.CLAMP,
    );
    return {
      width,
      opacity: interpolate(progress.value, [-0.1, -0.3], [0, 1], Extrapolation.CLAMP),
    };
  });

  // Save fill (right side, grows from right when dragging right)
  const saveFillStyle = useAnimatedStyle(() => {
    const width = interpolate(
      progress.value,
      [0, 1],
      [0, halfWidth],
      Extrapolation.CLAMP,
    );
    return {
      width,
      opacity: interpolate(progress.value, [0.1, 0.3], [0, 1], Extrapolation.CLAMP),
    };
  });

  // Cancel icon style
  const cancelIconStyle = useAnimatedStyle(() => {
    const scale = withSpring(
      interpolate(progress.value, [-0.85, -0.5, 0], [1.2, 1.1, 1], Extrapolation.CLAMP),
      springConfig,
    );
    return {
      transform: [{ scale }],
      opacity: interpolate(progress.value, [-0.3, -0.1, 0], [1, 0.5, 0.4], Extrapolation.CLAMP),
    };
  });

  // Save icon style
  const saveIconStyle = useAnimatedStyle(() => {
    const scale = withSpring(
      interpolate(progress.value, [0, 0.5, 0.85], [1, 1.1, 1.2], Extrapolation.CLAMP),
      springConfig,
    );
    return {
      transform: [{ scale }],
      opacity: interpolate(progress.value, [0, 0.1, 0.3], [0.4, 0.5, 1], Extrapolation.CLAMP),
    };
  });

  // Left chevrons (hint to swipe left for cancel)
  const leftChevronStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [-0.3, 0], [0, chevronPulse.value], Extrapolation.CLAMP),
  }));

  // Right chevrons (hint to swipe right for save)
  const rightChevronStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.3], [chevronPulse.value, 0], Extrapolation.CLAMP),
  }));

  // Track fade on commit
  const trackOpacityStyle = useAnimatedStyle(() => ({
    opacity: isCommitted.value ? withTiming(0, { duration: 200 }) : 1,
  }));

  return (
    <Animated.View style={[trackStyles.track, trackOpacityStyle]}>
      {/* Cancel fill */}
      <Animated.View style={[trackStyles.cancelFill, cancelFillStyle]} />
      {/* Save fill */}
      <Animated.View style={[trackStyles.saveFill, saveFillStyle]} />

      {/* Cancel icon */}
      <Animated.View style={[trackStyles.iconWrapper, cancelIconStyle]}>
        <Trash2 size={24} color="#d1d5db" />
      </Animated.View>

      {/* Left chevron hints */}
      <Animated.View style={[trackStyles.chevronGroup, trackStyles.leftChevrons, leftChevronStyle]}>
        <ChevronLeft size={14} color="#9ca3af" />
        <ChevronLeft size={14} color="#9ca3af" />
        <ChevronLeft size={14} color="#9ca3af" />
      </Animated.View>

      {/* Right chevron hints */}
      <Animated.View style={[trackStyles.chevronGroup, trackStyles.rightChevrons, rightChevronStyle]}>
        <ChevronRight size={14} color="#9ca3af" />
        <ChevronRight size={14} color="#9ca3af" />
        <ChevronRight size={14} color="#9ca3af" />
      </Animated.View>

      {/* Save icon */}
      <Animated.View style={[trackStyles.iconWrapper, saveIconStyle]}>
        <ArrowUp size={24} color="#d1d5db" />
      </Animated.View>
    </Animated.View>
  );
}

const trackStyles = StyleSheet.create({
  track: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f4f4f5',
    borderWidth: 1,
    borderColor: '#e4e4e7',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    overflow: 'hidden',
  },
  cancelFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#ef4444',
    borderTopLeftRadius: 40,
    borderBottomLeftRadius: 40,
  },
  saveFill: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#22c55e',
    borderTopRightRadius: 40,
    borderBottomRightRadius: 40,
  },
  iconWrapper: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  chevronGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    position: 'absolute',
    zIndex: 5,
  },
  leftChevrons: {
    left: 52,
  },
  rightChevrons: {
    right: 52,
  },
});
