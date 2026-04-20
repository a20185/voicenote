import { View } from 'react-native';
import { XStack, YStack, Text, Slider, Button, Circle } from 'tamagui';
import { useColorScheme } from 'react-native';
import { colors } from '@theme/colors';
import { spacing } from '@theme/spacing';
import { formatDuration } from '@utils/format';
import { useAudioRecorder } from '@hooks';

interface AudioPlayerProps {
  uri: string;
  title?: string;
  onPlaybackEnd?: () => void;
}

export function AudioPlayer({ uri, title, onPlaybackEnd }: AudioPlayerProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const {
    isPlaying,
    playbackPosition,
    playbackDuration,
    loadSound,
    playSound,
    pauseSound,
    stopSound,
    seekTo,
  } = useAudioRecorder();

  // Load sound when URI changes
  // useEffect(() => {
  //   if (uri) {
  //     loadSound(uri);
  //   }
  // }, [uri, loadSound]);

  const handlePlayPause = () => {
    if (isPlaying) {
      pauseSound();
    } else {
      playSound();
    }
  };

  const handleSeek = (value: number) => {
    seekTo(value);
  };

  return (
    <View
      style={{
        backgroundColor: isDark ? '#18181b' : '#f4f4f5',
        borderRadius: 12,
        padding: spacing[4],
      }}
    >
      <YStack gap={spacing[3]}>
        {title && (
          <Text
            fontSize={16}
            fontWeight="600"
            color={isDark ? '#fafafa' : '#18181b'}
            numberOfLines={1}
          >
            {title}
          </Text>
        )}

        {/* Progress Bar */}
        <YStack gap={spacing[2]}>
          <Slider
            value={[playbackPosition]}
            max={playbackDuration || 100}
            onValueChange={([value]) => handleSeek(value)}
            size="$2"
          >
            <Slider.Track backgroundColor={isDark ? '#27272a' : '#e4e4e7'}>
              <Slider.TrackActive backgroundColor={colors.primary[500]} />
            </Slider.Track>
            <Slider.Thumb
              circular
              index={0}
              size="$2"
              backgroundColor={colors.primary[500]}
            />
          </Slider>

          <XStack justifyContent="space-between">
            <Text fontSize={12} color={isDark ? '#a1a1aa' : '#52525b'}>
              {formatDuration(playbackPosition)}
            </Text>
            <Text fontSize={12} color={isDark ? '#a1a1aa' : '#52525b'}>
              {formatDuration(playbackDuration)}
            </Text>
          </XStack>
        </YStack>

        {/* Controls */}
        <XStack justifyContent="center" alignItems="center" gap={spacing[4]}>
          <Button
            size="$3"
            circular
            chromeless
            onPress={stopSound}
          >
            <Text fontSize={20}>⏮</Text>
          </Button>

          <Circle
            size={56}
            backgroundColor={colors.primary[500]}
            pressStyle={{ scale: 0.95 }}
            onPress={handlePlayPause}
          >
            <Text fontSize={24} color="white">
              {isPlaying ? '⏸' : '▶'}
            </Text>
          </Circle>

          <Button
            size="$3"
            circular
            chromeless
          >
            <Text fontSize={20}>⏭</Text>
          </Button>
        </XStack>
      </YStack>
    </View>
  );
}
