import { XStack, Text, Circle, styled } from 'tamagui';
import { X } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

interface RecordingOverlayHeaderProps {
  title: string;
  onCancel: () => void;
  onSave: () => void;
  saveDisabled?: boolean;
  saveLabel?: string;
}

const HeaderButton = styled(Circle, {
  size: 32,
  cursor: 'pointer',
  pressStyle: { scale: 0.95, opacity: 0.8 },
});

export function RecordingOverlayHeader({
  title,
  onCancel,
  onSave,
  saveDisabled = false,
  saveLabel,
}: RecordingOverlayHeaderProps) {
  const { t } = useTranslation('common');
  const label = saveLabel || t('done');
  return (
    <XStack alignItems="center" justifyContent="space-between" width="100%" paddingHorizontal={4} marginBottom={24}>
      {/* Cancel button */}
      <HeaderButton backgroundColor="transparent" onPress={onCancel}>
        <X size={24} color="#9ca3af" />
      </HeaderButton>

      {/* Title */}
      <Text fontSize={18} fontWeight="600" color="#1f2937">
        {title}
      </Text>

      {/* Save button */}
      <XStack
        paddingHorizontal={16}
        paddingVertical={6}
        borderRadius={20}
        backgroundColor={saveDisabled ? '#e5e7eb' : '#111827'}
        pressStyle={{ scale: 0.95 }}
        opacity={saveDisabled ? 0.5 : 1}
        onPress={saveDisabled ? undefined : onSave}
        cursor={saveDisabled ? 'not-allowed' : 'pointer'}
      >
        <Text fontSize={14} fontWeight="700" color="white">
          {label}
        </Text>
      </XStack>
    </XStack>
  );
}
