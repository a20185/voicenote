import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { Note } from '@/db';
import { searchService } from '@/services/search';
import type { GroupedSearchResults } from '@/types/search';

interface UseSearchOptions {
  notes: Note[];
  debounceMs?: number;
}

export function useSearch({ notes, debounceMs = 200 }: UseSearchOptions) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GroupedSearchResults | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isIndexReady, setIsIndexReady] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Index documents when notes change
  useEffect(() => {
    if (notes.length > 0) {
      searchService.indexDocuments(notes);
      setIsIndexReady(true);
    }
  }, [notes]);

  // All available tags
  const allTags = useMemo(() => {
    if (!isIndexReady) return [];
    return searchService.extractAllTags();
  }, [isIndexReady, notes]);

  // Debounced search
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    if (!query.trim()) {
      setResults(null);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    timerRef.current = setTimeout(() => {
      const tags = selectedTags.length > 0 ? selectedTags : undefined;
      const searchResults = searchService.search(query, tags);
      const grouped = searchService.groupResults(searchResults, query);
      setResults(grouped);
      setIsSearching(false);
    }, debounceMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query, selectedTags, debounceMs, isIndexReady]);

  const toggleTag = useCallback((tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }, []);

  const clearTags = useCallback(() => setSelectedTags([]), []);

  const clearSearch = useCallback(() => {
    setQuery('');
    setResults(null);
    setSelectedTags([]);
  }, []);

  return {
    query,
    setQuery,
    results,
    isSearching,
    isIndexReady,
    selectedTags,
    toggleTag,
    clearTags,
    allTags,
    clearSearch,
  };
}
