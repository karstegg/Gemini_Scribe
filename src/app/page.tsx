'use client';

import { useState, useEffect, useRef } from 'react';
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
import { AlertCircle, Bot, Zap, Clock, Save } from 'lucide-react';

import { streamTranscription } from '@/ai/flows/transcribe-audio';
import { reviewAndCorrectTranscription } from '@/ai/flows/review-and-correct-transcription';
import { summarizeTranscription } from '@/ai/flows/summarize-transcription';

import { authenticateUser, isFirebaseConfigured } from '@/lib/firebase';
import { addHistoryItemToFirestore, deleteHistoryItemFromFirestore } from '@/lib/firestoreService';
import { getSettings } from '@/lib/settingsService';
import { useHistory } from '@/hooks/useHistory';
import { fileToBase64 } from '@/lib/utils';
import type { View, Status, TranscriptionOptions, HistoryItem, ProcessingLog } from '@/types';

const formSchema = z.object({
  subject: z.string().min(1, 'Subject is required.'),
  model: z.enum(['gemini-2.0-flash-lite', 'gemini-2.5-flash', 'gemini-2.5-pro']),
  transcriptionInstructions: z.string().optional(),
  speakerLabels: z.boolean(),
  addTimestamps: z.boolean(),
  generateSummary: z.boolean(),
  review: z.boolean(),
  referenceFiles: z.array(z.instanceof(File)),
});

function useStreamedText(
  stream: ReadableStream<Uint8Array> | null,
  onStreamEnd: () => void
) {
  const [text, setText] = useState('');
  const streamStartedRef = useRef(false);

  useEffect(() => {
    if (!stream || streamStartedRef.current) return;
    streamStartedRef.current = true;

    const abortController = new AbortController();
    const reader = stream.getReader();
    const decoder = new TextDecoder();

    const read = async () => {
      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done || abortController.signal.aborted) {
            break;
          }
          const chunk = decoder.decode(value, { stream: true });
          setText((prev) => prev + chunk);
        }
      } catch (error) {
        if (!abortController.signal.aborted) {
          console.error('Stream reading failed:', error);
        }
      } finally {
        onStreamEnd();
        reader.releaseLock();
      }
    };

    read();

    return () => {
      abortController.abort();
    };
  }, [stream, onStreamEnd]);

  return text;
}


function StreamingTranscription({
  stream,
  onTranscribeAnother,
}: {
  stream: ReadableStream<string> | null;
  onTranscribeAnother: () => void;
}) {
  const [isStreaming, setIsStreaming] = useState(true);
  const transcription = useStreamedText(stream, () => setIsStreaming(false));

  return (
    <TranscriptionDisplay
      text={transcription}
      isStreaming={isStreaming}
      onTranscribeAnother={onTranscribeAnother}
    />
  );
}

export default function ScribePage() {
  const [view, setView] = useState<View>('transcribe');
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  const [file, setFile] = useState<File | null>(null);
  const [transcriptionStream, setTranscriptionStream] =
    useState<ReadableStream<string> | null>(null);

  const isCancelledRef = useRef(false);

  const [selectedHistoryItem, setSelectedHistoryItem] =
    useState<HistoryItem | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const {
    history,
    loading: historyLoading,
    error: historyError,
  } = useHistory(user);

  const form = useForm<TranscriptionOptions>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      model: 'gemini-2.0-flash-lite',
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
      setError(
        'Firebase is not configured. History and transcription features will be unavailable.'
      );
      setIsAuthReady(true);
    }
  }, []);

  const resetTranscriptionState = () => {
    setFile(null);
    setTranscriptionStream(null);
    setStatus('idle');
    setError(null);
    isCancelledRef.current = true;
    form.reset({
      model: 'gemini-2.0-flash-lite',
      subject: '',
      transcriptionInstructions: '',
      speakerLabels: true,
      addTimestamps: false,
      generateSummary: true,
      review: true,
      referenceFiles: [],
    });
  };

  const handleTranscribe = async (options: TranscriptionOptions) => {
    if (!file) return;
    isCancelledRef.current = false;
    setStatus('processing');
    setError(null);

    try {
      const audioDataUri = await fileToBase64(file);
      if (isCancelledRef.current) return;

      let finalInstructions = options.transcriptionInstructions || '';
      const globalSettings = getSettings();
      if (globalSettings.standardTranscriptionInstructions) {
        finalInstructions = `${globalSettings.standardTranscriptionInstructions}\n\n${finalInstructions}`;
      }
      if (options.speakerLabels) {
        finalInstructions +=
          '\nPlease identify and label different speakers (e.g., Speaker 1, Speaker 2).';
      }
      if (options.addTimestamps) {
        finalInstructions +=
          '\nPlease include timestamps for key sections or speaker changes.';
      }

      const stream = await streamTranscription({
        audioDataUri,
        model: options.model,
        subject: options.subject,
        transcriptionInstructions: finalInstructions,
        speakerLabels: options.speakerLabels,
        addTimestamps: options.addTimestamps,
        generateSummary: options.generateSummary,
        review: options.review,
        referenceFiles: [],
      });

      if (isCancelledRef.current) return;

      const [streamForUi, streamForSaving] = stream.tee();

      setTranscriptionStream(streamForUi);
      setStatus('success');

      // Post-streaming tasks run in the background
      const processInBackground = async () => {
        let fullTranscription = '';
        const reader = streamForSaving.getReader();
        const decoder = new TextDecoder();
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          fullTranscription += decoder.decode(value);
        }

        if (isCancelledRef.current) return;

        let correctedTranscription: string | undefined;
        let changelog: string | undefined;
        let summary: string | undefined;

        if (options.review) {
          const reviewSettings = getSettings().reviewSettings;
          const reviewResult = await reviewAndCorrectTranscription({
            transcription: fullTranscription,
            reviewSettings,
          });
          if (isCancelledRef.current) return;
          correctedTranscription = reviewResult.correctedTranscription;
          changelog = reviewResult.changelog;
        }

        const textForSummary = correctedTranscription || fullTranscription;
        if (options.generateSummary) {
          const summaryResult = await summarizeTranscription({
            transcription: textForSummary,
          });
          if (isCancelledRef.current) return;
          summary = summaryResult.summary;
        }

        const historyPayload: any = {
          fileName: file.name,
          transcription: fullTranscription,
          options: {
            ...options,
            referenceFiles: options.referenceFiles.map((f) => ({
              name: f.name,
              size: f.size,
            })),
          },
        };

        if (correctedTranscription)
          historyPayload.correctedTranscription = correctedTranscription;
        if (summary) historyPayload.summary = summary;
        if (changelog) historyPayload.changelog = changelog;

        if (isCancelledRef.current) return;
        await addHistoryItemToFirestore(user, historyPayload);
        if (isCancelledRef.current) return;
      };

      processInBackground().catch((e) => {
        // Don't update UI if cancelled, just log the error
        if (isCancelledRef.current) {
          console.error('Error in background processing after cancellation:', e);
          return;
        }
        console.error('Background processing failed:', e);
        setError(e.message || 'An error occurred while saving the transcription.');
        // We don't set status to error here because the user has already received the stream
      });
    } catch (e: any) {
      if (isCancelledRef.current) return;
      console.error(e);
      let errorMessage =
        e.message || 'An unknown error occurred during transcription.';
      if (errorMessage.includes('503') || errorMessage.includes('overloaded')) {
        errorMessage =
          'The AI service is currently busy or overloaded. Please try again in a few moments.';
      }
      if (errorMessage.includes('429')) {
        errorMessage =
          "You've exceeded the rate limit for the AI model. Please try again later.";
      }
      setError(errorMessage);
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
      console.error('Failed to delete item:', e);
      setError(e.message || 'Failed to delete item.');
    }
  };
  
  const TranscribeView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center min-h-[calc(100vh-120px)]">
      <div className="space-y-6">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tighter">
          Smarter Audio Transcription with AI
        </h1>
        <p className="text-lg text-muted-foreground">
          Just upload your audio, and let Gemini Scribe handle the rest. Get accurate, fast, and organized transcriptions with speaker labels, summaries, and more.
        </p>
        <ul className="space-y-4">
          <li className="flex items-center gap-3">
            <Zap className="h-6 w-6 text-primary" />
            <span className="font-medium">Fast & Accurate Transcription</span>
          </li>
          <li className="flex items-center gap-3">
            <Clock className="h-6 w-6 text-primary" />
            <span className="font-medium">AI-Powered Summaries & Review</span>
          </li>
          <li className="flex items-center gap-3">
            <Save className="h-6 w-6 text-primary" />
            <span className="font-medium">Securely Saved History</span>
          </li>
        </ul>
      </div>
      <div>
        <Card className="w-full max-w-lg mx-auto">
          <CardHeader>
            <CardTitle>New Transcription</CardTitle>
            <CardDescription>
              Upload an audio file and configure the options below.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <FileUpload file={file} setFile={setFile} />
            {file && (
              <FormProvider {...form}>
                <TranscriptionOptionsForm />
              </FormProvider>
            )}
          </CardContent>
          {file && (
            <CardFooter>
              <Button
                onClick={form.handleSubmit(handleTranscribe)}
                className="w-full"
                size="lg"
              >
                <Bot className="mr-2 h-5 w-5" />
                Start Transcription
              </Button>
            </CardFooter>
          )}
        </Card>
      </div>
    </div>
  );


  const renderContent = () => {
    switch (view) {
      case 'history':
        return (
          <HistoryList
            history={history}
            loading={!isAuthReady || historyLoading}
            error={
              historyError ||
              (isAuthReady && !user ? 'Could not authenticate user.' : null)
            }
            onViewDetail={(item) => {
              setSelectedHistoryItem(item);
              setView('history_detail');
            }}
            onDeleteItem={handleDeleteHistoryItem}
          />
        );
      case 'history_detail':
        return selectedHistoryItem ? (
          <HistoryDetail
            item={selectedHistoryItem}
            onBack={() => setView('history')}
          />
        ) : (
          <p>No item selected.</p>
        );

      case 'transcribe':
      default:
        switch (status) {
          case 'processing':
            return (
              <Loader
                logs={[
                  {
                    message: 'Starting transcription stream...',
                    status: 'in_progress',
                    timestamp: new Date(),
                  },
                ]}
                onCancel={resetTranscriptionState}
              />
            );
          case 'success':
            return transcriptionStream ? (
              <StreamingTranscription
                stream={transcriptionStream}
                onTranscribeAnother={() => window.location.reload()}
              />
            ) : (
              <p>Starting stream...</p>
            );
          case 'error':
            return (
              <Card className="w-full max-w-lg mx-auto">
                <CardHeader>
                  <CardTitle>An Error Occurred</CardTitle>
                </CardHeader>
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
            return <TranscribeView />;
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
      <main className="flex-grow p-4 md:p-8">{renderContent()}</main>
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
}
