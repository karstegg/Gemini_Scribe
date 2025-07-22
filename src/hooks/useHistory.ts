'use client';

import { useState, useEffect } from 'react';
import type { User } from 'firebase/auth';
import { listenToHistory } from '@/lib/firestoreService';
import type { HistoryItem } from '@/types';

export const useHistory = (user: User | null) => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setLoading(true);
      const unsubscribe = listenToHistory(
        user,
        (newHistory) => {
          setHistory(newHistory);
          setLoading(false);
          setError(null);
        },
        (err) => {
          console.error(err);
          setError("Failed to load transcription history.");
          setLoading(false);
        }
      );

      // Make sure unsubscribe is a function before calling it.
      if (typeof unsubscribe === 'function') {
        return () => unsubscribe();
      }
    } else {
        setHistory([]);
        setLoading(false);
    }
  }, [user]);

  return { history, loading, error };
};
