import { XStack, styled } from 'tamagui';
import { Text } from 'react-native';

interface RecordingTimerProps {
  seconds: number;
}

function formatTime(secs: number): string {
  const mins = Math.floor(secs / 60);
  const s = secs % 60;
  return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

const TimerContainer = styled(XStack, {
  backgroundColor: '#f4f4f5',
  paddingHorizontal: 12,
  paddingVertical: 4,
  borderRadius: 100,
  borderWidth: 1,
  borderColor: '#f3f4f6',
  alignSelf: 'center',
  alignItems: 'center',
  justifyContent: 'center',
});

export function RecordingTimer({ seconds }: RecordingTimerProps) {
  return (
    <TimerContainer>
      <Text
        style={{
          fontFamily: 'monospace',
          fontSize: 14,
          fontWeight: '500',
          color: '#9ca3af',
          letterSpacing: 3,
        }}
      >
        {formatTime(seconds)}
      </Text>
    </TimerContainer>
  );
}
