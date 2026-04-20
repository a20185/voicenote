import React, { useState, useEffect } from 'react';
import { Modal, View, TextInput, Pressable, StyleSheet } from 'react-native';
import { Text } from 'tamagui';
import { X } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import type { Note } from '@/db';

interface NoteEditOverlayProps {
  visible: boolean;
  note: Note | null;
  onClose: () => void;
  onSave: (content: string) => void;
}

export function NoteEditOverlay({ visible, note, onClose, onSave }: NoteEditOverlayProps) {
  const { t } = useTranslation(['note', 'common']);
  const [content, setContent] = useState('');

  useEffect(() => {
    if (visible && note) {
      setContent(note.content ?? '');
    }
  }, [visible, note]);

  const handleSave = () => {
    onSave(content);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={onClose} style={styles.headerButton}>
            <X color="#333" size={22} />
          </Pressable>
          <Text fontSize={17} fontWeight="600">
            {t('note:editNote')}
          </Text>
          <Pressable onPress={handleSave} style={styles.headerButton}>
            <Text fontSize={16} color="#3b82f6" fontWeight="600">
              {t('common:save')}
            </Text>
          </Pressable>
        </View>
        <TextInput
          style={styles.input}
          value={content}
          onChangeText={setContent}
          multiline
          textAlignVertical="top"
          autoFocus
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 54,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e5e5',
  },
  headerButton: {
    padding: 4,
    minWidth: 44,
  },
  input: {
    flex: 1,
    fontSize: 15,
    lineHeight: 24,
    padding: 16,
    color: '#333',
  },
});
