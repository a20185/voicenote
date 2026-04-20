import { useEffect, useState } from 'react';
import { View, Pressable, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';

const SCREEN_HEIGHT = Dimensions.get('window').height;

interface OverlayWrapperProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  height?: string | number;
}

export function OverlayWrapper({ visible, onClose, children, height = '60%' }: OverlayWrapperProps) {
  const [mounted, setMounted] = useState(false);
  const translateY = useSharedValue(SCREEN_HEIGHT);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  useEffect(() => {
    if (visible) {
      setMounted(true);
      requestAnimationFrame(() => {
        translateY.value = withTiming(0, { duration: 300, easing: Easing.out(Easing.cubic) });
      });
    } else if (mounted) {
      translateY.value = withTiming(SCREEN_HEIGHT, {
        duration: 250,
        easing: Easing.in(Easing.cubic),
      }, (finished) => {
        if (finished) runOnJS(setMounted)(false);
      });
    }
  }, [visible]);

  if (!mounted) return null;

  return (
    <View style={styles.overlay}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      <Animated.View style={[styles.sheet, { height: height as any }, sheetStyle]}>
        {children}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 50,
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 20,
  },
});
