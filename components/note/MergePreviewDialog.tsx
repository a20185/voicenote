import React from 'react';
import {
  Modal,
  View,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  StyleSheet,
} from 'react-native';
import { Text } from 'tamagui';
import { FileText, AlertCircle, CheckCircle } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

export interface MergePreviewDialogProps {
  visible: boolean;
  noteCount: number;
  totalCharacters: number;
  hasMedia: boolean;
  previewContent: string;
  isMerging: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function MergePreviewDialog({
  visible,
  noteCount,
  totalCharacters,
  hasMedia,
  previewContent,
  isMerging,
  onConfirm,
  onCancel,
}: MergePreviewDialogProps) {
  const { t } = useTranslation(['dialog', 'common']);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          {/* Title row */}
          <View style={styles.titleRow}>
            <FileText size={20} color="#4b5563" />
            <Text fontSize={18} fontWeight="600" color="#111827">
              {t('dialog:mergeTitle')}
            </Text>
          </View>

          {/* Stats line */}
          <Text fontSize={14} color="#6b7280" marginBottom={16}>
            {t('dialog:mergeInfo', { count: noteCount, chars: totalCharacters })}
          </Text>

          {/* Media warning */}
          {hasMedia && (
            <View style={styles.mediaWarning}>
              <AlertCircle size={16} color="#92400e" />
              <Text fontSize={13} color="#92400e" flex={1}>
                {t('dialog:mergeMediaWarning')}
              </Text>
            </View>
          )}

          {/* Content preview */}
          <View style={styles.previewContainer}>
            <ScrollView nestedScrollEnabled>
              <Text fontSize={14} color="#374151" lineHeight={20}>
                {previewContent}
              </Text>
            </ScrollView>
          </View>

          {/* Preserve hint */}
          <View style={styles.preserveHint}>
            <CheckCircle size={14} color="#22c55e" />
            <Text fontSize={12} color="#6b7280">
              {t('dialog:mergePreserveHint')}
            </Text>
          </View>

          {/* Button row */}
          <View style={styles.buttonRow}>
            <Pressable
              style={({ pressed }) => [
                styles.button,
                styles.cancelButton,
                pressed && styles.cancelButtonPressed,
                isMerging && styles.disabledButton,
              ]}
              onPress={onCancel}
              disabled={isMerging}
            >
              <Text fontSize={15} fontWeight="500" color="#374151">
                {t('common:cancel')}
              </Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.button,
                styles.confirmButton,
                pressed && styles.confirmButtonPressed,
              ]}
              onPress={onConfirm}
              disabled={isMerging}
            >
              {isMerging ? (
                <View style={styles.mergingRow}>
                  <ActivityIndicator size="small" color="#ffffff" />
                  <Text fontSize={15} fontWeight="500" color="#ffffff" marginLeft={8}>
                    {t('dialog:merging')}
                  </Text>
                </View>
              ) : (
                <Text fontSize={15} fontWeight="500" color="#ffffff">
                  {t('dialog:confirmMerge')}
                </Text>
              )}
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
    width: Math.min(SCREEN_WIDTH * 0.9, 360),
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  mediaWarning: {
    backgroundColor: '#fffbeb',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  previewContainer: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 12,
    maxHeight: 160,
    marginBottom: 12,
  },
  preserveHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 20,
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
  disabledButton: {
    opacity: 0.5,
  },
  confirmButton: {
    backgroundColor: '#111827',
  },
  confirmButtonPressed: {
    backgroundColor: '#374151',
  },
  mergingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
