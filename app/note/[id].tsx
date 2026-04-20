import { useLocalSearchParams, Stack } from 'expo-router';
import { YStack, Text, ScrollView, XStack, Spinner } from 'tamagui';
import { useNote } from '@/hooks/useNotes';
import { useColorScheme } from 'react-native';

export default function NoteDetailScreen() {
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
        <Text color="$textSecondary">Note not found</Text>
      </YStack>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: note.title || 'Note',
          headerShown: true,
        }}
      />
      <ScrollView
        flex={1}
        backgroundColor={isDark ? '#0a0a0a' : '#ffffff'}
        padding="$4"
      >
        <YStack gap="$4">
          {/* Note metadata */}
          <XStack justifyContent="space-between" alignItems="center">
            <Text fontSize="$3" color="$textSecondary">
              {note.type.charAt(0).toUpperCase() + note.type.slice(1)}
            </Text>
            <Text fontSize="$3" color="$textSecondary">
              {note.status.charAt(0).toUpperCase() + note.status.slice(1)}
            </Text>
          </XStack>

          {/* Note content */}
          <YStack
            backgroundColor="$surface"
            borderRadius="$4"
            padding="$4"
            borderWidth={1}
            borderColor="$borderLight"
          >
            <Text fontSize="$5" color="$text" lineHeight={24}>
              {note.content || 'No content'}
            </Text>
          </YStack>

          {/* Timestamps */}
          <YStack gap="$2">
            <Text fontSize="$2" color="$textSecondary">
              Created: {note.createdAt.toLocaleString()}
            </Text>
            <Text fontSize="$2" color="$textSecondary">
              Updated: {note.updatedAt.toLocaleString()}
            </Text>
          </YStack>
        </YStack>
      </ScrollView>
    </>
  );
}
