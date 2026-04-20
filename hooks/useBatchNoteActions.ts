import { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { Note, NoteStatus } from '@/db';
import { useArchiveNotes, useMergeNotes } from '@/hooks/useNotes';
import { useCreateInspiration } from '@/hooks/useInspirations';
import { isAIConfigured, analyzeNotes } from '@/services/ai';
import type { EnhancedAIAnalysisResult } from '@/services/ai';
import type { AISourceNote } from '@/types/ai';

interface UseBatchNoteActionsOptions {
  notes: Note[];
  selectedIds: Set<number>;
  clearSelection: () => void;
  activeTab: NoteStatus;
}

interface ConfirmDialogState {
  visible: boolean;
  actionType: string;
  itemCount: number;
}

interface MergePreviewState {
  visible: boolean;
  noteCount: number;
  totalCharacters: number;
  hasMedia: boolean;
  previewContent: string;
  isMerging: boolean;
}

type AIAnalysisState = 'analyzing' | 'success' | 'error';

interface AIAnalysisUIState {
  visible: boolean;
  state: AIAnalysisState;
  result: EnhancedAIAnalysisResult | null;
  error: string | null;
  sourceNotes: AISourceNote[];
}

interface CategorizeState {
  visible: boolean;
  noteIds: number[];
}

function buildSourceNotes(notes: Note[]): AISourceNote[] {
  return notes.map((n) => ({
    id: n.id,
    title: n.title,
    preview: (n.content || '').slice(0, 80),
  }));
}

export function useBatchNoteActions({
  notes,
  selectedIds,
  clearSelection,
  activeTab,
}: UseBatchNoteActionsOptions) {
  const { t } = useTranslation('ai');
  const archiveNotesMutation = useArchiveNotes();
  const mergeNotesMutation = useMergeNotes();
  const createInspirationMutation = useCreateInspiration();

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({
    visible: false,
    actionType: '',
    itemCount: 0,
  });

  // Merge preview state
  const [mergePreview, setMergePreview] = useState<MergePreviewState>({
    visible: false,
    noteCount: 0,
    totalCharacters: 0,
    hasMedia: false,
    previewContent: '',
    isMerging: false,
  });

  // AI analysis state
  const [aiAnalysis, setAIAnalysis] = useState<AIAnalysisUIState>({
    visible: false,
    state: 'analyzing',
    result: null,
    error: null,
    sourceNotes: [],
  });

  // Categorize state
  const [categorize, setCategorize] = useState<CategorizeState>({
    visible: false,
    noteIds: [],
  });

  const hideArchiveAction = activeTab === 'archived';

  const selectedNotes = useMemo(
    () => notes.filter((n) => selectedIds.has(n.id)),
    [notes, selectedIds]
  );

  // === Archive flow ===
  const handleArchivePress = useCallback(() => {
    setConfirmDialog({
      visible: true,
      actionType: 'archive',
      itemCount: selectedIds.size,
    });
  }, [selectedIds.size]);

  const executeArchive = useCallback(async () => {
    const ids = Array.from(selectedIds);
    await archiveNotesMutation.mutateAsync(ids);
    setConfirmDialog((s) => ({ ...s, visible: false }));
    clearSelection();
  }, [selectedIds, archiveNotesMutation, clearSelection]);

  const cancelConfirm = useCallback(() => {
    setConfirmDialog((s) => ({ ...s, visible: false }));
  }, []);

  // === Merge flow ===
  const handleMergePress = useCallback(() => {
    const totalChars = selectedNotes.reduce(
      (sum, n) => sum + (n.content?.length || 0),
      0
    );
    const preview = selectedNotes
      .map((n) => n.content || '')
      .join('\n\n---\n\n');
    setMergePreview({
      visible: true,
      noteCount: selectedNotes.length,
      totalCharacters: totalChars,
      hasMedia: false,
      previewContent: preview,
      isMerging: false,
    });
  }, [selectedNotes]);

  const executeMerge = useCallback(async () => {
    setMergePreview((s) => ({ ...s, isMerging: true }));
    const ids = selectedNotes.map((n) => n.id);
    await mergeNotesMutation.mutateAsync({ noteIds: ids });
    setMergePreview((s) => ({ ...s, visible: false, isMerging: false }));
    clearSelection();
  }, [selectedNotes, mergeNotesMutation, clearSelection]);

  const cancelMerge = useCallback(() => {
    setMergePreview((s) => ({ ...s, visible: false }));
  }, []);

  // === AI Analysis flow ===
  const runAIAnalysis = useCallback(async (notesToAnalyze: Note[]) => {
    const sourceNotes = buildSourceNotes(notesToAnalyze);
    setAIAnalysis({
      visible: true,
      state: 'analyzing',
      result: null,
      error: null,
      sourceNotes,
    });

    try {
      const notesForAI = notesToAnalyze.map((n) => {
        let tags: string[] | undefined;
        if (n.tags) {
          try {
            tags = Array.isArray(n.tags) ? n.tags : JSON.parse(String(n.tags));
          } catch {
            tags = undefined;
          }
        }
        return {
          id: n.id,
          content: n.content || '',
          createdAt: n.createdAt instanceof Date
            ? n.createdAt.toISOString()
            : String(n.createdAt),
          title: n.title,
          tags,
          type: n.type || undefined,
        };
      });
      const result = await analyzeNotes(notesForAI);
      setAIAnalysis((s) => ({ ...s, state: 'success', result }));
    } catch (err) {
      setAIAnalysis((s) => ({
        ...s,
        state: 'error',
        error: err instanceof Error ? err.message : t('analysisFailed'),
      }));
    }
  }, []);

  const handleAIPress = useCallback(() => {
    if (!isAIConfigured()) {
      setAIAnalysis({
        visible: true,
        state: 'error',
        result: null,
        error: t('configureAIFirst'),
        sourceNotes: [],
      });
      return;
    }
    runAIAnalysis(selectedNotes);
  }, [selectedNotes, runAIAnalysis]);

  const retryAI = useCallback(() => {
    runAIAnalysis(selectedNotes);
  }, [selectedNotes, runAIAnalysis]);

  const saveAIResult = useCallback(async () => {
    if (!aiAnalysis.result) return;

    const result = aiAnalysis.result;
    const title = result.metadata?.topicsIdentified?.[0]
      ? `${t('aiAnalysis')}: ${result.metadata.topicsIdentified[0]}`
      : t('aiAnalysis');

    await createInspirationMutation.mutateAsync({
      title,
      summary: result.summary,
      analysisData: JSON.stringify(result),
      sourceNoteIds: JSON.stringify(aiAnalysis.sourceNotes.map((n) => n.id)),
      sourceNotes: JSON.stringify(aiAnalysis.sourceNotes),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    setAIAnalysis((s) => ({ ...s, visible: false }));
    clearSelection();
  }, [aiAnalysis.result, aiAnalysis.sourceNotes, createInspirationMutation, clearSelection]);

  const closeAI = useCallback(() => {
    setAIAnalysis((s) => ({ ...s, visible: false }));
  }, []);

  // === Categorize flow ===
  const handleCategorizePress = useCallback(() => {
    setCategorize({ visible: true, noteIds: Array.from(selectedIds) });
  }, [selectedIds]);

  const closeCategorize = useCallback(() => {
    setCategorize((s) => ({ ...s, visible: false }));
  }, []);

  const onCategorized = useCallback(() => {
    setCategorize((s) => ({ ...s, visible: false }));
    clearSelection();
  }, [clearSelection]);

  return {
    hideArchiveAction,
    confirmDialog: {
      ...confirmDialog,
      execute: executeArchive,
      cancel: cancelConfirm,
    },
    mergePreview: {
      ...mergePreview,
      execute: executeMerge,
      cancel: cancelMerge,
    },
    aiAnalysis: {
      ...aiAnalysis,
      sourceNoteCount: selectedNotes.length,
      retry: retryAI,
      save: saveAIResult,
      close: closeAI,
    },
    handleArchivePress,
    handleMergePress,
    handleAIPress,
    handleCategorizePress,
    categorize: {
      ...categorize,
      close: closeCategorize,
      onCategorized,
    },
  };
}
