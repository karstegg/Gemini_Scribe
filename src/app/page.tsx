'use client';

import { useState, useEffect, useRef } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { User } from 'firebase/auth';
import type { UploadTask } from 'firebase/storage';

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

import { streamTranscriptionFromStorage } from '@/ai/flows/transcribe-from-storage';
import { reviewAndCorrectTranscription } from '@/ai/flows/review-and-correct-transcription';
import { summarizeTranscription } from '@/ai/flows/summarize-transcription';

import { authenticateUser } from '@/lib/firebase';
import { addHistoryItemToFirestore, deleteHistoryItemFromFirestore } from '@/lib/firestoreService';
import { uploadFileToStorage } from '@/lib/storageService';
import { getSettings } from '@/lib/settingsService';
import { useHistory } from '@/hooks/useHistory';
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

export default function ScribePage() {
  const [view, setView] = useState<View>('transcribe');
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  const [file, setFile] = useState<File | null>(null);
  const [transcriptionText, setTranscriptionText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [processingLogs, setProcessingLogs] = useState<ProcessingLog[]>([]);

  const isCancelledRef = useRef(false);
  const uploadTaskRef = useRef<UploadTask | null>(null);

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
    authenticateUser()
      .then(setUser)
      .catch((err) => {
        console.error(err);
        setError("Authentication failed. Couldn't connect to our services.");
      })
      .finally(() => setIsAuthReady(true));
  }, []);

  const addLog = (message: string, status: ProcessingLog['status'], progress?: number) => {
    setProcessingLogs(prevLogs => {
      const newLog: ProcessingLog = { message, status, timestamp: new Date(), progress };
      const existingLogIndex = prevLogs.findIndex(log => log.message.startsWith(message.split('...')[0]));
      
      if (existingLogIndex !== -1) {
        const updatedLogs = [...prevLogs];
        updatedLogs[existingLogIndex] = newLog;
        return updatedLogs;
      } else {
        return [...prevLogs, newLog];
      }
    });
  };

  const resetTranscriptionState = () => {
    isCancelledRef.current = true;
    if (uploadTaskRef.current) {
        uploadTaskRef.current.cancel();
        uploadTaskRef.current = null;
    }
    setFile(null);
    setTranscriptionText('');
    setIsStreaming(false);
    setStatus('idle');
    setError(null);
    setProcessingLogs([]);
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

  const processInBackground = async (
    fullTranscription: string,
    options: TranscriptionOptions,
    fileStoragePath: string,
    originalFile: File
  ) => {
    let correctedTranscription: string | undefined;
    let changelog: string | undefined;
    let summary: string | undefined;

    try {
      if (options.review) {
        addLog('AI reviewing transcription...', 'in_progress');
        const reviewSettings = getSettings().reviewSettings;
        const reviewResult = await reviewAndCorrectTranscription({
          transcription: fullTranscription,
          reviewSettings,
        });
        if (isCancelledRef.current) return;
        correctedTranscription = reviewResult.correctedTranscription;
        changelog = reviewResult.changelog;
        addLog('AI reviewing transcription...', 'done');
      }

      const textForSummary = correctedTranscription || fullTranscription;
      if (options.generateSummary) {
        addLog('Generating summary...', 'in_progress');
        const summaryResult = await summarizeTranscription({
          transcription: textForSummary,
        });
        if (isCancelledRef.current) return;
        summary = summaryResult.summary;
        addLog('Generating summary...', 'done');
      }
      
      addLog('Saving to history...', 'in_progress');
      // Construct a clean payload object, independent of the form state
      const historyPayload: Omit<HistoryItem, 'id' | 'createdAt'> = {
        fileName: originalFile.name,
        fileStoragePath: fileStoragePath,
        transcription: fullTranscription,
        correctedTranscription: correctedTranscription,
        summary: summary,
        changelog: changelog,
        options: {
          model: options.model,
          subject: options.subject,
          transcriptionInstructions: options.transcriptionInstructions,
          speakerLabels: options.speakerLabels,
          addTimestamps: options.addTimestamps,
          generateSummary: options.generateSummary,
          review: options.review,
          referenceFiles: options.referenceFiles.map((f) => ({
            name: f.name,
            size: f.size,
          })),
        },
      };

      if (isCancelledRef.current) return;
      await addHistoryItemToFirestore(historyPayload);
      addLog('Saving to history...', 'done');

    } catch (e: any) {
       if (isCancelledRef.current) {
          console.error('Error in background processing after cancellation:', e);
          return;
        }
        console.error('Background processing failed:', e);
        setError(e.message || 'An error occurred while saving the transcription.');
    }
  };

  const readStream = async (
    stream: ReadableStream<string>, 
    options: TranscriptionOptions, 
    fullPath: string, 
    originalFile: File
  ) => {
    let fullTranscription = '';
    const reader = stream.getReader();
    const decoder = new TextDecoder();

    try {
      while (true) {
        if (isCancelledRef.current) {
          await reader.cancel();
          break;
        }
        const { value, done } = await reader.read();
        if (done) {
          break;
        }
        const chunk = decoder.decode(value, { stream: true });
        fullTranscription += chunk;
        setTranscriptionText((prev) => prev + chunk);
      }
    } catch (streamError) {
      if (!isCancelledRef.current) {
        console.error("Error reading from stream:", streamError);
        setError("An error occurred while reading the transcription stream.");
        setStatus('error');
      }
    } finally {
        setIsStreaming(false);
        if (!isCancelledRef.current) {
           processInBackground(fullTranscription, options, fullPath, originalFile);
        }
    }
  };

  const handleTranscribe = async (options: TranscriptionOptions) => {
    if (!file || !user) return;

    isCancelledRef.current = false;
    setStatus('processing');
    setError(null);
    setTranscriptionText('');
    setProcessingLogs([]);

    try {
      // 1. Upload to Firebase Storage
      addLog('Uploading audio file...', 'in_progress', 0);
      const { task, fullPath } = uploadFileToStorage(file, user, (progress) => {
        if (!isCancelledRef.current) {
          addLog('Uploading audio file...', 'in_progress', progress);
        }
      });
      uploadTaskRef.current = task;
      await task;
      uploadTaskRef.current = null;
      if (isCancelledRef.current) return;
      addLog('Uploading audio file...', 'done', 100);

      // 2. Start transcription stream from storage
      addLog('Starting transcription...', 'in_progress');
      let finalInstructions = options.transcriptionInstructions || '';
      const globalSettings = getSettings();
      if (globalSettings.standardTranscriptionInstructions) {
        finalInstructions = `${globalSettings.standardTranscriptionInstructions}\n\n${finalInstructions}`;
      }
      if (options.speakerLabels) {
        finalInstructions += '\nPlease identify and label different speakers (e.g., Speaker 1, Speaker 2).';
      }
      if (options.addTimestamps) {
        finalInstructions += '\nPlease include timestamps for key sections or speaker changes.';
      }

      const stream = await streamTranscriptionFromStorage({
        fileStoragePath: fullPath,
        model: options.model,
        subject: options.subject,
        transcriptionInstructions: finalInstructions,
      });

      if (isCancelledRef.current) return;
      
      addLog('Starting transcription...', 'done');
      setStatus('success');
      setIsStreaming(true);

      // Start reading the stream without blocking the component
      readStream(stream, options, fullPath, file);

    } catch (e: any) {
      if (isCancelledRef.current) return;
      console.error(e);
      let errorMessage = e.message || 'An unknown error occurred during transcription.';
       if (errorMessage.includes('storage/canceled')) {
        errorMessage = 'File upload was canceled.';
      } else if (errorMessage.includes('storage/unauthorized')) {
        errorMessage = 'You do not have permission to upload files. Please check your storage security rules.';
      } else if (errorMessage.includes('503') || errorMessage.includes('overloaded') || errorMessage.includes('resource-exhausted')) {
        errorMessage = 'The AI service is currently busy or overloaded. Please try again in a few moments.';
      } else if (errorMessage.includes('429')) {
        errorMessage = "You've exceeded the rate limit for the AI model. Please try again later.";
      } else if (errorMessage.includes('API limits') && errorMessage.includes('file size')) {
        errorMessage = "The uploaded file exceeds the AI model's size limit. Please try a smaller file."
      }
      setError(errorMessage);
      setStatus('error');
      addLog('An error occurred', 'error');
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
              {isAuthReady && user ? 'Upload an audio file and configure the options below.' : 'Connecting to services...'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <FileUpload file={file} setFile={setFile} disabled={status === 'processing' || isStreaming || !isAuthReady || !user} />
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
                disabled={status === 'processing' || isStreaming || !isAuthReady || !user}
              >
                <Bot className="mr-2 h-5 w-5" />
                {status === 'processing' || isStreaming ? 'Processing...' : 'Start Transcription'}
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
                logs={processingLogs}
                onCancel={resetTranscriptionState}
              />
            );
          case 'success':
            return (
              <TranscriptionDisplay
                text={transcriptionText}
                isStreaming={isStreaming}
                onTranscribeAnother={resetTranscriptionState}
                logs={processingLogs}
              />
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
