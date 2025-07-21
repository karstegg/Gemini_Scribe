'use client';

import { useState, useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { User } from 'firebase/auth';

import { Header } from '@/components/scribe/Header';
import { FileUpload } from '@/components/scribe/FileUpload';
import { TranscriptionOptionsForm } from '@/components/scribe/TranscriptionOptions';
import { Loader } from '@/components/scribe/Loader';
import { TranscriptionDisplay } from '@/components/scribe/TranscriptionDisplay';
import { HistoryList } from '@/components/scribe/HistoryList';
import { HistoryDetail } from '@/components/scribe/HistoryDetail';
import { SettingsModal } from '@/components/scribe/SettingsModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Bot } from 'lucide-react';

import { transcribeAudio } from '@/ai/flows/transcribe-audio';
import { reviewAndCorrectTranscription } from '@/ai/flows/review-and-correct-transcription';
import { summarizeTranscription } from '@/ai/flows/summarize-transcription';

import { authenticateUser, isFirebaseConfigured } from '@/lib/firebase';
import { addHistoryItemToFirestore, deleteHistoryItemFromFirestore } from '@/lib/firestoreService';
import { getSettings } from '@/lib/settingsService';
import { useHistory } from '@/hooks/useHistory';
import { fileToBase64 } from '@/lib/utils';
import type { View, Status, TranscriptionOptions, HistoryItem } from '@/types';

const formSchema = z.object({
  subject: z.string().min(1, 'Subject is required.'),
  model: z.enum(['gemini-1.5-flash-latest', 'gemini-1.5-pro-latest']),
  transcriptionInstructions: z.string().optional(),
  speakerLabels: z.boolean(),
  addTimestamps: z.boolean(),
  generateSummary: z.boolean(),
  review: z.boolean(),
  referenceFiles: z.array(z.instanceof(File)),
});

export default function ScribePage() {
  const [view, setView] = useState<View>('transcribe');
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  const [file, setFile] = useState<File | null>(null);
  const [transcription, setTranscription] = useState('');
  const [loaderMessage, setLoaderMessage] = useState('');
  const [loaderProgress, setLoaderProgress] = useState(0);

  const [selectedHistoryItem, setSelectedHistoryItem] = useState<HistoryItem | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const { history, loading: historyLoading, error: historyError } = useHistory(user);

  const form = useForm<TranscriptionOptions>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      model: 'gemini-1.5-flash-latest',
      subject: '',
      transcriptionInstructions: '',
      speakerLabels: true,
      addTimestamps: false,
      generateSummary: true,
      review: true,
      referenceFiles: [],
    },
  });

  useEffect(() => {
    if (isFirebaseConfigured()) {
      authenticateUser()
        .then(setUser)
        .catch((err) => {
          console.error(err);
          setError("Authentication failed. Couldn't connect to our services.");
        })
        .finally(() => setIsAuthReady(true));
    } else {
      setError("Firebase is not configured. History and transcription features will be unavailable.");
      setIsAuthReady(true);
    }
  }, []);

  const resetTranscriptionState = () => {
    setFile(null);
    setTranscription('');
    setStatus('idle');
    setError(null);
    form.reset();
  };

  const handleTranscribe = async (options: TranscriptionOptions) => {
    if (!file) return;
    setStatus('processing');
    setError(null);

    try {
      setLoaderMessage('Preparing audio...');
      setLoaderProgress(10);
      const audioDataUri = await fileToBase64(file);
      
      let finalInstructions = options.transcriptionInstructions || '';
      const globalSettings = getSettings();
      if(globalSettings.standardTranscriptionInstructions) {
        finalInstructions = `${globalSettings.standardTranscriptionInstructions}\n\n${finalInstructions}`;
      }
      if (options.speakerLabels) {
        finalInstructions += '\nPlease identify and label different speakers (e.g., Speaker 1, Speaker 2).';
      }
      if (options.addTimestamps) {
        finalInstructions += '\nPlease include timestamps for key sections or speaker changes.';
      }

      setLoaderMessage('Transcribing...');
      setLoaderProgress(30);

      const { transcription: initialTranscription } = await transcribeAudio({
        audioDataUri,
        model: options.model,
        subject: options.subject,
        transcriptionInstructions: finalInstructions,
        speakerLabels: options.speakerLabels,
        addTimestamps: options.addTimestamps,
        generateSummary: options.generateSummary,
        review: options.review,
        referenceFiles: [], // Content is added to prompt, not passed as files
      });
      
      setTranscription(initialTranscription);
      let correctedTranscription: string | undefined;
      let changelog: string | undefined;
      let summary: string | undefined;

      if (options.review) {
        setLoaderMessage('Reviewing transcription...');
        setLoaderProgress(60);
        const reviewSettings = getSettings().reviewSettings;
        const reviewResult = await reviewAndCorrectTranscription({
          transcription: initialTranscription,
          reviewSettings,
        });
        correctedTranscription = reviewResult.correctedTranscription;
        changelog = reviewResult.changelog;
      }
      
      const textForSummary = correctedTranscription || initialTranscription;
      if (options.generateSummary) {
        setLoaderMessage('Generating summary...');
        setLoaderProgress(80);
        const summaryResult = await summarizeTranscription({ transcription: textForSummary });
        summary = summaryResult.summary;
      }

      setLoaderMessage('Saving to history...');
      setLoaderProgress(90);

      const historyPayload = {
        fileName: file.name,
        transcription: initialTranscription,
        correctedTranscription,
        summary,
        changelog,
        options: {
          ...options,
          referenceFiles: options.referenceFiles.map(f => ({ name: f.name, size: f.size })),
        },
      };

      await addHistoryItemToFirestore(historyPayload);

      setLoaderProgress(100);
      setTranscription(correctedTranscription || initialTranscription);
      setStatus('success');

    } catch (e: any) {
      console.error(e);
      setError(e.message || 'An unknown error occurred during transcription.');
      setStatus('error');
    }
  };
  
  const handleDeleteHistoryItem = async (id: string) => {
    try {
      await deleteHistoryItemFromFirestore(id);
      if (selectedHistoryItem?.id === id) {
        setView('history');
        setSelectedHistoryItem(null);
      }
    } catch (e: any) {
      console.error("Failed to delete item:", e);
      setError(e.message || "Failed to delete item.");
    }
  };

  const renderContent = () => {
    switch (view) {
      case 'history':
        return <HistoryList 
                  history={history} 
                  loading={!isAuthReady || historyLoading}
                  error={historyError || (isAuthReady && !user ? "Could not authenticate user." : null)}
                  onViewDetail={(item) => {
                    setSelectedHistoryItem(item);
                    setView('history_detail');
                  }}
                  onDeleteItem={handleDeleteHistoryItem}
                />;
      case 'history_detail':
        return selectedHistoryItem ? <HistoryDetail item={selectedHistoryItem} /> : <p>No item selected.</p>;
      
      case 'transcribe':
      default:
        switch (status) {
          case 'processing':
            return <Loader message={loaderMessage} progress={loaderProgress} />;
          case 'success':
            return <TranscriptionDisplay text={transcription} isStreaming={false} onTranscribeAnother={resetTranscriptionState} />;
          case 'error':
            return (
              <Card className="w-full max-w-lg mx-auto">
                <CardHeader><CardTitle>An Error Occurred</CardTitle></CardHeader>
                <CardContent>
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Transcription Failed</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                </CardContent>
                <CardFooter>
                  <Button onClick={resetTranscriptionState}>Try Again</Button>
                </CardFooter>
              </Card>
            );
          case 'idle':
          default:
            return (
              <Card className="w-full max-w-2xl mx-auto">
                <CardHeader>
                  <CardTitle>New Transcription</CardTitle>
                  <CardDescription>Upload an audio file and configure the options below.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FileUpload file={file} setFile={setFile} />
                  {file && <FormProvider {...form}><TranscriptionOptionsForm /></FormProvider>}
                </CardContent>
                {file && (
                  <CardFooter>
                    <Button onClick={form.handleSubmit(handleTranscribe)} className="w-full" size="lg">
                      <Bot className="mr-2 h-5 w-5" />
                      Start Transcription
                    </Button>
                  </CardFooter>
                )}
              </Card>
            );
        }
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header 
        view={view} 
        onShowHistory={() => setView('history')} 
        onShowNewTranscription={() => {
          resetTranscriptionState();
          setView('transcribe');
        }}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />
      <main className="flex-grow p-4 md:p-8">
        {renderContent()}
      </main>
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
}
