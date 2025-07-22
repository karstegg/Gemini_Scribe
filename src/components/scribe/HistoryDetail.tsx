'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Download, Loader2 } from 'lucide-react';
import type { HistoryItem } from '@/types';
import { getDownloadUrlAction } from '@/app/actions/get-download-url';
import { useToast } from '@/hooks/use-toast';

type HistoryDetailProps = {
  item: HistoryItem;
  onBack: () => void;
};

export function HistoryDetail({ item, onBack }: HistoryDetailProps) {
  const [showCorrected, setShowCorrected] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const { toast } = useToast();

  const transcriptionToShow = showCorrected && item.correctedTranscription 
    ? item.correctedTranscription 
    : item.transcription;
  
  const handleDownload = async () => {
    setIsDownloading(true);
    try {
        const url = await getDownloadUrlAction(item.fileStoragePath);
        const a = document.createElement('a');
        a.href = url;
        a.target = "_blank";
        a.download = item.fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    } catch(e: any) {
        console.error("Failed to get download URL", e);
        toast({
            variant: "destructive",
            title: "Download Failed",
            description: e.message || "Could not get the file download link."
        })
    } finally {
        setIsDownloading(false);
    }
  }

  return (
    <div className="grid md:grid-cols-3 gap-6">
      <div className="md:col-span-2">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start gap-4">
              <div className="flex items-center gap-4">
                 <Button variant="outline" size="icon" onClick={onBack}>
                    <ArrowLeft className="h-4 w-4" />
                    <span className="sr-only">Back</span>
                  </Button>
                <div>
                  <CardTitle>{item.fileName}</CardTitle>
                  <CardDescription>
                    Transcribed on {item.createdAt?.toDate().toLocaleString() ?? 'N/A'}
                  </CardDescription>
                </div>
              </div>
              {item.correctedTranscription && (
                <div className="flex gap-2 flex-shrink-0">
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
        <Card>
            <CardHeader>
                <CardTitle>Original File</CardTitle>
            </CardHeader>
            <CardContent>
                <Button onClick={handleDownload} variant="outline" className='w-full' disabled={isDownloading}>
                    {isDownloading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Download className="mr-2 h-4 w-4" />
                    )}
                    {isDownloading ? 'Preparing...' : `Download ${item.fileName}`}
                </Button>
            </CardContent>
        </Card>
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
            <div className='flex items-center gap-2'>
              <strong>Model:</strong> <Badge variant="secondary">{item.options.model}</Badge>
            </div>
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
