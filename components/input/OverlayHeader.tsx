import { View, Pressable, Text, StyleSheet } from 'react-native';
import { X } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

interface OverlayHeaderProps {
  title: string;
  onCancel: () => void;
  onSave: () => void;
  saveDisabled?: boolean;
  saveLabel?: string;
}

export function OverlayHeader({
  title,
  onCancel,
  onSave,
  saveDisabled = false,
  saveLabel,
}: OverlayHeaderProps) {
  const { t } = useTranslation('common');
  const label = saveLabel || t('save');
  return (
    <View style={styles.container}>
      <Pressable style={styles.closeButton} onPress={onCancel}>
        <X size={24} color="#9ca3af" />
      </Pressable>

      <Text style={styles.title}>{title}</Text>

      <Pressable
        style={[styles.saveButton, saveDisabled && styles.saveButtonDisabled]}
        onPress={saveDisabled ? undefined : onSave}
        disabled={saveDisabled}
      >
        <Text style={[styles.saveButtonText, saveDisabled && styles.saveButtonTextDisabled]}>
          {label}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  closeButton: {
    padding: 8,
    marginLeft: -8,
    borderRadius: 9999,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 9999,
    backgroundColor: '#18181b',
  },
  saveButtonDisabled: {
    backgroundColor: '#f3f4f6',
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  saveButtonTextDisabled: {
    color: '#d1d5db',
  },
});
