import { View, Pressable, StyleSheet } from 'react-native';
import {
  Heading,
  Bold,
  Italic,
  List,
  Quote,
  Link,
} from 'lucide-react-native';
import type { MarkdownAction } from '@hooks/useMarkdownEditor';

interface MarkdownToolbarProps {
  onAction: (action: MarkdownAction) => void;
}

const ICON_SIZE = 16;
const ICON_COLOR = '#6b7280';

const buttons: { action: MarkdownAction; Icon: typeof Heading }[] = [
  { action: 'heading', Icon: Heading },
  { action: 'bold', Icon: Bold },
  { action: 'italic', Icon: Italic },
];

const buttons2: { action: MarkdownAction; Icon: typeof List }[] = [
  { action: 'list', Icon: List },
  { action: 'quote', Icon: Quote },
  { action: 'link', Icon: Link },
];

export function MarkdownToolbar({ onAction }: MarkdownToolbarProps) {
  return (
    <View style={styles.container}>
      {buttons.map(({ action, Icon }) => (
        <Pressable
          key={action}
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          onPress={() => onAction(action)}
        >
          <Icon size={ICON_SIZE} color={ICON_COLOR} />
        </Pressable>
      ))}
      <View style={styles.separator} />
      {buttons2.map(({ action, Icon }) => (
        <Pressable
          key={action}
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          onPress={() => onAction(action)}
        >
          <Icon size={ICON_SIZE} color={ICON_COLOR} />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
    paddingHorizontal: 4,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  button: {
    padding: 8,
    borderRadius: 8,
  },
  buttonPressed: {
    backgroundColor: '#f3f4f6',
  },
  separator: {
    width: 1,
    height: 16,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 4,
  },
});
