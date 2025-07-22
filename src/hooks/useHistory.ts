'use client';

import { useState, useEffect } from 'react';
import type { User } from 'firebase/auth';
import { listenToHistory } from '@/lib/firestoreService';
import { isFirebaseConfigured } from '@/lib/firebase';
import type { HistoryItem } from '@/types';

export const useHistory = (user: User | null) => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isFirebaseConfigured()) {
        setError("Firebase is not configured. Please check your environment variables.");
        setLoading(false);
        return;
    }

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

      return () => unsubscribe();
    } else {
        setHistory([]);
        setLoading(false);
    }
  }, [user]);

  return { history, loading, error };
};
