import { useLocalSearchParams, Stack } from 'expo-router';
import { YStack, Text, ScrollView, XStack, Spinner } from 'tamagui';
import { useNote } from '@/hooks/useNotes';
import { useColorScheme } from 'react-native';

export default function RecordingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const noteId = parseInt(id, 10);
  const { data: note, isLoading, error } = useNote(noteId);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  if (isLoading) {
    return (
      <YStack flex={1} justifyContent="center" alignItems="center" backgroundColor={isDark ? '#0a0a0a' : '#ffffff'}>
        <Spinner size="large" color="$primary" />
      </YStack>
    );
  }

  if (error || !note) {
    return (
      <YStack flex={1} justifyContent="center" alignItems="center" backgroundColor={isDark ? '#0a0a0a' : '#ffffff'}>
        <Text color="$textSecondary">Recording not found</Text>
      </YStack>
    );
  }

  // Format duration in mm:ss
  const formatDuration = (ms: number | null | undefined) => {
    if (!ms) return '0:00';
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: note.title || 'Recording',
          headerShown: true,
        }}
      />
      <ScrollView
        flex={1}
        backgroundColor={isDark ? '#0a0a0a' : '#ffffff'}
        padding="$4"
      >
        <YStack gap="$4" alignItems="center">
          {/* Audio player placeholder */}
          <YStack
            width="100%"
            backgroundColor="$surface"
            borderRadius="$4"
            padding="$4"
            borderWidth={1}
            borderColor="$borderLight"
            alignItems="center"
            gap="$3"
          >
            <Text fontSize="$6" fontWeight="600" color="$text">
              {note.title}
            </Text>
            <Text fontSize="$4" color="$textSecondary">
              Duration: {formatDuration(note.audioDuration)}
            </Text>
            <XStack gap="$3" marginTop="$2">
              <YStack
                backgroundColor="$primary"
                borderRadius={30}
                width={60}
                height={60}
                justifyContent="center"
                alignItems="center"
              >
                <Text color="#ffffff" fontSize="$5">
                  Play
                </Text>
              </YStack>
            </XStack>
          </YStack>

          {/* Transcription / Notes */}
          {note.content && (
            <YStack
              width="100%"
              backgroundColor="$surface"
              borderRadius="$4"
              padding="$4"
              borderWidth={1}
              borderColor="$borderLight"
            >
              <Text fontSize="$3" color="$textSecondary" marginBottom="$2">
                Notes
              </Text>
              <Text fontSize="$4" color="$text" lineHeight={24}>
                {note.content}
              </Text>
            </YStack>
          )}

          {/* Timestamps */}
          <XStack gap="$4" marginTop="$2">
            <Text fontSize="$2" color="$textSecondary">
              Created: {note.createdAt.toLocaleString()}
            </Text>
          </XStack>
        </YStack>
      </ScrollView>
    </>
  );
}
