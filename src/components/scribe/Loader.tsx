import { Loader2, CheckCircle2, XCircle, CircleDashed } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ProcessingLog } from '@/types';
import { cn } from '@/lib/utils';

type LoaderProps = {
  logs: ProcessingLog[];
};

const statusIcons = {
  pending: <CircleDashed className="h-5 w-5 text-muted-foreground" />,
  in_progress: <Loader2 className="h-5 w-5 animate-spin text-primary" />,
  done: <CheckCircle2 className="h-5 w-5 text-green-500" />,
  error: <XCircle className="h-5 w-5 text-destructive" />,
};

export function Loader({ logs }: LoaderProps) {
  const hasError = logs.some(log => log.status === 'error');

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Processing Transcription</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <ul className="space-y-3 rounded-lg border bg-background/50 p-4">
            {logs.map((log, index) => (
              <li key={index} className="flex items-start gap-4 text-sm">
                <div className="flex-shrink-0 pt-0.5">{statusIcons[log.status]}</div>
                <div className="flex-grow">
                  <p
                    className={cn(
                      'font-medium',
                      log.status === 'pending' && 'text-muted-foreground',
                      log.status === 'error' && 'text-destructive'
                    )}
                  >
                    {log.message}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {log.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </li>
            ))}
          </ul>
          {hasError && (
             <p className="text-sm text-center text-destructive">
               An error occurred. See details in the log above.
             </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
