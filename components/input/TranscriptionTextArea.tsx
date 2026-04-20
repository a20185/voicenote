import { useRef, useEffect } from 'react';
import { ScrollView, TextInput, StyleSheet } from 'react-native';
import { XStack, YStack, Text, styled, Theme } from 'tamagui';
import { Loader2 } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import Animated, {
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

interface TranscriptionTextAreaProps {
  text: string;
  isEditing: boolean;
  isTranscribing: boolean;
  isRecording: boolean;
  isOptimizing?: boolean;
  placeholder?: string;
  onTextChange: (text: string) => void;
}

const Container = styled(ScrollView, {
  minHeight: 96,
  maxHeight: 256,
  backgroundColor: 'rgba(249, 250, 251, 0.5)',
  borderRadius: 16,
  padding: 24,
  name: 'TranscriptionContainer',
});

function BlinkingCursor() {
  const cursorStyle = useAnimatedStyle(() => ({
    opacity: withRepeat(
      withTiming(0.3, { duration: 500, easing: Easing.ease }),
      -1,
      true
    ),
  }));

  return <Animated.View style={[cursorStyles.blink, cursorStyle]} />;
}

function LoadingSpinner() {
  const spinStyle = useAnimatedStyle(() => ({
    transform: [
      {
        rotate: withRepeat(
          withTiming('360deg', { duration: 1000, easing: Easing.linear }),
          -1,
          false
        ),
      },
    ],
  }));

  return (
    <Animated.View style={spinStyle}>
      <Loader2 size={20} color="#9ca3af" />
    </Animated.View>
  );
}

export function TranscriptionTextArea({
  text,
  isEditing,
  isTranscribing,
  isRecording,
  isOptimizing,
  placeholder,
  onTextChange,
}: TranscriptionTextAreaProps) {
  const { t } = useTranslation('recording');
  const placeholderText = placeholder || t('tapToRecord');
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    // Auto-scroll to bottom when text updates
    if (scrollViewRef.current && text) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [text]);

  return (
    <Theme name="light">
      <Container ref={scrollViewRef} showsVerticalScrollIndicator={false}>
        {/* Optimizing indicator */}
        {isOptimizing && (
          <XStack position="absolute" top={8} right={8} alignItems="center" gap={4} zIndex={1}>
            <LoadingSpinner />
            <Text fontSize={12} color="#6b7280">{t('optimizing')}</Text>
          </XStack>
        )}

        {isEditing ? (
          <TextInput
            value={text}
            onChangeText={onTextChange}
            placeholder={t('editTranscription')}
            placeholderTextColor="#d1d5db"
            style={{
              fontSize: 20,
              fontWeight: '500',
              color: '#1f2937',
              backgroundColor: 'transparent',
              borderWidth: 0,
              textAlign: 'justify',
              textAlignVertical: 'top',
              minHeight: 96,
            }}
            multiline
            numberOfLines={6}
          />
        ) : (
          <YStack>
            {isTranscribing && !text ? (
              <YStack flexDirection="row" alignItems="center" gap={8}>
                <LoadingSpinner />
                <Text color="#9ca3af" fontSize={20} fontWeight="500">
                  {t('transcribing')}
                </Text>
              </YStack>
            ) : (
              <YStack flexDirection="row" alignItems="flex-start">
                <Text
                  fontSize={20}
                  fontWeight="500"
                  lineHeight={40}
                  color={text ? '#1f2937' : '#d1d5db'}
                  flex={1}
                  textAlign="justify"
                >
                  {text || placeholderText}
                </Text>
                {isRecording && <BlinkingCursor />}
              </YStack>
            )}
          </YStack>
        )}
      </Container>
    </Theme>
  );
}

const cursorStyles = StyleSheet.create({
  blink: {
    width: 8,
    height: 20,
    backgroundColor: '#ef4444',
    borderRadius: 4,
    marginLeft: 4,
  },
});
