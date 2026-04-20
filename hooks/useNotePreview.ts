import { useState, useEffect, useRef, useCallback } from 'react';
import { useNote, useUpdateNote } from './useNotes';
import { recordingQueries, mediaQueries } from '@/db/queries';
import type { Recording, MediaFile } from '@/db';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface UseNotePreviewOptions {
  noteId: number | null;
}

export function useNotePreview({ noteId }: UseNotePreviewOptions) {
  const { data: note } = useNote(noteId ?? 0);
  const updateNote = useUpdateNote();

  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [isDirty, setIsDirty] = useState(false);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [isLoadingMedia, setIsLoadingMedia] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // noteId 变化时立即清空，避免闪现旧内容
  useEffect(() => {
    setContent('');
    setTitle('');
    setIsDirty(false);
    setSaveStatus('idle');
  }, [noteId]);

  // Sync from note data on load
  useEffect(() => {
    if (note) {
      setContent(note.content ?? '');
      setTitle(note.title ?? '');
      setIsDirty(false);
      setSaveStatus('idle');
    }
  }, [note?.id, note?.content, note?.title]);

  // Load associated media
  useEffect(() => {
    if (!noteId) return;
    setIsLoadingMedia(true);
    Promise.all([
      recordingQueries.getByNoteId(noteId),
      mediaQueries.getByNoteId(noteId),
    ]).then(([recs, media]) => {
      setRecordings(recs);
      setMediaFiles(media);
    }).finally(() => setIsLoadingMedia(false));
  }, [noteId]);

  // Auto-save with 500ms debounce
  const doSave = useCallback(async (newContent: string, newTitle: string) => {
    if (!noteId) return;
    setSaveStatus('saving');
    try {
      await updateNote.mutateAsync({
        id: noteId,
        data: { content: newContent, title: newTitle },
      });
      setSaveStatus('saved');
      setIsDirty(false);
      // Reset to idle after 2s
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
      savedTimerRef.current = setTimeout(() => setSaveStatus('idle'), 2000);
    } catch {
      setSaveStatus('error');
    }
  }, [noteId, updateNote]);

  const handleContentChange = useCallback((text: string) => {
    setContent(text);
    setIsDirty(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      doSave(text, title);
    }, 500);
  }, [title, doSave]);

  const handleTitleChange = useCallback((text: string) => {
    setTitle(text);
    setIsDirty(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      doSave(content, text);
    }, 500);
  }, [content, doSave]);

  const saveNow = useCallback(async () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    await doSave(content, title);
  }, [content, title, doSave]);

  // Cleanup timers
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    };
  }, []);

  const refreshMedia = useCallback(async () => {
    if (!noteId) return;
    const [recs, media] = await Promise.all([
      recordingQueries.getByNoteId(noteId),
      mediaQueries.getByNoteId(noteId),
    ]);
    setRecordings(recs);
    setMediaFiles(media);
  }, [noteId]);

  return {
    content,
    title,
    saveStatus,
    isDirty,
    setContent: handleContentChange,
    setTitle: handleTitleChange,
    saveNow,
    recordings,
    mediaFiles,
    isLoadingMedia,
    refreshMedia,
  };
}
