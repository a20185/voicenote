import React from 'react';
import { Modal, View, Pressable, StyleSheet, Dimensions } from 'react-native';
import { Text } from 'tamagui';
import { useTranslation } from 'react-i18next';

interface NoteActionDialogProps {
  visible: boolean;
  actionType: 'archive' | 'delete' | null;
  onConfirm: () => void;
  onCancel: () => void;
}


export function NoteActionDialog({ visible, actionType, onConfirm, onCancel }: NoteActionDialogProps) {
  const { t } = useTranslation(['dialog', 'common']);

  if (!actionType) return null;

  const config = actionType === 'archive'
    ? {
        title: t('dialog:archiveTitle'),
        description: t('dialog:archiveMessage'),
        confirmText: t('dialog:archiveConfirm'),
        confirmBg: '#111827',
        confirmPressBg: '#374151',
      }
    : {
        title: t('dialog:deleteTitle'),
        description: t('dialog:deleteMessage'),
        confirmText: t('common:delete'),
        confirmBg: '#ef4444',
        confirmPressBg: '#dc2626',
      };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          <Text fontSize={18} fontWeight="600" color="#111827" marginBottom={8}>
            {config.title}
          </Text>
          <Text fontSize={14} color="#6b7280" lineHeight={20} marginBottom={24}>
            {config.description}
          </Text>
          <View style={styles.buttonRow}>
            <Pressable
              style={({ pressed }) => [
                styles.button,
                styles.cancelButton,
                pressed && styles.cancelButtonPressed,
              ]}
              onPress={onCancel}
            >
              <Text fontSize={15} fontWeight="500" color="#374151">
                {t('common:cancel')}
              </Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.button,
                { backgroundColor: pressed ? config.confirmPressBg : config.confirmBg },
              ]}
              onPress={onConfirm}
            >
              <Text fontSize={15} fontWeight="500" color="#ffffff">
                {config.confirmText}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dialog: {
    width: SCREEN_WIDTH * 0.9,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    height: 44,
    borderRadius: 9999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff',
  },
  cancelButtonPressed: {
    backgroundColor: '#f3f4f6',
  },
});
