import { Pressable, StyleSheet } from 'react-native';
import { XStack, Text } from 'tamagui';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

interface TextModeSwitcherProps {
  mode: 'raw' | 'optimized';
  hasOptimized: boolean;
  onChange: (mode: 'raw' | 'optimized') => void;
}

const springConfig = { damping: 25, stiffness: 300 };

export function TextModeSwitcher({ mode, hasOptimized, onChange }: TextModeSwitcherProps) {
  const { t } = useTranslation('recording');

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: withSpring(mode === 'optimized' ? 80 : 0, springConfig) }],
  }));

  return (
    <XStack
      backgroundColor="#f4f4f5"
      borderRadius={24}
      padding={4}
      width={168}
      alignSelf="center"
    >
      <Animated.View style={[styles.indicator, indicatorStyle]} />

      <Pressable
        style={[styles.button, mode === 'raw' && styles.activeButton]}
        onPress={() => onChange('raw')}
      >
        <Text
          fontSize={14}
          fontWeight="600"
          color={mode === 'raw' ? '#ffffff' : '#6b7280'}
          textAlign="center"
        >
          {t('raw')}
        </Text>
      </Pressable>

      <Pressable
        style={[styles.button, !hasOptimized && styles.disabledButton]}
        onPress={() => hasOptimized && onChange('optimized')}
        disabled={!hasOptimized}
      >
        <Text
          fontSize={14}
          fontWeight="600"
          color={mode === 'optimized' ? '#ffffff' : hasOptimized ? '#6b7280' : '#d1d5db'}
          textAlign="center"
        >
          {t('optimized')}
        </Text>
      </Pressable>
    </XStack>
  );
}

const styles = StyleSheet.create({
  indicator: {
    position: 'absolute',
    width: 80,
    height: 32,
    backgroundColor: '#111827',
    borderRadius: 20,
    left: 4,
  },
  button: {
    flex: 1,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  activeButton: {},
  disabledButton: {
    opacity: 0.5,
  },
});
