import { useState, useCallback } from 'react';
import { Share } from 'react-native';
import type { Note } from '@/db';

interface UseNoteActionsOptions {
  onArchive: (noteId: number) => void;
  onDelete: (noteId: number) => void;
  onSharePress?: (noteIds: number[]) => void;
}

interface UseNoteActionsReturn {
  dialogVisible: boolean;
  pendingAction: 'archive' | 'delete' | null;
  handleShare: (note: Note) => Promise<void>;
  handleArchiveClick: (noteId: number) => void;
  handleDeleteClick: (noteId: number) => void;
  executeAction: () => void;
  cancelAction: () => void;
}

export function useNoteActions({ onArchive, onDelete, onSharePress }: UseNoteActionsOptions): UseNoteActionsReturn {
  const [dialogVisible, setDialogVisible] = useState(false);
  const [pendingAction, setPendingAction] = useState<'archive' | 'delete' | null>(null);
  const [pendingNoteId, setPendingNoteId] = useState<number | null>(null);

  const handleShare = useCallback(async (note: Note) => {
    if (onSharePress) {
      onSharePress([note.id]);
      return;
    }
    try {
      await Share.share({
        message: note.content || '',
      });
    } catch {
      // User cancelled or share failed silently
    }
  }, [onSharePress]);

  const handleArchiveClick = useCallback((noteId: number) => {
    setPendingAction('archive');
    setPendingNoteId(noteId);
    setDialogVisible(true);
  }, []);

  const handleDeleteClick = useCallback((noteId: number) => {
    setPendingAction('delete');
    setPendingNoteId(noteId);
    setDialogVisible(true);
  }, []);

  const executeAction = useCallback(() => {
    if (pendingNoteId === null || pendingAction === null) return;
    if (pendingAction === 'archive') {
      onArchive(pendingNoteId);
    } else {
      onDelete(pendingNoteId);
    }
    setDialogVisible(false);
    setPendingAction(null);
    setPendingNoteId(null);
  }, [pendingNoteId, pendingAction, onArchive, onDelete]);

  const cancelAction = useCallback(() => {
    setDialogVisible(false);
    setPendingAction(null);
    setPendingNoteId(null);
  }, []);

  return {
    dialogVisible,
    pendingAction,
    handleShare,
    handleArchiveClick,
    handleDeleteClick,
    executeAction,
    cancelAction,
  };
}
