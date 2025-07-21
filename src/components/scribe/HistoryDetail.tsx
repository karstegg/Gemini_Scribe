'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { HistoryItem } from '@/types';

type HistoryDetailProps = {
  item: HistoryItem;
};

export function HistoryDetail({ item }: HistoryDetailProps) {
  const [showCorrected, setShowCorrected] = useState(true);

  const transcriptionToShow = showCorrected && item.correctedTranscription 
    ? item.correctedTranscription 
    : item.transcription;

  return (
    <div className="grid md:grid-cols-3 gap-6">
      <div className="md:col-span-2">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>{item.fileName}</CardTitle>
                <CardDescription>
                  Transcribed on {item.createdAt?.toDate().toLocaleString() ?? 'N/A'}
                </CardDescription>
              </div>
              {item.correctedTranscription && (
                <div className="flex gap-2">
                  <Button variant={!showCorrected ? 'default' : 'outline'} size="sm" onClick={() => setShowCorrected(false)}>Original</Button>
                  <Button variant={showCorrected ? 'default' : 'outline'} size="sm" onClick={() => setShowCorrected(true)}>Final Version</Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="prose prose-invert max-w-none h-[60vh] overflow-y-auto rounded-md border bg-background/50 p-4 whitespace-pre-wrap font-mono text-sm">
              {transcriptionToShow}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        {item.summary && (
          <Card>
            <CardHeader><CardTitle>AI Summary</CardTitle></CardHeader>
            <CardContent><p className="text-sm text-muted-foreground">{item.summary}</p></CardContent>
          </Card>
        )}
        {item.changelog && (
          <Card>
            <CardHeader><CardTitle>AI Review Changelog</CardTitle></CardHeader>
            <CardContent>
              <div className="prose prose-invert max-w-none text-sm text-muted-foreground whitespace-pre-wrap">
                {item.changelog}
              </div>
            </CardContent>
          </Card>
        )}
        <Card>
          <CardHeader><CardTitle>Transcription Settings</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p><strong>Model:</strong> <Badge variant="secondary">{item.options.model}</Badge></p>
            <p><strong>Subject:</strong> {item.options.subject}</p>
            <div className="flex flex-wrap gap-2">
              {item.options.speakerLabels && <Badge>Speaker Labels</Badge>}
              {item.options.addTimestamps && <Badge>Timestamps</Badge>}
              {item.options.generateSummary && <Badge>Summary</Badge>}
              {item.options.review && <Badge>AI Review</Badge>}
            </div>
             {item.options.referenceFiles && item.options.referenceFiles.length > 0 && (
                <div>
                    <strong>Reference Files:</strong>
                    <ul className="list-disc list-inside mt-1">
                        {item.options.referenceFiles.map(f => <li key={f.name}>{f.name}</li>)}
                    </ul>
                </div>
            )}
            <div>
              <strong>Instructions:</strong>
              <p className="text-muted-foreground mt-1 text-xs font-mono p-2 bg-muted rounded-md">{item.options.transcriptionInstructions || "None"}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
