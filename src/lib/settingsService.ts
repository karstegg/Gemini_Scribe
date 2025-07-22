'use client';

import type { GlobalSettings, ReviewSettings } from '@/types';

const SETTINGS_KEY = 'geminiScribeSettings';

export const defaultReviewSettings: ReviewSettings = {
  correctSpelling: true,
  analyzeDiarization: false,
  customReviewPrompt: '',
};

export const defaultSettings: GlobalSettings = {
  standardTranscriptionInstructions: '',
  reviewSettings: defaultReviewSettings,
};

export const getSettings = (): GlobalSettings => {
  if (typeof window === 'undefined') {
    return defaultSettings;
  }
  try {
    const savedSettings = localStorage.getItem(SETTINGS_KEY);
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      // Merge with defaults to ensure all keys are present
      return {
        ...defaultSettings,
        ...parsed,
        reviewSettings: {
          ...defaultReviewSettings,
          ...parsed.reviewSettings,
        },
      };
    }
  } catch (error) {
    console.error('Failed to parse settings from localStorage', error);
  }
  return defaultSettings;
};

export const saveSettings = (settings: GlobalSettings) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Failed to save settings to localStorage', error);
  }
};
