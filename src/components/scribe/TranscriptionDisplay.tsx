'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Copy, Check, FilePlus2, Loader2, CheckCircle2 } from 'lucide-react';
import type { ProcessingLog } from '@/types';

type TranscriptionDisplayProps = {
  text: string;
  isStreaming: boolean;
  onTranscribeAnother: () => void;
  logs: ProcessingLog[];
};

export function TranscriptionDisplay({ text, isStreaming, onTranscribeAnother, logs }: TranscriptionDisplayProps) {
  const [hasCopied, setHasCopied] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const backgroundLogs = logs.filter(log => ['reviewing', 'summarizing', 'saving'].some(l => log.message.toLowerCase().includes(l)));
  const isProcessingBackground = isStreaming || backgroundLogs.some(l => l.status === 'in_progress');

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [text]);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2000);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-row items-center justify-between">
            <CardTitle>Transcription Result</CardTitle>
            <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleCopy} disabled={isProcessingBackground || !text}>
                {hasCopied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                {hasCopied ? 'Copied!' : 'Copy'}
            </Button>
            <Button variant="default" size="sm" onClick={onTranscribeAnother} disabled={isProcessingBackground}>
                <FilePlus2 className="mr-2 h-4 w-4" />
                Transcribe Another
            </Button>
            </div>
        </div>
        <CardDescription>
            {isProcessingBackground ? "Finalizing results in the background..." : "Processing complete. You can now close this window."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          ref={scrollRef}
          className="prose prose-invert max-w-none h-96 overflow-y-auto rounded-md border bg-background/50 p-4 whitespace-pre-wrap font-mono text-sm"
        >
          {text}
          {isStreaming && <span className="inline-block w-2 h-4 bg-primary animate-ping ml-1" />}
        </div>
         <div className="space-y-2 text-sm text-muted-foreground">
            {backgroundLogs.map((log, index) => (
                <div key={index} className="flex items-center gap-2">
                    {log.status === 'in_progress' && <Loader2 className="h-4 w-4 animate-spin" />}
                    {log.status === 'done' && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                    <span>{log.message}</span>
                </div>
            ))}
        </div>
      </CardContent>
    </Card>
  );
}
