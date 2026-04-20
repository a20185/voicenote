import { useState, useCallback } from 'react';
import { View, StyleSheet, Alert, Share } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { Note, Inspiration } from '@/db';
import { useNotes, useArchiveNotes, useDeleteNote, useCreateNote } from '@/hooks/useNotes';
import { useDeleteInspiration } from '@/hooks/useInspirations';
import { noteQueries, recordingQueries, mediaQueries } from '@/db/queries';
import { useNoteSelectionStore } from '@/store/useNoteSelectionStore';
import { useSearchStore } from '@/store/useSearchStore';
import { useOverlayStore } from '@/store/useOverlayStore';
import { saveMediaFile } from '@services/mediaStorage';
import { NoteList } from '@/components/note/NoteList';
import { TabButtons } from '@/components/note/TabButtons';
import { SelectionBar } from '@/components/note/SelectionBar';
import { SearchOverlay } from '@/components/note/SearchOverlay';
import { NotePreviewOverlay } from '@/components/note/NotePreviewOverlay';
import { NoteActionDialog } from '@/components/note/NoteActionDialog';
import { ActionConfirmDialog } from '@/components/note/ActionConfirmDialog';
import { MergePreviewDialog } from '@/components/note/MergePreviewDialog';
import { AIAnalysisOverlay } from '@/components/note/AIAnalysisOverlay';
import { InspirationDetailOverlay } from '@/components/note/InspirationDetailOverlay';
import { CategorizedView, CategoryManagementOverlay, CategoryAssignmentOverlay } from '@/components/note/category';
import { useNoteActions } from '@/hooks/useNoteActions';
import { useBatchNoteActions } from '@/hooks/useBatchNoteActions';
import { BottomNavigation } from '@/components/navigation/BottomNavigation';
import { RecordingOverlay } from '@/components/input/RecordingOverlay';
import { TextNoteOverlay } from '@/components/input/TextNoteOverlay';
import { CameraOverlay } from '@/components/input/CameraOverlay';
import { AttachmentOverlay } from '@/components/input/AttachmentOverlay';
import { AppHeader, ViewType } from '@/components/navigation/AppHeader';
import { InspirationView } from '@/components/note/InspirationView';
import { SettingsOverlay } from '@/components/settings';

export default function HomeScreen() {
  const { t } = useTranslation(['note', 'common']);
  // View state
  const [activeView, setActiveView] = useState<ViewType>('records');
  const [activeTab, setActiveTab] = useState<'active' | 'archived' | 'categorized'>('active');

  // Category management overlay
  const [isCategoryManagementVisible, setIsCategoryManagementVisible] = useState(false);

  // Overlay states (Zustand store — accessible from deep links)
  const { activeOverlay, openOverlay, closeOverlay } = useOverlayStore();
  const isRecordingVisible = activeOverlay === 'record';
  const isTextNoteVisible = activeOverlay === 'text';
  const isCameraVisible = activeOverlay === 'camera';
  const isAttachmentVisible = activeOverlay === 'attachment';
  const isSettingsVisible = activeOverlay === 'settings';

  // Note preview overlay state
  const [previewNote, setPreviewNote] = useState<Note | null>(null);

  // Inspiration detail overlay state
  const [selectedInspiration, setSelectedInspiration] = useState<Inspiration | null>(null);
  const deleteInspirationMutation = useDeleteInspiration();

  // Search state
  const { isSearchOpen, closeSearch, openSearch } = useSearchStore();

  // Fetch notes
  const noteStatus = activeTab === 'categorized' ? undefined : activeTab;
  const { data: notes = [], isLoading, refetch } = useNotes(noteStatus);

  // Fetch all notes for search (across all statuses)
  const { data: allNotes = [] } = useNotes();

  // Selection state
  const {
    selectedIds,
    toggleSelection,
    clearSelection,
    getSelectionCount,
  } = useNoteSelectionStore();
  const selectionCount = getSelectionCount();
  const isSelectionMode = selectionCount > 0;

  // Mutations
  const archiveNotesMutation = useArchiveNotes();
  const deleteNoteMutation = useDeleteNote();
  const createNoteMutation = useCreateNote();

  // Batch note actions (archive confirm / merge preview / AI analysis / categorize)
  const batchActions = useBatchNoteActions({
    notes: activeTab === 'categorized' ? allNotes : notes,
    selectedIds,
    clearSelection,
    activeTab: activeTab === 'categorized' ? 'active' : activeTab,
  });

  // Any overlay open?
  const isAnyOverlayOpen =
    isRecordingVisible || isTextNoteVisible || isCameraVisible || isAttachmentVisible || isSettingsVisible || !!previewNote
    || batchActions.aiAnalysis.visible || !!selectedInspiration;

  const handleViewChange = useCallback((view: ViewType) => {
    setActiveView(view);
    clearSelection();
  }, [clearSelection]);

  const handleSettingsPress = useCallback(() => {
    openOverlay('settings');
  }, [openOverlay]);

  // Handle source note press from AI overlay or inspiration detail
  const handleSourceNotePress = useCallback(async (noteId: number) => {
    const note = await noteQueries.getById(noteId);
    if (note) {
      // Close any open overlays first
      batchActions.aiAnalysis.close();
      setSelectedInspiration(null);
      // Small delay to let overlay close animation finish
      setTimeout(() => setPreviewNote(note), 200);
    } else {
      Alert.alert(t('common:notice'), t('note:noteDeleted'));
    }
  }, [batchActions.aiAnalysis]);

  const handleTabChange = useCallback((tab: 'active' | 'archived' | 'categorized') => {
    setActiveTab(tab);
    clearSelection();
  }, [clearSelection]);

  const handleNotePress = useCallback((note: Note) => {
    if (isSelectionMode) {
      toggleSelection(note.id);
    } else {
      setPreviewNote(note);
    }
  }, [isSelectionMode, toggleSelection]);

  const handleNoteLongPress = useCallback((note: Note) => {
    toggleSelection(note.id);
  }, [toggleSelection]);

  const handleArchiveSingle = useCallback((noteId: number) => {
    archiveNotesMutation.mutate([noteId]);
  }, [archiveNotesMutation]);

  const handleDeleteSingle = useCallback((noteId: number) => {
    deleteNoteMutation.mutate(noteId);
  }, [deleteNoteMutation]);

  // Batch share handler - uses system share
  const handleBatchShare = useCallback(async () => {
    const notesData = activeTab === 'categorized' ? allNotes : notes;
    const message = Array.from(selectedIds)
      .map(id => {
        const note = notesData.find(n => n.id === id);
        return note?.content || '';
      })
      .filter(Boolean)
      .join('\n\n---\n\n');

    if (!message) return;

    try {
      await Share.share({ message });
    } catch {
      // User cancelled or share failed
    }
  }, [selectedIds, notes, allNotes, activeTab]);

  // Note actions (share / archive confirm / delete confirm)
  const noteActions = useNoteActions({
    onArchive: handleArchiveSingle,
    onDelete: handleDeleteSingle,
  });

  const handleRefresh = useCallback(() => { refetch(); }, [refetch]);

  // Save handlers
  const handleSaveRecording = useCallback(
    async (data: { uri?: string; duration: number; transcriptionText?: string }) => {
      const now = new Date();
      const transcriptionText = data.transcriptionText || '';

      if (!data.uri) {
        createNoteMutation.mutate({
          title: 'Live Transcript',
          content: transcriptionText,
          type: 'text',
          status: 'active',
          createdAt: now,
          updatedAt: now,
        }, {
          onSuccess: () => {
            closeOverlay();
          },
        });
        return;
      }

      // Persist recording file
      const fileName = `recording_${Date.now()}.m4a`;
      const savedFileName = await saveMediaFile(data.uri, fileName);

      createNoteMutation.mutate({
        title: 'Voice Recording',
        content: transcriptionText,
        type: 'voice',
        status: 'active',
        audioDuration: data.duration,
        createdAt: now,
        updatedAt: now,
      }, {
        onSuccess: async (note) => {
          if (note?.id) {
            await recordingQueries.create({
              noteId: note.id,
              uri: savedFileName,
              duration: data.duration,
              createdAt: new Date(),
            });
          }
          closeOverlay();
        },
      });
    }, [createNoteMutation]);

  const handleSaveTextNote = useCallback(
    (data: { title?: string; content: string }) => {
      const now = new Date();
      createNoteMutation.mutate({
        title: data.title || 'Text Note',
        content: data.content,
        type: 'text',
        status: 'active',
        createdAt: now,
        updatedAt: now,
      }, { onSuccess: () => closeOverlay() });
    }, [createNoteMutation]);

  const handleSaveCamera = useCallback(
    (data: { type: 'photo' | 'video'; uri: string; thumbnailUri?: string; note?: string }) => {
      const now = new Date();
      createNoteMutation.mutate({
        title: data.type === 'photo' ? 'Photo' : 'Video',
        content: data.note || '',
        type: 'camera',
        status: 'active',
        createdAt: now,
        updatedAt: now,
      }, { onSuccess: () => closeOverlay() });
    }, [createNoteMutation]);

  const handleSaveAttachment = useCallback(
    async (items: Array<{ uri: string; name: string; mimeType: string; size: number; type: 'photo' | 'file' }>) => {
      if (items.length === 0) return;
      const now = new Date();
      const title = items.length === 1 ? items[0].name : t('note:attachmentCount', { count: items.length });
      createNoteMutation.mutate({
        title,
        content: '',
        type: 'attachment',
        status: 'active',
        createdAt: now,
        updatedAt: now,
      }, {
        onSuccess: async (note) => {
          if (note?.id) {
            for (const item of items) {
              const fileName = `attachment_${Date.now()}_${item.name}`;
              const savedFileName = await saveMediaFile(item.uri, fileName);
              await mediaQueries.create({
                noteId: note.id,
                type: item.type === 'photo' ? 'image' : 'document',
                uri: savedFileName,
                fileName: item.name,
                mimeType: item.mimeType,
                createdAt: new Date(),
              });
            }
          }
          closeOverlay();
        },
      });
    }, [createNoteMutation]);

  // Preview overlay actions
  const handlePreviewArchive = useCallback(() => {
    if (previewNote) {
      archiveNotesMutation.mutate([previewNote.id]);
      setPreviewNote(null);
    }
  }, [previewNote, archiveNotesMutation]);

  const handlePreviewDelete = useCallback(() => {
    if (previewNote) {
      deleteNoteMutation.mutate(previewNote.id);
      setPreviewNote(null);
    }
  }, [previewNote, deleteNoteMutation]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <AppHeader
        activeView={activeView}
        onViewChange={handleViewChange}
        onSearchPress={openSearch}
        onMorePress={handleSettingsPress}
      />

      {/* Search overlay (bottom sheet) */}
      <SearchOverlay
        visible={isSearchOpen}
        notes={allNotes}
        onNotePress={(noteId) => {
          closeSearch();
          const note = allNotes.find((n) => n.id === noteId);
          if (note) setPreviewNote(note);
        }}
        onClose={closeSearch}
      />

      {/* Main Content */}
      {activeView === 'records' ? (
        <View style={styles.content}>
          <View style={styles.tabContainer}>
            <TabButtons activeTab={activeTab} onTabChange={handleTabChange} />
          </View>
          {activeTab === 'categorized' ? (
            <CategorizedView
              notes={allNotes}
              isSelectionMode={isSelectionMode}
              selectedIds={selectedIds}
              onNotePress={handleNotePress}
              onNoteLongPress={handleNoteLongPress}
              onArchive={noteActions.handleArchiveClick}
              onDelete={noteActions.handleDeleteClick}
              onShare={noteActions.handleShare}
              onOpenManagement={() => setIsCategoryManagementVisible(true)}
            />
          ) : (
            <NoteList
              notes={notes}
              isLoading={isLoading}
              isSelectionMode={isSelectionMode}
              selectedIds={selectedIds}
              onNotePress={handleNotePress}
              onNoteLongPress={handleNoteLongPress}
              onArchive={noteActions.handleArchiveClick}
              onDelete={noteActions.handleDeleteClick}
              onShare={noteActions.handleShare}
              onRefresh={handleRefresh}
              hideArchiveAction={activeTab === 'archived'}
            />
          )}
        </View>
      ) : (
        <InspirationView onInspirationPress={setSelectedInspiration} />
      )}

      {/* Selection Bar */}
      <SelectionBar
        visible={isSelectionMode && !batchActions.aiAnalysis.visible}
        selectionCount={selectionCount}
        onArchive={batchActions.handleArchivePress}
        onMerge={batchActions.handleMergePress}
        onAI={batchActions.handleAIPress}
        onCategorize={batchActions.handleCategorizePress}
        onShare={handleBatchShare}
        onClear={clearSelection}
        hideArchiveAction={batchActions.hideArchiveAction}
      />

      {/* Bottom Navigation */}
      {!isSelectionMode && (
        <BottomNavigation
          onRecord={() => openOverlay('record')}
          onCamera={() => openOverlay('camera')}
          onAttachment={() => openOverlay('attachment')}
          onText={() => openOverlay('text')}
          isHidden={isAnyOverlayOpen}
        />
      )}

      {/* Input Overlays */}
      <RecordingOverlay
        visible={isRecordingVisible}
        onClose={closeOverlay}
        onSave={handleSaveRecording}
      />
      <TextNoteOverlay
        visible={isTextNoteVisible}
        onClose={closeOverlay}
        onSave={handleSaveTextNote}
      />
      <CameraOverlay
        visible={isCameraVisible}
        onClose={closeOverlay}
        onSave={handleSaveCamera}
      />
      <AttachmentOverlay
        visible={isAttachmentVisible}
        onClose={closeOverlay}
        onSave={handleSaveAttachment}
      />

      {/* Note Preview/Edit Overlays */}
      <NotePreviewOverlay
        visible={!!previewNote}
        note={previewNote}
        onClose={() => setPreviewNote(null)}
        onArchive={handlePreviewArchive}
        onDelete={handlePreviewDelete}
      />

      {/* Note Action Confirmation Dialog */}
      <NoteActionDialog
        visible={noteActions.dialogVisible}
        actionType={noteActions.pendingAction}
        onConfirm={noteActions.executeAction}
        onCancel={noteActions.cancelAction}
      />

      {/* Batch Action Confirm Dialog */}
      <ActionConfirmDialog
        visible={batchActions.confirmDialog.visible}
        actionType={batchActions.confirmDialog.actionType}
        itemCount={batchActions.confirmDialog.itemCount}
        onConfirm={batchActions.confirmDialog.execute}
        onCancel={batchActions.confirmDialog.cancel}
      />

      {/* Merge Preview Dialog */}
      <MergePreviewDialog
        visible={batchActions.mergePreview.visible}
        noteCount={batchActions.mergePreview.noteCount}
        totalCharacters={batchActions.mergePreview.totalCharacters}
        hasMedia={batchActions.mergePreview.hasMedia}
        previewContent={batchActions.mergePreview.previewContent}
        isMerging={batchActions.mergePreview.isMerging}
        onConfirm={batchActions.mergePreview.execute}
        onCancel={batchActions.mergePreview.cancel}
      />

      {/* AI Analysis Overlay */}
      <AIAnalysisOverlay
        visible={batchActions.aiAnalysis.visible}
        state={batchActions.aiAnalysis.state}
        result={batchActions.aiAnalysis.result}
        error={batchActions.aiAnalysis.error}
        sourceNoteCount={batchActions.aiAnalysis.sourceNoteCount}
        sourceNotes={batchActions.aiAnalysis.sourceNotes}
        onRetry={batchActions.aiAnalysis.retry}
        onSave={batchActions.aiAnalysis.save}
        onClose={batchActions.aiAnalysis.close}
        onSourceNotePress={handleSourceNotePress}
      />

      {/* Inspiration Detail Overlay */}
      <InspirationDetailOverlay
        visible={!!selectedInspiration}
        inspiration={selectedInspiration}
        onClose={() => setSelectedInspiration(null)}
        onDelete={(id) => deleteInspirationMutation.mutate(id)}
        onSourceNotePress={handleSourceNotePress}
      />

      {/* Category Management Overlay */}
      <CategoryManagementOverlay
        visible={isCategoryManagementVisible}
        onClose={() => setIsCategoryManagementVisible(false)}
      />

      {/* Category Assignment Overlay */}
      <CategoryAssignmentOverlay
        visible={batchActions.categorize.visible}
        noteIds={batchActions.categorize.noteIds}
        onClose={batchActions.categorize.close}
        onAssigned={batchActions.categorize.onCategorized}
      />

      {/* Settings Overlay */}
      <SettingsOverlay
        visible={isSettingsVisible}
        onClose={closeOverlay}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    flex: 1,
  },
  tabContainer: {
    paddingVertical: 8,
  },
});
