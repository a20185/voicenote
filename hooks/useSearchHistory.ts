import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'voicenote-search-history';
const MAX_HISTORY = 10;

export function useSearchHistory() {
  const [history, setHistory] = useState<string[]>([]);

  // Load history on mount
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((data) => {
      if (data) {
        try {
          setHistory(JSON.parse(data));
        } catch {
          // ignore
        }
      }
    });
  }, []);

  const persist = useCallback((items: string[]) => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, []);

  const addToHistory = useCallback((query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    setHistory((prev) => {
      const filtered = prev.filter((item) => item !== trimmed);
      const next = [trimmed, ...filtered].slice(0, MAX_HISTORY);
      persist(next);
      return next;
    });
  }, [persist]);

  const removeFromHistory = useCallback((query: string) => {
    setHistory((prev) => {
      const next = prev.filter((item) => item !== query);
      persist(next);
      return next;
    });
  }, [persist]);

  const clearHistory = useCallback(() => {
    setHistory([]);
    AsyncStorage.removeItem(STORAGE_KEY);
  }, []);

  return { history, addToHistory, removeFromHistory, clearHistory };
}
