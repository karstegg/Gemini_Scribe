import type { Timestamp } from 'firebase/firestore';

export type View = 'transcribe' | 'history' | 'history_detail';

export type Status = 'idle' | 'processing' | 'success' | 'error';

export type TranscriptionOptions = {
  model: 'gemini-1.5-flash-latest' | 'gemini-1.5-pro-latest';
  subject: string;
  transcriptionInstructions: string;
  speakerLabels: boolean;
  addTimestamps: boolean;
  generateSummary: boolean;
  review: boolean;
  referenceFiles: File[];
};

export type HistoryItem = {
  id: string;
  fileName: string;
  createdAt: Timestamp;
  transcription: string;
  correctedTranscription?: string;
  summary?: string;
  changelog?: string;
  options: Omit<TranscriptionOptions, 'referenceFiles'> & {
    referenceFiles: { name: string; size: number }[];
  };
};

export type ReviewSettings = {
  correctSpelling: boolean;
  analyzeDiarization: boolean;
  customReviewPrompt: string;
};

export type GlobalSettings = {
  standardTranscriptionInstructions: string;
  reviewSettings: ReviewSettings;
};
