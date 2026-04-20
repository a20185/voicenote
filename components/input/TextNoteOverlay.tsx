import { useEffect } from 'react';
import { View, TextInput, Text, StyleSheet, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { OverlayHeader } from './OverlayHeader';
import { OverlayWrapper } from './OverlayWrapper';
import { MarkdownToolbar } from './MarkdownToolbar';
import { useMarkdownEditor } from '@hooks/useMarkdownEditor';

interface TextNoteOverlayProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: { title?: string; content: string }) => void;
}

export function TextNoteOverlay({ visible, onClose, onSave }: TextNoteOverlayProps) {
  const { t } = useTranslation(['note', 'common']);
  const { text, setText, inputRef, onSelectionChange, insertMarkdown, extractTitle } =
    useMarkdownEditor();

  useEffect(() => {
    if (visible) setText('');
  }, [visible]);

  const handleSave = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSave({ title: extractTitle(trimmed), content: trimmed });
    setText('');
    onClose();
  };

  const handleCancel = () => {
    setText('');
    onClose();
  };

  return (
    <OverlayWrapper visible={visible} onClose={handleCancel} height="70%">
      <OverlayHeader
        title={t('textNote')}
        onCancel={handleCancel}
        onSave={handleSave}
        saveDisabled={!text.trim()}
        saveLabel={t('common:save')}
      />

      <MarkdownToolbar onAction={insertMarkdown} />

      <View style={styles.contentContainer}>
        <TextInput
          ref={inputRef}
          style={styles.contentInput}
          placeholder={t('textNotePlaceholder')}
          placeholderTextColor="#d1d5db"
          value={text}
          onChangeText={setText}
          onSelectionChange={(e) => onSelectionChange(e.nativeEvent.selection)}
          multiline
          textAlignVertical="top"
          autoFocus
        />
        <Text style={styles.hint}>{t('markdownSupported')}</Text>
      </View>
    </OverlayWrapper>
  );
}

const MONO_FONT = Platform.select({
  ios: 'Menlo',
  android: 'monospace',
  default: 'monospace',
});

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
    gap: 4,
  },
  contentInput: {
    flex: 1,
    fontSize: 16,
    lineHeight: 26,
    color: '#1f2937',
    fontFamily: MONO_FONT,
    textAlignVertical: 'top',
    paddingHorizontal: 4,
    paddingTop: 0,
  },
  hint: {
    fontSize: 12,
    color: '#d1d5db',
    textAlign: 'center',
  },
});

export type TextNoteOverlayPropsType = TextNoteOverlayProps;
