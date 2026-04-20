import { View } from 'react-native';
import { CameraView as ExpoCameraView, CameraType } from 'expo-camera';
import { XStack, YStack, Text, Button, Circle } from 'tamagui';
import { useColorScheme } from 'react-native';
import { colors } from '@theme/colors';
import { spacing } from '@theme/spacing';
import { useCamera } from '@hooks';

interface CameraViewProps {
  onCapture?: (result: { uri: string; type: 'image' | 'video' }) => void;
  mode?: 'photo' | 'video';
}

export function CameraView({ onCapture, mode = 'photo' }: CameraViewProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const {
    cameraRef,
    setCameraRef,
    isRecording,
    facing,
    toggleFacing,
    takePicture,
    startRecording,
    stopRecording,
    isReady,
    setIsReady,
    hasPermission,
  } = useCamera();

  const handleCapture = async () => {
    if (mode === 'photo') {
      const result = await takePicture();
      if (result && onCapture) {
        onCapture(result);
      }
    } else {
      if (isRecording) {
        await stopRecording();
      } else {
        await startRecording();
      }
    }
  };

  if (!hasPermission) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: isDark ? '#0a0a0a' : '#ffffff',
          justifyContent: 'center',
          alignItems: 'center',
          padding: spacing[6],
        }}
      >
        <YStack alignItems="center" gap={spacing[4]}>
          <Text fontSize={48}>📷</Text>
          <Text
            fontSize={18}
            fontWeight="600"
            color={isDark ? '#fafafa' : '#18181b'}
            textAlign="center"
          >
            Camera Permission Required
          </Text>
          <Text
            fontSize={14}
            color={isDark ? '#a1a1aa' : '#52525b'}
            textAlign="center"
          >
            Please grant camera access to use this feature
          </Text>
        </YStack>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <ExpoCameraView
        style={{ flex: 1 }}
        facing={facing}
        ref={setCameraRef}
        onCameraReady={() => setIsReady(true)}
      >
        {/* Controls Overlay */}
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: spacing[4],
            paddingBottom: spacing[6],
          }}
        >
          <XStack justifyContent="space-around" alignItems="center">
            {/* Flip Camera */}
            <Button
              size="$4"
              circular
              backgroundColor="rgba(0,0,0,0.5)"
              onPress={toggleFacing}
            >
              <Text fontSize={24} color="white">🔄</Text>
            </Button>

            {/* Capture Button */}
            <Circle
              size={80}
              borderWidth={4}
              borderColor="white"
              backgroundColor={isRecording ? colors.recording.active : 'transparent'}
              opacity={isReady ? 1 : 0.5}
              pressStyle={{ scale: 0.95 }}
              onPress={handleCapture}
            >
              {mode === 'video' && isRecording && (
                <View
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 4,
                    backgroundColor: 'white',
                  }}
                />
              )}
            </Circle>

            {/* Placeholder for symmetry */}
            <View style={{ width: 48, height: 48 }} />
          </XStack>
        </View>
      </ExpoCameraView>
    </View>
  );
}
