import type { Timestamp } from 'firebase/firestore';

export type View = 'transcribe' | 'history' | 'history_detail';

export type Status = 'idle' | 'processing' | 'success' | 'error';

export type ProcessingStatus = 'uploading' | 'transcribing' | 'saving' | 'reviewing' | 'summarizing';

export type TranscriptionOptions = {
  model: 'gemini-2.0-flash-lite' | 'gemini-2.5-flash' | 'gemini-2.5-pro';
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
  fileStoragePath: string;
  createdAt: Timestamp;
  transcription: string;
  correctedTranscription?: string | null;
  summary?: string | null;
  changelog?: string | null;
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

export type ProcessingLog = {
  message: string;
  status: 'pending' | 'in_progress' | 'done' | 'error';
  timestamp: Date;
  progress?: number;
};
