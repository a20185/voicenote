import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Text } from 'tamagui';
import { Paperclip } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

interface EmptyMediaStateProps {
  onAdd: () => void;
}

export function EmptyMediaState({ onAdd }: EmptyMediaStateProps) {
  const { t } = useTranslation('attachment');
  return (
    <Pressable onPress={onAdd} style={styles.container}>
      <Paperclip size={16} color="#9ca3af" />
      <Text fontSize={13} color="#9ca3af" marginLeft={8}>{t('addAttachment')}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row', alignItems: 'center',
    borderTopWidth: 1, borderTopColor: '#f3f4f6',
    paddingHorizontal: 16, paddingVertical: 12,
  },
});
