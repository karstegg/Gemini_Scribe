'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Copy, Check, FilePlus2 } from 'lucide-react';

type TranscriptionDisplayProps = {
  text: string;
  isStreaming: boolean;
  onTranscribeAnother: () => void;
};

export function TranscriptionDisplay({ text, isStreaming, onTranscribeAnother }: TranscriptionDisplayProps) {
  const [hasCopied, setHasCopied] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

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
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Transcription</CardTitle>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleCopy} disabled={isStreaming}>
            {hasCopied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
            {hasCopied ? 'Copied!' : 'Copy'}
          </Button>
          <Button variant="default" size="sm" onClick={onTranscribeAnother} disabled={isStreaming}>
            <FilePlus2 className="mr-2 h-4 w-4" />
            Transcribe Another
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div
          ref={scrollRef}
          className="prose prose-invert max-w-none h-96 overflow-y-auto rounded-md border bg-background/50 p-4 whitespace-pre-wrap font-mono text-sm"
        >
          {text}
          {isStreaming && <span className="inline-block w-2 h-4 bg-primary animate-ping ml-1" />}
        </div>
      </CardContent>
    </Card>
  );
}
