import React, { useCallback, useEffect } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Text } from 'tamagui';
import { Camera, Paperclip, SquarePen } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import Animated, {
  Easing,
  useAnimatedStyle,
  withDelay,
  withRepeat,
  withSpring,
  withTiming,
  useSharedValue,
} from 'react-native-reanimated';

export interface BottomNavigationProps {
  onRecord: () => void;
  onCamera: () => void;
  onAttachment: () => void;
  onText: () => void;
  isHidden?: boolean;
}

export function BottomNavigation({
  onRecord,
  onCamera,
  onAttachment,
  onText,
  isHidden = false,
}: BottomNavigationProps) {
  const { t } = useTranslation('nav');
  const scale = useSharedValue(1);
  const redDotOpacity = useSharedValue(1);

  useEffect(() => {
    redDotOpacity.value = withRepeat(
      withTiming(0.5, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: isHidden
          ? withTiming(120, { duration: 200, easing: Easing.in(Easing.cubic) })
          : withDelay(280, withTiming(0, { duration: 300, easing: Easing.out(Easing.cubic) })),
      },
    ],
  }));

  const recordButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const redDotStyle = useAnimatedStyle(() => ({
    opacity: redDotOpacity.value,
  }));

  const handleRecordPressIn = useCallback(() => {
    scale.value = withSpring(0.9, { damping: 15, stiffness: 200 });
  }, []);

  const handleRecordPressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 15, stiffness: 200 });
  }, []);

  const handleRecordPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onRecord();
  }, [onRecord]);

  return (
    <Animated.View style={[styles.outer, containerStyle]}>
      <View style={styles.container}>
        {/* Left: Record button */}
        <Pressable
          onPress={handleRecordPress}
          onPressIn={handleRecordPressIn}
          onPressOut={handleRecordPressOut}
        >
          <Animated.View style={[styles.recordButton, recordButtonStyle]}>
            <Animated.View style={[styles.redDot, redDotStyle]} />
            <Text fontSize={14} fontWeight="600" color="white" letterSpacing={0.5}>
              {t('record')}
            </Text>
          </Animated.View>
        </Pressable>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Right: Action icons */}
        <View style={styles.actions}>
          <Pressable style={styles.actionButton} onPress={onCamera}>
            <Camera size={20} color="#6b7280" />
          </Pressable>
          <Pressable style={styles.actionButton} onPress={onAttachment}>
            <Paperclip size={20} color="#6b7280" />
          </Pressable>
          <Pressable style={styles.actionButton} onPress={onText}>
            <SquarePen size={20} color="#6b7280" />
          </Pressable>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  outer: {
    position: 'absolute',
    bottom: 32,
    alignSelf: 'center',
    zIndex: 1000,
  },
  container: {
    backgroundColor: 'white',
    borderRadius: 9999,
    paddingHorizontal: 6,
    paddingVertical: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f3f4f6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 15,
    elevation: 10,
    gap: 4,
  },
  recordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#18181b',
    borderRadius: 9999,
    paddingLeft: 20,
    paddingRight: 24,
    paddingVertical: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  redDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ef4444',
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 8,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingRight: 4,
  },
  actionButton: {
    padding: 10,
  },
});
