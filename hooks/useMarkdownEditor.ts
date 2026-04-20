import { useState, useRef, useCallback } from 'react';
import type { TextInput } from 'react-native';
import i18next from 'i18next';

export type MarkdownAction = 'heading' | 'bold' | 'italic' | 'list' | 'quote' | 'link';

interface Selection {
  start: number;
  end: number;
}

export function useMarkdownEditor(initialText = '') {
  const [text, setText] = useState(initialText);
  const selectionRef = useRef<Selection>({ start: 0, end: 0 });
  const inputRef = useRef<TextInput>(null);

  const onSelectionChange = useCallback((sel: Selection) => {
    selectionRef.current = sel;
  }, []);

  const insertMarkdown = useCallback((action: MarkdownAction) => {
    const { start, end } = selectionRef.current;
    const hasSelection = start !== end;
    const selected = hasSelection ? text.slice(start, end) : '';

    let newText = text;
    let cursorPos = start;

    switch (action) {
      case 'heading': {
        const lineStart = text.lastIndexOf('\n', start - 1) + 1;
        const lineEnd = text.indexOf('\n', start);
        const line = text.slice(lineStart, lineEnd === -1 ? undefined : lineEnd);
        const match = line.match(/^(#{1,3})\s/);
        let prefix: string;
        if (!match) {
          prefix = '# ';
        } else if (match[1].length < 3) {
          // Remove old prefix, upgrade level
          const oldLen = match[1].length;
          const stripped = line.slice(oldLen + 1);
          prefix = '#'.repeat(oldLen + 1) + ' ';
          newText = text.slice(0, lineStart) + prefix + stripped + text.slice(lineEnd === -1 ? text.length : lineEnd);
          cursorPos = lineStart + prefix.length + stripped.length;
          setText(newText);
          return;
        } else {
          // Already h3, cycle back to h1
          const stripped = line.slice(4);
          prefix = '# ';
          newText = text.slice(0, lineStart) + prefix + stripped + text.slice(lineEnd === -1 ? text.length : lineEnd);
          cursorPos = lineStart + prefix.length + stripped.length;
          setText(newText);
          return;
        }
        newText = text.slice(0, lineStart) + prefix + text.slice(lineStart);
        cursorPos = lineStart + prefix.length + (start - lineStart);
        break;
      }
      case 'bold': {
        if (hasSelection) {
          newText = text.slice(0, start) + '**' + selected + '**' + text.slice(end);
          cursorPos = end + 4;
        } else {
          newText = text.slice(0, start) + `**${i18next.t('note:boldText')}**` + text.slice(end);
          cursorPos = start + 2;
        }
        break;
      }
      case 'italic': {
        if (hasSelection) {
          newText = text.slice(0, start) + '*' + selected + '*' + text.slice(end);
          cursorPos = end + 2;
        } else {
          newText = text.slice(0, start) + `*${i18next.t('note:italicText')}*` + text.slice(end);
          cursorPos = start + 1;
        }
        break;
      }
      case 'list': {
        const lineStart = text.lastIndexOf('\n', start - 1) + 1;
        newText = text.slice(0, lineStart) + '- ' + text.slice(lineStart);
        cursorPos = start + 2;
        break;
      }
      case 'quote': {
        const lineStart = text.lastIndexOf('\n', start - 1) + 1;
        newText = text.slice(0, lineStart) + '> ' + text.slice(lineStart);
        cursorPos = start + 2;
        break;
      }
      case 'link': {
        if (hasSelection) {
          newText = text.slice(0, start) + '[' + selected + '](url)' + text.slice(end);
          cursorPos = start + selected.length + 3;
        } else {
          newText = text.slice(0, start) + `[${i18next.t('note:linkText')}](url)` + text.slice(end);
          cursorPos = start + 1;
        }
        break;
      }
    }

    setText(newText);
    // Focus and set cursor position after state update
    setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.setNativeProps({ selection: { start: cursorPos, end: cursorPos } });
    }, 50);
  }, [text]);

  const insertTextAtCursor = useCallback((insertText: string) => {
    const { start } = selectionRef.current;
    // If cursor is at start (possibly never focused), append to end on a new line
    const pos = start === 0 && text.length > 0 ? text.length : start;
    const prefix = pos > 0 && text[pos - 1] !== '\n' ? '\n' : '';
    const newText = text.slice(0, pos) + prefix + insertText + text.slice(pos);
    const newCursorPos = pos + prefix.length + insertText.length;
    setText(newText);
    setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.setNativeProps({ selection: { start: newCursorPos, end: newCursorPos } });
    }, 50);
  }, [text]);

  const extractTitle = useCallback((content: string): string | undefined => {
    const firstLine = content.split('\n')[0];
    const match = firstLine?.match(/^#+\s+(.+)/);
    return match?.[1]?.trim() || undefined;
  }, []);

  return {
    text,
    setText,
    inputRef,
    onSelectionChange,
    insertMarkdown,
    insertTextAtCursor,
    extractTitle,
  };
}
